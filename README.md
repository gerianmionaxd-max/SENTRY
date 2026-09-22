# SENTRY — MySQL-backed attendance dashboard

The dashboard and mobile QR app now use a small Node/Express API backed by MySQL. Browser local storage is retained only as an offline fallback and migration source; employee, attendance, salary, validated-attendance, adjustment, and finalized-payroll changes are mirrored to MySQL.

## Database tables

`db/schema.sql` creates:

- `employees`
- `attendance_logs`
- `employee_salary`
- `validated_attendance_data`
- `overtime_leave_adjustments`
- `payroll_runs` (supporting table used by the existing payroll-finalization screen)

The schema includes foreign keys, unique employee/date constraints, and the columns used by the existing desktop and mobile code.

## Run locally

Requirements: Node.js 18+, npm, and MySQL 8+ or MariaDB 10.5+.

```bash
npm install
mysql -u root -p < db/schema.sql
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'sentry_app'@'localhost' IDENTIFIED BY 'change-this-password'; CREATE USER IF NOT EXISTS 'sentry_app'@'127.0.0.1' IDENTIFIED BY 'change-this-password'; GRANT ALL PRIVILEGES ON sentry_attendance.* TO 'sentry_app'@'localhost'; GRANT ALL PRIVILEGES ON sentry_attendance.* TO 'sentry_app'@'127.0.0.1'; FLUSH PRIVILEGES;"
cp .env.example .env
# edit .env with the same MySQL credentials
npm start
```

Open:

- Desktop dashboard: `http://localhost:3000/`
- Mobile attendance app: `http://localhost:3000/mobile/`
- Database health check: `http://localhost:3000/api/health`

The API is same-origin with both pages, so browser code never connects directly to MySQL. The server is the only component that holds database credentials.

## CRUD/API endpoints

- `GET /api/bootstrap` — loads all persisted records for the two clients
- `GET /api/employees` — reads employees
- `POST /api/employees` — creates an employee
- `PUT /api/employees/:id` — updates an employee
- `DELETE /api/employees/:id` — deletes an employee and linked records through foreign keys
- `PUT /api/employees/sync` — synchronizes the existing account directory
- `PUT /api/attendance/sync` — upserts attendance logs and their validated attendance row
- `PUT /api/salary/sync` — upserts employee salary profiles
- `PUT /api/adjustments/sync` — persists overtime/leave adjustments
- `PUT /api/payroll-runs/sync` — persists finalized payroll runs

Existing record editing and deletion actions call these endpoints through `codes/api-client.js`. If MySQL is temporarily unavailable, the UI continues to work locally and logs a non-blocking sync warning; the next successful startup imports local records if the corresponding database table is empty.

## Important note about existing demo accounts

The built-in `ADMIN-001` demo login remains frontend-only, as it was in the original prototype. Registered and approved employees are persisted in `employees`. For a production deployment, move authentication to the server and replace plaintext prototype passwords with password hashes.
