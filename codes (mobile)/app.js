/*
 * SENTRY Guard app interactions.
 * Linked to the office dashboard through the shared account store
 * (localStorage "sentryUserAccounts"): guards register on the web,
 * the admin approves them, then they log in here with email + password.
 * NOTE: both pages must run on the same origin (same Live Server /
 * localhost port) for the browser to share the account store.
 */


/* ------------------------------------------------------------------
   Shared store + schedule constants
------------------------------------------------------------------ */

const USER_ACCOUNTS_KEY = 'sentryUserAccounts';
const SESSION_KEY = 'sentryGuardSession';
const SHIFT_START_MINUTES = 7 * 60;          // 07:00 AM
const QR_TTL_MS = 30 * 1000;                 // dynamic code lifetime

const STATUS_TEXT = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  today: 'Today',
};

const AVATAR_COLORS = [
  ['#eaf0ff', '#315ce9'], ['#e6f7ee', '#1d7a4c'], ['#fff4dc', '#a56a0a'],
  ['#f1edff', '#7659df'], ['#e0f5f6', '#0f7d87'], ['#ffeff1', '#c04d5a'],
];

let guard = null;        // linked web account of the logged-in guard
let weekCache = null;    // this account's sample history (stable per guard)
let todayState = null;   // today's live time-in/out for this guard


/* ------------------------------------------------------------------
   Small helpers
------------------------------------------------------------------ */

const $ = selector => document.querySelector(selector);

function readAccounts() {
  try {
    return JSON.parse(localStorage.getItem(USER_ACCOUNTS_KEY) || '[]');
  } catch {
    return [];
  }
}

/* Any PH mobile shape (+639…, 09…, spaced or not) -> +63 917 555 0156 */
function formatPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  let local = digits;
  if (digits.length === 12 && digits.startsWith('63')) local = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) local = digits.slice(1);
  if (/^9\d{9}$/.test(local)) return `+63 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  return phone || '';
}

function displayNameOf(account) {
  if (account.firstName) {
    return [account.firstName, account.middleName, account.lastName].filter(Boolean).join(' ');
  }
  return account.username || account.email;
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function todayStoreKey() {
  return `sentryGuardToday_${guard.userId}`;
}

function readToday() {
  try {
    const saved = JSON.parse(localStorage.getItem(todayStoreKey()) || 'null');
    if (saved && saved.key === todayKey()) return saved;
  } catch { /* corrupted entry: start fresh */ }
  return { key: todayKey(), in: null, out: null };
}

function saveToday() {
  localStorage.setItem(todayStoreKey(), JSON.stringify(todayState));
}

function formatTime(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${suffix}`;
}

function formatDay(date) {
  return date.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
}

function minsToLabel(totalMinutes) {
  const suffix = totalMinutes >= 12 * 60 ? 'PM' : 'AM';
  const hours = totalMinutes / 60 % 12 || 12;
  return `${String(Math.floor(hours)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')} ${suffix}`;
}

/* Deterministic per-guard values, so every account sees stable data */
function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let mix = Math.imul(state ^ (state >>> 15), 1 | state);
    mix = (mix + Math.imul(mix ^ (mix >>> 7), 61 | mix)) ^ mix;
    return ((mix ^ (mix >>> 14)) >>> 0) / 4294967296;
  };
}

/* Sample 6-day history with one late and one absent day per guard */
function pastWeek() {
  if (weekCache) return weekCache;
  const rand = mulberry32(hashString(guard.userId));
  const pick = () => Math.floor(rand() * 6);
  const lateDay = pick();
  let absentDay = pick();
  if (absentDay === lateDay) absentDay = (absentDay + 3) % 6;

  weekCache = Array.from({ length: 6 }, (_, index) => {
    const daysAgo = index + 1;
    if (daysAgo - 1 === absentDay) return [daysAgo, null, null, 'absent'];
    const jitter = () => Math.floor(rand() * 14) - 7;
    const late = daysAgo - 1 === lateDay;
    return [
      daysAgo,
      minsToLabel((late ? 7 * 60 + 3 : 6 * 60 + 42) + jitter()),
      minsToLabel(15 * 60 + jitter()),
      late ? 'late' : 'present',
    ];
  });
  return weekCache;
}

