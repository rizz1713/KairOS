from typing import List, Dict, Any, Optional
import copy

def calculate_need_matrix(max_matrix: List[List[int]], allocation_matrix: List[List[int]]) -> List[List[int]]:
    need = []
    for m_row, a_row in zip(max_matrix, allocation_matrix):
        need.append([m - a for m, a in zip(m_row, a_row)])
    return need

def check_safety(
    processes: List[str],
    resource_names: List[str],
    available: List[int],
    allocation: List[List[int]],
    max_matrix: List[List[int]]
) -> Dict[str, Any]:
    n = len(processes)
    m = len(resource_names)
    need = calculate_need_matrix(max_matrix, allocation)

    # Validation: Allocation cannot exceed Max, and resources cannot be negative
    for i in range(n):
        for j in range(m):
            if allocation[i][j] < 0 or max_matrix[i][j] < 0:
                return {
                    "is_safe": False,
                    "error": f"Process {processes[i]} has negative allocation or maximum values."
                }
            if allocation[i][j] > max_matrix[i][j]:
                return {
                    "is_safe": False,
                    "error": f"Process {processes[i]} allocation ({allocation[i][j]}) exceeds maximum demand ({max_matrix[i][j]}) for {resource_names[j]}."
                }

    work = copy.deepcopy(available)
    finish = [False] * n
    safe_sequence = []
    step_log = []

    step_log.append({
        "step": 0,
        "action": "Initialization",
        "description": f"Initial Available Resources: {dict(zip(resource_names, work))}",
        "work": copy.deepcopy(work),
        "finished_processes": []
    })

    iteration = 1
    while len(safe_sequence) < n:
        found = False
        for i in range(n):
            if not finish[i]:
                # Check if Need[i] <= Work
                can_allocate = all(need[i][j] <= work[j] for j in range(m))
                if can_allocate:
                    # Allocate and release
                    old_work = copy.deepcopy(work)
                    for j in range(m):
                        work[j] += allocation[i][j]
                    finish[i] = True
                    safe_sequence.append(processes[i])
                    found = True

                    step_log.append({
                        "step": iteration,
                        "process": processes[i],
                        "action": "Allocated & Released",
                        "description": (
                            f"{processes[i]} can execute: Need {dict(zip(resource_names, need[i]))} <= "
                            f"Work {dict(zip(resource_names, old_work))}. "
                            f"Released {dict(zip(resource_names, allocation[i]))} -> New Work: {dict(zip(resource_names, work))}"
                        ),
                        "need": need[i],
                        "allocated": allocation[i],
                        "work": copy.deepcopy(work),
                        "finished_processes": copy.deepcopy(safe_sequence)
                    })
                    iteration += 1
                    break

        if not found:
            # Deadlock risk / Unsafe state detected
            unfulfilled = [processes[i] for i in range(n) if not finish[i]]
            bottlenecks = []
            for i in range(n):
                if not finish[i]:
                    deficit = {}
                    for j in range(m):
                        if need[i][j] > work[j]:
                            deficit[resource_names[j]] = need[i][j] - work[j]
                    bottlenecks.append({
                        "process": processes[i],
                        "needed": need[i],
                        "shortage": deficit
                    })

            step_log.append({
                "step": iteration,
                "action": "Deadlock Detected",
                "description": f"No remaining process can satisfy its resource needs with available work vector. Deadlock potential among: {', '.join(unfulfilled)}",
                "work": copy.deepcopy(work),
                "unfulfilled": unfulfilled
            })

            return {
                "is_safe": False,
                "status": "DEADLOCK RISK",
                "status_code": "UNSAFE",
                "message": "System is in an UNSAFE state. A deadlock may occur if all processes claim their maximum resources.",
                "safe_sequence": None,
                "unfulfilled_processes": unfulfilled,
                "bottlenecks": bottlenecks,
                "available": available,
                "need": need,
                "steps": step_log
            }

    return {
        "is_safe": True,
        "status": "SAFE",
        "status_code": "SAFE",
        "message": f"System is in a SAFE state. Execution sequence guaranteeing no deadlock exists.",
        "safe_sequence": safe_sequence,
        "safe_sequence_string": " -> ".join(safe_sequence),
        "available": available,
        "need": need,
        "steps": step_log
    }

