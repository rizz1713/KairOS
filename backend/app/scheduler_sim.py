from typing import List, Dict, Any
import copy

def run_fcfs(processes: List[Dict[str, Any]]) -> Dict[str, Any]:
    procs = sorted(processes, key=lambda x: (x["arrival_time"], x["pid"]))
    current_time = 0
    gantt = []
    results = []
    events = []

    for p in procs:
        pid = p["pid"]
        name = p.get("name", f"P{pid}")
        at = p["arrival_time"]
        bt = p["burst_time"]
        priority = p.get("priority", 1)

        if current_time < at:
            idle_duration = at - current_time
            gantt.append({"pid": "IDLE", "name": "CPU Idle", "start": current_time, "end": at})
            events.append(f"Time {current_time} to {at}: CPU Idle waiting for incoming processes")
            current_time = at

        start_time = current_time
        current_time += bt
        end_time = current_time

        gantt.append({"pid": pid, "name": name, "start": start_time, "end": end_time})
        events.append(f"Time {start_time}: Process {name} (PID: {pid}) starts execution for {bt}ms")
        events.append(f"Time {end_time}: Process {name} completes execution")

        ct = end_time
        tat = ct - at
        wt = tat - bt
        rt = start_time - at

        results.append({
            "pid": pid,
            "name": name,
            "arrival_time": at,
            "burst_time": bt,
            "priority": priority,
            "completion_time": ct,
            "turnaround_time": tat,
            "waiting_time": wt,
            "response_time": rt
        })

    total_time = current_time if current_time > 0 else 1
    total_burst = sum(p["burst_time"] for p in processes)
    cpu_util = round((total_burst / total_time) * 100, 2)
    avg_wt = round(sum(r["waiting_time"] for r in results) / len(results), 2) if results else 0
    avg_tat = round(sum(r["turnaround_time"] for r in results) / len(results), 2) if results else 0
    throughput = round(len(results) / total_time, 4) if total_time > 0 else 0

    return {
        "algorithm": "FCFS",
        "description": "First-Come, First-Served: Non-preemptive scheduling based purely on arrival order.",
        "gantt": gantt,
        "results": results,
        "events": events,
        "metrics": {
            "avg_waiting_time": avg_wt,
            "avg_turnaround_time": avg_tat,
            "cpu_utilization": cpu_util,
            "throughput": throughput,
            "total_execution_time": total_time
        }
    }

def run_sjf_non_preemptive(processes: List[Dict[str, Any]]) -> Dict[str, Any]:
    remaining = [copy.deepcopy(p) for p in processes]
    current_time = 0
    completed = []
    gantt = []
    events = []

    while remaining:
        available = [p for p in remaining if p["arrival_time"] <= current_time]
        if not available:
            next_at = min(p["arrival_time"] for p in remaining)
            gantt.append({"pid": "IDLE", "name": "CPU Idle", "start": current_time, "end": next_at})
            events.append(f"Time {current_time} to {next_at}: CPU Idle")
            current_time = next_at
            continue

        # Pick shortest burst time
        available.sort(key=lambda x: (x["burst_time"], x["arrival_time"], x["pid"]))
        p = available[0]
        remaining.remove(p)

        pid = p["pid"]
        name = p.get("name", f"P{pid}")
        at = p["arrival_time"]
        bt = p["burst_time"]
        priority = p.get("priority", 1)

        start_time = current_time
        current_time += bt
        end_time = current_time

        gantt.append({"pid": pid, "name": name, "start": start_time, "end": end_time})
        events.append(f"Time {start_time}: Process {name} selected (shortest burst = {bt}ms)")
        events.append(f"Time {end_time}: Process {name} completed")

        ct = end_time
        tat = ct - at
        wt = tat - bt
        rt = start_time - at

        completed.append({
            "pid": pid,
            "name": name,
            "arrival_time": at,
            "burst_time": bt,
            "priority": priority,
            "completion_time": ct,
            "turnaround_time": tat,
            "waiting_time": wt,
            "response_time": rt
        })

    completed.sort(key=lambda x: x["pid"])
    total_time = current_time if current_time > 0 else 1
    total_burst = sum(p["burst_time"] for p in processes)
    cpu_util = round((total_burst / total_time) * 100, 2)
    avg_wt = round(sum(r["waiting_time"] for r in completed) / len(completed), 2) if completed else 0
    avg_tat = round(sum(r["turnaround_time"] for r in completed) / len(completed), 2) if completed else 0
    throughput = round(len(completed) / total_time, 4) if total_time > 0 else 0

    return {
        "algorithm": "SJF (Non-Preemptive)",
        "description": "Shortest Job First: Selects waiting process with smallest burst time without preemption.",
        "gantt": gantt,
        "results": completed,
        "events": events,
        "metrics": {
            "avg_waiting_time": avg_wt,
            "avg_turnaround_time": avg_tat,
            "cpu_utilization": cpu_util,
            "throughput": throughput,
            "total_execution_time": total_time
        }
    }

