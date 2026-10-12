import os
import joblib
import numpy as np
import psutil
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import RandomForestClassifier

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_PATH = os.path.join(DATA_DIR, "scheduling_advisor_rf.joblib")

FEATURE_NAMES = [
    "process_count",
    "avg_burst_time",
    "burst_variance",
    "cpu_utilization",
    "avg_priority"
]

CLASSES = ["FCFS", "SJF", "Round Robin", "Priority"]

def generate_synthetic_training_data(n_samples: int = 3000) -> Tuple[np.ndarray, np.ndarray]:
    np.random.seed(42)
    X = []
    y = []

    for _ in range(n_samples):
        # 0: FCFS, 1: SJF, 2: Round Robin, 3: Priority
        mode = np.random.choice([0, 1, 2, 3])

        if mode == 0:  # FCFS: low process count, low burst variance, low-to-mid CPU utilization
            proc_count = np.random.randint(2, 15)
            avg_burst = np.random.uniform(5.0, 30.0)
            burst_var = np.random.uniform(1.0, 15.0)
            cpu_util = np.random.uniform(5.0, 45.0)
            avg_pri = np.random.uniform(1.8, 2.2) # near neutral priority
            target = 0

        elif mode == 1:  # SJF: high burst variance, mixed jobs, benefits from sorting short jobs first
            proc_count = np.random.randint(10, 50)
            avg_burst = np.random.uniform(15.0, 80.0)
            burst_var = np.random.uniform(40.0, 150.0)  # high variance
            cpu_util = np.random.uniform(30.0, 85.0)
            avg_pri = np.random.uniform(1.5, 2.5)
            target = 1

        elif mode == 2:  # Round Robin: high process count, interactive workload, balanced bursts, high contention
            proc_count = np.random.randint(35, 120)
            avg_burst = np.random.uniform(10.0, 50.0)
            burst_var = np.random.uniform(5.0, 35.0)  # moderate variance
            cpu_util = np.random.uniform(55.0, 98.0)  # high CPU pressure
            avg_pri = np.random.uniform(1.7, 2.3)
            target = 2

        else:  # Priority: high priority spread or skew, critical foreground tasks
            proc_count = np.random.randint(5, 60)
            avg_burst = np.random.uniform(10.0, 60.0)
            burst_var = np.random.uniform(10.0, 60.0)
            cpu_util = np.random.uniform(20.0, 90.0)
            avg_pri = np.random.choice([np.random.uniform(0.5, 1.4), np.random.uniform(2.6, 3.8)]) # skewed
            target = 3

        # Add minor noise
        proc_count = max(1, proc_count + np.random.randint(-2, 3))
        avg_burst = max(1.0, avg_burst + np.random.normal(0, 2))
        burst_var = max(0.5, burst_var + np.random.normal(0, 3))
        cpu_util = np.clip(cpu_util + np.random.normal(0, 3), 1.0, 100.0)
        avg_pri = np.clip(avg_pri + np.random.normal(0, 0.2), 0.1, 4.0)

        X.append([proc_count, avg_burst, burst_var, cpu_util, avg_pri])
        y.append(target)

    return np.array(X), np.array(y)