let toastTimer;
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2600);
}


/* ------------------------------------------------------------------
   Linked login / logout (web-approved Security accounts)
------------------------------------------------------------------ */

function showView(name) {
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  $(`#view-${name}`).classList.add('active');
  document.querySelectorAll('.tabbar button').forEach(button => {
    button.classList.toggle('active', button.dataset.view === name);
  });
  $('.views').scrollTop = 0;
}

function rejectLogin(message) {
  const form = $('#loginForm');
  const error = $('#loginError');
  error.textContent = message;
  error.hidden = false;
  form.classList.remove('shake');
  void form.offsetWidth; // restart the shake animation
  form.classList.add('shake');
}

function currentPostLabel() {
  return [guard.post, guard.assignment].filter(Boolean).join(' · ') || 'Not yet assigned';
}

function postHistoryKey() {
  return `sentryGuardPosts_${guard.userId}`;
}

function readPostHistory() {
  try {
    const list = JSON.parse(localStorage.getItem(postHistoryKey()) || '[]');
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

/* Snapshot today's post so past record cards keep the post they had */
function snapshotTodayPost() {
  if (!guard) return;
  const key = todayKey();
  const history = readPostHistory().filter(entry => entry.key !== key);
  history.push({ key, post: guard.post || '', assignment: guard.assignment || '' });
  try {
    localStorage.setItem(postHistoryKey(), JSON.stringify(history.slice(-60)));
  } catch { /* storage blocked: records fall back gracefully */ }
}

/* The post a given day had: snapshot wins, today falls back to the live
   post, pre-feature days honestly show an em dash */
function postLabelFor(dayKey) {
  const snap = readPostHistory().find(entry => entry.key === dayKey);
  if (snap) return [snap.post, snap.assignment].filter(Boolean).join(' · ') || 'Not yet assigned';
  return dayKey === todayKey() ? currentPostLabel() : '—';
}

/* Re-read our account after HR edits it elsewhere: storage events fire
   live from other tabs, visibility changes cover coming back to this one */
function refreshAccount() {
  if (!guard) return;
  const fresh = readAccounts().find(item => item.userId === guard.userId);
  if (!fresh || fresh.status !== 'Active') return;
  const before = currentPostLabel();
  guard = fresh;
  snapshotTodayPost();
  const after = currentPostLabel();
  applyIdentity();
  renderAll();
  if (before !== after) {
    toast(after === 'Not yet assigned'
      ? 'Your assigned post was removed.'
      : `Your assigned post is now ${after}.`);
  }
}

function applyIdentity() {
  const name = displayNameOf(guard);
  const initials = name.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase() || '··';
  const [bg, fg] = AVATAR_COLORS[hashString(guard.userId) % AVATAR_COLORS.length];

  ['#homeAvatar', '#profileAvatar'].forEach(selector => {
    const avatar = $(selector);
    avatar.textContent = initials;
    avatar.style.background = bg;
    avatar.style.color = fg;
  });

  $('#homeName').textContent = name;
  $('#profileName').textContent = name;
  $('#profileSub').textContent = `${guard.userId} · Verified guard`;
  $('#qrGuardLine').textContent = `${guard.userId} · ${name}`;

  $('#dId').textContent = guard.userId;
  $('#dDept').textContent = guard.department || 'Security';
  $('#dPost').textContent = currentPostLabel();
  $('#statusPost').textContent = currentPostLabel();
  $('#dPhone').textContent = guard.phone ? formatPhone(guard.phone) : '—';
  $('#dEmail').textContent = guard.email;
  $('#dBirth').textContent = guard.birthday || '—';
  const locality = [guard.barangay || guard.district, guard.city].filter(Boolean).join(', ');
  const cityPostal = [locality, guard.postal].filter(Boolean).join(' ');
  $('#dAddr').textContent = [guard.street, cityPostal, guard.country].filter(Boolean).join(', ') || '—';
}

function enterApp() {
  weekCache = null;
  todayState = readToday();
  snapshotTodayPost();
  applyIdentity();
  $('#tabbar').hidden = false;
  showView('home');
  renderAll();
  initQrState();
}

function initAuth() {
  const form = $('#loginForm');

  form.addEventListener('submit', event => {
    event.preventDefault();
    const email = $('#guardEmail').value.trim().toLowerCase();
    const password = $('#guardPin').value;
    const account = readAccounts().find(item => (item.email || '').toLowerCase() === email);

    if (!email || !password) return rejectLogin('Enter your email address and password.');
    if (!account) {
      return rejectLogin('No account found for this email. Register on the office dashboard first.');
    }
    if (account.password !== password) return rejectLogin('Incorrect password. Please try again.');
    if (account.status === 'Pending') {
      return rejectLogin('Your account is awaiting administrator approval.');
    }
    if (account.status !== 'Active') {
      return rejectLogin('Your account is inactive. Please contact your administrator.');
    }
    if (account.department !== 'Security') {
      return rejectLogin('This app is for Security guards — HR and Payroll accounts use the office dashboard.');
    }

    $('#loginError').hidden = true;
    guard = account;
    sessionStorage.setItem(SESSION_KEY, account.userId);
    enterApp();
    toast(`Welcome back, ${(account.firstName || 'Guard')}!`);
  });

  $('#logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    guard = null;
    stopQrLoop();
    $('#guardPin').value = '';
    $('#loginError').hidden = true;
    $('#tabbar').hidden = true;
    showView('login');
  });

  /* Restore an in-progress session after reload */
  const sessionId = sessionStorage.getItem(SESSION_KEY);
  if (sessionId) {
    const account = readAccounts().find(item => item.userId === sessionId);
    if (account && account.status === 'Active' && account.department === 'Security') {
      guard = account;
      enterApp();
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }
}


/* ------------------------------------------------------------------
   Attendance state + records
------------------------------------------------------------------ */

function minutesOf(isoDate) {
  const date = new Date(isoDate);
  return date.getHours() * 60 + date.getMinutes();
}

function todayStatus() {
  if (todayState.out) return { title: 'Shift completed', pill: '● Completed', mode: 'done' };
  if (todayState.in) {
    return minutesOf(todayState.in) > SHIFT_START_MINUTES
      ? { title: 'On duty — late arrival', pill: '● Late', mode: 'late' }
      : { title: 'On duty', pill: '● On duty', mode: 'on' };
  }
  return { title: 'Not timed in', pill: '● Off duty', mode: '' };
}

function recordRow(dateLabel, timeIn, timeOut, status, highlight = false, postLabel = '') {
  const hours = (timeIn !== '—' && timeOut !== '—') ? '8h 00m' : '—';
  return `
    <article class="record-card${highlight ? ' today' : ''}">
      <div class="record-top">
        <b>${dateLabel}</b>
        <span class="mini-pill ${status}">${STATUS_TEXT[status]}</span>
      </div>
      <div class="record-times">
        <div><span>TIME IN</span><b>${timeIn}</b></div>
        <div><span>TIME OUT</span><b>${timeOut}</b></div>
        <div><span>HOURS</span><b>${hours}</b></div>
      </div>
      <div class="record-post"><span>POST</span><b>${postLabel}</b></div>
    </article>`;
}

function recentRow(date, timeIn, status) {
  return `
    <div class="att-row">
      <div class="att-date"><b>${date.getDate()}</b><span>${date.toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase()}</span></div>
      <div><b>In ${timeIn}</b><small>${formatDay(date)}</small></div>
      <span class="mini-pill ${status}">${STATUS_TEXT[status]}</span>
    </div>`;
}

function countWeek() {
  let present = 0, late = 0, absent = 0;
  pastWeek().forEach(([, , , status]) => {
    if (status === 'present') present += 1;
    else if (status === 'late') late += 1;
    else absent += 1;
  });
  if (todayState.in) (minutesOf(todayState.in) > SHIFT_START_MINUTES ? late += 1 : present += 1);
  return { present, late, absent };
}

function renderHome() {
  const status = todayStatus();
  const now = new Date();

  $('#greeting').textContent =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  $('#todayLabel').textContent = now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  $('#todayStatus').textContent = status.title;

  const pill = $('#todayPill');
  pill.textContent = status.pill;
  pill.className = `status-pill ${status.mode}`;
  const profilePill = $('#profilePill');
  profilePill.textContent = status.pill;
  profilePill.className = `status-pill ${status.mode}`;

  $('#timeInLabel').textContent = todayState.in ? formatTime(new Date(todayState.in)) : '--:--';
  $('#timeOutLabel').textContent = todayState.out ? formatTime(new Date(todayState.out)) : '--:--';

  /* Shift progress between time-in and 03:00 PM */
  let progress = 0;
  let note = 'Show your QR code to personnel to time in.';
  if (todayState.in) {
    const start = new Date(todayState.in).getTime();
    const end = new Date(now);
    end.setHours(15, 0, 0, 0);
    progress = Math.min(100, Math.max(4, ((now - start) / (end - start)) * 100));
    note = todayState.out
      ? `Shift finished at ${formatTime(new Date(todayState.out))}. See you tomorrow!`
      : 'You are on duty. Time out by showing your QR again.';
  }
  $('#shiftFill').style.width = `${progress}%`;
  $('#shiftNote').textContent = note;

  /* Last three days for the home preview */
  $('#recentList').innerHTML = pastWeek().slice(0, 3).map(([ago, timeIn, , status]) => {
    const date = new Date();
    date.setDate(date.getDate() - ago);
    return recentRow(date, timeIn || '—', status);
  }).join('');

  /* Profile week summary */
  const { present, late, absent } = countWeek();
  const tracked = present + late + absent;
  $('#weekPresent').textContent = present;
  $('#weekLate').textContent = late;
  $('#weekRate').textContent = tracked ? `${Math.round(((present + late) / tracked) * 100)}%` : '—';
}

function renderRecords() {
  const cards = [];
  const now = new Date();

  const inLabel = todayState.in ? formatTime(new Date(todayState.in)) : '—';
  const outLabel = todayState.out ? formatTime(new Date(todayState.out)) : '—';
  const status = todayState.in
    ? (minutesOf(todayState.in) > SHIFT_START_MINUTES ? 'late' : 'present')
    : 'today';
  cards.push(recordRow(`Today · ${formatDay(now)}`, inLabel, outLabel, status, true, postLabelFor(todayKey())));

  pastWeek().forEach(([ago, timeIn, timeOut, recordStatus]) => {
    const date = new Date();
    date.setDate(date.getDate() - ago);
    cards.push(recordRow(formatDay(date), timeIn || '—', timeOut || '—', recordStatus, false, postLabelFor(todayKey(date))));
  });
  $('#recordList').innerHTML = cards.join('');

  const { present, late, absent } = countWeek();
  $('#sumPresent').textContent = present;
  $('#sumLate').textContent = late;
  $('#sumAbsent').textContent = absent;
}

function renderAll() {
  todayState = readToday();
  renderHome();
  renderRecords();
}


/* ------------------------------------------------------------------
   Dynamic QR: fresh code every 30s; freezes with a success pop
   once personnel scan it.
------------------------------------------------------------------ */

const RING_LENGTH = 2 * Math.PI * 26;
let qrDeadline = 0;
let qrToken = '';
let qrTimer;

function newToken() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 6; i += 1) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return token;
}

