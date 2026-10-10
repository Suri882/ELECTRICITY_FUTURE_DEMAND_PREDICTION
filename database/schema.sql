-- SMART ELECTRICITY DEMAND PREDICTION & ENERGY OPTIMIZATION PLATFORM
-- Database Schema for MySQL 8.0+

CREATE DATABASE IF NOT EXISTS smart_energy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_energy;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    consumer_type ENUM('Household', 'College', 'Office', 'Small Industry') NOT NULL DEFAULT 'Household',
    location VARCHAR(120) DEFAULT NULL,
    monthly_budget DECIMAL(10, 2) DEFAULT 0.00,
    avg_monthly_consumption DECIMAL(10, 2) DEFAULT 0.00,
    notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Electricity Records Table
CREATE TABLE IF NOT EXISTS electricity_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    units_consumed DECIMAL(10, 2) NOT NULL,
    bill_amount DECIMAL(10, 2) NOT NULL,
    number_of_days INT NOT NULL DEFAULT 30,
    peak_usage DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_record_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    record_id INT DEFAULT NULL,
    predicted_demand DECIMAL(10, 2) NOT NULL,
    demand_level ENUM('Low', 'Normal', 'High', 'Critical') NOT NULL,
    prediction_quality VARCHAR(50) DEFAULT 'Good',
    mae DECIMAL(8, 2) DEFAULT NULL,
    rmse DECIMAL(8, 2) DEFAULT NULL,
    r2_score DECIMAL(5, 4) DEFAULT NULL,
    model_name VARCHAR(80) DEFAULT 'Ridge Regression',
    prediction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (record_id) REFERENCES electricity_records(id) ON DELETE SET NULL,
    INDEX idx_prediction_user (user_id, prediction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Anomalies Table
CREATE TABLE IF NOT EXISTS anomalies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    record_id INT DEFAULT NULL,
    anomaly_score DECIMAL(6, 4) NOT NULL,
    severity ENUM('Normal', 'Unusual', 'Highly Unusual') NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (record_id) REFERENCES electricity_records(id) ON DELETE SET NULL,
    INDEX idx_anomaly_user (user_id, severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    reason TEXT NOT NULL,
    action TEXT NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
    expected_benefit VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_recommendations_user (user_id, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    alert_type ENUM('HIGH_DEMAND', 'ANOMALY', 'BUDGET', 'RECOMMENDATION', 'REPORT', 'SYSTEM') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('Info', 'Warning', 'Critical') NOT NULL DEFAULT 'Info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_alerts_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Notification Tokens Table
CREATE TABLE IF NOT EXISTS notification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_token VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'web',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_device (user_id, device_token),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_type VARCHAR(80) NOT NULL DEFAULT 'Monthly Comprehensive Report',
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reports_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
