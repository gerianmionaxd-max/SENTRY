/*
 * SENTRY database bridge.
 * The UI keeps its existing synchronous render model, while every write is
 * mirrored to the MySQL API. On startup the API is preferred; if the API is
 * unavailable, the browser store remains a safe offline fallback.
 */
(function () {
  const queues = Object.create(null);
  const json = value => JSON.stringify(value);

  async function request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    if (!response.ok) throw new Error((await response.text()) || `HTTP ${response.status}`);
    return response.json();
  }

  function enqueue(name, task) {
    queues[name] = (queues[name] || Promise.resolve())
      .catch(() => undefined)
      .then(task)
      .catch(error => {
        console.warn(`[SENTRY] MySQL sync failed for ${name}; local data was retained.`, error.message);
        return null;
      });
    return queues[name];
  }

  function localJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }

  function putLocal(key, value) {
    try { localStorage.setItem(key, json(value)); } catch { /* private browsing */ }
  }

  function hasObjectValues(value) {
    return value && typeof value === 'object' && Object.keys(value).length > 0;
  }

  async function hydrate() {
    let remote;
    try {
      remote = await request('/api/bootstrap');
    } catch (error) {
      console.warn('[SENTRY] MySQL API unavailable; using local browser data.', error.message);
      return false;
    }

    const localEmployees = localJson('sentryUserAccounts', []);
    const localAttendance = localJson('sentryAttendanceLogs', {});
    const localSalary = localJson('sentryGuardSalaryProfiles', {});
    const localAdjustments = localJson('sentryPayrollAdjustments', []);
    const localRuns = localJson('sentryPayrollRuns', []);

    if (remote.employees?.length || !localEmployees.length) putLocal('sentryUserAccounts', remote.employees || []);
    else enqueue('employees', () => request('/api/employees/sync', { method: 'PUT', body: json(localEmployees) }));

    if (hasObjectValues(remote.attendanceLogs) || !hasObjectValues(localAttendance)) putLocal('sentryAttendanceLogs', remote.attendanceLogs || {});
    else enqueue('attendance', () => afterEmployees(() => request('/api/attendance/sync', { method: 'PUT', body: json(localAttendance) })));

    if (hasObjectValues(remote.salaryProfiles) || !hasObjectValues(localSalary)) putLocal('sentryGuardSalaryProfiles', remote.salaryProfiles || {});
    else enqueue('salary', () => afterEmployees(() => request('/api/salary/sync', { method: 'PUT', body: json(localSalary) })));

    if (remote.payrollAdjustments?.length || !localAdjustments.length) putLocal('sentryPayrollAdjustments', remote.payrollAdjustments || []);
    else enqueue('adjustments', () => afterEmployees(() => request('/api/adjustments/sync', { method: 'PUT', body: json(localAdjustments) })));

    if (remote.payrollRuns?.length || !localRuns.length) putLocal('sentryPayrollRuns', remote.payrollRuns || []);
    else enqueue('payrollRuns', () => request('/api/payroll-runs/sync', { method: 'PUT', body: json(localRuns) }));

    window.dispatchEvent(new CustomEvent('sentry:database-ready'));
    return true;
  }

  const afterEmployees = task => (queues.employees || Promise.resolve()).then(task);

  window.SentryDB = {
    hydrate,
    syncEmployees: employees => enqueue('employees', () => request('/api/employees/sync', { method: 'PUT', body: json(employees) })),
    createEmployee: employee => enqueue('employees', () => request('/api/employees', { method: 'POST', body: json(employee) })),
    updateEmployee: employee => enqueue('employees', () => request(`/api/employees/${encodeURIComponent(employee.userId)}`, { method: 'PUT', body: json(employee) })),
    deleteEmployee: userId => enqueue('employees', () => request(`/api/employees/${encodeURIComponent(userId)}`, { method: 'DELETE' })),
    syncAttendance: logs => enqueue('attendance', () => afterEmployees(() => request('/api/attendance/sync', { method: 'PUT', body: json(logs) }))),
    syncSalaryProfiles: profiles => enqueue('salary', () => afterEmployees(() => request('/api/salary/sync', { method: 'PUT', body: json(profiles) }))),
    syncAdjustments: adjustments => enqueue('adjustments', () => afterEmployees(() => request('/api/adjustments/sync', { method: 'PUT', body: json(adjustments) }))),
    syncPayrollRuns: runs => enqueue('payrollRuns', () => request('/api/payroll-runs/sync', { method: 'PUT', body: json(runs) })),
  };
})();
