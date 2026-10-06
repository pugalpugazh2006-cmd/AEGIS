import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

class RollingStatisticalDetector:
    """
    Rolling statistical detector using Median and Median Absolute Deviation (MAD).
    Robust against outliers in the window.
    """
    def __init__(self, window_size: int = 10, threshold_multiplier: float = 3.0):
        self.window_size = window_size
        self.threshold_multiplier = threshold_multiplier
        
    def detect(self, series: pd.Series) -> pd.Series:
        """
        Returns a boolean series where True indicates an anomaly.
        """
        if len(series) < self.window_size:
            # Insufficient data
            return pd.Series(False, index=series.index)
            
        # Calculate rolling median
        rolling_median = series.rolling(window=self.window_size, min_periods=self.window_size).median()
        
        # Calculate rolling MAD: median(|x_i - median(X)|)
        def calc_mad(x):
            return np.median(np.abs(x - np.median(x)))
            
        rolling_mad = series.rolling(window=self.window_size, min_periods=self.window_size).apply(calc_mad, raw=True)
        
        # To avoid division by zero for constant series, add a small epsilon or use a minimum MAD
        min_mad = 1e-5
        rolling_mad_adjusted = np.maximum(rolling_mad, min_mad)
        
        # Deviation calculation
        deviation = np.abs(series - rolling_median)
        
        # Anomaly if deviation > threshold * MAD
        anomalies = deviation > (self.threshold_multiplier * rolling_mad_adjusted)
        
        # Ensure NaNs from rolling window are False
        return anomalies.fillna(False).astype(bool)

class IsolationForestDetector:
    """
    Multivariate anomaly detector using Isolation Forest.
    Requires separate training and evaluation phases.
    """
    def __init__(self, contamination: float = 0.05, random_seed: int = 42):
        self.contamination = contamination
        self.random_seed = random_seed
        self.model = None
        
    def fit(self, df_train: pd.DataFrame):
        """Train on known good or unlabelled data."""
        if df_train.empty or len(df_train) < 5:
            self.model = None
            return
            
        self.model = IsolationForest(
            contamination=self.contamination, 
            random_state=self.random_seed
        )
        self.model.fit(df_train)
        
    def detect(self, df_eval: pd.DataFrame) -> pd.Series:
        """
        Detect anomalies. Returns a boolean series (True = anomaly).
        Provides a rule-based fallback if model is not trained.
        """
        if self.model is None:
            # Fallback: flag nothing if insufficient training data
            return pd.Series(False, index=df_eval.index)
            
        # IsolationForest returns -1 for outliers and 1 for inliers.
        preds = self.model.predict(df_eval)
        is_anomaly = preds == -1
        return pd.Series(is_anomaly, index=df_eval.index)