function drawQr() {
  if (typeof qrcode !== 'function') {
    $('#qrBox').innerHTML = '<p>QR library missing.</p>';
    return;
  }
  const payload = JSON.stringify({
    app: 'sentry-guard', v: 1, guard: guard.userId, token: qrToken, exp: qrDeadline,
  });
  const qr = qrcode(0, 'M');
  qr.addData(payload);
  qr.make();
  $('#qrBox').innerHTML = qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true });
  $('#qrBox svg').setAttribute('width', '200');
  $('#qrBox svg').setAttribute('height', '200');
}

function refreshQr() {
  qrToken = newToken();
  qrDeadline = Date.now() + QR_TTL_MS;
  $('#qrToken').textContent = qrToken;
  drawQr();
}

/* Scanned state: stop the countdown, pop the green check over the code */
function setScannedUI(scanned, note = '') {
  $('#qrSuccess').hidden = !scanned;
  $('#simulateScan').hidden = scanned;
  $('#newCodeBtn').hidden = !scanned;
  $('#qrScanline').style.display = scanned ? 'none' : '';

  const ring = $('#qrRing');
  if (scanned) {
    $('#qrSuccessNote').textContent = note;
    $('#qrSeconds').textContent = '✓';
    $('#qrExpiry').textContent = 'Verified · single-use code';
    ring.style.strokeDashoffset = 0;
    ring.style.stroke = '#2dc576';
    $('.qr-count').classList.remove('urgent');
  } else {
    ring.style.stroke = '';
  }
}

