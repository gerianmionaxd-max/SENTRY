require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const CODES_DIR = path.join(__dirname, 'codes');
const MOBILE_DIR = path.join(__dirname, 'codes (mobile)');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sentry_attendance',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  dateStrings: true,
  decimalNumbers: true,
});

app.use(express.json({ limit: '2mb' }));

const asNull = value => value === undefined || value === null || value === '' ? null : value;
const asDate = value => {
  if (!value) return null;
  const text = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
};
const asDateTime = value => {
  if (!value) return null;
  const text = String(value).trim();
  // Plain wall-clock stamps ("YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DD HH:MM:SS", no
  // timezone designator) are stored verbatim — the client already stamped the
  // local time at the guard's post, so the database shows what the guard saw.
  // Zoned values (legacy toISOString output) keep the previous UTC conversion.
  const localMatch = text.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})$/);
  if (localMatch) return `${localMatch[1]} ${localMatch[2]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
};
const localNow = () => {
  const now = new Date();
  const pad = number => String(number).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};
const asNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const jsonValue = value => typeof value === 'string' ? value : JSON.stringify(value ?? []);

function employeeFromRow(row) {
  let accessRights = row.access_rights;
  if (typeof accessRights === 'string') {
    try { accessRights = JSON.parse(accessRights); } catch { accessRights = []; }
  }
  return {
    userId: row.user_id,
    firstName: row.first_name,
    middleName: row.middle_name || '',
    lastName: row.last_name,
    gender: row.gender || '',
    phone: row.phone || '',
    birthday: row.birthday || '',
    birthDate: row.birth_date || '',
    country: row.country || '',
    region: row.region || '',
    city: row.city || '',
    barangay: row.barangay || '',
    district: row.district || '',
    street: row.street || '',
    postal: row.postal || '',
    department: row.department,
    email: row.email,
    password: row.password,
    status: row.status,
    accessRights: Array.isArray(accessRights) ? accessRights : [],
    expirationDate: row.expiration_date || '',
    post: row.post || '',
    assignment: row.assignment || '',
    requestedAt: row.requested_at || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

function employeeParams(item) {
  return [
    item.userId,
    item.firstName || '',
    item.middleName || null,
    item.lastName || '',
    item.gender || null,
    item.phone || null,
    item.birthday || null,
    asDate(item.birthDate),
    item.country || null,
    item.region || null,
    item.city || null,
    item.barangay || null,
    item.district || null,
    item.street || null,
    item.postal || null,
    item.department || 'Security',
    item.email,
    item.password || '',
    item.status || 'Pending',
    jsonValue(item.accessRights || []),
    asDate(item.expirationDate),
    item.post || null,
    item.assignment || null,
    asDateTime(item.requestedAt),
  ];
}

const EMPLOYEE_COLUMNS = `
  user_id, first_name, middle_name, last_name, gender, phone,
  birthday, birth_date, country, region, city, barangay, district, street,
  postal, department, email, password, status, access_rights, expiration_date,
  post, assignment, requested_at
`;
const EMPLOYEE_VALUES = `
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
`;
const EMPLOYEE_UPDATE = `
 first_name=VALUES(first_name), middle_name=VALUES(middle_name),
  last_name=VALUES(last_name), gender=VALUES(gender), phone=VALUES(phone), birthday=VALUES(birthday),
  birth_date=VALUES(birth_date), country=VALUES(country), region=VALUES(region), city=VALUES(city),
  barangay=VALUES(barangay), district=VALUES(district), street=VALUES(street), postal=VALUES(postal),
  department=VALUES(department), email=VALUES(email), password=VALUES(password), status=VALUES(status),
  access_rights=VALUES(access_rights), expiration_date=VALUES(expiration_date), post=VALUES(post),
  assignment=VALUES(assignment), requested_at=VALUES(requested_at)