def run_srtf(processes: List[Dict[str, Any]]) -> Dict[str, Any]:
    # Preemptive SJF / Shortest Remaining Time First
    n = len(processes)
    proc_dict = {}
    for p in processes:
        proc_dict[p["pid"]] = {
            "pid": p["pid"],
            "name": p.get("name", f"P{p['pid']}"),
            "arrival_time": p["arrival_time"],
            "burst_time": p["burst_time"],
            "remaining_time": p["burst_time"],
            "priority": p.get("priority", 1),
            "first_response": -1,
            "completion_time": 0
        }

    current_time = 0
    completed_count = 0
    gantt_raw = []
    events = []
    last_pid = None

    while completed_count < n:
        available = [p for p in proc_dict.values() if p["arrival_time"] <= current_time and p["remaining_time"] > 0]
        if not available:
            # Check when next arrival happens
            future = [p for p in proc_dict.values() if p["remaining_time"] > 0]
            next_at = min(p["arrival_time"] for p in future)
            if gantt_raw and gantt_raw[-1]["pid"] == "IDLE":
                gantt_raw[-1]["end"] = next_at
            else:
                gantt_raw.append({"pid": "IDLE", "name": "CPU Idle", "start": current_time, "end": next_at})
            current_time = next_at
            continue

        # Smallest remaining time
        available.sort(key=lambda x: (x["remaining_time"], x["arrival_time"], x["pid"]))
        cur = available[0]
        cur_pid = cur["pid"]

        if cur["first_response"] == -1:
            cur["first_response"] = current_time

        if cur_pid != last_pid:
            events.append(f"Time {current_time}: Context switch -> Process {cur['name']} (remaining: {cur['remaining_time']}ms)")
            last_pid = cur_pid

        if gantt_raw and gantt_raw[-1]["pid"] == cur_pid:
            gantt_raw[-1]["end"] = current_time + 1
        else:
            gantt_raw.append({"pid": cur_pid, "name": cur["name"], "start": current_time, "end": current_time + 1})

        cur["remaining_time"] -= 1
        current_time += 1

        if cur["remaining_time"] == 0:
            cur["completion_time"] = current_time
            completed_count += 1
            events.append(f"Time {current_time}: Process {cur['name']} finished execution")

    results = []
    for pid in sorted(proc_dict.keys()):
        p = proc_dict[pid]
        at = p["arrival_time"]
        bt = p["burst_time"]
        ct = p["completion_time"]
        tat = ct - at
        wt = tat - bt
        rt = p["first_response"] - at
        results.append({
            "pid": pid,
            "name": p["name"],
            "arrival_time": at,
            "burst_time": bt,
            "priority": p["priority"],
            "completion_time": ct,
            "turnaround_time": tat,
            "waiting_time": wt,
            "response_time": rt
        })

    # Merge contiguous gantt blocks
    merged_gantt = []
    for block in gantt_raw:
        if merged_gantt and merged_gantt[-1]["pid"] == block["pid"]:
            merged_gantt[-1]["end"] = block["end"]
        else:
            merged_gantt.append(dict(block))

    total_time = current_time if current_time > 0 else 1
    total_burst = sum(p["burst_time"] for p in processes)
    cpu_util = round((total_burst / total_time) * 100, 2)
    avg_wt = round(sum(r["waiting_time"] for r in results) / len(results), 2) if results else 0
    avg_tat = round(sum(r["turnaround_time"] for r in results) / len(results), 2) if results else 0
    throughput = round(len(results) / total_time, 4) if total_time > 0 else 0

    return {
        "algorithm": "SRTF (Preemptive SJF)",
        "description": "Shortest Remaining Time First: Preempts executing process whenever a new job with shorter remaining time arrives.",
        "gantt": merged_gantt,
        "results": results,
        "events": events[:60],  # cap events for performance
        "metrics": {
            "avg_waiting_time": avg_wt,
            "avg_turnaround_time": avg_tat,
            "cpu_utilization": cpu_util,
            "throughput": throughput,
            "total_execution_time": total_time
        }
    }