function tickQr() {
  const remaining = qrDeadline - Date.now();
  if (remaining <= 0) {
    refreshQr(); // unscanned code expired: issue a fresh one
    return;
  }
  const seconds = Math.ceil(remaining / 1000);
  $('#qrSeconds').textContent = seconds;
  $('#qrExpiry').textContent = `Refreshes in ${seconds}s · single use`;
  $('#qrRing').style.strokeDashoffset = RING_LENGTH * (1 - remaining / QR_TTL_MS);
  $('.qr-count').classList.toggle('urgent', seconds <= 6);
}

/* Day already completed (e.g. returning after time-out): show the success
   state instead of generating a code nobody can scan */
function initQrState() {
  if (todayState.out) {
    qrToken = todayState.token || newToken();
    qrDeadline = Date.now();
    $('#qrToken').textContent = qrToken;
    drawQr();
    stopQrLoop();
    setScannedUI(true, `Time-out recorded · ${formatTime(new Date(todayState.out))}`);
    $('#newCodeBtn').hidden = true;
  } else {
    startQrLoop();
  }
}

function startQrLoop() {
  stopQrLoop();
  setScannedUI(false);
  $('#qrRing').style.strokeDasharray = RING_LENGTH;
  refreshQr();
  tickQr();
  qrTimer = setInterval(tickQr, 200);
}

