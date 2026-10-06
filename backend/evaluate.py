import pandas as pd
import numpy as np
from intelligence.detectors import RollingStatisticalDetector, IsolationForestDetector

def run_evaluation():
    # 1. Generate Synthetic Ground Truth Dataset
    np.random.seed(42)
    n_samples = 1000
    
    # Baseline normal data
    latencies = np.random.normal(loc=20.0, scale=5.0, size=n_samples)
    errors = np.zeros(n_samples)
    
    # Inject anomalies (Ground truth = True)
    labels = np.zeros(n_samples, dtype=bool)
    
    # Anomaly 1: Latency spike
    spike_idx = 300
    latencies[spike_idx:spike_idx+10] = np.random.normal(loc=150.0, scale=20.0, size=10)
    labels[spike_idx:spike_idx+10] = True
    
    # Anomaly 2: Error rate spike
    error_idx = 700
    errors[error_idx:error_idx+5] = np.random.uniform(0.5, 1.0, size=5)
    labels[error_idx:error_idx+5] = True
    
    df = pd.DataFrame({
        "latency": latencies,
        "error_rate": errors
    })
    
    results = []

    # 2. Evaluate Fixed-Threshold (Baseline)
    # Threshold: Latency > 100
    fixed_preds = df["latency"] > 100
    results.append(calculate_metrics("Fixed Threshold (>100ms)", labels, fixed_preds))

    # 3. Evaluate Rolling Statistical Detector
    stat_detector = RollingStatisticalDetector(window_size=20, threshold_multiplier=3.0)
    stat_preds = stat_detector.detect(df["latency"])
    results.append(calculate_metrics("Rolling Statistical (MAD)", labels, stat_preds))

    # 4. Evaluate Isolation Forest
    if_detector = IsolationForestDetector(contamination=0.015, random_seed=42)
    # Train on first 200 normal samples
    if_detector.fit(df.iloc[:200])
    if_preds = if_detector.detect(df)
    results.append(calculate_metrics("Isolation Forest (Multivariate)", labels, if_preds))

    # Print Report
    print("="*60)
    print("AEGIS Anomaly Detection Evaluation Report")
    print(f"Dataset: {n_samples} samples | Seed: 42")
    print("="*60)
    
    report_df = pd.DataFrame(results)
    print(report_df.to_string(index=False))
    print("="*60)
    
    report_df.to_csv("evaluation_results.csv", index=False)
    print("Saved to evaluation_results.csv")

def calculate_metrics(name, y_true, y_pred):
    tp = np.sum(y_true & y_pred)
    tn = np.sum(~y_true & ~y_pred)
    fp = np.sum(~y_true & y_pred)
    fn = np.sum(y_true & ~y_pred)
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    
    return {
        "Algorithm": name,
        "Precision": f"{precision:.2f}",
        "Recall": f"{recall:.2f}",
        "False Positive Rate": f"{fpr:.4f}"
    }

if __name__ == "__main__":
    run_evaluation()
