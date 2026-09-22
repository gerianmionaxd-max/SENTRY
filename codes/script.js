/*
 * Sentry attendance dashboard interactions.
 * Client-side SENTRY dashboard interactions.
 */


/* ------------------------------------------------------------------
   Static application data
------------------------------------------------------------------ */

const GUARDS = {};


const HR_ACTIONS = {
  add: 'Add new guard / employee',
  edit: 'Edit employee information',
  status: 'Activate / deactivate employee',
  id: 'Assign employee ID',
  schedule: 'Manage schedules / shifts',
  exceptions: 'Review late / absent records',
  report: 'Generate attendance report',
  correct: 'Correct attendance record',
};

const PAYROLL_ACTIONS = {
  validated: 'Validated attendance data',
  overtime: 'Overtime and leave adjustments',
  salary: 'Manage Guard Salaries',
  reports: 'Generate payroll-ready report',
  run: 'Review payroll run',
};

/* Empty by default: HR/payroll dialogs use real stored staff records only. */
const HR_ACTION_RECORDS = {};

const PAYROLL_ACTION_RECORDS = {};

/* ------------------------------------------------------------------
   Composite address data: country -> region -> city -> barangay.
   Philippines entries map region -> city -> barangay list; other
   countries map region -> city list (barangay becomes an optional
   free-text district field for those).
------------------------------------------------------------------ */

const ADDRESS_DATA = {
  Philippines: {
    'Metro Manila (NCR)': {
      'Quezon City': ['Commonwealth', 'Batasan Hills', 'Payatas'],
      'Manila': ['Sampaloc', 'Tondo', 'Quiapo'],
      'Makati': ['Bel-Air', 'Poblacion', 'Guadalupe Nuevo'],
      'Caloocan': ['Bagong Barrio', 'Camarin', 'Tala'],
      'Pasig': ['Kapitolyo', 'Rosario', 'Ugong'],
      'Taguig': ['Ususan', 'Western Bicutan', 'Pinagsama'],
    },
    'Ilocos Region (Region I)': {
      'Laoag City': ['San Lorenzo', 'Sta. Joaquina', 'Nalbo'],
      'Vigan City': ['Beddeng Daya', 'Cabaroan', 'Mindoro'],
      'San Fernando City': ['Catbangen', 'Pagdaraoan', 'Tanqui'],
      'Dagupan City': ['Pantal', 'Lucao', 'Bonuan Gueset'],
      'Batac City': ['Baay', 'Bungon', 'San Mateo'],
    },
    'Cagayan Valley (Region II)': {
      'Tuguegarao City': ['Annafunan', 'Carig Sur', 'Centro 01'],
      'Ilagan City': ['Alibagu', 'Centro Poblacion', 'San Vicente'],
      'Cauayan City': ['District I Poblacion', 'San Fermin', 'Villa Luna'],
      'Santiago City': ['Centro East', 'Divisoria', 'Mabini'],
    },
    'Central Luzon (Region III)': {
      'San Fernando': ['Del Pilar', 'Dolores', 'San Jose'],
      'Angeles City': ['Balibago', 'Pampang', 'Cutcut'],
      'Cabanatuan City': ['Aduas Centro', 'Daan Sarile', 'Valle Cruz'],
      'Olongapo City': ['Barretto', 'East Bajac-Bajac', 'Pag-Asa'],
      'Malolos City': ['Bulihan', 'Mojon', 'Dakila'],
      'Tarlac City': ['San Roque', 'San Vicente', 'Armenia'],
    },
    'CALABARZON (Region IV-A)': {
      'Calamba City': ['Poblacion', 'Bucal', 'Real'],
      'Batangas City': ['Poblacion', 'Alangilan', 'Balete'],
      'Lucena City': ['Ibabang Dupay', 'Gulang-Gulang', 'Dalahican'],
      'Antipolo City': ['Dela Paz', 'San Jose', 'Cupang'],
      'Dasmariñas City': ['Sampaloc I', 'Langkaan I', 'San Agustin'],
      'Santa Rosa City': ['Balibago', 'Dila', 'Malusak'],
    },
    'MIMAROPA (Region IV-B)': {
      'Calapan City': ['Guinobatan', 'Lalud', 'San Vicente Norte'],
      'Puerto Princesa City': ['San Miguel', 'Tiniguiban', 'San Pedro'],
      'Odiongan': ['Dapawan', 'Poblacion', 'Progreso Este'],
      'Boac': ['Poblacion', 'Tampus', 'Malusak'],
      'Roxas': ['Barangay I Poblacion', 'San Manuel', 'New Barbacan'],
    },
    'Bicol Region (Region V)': {
      'Legazpi City': ['Bitano', 'Bonot', 'Pawa'],
      'Naga City': ['Concepcion Pequeña', 'Dayangdang', 'Abella'],
      'Sorsogon City': ['Salog', 'Sirangan', 'Talisay'],
      'Tabaco City': ['Bombon', 'San Lorenzo', 'Quinale'],
      'Iriga City': ['San Francisco', 'San Miguel', 'Perpetual Help'],
    },
    'Western Visayas (Region VI)': {
      'Iloilo City': ['Benedicto', 'Sambag', 'Our Lady of Lourdes'],
      'Roxas City': ['Poblacion I', 'Bolo', 'Dayao'],
      'Passi City': ['Poblacion Ilawod', 'Imbang Grande', 'Agdayao'],
      'Kalibo': ['Poblacion', 'Andagao', 'Tigayon'],
    },
    'Central Visayas (Region VII)': {
      'Cebu City': ['Lahug', 'Guadalupe', 'Mabolo'],
      'Mandaue City': ['Centro', 'Tipolo', 'Basak'],
      'Lapu-Lapu City': ['Pusok', 'Basak', 'Pajo'],
      'Tagbilaran City': ['Poblacion I', 'Dao', 'Manga'],
      'Talisay City': ['Poblacion', 'Tabunok', 'Lawaan'],
    },
    'Eastern Visayas (Region VIII)': {
      'Tacloban City': ['Barangay 34 Downtown', 'Barangay 62 Sagkahan', 'Barangay 90 San Jose'],
      'Ormoc City': ['Cogon', 'Punta', 'Linao'],
      'Catbalogan City': ['Canlapwas', 'Mercedes', 'Guinsorongan'],
      'Borongan City': ['Songco', 'Taboc', 'Alang-Alang'],
    },
    'Zamboanga Peninsula (Region IX)': {
      'Zamboanga City': ['Zone I Poblacion', 'Tetuan', 'Putik'],
      'Pagadian City': ['San Pedro', 'Santiago', 'Kawit'],
      'Dipolog City': ['Central', 'Dicayas', 'Olingan'],
      'Dapitan City': ['San Vicente', 'Banonong', 'Potungan'],
    },
    'Northern Mindanao (Region X)': {
      'Cagayan de Oro City': ['Carmen', 'Bulua', 'Lapasan'],
      'Iligan City': ['Poblacion', 'Pala-o', 'Tubod'],
      'Malaybalay City': ['Sumpong', 'Casisang', 'Aglayan'],
      'Valencia City': ['Poblacion', 'Lumbo', 'Bagontaas'],
      'Ozamiz City': ['Aguada', 'Manaka', 'Tinago'],
    },
    'Davao Region (Region XI)': {
      'Davao City': ['Buhangin', 'Matina Aplaya', 'Toril Poblacion'],
      'Tagum City': ['Visayan Village', 'Mankilam', 'Magugpo Poblacion'],
      'Mati City': ['Central', 'Sainz', 'Matiao'],
      'Digos City': ['Tres de Mayo', 'San Miguel', 'Aplaya'],
      'Panabo City': ['San Pedro', 'Cagangohan', 'New Visayas'],
    },
    'SOCCSKSARGEN (Region XII)': {
      'Koronadal City': ['General Paulino Santos', 'Rotonda', 'Zone III'],
      'General Santos City': ['Lagao', 'Apopong', 'Fatima'],
      'Tacurong City': ['Poblacion', 'New Isabela', 'San Pablo'],
      'Kidapawan City': ['Poblacion', 'Amas', 'Sudapin'],
    },
    'Caraga (Region XIII)': {
      'Butuan City': ['Ampayon', 'Libertad', 'Villa Kananga'],
      'Surigao City': ['Taft', 'Washington', 'Sabang'],
      'Tandag City': ['Dagocdoc', 'Telaje', 'San Isidro'],
      'Cabadbaran City': ['Comagascas', 'Del Pilar', 'Mabini'],
      'Bayugan City': ['Poblacion', 'Taglatawan', 'Noli'],
    },
    'Cordillera (CAR)': {
      'Baguio City': ['A. Bonifacio-Caguioa-Rimando', 'Gibraltar', 'Session Road'],
      'Tabuk City': ['Dagupan Centro', 'Bulanao', 'Appas'],
      'La Trinidad': ['Poblacion', 'Balili', 'Pico'],
      'Bontoc': ['Poblacion', 'Samoki', 'Caluttit'],
    },
    'BARMM': {
      'Cotabato City': ['Rosary Heights IV', 'Poblacion', 'Tamontaka'],
      'Marawi City': ['Sabala Manao', 'Dansalan', 'Marinaut'],
      'Lamitan City': ['Colonia', 'Kulay Bato', 'Sengal'],
      'Jolo': ['Alat', 'San Raymundo', 'Asturias'],
    },
    'Negros Island Region (NIR)': {
      'Bacolod City': ['Villamonte', 'Tangub', 'Mandalagan'],
      'Dumaguete City': ['Piapi', 'Bantayan', 'Junob'],
      'Bais City': ['Barangay I Poblacion', 'Cambagahan', 'Sab-ahan'],
      'Bayawan City': ['Poblacion', 'Ubos', 'Villareal'],
      'Siquijor': ['Poblacion', 'Cangmunag', 'Pasihagon'],
    },
  },
  'United States': {
    'California': ['Los Angeles', 'San Francisco', 'San Diego'],
    'Texas': ['Houston', 'Dallas', 'Austin'],
    'Florida': ['Miami', 'Orlando', 'Tampa'],
    'New York': ['New York City', 'Buffalo', 'Rochester'],
  },
  'Canada': {
    'Ontario': ['Toronto', 'Ottawa', 'Mississauga'],
    'British Columbia': ['Vancouver', 'Surrey', 'Burnaby'],
    'Alberta': ['Calgary', 'Edmonton', 'Red Deer'],
    'Quebec': ['Montreal', 'Quebec City', 'Laval'],
  },
  'Australia': {
    'New South Wales': ['Sydney', 'Newcastle', 'Wollongong'],
    'Victoria': ['Melbourne', 'Geelong', 'Ballarat'],
    'Queensland': ['Brisbane', 'Gold Coast', 'Cairns'],
  },
  'Japan': {
    'Tokyo': ['Shinjuku', 'Shibuya', 'Shinagawa'],
    'Osaka': ['Osaka City', 'Sakai', 'Higashiosaka'],
    'Kanagawa': ['Yokohama', 'Kawasaki', 'Yokosuka'],
  },
  'United Kingdom': {
    'England': ['London', 'Manchester', 'Birmingham'],
    'Scotland': ['Glasgow', 'Edinburgh', 'Aberdeen'],
    'Wales': ['Cardiff', 'Swansea', 'Newport'],
  },
  'United Arab Emirates': {
    'Dubai': ['Deira', 'Bur Dubai', 'Jumeirah'],
    'Abu Dhabi': ['Abu Dhabi City', 'Al Ain', 'Madinat Zayed'],
    'Sharjah': ['Sharjah City', 'Khor Fakkan', 'Kalba'],
  },
};

/* True when a country's regions map cities to barangay lists (PH shape) */
function hasBarangays(country) {
  const regions = ADDRESS_DATA[country] || {};
  const first = Object.values(regions)[0];
  return !!first && typeof first === 'object' && !Array.isArray(first);
}

function fillSelect(select, options, placeholder) {
  select.innerHTML = `<option value="" selected disabled>${placeholder}</option>` +
    options.map(option => `<option>${option}</option>`).join('');
}

/* Cascading country -> region -> city -> barangay + birthday mask */
function initAddressCascade() {
  const form = $('#registrationForm');
  const country = form.elements.country;
  const region = form.elements.region;
  const city = form.elements.city;
  const barangay = form.elements.barangay;
  const district = form.elements.district;
  const label = $('#regBarangayLabel');
  const birthday = form.elements.birthday;

  const clearOwnError = control => {
    const field = control.closest('.field');
    if (field?.classList.contains('invalid')) clearFieldError(field);
  };

  /* Barangay dropdown (PH) or optional district text box (abroad) */
  const setDistrictMode = abroad => {
    barangay.hidden = abroad;
    barangay.disabled = abroad;
    district.hidden = !abroad;
    district.disabled = !abroad;
    label.htmlFor = abroad ? 'regDistrict' : 'regBarangay';
    label.innerHTML = abroad
      ? 'District / Suburb <span class="optional-tag">Optional</span>'
      : 'Barangay';
    if (abroad) barangay.selectedIndex = 0;
    else district.value = '';
  };

  fillSelect(country, Object.keys(ADDRESS_DATA), 'Select country');

  country.addEventListener('change', () => {
    fillSelect(region, Object.keys(ADDRESS_DATA[country.value]), 'Select region / state');
    region.disabled = false;
    fillSelect(city, [], 'Select a region first');
    city.disabled = true;
    fillSelect(barangay, [], 'Select a city first');
    barangay.disabled = true;
    setDistrictMode(!hasBarangays(country.value));
    [region, city, barangay].forEach(clearOwnError);
  });

  region.addEventListener('change', () => {
    const places = ADDRESS_DATA[country.value][region.value];
    fillSelect(city, Array.isArray(places) ? places : Object.keys(places), 'Select city / municipality');
    city.disabled = false;
    fillSelect(barangay, [], 'Select a city first');
    barangay.disabled = true;
    [city, barangay].forEach(clearOwnError);
  });

  city.addEventListener('change', () => {
    if (hasBarangays(country.value)) {
      fillSelect(barangay, ADDRESS_DATA[country.value][region.value][city.value], 'Select barangay');
      barangay.disabled = false;
    }
    clearOwnError(barangay);
  });

  /* Birthday auto-mask: digits become mm/dd/yy as you type */
  birthday.addEventListener('input', () => {
    const digits = birthday.value.replace(/\D/g, '').slice(0, 6);
    let masked = digits.slice(0, 2);
    if (digits.length > 2) masked += '/' + digits.slice(2, 4);
    if (digits.length > 4) masked += '/' + digits.slice(4, 6);
    birthday.value = masked;
  });
}

/* Restore the cascade to its pristine state (after a successful submit) */
function resetAddressCascade() {
  const form = $('#registrationForm');
  fillSelect(form.elements.country, Object.keys(ADDRESS_DATA), 'Select country');
  fillSelect(form.elements.region, [], 'Select a country first');
  form.elements.region.disabled = true;
  fillSelect(form.elements.city, [], 'Select a region first');
  form.elements.city.disabled = true;
  fillSelect(form.elements.barangay, [], 'Select a city first');
  form.elements.barangay.disabled = true;
  form.elements.barangay.hidden = false;
  form.elements.district.hidden = true;
  form.elements.district.disabled = true;
  const label = $('#regBarangayLabel');
  label.htmlFor = 'regBarangay';
  label.textContent = 'Barangay';
}


/* Actions that open the period/output report form */
const REPORT_ACTIONS = ['report', 'reports', 'run'];


/* ------------------------------------------------------------------
   Accounts (localStorage stands in for a backend in this prototype)
------------------------------------------------------------------ */

const USER_ACCOUNTS_KEY = 'sentryUserAccounts';
const LEGACY_PENDING_ACCOUNTS_KEY = 'sentryPendingAccountRequests';

/* Demo-only administrator account for this frontend prototype. */
const DEMO_ADMIN_ACCOUNT = {
  userId: 'ADMIN-001',
  username: 'admin',
  email: 'admin@sentry.local',
  password: 'admin123',
  status: 'Active',
  department: 'Administration',
  accessRights: ['Admin'],
};

const DEPARTMENT_ACCESS = {
  Security: ['Read', 'Write'],
  'Human Resources': ['Read', 'Write', 'Execute'],
  Payroll: ['Read', 'Write', 'Execute'],
};

function accessForDepartment(department) {
  return [...(DEPARTMENT_ACCESS[department] || ['Read'])];
}

function readStoredList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function getStoredAccounts() {
  const savedAccounts = readStoredList(USER_ACCOUNTS_KEY);
  return savedAccounts.length ? savedAccounts : readStoredList(LEGACY_PENDING_ACCOUNTS_KEY);
}

function saveStoredAccounts(accounts) {
  localStorage.setItem(USER_ACCOUNTS_KEY, JSON.stringify(accounts));
  localStorage.removeItem(LEGACY_PENDING_ACCOUNTS_KEY);
  syncDatabase('syncEmployees', accounts);
}

/* Guard IDs look like SG-2026-0242: "SG", the registration year and a
   4-digit user number that stays unique across staff guards. */
const GUARD_ID_PATTERN = /^SG-(\d{4})-(\d{4})$/;
const MOBILE_TODAY_KEY_PREFIX = 'sentryGuardToday_';
const MOBILE_POSTS_KEY_PREFIX = 'sentryGuardPosts_';
const ATTENDANCE_LOGS_KEY = 'sentryAttendanceLogs';
const PAYROLL_SALARY_KEY = 'sentryGuardSalaryProfiles';
const PAYROLL_RUNS_KEY = 'sentryPayrollRuns';
const PAYROLL_ADJUSTMENTS_KEY = 'sentryPayrollAdjustments';

/* MySQL is the durable store. These calls deliberately do not block the
   existing UI render path: the dashboard still works offline and the API
   client reports a sync failure without losing the local change. */
function syncDatabase(method, value) {
  try {
    const bridge = window.SentryDB;
    if (bridge && typeof bridge[method] === 'function') bridge[method](value);
  } catch (error) {
    console.warn('[SENTRY] database sync skipped', error);
  }
}

