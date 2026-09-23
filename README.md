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

## Time convention (time-in / time-out)

`attendance_logs.time_in` / `time_out` (and their copies in `validated_attendance_data`) are stored as **local wall-clock time** — the time shown on the guard's clock at the post (the Philippines, UTC+8) — not UTC. The clients stamp attendance with timezone-free local strings and the API stores them verbatim, so what you read in MySQL is exactly what the guard punched.

If your database was populated before this convention, run the migration once to shift the existing UTC rows into local time (it is guarded by a `schema_migrations` marker, so running it twice is safe):

```bash
npm run migrate:times            # no mysql CLI needed - uses the .env credentials
# or, if you have the mysql CLI:
mysql -u root -p sentry_attendance < db/migrate_timein_time_out_to_local_time.sql
```

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

### On Windows (PowerShell)

PowerShell does not support the `<` redirection or `cp` from the commands above. Use:

```powershell
Get-Content db\schema.sql | mysql -u root -p
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'sentry_app'@'localhost' IDENTIFIED BY 'change-this-password'; CREATE USER IF NOT EXISTS 'sentry_app'@'127.0.0.1' IDENTIFIED BY 'change-this-password'; GRANT ALL PRIVILEGES ON sentry_attendance.* TO 'sentry_app'@'localhost'; GRANT ALL PRIVILEGES ON sentry_attendance.* TO 'sentry_app'@'127.0.0.1'; FLUSH PRIVILEGES;"
copy .env.example .env
```

Then edit `.env` with the same MySQL credentials and run `npm start`. (If you use phpMyAdmin, you can also import `db/schema.sql` from the *Import* tab instead of the first command.)

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
