import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from backend.models.anomaly import AnomalySeverity

class AnomalyDetector:
    """
    Statistical and multi-factor consumption anomaly detector.
    Computes anomaly scores based on Z-score deviation, peak usage ratio shifts,
    and historical rolling boundaries.
    """

    def analyze_record(
        self,
        current_record: Dict[str, Any],
        historical_records: List[Dict[str, Any]]
    ) -> Tuple[float, AnomalySeverity, str]:
        """
        Evaluates a single record against the user's historical records baseline.
        """
        units = float(current_record.get("units_consumed", 0.0))
        peak = float(current_record.get("peak_usage", 0.0))
        
        if len(historical_records) < 2:
            # Baseline cannot establish outlier safely without sufficient history
            return 0.05, AnomalySeverity.Normal, "Consumption is within initial baseline limits."

        historical_units = [float(r["units_consumed"]) for r in historical_records]
        mean_units = float(np.mean(historical_units))
        std_units = float(np.std(historical_units)) or (mean_units * 0.15) or 1.0

        # Calculate Z-score for overall consumption
        z_score = abs(units - mean_units) / std_units

        # Peak ratio analysis
        current_peak_ratio = (peak / units) if units > 0 else 0.0
        historical_peak_ratios = [
            (float(r.get("peak_usage", 0.0)) / float(r["units_consumed"]))
            for r in historical_records if float(r.get("units_consumed", 0.0)) > 0
        ]
        mean_peak_ratio = float(np.mean(historical_peak_ratios)) if historical_peak_ratios else 0.25
        peak_ratio_diff = max(0.0, current_peak_ratio - mean_peak_ratio)

        # Composite Anomaly Score normalized between 0.0 and 1.0
        # Z-score contribution (60%) + Peak shift contribution (40%)
        normalized_z = min(1.0, z_score / 4.0)
        normalized_peak = min(1.0, peak_ratio_diff / 0.5)
        composite_score = round(0.65 * normalized_z + 0.35 * normalized_peak, 4)

        # Thresholds
        if composite_score >= 0.70 or z_score >= 2.8:
            severity = AnomalySeverity.HighlyUnusual
            explanation = (
                f"Unusual consumption detected. Billed units ({units:.1f}) deviated significantly "
                f"(+{z_score:.1f} standard deviations) from your historical pattern ({mean_units:.1f} avg). "
                f"Peak hours accounted for {current_peak_ratio*100:.1f}% of total load."
            )
        elif composite_score >= 0.40 or z_score >= 1.75:
            severity = AnomalySeverity.Unusual
            explanation = (
                f"Unusual consumption detected. Electricity usage of {units:.1f} units is noticeably above "
                f"your typical variation window. Consider auditing high-draw appliance runtimes."
            )
        else:
            severity = AnomalySeverity.Normal
            explanation = f"Consumption is within expected statistical distribution ({units:.1f} units vs {mean_units:.1f} average)."

        return composite_score, severity, explanation

anomaly_detector = AnomalyDetector()