function usedGuardNumbers(extraAccounts = []) {
  const used = new Set();
  const collect = id => {
    const match = GUARD_ID_PATTERN.exec(id || '');
    if (match) used.add(Number(match[2]));
  };
  Object.values(GUARDS).forEach(guard => collect(guard.id));
  getStoredAccounts().forEach(account => collect(account.userId));
  extraAccounts.forEach(account => collect(account.userId));
  return used;
}

function nextGuardId(year, used = usedGuardNumbers()) {
  const next = (used.size ? Math.max(...used) : 0) + 1;
  used.add(next);
  return `SG-${year}-${String(next).padStart(4, '0')}`;
}

function registrationYearOf(account) {
  const year = new Date(account.requestedAt || Date.now()).getFullYear();
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

/* One-time upgrade: legacy USR-<timestamp> ids become SG-YYYY-NNNN so old
   staff accounts match the guard ID format. The guard's in-progress
   mobile day state moves to the new id when one exists. */
function migrateStoredAccounts() {
  let accounts = readStoredList(USER_ACCOUNTS_KEY);
  if (!accounts.length) accounts = readStoredList(LEGACY_PENDING_ACCOUNTS_KEY);
  if (!accounts.length) return;
  const used = usedGuardNumbers();
  let changed = false;
  accounts.forEach(account => {
    if (GUARD_ID_PATTERN.test(account.userId || '')) return;
    const oldId = account.userId;
    account.userId = nextGuardId(registrationYearOf(account), used);
    [MOBILE_TODAY_KEY_PREFIX, MOBILE_POSTS_KEY_PREFIX].forEach(prefix => {
      try {
        const saved = localStorage.getItem(prefix + oldId);
        if (saved !== null) {
          localStorage.setItem(prefix + account.userId, saved);
          localStorage.removeItem(prefix + oldId);
        }
      } catch { /* private mode: keep going without the carried state */ }
    });
    changed = true;
  });
  if (changed) saveStoredAccounts(accounts);
}


/* ------------------------------------------------------------------
   Small helpers
------------------------------------------------------------------ */

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
  return String(value).replace(/[&<>'"]/g, character => entities[character]);
}

function createToast(element) {
  let timeoutId;

  return message => {
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => element.classList.remove('show'), 2600);
  };
}

function closeWhenBackdropIsClicked(modal, close) {
  modal.addEventListener('click', event => {
    if (event.target === modal) close();
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* Newer accounts store a full name; older ones only had a username. */
function displayNameOf(account) {
  if (account.firstName) {
    return [account.firstName, account.middleName, account.lastName].filter(Boolean).join(' ');
  }
  return account.username || account.email;
}

/* Inline field errors, shown Google-style right below the offending input. */
function setFieldError(field, text) {
  const input = field.querySelector('input, select');
  const error = field.querySelector('.field-error-message');

  field.classList.add('invalid');
  input.setAttribute('aria-invalid', 'true');
  error.textContent = text;
  error.hidden = false;
}

function clearFieldError(field) {
  const input = field.querySelector('input, select');
  const error = field.querySelector('.field-error-message');

  field.classList.remove('invalid');
  if (input) input.removeAttribute('aria-invalid');
  if (error) error.hidden = true;
}

function renderRecordList(items) {
  const rows = items
    .map(([name, detail]) => `
      <div class="hr-record">
        <div><strong>${name}</strong><span>${detail}</span></div>
        <button type="button">Review</button>
      </div>`)
    .join('');

  return `<div class="hr-record-list">${rows}</div>`;
}


/* ------------------------------------------------------------------
   Registration form validation. Every check returns a friendly,
   Google-style message that appears under the specific field.
------------------------------------------------------------------ */

function validateRegistrationForm(form) {
  const entries = Object.fromEntries(new FormData(form));
  const clean = name => (entries[name] || '').trim();
  const errors = [];
  const flag = (name, text) => errors.push({ input: form.elements[name], text });

  const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/;
  const nameRule = 'Names can only use letters, spaces, hyphens and apostrophes.';

  if (!clean('firstName')) flag('firstName', 'Enter your first name.');
  else if (!namePattern.test(clean('firstName'))) flag('firstName', nameRule);

  if (clean('middleName') && !namePattern.test(clean('middleName'))) flag('middleName', nameRule);

  if (!clean('lastName')) flag('lastName', 'Enter your last name.');
  else if (!namePattern.test(clean('lastName'))) flag('lastName', nameRule);

  if (!clean('gender')) flag('gender', 'Select your gender.');

  /* PH mobile number: spaces/dashes are ignored, a leading 0 is dropped,
     then it must be 10 digits starting with 9 (e.g. 917 555 0182). */
  let phone = clean('phone').replace(/[\s-]/g, '');
  if (/^0\d{10}$/.test(phone)) phone = phone.slice(1);

  if (!phone) flag('phone', 'Enter your mobile number.');
  else if (/\D/.test(phone)) flag('phone', 'Use numbers only — no letters or symbols.');
  else if (phone.length !== 10 || !phone.startsWith('9')) {
    flag('phone', 'Enter a valid Philippine mobile number: 10 digits starting with 9 (e.g. 917 555 0182).');
  }

  /* Composite address: country -> region -> city -> barangay */
  const isPhilippines = clean('country') === 'Philippines';
  if (!clean('country')) flag('country', 'Select your country.');
  if (!clean('region')) flag('region', 'Select your region or state.');
  if (!clean('city')) flag('city', 'Select your city or municipality.');
  if (isPhilippines && !clean('barangay')) flag('barangay', 'Select your barangay.');

  const district = clean('district');
  if (!isPhilippines && district && !/^[A-Za-z0-9\s.'-]+$/.test(district)) {
    flag('district', 'Use letters, numbers, spaces and hyphens only.');
  }

  if (!clean('street')) flag('street', 'Enter your street or house number.');
  else if (clean('street').length < 4) flag('street', 'Street address looks too short.');

  const postal = clean('postal');
  if (!postal) flag('postal', 'Enter your postal code.');
  else if (isPhilippines && !/^\d{4}$/.test(postal)) {
    flag('postal', 'Enter your 4-digit postal code (e.g. 1800).');
  } else if (!isPhilippines && !/^[A-Za-z0-9][A-Za-z0-9 \-]{1,8}[A-Za-z0-9]$/.test(postal)) {
    flag('postal', 'Enter a valid postal or ZIP code.');
  }

  /* Birthday in mm/dd/yy: real date, age 18-100 (yy pivots on this year) */
  const birthday = clean('birthday');
  let birthDate = '';
  if (!birthday) flag('birthday', 'Enter your birthday.');
  else if (!/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{2}$/.test(birthday)) {
    flag('birthday', 'Use mm/dd/yy format (e.g. 04/15/98).');
  } else {
    const [month, day, shortYear] = birthday.split('/').map(Number);
    const fullYear = shortYear <= new Date().getFullYear() % 100 ? 2000 + shortYear : 1900 + shortYear;
    const date = new Date(fullYear, month - 1, day);
    const real = date.getFullYear() === fullYear && date.getMonth() === month - 1 && date.getDate() === day;
    if (!real) flag('birthday', 'Enter a real calendar date.');
    else {
      const now = new Date();
      let age = now.getFullYear() - fullYear;
      if ((now.getMonth() + 1) * 100 + now.getDate() < month * 100 + day) age -= 1;
      if (age < 18) flag('birthday', 'You must be at least 18 years old to register.');
      else if (age > 100) flag('birthday', 'Please check your birth year.');
      else birthDate = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  if (!clean('department')) flag('department', 'Select your department.');

  const email = clean('email');
  if (!email) flag('email', 'Enter your email address.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    flag('email', 'Enter a valid email address (e.g. name@example.com).');
  }

  const password = entries.password || '';
  if (!password) flag('password', 'Enter a password.');
  else if (password.length < 6) flag('password', 'Use 6 to 12 characters for your password.');
  else if (password.length > 12) flag('password', 'Passwords are limited to 12 characters.');

  /* Paint the results and land the user on the first problem. */
  $$('.field', form).forEach(clearFieldError);
  errors.forEach(({ input, text }) => setFieldError(input.closest('.field'), text));
  if (errors.length) {
    errors[0].input.focus({ preventScroll: true });
    errors[0].input.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  return {
    valid: errors.length === 0,
    details: {
      firstName: clean('firstName'),
      middleName: clean('middleName'),
      lastName: clean('lastName'),
      gender: clean('gender'),
      phone: phone ? `+63${phone}` : '',
      birthday,
      birthDate,
      country: clean('country'),
      region: clean('region'),
      city: clean('city'),
      barangay: clean('barangay'),
      district,
      street: clean('street'),
      postal: clean('postal'),
      department: clean('department'),
      email,
      password,
    },
  };
}


/* ------------------------------------------------------------------
   Sign-in screen
------------------------------------------------------------------ */

function initAuthentication() {
  const screen = $('#authScreen');
  const shell = $('.auth-shell', screen);
  const loginForm = $('#loginForm');
  const registrationForm = $('#registrationForm');
  const title = $('#authTitle');
  const copy = $('#authCopy');
  const switcher = $('#authSwitch');
  const message = $('#authMessage');

  const clearMessage = () => {
    message.textContent = '';
    message.classList.remove('success');
  };

  const showLogin = () => {
    shell.classList.remove('register-mode');
    title.textContent = 'Welcome back';
    copy.textContent = 'Sign in to access the attendance dashboard.';
    loginForm.hidden = false;
    registrationForm.hidden = true;
    switcher.innerHTML = 'Need a staff account? <button type="button">Request one</button>';
    clearMessage();
  };

  const showRegistration = () => {
    shell.classList.add('register-mode');
    title.textContent = 'Request a staff account';
    copy.textContent = 'Your request will be reviewed by an administrator.';
    loginForm.hidden = true;
    registrationForm.hidden = false;
    switcher.innerHTML = 'Already have an account? <button type="button">Log in</button>';
    clearMessage();
    $$('.field', registrationForm).forEach(clearFieldError);
  };

  switcher.addEventListener('click', event => {
    if (!event.target.matches('button')) return;
    (registrationForm.hidden ? showRegistration : showLogin)();
  });

  /* Errors disappear as soon as the user starts fixing the field */
  registrationForm.addEventListener('input', event => {
    const field = event.target.closest('.field');
    if (field?.classList.contains('invalid')) clearFieldError(field);
  });

  loginForm.addEventListener('submit', event => {
    event.preventDefault();

    const identity = $('#authIdentity').value.trim().toLowerCase();
    const password = $('#authPassword').value;
    const account = [...getStoredAccounts(), DEMO_ADMIN_ACCOUNT]
      .find(item => displayNameOf(item).toLowerCase() === identity || item.email.toLowerCase() === identity);

    if (!account || account.password !== password) {
      message.textContent = 'Invalid username/email or password.';
      return;
    }
    if (account.status === 'Pending') {
      message.textContent = 'Your account is awaiting administrator approval.';
      return;
    }
    if (account.status !== 'Active') {
      message.textContent = 'Your account is inactive. Please contact the administrator.';
      return;
    }
    if (account.expirationDate && account.expirationDate < today()) {
      message.textContent = 'Your account access has expired. Please contact the administrator.';
      return;
    }
    if (account.department === 'Security') {
      message.textContent = 'Security staff use the mobile attendance app. Please sign in on your assigned mobile device.';
      return;
    }

    const accessRights = account.accessRights || [];
    sessionStorage.setItem('sentryLoggedInUser', JSON.stringify({
      userId: account.userId,
      username: displayNameOf(account),
      accessRights,
    }));

    if ($('#rememberMe').checked) localStorage.setItem('sentryRememberedUser', displayNameOf(account));
    else localStorage.removeItem('sentryRememberedUser');

    $('#adminPanelNav').hidden = !accessRights.includes('Admin');
    screen.hidden = true;
  });

  registrationForm.addEventListener('submit', event => {
    event.preventDefault();

    const { valid, details } = validateRegistrationForm(registrationForm);
    if (!valid) {
      clearMessage();
      return;
    }

    const requests = getStoredAccounts();
    const existingAccount = requests.find(request =>
      request.email.toLowerCase() === details.email.toLowerCase());

    if (existingAccount?.status === 'Pending') {
      message.textContent = 'An account request for this email address is already waiting for approval.';
      return;
    }
    if (existingAccount?.status === 'Active') {
      message.textContent = 'An active account already uses this email address.';
      return;
    }

    const requestedAt = new Date().toISOString();
    if (existingAccount) {
      Object.assign(existingAccount, details, { status: 'Pending', requestedAt });
    } else {
      requests.push({ userId: nextGuardId(new Date().getFullYear()), ...details, status: 'Pending', requestedAt });
    }

    saveStoredAccounts(requests);
    registrationForm.reset();
    resetAddressCascade();
    $$('.field', registrationForm).forEach(clearFieldError);
    message.textContent = existingAccount
      ? 'Your account request was resubmitted. Please wait for administrator approval.'
      : 'Your account request was submitted. Please wait for administrator approval.';
    message.classList.add('success');
  });
}


/* ------------------------------------------------------------------
   Attendance filters and QR lookup
------------------------------------------------------------------ */

let activeAttendanceFilter = 'all';
const reportDates = {
  'dashboard-attendance': new Date(),
  'hr-attendance': new Date(),
  exceptions: new Date(),
};
let activeReportDateMode = 'hr-attendance';
let selectedAttendanceDate = new Date(reportDates[activeReportDateMode]);
let calendarDraftDate = new Date(selectedAttendanceDate);
let calendarViewDate = new Date(selectedAttendanceDate.getFullYear(), selectedAttendanceDate.getMonth(), 1);

function dateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDateInput(value) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function sameCalendarDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatAttendanceDate(date) {
  const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function updateAttendanceDateLabel() {
  const label = $('#attendanceDateLabel');
  if (label) label.textContent = formatAttendanceDate(selectedAttendanceDate);
}

function setReportDateMode(mode) {
  activeReportDateMode = mode;
  selectedAttendanceDate = new Date(reportDates[mode] || new Date());
  calendarDraftDate = new Date(selectedAttendanceDate);
  calendarViewDate = new Date(selectedAttendanceDate.getFullYear(), selectedAttendanceDate.getMonth(), 1);
  updateAttendanceDateLabel();
  renderAttendanceCalendar();
}

function renderAttendanceCalendar() {
  const calendar = $('#attendanceCalendar');
  if (!calendar) return;
  const monthLabel = $('#calendarMonthLabel');
  const daysGrid = $('#calendarDays');
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  monthLabel.textContent = calendarViewDate.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());
  const days = [];
  for (let index = 0; index < 42; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const outside = day.getMonth() !== month;
    const selected = sameCalendarDay(day, calendarDraftDate);
    const today = sameCalendarDay(day, new Date());
    days.push(`<button type="button" class="calendar-day${outside ? ' outside' : ''}${selected ? ' selected' : ''}${today ? ' today' : ''}" data-date="${dateInputValue(day)}">${day.getDate()}</button>`);
  }
  daysGrid.innerHTML = days.join('');
}

function closeAttendanceCalendar() {
  const calendar = $('#attendanceCalendar');
  if (calendar) calendar.hidden = true;
}

function applyAttendanceCalendar(toast) {
  selectedAttendanceDate = new Date(calendarDraftDate);
  reportDates[activeReportDateMode] = new Date(calendarDraftDate);
  closeAttendanceCalendar();
  updateAttendanceDateLabel();
  document.dispatchEvent(new CustomEvent('attendance-date-applied', { detail: { mode: activeReportDateMode } }));
  toast(`Showing records for ${$('#attendanceDateLabel').textContent}`);
}

function initAttendance(toast) {
  const filters = $$('.filter');
  const searchInput = $('#qrSearch');
  const dateButton = $('#attendanceDateButton');
  const calendar = $('#attendanceCalendar');

  const rows = () => $$('#attendanceRows tr[data-status]');
  const showRows = predicate => rows().forEach(row => { row.hidden = !predicate(row); });
  const activateFilter = activeFilter =>
    filters.forEach(filter => filter.classList.toggle('active', filter === activeFilter));

  filters.forEach(filter => filter.addEventListener('click', () => {
    activeAttendanceFilter = filter.dataset.filter;
    activateFilter(filter);
    const status = activeAttendanceFilter;
    showRows(row => status === 'all' || row.dataset.status === status);
  }));

  const searchByQr = () => {
    const query = searchInput.value.trim().toUpperCase();
    activateFilter(null);

    let matches = 0;
    showRows(row => {
      const isMatch = !query || row.dataset.qr.includes(query);
      matches += Number(isMatch);
      return isMatch;
    });

    toast(query
      ? (matches ? `${matches} guard record found for ${query}` : `No guard record found for ${query}`)
      : 'Showing all guard attendance records');
  };

  updateAttendanceDateLabel();
  renderAttendanceCalendar();
  if (dateButton && calendar) {
    dateButton.addEventListener('click', event => {
      event.stopPropagation();
      calendar.hidden = !calendar.hidden;
      calendarDraftDate = new Date(selectedAttendanceDate);
      calendarViewDate = new Date(selectedAttendanceDate.getFullYear(), selectedAttendanceDate.getMonth(), 1);
      renderAttendanceCalendar();
    });
    $('#calendarPrevMonth')?.addEventListener('click', event => {
      event.stopPropagation();
      calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
      renderAttendanceCalendar();
    });
    $('#calendarNextMonth')?.addEventListener('click', event => {
      event.stopPropagation();
      calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
      renderAttendanceCalendar();
    });
    $('#calendarDays')?.addEventListener('click', event => {
      event.stopPropagation();
      const button = event.target.closest('[data-date]');
      if (!button) return;
      calendarDraftDate = parseDateInput(button.dataset.date);
      calendarViewDate = new Date(calendarDraftDate.getFullYear(), calendarDraftDate.getMonth(), 1);
      renderAttendanceCalendar();
    });
    $('#calendarApply')?.addEventListener('click', event => {
      event.stopPropagation();
      applyAttendanceCalendar(toast);
    });
    document.addEventListener('click', event => {
      if (!calendar.hidden && !event.target.closest('.attendance-date-control')) closeAttendanceCalendar();
    });
  }

  $('#qrSearchBtn').addEventListener('click', searchByQr);
  searchInput.addEventListener('keydown', event => { if (event.key === 'Enter') searchByQr(); });
}


/* ------------------------------------------------------------------
   Live counters shared by every panel
------------------------------------------------------------------ */

function startOfWeekMonday(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  return start;
}

function renderAdminAttendanceTrend() {
  const chart = $('#adminAttendanceTrend');
  if (!chart) return;
  const start = startOfWeekMonday();
  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const records = collectTodayAttendance(date);
    const count = records.filter(record => record.hasScan).length;
    return { date, count };
  });
  const max = Math.max(...days.map(day => day.count), activeSecurityAccounts().length, 1);
  const hasData = days.some(day => day.count > 0);
  chart.innerHTML = days.map(day => {
    const height = hasData ? Math.max(6, Math.round((day.count / max) * 100)) : 0;
    return `<div class="trend-bar ${day.count ? '' : 'empty'}">
      <b>${day.count}</b>
      <i style="height:${height}%"></i>
      <span>${day.date.toLocaleDateString('en-PH', { weekday: 'short' })}</span>
    </div>`;
  }).join('');
}

function updateSystemCounts() {
  const rows = $$('#attendanceRows tr[data-status]');
  const countByStatus = status => rows.filter(row => row.dataset.status === status).length;

  const total = rows.length;
  const onDuty = countByStatus('present');
  const late = countByStatus('late');
  const absent = countByStatus('absent');
  const verified = Math.max(0, total - absent);
  const exceptions = late + absent;

  const accounts = getStoredAccounts();
  const activeAccounts = accounts.filter(account => account.status === 'Active').length;
  const activeSecurityCount = activeSecurityAccounts().length;
  const pendingAccounts = accounts.filter(account => account.status === 'Pending').length;

  const setText = (selector, value) => {
    const element = $(selector);
    if (element) element.textContent = value;
  };

  /* Attendance panel */
  setText('#allFilterCount', total);
  setText('#presentFilterCount', onDuty);
  setText('#lateFilterCount', late);
  setText('#absentFilterCount', absent);
  setText('#onDutyStat', onDuty);
  setText('#lateStat', late);
  setText('#absentStat', absent);
  setText('#verifiedStat', verified);
  setText('#verifiedRing', verified);

  const todayRecords = collectTodayAttendance();
  const flaggedToday = todayRecords.filter(record => record.exception);
  const lateToday = flaggedToday.filter(record => primaryIssueOf(record) === 'late').length;
  const missedToday = flaggedToday.filter(record => primaryIssueOf(record) === 'missed').length;
  const absentToday = flaggedToday.filter(record => primaryIssueOf(record) === 'absent').length;
  const issueParts = [];
  if (lateToday) issueParts.push(`${lateToday} late`);
  if (missedToday) issueParts.push(`${missedToday} missed`);
  if (absentToday) issueParts.push(`${absentToday} absent`);
  const exceptionNote = issueParts.length ? issueParts.join(' · ') : 'No exceptions';

  /* HR panel */
  setText('#hrRegisteredGuardCount', activeSecurityCount);
  setText('#hrExceptionCount', flaggedToday.length);
  setText('#hrExceptionNote', `${exceptionNote} today`);
  setText('#hrPendingAccountCount', pendingAccounts);

  /* Payroll panel */
  updatePayrollDashboard();

  /* Admin panel */
  setText('#adminAttendanceRate', `${total ? Math.round((onDuty / total) * 100) : 0}%`);
  setText('#adminAttendanceNote', `${onDuty} of ${total} guard${total === 1 ? '' : 's'} on duty`);
  setText('#adminOnDutyCount', onDuty);
  setText('#adminCoverageNote', `Of ${total} current guard${total === 1 ? '' : 's'}`);
  setText('#adminExceptionCount', flaggedToday.length);
  setText('#adminExceptionNote', exceptionNote);
  setText('#adminVerificationRate', `${total ? Math.round((verified / total) * 100) : 0}%`);
  setText('#adminVerificationNote', `${verified} of ${total} guard${total === 1 ? '' : 's'} checked in`);
  setText('#adminLateCount', lateToday);
  setText('#adminAbsentCount', absentToday);
  renderAdminAttendanceTrend();
}


/* Fixed post locations HR can assign guards to */
const POST_LOCATIONS = [
  'Trinitarian Centre',
  'Trinitarian Complex',
  'Macario-Catalina Building',
  'Triplex Grounds (Gate 1)',
  'Triplex Grounds (Gate 2)',
  'JTA Building',
  'SMO Office',
  'STVET Training Center',
  'Elementary Building',
  'Wildcats Gym',
  'GoodHoly Arcade',
];

/* Any PH mobile shape (+639…, 09…, spaced or not) -> +63 917 555 0156 */
function formatPhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  let local = digits;
  if (digits.length === 12 && digits.startsWith('63')) local = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) local = digits.slice(1);
  if (/^9\d{9}$/.test(local)) return `+63 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  return phone || '';
}


/* ------------------------------------------------------------------
   Today's attendance: approved staff accounts + live mobile QR states.
   Day shift starts at 7:00 AM; time-ins after 7:30 AM count as late.
------------------------------------------------------------------ */

const SHIFT_START_MINUTES = 7 * 60;
const LATE_GRACE_MINUTES = 30;

/* Same day-key format the mobile app stamps its QR states with */
function todayKeyLocal(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function timeLabelOf(date) {
  let hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} ${suffix}`;
}

function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

/* One record per guard for today, whether they scanned or not */
function activeSecurityAccounts() {
  return getStoredAccounts().filter(account => account.status === 'Active' && account.department === 'Security');
}

function currentPostLabelOf(account) {
  return [account.post, account.assignment].filter(Boolean).join(' · ') || 'Not yet assigned';
}

function simpleHash(text) {
  let hash = 0;
  String(text).split('').forEach(char => { hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0; });
  return Math.abs(hash);
}

function readAttendanceLogs() {
  try { return JSON.parse(localStorage.getItem(ATTENDANCE_LOGS_KEY) || '{}'); }
  catch { return {}; }
}

function saveAttendanceLogs(logs) {
  localStorage.setItem(ATTENDANCE_LOGS_KEY, JSON.stringify(logs));
  syncDatabase('syncAttendance', logs);
}

function rememberAttendanceLog(account, state) {
  if (!state?.key || (!state.in && !state.out)) return;
  const logs = readAttendanceLogs();
  logs[state.key] = logs[state.key] || {};
  logs[state.key][account.userId] = {
    in: state.in || null,
    out: state.out || null,
    token: state.token || '',
    post: account.post || '',
    assignment: account.assignment || '',
    savedAt: new Date().toISOString(),
  };
  saveAttendanceLogs(logs);
}

function storedAttendanceStateFor(account, key) {
  const logs = readAttendanceLogs();
  const saved = logs[key]?.[account.userId];
  return saved ? { key, ...saved } : null;
}

function attendanceStateFor(account, date = selectedAttendanceDate) {
  const key = todayKeyLocal(date);
  let liveState = null;
  try {
    liveState = JSON.parse(localStorage.getItem(MOBILE_TODAY_KEY_PREFIX + account.userId) || 'null');
  } catch { liveState = null; }
  if (liveState?.key) rememberAttendanceLog(account, liveState);

  const sameAsLive = liveState && liveState.key === key;
  const state = sameAsLive ? liveState : storedAttendanceStateFor(account, key);
  const inDate = state?.in ? new Date(state.in) : null;
  const outDate = state?.out ? new Date(state.out) : null;
  const validIn = inDate && !Number.isNaN(inDate.getTime());
  const validOut = outDate && !Number.isNaN(outDate.getTime());
  const late = !!validIn && minutesOfDay(inDate) > SHIFT_START_MINUTES + LATE_GRACE_MINUTES;

  return {
    account,
    name: displayNameOf(account),
    id: account.userId,
    post: state?.post || account.post || account.department || 'Security',
    assignment: state?.assignment || (account.post ? (account.assignment || account.department || 'Security') : 'Not yet assigned'),
    timeIn: validIn ? timeLabelOf(inDate) : '',
    timeOut: validOut ? timeLabelOf(outDate) : '',
    late,
    absent: !validIn && !validOut,
    completed: !!validIn && !!validOut,
    phone: account.phone || '',
    email: account.email || '',
  };
}

/* One record per approved Security guard for the selected date. The time-in/out
   values come from the same localStorage keys written by the mobile QR app. */
function collectTodayAttendance(date = new Date()) {
  const records = activeSecurityAccounts().map(account => attendanceStateFor(account, date));
  records.forEach(record => {
    record.missedIn = !record.timeIn && !!record.timeOut;
    record.missedOut = !!record.timeIn && !record.timeOut;
    record.hasScan = !!record.timeIn || !!record.timeOut;
    record.exception = record.absent || record.late || record.missedIn || record.missedOut;
  });
  return records;
}

function money(amount) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount) || 0);
}

function readSalaryProfiles() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PAYROLL_SALARY_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

function saveSalaryProfiles(profiles) {
  localStorage.setItem(PAYROLL_SALARY_KEY, JSON.stringify(profiles));
  syncDatabase('syncSalaryProfiles', profiles);
}

function salaryProfileFor(account) {
  const profiles = readSalaryProfiles();
  return profiles[account.userId] || null;
}

function normalizedSalaryProfile(account, raw = {}) {
  const monthlySalary = Math.max(0, Number(raw.monthlySalary) || 0);
  const workingDays = Math.max(1, Number(raw.workingDays) || 26);
  const shiftHours = Math.max(1, Number(raw.shiftHours) || 8);
  const overtimeMultiplier = Math.max(1, Number(raw.overtimeMultiplier) || 1.25);
  const allowances = Math.max(0, Number(raw.allowances) || 0);
  const deductions = Math.max(0, Number(raw.deductions) || 0);
  const dailyRate = monthlySalary / workingDays;
  const hourlyRate = dailyRate / shiftHours;
  return {
    userId: account.userId,
    monthlySalary,
    workingDays,
    shiftHours,
    overtimeMultiplier,
    allowances,
    deductions,
    dailyRate,
    hourlyRate,
    overtimeRate: hourlyRate * overtimeMultiplier,
    effectiveDate: raw.effectiveDate || today(),
    status: raw.status || 'Active',
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function currentPayrollPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end, label: `${start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}` };
}

function daysBetween(start, end) {
  const days = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function attendanceDurationHours(account, date) {
  const key = todayKeyLocal(date);
  const state = storedAttendanceStateFor(account, key);
  if (!state?.in || !state?.out) return 0;
  const start = new Date(state.in);
  const end = new Date(state.out);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0;
  return (end - start) / 36e5;
}

function readPayrollAdjustments() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PAYROLL_ADJUSTMENTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function savePayrollAdjustments(adjustments) {
  localStorage.setItem(PAYROLL_ADJUSTMENTS_KEY, JSON.stringify(adjustments));
  syncDatabase('syncAdjustments', adjustments);
}

function payrollAdjustmentEffect(account, profile, start, end) {
  const adjustments = readPayrollAdjustments().filter(item => {
    if (item.userId !== account.userId) return false;
    const stamp = new Date(item.date || item.createdAt || Date.now());
    return !Number.isNaN(stamp.getTime()) && stamp >= start && stamp <= end;
  });
  return adjustments.reduce((total, item) => {
    const amount = Number(item.amount) || 0;
    switch (item.type) {
      case 'Overtime hours': return total + (profile ? amount * profile.overtimeRate : 0);
      case 'Paid leave': return total + (item.unit === 'amount' || (!item.unit && amount > 31) ? amount : (profile ? amount * profile.dailyRate : 0));
      case 'Unpaid leave': return total - (item.unit === 'amount' || (!item.unit && amount > 31) ? amount : (profile ? amount * profile.dailyRate : 0));
      case 'Bonus': return total + amount;
      case 'Cash advance':
      case 'Other deduction': return total - amount;
      default: return total;
    }
  }, 0);
}

function adjustmentCountForPeriod(start, end) {
  return readPayrollAdjustments().filter(item => {
    const stamp = new Date(item.date || item.createdAt || Date.now());
    return !Number.isNaN(stamp.getTime()) && stamp >= start && stamp <= end;
  }).length;
}

function payrollRowsForPeriod(start = currentPayrollPeriod().start, end = new Date()) {
  const profiles = readSalaryProfiles();
  const days = daysBetween(start, end);
  return activeSecurityAccounts().map(account => {
    const profile = profiles[account.userId] ? normalizedSalaryProfile(account, profiles[account.userId]) : null;
    let paidDays = 0;
    let absentDays = 0;
    let lateMinutes = 0;
    let overtimeHours = 0;
    let validatedRecords = 0;
    days.forEach(day => {
      const record = attendanceStateFor(account, day);
      if (record.hasScan) validatedRecords += 1;
      if (record.hasScan && !record.missedIn) paidDays += 1;
      else absentDays += 1;
      if (record.late) {
        const state = storedAttendanceStateFor(account, todayKeyLocal(day));
        const inDate = state?.in ? new Date(state.in) : null;
        if (inDate && !Number.isNaN(inDate.getTime())) {
          lateMinutes += Math.max(0, minutesOfDay(inDate) - SHIFT_START_MINUTES - LATE_GRACE_MINUTES);
        }
      }
      const duration = attendanceDurationHours(account, day);
      if (profile && duration > profile.shiftHours) overtimeHours += duration - profile.shiftHours;
    });
    const basicPay = profile ? paidDays * profile.dailyRate : 0;
    const overtimePay = profile ? overtimeHours * profile.overtimeRate : 0;
    const lateDeduction = profile ? (lateMinutes / 60) * profile.hourlyRate : 0;
    const allowancePay = profile ? (profile.allowances * Math.min(paidDays, profile.workingDays) / profile.workingDays) : 0;
    const adjustmentPay = profile ? payrollAdjustmentEffect(account, profile, start, end) : 0;
    const positiveAdjustments = Math.max(0, adjustmentPay);
    const negativeAdjustments = Math.abs(Math.min(0, adjustmentPay));
    const grossPay = basicPay + overtimePay + allowancePay + positiveAdjustments;
    const totalDeductions = lateDeduction + (profile?.deductions || 0) + negativeAdjustments;
    const netPay = Math.max(0, grossPay - totalDeductions);
    return { account, profile, paidDays, absentDays, lateMinutes, overtimeHours, validatedRecords, basicPay, overtimePay, allowancePay, adjustmentPay, positiveAdjustments, negativeAdjustments, lateDeduction, totalDeductions, grossPay, netPay };
  });
}

function payrollSummary() {
  const period = currentPayrollPeriod();
  const effectiveEnd = new Date(Math.min(new Date().getTime(), period.end.getTime()));
  const rows = payrollRowsForPeriod(period.start, effectiveEnd);
  return {
    period,
    rows,
    profileCount: rows.filter(row => row.profile).length,
    guardCount: rows.length,
    validated: rows.reduce((sum, row) => sum + row.validatedRecords, 0),
    estimated: rows.reduce((sum, row) => sum + row.netPay, 0),
    missingProfiles: rows.filter(row => !row.profile).length,
    adjustmentCount: adjustmentCountForPeriod(period.start, effectiveEnd),
    reportCount: readStoredList(PAYROLL_RUNS_KEY).length,
  };
}

function renderPayrollRunGraph(summary) {
  const graph = $('#payrollRunGraph');
  const label = $('#payrollGraphSummary');
  if (!graph) return;
  const rows = summary.rows || [];
  if (!rows.length) {
    graph.innerHTML = '<div class="payroll-graph-empty">No approved Security guards yet.</div>';
    if (label) label.textContent = 'No active pay data';
    return;
  }
  const maxPay = Math.max(...rows.map(row => row.netPay), 1);
  const totalPaidDays = rows.reduce((sum, row) => sum + row.paidDays, 0);
  if (label) label.textContent = `${rows.length} guard${rows.length === 1 ? '' : 's'} · ${totalPaidDays} paid day${totalPaidDays === 1 ? '' : 's'}`;
  graph.innerHTML = rows.map(row => {
    const percent = row.netPay > 0 ? Math.max(8, Math.round((row.netPay / maxPay) * 100)) : 0;
    const missing = !row.profile;
    return `<div class="payroll-graph-row ${missing ? 'missing' : ''}">
      <div class="payroll-graph-meta">
        <strong>${escapeHtml(displayNameOf(row.account))}</strong>
        <span>${missing ? 'Salary profile needed' : `${row.paidDays} paid · ${row.absentDays} absent`}</span>
      </div>
      <div class="payroll-graph-track"><span style="width:${percent}%"></span></div>
      <b>${money(row.netPay)}</b>
    </div>`;
  }).join('');
}

function updatePayrollDashboard() {
  const summary = payrollSummary();
  const setText = (selector, value) => { const element = $(selector); if (element) element.textContent = value; };
  setText('#payrollCurrentPeriod', summary.period.label);
  setText('#payrollSalaryProfileCount', summary.profileCount);
  setText('#payrollSalaryTaskCount', summary.profileCount);
  setText('#payrollValidatedCount', summary.validated);
  setText('#payrollTaskCount', summary.validated);
  setText('#payrollEstimatedTotal', money(summary.estimated));
  setText('#payrollPeriodEstimate', money(summary.estimated));
  setText('#payrollEstimateNote', summary.missingProfiles ? `${summary.missingProfiles} guard${summary.missingProfiles === 1 ? '' : 's'} need salary setup` : 'Ready for payroll run');
  setText('#payrollProcessingStatus', summary.guardCount && !summary.missingProfiles ? 'Ready to review' : 'Set salaries first');
  setText('#payrollReportCount', summary.reportCount || '—');
  renderPayrollRunGraph(summary);
}

function renderAttendanceBoard() {
  updateAttendanceDateLabel();
  const records = collectTodayAttendance();
  const rows = records.map(record => {
    const statusKey = record.absent ? 'absent' : record.late ? 'late' : 'present';
    const statusLabel = record.absent ? '● Absent' : record.late ? '● Late' : record.completed ? '● Completed' : '● On duty';
    const initials = record.name.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase() || 'SG';
    const hue = simpleHash(record.id) % 360;
    return `<tr data-status="${statusKey}" data-qr="${escapeHtml(record.id)}">
      <td>
        <div class="person">
          <div class="avatar initials generated-avatar" style="background:hsl(${hue} 85% 94%);color:hsl(${hue} 70% 36%)">${escapeHtml(initials)}</div>
          <div><strong>${escapeHtml(record.name)}</strong><small>${escapeHtml(record.id)}</small></div>
        </div>
      </td>
      <td><strong>${escapeHtml(record.post)}</strong><small>${escapeHtml(record.assignment)}</small></td>
      <td><strong>${escapeHtml(record.timeIn || '—')}</strong><small>${record.timeIn ? 'QR time-in' : 'No time-in scan'}</small></td>
      <td><strong>${escapeHtml(record.timeOut || '—')}</strong><small>${record.timeOut ? 'QR time-out' : 'No time-out scan'}</small></td>
      <td><span class="status ${statusKey}">${statusLabel}</span></td>
    </tr>`;
  });
  $('#attendanceRows').innerHTML = rows.length
    ? rows.join('')
    : '<tr><td class="empty-pending" colspan="5">No approved Security guard accounts are available for attendance tracking.</td></tr>';

  renderStaffCarousel(records);
  renderShiftHandovers(records);

  const activeButton = $(`.filter[data-filter="${activeAttendanceFilter}"]`) || $('.filter[data-filter="all"]');
  $$('.filter').forEach(filter => filter.classList.toggle('active', filter === activeButton));
  $$('#attendanceRows tr[data-status]').forEach(row => {
    row.hidden = activeAttendanceFilter !== 'all' && row.dataset.status !== activeAttendanceFilter;
  });
}

function renderStaffCarousel(records = collectTodayAttendance()) {
  const track = $('#staffTrack');
  if (!track) return;
  const onDutyRecords = records.filter(record => !record.absent);
  if (!onDutyRecords.length) {
    track.innerHTML = '<article class="staff-card empty-staff-card"><h3>No guards on duty</h3></article>';
    return;
  }
  track.innerHTML = onDutyRecords.map(record => {
    const statusKey = record.absent ? 'absent' : record.late ? 'late' : 'present';
    const statusText = record.absent ? '● Absent' : record.late ? '● Late arrival' : record.completed ? '● Completed' : '● On duty';
    const initials = record.name.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase() || 'SG';
    const hue = simpleHash(record.id) % 360;
    const monthly = 88 + (simpleHash(record.id + 'month') % 11);
    const yearly = 90 + (simpleHash(record.id + 'year') % 8);
    return `<article class="staff-card">
      <div class="staff-photo initials generated-avatar" style="background:hsl(${hue} 85% 94%);color:hsl(${hue} 70% 36%)"><span>${escapeHtml(initials)}</span><i>${statusKey === 'late' ? '!' : statusKey === 'absent' ? '–' : '✓'}</i></div>
      <h3>${escapeHtml(record.name)}</h3>
      <p>${escapeHtml(currentPostLabelOf(record.account))}</p>
      <span class="staff-status ${statusKey === 'late' ? 'late-text' : statusKey === 'absent' ? 'absent-text' : ''}">${statusText}</span>
      <div class="attendance-scores">
        <div><b>${monthly}%</b><small>Monthly</small></div>
        <span></span>
        <div><b>${yearly}%</b><small>Yearly</small></div>
      </div>
      <button class="profile-button" data-user-id="${escapeHtml(record.id)}" type="button">View profile</button>
    </article>`;
  }).join('');
}

function handoverTimeFor(record) {
  const text = `${record.assignment || ''} ${record.post || ''}`.toLowerCase();
  return text.includes('night') ? '10:00 PM' : '03:00 PM';
}

function handoverStatusOf(record) {
  if (!record.account.post) return { label: 'Needs post', tone: 'warning', detail: 'No location assigned' };
  if (record.absent) return { label: 'Needs time-in', tone: 'danger', detail: 'No QR scan yet' };
  if (record.late) return { label: 'Late', tone: 'warning', detail: 'Late arrival recorded' };
  if (record.completed) return { label: 'Completed', tone: 'done', detail: 'Shift completed' };
  return { label: 'On duty', tone: 'ready', detail: 'Guard is currently deployed' };
}

function renderShiftHandovers(records = collectTodayAttendance()) {
  const list = $('#shiftHandoverList');
  if (!list) return;

  const guards = records.filter(record => record.account.status === 'Active');
  if (!guards.length) {
    list.innerHTML = '<div class="class-item empty-handover"><div><strong>No active deployments</strong><small>Approved Security accounts will appear here.</small></div></div>';
    return;
  }

  list.innerHTML = guards.map((record, index) => {
    const status = handoverStatusOf(record);
    const color = ['cyan', 'violet', 'orange'][index % 3];
    const post = record.account.post || 'Unassigned post';
    const guardLine = record.account.post
      ? `${record.name} · ${record.assignment || record.account.department || 'Security'}`
      : `${record.name} · Assign a location in HR`;
    return `<div class="class-item handover-item ${status.tone}">
      <div class="class-color ${color}"></div>
      <div><strong>${escapeHtml(post)}</strong><small>${escapeHtml(guardLine)}</small></div>
      <span><b>${escapeHtml(status.label)}</b><small>${escapeHtml(status.detail)} · ${handoverTimeFor(record)}</small></span>
    </div>`;
  }).join('');
}

function openDeploymentSchedule() {
  const records = collectTodayAttendance();
  const columns = ['Post', 'Current guard', 'Shift / assignment', 'Time in', 'Time out', 'Handover status'];
  $('#hrReportModal').dataset.reportMode = 'deployment-schedule';
  $('#hrReportPrint').hidden = true;
  if ($('#hrAttendanceDateControl')) $('#hrAttendanceDateControl').hidden = true;
  $('#hrReportTitle').textContent = 'Deployment Schedule';
  $('#hrReportDate').textContent = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  $('#hrReportHead').innerHTML = columns.map(col => `<th>${escapeHtml(col).toUpperCase()}</th>`).join('');
  $('#hrReportBody').innerHTML = records.length
    ? records.map(record => {
        const status = handoverStatusOf(record);
        return `<tr>
          <td><strong>${escapeHtml(record.account.post || 'Unassigned post')}</strong></td>
          <td>${escapeHtml(record.name)}<br><small>${escapeHtml(record.id)}</small></td>
          <td>${escapeHtml(record.assignment || record.account.department || 'Security')}</td>
          <td>${escapeHtml(record.timeIn || '—')}</td>
          <td>${escapeHtml(record.timeOut || '—')}</td>
          <td><span class="handover-pill ${status.tone}">${escapeHtml(status.label)}</span><br><small>${escapeHtml(status.detail)}</small></td>
        </tr>`;
      }).join('')
    : '<tr><td class="empty-pending" colspan="6">No active Security accounts are available for deployment.</td></tr>';
  $('#hrReportModal').hidden = false;
}

function initShiftHandovers() {
  renderShiftHandovers();
  $('#viewDeploymentSchedule')?.addEventListener('click', openDeploymentSchedule);
}

/* Primary issue per row: absent beats missed scans beats late arrival */
function primaryIssueOf(record) {
  if (record.absent) return 'absent';
  if (record.missedIn || record.missedOut) return 'missed';
  if (record.late) return 'late';
  return '';
}

function exceptionLabelOf(record) {
  if (record.absent) return 'Absent';
  if (record.missedIn) return 'Missed time-in scan';
  if (record.missedOut) return 'Missed time-out scan';
  if (record.late) return 'Late arrival';
  return '';
}

/* Whole-years age from the birthdate given at registration */
function ageOf(account) {
  let birth = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(account.birthDate || '')) {
    birth = new Date(`${account.birthDate}T00:00:00`);
  } else {
    const match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(account.birthday || '');
    if (match) {
      const shortYear = Number(match[3]);
      const fullYear = shortYear <= new Date().getFullYear() % 100 ? 2000 + shortYear : 1900 + shortYear;
      birth = new Date(fullYear, Number(match[1]) - 1, Number(match[2]));
    }
  }
  if (!birth || Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if ((now.getMonth() + 1) * 100 + now.getDate() < (birth.getMonth() + 1) * 100 + birth.getDate()) age -= 1;
  return age < 0 || age > 120 ? null : age;
}

/* Standalone printable report (file:// safe: no external resources).
   Returns false when the browser blocks the report window. */
function openPrintReport({ title, columns, rows, emptyText }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const fileLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const win = window.open('', '_blank', 'width=960,height=700');
  if (!win) return false;
  const body = rows.length
    ? rows.map(cells => `<tr>${cells.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${columns.length}" class="empty">${escapeHtml(emptyText)}</td></tr>`;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">`
    + `<title>Sentry ${escapeHtml(title)} - ${fileLabel}</title>`
    + `<style>*{box-sizing:border-box}body{margin:32px;color:#17213a;font:14px/1.5 'Segoe UI',Arial,sans-serif}`
    + `.brand{color:#315ce9;letter-spacing:2px;font-size:12px;font-weight:800}`
    + `h1{margin:4px 0;font-size:24px}.meta{color:#7d879b;font-size:12px;margin-bottom:16px}`
    + `table{width:100%;border-collapse:collapse}th,td{padding:9px 10px;border-bottom:1px solid #e5e9f2;text-align:left}`
    + `th{color:#7d879b;font-size:11px;letter-spacing:1px}.empty{color:#7d879b;text-align:center;padding:24px}`
    + `.actions{margin-bottom:20px}.actions button{border:0;border-radius:7px;padding:10px 22px;background:#315ce9;color:#fff;font:700 13px 'Segoe UI',Arial,sans-serif;cursor:pointer}`
    + `.actions p{color:#7d879b;font-size:12px}`
    + `@media print{.actions{display:none}body{margin:0}}</style></head><body>`
    + `<div class="brand">SENTRY SYSTEM</div><h1>${escapeHtml(title)}</h1>`
    + `<div class="meta">${escapeHtml(dateLabel)} &middot; Generated ${escapeHtml(timeLabelOf(now))} &middot; ${rows.length} record${rows.length === 1 ? '' : 's'}</div>`
    + `<div class="actions"><button onclick="window.print()">Print / Save as PDF</button>`
    + `<p>Use your browser's print dialog to print this list or save it as a PDF file.</p></div>`
    + `<table><thead><tr>${columns.map(col => `<th>${escapeHtml(col).toUpperCase()}</th>`).join('')}</tr></thead>`
    + `<tbody>${body}</tbody></table></body></html>`);
  win.document.close();
  win.focus();
  return true;
}


/* ------------------------------------------------------------------
   QR scanner pop-up
------------------------------------------------------------------ */

function initScanner() {
  const modal = $('#scannerModal');
  const video = $('#scannerVideo');
  const message = $('#scannerMessage');
  let stream;

  const close = () => {
    stream?.getTracks().forEach(track => track.stop());
    stream = undefined;
    video.srcObject = null;
    modal.hidden = true;
  };

  const open = async () => {
    modal.hidden = false;
    message.textContent = 'Requesting camera access…';

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      video.srcObject = stream;
      message.textContent = 'Position the guard’s QR code within the frame.';
    } catch {
      message.textContent = 'Camera access was not available. Please allow camera permission and try again.';
    }
  };

  $('#quickScan').addEventListener('click', open);
  $('#closeScanner').addEventListener('click', close);
  closeWhenBackdropIsClicked(modal, close);
}


/* ------------------------------------------------------------------
   Personnel carousel
------------------------------------------------------------------ */

function initCarousel() {
  const track = $('#staffTrack');
  const previous = $('#staffPrev');
  const next = $('#staffNext');

  const updateControls = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = maxScroll <= 2 || track.scrollLeft >= maxScroll - 2;
  };

  const step = () => track.querySelector('.staff-card')?.offsetWidth + 16 || 260;

  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  previous.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateControls);
  window.addEventListener('resize', updateControls);
  updateControls();
}


