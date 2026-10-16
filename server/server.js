// PARON server: κοινή βάση δεδομένων για όλους και αυτόματη αποστολή προγράμματος στο Viber.
// Χωρίς εξαρτήσεις, χρειάζεται μόνο Node.js 18 ή νεότερο.  Εκκίνηση:  node server/server.js
process.env.TZ = process.env.TZ || 'Europe/Athens';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');

// --- ρυθμίσεις από .env ή μεταβλητές περιβάλλοντος ---
(function loadEnv() {
  const f = path.join(ROOT, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
})();
const CFG = {
  port: +process.env.PORT || 8080,
  host: process.env.HOST || '0.0.0.0',                   // 127.0.0.1 όταν μπροστά υπάρχει Caddy/nginx
  trustProxy: process.env.TRUST_PROXY === '1',           // η πραγματική διεύθυνση έρχεται από το X-Forwarded-For
  dataDir: path.resolve(ROOT, process.env.DATA_DIR || 'data'),
  user: process.env.ERGO_USER || 'ergolavos',          // πρώτος λογαριασμός διαχειριστή
  password: process.env.ERGO_PASSWORD || '',
  provider: (process.env.VIBER_PROVIDER || 'dryrun').toLowerCase(), // dryrun | http
  url: process.env.VIBER_URL || '',
  headers: process.env.VIBER_HEADERS || '{}',
  body: process.env.VIBER_BODY || '',
  sender: process.env.VIBER_SENDER || '',
  weatherUrl: process.env.WEATHER_URL || '',             // κενό = Open-Meteo· άλλη διεύθυνση μόνο για δοκιμές
  plan: (process.env.ERGO_PLAN || '').toLowerCase(),    // κενό = το πακέτο το διαλέγει ο διαχειριστής· αλλιώς mastoras | synergeio | ergotaxio
};

require(path.join(ROOT, 'src', 'core.js'));
const C = globalThis.ErgoCore;
const { fullPage } = require(path.join(ROOT, 'build.js'));

fs.mkdirSync(CFG.dataDir, { recursive: true });
const F = { state: path.join(CFG.dataDir, 'state.json'), log: path.join(CFG.dataDir, 'viber-log.json'), meta: path.join(CFG.dataDir, 'meta.json') };
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJSON = (f, o) => { const tmp = f + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(o), { mode: 0o600 }); fs.renameSync(tmp, f); };   // μόνο ο server διαβάζει τα αρχεία
const now = () => { const d = new Date(); return C.ds(d) + 'T' + C.pad(d.getHours()) + ':' + C.pad(d.getMinutes()) + ':' + C.pad(d.getSeconds()); };

