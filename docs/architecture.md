# System Architecture & Technical Specifications

## 1. Overview
The **Smart Electricity Demand Prediction & Energy Optimization Platform** is an enterprise-grade, 100% software-based predictive energy intelligence system. It eliminates the need for expensive IoT devices, smart meters, or microcontroller boards by processing user-logged consumption records and uploaded billing CSVs.

```
+-----------------------------------------------------------------------------------------+
|                                    CLIENT APPLICATION                                   |
|   React 19 + Vite 6 + Tailwind CSS v4 + Recharts Data Visualizations + Lucide Icons     |
+-----------------------------------------------------------------------------------------+
                                           |  REST API / JWT Bearer
                                           v
+-----------------------------------------------------------------------------------------+
|                                     BACKEND API CORE                                    |
|             FastAPI + Pydantic v2 + SQLAlchemy ORM + Uvicorn ASGI Server                |
+-----------------------------------------------------------------------------------------+
       |                         |                          |                       |
       v                         v                          v                       v
+---------------+      +-------------------+      +-------------------+   +---------------+
| DATA PIPELINE |      |   ML REGRESSION   |      | ANOMALY DETECTION |   | PDF REPORTLAB |
| Ingestion &   |      | Ridge, OLS, Poly  |      | Z-score & Peak    |   | Executive     |
| Validation    |      | MAE, RMSE, R^2    |      | Shift Classifier  |   | Energy Audits |
+---------------+      +-------------------+      +-------------------+   +---------------+
       |                         |                          |                       |
       +-------------------------+--------------------------+-----------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
|                                  PERSISTENCE LAYER                                      |
|            MySQL 8.0+ Relational Database (or SQLite for Zero-Setup Dev)                |
+-----------------------------------------------------------------------------------------+
```

## 2. Machine Learning Demand Prediction Pipeline
The core ML pipeline implements the following progression:

1. **Telemetry Ingestion**: Ingests billing cycle date, units consumed ($kWh$), bill amount ($\text{INR}$), cycle days, and peak hours usage.
2. **Feature Engineering**:
   - Lag 1 & Lag 2 consumption ($kWh_{t-1}$, $kWh_{t-2}$)
   - 3-period Rolling Moving Average ($\mu_{t-3:t}$)
   - Consumption Growth Acceleration ($\Delta kWh / kWh_{t-1}$)
   - Calendar Day-of-Week and Month seasonality
   - Peak Hours Intensity Ratio ($\text{Peak } kWh / \text{Total } kWh$)
3. **Multi-Model Regression Benchmark**:
   - Analytical L2 Regularized Ridge Regression: $\beta = (X^T X + \alpha I)^{-1} X^T y$
   - Ordinary Least Squares (OLS) via Moore-Penrose Pseudo-Inverse
   - Polynomial Degree-2 Trend Model for seasonal non-linear shifts
4. **Model Evaluation Metrics**:
   - **MAE**: Mean Absolute Error ($\frac{1}{n} \sum |y - \hat{y}|$)
   - **RMSE**: Root Mean Squared Error ($\sqrt{\frac{1}{n} \sum (y - \hat{y})^2}$)
   - **$R^2$**: Coefficient of Determination ($1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}$)
5. **Categorization & Shift Context**:
   - Demand Level: `Low`, `Normal`, `High`, `Critical`
   - Comparison vs. Historical Mean: $+X\%$ or $-X\%$ shift

## 3. Statistical Anomaly Detection Engine
Monitors consumption spikes without false accusations:
- **Z-Score Deviation**: $Z = \frac{|x_t - \mu|}{\sigma}$
- **Peak Load Ratio Variance**: $\Delta r = r_t - \mu_{\text{peak\_ratio}}$
- **Composite Normalized Anomaly Score**: $\text{Score} = 0.65 \times \text{norm}(Z) + 0.35 \times \text{norm}(\Delta r)$
- Severity Levels: `Normal`, `Unusual`, `Highly Unusual`

## 4. Energy Efficiency Score (0–100)
Evaluated deterministically across 5 objective dimensions:
1. **Consumption Trend** (Weight: 25 pts)
2. **Demand Growth** (Weight: 20 pts)
3. **Peak Load Ratio** (Weight: 25 pts)
4. **Budget Compliance** (Weight: 15 pts)
5. **Anomaly Frequency** (Weight: 15 pts)

Categories:
- 80–100: Excellent
- 60–79: Good
- 40–59: Moderate
- 0–39: Needs Improvement
