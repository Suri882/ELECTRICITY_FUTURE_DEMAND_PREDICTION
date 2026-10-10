# API Documentation & Endpoint Reference

Base URL: `http://localhost:8000/api`  
Interactive Swagger UI: `http://localhost:8000/docs`  
ReDoc: `http://localhost:8000/redoc`

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new user account with role `USER` (or `ADMIN` for system administrator email).
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+91 9876543210",
    "password": "Password@123",
    "confirm_password": "Password@123",
    "consumer_type": "Household" // Household | College | Office | Small Industry
  }
  ```
- **Response (200)**: Returns JWT bearer token and user profile object.

### `POST /api/auth/login`
- **Body**: `{"email": "...", "password": "..."}`
- **Response (200)**: `{"access_token": "...", "token_type": "bearer", "user": {...}}`

### `POST /api/auth/forgot-password`
- **Body**: `{"email": "...", "new_password": "...", "confirm_new_password": "..."}`

---

## 2. User Profile (`/api/users`)

### `GET /api/users/profile`
Requires `Authorization: Bearer <token>`.

### `PUT /api/users/profile`
Updates user location, monthly budget, average consumption, and notification toggle.

---

## 3. Electricity Consumption (`/api/consumption`)

### `POST /api/consumption`
Logs a single consumption reading.
- **Body**:
  ```json
  {
    "date": "2026-05-15",
    "units_consumed": 450.5,
    "bill_amount": 3150.0,
    "number_of_days": 30,
    "peak_usage": 110.0
  }
  ```

### `GET /api/consumption`
Returns historical consumption records for the authenticated user.

### `DELETE /api/consumption/{id}`
Deletes record and cascades anomaly recalculation.

### `POST /api/consumption/upload-csv`
Uploads a batch `.csv` file. Returns upload validation summary with `total_rows`, `successful_rows`, `failed_rows`, and `error_details`.

---

## 4. Machine Learning Predictions (`/api/predictions`)

### `POST /api/predictions`
Trains regression models on the user's historical records and forecasts future demand.
- **Response**:
  - `predicted_demand`: Projected units in kWh.
  - `demand_level`: `Low` | `Normal` | `High` | `Critical`
  - `mae`, `rmse`, `r2_score`: Rigorous evaluation metrics.
  - `model_name`: Best performing regression model.
  - `previous_average`: Baseline benchmark.
  - `percentage_change`: Shift percentage.
  - `explanation`: Contextual diagnostic statement.

### `GET /api/predictions`
Returns prediction history.

### `GET /api/predictions/latest`
Returns the most recent prediction.

---

## 5. Analytics & Visuals (`/api/analytics`)

### `GET /api/analytics/summary`
Returns 4 summary card values: current consumption, predicted demand, demand level, and efficiency score. Returns `has_data: false` if user has zero records.

### `GET /api/analytics/efficiency`
Returns 0–100 score and 5-factor breakdown.

### `GET /api/analytics/cost`
Returns cost variance, previous bill comparison, and budget utilization status.

### `GET /api/analytics/peak`
Returns peak demand analysis, peak ratio percentage, and periods.

### `GET /api/analytics/dashboard-full`
Consolidated endpoint for multi-chart dashboard views.

---

## 6. Anomalies & Alerts (`/api/anomalies`, `/api/alerts`)

### `GET /api/anomalies`
Returns flagged anomaly events with severity and Z-score deviation explanations.

### `GET /api/alerts`
Returns in-app notifications.

### `PUT /api/alerts/{id}/read`
Marks alert as read.

### `PUT /api/alerts/mark-all-read`
Marks all alerts as read.

### `POST /api/alerts/token`
Registers device FCM token for mobile push notifications.

---

## 7. Reports & Audits (`/api/reports`)

### `POST /api/reports/generate`
Compiles an auditable PDF report using ReportLab.

### `GET /api/reports`
Lists generated reports.

### `GET /api/reports/download/{id}`
Streams downloadable binary PDF file.

---

## 8. Admin Portal (`/api/admin`)

Requires `ADMIN` role.
- `GET /api/admin/dashboard`: System stats and activity trends.
- `GET /api/admin/users`: Search and list registered consumers.
- `DELETE /api/admin/users/{id}`: Administrative account deletion.