function stopQrLoop() {
  clearInterval(qrTimer);
}

function initScannerDemo() {
  $('#simulateScan').addEventListener('click', () => {
    const now = new Date();
    todayState = readToday();

    if (!todayState.in) {
      todayState.in = now.toISOString();
      todayState.token = qrToken;
      const late = minutesOf(todayState.in) > SHIFT_START_MINUTES;
      saveToday();
      renderHome();
      renderRecords();
      stopQrLoop(); // scanned: freeze the timer, the code is spent
      setScannedUI(true, `${late ? 'Late time-in' : 'Time-in'} recorded · ${formatTime(now)}`);
      toast(late ? 'Late time-in recorded by personnel.' : 'Time-in recorded by personnel.');
    } else if (!todayState.out) {
      todayState.out = now.toISOString();
      todayState.token = qrToken;
      saveToday();
      renderHome();
      renderRecords();
      stopQrLoop();
      setScannedUI(true, `Time-out recorded · ${formatTime(now)}`);
      $('#newCodeBtn').hidden = true;
      toast('Time-out recorded by personnel. Good work today!');
    } else {
      toast('Attendance already completed for today.');
    }
  });

  /* After a successful scan the guard needs a fresh code for time-out */
  $('#newCodeBtn').addEventListener('click', () => {
    startQrLoop();
    toast('New code generated.');
  });
}


/* ------------------------------------------------------------------
   Navigation, clock and start-up
------------------------------------------------------------------ */

function initNavigation() {
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => showView(button.dataset.view));
  });
  document.querySelectorAll('[data-goto]').forEach(button => {
    button.addEventListener('click', () => showView(button.dataset.goto));
  });
}

function initClock() {
  const update = () => {
    const now = new Date();
    $('#statusTime').textContent = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  update();
  setInterval(update, 10 * 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initAuth();
  initNavigation();
  initScannerDemo();
  window.addEventListener('storage', event => {
    if (event.key === USER_ACCOUNTS_KEY) refreshAccount();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshAccount();
  });
});