class SchedulingAdvisor:
    def __init__(self):
        self.model: RandomForestClassifier = None
        self.load_or_train()

    def train(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        X, y = generate_synthetic_training_data()
        clf = RandomForestClassifier(
            n_estimators=120,
            max_depth=12,
            random_state=42,
            class_weight="balanced"
        )
        clf.fit(X, y)
        self.model = clf
        joblib.dump(self.model, MODEL_PATH)

    def load_or_train(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
            except Exception:
                self.train()
        else:
            self.train()

    def get_feature_importance(self) -> List[Dict[str, Any]]:
        if not self.model:
            return []
        importances = self.model.feature_importances_
        return [
            {"feature": name, "importance": round(float(imp), 4), "percentage": round(float(imp) * 100, 2)}
            for name, imp in zip(FEATURE_NAMES, importances)
        ]

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        if not self.model:
            self.load_or_train()

        input_arr = np.array([[
            features.get("process_count", 10),
            features.get("avg_burst_time", 20.0),
            features.get("burst_variance", 15.0),
            features.get("cpu_utilization", 50.0),
            features.get("avg_priority", 2.0)
        ]])

        pred_idx = int(self.model.predict(input_arr)[0])
        probabilities = self.model.predict_proba(input_arr)[0]
        recommended_algo = CLASSES[pred_idx]
        confidence = float(probabilities[pred_idx])

        # Generate analytical justification based on operating system principles
        reason = self._generate_reasoning(recommended_algo, features, confidence)

        prob_breakdown = [
            {"algorithm": CLASSES[i], "probability": round(float(prob), 4), "percentage": round(float(prob) * 100, 2)}
            for i, prob in enumerate(probabilities)
        ]
        prob_breakdown.sort(key=lambda x: x["probability"], reverse=True)

        return {
            "recommended_algorithm": recommended_algo,
            "confidence": round(confidence, 4),
            "confidence_percentage": round(confidence * 100, 2),
            "reason": reason,
            "probabilities": prob_breakdown,
            "feature_importance": self.get_feature_importance(),
            "inputs": features
        }

    def _generate_reasoning(self, algo: str, f: Dict[str, float], conf: float) -> str:
        proc_cnt = f.get("process_count", 0)
        b_var = f.get("burst_variance", 0)
        cpu = f.get("cpu_utilization", 0)
        pri = f.get("avg_priority", 2.0)

        if algo == "SJF":
            return (
                f"SJF (Shortest Job First) is recommended with {round(conf*100, 1)}% confidence due to high burst variance "
                f"({round(b_var, 2)}). Executing shorter jobs first mitigates the convoy effect and mathematically minimizes "
                f"average waiting time across the active {int(proc_cnt)} processes."
            )
        elif algo == "Round Robin":
            return (
                f"Round Robin is recommended with {round(conf*100, 1)}% confidence under high concurrency ({int(proc_cnt)} processes) "
                f"and elevated CPU pressure ({round(cpu, 1)}%). Preemptive time-slicing ensures fair CPU distribution, low response latency, "
                f"and prevents process starvation."
            )
        elif algo == "Priority":
            return (
                f"Priority Scheduling is recommended with {round(conf*100, 1)}% confidence due to significant task priority skew "
                f"(average metric: {round(pri, 2)}). Urgent foreground and kernel tasks receive preferential CPU allocation to maintain system stability."
            )
        else:  # FCFS
            return (
                f"FCFS (First-Come, First-Served) is recommended with {round(conf*100, 1)}% confidence. The workload exhibits low concurrency "
                f"({int(proc_cnt)} processes) and uniform bursts ({round(b_var, 2)} variance). FCFS provides optimal throughput by eliminating "
                f"unnecessary context switching and preemption overhead."
            )

advisor_instance = SchedulingAdvisor()

def get_live_system_workload() -> Dict[str, float]:
    pids = psutil.pids()
    proc_count = len(pids)
    cpu_util = psutil.cpu_percent(interval=None)

    # Sample top 20 active processes for burst and priority characteristics
    burst_estimates = []
    priorities = []
    for proc in psutil.process_iter(['cpu_percent', 'nice', 'num_threads']):
        try:
            info = proc.info
            cpu_p = info.get('cpu_percent') or 0.0
            threads = info.get('num_threads') or 1
            nice = info.get('nice') or 0

            # Approximate burst duration proxy from thread count and recent cpu activity
            burst_est = max(2.0, (cpu_p * 0.8) + (threads * 1.5))
            burst_estimates.append(burst_est)

            # Standardize priority proxy
            if isinstance(nice, (int, float)):
                p_norm = 2.0 + (nice / 10.0)
            else:
                p_norm = 2.0
            priorities.append(p_norm)

            if len(burst_estimates) >= 30:
                break
        except Exception:
            continue

    if not burst_estimates:
        burst_estimates = [10.0]
    if not priorities:
        priorities = [2.0]

    avg_burst = float(np.mean(burst_estimates))
    burst_var = float(np.var(burst_estimates))
    avg_priority = float(np.mean(priorities))

    return {
        "process_count": float(proc_count),
        "avg_burst_time": round(avg_burst, 2),
        "burst_variance": round(burst_var, 2),
        "cpu_utilization": round(cpu_util, 2),
        "avg_priority": round(avg_priority, 2)
    }

def get_live_recommendation() -> Dict[str, Any]:
    workload = get_live_system_workload()
    return advisor_instance.predict(workload)
