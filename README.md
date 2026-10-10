# ELECTROWISE — SMART ENERGY INTELLIGENCE PLATFORM
### Smart Energy Demand, Construction Planning, Appliance Cost & Energy Optimization Platform

> **Registered Problem Statement:** Electricity Demand Predictor & Energy Intelligence  
> **Platform Version:** 2.0.0 (ElectroWise Edition)  
> **Architecture:** 100% Software-Based Predictive Intelligence (No IoT Devices, Smart Meters, or Hardware Required)

---

## 1. Project Overview & ElectroWise Vision

**ElectroWise** is a full-stack, enterprise-grade software platform engineered to help individuals, builders, architects, electrical engineers, and organizations estimate electricity consumption, calculate electricity costs, plan temporary electrical equipment requirements for construction, and predict future demand before constructing a building or purchasing electrical machinery.

### Core Modules:
1. **Energy Planning Studio:** Interactive planning across 4 categories (Residential, Commercial, Public & Institutional, Industrial & Infrastructure) and 37+ specialized facility types.
2. **Construction-Phase Electricity Calculator:** Machine-level duty cycle modeling across 10 construction phases, calculating total construction energy, electricity budget, peak simultaneous demand, and suggested temporary connection capacity (kVA).
3. **Appliance & Equipment Intelligence:** Detailed electrical equipment library with editable power ratings, duty cycles, consumption ranking, 1/3/5-year Total Cost of Ownership (TCO), and high-efficiency alternatives comparison.
4. **Configurable Tariff & Bill Engine:** Multi-state DISCOM slab rules (BESCOM, MSEDCL, TANGEDCO, BRPL Delhi, National Baseline, and manual entry) calculating itemized energy charges, demand charges, fixed charges, and taxes.
5. **Machine Learning Demand Prediction:** Multi-horizon forecasting (24 hours, 7 days, 30 days, annual projection) utilizing regularized regression models (Random Forest, Ridge, Polynomial, OLS) with zero temporal leakage.
6. **Solar PV & Battery Storage (BESS) Planner:** Clean energy yield estimation, critical load battery sizing (Ah/kWh), self-consumption, and 3-scenario payback analysis (Grid Only vs Solar Grid-Tied vs Solar + Battery).
7. **EV Charging & Peak Load Planner:** Charging station load modeling, coincidence factors, transformer capacity checks, and nocturnal ToD load shifting.
8. **Actionable Recommendations:** Mathematically substantiated load curtailment, HVAC setpoint calibration (6% savings/°C), and payback calculations.
9. **Multi-Scenario Comparison:** Side-by-side comparison across up to 3 scenarios (Baseline, Efficient, Solar Microgrid) with 5-year TCO charts.
10. **Auditable PDF & CSV Reports:** ReportLab PDF audit documents with numbered running canvas, plus equipment inventory CSV exports.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS v4, React Router 7, Axios, Recharts, Lucide React |
| **Backend** | Python 3.14+, FastAPI, SQLAlchemy ORM, Pydantic v2, Uvicorn ASGI Server |
| **Database** | MySQL 8.0+ (with automatic development fallback to SQLite) |
| **Data Analysis & ML** | Pandas, NumPy, Scikit-learn, SciPy |
| **Push Notifications**| Firebase Cloud Messaging (FCM) & In-App Notification Center |
| **Document Generation**| ReportLab PDF Engine with Numbered Canvas |
| **Security & Auth** | JWT (JSON Web Tokens), Bcrypt Password Hashing, RBAC (USER / ADMIN) |

---

## 3. System Architecture & Directory Structure

```
sitams-project/
├── frontend/                     # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, MobileDrawer, StatCard, EmptyState, LoadingSpinner
│   │   ├── context/              # AuthContext (JWT state management)
│   │   ├── layouts/              # MainLayout, AdminLayout
│   │   ├── pages/                # 11 Dedicated views: Landing, Login, Register, Dashboard,
│   │   │                         # Consumption, Predictions, Analytics, Anomalies,
│   │   │                         # Recommendations, History, Notifications, Reports, Profile, Admin
│   │   ├── services/             # Axios API client with bearer token interceptor
│   │   ├── App.jsx               # Protected route tree
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # FastAPI Modular Architecture
│   ├── config.py                 # Pydantic BaseSettings environment manager
│   ├── database.py               # Engine & SessionLocal (MySQL / SQLite support)
│   ├── main.py                   # App lifecycle, routers, CORS & Admin seeding
│   ├── models/                   # SQLAlchemy Models (User, Record, Prediction, Anomaly, ...)
│   ├── schemas/                  # Pydantic Request/Response validation schemas
│   ├── routes/                   # Clean REST endpoints (/auth, /consumption, /predictions, ...)
│   ├── services/                 # Business logic (CSV processor, notifications, PDF reports)
│   ├── ml/                       # Machine Learning Regressors & Anomaly Detectors
│   └── utils/                    # Password hashing, JWT encode/decode, dependencies
│
├── database/
│   └── schema.sql                # Production MySQL 8.0 DDL schema with foreign keys and indexes
│
├── ml/                           # Dedicated Machine Learning Modules
│   ├── preprocessing/            # Feature engineering pipeline
│   ├── training/                 # Offline training & benchmarking scripts
│   └── models/                   # Algorithm definitions & model exports
│
├── docs/                         # Technical documentation & sample CSVs
│   ├── architecture.md
│   ├── api_documentation.md
│   └── sample_data.csv
│
├── test_backend.py               # Backend unit test suite
├── test_e2e_flow.py              # Full 13-module integration test
├── .env.example                  # Environment configuration template
└── README.md
```