function saveState(o) {
  // κρατά ένα αντίγραφο ασφαλείας ανά μέρα
  if (fs.existsSync(F.state)) {
    const bk = path.join(CFG.dataDir, 'backup-' + C.ds(new Date()) + '.json');
    if (!fs.existsSync(bk)) {
      fs.copyFileSync(F.state, bk);
      // κρατά τα αντίγραφα των τελευταίων 60 ημερών
      fs.readdirSync(CFG.dataDir).filter(f => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().slice(0, -60).forEach(f => fs.unlinkSync(path.join(CFG.dataDir, f)));
    }
  }
  writeJSON(F.state, o);
}

// --- καιρός ---
// Η πρόγνωση (Open-Meteo, δωρεάν, χωρίς κλειδί) φυλάγεται στο data/weather.json και ανανεώνεται κάθε 3 ώρες,
// ή αμέσως όταν μπει έργο σε νέα περιοχή. Όλοι, και τα μηνύματα Viber, βλέπουν το ίδιο πρόγραμμα.
F.weather = path.join(CFG.dataDir, 'weather.json');
let WX = readJSON(F.weather, null), wxBusy = null, wxTry = 0;
C.setWeather(WX);
function wxFetch(maxAge = 3 * 3600e3, force = false) {
  const S = readJSON(F.state, null);
  if (!S || !S.settings) return Promise.resolve(WX);
  C.setState(S);
  if (C.wxCfg().on === false) return Promise.resolve(WX);
  const locs = C.wxLocs();
  const fresh = WX && Date.now() - Date.parse(WX.at) < maxAge && locs.every(l => WX.locs[l.key]);
  if (fresh && !force) return Promise.resolve(WX);
  if (wxBusy) return wxBusy;
  if (Date.now() - wxTry < (force ? 15e3 : 60e3)) return Promise.resolve(WX);   // όχι συνέχεια, ακόμη κι αν αποτυγχάνει
  wxTry = Date.now();
  wxBusy = (async () => {
    try {
      const r = await fetch(C.wxUrl(locs, CFG.weatherUrl), { signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      WX = C.wxParse(await r.json(), locs); WX.error = '';
      writeJSON(F.weather, WX); C.setWeather(WX);
      console.log(now(), 'καιρός: νέα πρόγνωση για', locs.length, 'περιοχές');
    } catch (e) {
      console.error(now(), 'καιρός: δεν ήρθε πρόγνωση:', e.message);
      if (WX) WX.error = 'Η τελευταία ενημέρωση απέτυχε.';
    } finally { wxBusy = null; }
    return WX;
  })();
  return wxBusy;
}
setInterval(() => wxFetch().catch(() => {}), 20 * 60e3);
setTimeout(() => wxFetch().catch(() => {}), 2000);

// --- Viber ---
function normPhone(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10 && d.startsWith('69')) d = '30' + d;   // ελληνικό κινητό
  return d.length >= 11 ? d : '';
}
async function sendOne(phone, text) {
  if (CFG.provider !== 'http') return { status: 'dry' };
  const esc = v => JSON.stringify(String(v)).slice(1, -1);
  const body = CFG.body.replace(/\{\{phone\}\}/g, esc(phone)).replace(/\{\{text\}\}/g, esc(text)).replace(/\{\{sender\}\}/g, esc(CFG.sender));
  const res = await fetch(CFG.url, { method: 'POST', headers: { 'content-type': 'application/json', ...JSON.parse(CFG.headers) }, body });
  const out = await res.text();
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + out.slice(0, 200));
  return { status: 'sent', response: out.slice(0, 300) };
}
let running = false;
// changed: στέλνει μόνο σε όσους πήραν ήδη το πρόγραμμα της μέρας και από τότε τους άλλαξε, με μήνυμα «Άλλαξε το πρόγραμμά σου»
async function runSend(date, trigger, week = false, changed = false) {
  if (running) return { ok: false, message: 'Τρέχει ήδη μια αποστολή.' };
  running = true;
  try {
    await wxFetch(60 * 60e3).catch(() => {});   // πρόσφατη πρόγνωση πριν φύγουν τα μηνύματα
    const only = changed ? new Set(changedSince(date).map(x => x.id)) : null;
    if (only && !only.size) return { ok: true, message: 'Κανείς δεν χρειάζεται ενημέρωση: το πρόγραμμα δεν άλλαξε από την αποστολή.', sent: 0, dry: 0, failed: 0, skipped: 0 };
    const S = readJSON(F.state, null);
    if (!S) return { ok: false, message: 'Δεν υπάρχουν ακόμη δεδομένα στον server.' };
    C.setState(S);
    if (!week && !C.isWork(date)) return { ok: true, message: 'Η ' + C.fmt(date) + ' δεν είναι εργάσιμη. Δεν στάλθηκε τίποτα.' };
    const R = C.schedule();
    const log = readJSON(F.log, []);
    let sent = 0, dry = 0, failed = 0, skipped = 0;
    const days = week ? C.weekDays(C.weekStart(date)) : [date];
    const owner = C.ownerW();   // ο εργολάβος, αν έχει κινητό στις Ρυθμίσεις: μόνο ραντεβού και υπενθυμίσεις
    for (const w of owner.phone ? [...S.workers, owner] : S.workers) {
      if (only && !only.has(w.id)) continue;
      const phone = normPhone(w.phone);
      const entry = { at: now(), date, trigger: week ? trigger + '-week' : trigger, workerId: w.id, name: w.name, phone: w.phone || '' };
      if (!week) entry.cmp = C.dayKey(R, w, date);   // για να φανεί αν αλλάξει το πρόγραμμα μετά την αποστολή
      if (only) entry.upd = true;
      if (w.viber === false) { skipped++; log.push({ ...entry, status: 'skipped', error: 'Απενεργοποιημένο' }); continue; }
      if (!only && C.isExt(w) && !C.hasJob(R, w.id, days)) { skipped++; log.push({ ...entry, status: 'skipped', error: 'Συνεργάτης χωρίς εργασία' }); continue; }
      if (w.id === C.OWNER && !days.some(d => C.dayBlock(R, w, d).trim())) { skipped++; log.push({ ...entry, status: 'skipped', error: 'Χωρίς ραντεβού ή υπενθυμίσεις' }); continue; }
      if (!phone) { skipped++; log.push({ ...entry, status: 'skipped', error: 'Χωρίς σωστό κινητό' }); continue; }
      const text = week ? C.personText(R, w, C.weekStart(date)) : C.personDayText(R, w, date, !!only);
      try { const r = await sendOne(phone, text); r.status === 'sent' ? sent++ : dry++; log.push({ ...entry, status: r.status, text }); }
      catch (e) { failed++; log.push({ ...entry, status: 'error', error: e.message, text }); }
    }
    writeJSON(F.log, log.slice(-3000));
    const what = only ? ' με την αλλαγή' : '';
    const msg = CFG.provider === 'http'
      ? `Στάλθηκαν ${sent} μηνύματα${what}${failed ? ', ' + failed + ' απέτυχαν' : ''}${skipped ? ', ' + skipped + ' παραλείφθηκαν' : ''}.`
      : `Δοκιμαστική λειτουργία: ετοιμάστηκαν ${dry} μηνύματα${what} χωρίς να σταλούν${skipped ? ', ' + skipped + ' παραλείφθηκαν' : ''}.`;
    console.log(now(), trigger, date, msg);
    return { ok: true, message: msg, sent, dry, failed, skipped };
  } finally { running = false; }
}
// ποιοι πήραν ήδη το πρόγραμμα μιας μέρας και από τότε τους άλλαξε (π.χ. η βροχή μετέθεσε την εργασία τους)
function changedSince(date) {
  const S = readJSON(F.state, null);
  if (!S || !Array.isArray(S.workers)) return [];
  const last = {};
  for (const x of readJSON(F.log, [])) if (x.date === date && x.cmp != null && (x.status === 'sent' || x.status === 'dry')) last[x.workerId] = x.cmp;
  if (!Object.keys(last).length) return [];
  C.setState(S);
  const R = C.schedule();
  return [...S.workers, C.ownerW()].filter(w => last[w.id] != null && w.viber !== false && last[w.id] !== C.dayKey(R, w, date)).map(w => ({ id: w.id, name: w.name }));
}
// έλεγχος κάθε 30 δευτερόλεπτα αν ήρθε η ώρα της καθημερινής αποστολής
setInterval(() => {
  const S = readJSON(F.state, null);
  if (!S || !S.settings || !S.settings.autoSend) return;
  const d = new Date(), today = C.ds(d);
  const meta = readJSON(F.meta, {});
  const [sh, sm] = (S.settings.sendTime || '06:30').split(':').map(Number);
  const late = d.getHours() * 60 + d.getMinutes() - (sh * 60 + sm);
  if (meta.lastAuto === today || late < 0 || late > 120) return;
  // στάλθηκε ήδη από το βράδυ: το πρωί φεύγει μήνυμα μόνο σε όσους άλλαξε από τότε (π.χ. λόγω βροχής)
  if ((meta.sentFor || []).includes(today)) { meta.lastAuto = today; writeJSON(F.meta, meta); runSend(today, 'auto', false, true).catch(e => console.error('auto update', e)); return; }
  meta.lastAuto = today; writeJSON(F.meta, meta);
  runSend(today, 'auto').catch(e => console.error('auto send', e));
}, 30000);

// --- εφαρμογή για κινητά (PWA): εικονίδια, manifest, service worker ---
// Δεν περιέχουν δεδομένα, γι' αυτό σερβίρονται χωρίς κωδικό (το κινητό τα ζητά πριν τη σύνδεση).
const PUBLIC = { '/manifest.webmanifest': 'application/manifest+json', '/sw.js': 'text/javascript; charset=utf-8', '/icon-192.png': 'image/png', '/icon-512.png': 'image/png', '/icon-maskable-512.png': 'image/png', '/apple-touch-icon.png': 'image/png' };
const PWA_HEAD = '<script>window.ERGO_SERVER=true</script>' +
  '<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/apple-touch-icon.png">' +
  '<meta name="theme-color" content="#E8ECE4" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#071F1B" media="(prefers-color-scheme: dark)"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">' +
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="' + C.BRAND.name + '">' +
  '<script>if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}))</script>';

// --- HTTP ---
// --- χρήστες και σύνδεση ---
// Κάθε χρήστης έχει δικό του όνομα και κωδικό. Οι κωδικοί φυλάγονται μόνο κρυπτογραφημένοι (scrypt).
// Ρόλοι: admin = όλα και διαχείριση χρηστών, office = όλα (γραφείο, ταμείο, διαχειριστές έργων),
//        worker = μόνο το δικό του πρόγραμμα, χωρίς αλλαγές (ο server δεν του στέλνει τίποτε άλλο).
// Η σύνδεση κρατιέται με cookie που δεν διαβάζεται από τη σελίδα (HttpOnly).
F.users = path.join(CFG.dataDir, 'users.json');
F.sessions = path.join(CFG.dataDir, 'sessions.json');
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 64).toString('hex');
const normU = s => String(s || '').trim().toLowerCase();
const ROLES = ['admin', 'office', 'worker'];
const pubU = u => ({ id: u.id, username: u.username, name: u.name, role: u.role, workerId: u.workerId || '' });
let USERS = readJSON(F.users, []);
const saveUsers = () => writeJSON(F.users, USERS);
function makeUser(v) { const salt = crypto.randomBytes(16).toString('hex'); return { id: 'u' + crypto.randomBytes(6).toString('hex'), username: normU(v.username), name: String(v.name).trim(), role: ROLES.includes(v.role) ? v.role : 'worker', workerId: v.workerId || '', salt, hash: hashPw(v.password, salt), created: now() }; }
if (!USERS.length && CFG.password) { USERS.push(makeUser({ username: CFG.user, name: 'Εργολάβος', role: 'admin', password: CFG.password })); saveUsers(); }
function checkUser(v, needPw, selfId) {
  if (!String(v.name || '').trim()) return 'Γράψε το ονοματεπώνυμο.';
  if (!/^\S{2,40}$/.test(normU(v.username))) return 'Το όνομα χρήστη θέλει 2 έως 40 χαρακτήρες, χωρίς κενά.';
  if ((needPw || v.password) && String(v.password || '').length < 8) return 'Ο κωδικός θέλει τουλάχιστον 8 χαρακτήρες.';
  if (USERS.some(u => u.username === normU(v.username) && u.id !== selfId)) return 'Υπάρχει ήδη χρήστης με αυτό το όνομα χρήστη.';
  if (v.role === 'worker' && !v.workerId) return 'Διάλεξε σε ποιον εργαζόμενο αντιστοιχεί ο λογαριασμός.';
  if (v.workerId && USERS.some(u => u.workerId === v.workerId && u.id !== selfId)) return 'Αυτός ο εργαζόμενος έχει ήδη λογαριασμό.';
  return '';
}
function checkPw(u, pw) {
  const h = Buffer.from(hashPw(pw, u ? u.salt : '0'.repeat(32)), 'hex');   // ίδιος χρόνος και όταν δεν υπάρχει ο χρήστης
  if (!u) return false;
  const k = Buffer.from(u.hash, 'hex');
  return h.length === k.length && crypto.timingSafeEqual(h, k);
}
let SESS = readJSON(F.sessions, {});   // sha256(token) -> { uid, exp }
const tokHash = t => crypto.createHash('sha256').update(t).digest('hex');
const saveSess = () => { const t = Date.now(); for (const k in SESS) if (SESS[k].exp < t) delete SESS[k]; writeJSON(F.sessions, SESS); };
const dropSessions = (uid, keep) => { for (const k in SESS) if (SESS[k].uid === uid && k !== keep) delete SESS[k]; saveSess(); };
function cookie(req, name) {
  for (const p of (req.headers.cookie || '').split(';')) { const i = p.indexOf('='); if (i > 0 && p.slice(0, i).trim() === name) return decodeURIComponent(p.slice(i + 1).trim()); }
  return '';
}
const isHttps = req => !!req.socket.encrypted || (CFG.trustProxy && (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https');
function session(req) { const t = cookie(req, 'ergodo_sid'); return t ? tokHash(t) : ''; }
function currentUser(req) {
  const s = SESS[session(req)];
  if (!s || s.exp < Date.now()) return null;
  return USERS.find(u => u.id === s.uid) || null;
}
function startSession(req, res, u, remember) {
  const t = crypto.randomBytes(32).toString('base64url'), days = remember ? 30 : 1;
  SESS[tokHash(t)] = { uid: u.id, exp: Date.now() + days * 864e5 }; saveSess();
  res.setHeader('set-cookie', `ergodo_sid=${t}; Path=/; HttpOnly; SameSite=Lax${isHttps(req) ? '; Secure' : ''}${remember ? '; Max-Age=' + days * 86400 : ''}`);
}
function endSession(req, res) {
  const k = session(req); if (k && SESS[k]) { delete SESS[k]; saveSess(); }
  res.setHeader('set-cookie', 'ergodo_sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}
// μετά από 8 λάθος κωδικούς για το ίδιο όνομα από την ίδια διεύθυνση, αναμονή 15 λεπτά
const FAILS = new Map();
const clientIp = req => (CFG.trustProxy && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || '';
const failKey = (req, u) => clientIp(req) + '|' + u;
const isLocked = k => { const f = FAILS.get(k); return !!(f && f.until > Date.now()); };
function addFail(k) { const f = FAILS.get(k) || { n: 0, until: 0 }; if (f.until && f.until <= Date.now()) { f.n = 0; f.until = 0; } if (++f.n >= 8) f.until = Date.now() + 15 * 60e3; FAILS.set(k, f); }

const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};
const readBody = req => new Promise((ok, bad) => {
  let n = 0; const chunks = [];
  req.on('data', c => { n += c.length; if (n > 10e6) { bad(new Error('too large')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => ok(Buffer.concat(chunks).toString('utf8'))); req.on('error', bad);
});

http.createServer(async (req, res) => {
  try {
    const pub = PUBLIC[new URL(req.url, 'http://x').pathname];
    if (pub && req.method === 'GET') {
      res.writeHead(200, { 'content-type': pub, 'cache-control': req.url.startsWith('/sw.js') ? 'no-cache' : 'public, max-age=86400' });
      const file = path.join(ROOT, 'public', new URL(req.url, 'http://x').pathname.slice(1));
      if (pub.startsWith('application/manifest')) {   // το όνομα έρχεται από το BRAND του core
        const m = JSON.parse(fs.readFileSync(file, 'utf8')); m.name = C.BRAND.name + ' · ' + C.BRAND.tag; m.short_name = C.BRAND.name;
        return res.end(JSON.stringify(m));
      }
      return res.end(fs.readFileSync(file));
    }
    const url = new URL(req.url, 'http://x');
    // η σελίδα της εφαρμογής δεν έχει δεδομένα, γι' αυτό ανοίγει χωρίς σύνδεση και δείχνει την οθόνη σύνδεσης
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html'))
      return send(res, 200, fullPage(PWA_HEAD), 'text/html; charset=utf-8');
    if (url.pathname === '/api/health') return send(res, 200, { ok: true, time: now() });
    if (req.method !== 'GET') {
      // αλλαγές μόνο από την ίδια την εφαρμογή (προστασία από αιτήματα άλλων σελίδων)
      const origin = req.headers.origin;
      if (!/^application\/json/i.test(req.headers['content-type'] || '') || (origin && origin !== 'null' && new URL(origin).host !== req.headers.host))
        return send(res, 403, { error: 'Μη επιτρεπτό αίτημα' });
    }
    const body = async () => { try { return JSON.parse((await readBody(req)) || '{}') || {}; } catch { return {}; } };
    if (url.pathname === '/api/login' && req.method === 'POST') {
      const b = await body(), uname = normU(b.username), k = failKey(req, uname);
      if (isLocked(k)) return send(res, 429, { error: 'Πολλές λάθος προσπάθειες. Δοκίμασε ξανά σε 15 λεπτά.' });
      const u = USERS.find(x => x.username === uname);
      if (!checkPw(u, b.password || '')) { addFail(k); return send(res, 401, { error: 'Λάθος όνομα χρήστη ή κωδικός.' }); }
      FAILS.delete(k); startSession(req, res, u, b.remember !== false);
      console.log(now(), 'σύνδεση', u.username);
      return send(res, 200, { user: pubU(u) });
    }
    if (url.pathname === '/api/setup' && req.method === 'POST') {
      if (USERS.length) return send(res, 409, { error: 'Υπάρχει ήδη λογαριασμός. Κάνε σύνδεση.' });
      const b = await body(), err = checkUser(b, true);
      if (err) return send(res, 400, { error: err });
      const u = makeUser({ ...b, role: 'admin' }); USERS.push(u); saveUsers(); startSession(req, res, u, true);
      console.log(now(), 'δημιουργήθηκε ο πρώτος διαχειριστής', u.username);
      return send(res, 200, { user: pubU(u) });
    }
    if (url.pathname === '/api/logout' && req.method === 'POST') { endSession(req, res); return send(res, 200, { ok: true }); }
    const me = currentUser(req);
    if (!me) return send(res, 401, { error: 'Χρειάζεται σύνδεση.', setup: !USERS.length });
    if (url.pathname === '/api/me') return send(res, 200, { user: pubU(me) });
    if (url.pathname === '/api/password' && req.method === 'POST') {
      const b = await body();
      if (!checkPw(me, b.current || '')) return send(res, 400, { error: 'Ο τωρινός κωδικός δεν είναι σωστός.' });
      if (String(b.password || '').length < 8) return send(res, 400, { error: 'Ο κωδικός θέλει τουλάχιστον 8 χαρακτήρες.' });
      me.salt = crypto.randomBytes(16).toString('hex'); me.hash = hashPw(b.password, me.salt); saveUsers();
      dropSessions(me.id, session(req));   // αποσυνδέει τις άλλες συσκευές
      return send(res, 200, { ok: true });
    }
    if (me.role === 'worker') {
      // ο εργάτης παίρνει μόνο το δικό του εβδομαδιαίο πρόγραμμα, όχι μεροκάματα, οικονομικά ή άλλους εργαζόμενους
      if (url.pathname === '/api/my' && req.method === 'GET') {
        const S = readJSON(F.state, null), w = S && (S.workers || []).find(x => x.id === me.workerId);
        if (!w) return send(res, 200, { unlinked: true, name: me.name });
        C.setState(S);
        const q = url.searchParams.get('week') || '';
        return send(res, 200, C.personWeek(C.schedule(), w, C.weekStart(/^\d{4}-\d{2}-\d{2}$/.test(q) ? q : C.ds(new Date()))));
      }
      return send(res, 403, { error: 'Ο λογαριασμός σου βλέπει μόνο το πρόγραμμά σου.' });
    }
    if (url.pathname.startsWith('/api/users')) {
      if (me.role !== 'admin') return send(res, 403, { error: 'Μόνο ο διαχειριστής αλλάζει χρήστες.' });
      if (url.pathname === '/api/users' && req.method === 'GET') return send(res, 200, { users: USERS.map(pubU) });
      if (url.pathname === '/api/users' && req.method === 'POST') {
        const b = await body(), u = b.id ? USERS.find(x => x.id === b.id) : null;
        if (b.id && !u) return send(res, 404, { error: 'Ο χρήστης δεν βρέθηκε.' });
        const err = checkUser(b, !u, u && u.id); if (err) return send(res, 400, { error: err });
        if (u && u.role === 'admin' && b.role !== 'admin' && USERS.filter(x => x.role === 'admin').length < 2) return send(res, 400, { error: 'Πρέπει να μείνει τουλάχιστον ένας διαχειριστής.' });
        if (!u) { const n = makeUser(b); USERS.push(n); saveUsers(); return send(res, 200, { user: pubU(n) }); }
        const was = u.role;
        u.name = String(b.name).trim(); u.username = normU(b.username); u.role = ROLES.includes(b.role) ? b.role : 'worker'; u.workerId = b.workerId || '';
        if (was !== u.role) dropSessions(u.id);   // με νέο ρόλο ξαναμπαίνει
        if (b.password) { u.salt = crypto.randomBytes(16).toString('hex'); u.hash = hashPw(b.password, u.salt); dropSessions(u.id, u.id === me.id ? session(req) : ''); }
        saveUsers(); return send(res, 200, { user: pubU(u) });
      }
      if (url.pathname === '/api/users/delete' && req.method === 'POST') {
        const b = await body();
        if (b.id === me.id) return send(res, 400, { error: 'Δεν μπορείς να διαγράψεις τον εαυτό σου.' });
        if (!USERS.some(x => x.id === b.id)) return send(res, 404, { error: 'Ο χρήστης δεν βρέθηκε.' });
        USERS = USERS.filter(x => x.id !== b.id); saveUsers(); dropSessions(b.id);
        return send(res, 200, { ok: true });
      }
    }
    if (url.pathname === '/api/state') {
      if (req.method === 'GET') { const o = readJSON(F.state, {}); if (CFG.plan && o.settings) { o.settings.plan = CFG.plan; o.settings.planLock = true; } return send(res, 200, o); }
      if (req.method === 'PUT') {
        const o = JSON.parse(await readBody(req));
        if (!o || o.v !== 2 || !Array.isArray(o.workers) || !Array.isArray(o.tasks)) return send(res, 400, { error: 'Μη έγκυρα δεδομένα' });
        if (o.settings) { delete o.settings.planLock; if (CFG.plan) o.settings.plan = CFG.plan; }   // το πακέτο το ορίζει η συνδρομή, όχι η εφαρμογή
        saveState(o); return send(res, 200, { ok: true });
      }
    }
    if (url.pathname === '/api/weather' && req.method === 'GET') {
      const w = await wxFetch(3 * 3600e3, url.searchParams.get('refresh') === '1');
      return send(res, 200, w || { locs: null, error: 'Δεν έχει έρθει ακόμη πρόγνωση. Ο server δοκιμάζει ξανά σύντομα.' });
    }
    if (url.pathname === '/api/viber/changes' && req.method === 'GET') {
      const today = C.ds(new Date());
      const dates = [...new Set(readJSON(F.log, []).filter(x => x.date >= today && x.cmp != null).map(x => x.date))].sort();
      return send(res, 200, { changes: dates.map(date => ({ date, people: changedSince(date) })).filter(x => x.people.length) });
    }
    if (url.pathname === '/api/viber/status' && req.method === 'GET') {
      const log = readJSON(F.log, []);
      return send(res, 200, { mode: CFG.provider === 'http' ? 'live' : 'dryrun', lastAuto: readJSON(F.meta, {}).lastAuto || null, log: log.slice(-40).reverse().map(({ text, ...x }) => x) });
    }
    if (url.pathname === '/api/viber/send' && req.method === 'POST') {
      const b = JSON.parse((await readBody(req)) || '{}');
      const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : C.ds(new Date());
      const r = await runSend(date, 'manual', !!b.week, !!b.changed && !b.week);
      if (r.ok && !b.week && !b.changed && date > C.ds(new Date())) { const meta = readJSON(F.meta, {}); meta.sentFor = [...(meta.sentFor || []).slice(-30), date]; writeJSON(F.meta, meta); }
      return send(res, 200, r);
    }
    send(res, 404, { error: 'Δεν βρέθηκε' });
  } catch (e) { console.error(e); send(res, 500, { error: 'Σφάλμα server' }); }
}).listen(CFG.port, CFG.host, () => {
  console.log(`${C.BRAND.name} · ${C.BRAND.tag}: http://localhost:${CFG.port}  (Viber: ${CFG.provider === 'http' ? 'πάροχος ' + CFG.url : 'δοκιμαστική λειτουργία'})`);
  if (!USERS.length) console.log('ΠΡΟΣΟΧΗ: δεν υπάρχει ακόμη λογαριασμός. Άνοιξε τώρα την εφαρμογή και φτιάξε τον λογαριασμό του διαχειριστή.');
  else console.log('Χρήστες: ' + USERS.length + ' (διαχειριστές: ' + USERS.filter(u => u.role === 'admin').map(u => u.username).join(', ') + ')');
});
