-- SENTRY MySQL database schema
-- Run this file once as a MySQL administrator:
--   mysql -u root -p < db/schema.sql

CREATE DATABASE IF NOT EXISTS sentry_attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sentry_attendance;

CREATE TABLE IF NOT EXISTS employees (
  user_id VARCHAR(32) NOT NULL,
  username VARCHAR(120) NULL,
  first_name VARCHAR(80) NOT NULL,
  middle_name VARCHAR(80) NULL,
  last_name VARCHAR(80) NOT NULL,
  gender VARCHAR(30) NULL,
  phone VARCHAR(30) NULL,
  birthday VARCHAR(40) NULL,
  birth_date DATE NULL,
  country VARCHAR(80) NULL,
  region VARCHAR(120) NULL,
  city VARCHAR(120) NULL,
  barangay VARCHAR(120) NULL,
  district VARCHAR(120) NULL,
  street VARCHAR(255) NULL,
  postal VARCHAR(20) NULL,
  department VARCHAR(80) NOT NULL DEFAULT 'Security',
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('Pending', 'Active', 'Inactive') NOT NULL DEFAULT 'Pending',
  access_rights JSON NULL,
  expiration_date DATE NULL,
  post VARCHAR(120) NULL,
  assignment VARCHAR(160) NULL,
  requested_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_employees_email (email),
  KEY idx_employees_department_status (department, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attendance_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id VARCHAR(32) NOT NULL,
  attendance_date DATE NOT NULL,
  time_in DATETIME NULL,
  time_out DATETIME NULL,
  token VARCHAR(255) NULL,
  post VARCHAR(120) NULL,
  assignment VARCHAR(160) NULL,
  saved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_employee_date (employee_id, attendance_date),
  KEY idx_attendance_date (attendance_date),
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS validated_attendance_data (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attendance_log_id BIGINT UNSIGNED NOT NULL,
  employee_id VARCHAR(32) NOT NULL,
  attendance_date DATE NOT NULL,
  time_in DATETIME NULL,
  time_out DATETIME NULL,
  late TINYINT(1) NOT NULL DEFAULT 0,
  absent TINYINT(1) NOT NULL DEFAULT 0,
  missed_in TINYINT(1) NOT NULL DEFAULT 0,
  missed_out TINYINT(1) NOT NULL DEFAULT 0,
  validation_status ENUM('Validated', 'Needs review') NOT NULL DEFAULT 'Validated',
  validated_by VARCHAR(120) NULL,
  validated_at DATETIME NULL,
  notes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_validated_attendance_log (attendance_log_id),
  KEY idx_validated_employee_date (employee_id, attendance_date),
  CONSTRAINT fk_validated_attendance_log FOREIGN KEY (attendance_log_id) REFERENCES attendance_logs(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_validated_employee FOREIGN KEY (employee_id) REFERENCES employees(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employee_salary (
  employee_id VARCHAR(32) NOT NULL,
  monthly_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  working_days DECIMAL(5,2) NOT NULL DEFAULT 26.00,
  shift_hours DECIMAL(5,2) NOT NULL DEFAULT 8.00,
  overtime_multiplier DECIMAL(6,3) NOT NULL DEFAULT 1.250,
  allowances DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  deductions DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  daily_rate DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
  hourly_rate DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
  overtime_rate DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
  effective_date DATE NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Active',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_id),
  CONSTRAINT fk_salary_employee FOREIGN KEY (employee_id) REFERENCES employees(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS overtime_leave_adjustments (
  id VARCHAR(64) NOT NULL,
  employee_id VARCHAR(32) NOT NULL,
  adjustment_type VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  unit VARCHAR(20) NULL,
  note VARCHAR(255) NULL,
  adjustment_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_adjustments_employee_date (employee_id, adjustment_date),
  CONSTRAINT fk_adjustment_employee FOREIGN KEY (employee_id) REFERENCES employees(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- The existing UI also finalizes payroll runs. This supporting table keeps
-- those records in MySQL instead of leaving them in browser storage.
CREATE TABLE IF NOT EXISTS payroll_runs (
  id VARCHAR(64) NOT NULL,
  period_label VARCHAR(120) NOT NULL,
  estimated DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rows_json JSON NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;
