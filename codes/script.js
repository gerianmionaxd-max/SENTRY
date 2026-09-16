/*
 * Sentry attendance dashboard interactions.
 * This is a client-side demo: form submissions only update the interface.
 */


/* ------------------------------------------------------------------
   Static demo data
------------------------------------------------------------------ */

const GUARDS = {
  ramon: {
    name: 'Ramon Santos', id: 'SG-2024-0182', post: 'Trinitarian Centre',
    assignment: 'Main Gate · Day shift', phone: '+63 917 555 0182',
    email: 'ramon.santos@sentry.ph', status: 'On duty', image: '../images/SP.jpg',
  },
  ricardo: {
    name: 'Ricardo Williams', id: 'SG-2024-0097', post: 'Trinidad Complex',
    assignment: 'Lobby post · Day shift', phone: '+63 917 555 0097',
    email: 'ricardo.williams@sentry.ph', status: 'On duty', image: '../images/RW.png',
  },
  leo: {
    name: 'Leo Jimenez', id: 'SG-2024-0241', post: 'Macario-Catalina Building',
    assignment: 'Gate post · Day shift', phone: '+63 917 555 0241',
    email: 'leo.jimenez@sentry.ph', status: 'Late arrival', image: '../images/LJ.webp',
  },
  juan: {
    name: 'Juan Flores', id: 'SG-2024-0064', post: 'Trinitarian Centre',
    assignment: 'Loading Bay · Day shift', phone: '+63 917 555 0064',
    email: 'juan.flores@sentry.ph', status: 'On duty', image: '../images/JF.png',
  },
  kevin: {
    name: 'Kevin Silva', id: 'SG-2024-0156', post: 'JTA Building',
    assignment: 'Perimeter post · Night shift', phone: '+63 917 555 0156',
    email: 'kevin.silva@sentry.ph', status: 'Absent', image: '../images/KS.jpg',
  },
};

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
  reports: 'Generate payroll-ready report',
  run: 'Review payroll run',
};

/* Demo record sets rendered inside the HR / payroll tool dialogs */
const HR_ACTION_RECORDS = {
  exceptions: [
    ['Leo Jimenez', 'Late arrival · 07:03 AM'],
    ['Kevin Silva', 'No QR scan recorded · Absent'],
  ],
  schedule: [
    ['Ramon Santos', 'Trinitarian Centre · Day shift'],
    ['Ricardo Williams', 'Trinidad Complex · Day shift'],
    ['Kevin Silva', 'JTA Building · Night shift'],
  ],
};

const PAYROLL_ACTION_RECORDS = {
  validated: [
    ['Ramon Santos', '22 work days · 0.5 overtime hours'],
    ['Ricardo Williams', '22 work days · 2 overtime hours'],
    ['Juan Flores', '22 work days · 1 overtime hour'],
  ],
  overtime: [
    ['Ricardo Williams', '2 overtime hours · Pending'],
    ['Leo Jimenez', '1 leave day · Pending'],
    ['Kevin Silva', 'Night differential · Pending'],
  ],
};

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
}

/* Guard IDs look like SG-2026-0242: "SG", the registration year and a
   4-digit user number that stays unique across demo and staff guards. */
const GUARD_ID_PATTERN = /^SG-(\d{4})-(\d{4})$/;
const MOBILE_TODAY_KEY_PREFIX = 'sentryGuardToday_';

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
   staff accounts match the demo guard format. The guard's in-progress
   mobile day state moves to the new id when one exists. */