---

## 4. Database Schema (MySQL 8.0+)

The relational schema is defined in `database/schema.sql` and includes:
1. `users`: Consumer profiles, hashed credentials, role (`USER`/`ADMIN`), consumer type, monthly budget.
2. `electricity_records`: Billed date, units consumed ($kWh$), bill amount ($\text{INR}$), cycle days, peak usage.
3. `predictions`: Target date, predicted units, demand level (`Low`, `Normal`, `High`, `Critical`), model metrics (MAE, RMSE, $R^2$).
4. `anomalies`: Anomaly score ($0.0 - 1.0$), severity (`Normal`, `Unusual`, `Highly Unusual`), non-accusatory explanation.
5. `recommendations`: Title, reason, action, priority, expected benefit.
6. `alerts`: Type, title, message, severity, read/unread status.
7. `notification_tokens`: Device tokens for FCM mobile push delivery.
8. `reports`: Compiled PDF audit files and metadata.

---

## 5. Machine Learning Approach

### Feature Engineering
For every historical record $t$, the pipeline constructs:
- $\text{Lag}_1, \text{Lag}_2$: Preceding billing cycle consumptions ($kWh_{t-1}, kWh_{t-2}$)
- $\text{Rolling\_Avg}_3$: 3-cycle rolling average ($\mu_{t-3:t}$)
- $\text{Growth\_Rate}$: Period-over-period percentage shift
- $\text{Seasonality}$: Day-of-week and month indicators
- $\text{Peak\_Ratio}$: Proportion of consumption occurring during peak tariff hours

### Multi-Model Regression
The system evaluates candidate models:
1. **Ridge Regression:** L2 regularized linear model preventing overfitting on short sequences:  
   $$\beta = (X^T X + \alpha I)^{-1} X^T y$$
2. **Ordinary Least Squares (OLS):** Direct linear trend estimation via Moore-Penrose pseudo-inverse.
3. **Polynomial Trend Regression:** Quadratic feature expansion for non-linear consumption acceleration.

### Metrics & Safeguards
- Evaluates real **MAE**, **RMSE**, and **$R^2$** scores.
- **Insufficient Data Safeguard:** Requires at least 3 records. If fewer exist, clearly prompts:  
  *"Not enough historical data to generate a reliable prediction. Add more consumption records."*  
  *(Never fabricates fake predictions).*

---

## 6. Setup & Installation Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MySQL Server (Optional, defaults to SQLite if MySQL is not configured)

### Backend Setup
1. Open terminal and navigate to the project root:
   ```bash
   python -m venv venv
   ```
2. Activate the virtual environment:
   - **Windows:** `.\venv\Scripts\activate`
   - **Linux/macOS:** `source venv/bin/activate`
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt # or install fastapi uvicorn sqlalchemy pandas numpy scikit-learn reportlab pydantic email-validator python-jose bcrypt
   ```
4. Configure `.env`:
   ```bash
   cp .env.example .env
   ```
   *(For MySQL, set `DATABASE_URL=mysql+pymysql://root:password@localhost:3306/smart_energy`)*
5. Start the backend API server:
   ```bash
   uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *Swagger documentation will be live at `http://127.0.0.1:8000/docs`.*

### Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Application will be live at `http://localhost:5173/`.*

---

## 7. Advanced Energy Intelligence Platform Capabilities (v2.0)

| Module | Route | Key Features |
|---|---|---|
| **Dashboard** | `/dashboard` | 7 core KPIs, multi-tab interactive visualizations, quick module shortcuts |
| **Demand Prediction** | `/predictions` | 24h, 7d, 30d horizons, Random Forest & Ridge regression, MAE/RMSE/R² metrics |
| **Peak-Demand Analysis** | `/peak-demand` | 24h peak curve, Low/Med/High threshold classification, load shifting advisories |
| **Weather Insights** | `/weather` | Live Open-Meteo API, Cooling Degree Days (CDD), heatwave HVAC warnings |
| **Bill Estimator** | `/billing` | Itemized bills, 24h/7d/30d predicted bills, transparent tariffs, custom calculator |
| **What-If Simulator** | `/simulator` | Interactive peak reduction & load shifting, baseline vs simulated curve, scenario saving |
| **Carbon Emissions** | `/carbon` | Regional grid factor (kg CO2e/kWh), offset equivalencies (trees, car km), timeline |
| **Smart Recommendations** | `/recommendations` | Structured 4-part framework (Detected, Why it matters, Action, Estimated impact) |
| **Reports & History** | `/reports` | Auditable PDF report generation, raw CSV telemetry export, unified history trail |
| **Platform Settings** | `/settings` | Configurable thresholds, tariffs, weather location, and 1-click Demo Data toggle |

---

## 8. Demo & Evaluation Accounts

Quick-fill buttons are provided on the Login page for immediate evaluator testing:

| Role | Email | Password | Access |
|---|---|---|---|
| **Demo User** | `rajesh@example.com` | `Password@123` | Consumer Dashboard, What-If Simulator, ML Forecasts, Reports |
| **System Admin** | `admin@smartenergy.com` | `Admin@12345` | Admin Portal, User Management, Monitoring |

---

## 9. Verification & Automated Testing

Run the automated integration test suites:
```bash
# 1. Base 13-module integration test
python test_e2e_flow.py

# 2. Advanced features test (24h/7d/30d predictions, weather, simulator, carbon, billing)
python test_new_features.py
```