def request_resource(
    processes: List[str],
    resource_names: List[str],
    available: List[int],
    allocation: List[List[int]],
    max_matrix: List[List[int]],
    process_index: int,
    request_vector: List[int]
) -> Dict[str, Any]:
    m = len(resource_names)
    p_name = processes[process_index]
    need = calculate_need_matrix(max_matrix, allocation)

    # Condition 1: Request <= Need
    for j in range(m):
        if request_vector[j] > need[process_index][j]:
            return {
                "granted": False,
                "reason": f"Request exceeds declared maximum need for {resource_names[j]} ({request_vector[j]} > {need[process_index][j]}).",
                "status": "ERROR_EXCEEDED_MAX"
            }

    # Condition 2: Request <= Available
    for j in range(m):
        if request_vector[j] > available[j]:
            return {
                "granted": False,
                "reason": f"Insufficient available resources for {resource_names[j]} ({request_vector[j]} requested, {available[j]} available). Process must wait.",
                "status": "MUST_WAIT"
            }

    # Tentative allocation
    temp_avail = copy.deepcopy(available)
    temp_alloc = copy.deepcopy(allocation)

    for j in range(m):
        temp_avail[j] -= request_vector[j]
        temp_alloc[process_index][j] += request_vector[j]

    safety_result = check_safety(processes, resource_names, temp_avail, temp_alloc, max_matrix)

    if safety_result["is_safe"]:
        return {
            "granted": True,
            "status": "GRANTED_SAFE",
            "reason": f"Request granted. System transitions safely with sequence: {safety_result.get('safe_sequence_string')}",
            "new_available": temp_avail,
            "new_allocation": temp_alloc,
            "safety_result": safety_result
        }
    else:
        return {
            "granted": False,
            "status": "DENIED_UNSAFE",
            "reason": "Request denied. Granting this request would lead to an UNSAFE state with potential deadlock.",
            "safety_result": safety_result
        }

def get_default_presets() -> Dict[str, Any]:
    return {
        "textbook_safe": {
            "name": "Standard Safe State (3 Resources)",
            "processes": ["P0", "P1", "P2", "P3", "P4"],
            "resource_names": ["CPU", "Memory", "Disk"],
            "available": [3, 3, 2],
            "allocation": [
                [0, 1, 0],
                [2, 0, 0],
                [3, 0, 2],
                [2, 1, 1],
                [0, 0, 2]
            ],
            "max": [
                [7, 5, 3],
                [3, 2, 2],
                [9, 0, 2],
                [2, 2, 2],
                [4, 3, 3]
            ]
        },
        "deadlock_risk": {
            "name": "Deadlock Risk / Unsafe State",
            "processes": ["P0", "P1", "P2", "P3"],
            "resource_names": ["Core_0", "Core_1", "RAM_GB"],
            "available": [1, 0, 1],
            "allocation": [
                [2, 1, 1],
                [1, 2, 2],
                [3, 1, 1],
                [2, 2, 0]
            ],
            "max": [
                [4, 3, 2],
                [3, 4, 4],
                [5, 3, 2],
                [4, 4, 3]
            ]
        },
        "enterprise_workload": {
            "name": "Modern Multi-Resource Cluster (4 Resources)",
            "processes": ["Worker-A", "Worker-B", "Worker-C", "Worker-D", "Worker-E"],
            "resource_names": ["CPU_Cores", "RAM_GB", "NVMe_IOPS", "GPU_Units"],
            "available": [4, 6, 3, 2],
            "allocation": [
                [2, 2, 1, 0],
                [1, 3, 0, 1],
                [3, 1, 2, 1],
                [2, 4, 1, 0],
                [0, 2, 1, 1]
            ],
            "max": [
                [4, 5, 2, 1],
                [3, 6, 1, 2],
                [5, 4, 3, 1],
                [4, 7, 2, 1],
                [2, 3, 2, 2]
            ]
        }
    }