`;

async function upsertEmployee(connection, item) {
  const [result] = await connection.execute(
    `INSERT INTO employees (${EMPLOYEE_COLUMNS}) VALUES (${EMPLOYEE_VALUES}) ON DUPLICATE KEY UPDATE ${EMPLOYEE_UPDATE}`,
    employeeParams(item),
  );
  return result;
}

async function readBootstrap() {
  const [employees] = await pool.query('SELECT * FROM employees ORDER BY last_name, first_name, user_id');
  const [attendance] = await pool.query('SELECT * FROM attendance_logs ORDER BY attendance_date DESC, employee_id');
  const [salary] = await pool.query('SELECT * FROM employee_salary');
  const [validated] = await pool.query('SELECT * FROM validated_attendance_data ORDER BY attendance_date DESC, employee_id');
  const [adjustments] = await pool.query('SELECT * FROM overtime_leave_adjustments ORDER BY adjustment_date DESC, created_at DESC');
  const [runs] = await pool.query('SELECT * FROM payroll_runs ORDER BY created_at DESC');

  const attendanceLogs = {};
  attendance.forEach(row => {
    const date = String(row.attendance_date).slice(0, 10);
    if (!attendanceLogs[date]) attendanceLogs[date] = {};
    attendanceLogs[date][row.employee_id] = {
      in: row.time_in ? String(row.time_in).replace(' ', 'T') : null,
      out: row.time_out ? String(row.time_out).replace(' ', 'T') : null,
      token: row.token || '',
      post: row.post || '',
      assignment: row.assignment || '',
      savedAt: row.saved_at ? String(row.saved_at).replace(' ', 'T') : null,
    };
  });

  const salaryProfiles = {};
  salary.forEach(row => {
    salaryProfiles[row.employee_id] = {
      userId: row.employee_id,
      monthlySalary: Number(row.monthly_salary),
      workingDays: Number(row.working_days),
      shiftHours: Number(row.shift_hours),
      overtimeMultiplier: Number(row.overtime_multiplier),
      allowances: Number(row.allowances),
      deductions: Number(row.deductions),
      dailyRate: Number(row.daily_rate),
      hourlyRate: Number(row.hourly_rate),
      overtimeRate: Number(row.overtime_rate),
      effectiveDate: row.effective_date || '',
      status: row.status,
      updatedAt: row.updated_at || '',
    };
  });

  const payrollAdjustments = adjustments.map(row => ({
    id: row.id,
    userId: row.employee_id,
    type: row.adjustment_type,
    amount: Number(row.amount),
    unit: row.unit || '',
    note: row.note || '',
    date: String(row.adjustment_date).slice(0, 10),
    createdAt: row.created_at || '',
  }));
  const payrollRuns = runs.map(row => ({
    id: row.id,
    period: row.period_label,
    estimated: Number(row.estimated),
    createdAt: row.created_at || '',
    rows: typeof row.rows_json === 'string' ? JSON.parse(row.rows_json || '[]') : (row.rows_json || []),
  }));

  return {
    employees: employees.map(employeeFromRow),
    attendanceLogs,
    salaryProfiles,
    validatedAttendance: validated,
    payrollAdjustments,
    payrollRuns,
  };
}

function requireArray(value, name) {
  if (!Array.isArray(value)) {
    const error = new Error(`${name} must be an array`);
    error.status = 400;
    throw error;
  }
  return value;
}

async function replaceAdjustments(items) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM overtime_leave_adjustments');
    for (const item of items) {
      if (!item.id || !item.userId || !item.type) continue;
      await connection.execute(
        `INSERT INTO overtime_leave_adjustments
          (id, employee_id, adjustment_type, amount, unit, note, adjustment_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id), adjustment_type=VALUES(adjustment_type),
           amount=VALUES(amount), unit=VALUES(unit), note=VALUES(note), adjustment_date=VALUES(adjustment_date)`,
        [item.id, item.userId, item.type, asNumber(item.amount), item.unit || null, item.note || null,
          asDate(item.date) || new Date().toISOString().slice(0, 10), asDateTime(item.createdAt) || localNow()],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function replacePayrollRuns(items) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM payroll_runs');
    for (const item of items) {
      if (!item.id) continue;
      await connection.execute(
        `INSERT INTO payroll_runs (id, period_label, estimated, created_at, rows_json)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE period_label=VALUES(period_label), estimated=VALUES(estimated),
           created_at=VALUES(created_at), rows_json=VALUES(rows_json)`,
        [item.id, item.period || '', asNumber(item.estimated), asDateTime(item.createdAt) || localNow(), jsonValue(item.rows || [])],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function upsertAttendance(logs) {
  const connection = await pool.getConnection();
  const skippedEmployeeIds = [];
  try {
    await connection.beginTransaction();
    const [employeeRows] = await connection.execute('SELECT user_id FROM employees');
    const employeeIds = new Set(employeeRows.map(row => row.user_id));
    for (const [dateKey, byEmployee] of Object.entries(logs || {})) {
      if (!byEmployee || typeof byEmployee !== 'object') continue;
      const attendanceDate = asDate(dateKey);
      if (!attendanceDate) continue;
      for (const [employeeId, item] of Object.entries(byEmployee)) {
        if (!item || !employeeId) continue;
        if (!employeeIds.has(employeeId)) {
          if (!skippedEmployeeIds.includes(employeeId)) skippedEmployeeIds.push(employeeId);
          continue;
        }
        const timeIn = asDateTime(item.in);
        const timeOut = asDateTime(item.out);
        const savedAt = asDateTime(item.savedAt) || localNow();
        await connection.execute(
          `INSERT INTO attendance_logs
            (employee_id, attendance_date, time_in, time_out, token, post, assignment, saved_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE time_in=VALUES(time_in), time_out=VALUES(time_out), token=VALUES(token),
             post=VALUES(post), assignment=VALUES(assignment), saved_at=VALUES(saved_at)`,
          [employeeId, attendanceDate, timeIn, timeOut, item.token || null, item.post || null, item.assignment || null, savedAt],
        );
        const [rows] = await connection.execute(
          'SELECT id FROM attendance_logs WHERE employee_id = ? AND attendance_date = ?',
          [employeeId, attendanceDate],
        );
        if (!rows.length) continue;
        // timeIn is a local wall-clock string ("YYYY-MM-DD HH:MM:SS"), so compare
        // the HH:MM text directly — no Date round-trip, no server-TZ drift.
        const late = timeIn ? timeIn.slice(11, 16) > '07:05' : 0;
        const absent = !timeIn && !timeOut;
        const missedIn = !timeIn && !!timeOut;
        const missedOut = !!timeIn && !timeOut;
        const validationStatus = timeIn || timeOut ? 'Validated' : 'Needs review';
        await connection.execute(
          `INSERT INTO validated_attendance_data
            (attendance_log_id, employee_id, attendance_date, time_in, time_out, late, absent,
             missed_in, missed_out, validation_status, validated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE employee_id=VALUES(employee_id), attendance_date=VALUES(attendance_date),
             time_in=VALUES(time_in), time_out=VALUES(time_out), late=VALUES(late), absent=VALUES(absent),
             missed_in=VALUES(missed_in), missed_out=VALUES(missed_out), validation_status=VALUES(validation_status),
             validated_at=VALUES(validated_at)`,
          [rows[0].id, employeeId, attendanceDate, timeIn, timeOut, late, absent, missedIn, missedOut,
            validationStatus, new Date()],
        );
      }
    }
    await connection.commit();
    if (skippedEmployeeIds.length) {
      console.warn('[SENTRY API] Skipped attendance for unknown employees:', skippedEmployeeIds.join(', '));
    }
    return { skippedEmployeeIds };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: process.env.DB_NAME || 'sentry_attendance' });
  } catch (error) {
    res.status(503).json({ ok: false, error: 'MySQL is unavailable', detail: error.code || error.message });
  }
});

app.get('/api/bootstrap', async (_req, res, next) => {
  try { res.json(await readBootstrap()); } catch (error) { next(error); }
});

app.get('/api/employees', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM employees ORDER BY last_name, first_name, user_id`);
    res.json(rows.map(employeeFromRow));
  } catch (error) { next(error); }
});

