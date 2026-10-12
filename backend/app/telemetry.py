import time
import os
import psutil
from typing import Dict, List, Any, Optional

last_disk_io = None
last_disk_time = None
last_net_io = None
last_net_time = None

def get_system_metrics() -> Dict[str, Any]:
    global last_disk_io, last_disk_time, last_net_io, last_net_time
    now = time.time()
    
    # CPU
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_cores_percent = psutil.cpu_percent(interval=None, percpu=True)
    cpu_freq = psutil.cpu_freq()
    freq_data = {
        "current": round(cpu_freq.current, 2) if cpu_freq else 0.0,
        "min": round(cpu_freq.min, 2) if cpu_freq and cpu_freq.min else 0.0,
        "max": round(cpu_freq.max, 2) if cpu_freq and cpu_freq.max else 0.0,
    }
    
    cpu_count_logical = psutil.cpu_count(logical=True) or 1
    cpu_count_physical = psutil.cpu_count(logical=False) or 1
    
    # CPU stats
    cpu_stats = psutil.cpu_stats() if hasattr(psutil, "cpu_stats") else None
    ctx_switches = cpu_stats.ctx_switches if cpu_stats else 0
    interrupts = cpu_stats.interrupts if cpu_stats else 0
    
    # Memory
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    memory_data = {
        "total_gb": round(mem.total / (1024 ** 3), 2),
        "used_gb": round(mem.used / (1024 ** 3), 2),
        "available_gb": round(mem.available / (1024 ** 3), 2),
        "percent": mem.percent,
        "swap_total_gb": round(swap.total / (1024 ** 3), 2),
        "swap_used_gb": round(swap.used / (1024 ** 3), 2),
        "swap_percent": swap.percent
    }
    
    # Disk Usage
    try:
        disk_usage = psutil.disk_usage("C:\\" if os.name == "nt" else "/")
        disk_total_gb = round(disk_usage.total / (1024 ** 3), 2)
        disk_used_gb = round(disk_usage.used / (1024 ** 3), 2)
        disk_free_gb = round(disk_usage.free / (1024 ** 3), 2)
        disk_percent = disk_usage.percent
    except Exception:
        disk_total_gb, disk_used_gb, disk_free_gb, disk_percent = 0, 0, 0, 0

    # Disk IO Speed
    disk_io = psutil.disk_io_counters()
    disk_read_kb_s = 0.0
    disk_write_kb_s = 0.0
    if disk_io and last_disk_io and last_disk_time:
        dt = max(now - last_disk_time, 0.001)
        disk_read_kb_s = round((disk_io.read_bytes - last_disk_io.read_bytes) / 1024 / dt, 2)
        disk_write_kb_s = round((disk_io.write_bytes - last_disk_io.write_bytes) / 1024 / dt, 2)
    last_disk_io = disk_io
    last_disk_time = now

    # Network IO Speed
    net_io = psutil.net_io_counters()
    net_sent_kb_s = 0.0
    net_recv_kb_s = 0.0
    if net_io and last_net_io and last_net_time:
        dt = max(now - last_net_time, 0.001)
        net_sent_kb_s = round((net_io.bytes_sent - last_net_io.bytes_sent) / 1024 / dt, 2)
        net_recv_kb_s = round((net_io.bytes_recv - last_net_io.bytes_recv) / 1024 / dt, 2)
    last_net_io = net_io
    last_net_time = now

    # Process counts
    pids = psutil.pids()
    total_processes = len(pids)

    return {
        "timestamp": now,
        "cpu": {
            "percent": cpu_percent,
            "cores": cpu_cores_percent,
            "physical_cores": cpu_count_physical,
            "logical_cores": cpu_count_logical,
            "frequency": freq_data,
            "ctx_switches": ctx_switches,
            "interrupts": interrupts
        },
        "memory": memory_data,
        "disk": {
            "total_gb": disk_total_gb,
            "used_gb": disk_used_gb,
            "free_gb": disk_free_gb,
            "percent": disk_percent,
            "read_kb_s": max(0.0, disk_read_kb_s),
            "write_kb_s": max(0.0, disk_write_kb_s),
        },
        "network": {
            "sent_kb_s": max(0.0, net_sent_kb_s),
            "recv_kb_s": max(0.0, net_recv_kb_s),
        },
        "process_count": total_processes
    }

