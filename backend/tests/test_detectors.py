import pandas as pd
import numpy as np
from intelligence.detectors import RollingStatisticalDetector, IsolationForestDetector

def test_rolling_statistical_detector_constant_data():
    detector = RollingStatisticalDetector(window_size=3, threshold_multiplier=3.0)
    data = pd.Series([5, 5, 5, 5, 5])
    anomalies = detector.detect(data)
    assert not anomalies.any(), "Constant data should not trigger anomalies"

def test_rolling_statistical_detector_anomaly():
    detector = RollingStatisticalDetector(window_size=3, threshold_multiplier=3.0)
    data = pd.Series([10, 10, 10, 100, 10])
    anomalies = detector.detect(data)
    # The anomaly is at index 3
    assert anomalies.iloc[3] == True
    assert anomalies.iloc[0] == False
    assert anomalies.iloc[4] == False

def test_isolation_forest_fallback():
    detector = IsolationForestDetector()
    df_eval = pd.DataFrame({"latency": [10, 20], "error_rate": [0, 0]})
    # Without training, it should fallback safely to False
    anomalies = detector.detect(df_eval)
    assert not anomalies.any()

def test_isolation_forest_anomaly():
    detector = IsolationForestDetector(contamination=0.2)
    # Train on normal data
    df_train = pd.DataFrame({"latency": [10, 12, 11, 10, 9, 11, 10, 12, 11, 10]})
    detector.fit(df_train)
    
    # Evaluate with one outlier
    df_eval = pd.DataFrame({"latency": [11, 100]})
    anomalies = detector.detect(df_eval)
    
    assert anomalies.iloc[0] == False
    assert anomalies.iloc[1] == True