function migrateStoredAccounts() {
  let accounts = readStoredList(USER_ACCOUNTS_KEY);
  if (!accounts.length) accounts = readStoredList(LEGACY_PENDING_ACCOUNTS_KEY);
  if (!accounts.length) return;
  const used = usedGuardNumbers();
  let changed = false;
  accounts.forEach(account => {
    if (GUARD_ID_PATTERN.test(account.userId || '')) return;
    const oldTodayKey = MOBILE_TODAY_KEY_PREFIX + account.userId;
    account.userId = nextGuardId(registrationYearOf(account), used);
    try {
      const dayState = localStorage.getItem(oldTodayKey);
      if (dayState !== null) {
        localStorage.setItem(MOBILE_TODAY_KEY_PREFIX + account.userId, dayState);
        localStorage.removeItem(oldTodayKey);
      }
    } catch { /* private mode: keep going without the day state */ }
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

function initAttendance(toast) {
  const filters = $$('.filter');
  const rows = $$('#attendanceRows tr');
  const searchInput = $('#qrSearch');

  const showRows = predicate => rows.forEach(row => { row.hidden = !predicate(row); });
  const activateFilter = activeFilter =>
    filters.forEach(filter => filter.classList.toggle('active', filter === activeFilter));

  filters.forEach(filter => filter.addEventListener('click', () => {
    activateFilter(filter);
    const status = filter.dataset.filter;
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

  $('#qrSearchBtn').addEventListener('click', searchByQr);
  searchInput.addEventListener('keydown', event => { if (event.key === 'Enter') searchByQr(); });
}


/* ------------------------------------------------------------------
   Live counters shared by every panel
------------------------------------------------------------------ */

function updateSystemCounts() {
  const rows = $$('#attendanceRows tr');
  const countByStatus = status => rows.filter(row => row.dataset.status === status).length;

  const total = rows.length;
  const onDuty = countByStatus('present');
  const late = countByStatus('late');
  const absent = countByStatus('absent');
  const verified = total - absent;
  const exceptions = late + absent;

  const accounts = getStoredAccounts();
  const activeAccounts = accounts.filter(account => account.status === 'Active').length;
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

  /* HR panel */
  setText('#hrRegisteredGuardCount', Object.keys(GUARDS).length + activeAccounts);
  setText('#hrExceptionCount', exceptions);
  setText('#hrExceptionNote', `${late} late · ${absent} absent today`);
  setText('#hrPendingAccountCount', pendingAccounts);
  setText('#hrAttendanceRecordCount', total);
  setText('#hrExceptionTaskCount', exceptions);

  /* Payroll panel */
  setText('#payrollValidatedCount', verified);
  setText('#payrollTaskCount', verified);

  /* Admin panel */
  setText('#adminAttendanceRate', `${Math.round((onDuty / total) * 100)}%`);
  setText('#adminOnDutyCount', onDuty);
  setText('#adminCoverageNote', `Of ${total} current guards`);
  setText('#adminExceptionCount', exceptions);
  setText('#adminExceptionNote', `${late} late · ${absent} absent`);
  setText('#adminVerificationRate', `${Math.round((verified / total) * 100)}%`);
  setText('#adminLateCount', late);
  setText('#adminAbsentCount', absent);
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

  const showProfile = guardId => {
    const guard = GUARDS[guardId];
    if (!guard) return;

    name.textContent = guard.name;
    image.src = guard.image;
    image.alt = `${guard.name} profile photo`;
    status.textContent = `● ${guard.status}`;
    details.className = 'profile-details';

    const fields = [
      ['Guard ID', guard.id],
      ['Assigned post', guard.post],
      ['Assignment', guard.assignment],
      ['Contact number', guard.phone],
      ['Email address', guard.email],
      ['Registration status', 'Verified guard'],
    ];

    details.innerHTML = fields
      .map(([label, value]) => `<div class="profile-detail"><span>${label}</span><strong>${value}</strong></div>`)
      .join('');
    open();
  };

  const showAll = () => {
    name.textContent = 'Registered guards';
    image.src = '../images/1568-logo-1781901055.317-00a3e4-color.webp';
    image.alt = 'Sentry logo';
    status.textContent = `${Object.keys(GUARDS).length} guard records`;
    details.className = 'profile-details all-guards';

    details.innerHTML = Object.values(GUARDS)
      .map(guard => `
        <div class="guard-summary">
          <img src="${guard.image}" alt="">
          <div><strong>${guard.name}</strong><small>${guard.id} · ${guard.post}</small></div>
        </div>`)
      .join('');
    open();
  };

  $$('.profile-button').forEach(button => button.addEventListener('click', () => showProfile(button.dataset.guard)));
  $('#viewAll').addEventListener('click', showAll);
  $('#closeProfile').addEventListener('click', close);
  closeWhenBackdropIsClicked(modal, close);

  return { showAll };
}


/* ------------------------------------------------------------------
   Workspace switching, account approvals and tool dialogs
------------------------------------------------------------------ */

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
  const accessAssignmentForm = $('#accessAssignmentForm');
  const accessUserId = $('#accessUserId');
  const accessExpiration = $('#accessExpiration');
  const rightInputs = {
    Read: $('#accessRead'),
    Write: $('#accessWrite'),
    Execute: $('#accessExecute'),
    Admin: $('#accessAdmin'),
  };

  const closeActionModal = () => { actionModal.hidden = true; };

  /* --- pending account approvals --- */

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
            <td>
              <div class="account-actions">
                <button class="approve-account" data-account-action="approve"
                        data-user-id="${escapeHtml(account.userId)}" type="button">Approve</button>
                <button class="reject-account" data-account-action="reject"
                        data-user-id="${escapeHtml(account.userId)}" type="button">Reject</button>
              </div>
            </td>
          </tr>`).join('')
      : '<tr><td class="empty-pending" colspan="6">No account requests are awaiting approval.</td></tr>';
  };

  /* --- role and access assignment --- */

  const updateAccessRightsView = () => {
    const account = getStoredAccounts().find(item => item.userId === accessUserId.value);
    const rights = account?.accessRights || (account ? accessForDepartment(account.department) : []);

    Object.entries(rightInputs).forEach(([right, input]) => { input.checked = rights.includes(right); });
    accessExpiration.value = account?.expirationDate || '';
    accessExpiration.disabled = !account;
  };

  const renderAccessAssignment = () => {
    const activeAccounts = getStoredAccounts().filter(account => account.status === 'Active');
    const selectedId = accessUserId.value;

    accessUserId.innerHTML = '<option value="">Select an active user</option>' + activeAccounts
      .map(account => `<option value="${escapeHtml(account.userId)}">${escapeHtml(account.userId)} — ${escapeHtml(displayNameOf(account))} (${escapeHtml(account.department)})</option>`)
      .join('');

    accessUserId.value = activeAccounts.some(account => account.userId === selectedId) ? selectedId : '';
    updateAccessRightsView();
  };

  /* --- registered guard directory (demo guards + approved accounts) --- */

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
    const entries = Object.values(GUARDS).map(guard => ({
      name: guard.name, id: guard.id, post: guard.post,
      sub: guard.assignment, contact: guard.phone,
      image: guard.image, status: directoryStatusOf(guard.name),
    }));

    getStoredAccounts()
      .filter(account => account.status === 'Active')
      .forEach(account => {
        const name = displayNameOf(account);
        const tint = DIRECTORY_AVATARS[name.length % DIRECTORY_AVATARS.length];
        entries.push({
          name, id: account.userId,
          post: account.post || account.department,
          sub: account.post ? (account.assignment || account.department) : 'No post assigned',
          contact: account.phone || account.email,
          initials: name.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase(),
          tint, status: 'active',
          userId: account.userId, hasPost: !!account.post,
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
            <td><strong>${escapeHtml(entry.post)}</strong><small>${escapeHtml(entry.sub || '—')}</small>${entry.userId ? `<button class="post-assign-btn" data-assign-post="${escapeHtml(entry.userId)}" type="button">${entry.hasPost ? 'Change' : 'Assign post'}</button>` : ''}</td>
            <td><strong>${escapeHtml(entry.contact)}</strong></td>
            <td><span class="status ${entry.status}">${pillText[entry.status]}</span></td>
          </tr>`).join('')
      : '<tr><td class="empty-pending" colspan="4">No guards match your search.</td></tr>';
  };

  /* --- designated post assignment (approved staff accounts) --- */

  const postModal = $('#postAssignModal');
  const postForm = $('#postAssignForm');
  const postSite = $('#postAssignSite');
  const postDetail = $('#postAssignDetail');
  const postError = $('#postAssignError');
  let postTargetId = '';

  /* Existing demo sites as suggestions so HR reuses consistent post names */
  $('#postSiteOptions').innerHTML = [...new Set(Object.values(GUARDS).map(guard => guard.post))]
    .map(site => `<option value="${escapeHtml(site)}">`).join('');

  const closePostModal = () => { postModal.hidden = true; postTargetId = ''; };

  $('#guardDirectoryRows').addEventListener('click', event => {
    const button = event.target.closest('[data-assign-post]');
    if (!button) return;
    const account = getStoredAccounts().find(item => item.userId === button.dataset.assignPost);
    if (!account) return;
    postTargetId = account.userId;
    $('#postAssignTitle').textContent = account.post ? 'Change designated post' : 'Assign designated post';
    $('#postAssignGuard').textContent = `${displayNameOf(account)} · ${account.userId}`;
    postSite.value = account.post || '';
    postDetail.value = account.assignment || '';
    postError.hidden = true;
    postModal.hidden = false;
    postSite.focus();
  });

  postForm.addEventListener('submit', event => {
    event.preventDefault();
    const accounts = getStoredAccounts();
    const account = accounts.find(item => item.userId === postTargetId);
    if (!account) { closePostModal(); return; }
    const site = postSite.value.trim();
    if (!site) { postError.hidden = false; postSite.focus(); return; }
    account.post = site;
    account.assignment = postDetail.value.trim();
    saveStoredAccounts(accounts);
    closePostModal();
    renderGuardDirectory($('#guardDirectorySearch').value);
    toast(`Designated post assigned to ${displayNameOf(account)}`);
  });

  postSite.addEventListener('input', () => { postError.hidden = true; });
  $('#closePostAssign').addEventListener('click', closePostModal);
  $('#cancelPostAssign').addEventListener('click', closePostModal);
  closeWhenBackdropIsClicked(postModal, closePostModal);

  /* --- panel switching --- */

  const setPanel = panel => {
    document.body.classList.remove(...bodyClasses);
    if (panel !== 'attendance') document.body.classList.add(`${panel}-panel-active`);

    Object.entries(sections).forEach(([name, elements]) => {
      elements.forEach(element => { element.hidden = name !== panel; });
    });
    Object.entries(navItems).forEach(([name, item]) => item.classList.toggle('active', name === panel));

    updateSystemCounts();
    if (panel === 'hr') renderGuardDirectory();
    if (panel === 'admin') {
      renderPendingAccounts();
      renderAccessAssignment();
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
        <select>${Object.values(GUARDS).map(guard => `<option>${guard.name} — ${guard.id}</option>`).join('')}</select>
      </label>
      <label>${action === 'add' ? 'Employee name' : 'Update details'}
        <input required placeholder="Enter required information">
      </label>
      <button type="submit">Save ${action === 'add' ? 'employee' : 'changes'}</button>
    </form>`;

  const openAction = (action, type = 'hr') => {
    if (action === 'profiles') return profiles.showAll();
    if (action === 'attendance') return setPanel('attendance');

    const isPayroll = type === 'payroll';
    actionTitle.textContent = (isPayroll ? PAYROLL_ACTIONS : HR_ACTIONS)[action];
    actionDescription.textContent = isPayroll
      ? 'This mock payroll tool uses validated attendance records from the attendance system.'
      : 'Use this mock HR tool to review and update staff information.';

    const records = isPayroll ? PAYROLL_ACTION_RECORDS : HR_ACTION_RECORDS;
    if (records[action]) actionContent.innerHTML = renderRecordList(records[action]);
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

  $('#addEmployee').addEventListener('click', () => openAction('add'));
  $('#guardDirectorySearch').addEventListener('input', event => renderGuardDirectory(event.target.value));
  $('#createPayroll').addEventListener('click', () => openAction('run', 'payroll'));
  $('#reviewExceptions').addEventListener('click', () => openAction('exceptions'));
  $('#exportAnalytics').addEventListener('click', () => toast('Analytics summary is ready to export'));

  /* --- approve / reject account requests --- */

  pendingAccountRows.addEventListener('click', event => {
    const button = event.target.closest('[data-account-action]');
    if (!button) return;

    const accounts = getStoredAccounts();
    const account = accounts.find(item => item.userId === button.dataset.userId);
    if (!account) return;

    const approved = button.dataset.accountAction === 'approve';
    account.status = approved ? 'Active' : 'Inactive';
    if (approved) account.accessRights = accessForDepartment(account.department);

    saveStoredAccounts(accounts);
    renderPendingAccounts();
    renderAccessAssignment();
    updateSystemCounts();
    toast(`${displayNameOf(account)}'s account was ${approved ? 'approved and activated' : 'rejected and marked inactive'}`);
  });

  accessUserId.addEventListener('change', updateAccessRightsView);

  accessAssignmentForm.addEventListener('submit', event => {
    event.preventDefault();

    const accounts = getStoredAccounts();
    const account = accounts.find(item => item.userId === accessUserId.value && item.status === 'Active');
    if (!account) return toast('Select an active user first');
    if (accessExpiration.value && accessExpiration.value < today()) {
      return toast('Choose today or a future expiration date');
    }

    account.accessRights = accessForDepartment(account.department);
    account.expirationDate = accessExpiration.value;
    saveStoredAccounts(accounts);
    updateAccessRightsView();
    toast(`${displayNameOf(account)}'s department access and expiration date were saved`);
  });

  /* --- dialog closing and mock submissions --- */

  $('#closeHrAction').addEventListener('click', closeActionModal);
  closeWhenBackdropIsClicked(actionModal, closeActionModal);

  actionContent.addEventListener('submit', event => {
    event.preventDefault();
    closeActionModal();
    toast(/payroll/i.test(actionTitle.textContent)
      ? 'Payroll report is ready to generate'
      : 'HR record updated successfully');
  });
}


/* ------------------------------------------------------------------
   Start-up
------------------------------------------------------------------ */

function initDashboard() {
  migrateStoredAccounts();
  const toast = createToast($('#toast'));

  initAuthentication();
  initAddressCascade();
  initAttendance(toast);
  updateSystemCounts();
  initScanner();
  initCarousel();
  const profiles = initProfiles();
  initWorkspace(toast, profiles);
}

document.addEventListener('DOMContentLoaded', initDashboard);