def get_process_list(limit: int = 100, sort_by: str = "cpu_percent", order: str = "desc") -> List[Dict[str, Any]]:
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'status', 'cpu_percent', 'memory_percent', 'memory_info', 'num_threads', 'nice', 'create_time']):
        try:
            info = proc.info
            mem_info = info.get('memory_info')
            rss_mb = round(mem_info.rss / (1024 * 1024), 2) if mem_info else 0.0
            
            # Map nice to priority representation
            nice_val = info.get('nice')
            if nice_val is None:
                priority_label = "NORMAL"
            elif os.name == "nt":
                priority_map = {
                    psutil.IDLE_PRIORITY_CLASS: "IDLE",
                    psutil.BELOW_NORMAL_PRIORITY_CLASS: "BELOW_NORMAL",
                    psutil.NORMAL_PRIORITY_CLASS: "NORMAL",
                    psutil.ABOVE_NORMAL_PRIORITY_CLASS: "ABOVE_NORMAL",
                    psutil.HIGH_PRIORITY_CLASS: "HIGH",
                    psutil.REALTIME_PRIORITY_CLASS: "REALTIME"
                }
                priority_label = priority_map.get(nice_val, str(nice_val))
            else:
                priority_label = str(nice_val)

            processes.append({
                "pid": info.get('pid'),
                "name": info.get('name') or "Unknown",
                "status": info.get('status') or "unknown",
                "cpu_percent": round(info.get('cpu_percent') or 0.0, 1),
                "memory_percent": round(info.get('memory_percent') or 0.0, 2),
                "memory_mb": rss_mb,
                "num_threads": info.get('num_threads') or 1,
                "priority": priority_label,
                "nice_value": nice_val if isinstance(nice_val, (int, float)) else 0,
                "create_time": info.get('create_time') or 0
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    # Sorting
    reverse = (order.lower() == "desc")
    if sort_by in ["cpu_percent", "memory_percent", "memory_mb", "num_threads", "pid"]:
        processes.sort(key=lambda p: p.get(sort_by) or 0, reverse=reverse)
    elif sort_by == "name":
        processes.sort(key=lambda p: (p.get("name") or "").lower(), reverse=reverse)
    else:
        processes.sort(key=lambda p: p.get("cpu_percent") or 0, reverse=True)

    return processes[:limit]

def terminate_process(pid: int) -> Dict[str, Any]:
    try:
        proc = psutil.Process(pid)
        name = proc.name()
        proc.terminate()
        return {"success": True, "pid": pid, "name": name, "message": f"Process {name} (PID: {pid}) termination signal sent"}
    except psutil.NoSuchProcess:
        return {"success": False, "pid": pid, "error": f"Process {pid} no longer exists"}
    except psutil.AccessDenied:
        return {"success": False, "pid": pid, "error": f"Permission denied to terminate process {pid}. Elevated privileges required."}
    except Exception as e:
        return {"success": False, "pid": pid, "error": str(e)}

def kill_process(pid: int) -> Dict[str, Any]:
    try:
        proc = psutil.Process(pid)
        name = proc.name()
        proc.kill()
        return {"success": True, "pid": pid, "name": name, "message": f"Process {name} (PID: {pid}) forcibly killed"}
    except psutil.NoSuchProcess:
        return {"success": False, "pid": pid, "error": f"Process {pid} no longer exists"}
    except psutil.AccessDenied:
        return {"success": False, "pid": pid, "error": f"Permission denied to kill process {pid}. Elevated privileges required."}
    except Exception as e:
        return {"success": False, "pid": pid, "error": str(e)}

def renice_process(pid: int, priority_level: str) -> Dict[str, Any]:
    try:
        proc = psutil.Process(pid)
        name = proc.name()
        if os.name == "nt":
            p_map = {
                "IDLE": psutil.IDLE_PRIORITY_CLASS,
                "BELOW_NORMAL": psutil.BELOW_NORMAL_PRIORITY_CLASS,
                "NORMAL": psutil.NORMAL_PRIORITY_CLASS,
                "ABOVE_NORMAL": psutil.ABOVE_NORMAL_PRIORITY_CLASS,
                "HIGH": psutil.HIGH_PRIORITY_CLASS,
                "REALTIME": psutil.REALTIME_PRIORITY_CLASS
            }
            target_class = p_map.get(priority_level.upper(), psutil.NORMAL_PRIORITY_CLASS)
            proc.nice(target_class)
        else:
            p_map = {
                "IDLE": 19,
                "BELOW_NORMAL": 10,
                "NORMAL": 0,
                "ABOVE_NORMAL": -5,
                "HIGH": -10,
                "REALTIME": -19
            }
            target_val = p_map.get(priority_level.upper(), 0)
            proc.nice(target_val)
        return {"success": True, "pid": pid, "name": name, "priority": priority_level, "message": f"Process {name} priority adjusted to {priority_level}"}
    except psutil.NoSuchProcess:
        return {"success": False, "pid": pid, "error": f"Process {pid} no longer exists"}
    except psutil.AccessDenied:
        return {"success": False, "pid": pid, "error": f"Permission denied to adjust priority for process {pid}. Administrator rights needed."}
    except Exception as e:
        return {"success": False, "pid": pid, "error": str(e)}