def run_round_robin(processes: List[Dict[str, Any]], quantum: int = 2) -> Dict[str, Any]:
    if quantum <= 0:
        quantum = 2

    procs = sorted([copy.deepcopy(p) for p in processes], key=lambda x: (x["arrival_time"], x["pid"]))
    n = len(procs)
    rem_bt = {p["pid"]: p["burst_time"] for p in procs}
    meta = {p["pid"]: {
        "name": p.get("name", f"P{p['pid']}"),
        "arrival_time": p["arrival_time"],
        "burst_time": p["burst_time"],
        "priority": p.get("priority", 1),
        "first_response": -1,
        "completion_time": 0
    } for p in procs}

    current_time = 0
    ready_queue = []
    visited = set()
    gantt = []
    events = []
    completed = 0

    # Initialize queue with first arrival
    for p in procs:
        if p["arrival_time"] <= current_time:
            ready_queue.append(p["pid"])
            visited.add(p["pid"])

    while completed < n:
        if not ready_queue:
            # Check remaining
            future = [p for p in procs if rem_bt[p["pid"]] > 0 and p["pid"] not in visited]
            if future:
                next_at = min(p["arrival_time"] for p in future)
                gantt.append({"pid": "IDLE", "name": "CPU Idle", "start": current_time, "end": next_at})
                events.append(f"Time {current_time} to {next_at}: CPU Idle waiting for next arrival")
                current_time = next_at
                for p in procs:
                    if p["arrival_time"] <= current_time and p["pid"] not in visited and rem_bt[p["pid"]] > 0:
                        ready_queue.append(p["pid"])
                        visited.add(p["pid"])
                continue

        pid = ready_queue.pop(0)
        p_info = meta[pid]
        
        if p_info["first_response"] == -1:
            p_info["first_response"] = current_time

        slice_time = min(quantum, rem_bt[pid])
        start_time = current_time
        current_time += slice_time
        end_time = current_time
        rem_bt[pid] -= slice_time

        gantt.append({"pid": pid, "name": p_info["name"], "start": start_time, "end": end_time})
        events.append(f"Time {start_time}: Process {p_info['name']} allocated quantum slice ({slice_time}ms, remaining: {rem_bt[pid]}ms)")

        # Add newly arrived processes during this quantum
        for p in procs:
            if p["arrival_time"] <= current_time and p["pid"] not in visited and rem_bt[p["pid"]] > 0:
                ready_queue.append(p["pid"])
                visited.add(p["pid"])

        if rem_bt[pid] > 0:
            ready_queue.append(pid)
        else:
            p_info["completion_time"] = current_time
            completed += 1
            events.append(f"Time {current_time}: Process {p_info['name']} completed execution")

    results = []
    for p in procs:
        pid = p["pid"]
        info = meta[pid]
        at = info["arrival_time"]
        bt = info["burst_time"]
        ct = info["completion_time"]
        tat = ct - at
        wt = tat - bt
        rt = info["first_response"] - at
        results.append({
            "pid": pid,
            "name": info["name"],
            "arrival_time": at,
            "burst_time": bt,
            "priority": info["priority"],
            "completion_time": ct,
            "turnaround_time": tat,
            "waiting_time": wt,
            "response_time": rt
        })

    # Merge contiguous gantt segments
    merged_gantt = []
    for block in gantt:
        if merged_gantt and merged_gantt[-1]["pid"] == block["pid"]:
            merged_gantt[-1]["end"] = block["end"]
        else:
            merged_gantt.append(dict(block))

    total_time = current_time if current_time > 0 else 1
    total_burst = sum(p["burst_time"] for p in processes)
    cpu_util = round((total_burst / total_time) * 100, 2)
    avg_wt = round(sum(r["waiting_time"] for r in results) / len(results), 2) if results else 0
    avg_tat = round(sum(r["turnaround_time"] for r in results) / len(results), 2) if results else 0
    throughput = round(len(results) / total_time, 4) if total_time > 0 else 0

    return {
        "algorithm": f"Round Robin (Quantum={quantum})",
        "description": f"Preemptive time-sliced scheduling with fixed time slice quantum of {quantum}ms.",
        "quantum": quantum,
        "gantt": merged_gantt,
        "results": results,
        "events": events[:70],
        "metrics": {
            "avg_waiting_time": avg_wt,
            "avg_turnaround_time": avg_tat,
            "cpu_utilization": cpu_util,
            "throughput": throughput,
            "total_execution_time": total_time
        }
    }

