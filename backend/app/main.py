import asyncio
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import (
    init_db, get_db, SessionLocal,
    ProcessHistory, CPUHistory, MemoryHistory, Prediction, Recommendation
)
from app.telemetry import (
    get_system_metrics, get_process_list,
    terminate_process, kill_process, renice_process
)
from app.scheduler_sim import (
    run_fcfs, run_sjf_non_preemptive, run_srtf,
    run_round_robin, run_priority_scheduling, compare_all_algorithms
)
from app.banker_sim import (
    check_safety, request_resource, get_default_presets
)
from app.ml_advisor import (
    advisor_instance, get_live_recommendation, get_live_system_workload
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("kairos")

app = FastAPI(
    title="KAIROS OS Telemetry & Analytics Platform",
    description="Kernel-Aware Intelligent Resource Orchestration System API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- WebSocket Connection Manager -----------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dc in dead_connections:
            self.disconnect(dc)

manager = ConnectionManager()

# Background telemetry broadcaster and database recorder
async def telemetry_background_loop():
    logger.info("Starting telemetry background daemon...")
    while True:
        try:
            metrics = get_system_metrics()
            
            # Save periodic sample to SQLite database
            db = SessionLocal()
            try:
                cpu_entry = CPUHistory(
                    cpu_usage=metrics["cpu"]["percent"],
                    process_count=metrics["process_count"],
                    timestamp=datetime.utcnow()
                )
                mem_entry = MemoryHistory(
                    memory_usage=metrics["memory"]["percent"],
                    available_memory=metrics["memory"]["available_gb"] * 1024,
                    timestamp=datetime.utcnow()
                )
                db.add(cpu_entry)
                db.add(mem_entry)
                db.commit()
            except Exception as dbe:
                db.rollback()
                logger.error(f"Error persisting telemetry to DB: {dbe}")
            finally:
                db.close()

            # Broadcast to WebSocket subscribers
            await manager.broadcast({
                "type": "telemetry_update",
                "data": metrics
            })
        except Exception as e:
            logger.error(f"Error in telemetry background task: {e}")
        
        await asyncio.sleep(1.0)

@app.on_event("startup")
async def startup_event():
    init_db()
    advisor_instance.load_or_train()
    asyncio.create_task(telemetry_background_loop())
    logger.info("KAIROS Backend service started successfully.")

# ----------------- Request / Response Models -----------------
class PriorityRequest(BaseModel):
    priority_level: str = Field(..., description="Target priority: IDLE, BELOW_NORMAL, NORMAL, ABOVE_NORMAL, HIGH, REALTIME")

class ProcessSimItem(BaseModel):
    pid: int
    name: Optional[str] = "P1"
    arrival_time: int = 0
    burst_time: int = 10
    priority: int = 1

class SchedulerSimRequest(BaseModel):
    algorithm: str = Field("ALL", description="FCFS, SJF, SRTF, RR, PRIORITY_NON, PRIORITY_PRE, ALL")
    quantum: Optional[int] = 2
    processes: List[ProcessSimItem]

class BankerSafetyRequest(BaseModel):
    processes: List[str]
    resource_names: List[str]
    available: List[int]
    allocation: List[List[int]]
    max: List[List[int]]

class BankerAllocationRequest(BaseModel):
    processes: List[str]
    resource_names: List[str]
    available: List[int]
    allocation: List[List[int]]
    max: List[List[int]]
    process_index: int
    request_vector: List[int]

class AdvisorCustomRequest(BaseModel):
    process_count: float = Field(..., ge=1)
    avg_burst_time: float = Field(..., ge=1.0)
    burst_variance: float = Field(..., ge=0.0)
    cpu_utilization: float = Field(..., ge=0.0, le=100.0)
    avg_priority: float = Field(2.0, ge=0.1, le=5.0)

# ----------------- REST Endpoints -----------------

@app.get("/")
def root():
    return {
        "system": "KAIROS",
        "description": "Kernel-Aware Intelligent Resource Orchestration System",
        "status": "ONLINE",
        "version": "1.0.0"
    }

@app.get("/api/system/overview")
def get_system_overview():
    return get_system_metrics()

@app.get("/api/processes")
def get_processes(
    limit: int = Query(50, ge=1, le=250),
    sort_by: str = Query("cpu_percent"),
    order: str = Query("desc"),
    search: Optional[str] = None
):
    procs = get_process_list(limit=250, sort_by=sort_by, order=order)
    if search:
        search_lower = search.lower()
        procs = [p for p in procs if search_lower in (p.get("name") or "").lower() or search_lower in str(p.get("pid"))]
    return {"total": len(procs), "processes": procs[:limit]}

@app.post("/api/processes/{pid}/terminate")
def terminate_proc(pid: int):
    result = terminate_process(pid)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@app.post("/api/processes/{pid}/kill")
def kill_proc(pid: int):
    result = kill_process(pid)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@app.post("/api/processes/{pid}/priority")
def adjust_proc_priority(pid: int, req: PriorityRequest):
    result = renice_process(pid, req.priority_level)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

# ----------------- Simulation Endpoints -----------------

@app.post("/api/simulation/scheduler")
def simulate_cpu_scheduling(req: SchedulerSimRequest):
    procs = [p.dict() for p in req.processes]
    if not procs:
        raise HTTPException(status_code=400, detail="Process list cannot be empty.")

    algo = req.algorithm.upper()
    quantum = req.quantum or 2

    if algo == "FCFS":
        return run_fcfs(procs)
    elif algo == "SJF":
        return run_sjf_non_preemptive(procs)
    elif algo == "SRTF":
        return run_srtf(procs)
    elif algo == "RR":
        return run_round_robin(procs, quantum=quantum)
    elif algo == "PRIORITY_NON":
        return run_priority_scheduling(procs, preemptive=False)
    elif algo == "PRIORITY_PRE":
        return run_priority_scheduling(procs, preemptive=True)
    elif algo == "ALL":
        return compare_all_algorithms(procs, quantum=quantum)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported algorithm: {req.algorithm}")

@app.get("/api/simulation/scheduler/live-queue")
def get_live_scheduler_queue(count: int = Query(6, ge=2, le=15)):
    procs = get_process_list(limit=count, sort_by="cpu_percent", order="desc")
    sim_queue = []
    for i, p in enumerate(procs):
        # Derive realistic simulation burst time & arrival time
        bt = max(2, int(round((p.get("cpu_percent") or 1.0) * 0.8 + 3)))
        sim_queue.append({
            "pid": p.get("pid"),
            "name": p.get("name"),
            "arrival_time": i * 2,
            "burst_time": bt,
            "priority": (i % 4) + 1
        })
    return {"processes": sim_queue}

@app.get("/api/simulation/banker/presets")
def get_banker_presets():
    return get_default_presets()

@app.post("/api/simulation/banker/safety")
def run_banker_safety(req: BankerSafetyRequest):
    return check_safety(
        processes=req.processes,
        resource_names=req.resource_names,
        available=req.available,
        allocation=req.allocation,
        max_matrix=req.max
    )

@app.post("/api/simulation/banker/request")
def run_banker_resource_request(req: BankerAllocationRequest):
    if req.process_index < 0 or req.process_index >= len(req.processes):
        raise HTTPException(status_code=400, detail="Invalid process_index.")
    return request_resource(
        processes=req.processes,
        resource_names=req.resource_names,
        available=req.available,
        allocation=req.allocation,
        max_matrix=req.max,
        process_index=req.process_index,
        request_vector=req.request_vector
    )

# ----------------- ML Advisor Endpoints -----------------

@app.get("/api/advisor/live")
def get_live_ml_recommendation(db: Session = Depends(get_db)):
    rec = get_live_recommendation()
    
    # Store recommendation in SQLite
    try:
        rec_entry = Recommendation(
            recommendation_type="CPU_SCHEDULING",
            recommendation=rec["recommended_algorithm"],
            reason=rec["reason"],
            confidence=rec["confidence"],
            timestamp=datetime.utcnow()
        )
        pred_entry = Prediction(
            prediction_type="ALGORITHM_CLASSIFICATION",
            predicted_value=rec["recommended_algorithm"],
            model_name="RandomForestClassifier",
            confidence=rec["confidence"],
            timestamp=datetime.utcnow()
        )
        db.add(rec_entry)
        db.add(pred_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save recommendation to DB: {e}")

    return rec

@app.post("/api/advisor/custom")
def get_custom_ml_recommendation(req: AdvisorCustomRequest):
    return advisor_instance.predict(req.dict())

@app.get("/api/advisor/model-info")
def get_advisor_model_info():
    return {
        "model_type": "RandomForestClassifier",
        "estimators": 120,
        "features": [
            {"name": "process_count", "description": "Total number of active processes in OS ready queue"},
            {"name": "avg_burst_time", "description": "Average expected CPU burst execution duration (ms)"},
            {"name": "burst_variance", "description": "Variance across process burst times (heterogeneity indicator)"},
            {"name": "cpu_utilization", "description": "Instantaneous CPU core load percentage (0-100%)"},
            {"name": "avg_priority", "description": "Mean priority weight distribution across active tasks"}
        ],
        "classes": ["FCFS", "SJF", "Round Robin", "Priority"],
        "feature_importances": advisor_instance.get_feature_importance()
    }

# ----------------- History Endpoints -----------------

@app.get("/api/history/metrics")
def get_metrics_history(limit: int = Query(60, ge=10, le=300), db: Session = Depends(get_db)):
    cpu_records = db.query(CPUHistory).order_by(CPUHistory.timestamp.desc()).limit(limit).all()
    mem_records = db.query(MemoryHistory).order_by(MemoryHistory.timestamp.desc()).limit(limit).all()

    cpu_data = [
        {"timestamp": r.timestamp.strftime("%H:%M:%S"), "cpu_usage": r.cpu_usage, "process_count": r.process_count}
        for r in reversed(cpu_records)
    ]
    mem_data = [
        {"timestamp": r.timestamp.strftime("%H:%M:%S"), "memory_usage": r.memory_usage, "available_mb": round(r.available_memory, 1)}
        for r in reversed(mem_records)
    ]

    return {
        "cpu": cpu_data,
        "memory": mem_data
    }

@app.get("/api/history/recommendations")
def get_recommendations_history(limit: int = Query(20, ge=5, le=100), db: Session = Depends(get_db)):
    records = db.query(Recommendation).order_by(Recommendation.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "recommendation_type": r.recommendation_type,
            "recommendation": r.recommendation,
            "reason": r.reason,
            "confidence": round(r.confidence, 4),
            "timestamp": r.timestamp.isoformat()
        }
        for r in records
    ]

# ----------------- WebSocket Route -----------------

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Immediately send current state on connect
        metrics = get_system_metrics()
        await websocket.send_json({"type": "initial_state", "data": metrics})
        
        while True:
            # Keep connection open and accept client messages (ping / commands)
            client_msg = await websocket.receive_text()
            try:
                msg_data = json.loads(client_msg)
                if msg_data.get("action") == "ping":
                    await websocket.send_json({"type": "pong", "time": datetime.utcnow().isoformat()})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
