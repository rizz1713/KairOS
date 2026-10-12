# KAIROS: Kernel-Aware Intelligent Resource Orchestration System

## 1. System Overview
**KAIROS** is an enterprise-grade, decoupled operating systems analytics and simulation platform. Built with a high-performance **FastAPI** backend and a **React + Vite + Tailwind CSS** frontend, it captures live system telemetry via asynchronous loops and combines classical operating system algorithms with a machine learning recommendation engine.

Rather than attempting to replace the host operating system's kernel scheduler or memory manager, KAIROS acts as an analytical advisory and simulation layer. It monitors live workloads, simulates scheduling heuristics, detects deadlock conditions using the Banker's Algorithm, and generates workload-aware scheduling recommendations using a trained Random Forest model.

---

## 2. Core Pillars & Capabilities

### Pillar 1: Real-Time Process & System Telemetry (with Interactive Controls)
- **Telemetry Ingestion**: Continuous monitoring of CPU utilization, logical core distribution, clock frequency, context switches, interrupts, RAM usage, swap space, disk read/write throughput, and network packet rates via `psutil`.
- **Process Inspection**: Tabular inspection of running processes with PID, executable name, status, CPU %, memory %, resident set size (MB), threads, and priority class.
- **Kernel Process Management**: Interactive process management controls directly from the UI:
  - `SIGTERM` Safe Termination
  - `SIGKILL` Forceful Process Termination
  - Priority Class Adjustment (Renice: `IDLE`, `BELOW_NORMAL`, `NORMAL`, `ABOVE_NORMAL`, `HIGH`, `REALTIME`)

### Pillar 2: Core Classical OS Algorithm Simulation
- **CPU Scheduling Engine**: Implements and benchmarks:
  - First-Come, First-Served (FCFS)
  - Shortest Job First (SJF - Non-Preemptive)
  - Shortest Remaining Time First (SRTF - Preemptive SJF)
  - Round Robin (RR - Configurable time quantum)
  - Priority Scheduling (Preemptive & Non-Preemptive)
- **Visual Analytics**: Interactive timeline Gantt charts, per-process calculations (Completion Time, Turnaround Time $TAT = CT - AT$, Waiting Time $WT = TAT - BT$, Response Time $RT$), and multi-algorithm comparative performance matrix.
- **Queue Source**: Run custom synthetic queues or import the active host machine workload directly into the simulation.
- **Deadlock Detection Module (Banker's Algorithm)**:
  - Formulates Available vector, Allocation matrix, Max claim matrix, and dynamic Need matrix ($Need = Max - Allocation$).
  - Executes Safety Algorithm to determine whether system state is `SAFE` (generating safe sequence e.g. `P1 -> P3 -> P4 -> P0 -> P2`) or `DEADLOCK RISK`.
  - Resource-Request Algorithm: Evaluates real-time process requests, granting requests if safe and blocking processes if allocation would trigger deadlock susceptibility.

### Pillar 3: ML-Driven CPU Scheduling Advisor (Random Forest Classifier)
- **Objective**: Recommends optimal CPU scheduling algorithm based on current workload characteristics.
- **Input Features**:
  1. `process_count`: Total active processes in system ready queue
  2. `avg_burst_time`: Mean expected CPU burst execution duration (ms)
  3. `burst_variance`: Variance across process bursts (heterogeneity metric)
  4. `cpu_utilization`: Instantaneous CPU core load percentage
  5. `avg_priority`: Mean task priority weight distribution
- **Model**: `RandomForestClassifier` trained with multi-class output (`FCFS`, `SJF`, `Round Robin`, `Priority`).
- **Explainability**: Outputs feature importance weights, class probability confidence metrics, and analytical justifications based on OS principles (e.g. recommending SJF under high burst variance to prevent the convoy effect, or Round Robin under high contention to maintain fair responsiveness).

### Pillar 4: Real-Time Decoupled Interactive Dashboard (SPA)
- High-throughput WebSocket data streaming (`/ws/telemetry`) updating metrics without layout re-renders.
- Professional dark-mode design system with monospace metrics, clean typography, responsive panels, and zero emojis.
- Recharts visualizations for hardware load timelines and I/O throughput.

---

## 3. Database Schema (SQLite + SQLAlchemy)
Telemetry and recommendations are persisted locally in `backend/data/kairos.db`:

- `process_history`: `id`, `pid`, `process_name`, `cpu_usage`, `memory_usage`, `priority`, `status`, `timestamp`
- `cpu_history`: `id`, `cpu_usage`, `process_count`, `timestamp`
- `memory_history`: `id`, `memory_usage`, `available_memory`, `timestamp`
- `predictions`: `id`, `prediction_type`, `predicted_value`, `model_name`, `confidence`, `timestamp`
- `recommendations`: `id`, `recommendation_type`, `recommendation`, `reason`, `confidence`, `timestamp`

---

## 4. Project Directory Structure
```
kairos/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, REST routes, WebSocket manager
│   │   ├── database.py          # SQLAlchemy models and SQLite connection
│   │   ├── telemetry.py         # Hardware telemetry and process control via psutil
│   │   ├── scheduler_sim.py     # Classical CPU scheduling simulation algorithms
│   │   ├── banker_sim.py        # Banker's algorithm and deadlock avoidance
│   │   └── ml_advisor.py        # Random Forest scheduling recommendation engine
│   ├── data/
│   │   ├── kairos.db            # SQLite database file
│   │   └── scheduling_advisor_rf.joblib  # Trained model weights
│   ├── requirements.txt
│   └── run.py                   # Uvicorn entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── MetricCards.jsx
│   │   │   ├── TelemetryCharts.jsx
│   │   │   ├── ProcessTable.jsx
│   │   │   ├── SchedulerSimulator.jsx
│   │   │   ├── BankerSimulator.jsx
│   │   │   ├── MLAdvisor.jsx
│   │   │   └── HistoryLog.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── OS_CP.docx                   # Project reference specification document
├── start.bat                    # One-click launcher for Windows
└── README.md
```

---

## 5. Setup & Execution Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```bash
   python run.py
   ```
   The backend runs on `http://localhost:8000`. Swagger API docs are accessible at `http://localhost:8000/docs`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The dashboard runs on `http://localhost:5173`.

### One-Click Launch (Windows)
Double-click `start.bat` in the root project folder to launch both backend and frontend servers simultaneously.