def run_priority_scheduling(processes: List[Dict[str, Any]], preemptive: bool = False) -> Dict[str, Any]:
    # Lower numeric priority value = Higher priority (standard UNIX / POSIX convention)
    if not preemptive:
        remaining = [copy.deepcopy(p) for p in processes]
        current_time = 0
        completed = []
        gantt = []
        events = []

        while remaining:
            available = [p for p in remaining if p["arrival_time"] <= current_time]
            if not available:
                next_at = min(p["arrival_time"] for p in remaining)
                gantt.append({"pid": "IDLE", "name": "CPU Idle", "start": current_time, "end": next_at})
                events.append(f"Time {current_time} to {next_at}: CPU Idle")
                current_time = next_at
                continue

            available.sort(key=lambda x: (x.get("priority", 1), x["arrival_time"], x["pid"]))
            p = available[0]
            remaining.remove(p)

            pid = p["pid"]
            name = p.get("name", f"P{pid}")
            at = p["arrival_time"]
            bt = p["burst_time"]
            priority = p.get("priority", 1)

            start_time = current_time
            current_time += bt
            end_time = current_time

            gantt.append({"pid": pid, "name": name, "start": start_time, "end": end_time})
            events.append(f"Time {start_time}: Process {name} (Priority {priority}) begins execution")
            events.append(f"Time {end_time}: Process {name} completes execution")

            ct = end_time
            tat = ct - at
            wt = tat - bt
            rt = start_time - at

            completed.append({
                "pid": pid,
                "name": name,
                "arrival_time": at,
                "burst_time": bt,
                "priority": priority,
                "completion_time": ct,
                "turnaround_time": tat,
                "waiting_time": wt,
                "response_time": rt
            })

        completed.sort(key=lambda x: x["pid"])
        total_time = current_time if current_time > 0 else 1
        total_burst = sum(p["burst_time"] for p in processes)
        cpu_util = round((total_burst / total_time) * 100, 2)
        avg_wt = round(sum(r["waiting_time"] for r in completed) / len(completed), 2) if completed else 0
        avg_tat = round(sum(r["turnaround_time"] for r in completed) / len(completed), 2) if completed else 0
        throughput = round(len(completed) / total_time, 4) if total_time > 0 else 0

        return {
            "algorithm": "Priority (Non-Preemptive)",
            "description": "Non-preemptive priority scheduling (lower value indicates higher urgency).",
            "gantt": gantt,
            "results": completed,
            "events": events,
            "metrics": {
                "avg_waiting_time": avg_wt,
                "avg_turnaround_time": avg_tat,
                "cpu_utilization": cpu_util,
                "throughput": throughput,
                "total_execution_time": total_time
            }
        }
    else:
        # Preemptive priority
        n = len(processes)
        proc_dict = {}
        for p in processes:
            proc_dict[p["pid"]] = {
                "pid": p["pid"],
                "name": p.get("name", f"P{p['pid']}"),
                "arrival_time": p["arrival_time"],
                "burst_time": p["burst_time"],
                "remaining_time": p["burst_time"],
                "priority": p.get("priority", 1),
                "first_response": -1,
                "completion_time": 0
            }

        current_time = 0
        completed_count = 0
        gantt_raw = []
        events = []
        last_pid = None

        while completed_count < n:
            available = [p for p in proc_dict.values() if p["arrival_time"] <= current_time and p["remaining_time"] > 0]
            if not available:
                future = [p for p in proc_dict.values() if p["remaining_time"] > 0]
                next_at = min(p["arrival_time"] for p in future)
                if gantt_raw and gantt_raw[-1]["pid"] == "IDLE":
                    gantt_raw[-1]["end"] = next_at
                else:
                    gantt_raw.append({"pid": "IDLE", "name": "CPU Idle", "start": current_time, "end": next_at})
                current_time = next_at
                continue

            available.sort(key=lambda x: (x["priority"], x["arrival_time"], x["pid"]))
            cur = available[0]
            cur_pid = cur["pid"]

            if cur["first_response"] == -1:
                cur["first_response"] = current_time

            if cur_pid != last_pid:
                events.append(f"Time {current_time}: Process {cur['name']} (Priority {cur['priority']}) preempts CPU")
                last_pid = cur_pid

            if gantt_raw and gantt_raw[-1]["pid"] == cur_pid:
                gantt_raw[-1]["end"] = current_time + 1
            else:
                gantt_raw.append({"pid": cur_pid, "name": cur["name"], "start": current_time, "end": current_time + 1})

            cur["remaining_time"] -= 1
            current_time += 1

            if cur["remaining_time"] == 0:
                cur["completion_time"] = current_time
                completed_count += 1
                events.append(f"Time {current_time}: Process {cur['name']} finished execution")

        results = []
        for pid in sorted(proc_dict.keys()):
            p = proc_dict[pid]
            at = p["arrival_time"]
            bt = p["burst_time"]
            ct = p["completion_time"]
            tat = ct - at
            wt = tat - bt
            rt = p["first_response"] - at
            results.append({
                "pid": pid,
                "name": p["name"],
                "arrival_time": at,
                "burst_time": bt,
                "priority": p["priority"],
                "completion_time": ct,
                "turnaround_time": tat,
                "waiting_time": wt,
                "response_time": rt
            })

        merged_gantt = []
        for block in gantt_raw:
            if merged_gantt and merged_gantt[-1]["pid"] == block["pid"]:
                merged_gantt[-1]["end"] = block["end"]
            else:
                merged_gantt.append(dict(block))

        total_time = current_time if current_time > 0 else 1
        total_burst = sum(p["burst_time"] for p in processes)
        cpu_util = round((total_burst / total_time) * 100, 2)
        avg_wt = round(sum(r["waiting_time"] for r in results) / len(results), 2) if results else 0
        avg_tat = round(sum(r["turnaround_time"] for r in results) / len(results), 2) if results else 0
        throughput = round(len(results) / total_time, 4) if total_time > 0 else 0

        return {
            "algorithm": "Priority (Preemptive)",
            "description": "Preemptive priority scheduling where newly arrived higher priority jobs immediately preempt.",
            "gantt": merged_gantt,
            "results": results,
            "events": events[:60],
            "metrics": {
                "avg_waiting_time": avg_wt,
                "avg_turnaround_time": avg_tat,
                "cpu_utilization": cpu_util,
                "throughput": throughput,
                "total_execution_time": total_time
            }
        }