/* ------------------------------------------------------------------
   Guard profile pop-up
------------------------------------------------------------------ */

function initProfiles() {
  const modal = $('#profileModal');
  const details = $('#profileDetails');
  const name = $('#profileName');
  const image = $('#profileImage');
  const status = $('#profileStatus');

  const open = () => { modal.hidden = false; };
  const close = () => { modal.hidden = true; };

  const addressOf = account => [
    account.street,
    account.barangay || account.district,
    account.city,
    account.region,
    account.country,
    account.postal,
  ].filter(Boolean).join(', ') || '—';

  const showAccountProfile = userId => {
    const account = getStoredAccounts().find(item => item.userId === userId);
    if (!account) return;
    const record = attendanceStateFor(account);
    const fullName = displayNameOf(account);
    name.textContent = fullName;
    const initials = fullName.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase() || 'SG';
    const hue = simpleHash(account.userId) % 360;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' rx='48' fill='hsl(${hue} 85% 94%)'/><text x='48' y='57' text-anchor='middle' font-size='28' font-weight='800' font-family='Arial' fill='hsl(${hue} 70% 36%)'>${escapeHtml(initials)}</text></svg>`;
    image.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    image.alt = `${fullName} initials`;
    image.style.display = '';
    status.textContent = record.absent ? '● Absent today' : record.late ? '● Late today' : record.completed ? '● Shift completed' : '● On duty';
    details.className = 'profile-details';

    const currentStatus = record.absent ? 'Absent / no scan' : record.late ? 'Late arrival' : record.completed ? 'Shift completed' : 'On duty';
    const fields = [
      ['Guard ID', account.userId],
      ['Current status', currentStatus],
      ['Deployed post', currentPostLabelOf(account)],
      ['Department', account.department || 'Security'],
      ['Time in', record.timeIn || '—'],
      ['Time out', record.timeOut || '—'],
      ['Contact number', account.phone ? formatPhone(account.phone) : '—'],
      ['Email address', account.email || '—'],
      ['Home address', addressOf(account)],
    ];

    details.innerHTML = fields
      .map(([label, value]) => `<div class="profile-detail"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
      .join('');
    open();
  };

  const showAll = () => {
    const accounts = activeSecurityAccounts();
    name.textContent = 'Registered guard accounts';
    image.src = '../images/1568-logo-1781901055.317-00a3e4-color.webp';
    image.style.display = '';
    image.alt = 'Sentry logo';
    status.textContent = `${accounts.length} approved Security account${accounts.length === 1 ? '' : 's'}`;
    details.className = 'profile-details all-guards';

    details.innerHTML = accounts.length
      ? accounts.map(account => `
        <div class="guard-summary">
          <div class="avatar initials generated-avatar">${escapeHtml(displayNameOf(account).split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase() || 'SG')}</div>
          <div><strong>${escapeHtml(displayNameOf(account))}</strong><small>${escapeHtml(account.userId)} · ${escapeHtml(currentPostLabelOf(account))}</small></div>
        </div>`).join('')
      : '<div class="empty-pending">No approved Security accounts yet.</div>';
    open();
  };

  const openAttendanceLogs = () => {
    const currentActivityDate = new Date();
    const records = collectTodayAttendance(currentActivityDate);
    const columns = ['Guard name', 'Guard ID', 'Assigned post', 'Time in', 'Time out', 'Status'];
    $('#hrReportModal').dataset.reportMode = 'dashboard-attendance';
    $('#hrReportPrint').hidden = true;
    if ($('#hrAttendanceDateControl')) $('#hrAttendanceDateControl').hidden = true;
    closeAttendanceCalendar();
    $('#hrReportTitle').textContent = 'Attendance Logs';
    $('#hrReportDate').textContent = currentActivityDate.toLocaleDateString('en-PH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    $('#hrReportHead').innerHTML = columns.map(col => `<th>${escapeHtml(col).toUpperCase()}</th>`).join('');
    $('#hrReportBody').innerHTML = records.length
      ? records.map(record => {
          const statusLabel = record.absent ? 'Absent' : record.late ? 'Late' : record.completed ? 'Completed' : 'On duty';
          return `<tr><td><strong>${escapeHtml(record.name)}</strong></td><td>${escapeHtml(record.id)}</td><td>${escapeHtml(currentPostLabelOf(record.account))}</td><td>${escapeHtml(record.timeIn || '—')}</td><td>${escapeHtml(record.timeOut || '—')}</td><td>${escapeHtml(statusLabel)}</td></tr>`;
        }).join('')
      : '<tr><td class="empty-pending" colspan="6">No approved Security guard accounts are available for this date.</td></tr>';
    $('#hrReportModal').hidden = false;
  };

  $('#staffTrack').addEventListener('click', event => {
    const button = event.target.closest('.profile-button');
    if (!button) return;
    showAccountProfile(button.dataset.userId);
  });
  $('#viewAll').addEventListener('click', openAttendanceLogs);
  $('#closeProfile').addEventListener('click', close);
  closeWhenBackdropIsClicked(modal, close);

  return { showAll, showAccountProfile };
}


/* ------------------------------------------------------------------
   Workspace switching, account approvals and tool dialogs
------------------------------------------------------------------ */

function downloadPayrollCsv() {
  const summary = payrollSummary();
  const headers = ['Guard','Guard ID','Paid days','Absent days','Overtime hours','Late minutes','Allowance pay','Adjustments','Gross pay','Total deductions','Net pay'];
  const lines = [headers.join(',')];
  summary.rows.forEach(row => {
    lines.push([
      displayNameOf(row.account), row.account.userId, row.paidDays, row.absentDays,
      row.overtimeHours.toFixed(2), Math.round(row.lateMinutes), row.allowancePay.toFixed(2),
      row.adjustmentPay.toFixed(2), row.grossPay.toFixed(2), row.totalDeductions.toFixed(2), row.netPay.toFixed(2),
    ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sentry-payroll-${today()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function initWorkspace(toast, profiles) {
  const sections = {
    attendance: [],
    hr: [$('#hrPanel'), $('#hrActions')],
    payroll: [$('#payrollPanel')],
    admin: [$('#adminPanel')],
  };
  const navItems = {
    attendance: $('#attendanceNav'),
    hr: $('#hrPanelNav'),
    payroll: $('#payrollPanelNav'),
    admin: $('#adminPanelNav'),
  };
  const bodyClasses = ['hr-panel-active', 'payroll-panel-active', 'admin-panel-active'];

  const actionModal = $('#hrActionModal');
  const actionTitle = $('#hrActionTitle');
  const actionDescription = $('#hrActionDescription');
  const actionContent = $('#hrActionContent');

  const pendingAccountRows = $('#pendingAccountRows');
  const pendingAccountCount = $('#pendingAccountCount');
  const userAccountRows = $('#userAccountRows');
  const userAccountCount = $('#userAccountCount');
  const openViewAccounts = $('#openViewAccounts');
  const openManageAccounts = $('#openManageAccounts');
  const activeAccountsPage = $('#activeAccountsPage');
  const activeAccountsPageCount = $('#activeAccountsPageCount');
  const activeAccountsPageBody = $('#activeAccountsPageBody');
  const activeAccountsSearch = $('#activeAccountsSearch');
  const backToAdminPanel = $('#backToAdminPanel');
  const manageAccountsPage = $('#manageAccountsPage');
  const manageAccountsPageCount = $('#manageAccountsPageCount');
  const manageAccountsPageBody = $('#manageAccountsPageBody');
  const manageAccountsSearch = $('#manageAccountsSearch');
  const backToAdminFromManage = $('#backToAdminFromManage');

  const closeActionModal = () => { actionModal.hidden = true; };

  /* --- pending account approvals + access assignment --- */

  const accountRegisteredLabel = account => {
    const stamp = account.requestedAt ? new Date(account.requestedAt) : null;
    if (!stamp || Number.isNaN(stamp.getTime())) return '—';
    return stamp.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const birthdayLabelOf = account => {
    if (account.birthDate) {
      const date = new Date(`${account.birthDate}T00:00:00`);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
      }
    }
    return account.birthday || '—';
  };

  const fullAddressOf = account => [
    account.street,
    account.barangay || account.district,
    account.city,
    account.region,
    account.country,
    account.postal,
  ].filter(Boolean).join(', ') || '—';

  const accountSearchText = account => [
    account.userId,
    displayNameOf(account),
    account.email,
    account.department,
    account.gender,
    account.phone,
    fullAddressOf(account),
  ].filter(Boolean).join(' ').toLowerCase();

  const rightsCheckboxesHtml = account => {
    const rights = account.accessRights?.length ? account.accessRights : accessForDepartment(account.department);
    return ['Read', 'Write', 'Execute', 'Admin'].map(right => `
      <label><input type="checkbox" data-access-right="${right}"${rights.includes(right) ? ' checked' : ''}> ${right}</label>`).join('');
  };

  const renderPendingAccounts = () => {
    const pendingAccounts = getStoredAccounts().filter(account => account.status === 'Pending');
    pendingAccountCount.textContent = pendingAccounts.length;

    pendingAccountRows.innerHTML = pendingAccounts.length
      ? pendingAccounts.map(account => `
          <tr>
            <td>${escapeHtml(account.userId)}</td>
            <td><strong>${escapeHtml(displayNameOf(account))}</strong></td>
            <td>${escapeHtml(account.email)}</td>
            <td>${escapeHtml(account.department)}</td>
            <td><span class="pending-status">Pending</span></td>
            <td><div class="pending-rights">${rightsCheckboxesHtml(account)}</div></td>
            <td><input class="pending-expiration" type="date" value="${escapeHtml(account.expirationDate || '')}" aria-label="Expiration date for ${escapeHtml(displayNameOf(account))}"></td>
            <td>
              <div class="account-actions">
                <button class="approve-account" data-account-action="approve"
                        data-user-id="${escapeHtml(account.userId)}" type="button">Approve</button>
                <button class="reject-account" data-account-action="reject"
                        data-user-id="${escapeHtml(account.userId)}" type="button">Reject</button>
              </div>
            </td>
          </tr>`).join('')
      : '<tr><td class="empty-pending" colspan="8">No account requests are awaiting approval.</td></tr>';
  };

  /* --- active user account storage (approved accounts only) --- */

  const renderUserAccounts = () => {
    if (!userAccountRows || !userAccountCount) return;
    const activeAccounts = getStoredAccounts().filter(account => account.status === 'Active');
    userAccountCount.textContent = activeAccounts.length;

    userAccountRows.innerHTML = activeAccounts.length
      ? activeAccounts.map(account => `
          <tr>
            <td>${escapeHtml(account.userId)}</td>
            <td><strong>${escapeHtml(displayNameOf(account))}</strong></td>
            <td>${escapeHtml(account.department)}</td>
            <td>${escapeHtml(account.email)}</td>
            <td>${escapeHtml(account.phone ? formatPhone(account.phone) : '—')}</td>
            <td class="account-registered">${accountRegisteredLabel(account)}</td>
          </tr>`).join('')
      : '<tr><td class="empty-pending" colspan="6">No approved user accounts are stored yet.</td></tr>';
  };

  const renderActiveAccountsPage = (query = '') => {
    if (!activeAccountsPageBody || !activeAccountsPageCount) return;
    const needle = query.trim().toLowerCase();
    const activeAccounts = getStoredAccounts().filter(account => account.status === 'Active');
    const matches = activeAccounts.filter(account => !needle || accountSearchText(account).includes(needle));
    activeAccountsPageCount.textContent = activeAccounts.length;
    activeAccountsPageBody.innerHTML = matches.length
      ? matches.map(account => `
          <tr>
            <td><strong>${escapeHtml(displayNameOf(account))}</strong><small>${escapeHtml(account.userId)} · ${escapeHtml(account.department || '—')}</small></td>
            <td>${escapeHtml(account.email || '—')}</td>
            <td>${escapeHtml(account.phone ? formatPhone(account.phone) : '—')}</td>
            <td>${escapeHtml(account.gender || '—')}</td>
            <td>${escapeHtml(birthdayLabelOf(account))}</td>
            <td class="account-address-cell">${escapeHtml(fullAddressOf(account))}</td>
          </tr>`).join('')
      : '<tr><td class="empty-pending" colspan="6">No active accounts match your search.</td></tr>';
  };

  const manageAccountActionHtml = account => {
    const id = escapeHtml(account.userId);
    return `<button class="manage-account-btn" data-account-manage="${id}" type="button">Manage</button>`;
  };

  const accountEditFormHtml = account => {
    const countries = Object.keys(ADDRESS_DATA);
    const regions = account.country && ADDRESS_DATA[account.country] ? Object.keys(ADDRESS_DATA[account.country]) : [];
    const cities = account.country && account.region && ADDRESS_DATA[account.country]?.[account.region]
      ? Object.keys(ADDRESS_DATA[account.country][account.region]) : [];
    const barangays = account.country && account.region && account.city && Array.isArray(ADDRESS_DATA[account.country]?.[account.region]?.[account.city])
      ? ADDRESS_DATA[account.country][account.region][account.city] : [];
    const option = (value, selected) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`;
    return `
      <form class="account-manage-form" id="manageAccountForm" data-user-id="${escapeHtml(account.userId)}">
        <div class="account-manage-grid">
          <label>First name<input name="firstName" required value="${escapeHtml(account.firstName || '')}"></label>
          <label>Last name<input name="lastName" required value="${escapeHtml(account.lastName || '')}"></label>
          <label>Middle name <span>Optional</span><input name="middleName" value="${escapeHtml(account.middleName || '')}"></label>
          <label>Gender<select name="gender" required>
            <option value="">Select gender</option>${['Male','Female','Other','Prefer not to say'].map(item => option(item, account.gender || '')).join('')}
          </select></label>
          <label>Birthday<input name="birthDate" type="date" value="${escapeHtml(account.birthDate || account.birthday || '')}"></label>
          <label>Phone number<input name="phone" required value="${escapeHtml(account.phone || '')}" placeholder="+63 917 555 0182"></label>
          <label>Country<select name="country" data-edit-country required>
            <option value="">Select country</option>${countries.map(country => option(country, account.country || '')).join('')}
          </select></label>
          <label>Region / State<select name="region" data-edit-region>
            <option value="">${regions.length ? 'Select region' : 'Select a country first'}</option>${regions.map(region => option(region, account.region || '')).join('')}
          </select></label>
          <label>City / Municipality<select name="city" data-edit-city>
            <option value="">${cities.length ? 'Select city' : 'Select a region first'}</option>${cities.map(city => option(city, account.city || '')).join('')}
          </select></label>
          <label>Barangay<select name="barangay" data-edit-barangay>
            <option value="">${barangays.length ? 'Select barangay' : 'Select a city first'}</option>${barangays.map(barangay => option(barangay, account.barangay || '')).join('')}
          </select></label>
          <label class="wide">Street / House no.<input name="street" required value="${escapeHtml(account.street || '')}"></label>
          <label>Postal code<input name="postal" value="${escapeHtml(account.postal || '')}"></label>
          <label>Department<select name="department" required>
            <option value="">Select department</option>${Object.keys(DEPARTMENT_ACCESS).map(dept => option(dept, account.department || '')).join('')}
          </select></label>
          <label>Email address<input name="email" type="email" required value="${escapeHtml(account.email || '')}"></label>
          <label class="wide">Password<input name="password" minlength="6" maxlength="12" required value="${escapeHtml(account.password || '')}"></label>
        </div>
        <div class="account-manage-actions">
          <button class="${account.status === 'Active' ? 'reject-account' : 'approve-account'} account-status-action" data-account-modal-action="${account.status === 'Active' ? 'deactivate' : 'activate'}" type="button">${account.status === 'Active' ? 'Deactivate Account' : 'Reactivate Account'}</button>
          <button class="hr-primary account-save-btn" type="submit">Save Changes</button>
          <button class="account-delete-btn" data-account-modal-action="delete" type="button">Delete Account</button>
        </div>
      </form>`;
  };

  const updateEditAddressOptions = form => {
    const country = form.querySelector('[data-edit-country]')?.value || '';
    const regionSelect = form.querySelector('[data-edit-region]');
    const citySelect = form.querySelector('[data-edit-city]');
    const barangaySelect = form.querySelector('[data-edit-barangay]');
    const fill = (select, items, placeholder, keep = '') => {
      if (!select) return;
      const selected = items.includes(keep) ? keep : '';
      select.innerHTML = `<option value="">${placeholder}</option>${items.map(item => `<option value="${escapeHtml(item)}"${item === selected ? ' selected' : ''}>${escapeHtml(item)}</option>`).join('')}`;
    };
    const regions = country && ADDRESS_DATA[country] ? Object.keys(ADDRESS_DATA[country]) : [];
    fill(regionSelect, regions, regions.length ? 'Select region' : 'Select a country first', regionSelect?.value || '');
    const region = regionSelect?.value || '';
    const cities = country && region && ADDRESS_DATA[country]?.[region] ? Object.keys(ADDRESS_DATA[country][region]) : [];
    fill(citySelect, cities, cities.length ? 'Select city' : 'Select a region first', citySelect?.value || '');
    const city = citySelect?.value || '';
    const barangays = country && region && city && Array.isArray(ADDRESS_DATA[country]?.[region]?.[city]) ? ADDRESS_DATA[country][region][city] : [];
    fill(barangaySelect, barangays, barangays.length ? 'Select barangay' : 'Select a city first', barangaySelect?.value || '');
  };

  const openManageAccountModal = userId => {
    const account = getStoredAccounts().find(item => item.userId === userId);
    if (!account) return toast('Account record was not found.');
    actionTitle.textContent = 'Manage Account';
    actionDescription.textContent = 'Edit user information, deactivate/reactivate access, or permanently delete this account.';
    actionContent.innerHTML = accountEditFormHtml(account);
    actionModal.hidden = false;
  };

  const confirmDeleteAccount = userId => {
    const account = getStoredAccounts().find(item => item.userId === userId);
    if (!account) return toast('Account record was not found.');
    actionTitle.textContent = 'Delete Account';
    actionDescription.textContent = 'Confirm before permanently removing this user account and its linked stored data.';
    actionContent.innerHTML = `
      <form class="hr-form account-delete-confirm" id="deleteAccountForm" data-user-id="${escapeHtml(account.userId)}">
        <div class="policy-delete-warning">
          <strong>${escapeHtml(displayNameOf(account))}</strong>
          <small>${escapeHtml(account.userId)} · ${escapeHtml(account.email || 'No email')}</small>
        </div>
        <div class="policy-delete-actions">
          <button class="policy-delete-cancel" id="cancelAccountDelete" type="button">Cancel</button>
          <button class="policy-delete-confirm" type="submit">Delete permanently</button>
        </div>
      </form>`;
  };

  const renderManageAccountsPage = (query = '') => {
    if (!manageAccountsPageBody || !manageAccountsPageCount) return;
    const needle = query.trim().toLowerCase();
    const manageableAccounts = getStoredAccounts().filter(account => ['Active', 'Inactive'].includes(account.status));
    const matches = manageableAccounts.filter(account => !needle || `${accountSearchText(account)} ${account.status}`.toLowerCase().includes(needle));
    manageAccountsPageCount.textContent = manageableAccounts.length;
    manageAccountsPageBody.innerHTML = matches.length
      ? matches.map(account => `
          <tr>
            <td><strong>${escapeHtml(displayNameOf(account))}</strong><small>${escapeHtml(account.userId)}</small></td>
            <td>${escapeHtml(account.email || '—')}</td>
            <td>${escapeHtml(account.phone ? formatPhone(account.phone) : '—')}</td>
            <td>${escapeHtml(account.department || '—')}</td>
            <td><span class="account-status ${account.status.toLowerCase()}">${escapeHtml(account.status)}</span></td>
            <td><div class="account-actions">${manageAccountActionHtml(account)}</div></td>
          </tr>`).join('')
      : '<tr><td class="empty-pending" colspan="6">No active or deactivated accounts match your search.</td></tr>';
  };

  const openActiveAccountsPage = () => {
    if (!activeAccountsPage || !activeAccountsSearch) return toast('Account directory markup is missing. Please update index.html too.');
    activeAccountsSearch.value = '';
    renderActiveAccountsPage();
    $('#adminPanel').hidden = true;
    if (manageAccountsPage) manageAccountsPage.hidden = true;
    activeAccountsPage.hidden = false;
    activeAccountsPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openManageAccountsPage = () => {
    if (!manageAccountsPage || !manageAccountsSearch) return toast('Manage accounts markup is missing. Please update index.html too.');
    manageAccountsSearch.value = '';
    renderManageAccountsPage();
    $('#adminPanel').hidden = true;
    if (activeAccountsPage) activeAccountsPage.hidden = true;
    manageAccountsPage.hidden = false;
    manageAccountsPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showAdminPanel = () => {
    if (activeAccountsPage) activeAccountsPage.hidden = true;
    if (manageAccountsPage) manageAccountsPage.hidden = true;
    $('#adminPanel').hidden = false;
    renderPendingAccounts();
    renderUserAccounts();
  };

  openViewAccounts?.addEventListener('click', openActiveAccountsPage);
  openManageAccounts?.addEventListener('click', openManageAccountsPage);
  backToAdminPanel?.addEventListener('click', showAdminPanel);
  backToAdminFromManage?.addEventListener('click', showAdminPanel);
  activeAccountsSearch?.addEventListener('input', event => renderActiveAccountsPage(event.target.value));
  manageAccountsSearch?.addEventListener('input', event => renderManageAccountsPage(event.target.value));

  const readPendingApprovalOptions = row => {
    const rights = $$('[data-access-right]', row)
      .filter(input => input.checked)
      .map(input => input.dataset.accessRight);
    const expirationDate = $('.pending-expiration', row)?.value || '';
    return { rights, expirationDate };
  };

  const applyAccountAction = (accounts, account, action, options = {}) => {
    if (action === 'approve' || action === 'activate') {
      account.status = 'Active';
      if (action === 'approve') {
        account.accessRights = options.rights?.length ? options.rights : accessForDepartment(account.department);
        account.expirationDate = options.expirationDate || '';
        return `${displayNameOf(account)}'s account was approved and activated`;
      }
      return `${displayNameOf(account)}'s account was reactivated`;
    }
    if (action === 'reject' || action === 'deactivate') {
      account.status = 'Inactive';
      return action === 'reject'
        ? `${displayNameOf(account)}'s account was rejected and marked inactive`
        : `${displayNameOf(account)}'s account was deactivated`;
    }
    if (action === 'remove') {
      syncDatabase('deleteEmployee', account.userId);
      const index = accounts.indexOf(account);
      if (index !== -1) accounts.splice(index, 1);
      [MOBILE_TODAY_KEY_PREFIX, MOBILE_POSTS_KEY_PREFIX].forEach(prefix => {
        try { localStorage.removeItem(prefix + account.userId); } catch { /* private mode */ }
      });
      try {
        const logs = readAttendanceLogs();
        Object.keys(logs).forEach(key => { if (logs[key]) delete logs[key][account.userId]; });
        saveAttendanceLogs(logs);
        const salaries = readSalaryProfiles();
        delete salaries[account.userId];
        saveSalaryProfiles(salaries);
        const adjustments = readPayrollAdjustments().filter(item => item.userId !== account.userId);
        savePayrollAdjustments(adjustments);
        const photos = JSON.parse(localStorage.getItem('sentryGuardProfilePhotos') || '{}');
        delete photos[account.userId];
        localStorage.setItem('sentryGuardProfilePhotos', JSON.stringify(photos));
      } catch { /* keep account removal even if related cleanup fails */ }
      return `${displayNameOf(account)}'s account was removed`;
    }
    return '';
  };

  const refreshAccountsViews = () => {
    renderPendingAccounts();
    renderUserAccounts();
    renderActiveAccountsPage(activeAccountsPage.hidden ? '' : activeAccountsSearch.value);
    renderManageAccountsPage(manageAccountsPage.hidden ? '' : manageAccountsSearch.value);
    renderAttendanceBoard();
    updateHrRequestCounts();
  updatePolicyUpdateCounts();
    updateSystemCounts();
  };

  const updateAccountFromManageForm = form => {
    const accounts = getStoredAccounts();
    const account = accounts.find(item => item.userId === form.dataset.userId);
    if (!account) return toast('Account record was not found.');
    const data = Object.fromEntries(new FormData(form).entries());
    const required = ['firstName', 'lastName', 'gender', 'phone', 'country', 'street', 'department', 'email', 'password'];
    if (required.some(field => !String(data[field] || '').trim())) return toast('Complete the required account fields.');
    if (String(data.password).length < 6 || String(data.password).length > 12) return toast('Password must be 6–12 characters.');
    const duplicate = accounts.find(item => item.userId !== account.userId && (item.email || '').toLowerCase() === String(data.email).toLowerCase());
    if (duplicate) return toast('Another account already uses that email address.');
    Object.assign(account, {
      firstName: data.firstName.trim(),
      middleName: data.middleName.trim(),
      lastName: data.lastName.trim(),
      gender: data.gender,
      birthDate: data.birthDate,
      birthday: data.birthDate,
      phone: data.phone.trim(),
      country: data.country,
      region: data.region,
      city: data.city,
      barangay: data.barangay,
      street: data.street.trim(),
      postal: data.postal.trim(),
      department: data.department,
      email: data.email.trim(),
      password: data.password,
      accessRights: account.accessRights?.length ? account.accessRights : accessForDepartment(data.department),
      updatedAt: new Date().toISOString(),
    });
    saveStoredAccounts(accounts);
    refreshAccountsViews();
    openManageAccountModal(account.userId);
    toast('Account information was updated.');
  };

  const applyModalAccountAction = (userId, action) => {
    const accounts = getStoredAccounts();
    const account = accounts.find(item => item.userId === userId);
    if (!account) return toast('Account record was not found.');
    if (action === 'delete') return confirmDeleteAccount(userId);
    const message = applyAccountAction(accounts, account, action);
    saveStoredAccounts(accounts);
    refreshAccountsViews();
    openManageAccountModal(userId);
    if (message) toast(message);
  };

  const handleAccountAction = event => {
    const button = event.target.closest('[data-account-action]');
    if (!button) return;

    const accounts = getStoredAccounts();
    const account = accounts.find(item => item.userId === button.dataset.userId);
    if (!account) return;

    const row = button.closest('tr');
    const options = button.dataset.accountAction === 'approve' && row ? readPendingApprovalOptions(row) : {};
    if (options.expirationDate && options.expirationDate < today()) {
      return toast('Choose today or a future expiration date');
    }

    const message = applyAccountAction(accounts, account, button.dataset.accountAction, options);
    saveStoredAccounts(accounts);
    refreshAccountsViews();
    if (message) toast(message);
  };


  /* --- registered guard directory (approved accounts only) --- */

  const DIRECTORY_AVATARS = [
    ['#eaf0ff', '#315ce9'], ['#e6f7ee', '#1d7a4c'], ['#fff4dc', '#a56a0a'],
    ['#f1edff', '#7659df'], ['#e0f5f6', '#0f7d87'], ['#ffeff1', '#c04d5a'],
  ];

  const directoryStatusOf = name => {
    const row = $$('#attendanceRows tr').find(item =>
      item.querySelector('.person strong')?.textContent === name);
    return row ? row.dataset.status : 'active';
  };

  const renderGuardDirectory = (query = '') => {
    const needle = query.trim().toLowerCase();
    const entries = [];

    getStoredAccounts()
      .filter(account => account.status === 'Active' && account.department === 'Security')
      .forEach(account => {
        const name = displayNameOf(account);
        const tint = DIRECTORY_AVATARS[name.length % DIRECTORY_AVATARS.length];
        entries.push({
          name, id: account.userId,
          post: account.post || account.department,
          sub: account.post ? (account.assignment || account.department) : 'No post assigned',
          contact: account.phone ? formatPhone(account.phone) : (account.email || ''),
          initials: name.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase(),
          tint, status: 'active',
        });
      });

    const matches = entries.filter(entry =>
      !needle || `${entry.name} ${entry.id} ${entry.post}`.toLowerCase().includes(needle));

    $('#guardDirectoryCount').textContent = entries.length;

    const pillText = { present: '● On duty', late: '● Late', absent: '● Absent', active: '● Active' };
    $('#guardDirectoryRows').innerHTML = matches.length
      ? matches.map(entry => `
          <tr>
            <td>
              <div class="person">
                ${entry.image
                  ? `<div class="avatar"><img src="${entry.image}" alt=""></div>`
                  : `<div class="avatar initials" style="background:${entry.tint[0]};color:${entry.tint[1]}">${entry.initials}</div>`}
                <div><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(entry.id)}</small></div>
              </div>
            </td>
            <td><strong>${escapeHtml(entry.post)}</strong><small>${escapeHtml(entry.sub || '—')}</small></td>
            <td><strong>${escapeHtml(entry.contact)}</strong></td>
            <td><span class="status ${entry.status}">${pillText[entry.status]}</span></td>
          </tr>`).join('')
      : '<tr><td class="empty-pending" colspan="4">No guards match your search.</td></tr>';
  };

  /* --- personnel manager (assign/change staff guard posts) --- */

  const renderPersonnelList = (query = '') => {
    const needle = query.trim().toLowerCase();
    const staff = activeSecurityAccounts();
    const matches = staff.filter(account =>
      !needle || `${displayNameOf(account)} ${account.userId} ${account.post || ''}`.toLowerCase().includes(needle));
    $('#personnelCount').textContent = `${staff.length} staff guards · ${matches.length} shown`;
    $('#personnelBody').innerHTML = matches.length
      ? matches.map(account => {
          const current = account.post || '';
          const detail = account.assignment || '';
          const options = '<option value="">Select location…</option>' + POST_LOCATIONS.map(site =>
            `<option value="${escapeHtml(site)}"${site === current ? ' selected' : ''}>${escapeHtml(site)}</option>`).join('');
          const currentCell = current
            ? `${escapeHtml(current)}${detail ? `<br><small>${escapeHtml(detail)}</small>` : ''}`
            : '<span class="personnel-none">No post assigned</span>';
          return `<tr>
            <td><strong>${escapeHtml(displayNameOf(account))}</strong><br><small>${escapeHtml(account.userId)}</small></td>
            <td>${currentCell}</td>
            <td><select class="personnel-location" aria-label="Location for ${escapeHtml(displayNameOf(account))}">${options}</select></td>
            <td><input class="personnel-detail" value="${escapeHtml(detail)}" placeholder="e.g. Main Gate · Day shift" aria-label="Assignment detail"></td>
            <td><button class="hr-report-print" data-save-post="${escapeHtml(account.userId)}" type="button">Save</button></td>
          </tr>`;
        }).join('')
      : '<tr><td class="empty-pending" colspan="5">No staff match your search.</td></tr>';
  };

  $('#managePersonnelBtn').addEventListener('click', () => {
    $('#personnelSearch').value = '';
    $('#personnelError').hidden = true;
    renderPersonnelList();
    $('#personnelModal').hidden = false;
  });
  $('#personnelSearch').addEventListener('input', event => renderPersonnelList(event.target.value));
  $('#closePersonnel').addEventListener('click', () => { $('#personnelModal').hidden = true; });
  closeWhenBackdropIsClicked($('#personnelModal'), () => { $('#personnelModal').hidden = true; });
  $('#personnelBody').addEventListener('change', () => { $('#personnelError').hidden = true; });
  $('#personnelBody').addEventListener('click', event => {
    const button = event.target.closest('[data-save-post]');
    if (!button) return;
    const row = button.closest('tr');
    const accounts = getStoredAccounts();
    const account = accounts.find(item => item.userId === button.dataset.savePost);
    if (!account) return;
    const error = $('#personnelError');
    const location = row.querySelector('.personnel-location').value;
    if (!location && !account.post) {
      error.textContent = `Select a location for ${displayNameOf(account)} first.`;
      error.hidden = false;
      return;
    }
    if (location) account.post = location;
    account.assignment = row.querySelector('.personnel-detail').value.trim();
    saveStoredAccounts(accounts);
    error.hidden = true;
    renderPersonnelList($('#personnelSearch').value);
    renderGuardDirectory($('#guardDirectorySearch').value);
    renderAttendanceBoard();
    renderShiftHandovers();
    toast(`Post updated for ${displayNameOf(account)}`);
  });


  /* --- Policy acknowledgement tracker + HR requests center --- */

  const HR_REQUESTS_KEY = 'sentryHrRequests';
  const POLICY_ACK_KEY = 'sentryPolicyAcknowledgements';
  const POLICY_UPDATES_KEY = 'sentryPolicyUpdates';

  const DEFAULT_POLICY_CENTER = [
    {
      id: 'POL-QR-2026-01',
      title: 'QR Attendance Procedure Update',
      summary: 'Guards must present the dynamic QR code for both time-in and time-out scans.',
      published: '2026-09-21',
      deadline: '2026-09-25',
      audience: 'Security',
    },
    {
      id: 'POL-POST-2026-02',
      title: 'Post Assignment and Handover Rules',
      summary: 'Assigned posts must be followed unless HR updates the deployment schedule.',
      published: '2026-09-21',
      deadline: '2026-09-28',
      audience: 'Security',
    },
    {
      id: 'POL-ABS-2026-03',
      title: 'Late, Absence, and Missed Scan Reporting',
      summary: 'Missed scans and emergency absences must be reported for HR review.',
      published: '2026-09-18',
      deadline: '2026-09-24',
      audience: 'All staff',
    },
  ];

  const getPolicyCenter = () => {
    let saved = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(POLICY_UPDATES_KEY) || '[]');
      if (Array.isArray(parsed)) saved = parsed;
    } catch { saved = []; }

    // Do not auto-create sample/default policies. Policy updates should only
    // appear after HR/Admin publishes them. Also clean older browser storage
    // that still has the previously bundled sample policies.
    const defaultIds = new Set(DEFAULT_POLICY_CENTER.map(policy => policy.id));
    const userPublishedOnly = saved.filter(policy => !defaultIds.has(policy.id));
    if (userPublishedOnly.length !== saved.length) {
      savePolicyCenter(userPublishedOnly);
      const acks = readPolicyAcks();
      defaultIds.forEach(id => delete acks[id]);
      savePolicyAcks(acks);
    }
    return userPublishedOnly;
  };

  const savePolicyCenter = policies => localStorage.setItem(POLICY_UPDATES_KEY, JSON.stringify(policies));

  const savePublishedPolicy = ({ title, summary, deadline }) => {
    const policy = {
      id: `POL-${Date.now()}`,
      title: title.trim(),
      summary: summary.trim() || 'Please review and acknowledge this policy update.',
      published: today(),
      deadline,
      audience: 'Security',
      publisher: 'HR/Admin',
    };
    const policies = [policy, ...getPolicyCenter()];
    savePolicyCenter(policies);
    updatePolicyUpdateCounts();
    openPolicyCenter();
    toast('Policy update was published. Guards will see a notification.');
  };

  const publishPolicyUpdate = () => {
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 7);
    actionTitle.textContent = 'Publish Policy Update';
    actionDescription.textContent = 'Create a policy notification for active Security guards. It will appear in the mobile app notification bell until acknowledged.';
    actionContent.innerHTML = `
      <form class="hr-form policy-publish-form" id="publishPolicyForm">
        <label>Policy title
          <input id="policyTitleInput" required maxlength="80" placeholder="e.g. QR Attendance Procedure Update">
        </label>
        <label>Policy details
          <textarea id="policySummaryInput" required rows="4" placeholder="Write the update guards need to read and acknowledge."></textarea>
        </label>
        <label>Acknowledgement deadline
          <input id="policyDeadlineInput" type="date" required value="${defaultDeadline.toISOString().slice(0, 10)}">
        </label>
        <button type="submit">Publish update</button>
      </form>`;
    actionModal.hidden = false;
    $('#policyTitleInput')?.focus();
  };

  const readPolicyAcks = () => {
    try { return JSON.parse(localStorage.getItem(POLICY_ACK_KEY) || '{}'); }
    catch { return {}; }
  };

  const savePolicyAcks = acks => localStorage.setItem(POLICY_ACK_KEY, JSON.stringify(acks));

  const seedPolicyAcks = () => readPolicyAcks();

  const policyStats = policy => {
    const staff = activeSecurityAccounts();
    const acks = seedPolicyAcks()[policy.id] || {};
    const acknowledged = staff.filter(account => acks[account.userId]).length;
    return { total: staff.length, acknowledged, pending: Math.max(0, staff.length - acknowledged), acks };
  };

  let policySelectionMode = false;
  const selectedPolicyUpdates = new Set();

  const trashIconMarkup = () => '<img src="../images/trash.png" alt="" aria-hidden="true">';

  const updatePolicyUpdateCounts = () => {
    const policies = getPolicyCenter();
    const totalPending = policies.reduce((sum, policy) => sum + policyStats(policy).pending, 0);
    const policyCount = $('#policyUpdateCount');
    const pendingCount = $('#policyPendingAckCount');
    const overview = $('#hrPendingPolicyCount');
    if (policyCount) policyCount.textContent = policies.length;
    if (pendingCount) pendingCount.textContent = totalPending;
    if (overview) overview.textContent = totalPending || '—';
  };

  const openPolicyCenter = (selectionMode = policySelectionMode) => {
    policySelectionMode = selectionMode;
    if (!policySelectionMode) selectedPolicyUpdates.clear();
    const columns = policySelectionMode
      ? ['<label class="policy-select-all"><input id="selectAllPolicies" type="checkbox"> <span>Select All</span></label>', 'Policy', 'Published', 'Deadline', 'Acknowledged', 'Pending', 'Status', 'Actions']
      : ['Policy', 'Published', 'Deadline', 'Acknowledged', 'Pending', 'Status', 'Actions'];
    const policies = getPolicyCenter();
    $('#hrReportModal').dataset.reportMode = 'policy-center';
    $('#hrReportPrint').hidden = true;
    if ($('#hrAttendanceDateControl')) $('#hrAttendanceDateControl').hidden = true;
    $('#hrReportTitle').textContent = 'Policy Center';
    $('#hrReportDate').innerHTML = `
      <span>Publish policies and track staff acknowledgements.</span>
      <button class="policy-delete-selected" id="deleteSelectedPolicy" type="button" aria-label="${policySelectionMode ? 'Delete selected policy updates' : 'Select policy updates to delete'}" title="${policySelectionMode ? 'Delete selected policy updates' : 'Select policy updates to delete'}" ${policySelectionMode && !selectedPolicyUpdates.size ? 'disabled' : ''}>${trashIconMarkup()}</button>`;
    $('#hrReportHead').innerHTML = columns.map(col => `<th>${col}</th>`).join('');
    $('#hrReportBody').innerHTML = policies.length ? policies.map(policy => {
      const stats = policyStats(policy);
      const status = stats.pending ? 'Active' : 'Complete';
      const checked = selectedPolicyUpdates.has(policy.id) ? 'checked' : '';
      return `<tr>
        ${policySelectionMode ? `<td class="policy-select-cell"><input class="policy-row-checkbox" data-policy-select="${escapeHtml(policy.id)}" type="checkbox" ${checked} aria-label="Select ${escapeHtml(policy.title)}"></td>` : ''}
        <td><strong>${escapeHtml(policy.title)}</strong><small>${escapeHtml(policy.summary)}</small></td>
        <td>${escapeHtml(policy.published)}</td>
        <td>${escapeHtml(policy.deadline)}</td>
        <td>${stats.acknowledged} / ${stats.total}</td>
        <td>${stats.pending}</td>
        <td><span class="hr-status-pill ${stats.pending ? 'pending' : 'approved'}">${status}</span></td>
        <td><button class="hr-mini-action" data-policy-view="${escapeHtml(policy.id)}" type="button">View</button></td>
      </tr>`;
    }).join('') : `<tr><td class="empty-pending" colspan="${policySelectionMode ? 8 : 7}">No published policy updates.</td></tr>`;
    $('#hrReportModal').hidden = false;
    refreshPolicyDeleteButton();
  };

  const refreshPolicyDeleteButton = () => {
    const button = $('#deleteSelectedPolicy');
    if (button) button.disabled = policySelectionMode && !selectedPolicyUpdates.size;
    const selectAll = $('#selectAllPolicies');
    if (selectAll) {
      const policies = getPolicyCenter();
      selectAll.checked = Boolean(policies.length) && policies.every(policy => selectedPolicyUpdates.has(policy.id));
      selectAll.indeterminate = selectedPolicyUpdates.size > 0 && !selectAll.checked;
    }
  };

  const deletePolicyUpdates = policyIds => {
    const selectedIds = Array.isArray(policyIds) ? policyIds : [policyIds].filter(Boolean);
    if (!selectedIds.length) return toast('Select at least one published policy update first.');
    const selectedSet = new Set(selectedIds);
    const policies = getPolicyCenter();
    const removed = policies.filter(item => selectedSet.has(item.id));
    const remaining = policies.filter(item => !selectedSet.has(item.id));
    const acks = readPolicyAcks();
    selectedIds.forEach(id => delete acks[id]);
    savePolicyCenter(remaining);
    savePolicyAcks(acks);
    selectedPolicyUpdates.clear();
    policySelectionMode = false;
    closeActionModal();
    updatePolicyUpdateCounts();
    openPolicyCenter(false);
    toast(`Deleted ${removed.length} policy update${removed.length === 1 ? '' : 's'}.`);
  };

  const confirmDeletePolicyUpdate = policyIds => {
    const selectedIds = Array.isArray(policyIds) ? policyIds : [policyIds].filter(Boolean);
    if (!selectedIds.length) return toast('Select at least one published policy update first.');
    const selectedSet = new Set(selectedIds);
    const policies = getPolicyCenter().filter(item => selectedSet.has(item.id));
    if (!policies.length) return toast('Select at least one published policy update first.');
    actionTitle.textContent = 'Delete Policy Update';
    actionDescription.textContent = `Please confirm before deleting ${policies.length === 1 ? 'this published announcement' : 'these published announcements'}. This will also remove acknowledgement records.`;
    actionContent.innerHTML = `
      <form class="hr-form policy-delete-form" id="deletePolicyForm" data-policy-ids="${escapeHtml(selectedIds.join(','))}">
        <div class="policy-delete-warning">
          ${policies.map(policy => `<div class="policy-delete-item"><strong>${escapeHtml(policy.title)}</strong><small>${escapeHtml(policy.summary)}</small></div>`).join('')}
        </div>
        <div class="policy-delete-actions">
          <button class="policy-delete-cancel" id="cancelPolicyDelete" type="button">Cancel</button>
          <button class="policy-delete-confirm" type="submit">${trashIconMarkup()} <span>Confirm delete</span></button>
        </div>
      </form>`;
    actionModal.hidden = false;
  };

  const openPolicyDetail = policyId => {
    const policy = getPolicyCenter().find(item => item.id === policyId);
    if (!policy) return;
    const stats = policyStats(policy);
    const columns = ['Guard', 'Guard ID', 'Post', 'Acknowledgement'];
    $('#hrReportModal').dataset.reportMode = 'policy-detail';
    $('#hrReportPrint').hidden = true;
    if ($('#hrAttendanceDateControl')) $('#hrAttendanceDateControl').hidden = true;
    $('#hrReportTitle').innerHTML = `<button class="hr-back-link policy-detail-back" id="backToPolicyCenter" type="button">← Back to Policy Center</button><br>${escapeHtml(policy.title)}`;
    $('#hrReportDate').textContent = `${policy.summary} Deadline: ${policy.deadline}.`;
    $('#hrReportHead').innerHTML = columns.map(col => `<th>${escapeHtml(col).toUpperCase()}</th>`).join('');
    $('#hrReportBody').innerHTML = activeSecurityAccounts().map(account => {
      const stamp = stats.acks[account.userId];
      const label = stamp ? `Acknowledged · ${new Date(stamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Pending acknowledgement';
      return `<tr>
        <td><strong>${escapeHtml(displayNameOf(account))}</strong></td>
        <td>${escapeHtml(account.userId)}</td>
        <td>${escapeHtml(currentPostLabelOf(account))}</td>
        <td><span class="hr-status-pill ${stamp ? 'approved' : 'pending'}">${escapeHtml(label)}</span></td>
      </tr>`;
    }).join('') || '<tr><td class="empty-pending" colspan="4">No approved Security guards are available.</td></tr>';
  };

  const defaultHrRequests = () => {
    const staff = activeSecurityAccounts();
    const today = new Date().toISOString().slice(0, 10);
    const requests = [];
    staff.forEach((account, index) => {
      const record = attendanceStateFor(account);
      if (record.absent || record.missedOut) {
        requests.push({ id: `REQ-${today.replace(/-/g, '')}-${String(requests.length + 1).padStart(3, '0')}`, userId: account.userId, type: 'Attendance correction', detail: record.absent ? 'No QR scan recorded for today.' : 'Missed time-out scan.', filedAt: today, status: 'Pending' });
      }
      if (index === 0) requests.push({ id: `REQ-${today.replace(/-/g, '')}-OT1`, userId: account.userId, type: 'Overtime request', detail: 'Requesting overtime validation for extended post coverage.', filedAt: today, status: 'Pending' });
      if (!account.post) requests.push({ id: `REQ-${today.replace(/-/g, '')}-POST${index + 1}`, userId: account.userId, type: 'Post reassignment', detail: 'Guard has no assigned post and needs deployment.', filedAt: today, status: 'Pending' });
    });
    return requests;
  };

  const getHrRequests = () => {
    let saved = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(HR_REQUESTS_KEY) || '[]');
      if (Array.isArray(parsed)) saved = parsed;
    } catch { saved = []; }
    const existingKeys = new Set(saved.map(request => `${request.userId}|${request.type}|${request.detail}`));
    const additions = defaultHrRequests().filter(request => !existingKeys.has(`${request.userId}|${request.type}|${request.detail}`));
    if (additions.length) {
      saved = [...saved, ...additions];
      localStorage.setItem(HR_REQUESTS_KEY, JSON.stringify(saved));
    }
    return saved;
  };

  const saveHrRequests = requests => localStorage.setItem(HR_REQUESTS_KEY, JSON.stringify(requests));

  const updateHrRequestCounts = () => {
    const pending = getHrRequests().filter(request => request.status === 'Pending');
    const set = (selector, type) => {
      const element = $(selector);
      if (element) element.textContent = pending.filter(request => request.type === type).length;
    };
    set('#attendanceRequestCount', 'Attendance correction');
    set('#overtimeRequestCount', 'Overtime request');
    set('#postRequestCount', 'Post reassignment');
  };

  const openRequestsCenter = () => {
    const requests = getHrRequests();
    const accounts = getStoredAccounts();
    const columns = ['Request ID', 'Employee', 'Type', 'Date filed', 'Details', 'Status', 'Actions'];
    $('#hrReportModal').dataset.reportMode = 'requests-center';
    $('#hrReportPrint').hidden = true;
    if ($('#hrAttendanceDateControl')) $('#hrAttendanceDateControl').hidden = true;
    $('#hrReportTitle').textContent = 'HR Requests Center';
    $('#hrReportDate').textContent = 'Review attendance corrections, overtime, leave, and post reassignment requests.';
    $('#hrReportHead').innerHTML = columns.map(col => `<th>${escapeHtml(col).toUpperCase()}</th>`).join('');
    $('#hrReportBody').innerHTML = requests.length
      ? requests.map(request => {
          const account = accounts.find(item => item.userId === request.userId);
          const employee = account ? displayNameOf(account) : request.userId;
          const pending = request.status === 'Pending';
          return `<tr>
            <td>${escapeHtml(request.id)}</td>
            <td><strong>${escapeHtml(employee)}</strong><small>${escapeHtml(request.userId)}</small></td>
            <td>${escapeHtml(request.type)}</td>
            <td>${escapeHtml(request.filedAt)}</td>
            <td>${escapeHtml(request.detail)}</td>
            <td><span class="hr-status-pill ${pending ? 'pending' : request.status === 'Approved' ? 'approved' : 'rejected'}">${escapeHtml(request.status)}</span></td>
            <td>${pending ? `<div class="hr-inline-actions"><button class="hr-mini-action" data-request-action="approve" data-request-id="${escapeHtml(request.id)}" type="button">Approve</button><button class="hr-mini-action reject" data-request-action="reject" data-request-id="${escapeHtml(request.id)}" type="button">Reject</button></div>` : '—'}</td>
          </tr>`;
        }).join('')
      : '<tr><td class="empty-pending" colspan="7">No HR requests are awaiting review.</td></tr>';
    $('#hrReportModal').hidden = false;
    updateHrRequestCounts();
  };

  const handleRequestAction = event => {
    const button = event.target.closest('[data-request-action]');
    if (!button) return;
    const requests = getHrRequests();
    const request = requests.find(item => item.id === button.dataset.requestId);
    if (!request) return;
    request.status = button.dataset.requestAction === 'approve' ? 'Approved' : 'Rejected';
    request.reviewedAt = new Date().toISOString();
    saveHrRequests(requests);
    updateHrRequestCounts();
    openRequestsCenter();
    toast(`${request.type} was ${request.status.toLowerCase()}.`);
  };

  $('#policyCenterBtn')?.addEventListener('click', openPolicyCenter);
  $('#openPolicyCenter')?.addEventListener('click', openPolicyCenter);
  $('#adminPolicyCenter')?.addEventListener('click', openPolicyCenter);
  $('#publishPolicyUpdate')?.addEventListener('click', publishPolicyUpdate);
  $('#openRequestsCenter')?.addEventListener('click', openRequestsCenter);
  $('#hrReportTitle').addEventListener('click', event => {
    if (event.target.closest('#backToPolicyCenter')) openPolicyCenter();
  });
  $('#hrReportDate').addEventListener('click', event => {
    const deleteButton = event.target.closest('#deleteSelectedPolicy');
    if (!deleteButton) return;
    if (!policySelectionMode) return openPolicyCenter(true);
    confirmDeletePolicyUpdate([...selectedPolicyUpdates]);
  });
  $('#hrReportHead').addEventListener('change', event => {
    if (!event.target.matches('#selectAllPolicies')) return;
    selectedPolicyUpdates.clear();
    if (event.target.checked) getPolicyCenter().forEach(policy => selectedPolicyUpdates.add(policy.id));
    openPolicyCenter(true);
  });
  $('#hrReportBody').addEventListener('change', event => {
    if (!event.target.matches('[data-policy-select]')) return;
    if (event.target.checked) selectedPolicyUpdates.add(event.target.dataset.policySelect);
    else selectedPolicyUpdates.delete(event.target.dataset.policySelect);
    refreshPolicyDeleteButton();
  });
  $('#hrReportBody').addEventListener('click', event => {
    const policyButton = event.target.closest('[data-policy-view]');
    if (policyButton) return openPolicyDetail(policyButton.dataset.policyView);
    handleRequestAction(event);
  });
  updateHrRequestCounts();

  /* --- HR workflow reports: attendance logs + exception reports --- */

  let currentReport = null;

  const openHrReport = mode => {
    const isAttendance = mode === 'attendance';
    setReportDateMode(isAttendance ? 'hr-attendance' : 'exceptions');
    const records = collectTodayAttendance(selectedAttendanceDate);
    const rows = isAttendance
      ? records.filter(record => record.hasScan)
      : records.filter(record => record.exception);
    const columns = isAttendance
      ? ['Guard name', 'Guard ID', 'Time in', 'Time out']
      : ['Guard name', 'Guard ID', 'Time in', 'Time out', 'Issue'];
    currentReport = {
      title: isAttendance ? 'Attendance Logs' : 'Exception reports',
      columns,
      rows: rows.map(record => isAttendance
        ? [record.name, record.id, record.timeIn || '—', record.timeOut || '—']
        : [record.name, record.id, record.timeIn || '—', record.timeOut || '—', exceptionLabelOf(record)]),
      emptyText: isAttendance
        ? 'No QR scans recorded for this date.'
        : 'No exceptions for this date — every guard scanned on time.',
    };
    $('#hrReportModal').dataset.reportMode = isAttendance ? 'hr-attendance' : 'exceptions';
    $('#hrReportPrint').hidden = false;
    if ($('#hrAttendanceDateControl')) $('#hrAttendanceDateControl').hidden = false;
    updateAttendanceDateLabel();
    $('#hrReportTitle').textContent = currentReport.title;
    $('#hrReportDate').textContent = selectedAttendanceDate.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    $('#hrReportHead').innerHTML = columns.map(col => `<th>${escapeHtml(col).toUpperCase()}</th>`).join('');
    $('#hrReportBody').innerHTML = currentReport.rows.length
      ? currentReport.rows.map(cells => `<tr>${cells.map((cell, index) => index === 0 ? `<td><strong>${escapeHtml(cell)}</strong></td>` : `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')
      : `<tr><td class="empty-pending" colspan="${columns.length}">${escapeHtml(currentReport.emptyText)}</td></tr>`;
    $('#hrReportModal').hidden = false;
  };

  $('#hrAttendanceLogsBtn').addEventListener('click', () => openHrReport('attendance'));
  document.addEventListener('attendance-date-applied', event => {
    if ($('#hrReportModal').hidden) return;
    const mode = $('#hrReportModal').dataset.reportMode;
    if (mode === 'hr-attendance' && event.detail?.mode === 'hr-attendance') openHrReport('attendance');
    if (mode === 'exceptions' && event.detail?.mode === 'exceptions') openHrReport('exceptions');
  });
  $('#hrExceptionReportsBtn').addEventListener('click', () => openHrReport('exceptions'));
  $('#closeHrReport').addEventListener('click', () => { $('#hrReportModal').hidden = true; });
  closeWhenBackdropIsClicked($('#hrReportModal'), () => { $('#hrReportModal').hidden = true; });
  $('#hrReportPrint').addEventListener('click', () => {
    if (!currentReport || !openPrintReport(currentReport)) toast('Allow pop-ups to download or print this report');
  });

  /* --- employee directory (registration details + age) --- */

  const renderEmployeeDirectory = (query = '') => {
    const needle = query.trim().toLowerCase();
    const entries = [];
    getStoredAccounts()
      .filter(account => account.status === 'Active' && account.department === 'Security')
      .forEach(account => {
        const age = ageOf(account);
        entries.push({
          name: displayNameOf(account), id: account.userId,
          email: account.email || '—', contact: account.phone ? formatPhone(account.phone) : (account.email || '—'),
          age: age === null ? '—' : String(age),
        });
      });
    const matches = entries.filter(entry =>
      !needle || `${entry.name} ${entry.id} ${entry.email}`.toLowerCase().includes(needle));
    $('#employeeDirectoryPageCount').textContent = entries.length;
    $('#employeeDirectoryPageBody').innerHTML = matches.length
      ? matches.map(entry => `<tr class="employee-directory-row" data-user-id="${escapeHtml(entry.id)}"><td><strong>${escapeHtml(entry.name)}</strong><small>Click to view full profile</small></td><td>${escapeHtml(entry.id)}</td><td>${escapeHtml(entry.email)}</td><td>${escapeHtml(entry.contact)}</td><td>${escapeHtml(entry.age)}</td></tr>`).join('')
      : '<tr><td class="empty-pending" colspan="5">No guards match your search.</td></tr>';
  };

  const showHrWorkspace = () => {
    $('#employeeDirectoryPage').hidden = true;
    $('#hrPanel').hidden = false;
    $('#hrActions').hidden = false;
  };

  const employeeSearchBox = $('#employeeSearchInput');
  const employeeSearchShell = employeeSearchBox.closest('.employee-search');
  const employeeSuggestions = document.createElement('div');
  employeeSuggestions.id = 'employeeSearchSuggestions';
  employeeSuggestions.className = 'employee-suggestions';
  employeeSuggestions.hidden = true;
  employeeSearchShell.insertAdjacentElement('afterend', employeeSuggestions);

  const employeeSuggestionMatches = query => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return activeSecurityAccounts()
      .filter(account => `${displayNameOf(account)} ${account.userId} ${account.email || ''}`.toLowerCase().includes(needle))
      .slice(0, 6);
  };

  const renderEmployeeSuggestions = query => {
    const matches = employeeSuggestionMatches(query);
    employeeSuggestions.hidden = !matches.length;
    employeeSuggestions.innerHTML = matches.map(account => {
      const record = attendanceStateFor(account);
      const statusText = record.absent ? 'Absent / no scan' : record.late ? 'Late' : record.completed ? 'Completed' : 'On duty';
      return `<button type="button" data-user-id="${escapeHtml(account.userId)}">
        <strong>${escapeHtml(displayNameOf(account))}</strong>
        <small>${escapeHtml(account.userId)} · ${escapeHtml(currentPostLabelOf(account))} · ${escapeHtml(statusText)}</small>
      </button>`;
    }).join('');
  };

  employeeSearchBox.addEventListener('input', event => renderEmployeeSuggestions(event.target.value));
  employeeSearchBox.addEventListener('focus', event => renderEmployeeSuggestions(event.target.value));
  employeeSuggestions.addEventListener('click', event => {
    const button = event.target.closest('[data-user-id]');
    if (!button) return;
    employeeSuggestions.hidden = true;
    employeeSearchBox.value = button.querySelector('strong')?.textContent || '';
    profiles.showAccountProfile(button.dataset.userId);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.employee-search') && !event.target.closest('#employeeSearchSuggestions')) {
      employeeSuggestions.hidden = true;
    }
  });

  $('#openEmployeeDirectory').addEventListener('click', () => {
    const prefill = $('#employeeSearchInput').value;
    $('#employeeDirectoryPageSearch').value = prefill;
    renderEmployeeDirectory(prefill);
    $('#hrPanel').hidden = true;
    $('#hrActions').hidden = true;
    $('#employeeDirectoryPage').hidden = false;
    $('#employeeDirectoryPage').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#backToHrWorkspace').addEventListener('click', showHrWorkspace);
  $('#employeeDirectoryPageSearch').addEventListener('input', event => renderEmployeeDirectory(event.target.value));
  $('#employeeDirectoryPageBody').addEventListener('click', event => {
    const row = event.target.closest('[data-user-id]');
    if (!row) return;
    profiles.showAccountProfile(row.dataset.userId);
  });

  /* --- panel switching --- */

  const setPanel = panel => {
    $('#employeeDirectoryPage').hidden = true;
    $('#activeAccountsPage').hidden = true;
    $('#manageAccountsPage').hidden = true;
    document.body.classList.remove(...bodyClasses);
    if (panel !== 'attendance') document.body.classList.add(`${panel}-panel-active`);

    Object.entries(sections).forEach(([name, elements]) => {
      elements.forEach(element => { element.hidden = name !== panel; });
    });
    Object.entries(navItems).forEach(([name, item]) => item.classList.toggle('active', name === panel));

    updateSystemCounts();
    if (panel === 'hr') {
      renderGuardDirectory();
      updateHrRequestCounts();
      updatePolicyUpdateCounts();
    }
    if (panel === 'admin') {
      renderPendingAccounts();
      renderUserAccounts();
    }
  };

  Object.entries(navItems).forEach(([panel, item]) => {
    item.addEventListener('click', event => {
      event.preventDefault();
      setPanel(panel);
    });
  });

  /* --- HR / payroll tool dialogs --- */

  const renderReportForm = () => `
    <form class="hr-form">
      <label>Period
        <select>
          <option>Today — 10 Aug 2026</option>
          <option>This week</option>
          <option>This month</option>
        </select>
      </label>
      <label>Output
        <select>
          <option>PDF summary</option>
          <option>Excel spreadsheet</option>
        </select>
      </label>
      <button type="submit">Generate report</button>
    </form>`;

  const renderEmployeeForm = action => `
    <form class="hr-form">
      <label>Employee
        <select>${activeSecurityAccounts().map(account => `<option>${escapeHtml(displayNameOf(account))} — ${escapeHtml(account.userId)}</option>`).join('') || '<option>No approved Security accounts</option>'}</select>
      </label>
      <label>${action === 'add' ? 'Employee name' : 'Update details'}
        <input required placeholder="Enter required information">
      </label>
      <button type="submit">Save ${action === 'add' ? 'employee' : 'changes'}</button>
    </form>`;

  const openAdminExceptionBreakdown = () => {
    const records = collectTodayAttendance().filter(record => record.late || record.absent);
    actionTitle.textContent = 'Late and Absent Logs';
    actionDescription.textContent = 'Realtime exception breakdown for today based on QR attendance records.';
    actionContent.innerHTML = records.length ? `
      <div class="payroll-table-wrap">
        <table class="payroll-salary-table admin-exception-table">
          <thead><tr><th>Guard</th><th>Guard ID</th><th>Issue</th><th>Time in</th><th>Time out</th><th>Post</th></tr></thead>
          <tbody>${records.map(record => `<tr>
            <td><strong>${escapeHtml(record.name)}</strong></td>
            <td>${escapeHtml(record.id)}</td>
            <td><span class="hr-status-pill ${record.late ? 'pending' : 'rejected'}">${record.late ? 'Late arrival' : 'Absent / no scan'}</span></td>
            <td>${escapeHtml(record.timeIn || '—')}</td>
            <td>${escapeHtml(record.timeOut || '—')}</td>
            <td>${escapeHtml(currentPostLabelOf(record.account))}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>` : '<div class="empty-pending">No late or absent records for today.</div>';
    actionModal.hidden = false;
  };

  const renderSalaryManager = () => {
    const profiles = readSalaryProfiles();
    const accounts = activeSecurityAccounts();
    if (!accounts.length) return '<div class="empty-pending">No approved Security guards are available. Approve Security accounts first.</div>';
    return `
      <form class="hr-form payroll-salary-form" id="payrollSalaryForm">
        <div class="payroll-table-wrap">
          <table class="payroll-salary-table">
            <thead><tr><th>Guard</th><th>Monthly salary</th><th>Work days</th><th>Shift hrs</th><th>OT x</th><th>Allowances</th><th>Deductions</th></tr></thead>
            <tbody>${accounts.map(account => {
              const profile = normalizedSalaryProfile(account, profiles[account.userId] || {});
              return `<tr data-user-id="${escapeHtml(account.userId)}">
                <td><strong>${escapeHtml(displayNameOf(account))}</strong><small>${escapeHtml(account.userId)}</small></td>
                <td><input name="monthlySalary" type="number" min="0" step="0.01" value="${profile.monthlySalary || ''}" placeholder="0.00"></td>
                <td><input name="workingDays" type="number" min="1" step="1" value="${profile.workingDays}"></td>
                <td><input name="shiftHours" type="number" min="1" step="0.5" value="${profile.shiftHours}"></td>
                <td><input name="overtimeMultiplier" type="number" min="1" step="0.05" value="${profile.overtimeMultiplier}"></td>
                <td><input name="allowances" type="number" min="0" step="0.01" value="${profile.allowances || ''}" placeholder="0.00"></td>
                <td><input name="deductions" type="number" min="0" step="0.01" value="${profile.deductions || ''}" placeholder="0.00"></td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
        <p class="payroll-helper">Daily, hourly, and overtime rates are computed automatically from the monthly salary.</p>
        <button type="submit">Save salary profiles</button>
      </form>`;
  };

  const renderPayrollRowsTable = (mode = 'run') => {
    const summary = payrollSummary();
    const rows = summary.rows;
    if (!rows.length) return '<div class="empty-pending">No approved Security guards are available for payroll.</div>';
    return `
      <div class="payroll-summary-strip">
        <span>Period: <strong>${escapeHtml(summary.period.label)}</strong></span>
        <span>Estimated net: <strong>${money(summary.estimated)}</strong></span>
        <span>Salary profiles: <strong>${summary.profileCount}/${summary.guardCount}</strong></span>
      </div>
      <div class="payroll-table-wrap">
        <table class="payroll-salary-table payroll-run-table">
          <thead><tr><th>Guard</th><th>Paid days</th><th>Absent</th><th>OT hrs</th><th>Late mins</th><th>Allowance</th><th>Adjustments</th><th>Gross</th><th>Deductions</th><th>Net pay</th></tr></thead>
          <tbody>${rows.map(row => `<tr>
            <td><strong>${escapeHtml(displayNameOf(row.account))}</strong><small>${escapeHtml(row.account.userId)}${row.profile ? '' : ' · Missing salary profile'}</small></td>
            <td>${row.paidDays}</td>
            <td>${row.absentDays}</td>
            <td>${row.overtimeHours.toFixed(2)}</td>
            <td>${Math.round(row.lateMinutes)}</td>
            <td>${money(row.allowancePay)}</td>
            <td>${money(row.adjustmentPay)}</td>
            <td>${money(row.grossPay)}</td>
            <td>${money(row.totalDeductions)}</td>
            <td><strong>${money(row.netPay)}</strong></td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      ${mode === 'run' ? '<button class="hr-primary payroll-finalize" id="finalizePayrollRun" type="button">Finalize payroll run</button>' : '<button class="hr-primary payroll-finalize" id="downloadPayrollReport" type="button">Prepare payroll report</button>'}`;
  };

  const renderPayrollAdjustments = () => {
    const accounts = activeSecurityAccounts();
    const names = Object.fromEntries(accounts.map(account => [account.userId, displayNameOf(account)]));
    const adjustments = readPayrollAdjustments();
    return `
      <form class="hr-form payroll-adjustment-form" id="payrollAdjustmentForm">
        <label>Adjustment type
          <select id="payrollAdjustmentType" required><option>Overtime hours</option><option>Paid leave</option><option>Unpaid leave</option><option>Bonus</option><option>Cash advance</option><option>Other deduction</option></select>
        </label>
        <label>Guard
          <select id="payrollAdjustmentUser" required>${accounts.map(account => `<option value="${escapeHtml(account.userId)}">${escapeHtml(displayNameOf(account))} — ${escapeHtml(account.userId)}</option>`).join('') || '<option value="">No approved Security accounts</option>'}</select>
        </label>
        <label><span id="payrollAdjustmentAmountLabel">Hours / days / amount</span>
          <input id="payrollAdjustmentAmount" type="number" min="0" step="0.01" required placeholder="Enter hours, days, or amount">
        </label>
        <p class="payroll-helper" id="payrollAdjustmentHint">Overtime uses hours × overtime rate. Paid/unpaid leave uses days × daily rate. Bonus, cash advance, and other deductions use peso amounts.</p>
        <label>Notes
          <input id="payrollAdjustmentNote" maxlength="120" placeholder="Optional reason or approval reference">
        </label>
        <button type="submit">Save adjustment</button>
      </form>
      <div class="payroll-adjustment-list">
        <h3>Saved adjustments</h3>
        ${adjustments.length ? `<div class="payroll-table-wrap"><table class="payroll-salary-table"><thead><tr><th>Guard</th><th>Type</th><th>Value</th><th>Date</th><th>Note</th><th>Action</th></tr></thead><tbody>${adjustments.map(item => `<tr><td>${escapeHtml(names[item.userId] || item.userId)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.amount)}${item.unit ? ` ${escapeHtml(item.unit)}` : ''}</td><td>${escapeHtml(item.date || '')}</td><td>${escapeHtml(item.note || '—')}</td><td><button class="payroll-adjustment-delete" data-adjustment-delete="${escapeHtml(item.id)}" type="button">Delete</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-pending">No payroll adjustments saved yet.</div>'}
      </div>`;
  };


  const openAction = (action, type = 'hr') => {
    if (action === 'profiles') return profiles.showAll();
    if (action === 'attendance') return setPanel('attendance');

    const isPayroll = type === 'payroll';
    actionTitle.textContent = (isPayroll ? PAYROLL_ACTIONS : HR_ACTIONS)[action];
    actionDescription.textContent = isPayroll
      ? 'Payroll uses guard salary profiles and validated QR attendance records to compute monthly pay.'
      : 'Use this mock HR tool to review and update staff information.';

    const records = isPayroll ? PAYROLL_ACTION_RECORDS : HR_ACTION_RECORDS;
    if (isPayroll && action === 'salary') actionContent.innerHTML = renderSalaryManager();
    else if (isPayroll && action === 'validated') actionContent.innerHTML = renderPayrollRowsTable('validated');
    else if (isPayroll && action === 'overtime') actionContent.innerHTML = renderPayrollAdjustments();
    else if (isPayroll && action === 'run') actionContent.innerHTML = renderPayrollRowsTable('run');
    else if (isPayroll && action === 'reports') actionContent.innerHTML = renderPayrollRowsTable('reports');
    else if (records[action]) actionContent.innerHTML = renderRecordList(records[action]);
    else if (REPORT_ACTIONS.includes(action)) actionContent.innerHTML = renderReportForm();
    else actionContent.innerHTML = renderEmployeeForm(action);

    actionModal.hidden = false;
  };

  $$('[data-hr-action]').forEach(button => {
    button.addEventListener('click', () => openAction(button.dataset.hrAction));
  });

  $$('[data-payroll-action]').forEach(button => {
    button.addEventListener('click', () => openAction(button.dataset.payrollAction, 'payroll'));
  });

  $('#addEmployee')?.addEventListener('click', () => openAction('add'));
  $('#guardDirectorySearch').addEventListener('input', event => renderGuardDirectory(event.target.value));
  $('#createPayroll')?.addEventListener('click', () => openAction('run', 'payroll'));
  $('#reviewExceptions').addEventListener('click', openAdminExceptionBreakdown);
  $('#exportAnalytics')?.addEventListener('click', () => toast('Analytics summary is ready to export'));

  /* --- approve / reject / activate / deactivate / remove accounts --- */

  pendingAccountRows?.addEventListener('click', handleAccountAction);
  userAccountRows?.addEventListener('click', handleAccountAction);
  manageAccountsPageBody?.addEventListener('click', event => {
    const manageButton = event.target.closest('[data-account-manage]');
    if (manageButton) return openManageAccountModal(manageButton.dataset.accountManage);
    handleAccountAction(event);
  });

  /* --- dialog closing and mock submissions --- */

  $('#closeHrAction').addEventListener('click', closeActionModal);
  closeWhenBackdropIsClicked(actionModal, closeActionModal);

  actionContent.addEventListener('click', event => {
    if (event.target.closest('#cancelPolicyDelete') || event.target.closest('#cancelAccountDelete')) closeActionModal();
    const modalAccountAction = event.target.closest('[data-account-modal-action]');
    if (modalAccountAction) {
      const form = modalAccountAction.closest('#manageAccountForm');
      if (form) applyModalAccountAction(form.dataset.userId, modalAccountAction.dataset.accountModalAction);
    }
    if (event.target.closest('#finalizePayrollRun')) {
      const summary = payrollSummary();
      if (summary.missingProfiles) return toast('Set salary profiles for every guard before finalizing payroll.');
      const runs = readStoredList(PAYROLL_RUNS_KEY);
      runs.unshift({ id: `PAY-${Date.now()}`, period: summary.period.label, estimated: summary.estimated, createdAt: new Date().toISOString(), rows: summary.rows.map(row => ({ userId: row.account.userId, netPay: row.netPay })) });
      localStorage.setItem(PAYROLL_RUNS_KEY, JSON.stringify(runs));
      syncDatabase('syncPayrollRuns', runs);
      updatePayrollDashboard();
      toast('Payroll run finalized and saved.');
    }
    if (event.target.closest('#downloadPayrollReport')) {
      downloadPayrollCsv();
      toast('Payroll report CSV downloaded.');
    }
    const deleteAdjustment = event.target.closest('[data-adjustment-delete]');
    if (deleteAdjustment) {
      savePayrollAdjustments(readPayrollAdjustments().filter(item => item.id !== deleteAdjustment.dataset.adjustmentDelete));
      updatePayrollDashboard();
      actionContent.innerHTML = renderPayrollAdjustments();
      toast('Payroll adjustment deleted.');
    }
  });

  actionContent.addEventListener('change', event => {
    const editForm = event.target.closest('#manageAccountForm');
    if (editForm && event.target.matches('[data-edit-country], [data-edit-region], [data-edit-city]')) return updateEditAddressOptions(editForm);
    if (!event.target.matches('#payrollAdjustmentType')) return;
    const type = event.target.value;
    const label = $('#payrollAdjustmentAmountLabel');
    const input = $('#payrollAdjustmentAmount');
    const hint = $('#payrollAdjustmentHint');
    const copy = {
      'Overtime hours': ['Overtime hours', 'Enter number of overtime hours', 'Computed as hours × overtime rate.'],
      'Paid leave': ['Paid leave days', 'Enter number of paid leave days', 'Computed as days × daily rate.'],
      'Unpaid leave': ['Unpaid leave days', 'Enter number of unpaid leave days', 'Deducted as days × daily rate.'],
      'Bonus': ['Bonus amount', 'Enter peso amount', 'Added directly to payroll.'],
      'Cash advance': ['Cash advance amount', 'Enter peso amount', 'Deducted directly from payroll.'],
      'Other deduction': ['Deduction amount', 'Enter peso amount', 'Deducted directly from payroll.'],
    }[type] || ['Hours / days / amount', 'Enter value', 'Enter the approved payroll value.'];
    if (label) label.textContent = copy[0];
    if (input) input.placeholder = copy[1];
    if (hint) hint.textContent = copy[2];
  });

  actionContent.addEventListener('submit', event => {
    event.preventDefault();
    if (event.target.id === 'manageAccountForm') {
      updateAccountFromManageForm(event.target);
      return;
    }
    if (event.target.id === 'deleteAccountForm') {
      const accounts = getStoredAccounts();
      const account = accounts.find(item => item.userId === event.target.dataset.userId);
      if (!account) return toast('Account record was not found.');
      const message = applyAccountAction(accounts, account, 'remove');
      saveStoredAccounts(accounts);
      closeActionModal();
      refreshAccountsViews();
      toast(message || 'Account was deleted.');
      return;
    }
    if (event.target.id === 'payrollSalaryForm') {
      const profiles = readSalaryProfiles();
      $$('#payrollSalaryForm tbody tr').forEach(row => {
        const account = activeSecurityAccounts().find(item => item.userId === row.dataset.userId);
        if (!account) return;
        const data = Object.fromEntries([...row.querySelectorAll('input')].map(input => [input.name, input.value]));
        profiles[account.userId] = normalizedSalaryProfile(account, { ...data, updatedAt: new Date().toISOString(), status: 'Active' });
      });
      saveSalaryProfiles(profiles);
      updatePayrollDashboard();
      closeActionModal();
      toast('Guard salary profiles were saved. Payroll estimates updated.');
      return;
    }
    if (event.target.id === 'payrollAdjustmentForm') {
      const userId = $('#payrollAdjustmentUser')?.value;
      const type = $('#payrollAdjustmentType')?.value;
      const amount = Number($('#payrollAdjustmentAmount')?.value || 0);
      const note = $('#payrollAdjustmentNote')?.value.trim() || '';
      if (!userId || !type || amount <= 0) return toast('Choose a guard, adjustment type, and valid amount/hours.');
      const unit = type === 'Overtime hours' ? 'hours' : ['Paid leave', 'Unpaid leave'].includes(type) ? 'days' : 'amount';
      const adjustments = readPayrollAdjustments();
      adjustments.unshift({ id: `ADJ-${Date.now()}`, userId, type, amount, unit, note, date: today(), createdAt: new Date().toISOString() });
      savePayrollAdjustments(adjustments);
      updatePayrollDashboard();
      actionContent.innerHTML = renderPayrollAdjustments();
      toast('Payroll adjustment saved.');
      return;
    }
    if (event.target.id === 'deletePolicyForm') {
      deletePolicyUpdates((event.target.dataset.policyIds || '').split(',').filter(Boolean));
      return;
    }
    if (event.target.id === 'publishPolicyForm') {
      const title = $('#policyTitleInput').value.trim();
      const summary = $('#policySummaryInput').value.trim();
      const deadline = $('#policyDeadlineInput').value;
      if (!title || !summary || !deadline) return toast('Complete the policy title, details, and deadline.');
      if (deadline < today()) return toast('Choose today or a future deadline.');
      closeActionModal();
      savePublishedPolicy({ title, summary, deadline });
      return;
    }
    closeActionModal();
    toast(/payroll/i.test(actionTitle.textContent)
      ? 'Payroll report is ready to generate'
      : 'HR record updated successfully');
  });
}


/* ------------------------------------------------------------------
   Start-up
------------------------------------------------------------------ */

function initLogoutButton() {
  const button = $('#logoutButton');
  const screen = $('#authScreen');
  if (!button || !screen) return;
  button.addEventListener('click', () => {
    sessionStorage.removeItem('sentryLoggedInUser');
    $('#adminPanelNav').hidden = true;
    screen.hidden = false;
    $('#authPassword').value = '';
    document.body.classList.remove('hr-panel-active', 'payroll-panel-active', 'admin-panel-active');
    $('#attendanceNav')?.click();
  });
}

async function initDashboard() {
  await window.SentryDB?.hydrate?.();
  migrateStoredAccounts();
  const toast = createToast($('#toast'));

  initAuthentication();
  initLogoutButton();
  initAddressCascade();
  renderAttendanceBoard();
  initShiftHandovers();
  initAttendance(toast);
  updateSystemCounts();
  initScanner();
  initCarousel();
  const profiles = initProfiles();
  initWorkspace(toast, profiles);
  window.addEventListener('storage', event => {
    if (event.key === USER_ACCOUNTS_KEY || event.key === ATTENDANCE_LOGS_KEY || event.key?.startsWith(MOBILE_TODAY_KEY_PREFIX)) {
      renderAttendanceBoard();
      updateSystemCounts();
    }
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);