app.post('/api/employees', async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    try { await upsertEmployee(connection, req.body); } finally { connection.release(); }
    res.status(201).json({ ok: true, userId: req.body.userId });
  } catch (error) { next(error); }
});

app.put('/api/employees/sync', async (req, res, next) => {
  try {
    const items = requireArray(req.body, 'employees');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const item of items) {
        if (item.userId && item.email) await upsertEmployee(connection, item);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
    res.json({ ok: true, count: items.length });
  } catch (error) { next(error); }
});

app.put('/api/employees/:id', async (req, res, next) => {
  try {
    const item = { ...req.body, userId: req.params.id };
    const connection = await pool.getConnection();
    try { await upsertEmployee(connection, item); } finally { connection.release(); }
    res.json({ ok: true, userId: req.params.id });
  } catch (error) { next(error); }
});

app.delete('/api/employees/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM employees WHERE user_id = ?', [req.params.id]);
    res.json({ ok: true, deleted: result.affectedRows });
  } catch (error) { next(error); }
});

app.put('/api/attendance/sync', async (req, res, next) => {
  try {
    const result = await upsertAttendance(req.body || {});
    res.json({ ok: true, ...result });
  } catch (error) { next(error); }
});

app.put('/api/salary/sync', async (req, res, next) => {
  try {
    const profiles = req.body || {};
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const [employeeId, item] of Object.entries(profiles)) {
        await connection.execute(
          `INSERT INTO employee_salary
            (employee_id, monthly_salary, working_days, shift_hours, overtime_multiplier, allowances,
             deductions, daily_rate, hourly_rate, overtime_rate, effective_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE monthly_salary=VALUES(monthly_salary), working_days=VALUES(working_days),
             shift_hours=VALUES(shift_hours), overtime_multiplier=VALUES(overtime_multiplier), allowances=VALUES(allowances),
             deductions=VALUES(deductions), daily_rate=VALUES(daily_rate), hourly_rate=VALUES(hourly_rate),
             overtime_rate=VALUES(overtime_rate), effective_date=VALUES(effective_date), status=VALUES(status)`,
          [employeeId, asNumber(item.monthlySalary), asNumber(item.workingDays, 26), asNumber(item.shiftHours, 8),
            asNumber(item.overtimeMultiplier, 1.25), asNumber(item.allowances), asNumber(item.deductions),
            asNumber(item.dailyRate), asNumber(item.hourlyRate), asNumber(item.overtimeRate), asDate(item.effectiveDate), item.status || 'Active'],
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
    res.json({ ok: true, count: Object.keys(profiles).length });
  } catch (error) { next(error); }
});

app.put('/api/adjustments/sync', async (req, res, next) => {
  try {
    const items = requireArray(req.body, 'adjustments');
    await replaceAdjustments(items);
    res.json({ ok: true, count: items.length });
  } catch (error) { next(error); }
});

app.put('/api/payroll-runs/sync', async (req, res, next) => {
  try {
    const items = requireArray(req.body, 'payrollRuns');
    await replacePayrollRuns(items);
    res.json({ ok: true, count: items.length });
  } catch (error) { next(error); }
});

/* Static assets live outside /codes, so both the Node server and Live Server
   can resolve the existing ../images/... paths used by the HTML. */
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/mobile', express.static(MOBILE_DIR));
app.use(express.static(CODES_DIR));
app.get('/mobile', (_req, res) => res.sendFile(path.join(MOBILE_DIR, 'index.html')));

app.use((error, _req, res, _next) => {
  const status = Number(error.status) || 500;
  console.error('[SENTRY API]', error);
  res.status(status).json({ ok: false, error: status === 500 ? 'Database operation failed' : error.message, detail: error.code || undefined });
});

app.listen(PORT, HOST, () => {
  console.log(`SENTRY dashboard: http://${HOST}:${PORT}`);
  pool.query('SELECT 1').then(() => console.log('SENTRY MySQL connection ready'))
    .catch(error => console.warn(`SENTRY MySQL is not connected yet (${error.code || error.message}). Run db/schema.sql and check .env.`));
});