def compare_all_algorithms(processes: List[Dict[str, Any]], quantum: int = 2) -> Dict[str, Any]:
    fcfs = run_fcfs(processes)
    sjf = run_sjf_non_preemptive(processes)
    srtf = run_srtf(processes)
    rr = run_round_robin(processes, quantum=quantum)
    pri_non = run_priority_scheduling(processes, preemptive=False)
    pri_pre = run_priority_scheduling(processes, preemptive=True)

    comparison = [
        {"algorithm": "FCFS", **fcfs["metrics"]},
        {"algorithm": "SJF (Non-Preemptive)", **sjf["metrics"]},
        {"algorithm": "SRTF (Preemptive)", **srtf["metrics"]},
        {"algorithm": f"Round Robin (Q={quantum})", **rr["metrics"]},
        {"algorithm": "Priority (Non-Preemptive)", **pri_non["metrics"]},
        {"algorithm": "Priority (Preemptive)", **pri_pre["metrics"]},
    ]

    # Find best waiting time and best turnaround time
    best_wt = min(comparison, key=lambda x: x["avg_waiting_time"])
    best_tat = min(comparison, key=lambda x: x["avg_turnaround_time"])

    return {
        "runs": {
            "FCFS": fcfs,
            "SJF": sjf,
            "SRTF": srtf,
            "RR": rr,
            "PRIORITY_NON": pri_non,
            "PRIORITY_PRE": pri_pre
        },
        "comparison": comparison,
        "recommendation": {
            "lowest_waiting_time": best_wt["algorithm"],
            "lowest_turnaround_time": best_tat["algorithm"]
        }
    }
