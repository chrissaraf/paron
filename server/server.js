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

// --- αναίρεση: πριν από κάθε αλλαγή με νέα εγγραφή ιστορικού κρατά τα δεδομένα όπως ήταν (τα 15 τελευταία) ---
const UNDO = path.join(CFG.dataDir, 'undo');
function saveUndo(ids, prev) {
  fs.mkdirSync(UNDO, { recursive: true, mode: 0o700 });
  const { past, ...rest } = prev || {};   // οι καταγεγραμμένες μέρες δεν αναιρούνται
  writeJSON(path.join(UNDO, ids[ids.length - 1].replace(/[^\w-]/g, '') + '.json'), { ids, at: now(), state: rest });
  const fs_ = fs.readdirSync(UNDO).filter(f => f.endsWith('.json')).map(f => ({ f, t: fs.statSync(path.join(UNDO, f)).mtimeMs })).sort((a, b) => a.t - b.t);
  fs_.slice(0, -15).forEach(x => fs.unlinkSync(path.join(UNDO, x.f)));
}
function findUndo(id) {
  if (!fs.existsSync(UNDO)) return null;
  for (const f of fs.readdirSync(UNDO).filter(f => f.endsWith('.json'))) { const o = readJSON(path.join(UNDO, f), null); if (o && (o.ids || []).includes(id)) return { file: path.join(UNDO, f), ...o }; }
  return null;
}
const withPlan = o => { if (CFG.plan && o.settings) { o.settings.plan = CFG.plan; o.settings.planLock = true; } return o; };

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
      // ο καιρός της μέρας γράφεται και στο ημερολόγιο των έργων
      const S2 = readJSON(F.state, null);
      if (S2 && S2.settings) { C.setState(withPlan(S2)); C.today(); if (C.wxLogFill(C.schedule())) { delete S2.settings.planLock; saveState(S2); } }
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

// --- φωτογραφίες του ημερολογίου έργου ---
// Φυλάγονται ως αρχεία στο data/photos, έξω από τα δεδομένα: <id>.jpg (έως 1600 px) και <id>_t.jpg (μικρή, για τις λίστες).
// Όσες δεν χρειάζονται πια (σβήστηκαν, διαγράφηκε το έργο, ή ανέβηκαν και δεν μπήκαν ποτέ στο ημερολόγιο) σβήνονται μετά από 7 μέρες,
// ώστε να προλαβαίνει η αναίρεση. Ανεβαίνουν μόνο όσο ο δίσκος έχει χώρο και το σύνολο είναι κάτω από το όριο (PHOTO_MAX_GB, 20 GB).
const PH = path.join(CFG.dataDir, 'photos'), PH_ORPH = path.join(CFG.dataDir, 'photos-orphans.json');
const PH_MAX = 5e6, PH_TMAX = 4e5, PH_KEEP = 7, PH_CAP = (+process.env.PHOTO_MAX_GB || 20) * 1e9, PH_FREE = 1e9;
const phFile = (id, t) => path.join(PH, id + (t ? '_t' : '') + '.jpg');
let phUse = null;
function photoUsage() {
  if (phUse && Date.now() - phUse.at < 60e3) return phUse;
  let n = 0, bytes = 0;
  try { for (const f of fs.readdirSync(PH)) { const m = /^[a-f0-9]{16}(_t)?\.jpg$/.exec(f); if (!m) continue; if (!m[1]) n++; bytes += fs.statSync(path.join(PH, f)).size; } } catch {}
  let free = null; try { const st = fs.statfsSync(CFG.dataDir); free = st.bavail * st.bsize; } catch {}
  return (phUse = { n, bytes, free, cap: PH_CAP, at: Date.now() });
}
// μόνο JPEG, όπως τη φτιάχνει η εφαρμογή από τη φωτογραφία του κινητού
function jpegOf(b64, max) {
  const s = String(b64 || '').replace(/^data:image\/jpeg;base64,/, '');
  if (!s || s.length > max * 1.4 || !/^[A-Za-z0-9+/=]+$/.test(s)) return null;
  const buf = Buffer.from(s, 'base64');
  return buf.length > 100 && buf.length <= max && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF ? buf : null;
}
function savePhoto(b) {
  const full = jpegOf(b.data, PH_MAX), th = jpegOf(b.thumb, PH_TMAX);
  if (!full || !th) return { err: 'Η φωτογραφία δεν ανέβηκε: δεν είναι εικόνα JPEG ή είναι πολύ μεγάλη.' };
  const u = photoUsage();
  if (u.bytes + full.length > PH_CAP || (u.free != null && u.free < PH_FREE)) return { err: 'Δεν υπάρχει άλλος χώρος για φωτογραφίες στον server. Μίλησε με τον διαχειριστή.', full: true };
  fs.mkdirSync(PH, { recursive: true, mode: 0o700 });
  const id = crypto.randomBytes(8).toString('hex');
  fs.writeFileSync(phFile(id, true), th, { mode: 0o600 }); fs.writeFileSync(phFile(id), full, { mode: 0o600 });
  u.n++; u.bytes += full.length + th.length;
  const dim = v => Math.max(0, Math.min(20000, Math.round(+v || 0)));
  return { ph: { id, w: dim(b.w), h: dim(b.h), kb: Math.round(full.length / 1024) } };
}
function photoGC() {
  if (!fs.existsSync(PH)) return 0;
  const S = readJSON(F.state, null); if (!S) return 0;
  const refs = C.diaryRefs(S), orph = readJSON(PH_ORPH, {}), today = C.ds(new Date()), lim = C.add(today, -PH_KEEP); let n = 0;
  // και όσες είναι στα αντίγραφα της αναίρεσης
  try { for (const f of fs.readdirSync(UNDO)) { const o = readJSON(path.join(UNDO, f), null); if (o && o.state) C.diaryRefs(o.state).forEach(id => refs.add(id)); } } catch {}
  const ids = new Set(fs.readdirSync(PH).map(f => (/^([a-f0-9]{16})(_t)?\.jpg$/.exec(f) || [])[1]).filter(Boolean));
  for (const id of ids) {
    if (refs.has(id)) { delete orph[id]; continue; }
    if (!orph[id]) { orph[id] = today; continue; }
    if (orph[id] <= lim) { for (const t of [false, true]) try { fs.unlinkSync(phFile(id, t)); } catch {} delete orph[id]; n++; }
  }
  Object.keys(orph).forEach(id => { if (!ids.has(id)) delete orph[id]; });
  writeJSON(PH_ORPH, orph); phUse = null;
  if (n) console.log(now(), 'φωτογραφίες: σβήστηκαν', n, 'που δεν χρειάζονται πια');
  return n;
}
setTimeout(() => { try { photoGC(); } catch (e) { console.error('photos', e.message); } }, 5000);
setInterval(() => { try { photoGC(); } catch (e) { console.error('photos', e.message); } }, 6 * 3600e3);

// --- σελίδα προόδου για τον πελάτη ---
// Ανοίγει χωρίς σύνδεση με τον ιδιωτικό σύνδεσμο του έργου (/c/<κωδικός>) και δείχνει μόνο ό,τι επιτρέπεται (clientView στο src/core.js).
// Η σελίδα δεν έχει JavaScript· οι φωτογραφίες σερβίρονται μόνο αν ανήκουν στο έργο και δεν είναι «Μόνο για εμάς».
F.cviews = path.join(CFG.dataDir, 'client-views.json');
const CL_HDR = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" };
// πόσες φορές την άνοιξε ο πελάτης (μία φορά ανά μισή ώρα), για να το βλέπει το γραφείο
function clientSeen(S, t) {
  const live = new Set((S.projects || []).map(p => p.share && p.share.t).filter(Boolean)), v = readJSON(F.cviews, {}), x = v[t] || { n: 0 }, ts = Date.now();
  if (x.ts && ts - x.ts < 30 * 60e3) return;
  Object.keys(v).forEach(k => { if (!live.has(k)) delete v[k]; });
  v[t] = { n: x.n + 1, last: now(), ts }; writeJSON(F.cviews, v);
}
function clientPage(res, url, m) {
  const gone = () => { res.writeHead(404, { ...CL_HDR, 'content-type': 'text/html; charset=utf-8' }); res.end(C.clientGone()); };
  const S = readJSON(F.state, null); if (!S) return gone();
  C.setState(withPlan(S)); C.today();
  const p = C.byShare(m[1]); if (!p || !C.clientOn()) return gone();
  if (m[2]) {
    const f = phFile(m[2], !!m[3]);
    if (!C.clientPhotoOk(p.id, m[2]) || !fs.existsSync(f)) { res.writeHead(404, CL_HDR); return res.end(); }
    res.writeHead(200, { ...CL_HDR, 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=86400' });
    return fs.createReadStream(f).pipe(res);
  }
  const base = '/c/' + m[1], v = C.clientView(C.schedule(), p.id, url.searchParams.get('all') === '1');
  try { clientSeen(S, m[1]); } catch (e) { console.error('client', e.message); }
  res.writeHead(200, { ...CL_HDR, 'content-type': 'text/html; charset=utf-8' });
  res.end(C.clientDoc(v, { ph: (ph, big) => ph && ph.id ? base + '/ph/' + ph.id + (big ? '' : '_t') + '.jpg' : '', all: base + '?all=1' }));
}

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
    const days = week ? C.weekDays(C.viewStart(date)) : [date];
    const owner = C.ownerW();   // ο εργολάβος, αν έχει κινητό στις Ρυθμίσεις: μόνο ραντεβού και υπενθυμίσεις
    for (const w of owner.phone ? [...S.workers, owner] : S.workers) {
      if (only && !only.has(w.id)) continue;
      const phone = normPhone(w.phone);
      const entry = { at: now(), date, trigger: week ? trigger + '-week' : trigger, workerId: w.id, name: w.name, phone: w.phone || '' };
      if (!week) entry.cmp = C.dayKey(R, w, date);   // για να φανεί αν αλλάξει το πρόγραμμα μετά την αποστολή
      if (only) entry.upd = true;
      if (w.viber === false) { skipped++; log.push({ ...entry, status: 'skipped', error: 'Απενεργοποιημένο' }); continue; }
      if (!only && C.isExt(w) && !C.hasJob(R, w.id, days)) { skipped++; log.push({ ...entry, status: 'skipped', error: 'Συνεργάτης χωρίς εργασία' }); continue; }
      if (!week && !only && w.id !== C.OWNER && C.isRest(w, date) && !C.isLeave(w, date)) { skipped++; log.push({ ...entry, status: 'skipped', error: 'Ρεπό' }); continue; }
      if (w.id === C.OWNER && !days.some(d => C.dayBlock(R, w, d).trim())) { skipped++; log.push({ ...entry, status: 'skipped', error: 'Χωρίς ραντεβού ή υπενθυμίσεις' }); continue; }
      if (!phone) { skipped++; log.push({ ...entry, status: 'skipped', error: 'Χωρίς σωστό κινητό' }); continue; }
      const text = week ? C.personText(R, w, C.viewStart(date)) : C.personDayText(R, w, date, !!only);
      try { const r = await sendOne(phone, text); r.status === 'sent' ? sent++ : dry++; log.push({ ...entry, status: r.status, text }); }
      catch (e) { failed++; log.push({ ...entry, status: 'error', error: e.message, text }); }
    }
    writeJSON(F.log, log.slice(-3000));
    // το ίδιο πρόγραμμα ως ειδοποίηση στο κινητό, σε όσους έχουν λογαριασμό και την ενεργοποίησαν
    let pushed = 0;
    if (pushOn(S)) for (const w of S.workers) {
      const us = usersOf(w.id);
      if (!us.length || (only && !only.has(w.id))) continue;
      if (!only && C.isExt(w) && !C.hasJob(R, w.id, days)) continue;
      if (!week && !only && C.isRest(w, date) && !C.isLeave(w, date)) continue;
      const text = week ? C.personText(R, w, C.viewStart(date)) : C.personDayText(R, w, date, !!only);
      const l = C.langOf(w);   // στη γλώσσα του εργαζόμενου, όπως και το μήνυμα
      const title = week ? C.I18N.tx(l, 'Το πρόγραμμά σου για την εβδομάδα {d}', { d: C.fmtSX(l, C.viewStart(date)) }) : C.I18N.tx(l, only ? 'Άλλαξε το πρόγραμμά σου για {d}' : 'Το πρόγραμμά σου για {d}', { d: C.fmtX(l, date) });
      pushed += (await pushTo(us, 'day', { title, body: pushBody(text), url: '/', tag: 'day-' + (week ? 'w' : '') + date })).sent;
    }
    const what = only ? ' με την αλλαγή' : '';
    const msg = CFG.provider === 'http'
      ? `Στάλθηκαν ${sent} μηνύματα${what}${failed ? ', ' + failed + ' απέτυχαν' : ''}${skipped ? ', ' + skipped + ' παραλείφθηκαν' : ''}.`
      : `Δοκιμαστική λειτουργία: ετοιμάστηκαν ${dry} μηνύματα${what} χωρίς να σταλούν${skipped ? ', ' + skipped + ' παραλείφθηκαν' : ''}.`;
    const msg2 = msg + (pushed ? ` Ειδοποιήσεις στο κινητό: ${pushed}.` : '');
    console.log(now(), trigger, date, msg2);
    return { ok: true, message: msg2, sent, dry, failed, skipped, pushed };
  } finally { running = false; }
}
// σύνοψη εβδομάδας στο Viber του εργολάβου (πακέτο Συνεργείο και πάνω)
async function runSum(date, trigger) {
  const S = readJSON(F.state, null);
  if (!S || !S.settings) return { ok: false, message: 'Δεν υπάρχουν ακόμη δεδομένα στον server.' };
  C.setState(withPlan(S));
  if (!C.hasF('weekly')) return { ok: false, message: C.planHas('weekly') ? 'Η σύνοψη εβδομάδας είναι κλειστή στις Ρυθμίσεις.' : 'Η σύνοψη εβδομάδας δεν περιλαμβάνεται στο πακέτο.' };
  const owner = C.ownerW(), phone = normPhone(owner.phone);
  const text = C.weekSumText(C.weekSum(C.schedule(), C.viewStart(date)));
  const entry = { at: now(), date, trigger: trigger + '-sum', kind: 'sum', workerId: C.OWNER, name: owner.name, phone: owner.phone || '' };
  const pushed = pushOn(S) ? (await pushTo(USERS.filter(u => u.role === 'admin'), 'sum', { title: 'Σύνοψη εβδομάδας ' + C.fmtS(C.viewStart(date)), body: pushBody(text), url: '/?tab=today', tag: 'sum-' + date })).sent : 0;
  const log = readJSON(F.log, []);
  let r;
  if (!phone) { log.push({ ...entry, status: 'skipped', error: 'Χωρίς σωστό κινητό' }); r = pushed ? { ok: true, message: 'Η σύνοψη στάλθηκε ως ειδοποίηση στο κινητό. Για Viber γράψε το κινητό του εργολάβου στις Ρυθμίσεις.' } : { ok: false, message: 'Δεν υπάρχει σωστό κινητό του εργολάβου στις Ρυθμίσεις.' }; }
  else {
    try { const x = await sendOne(phone, text); log.push({ ...entry, status: x.status, text }); r = { ok: true, message: (x.status === 'sent' ? 'Η σύνοψη στάλθηκε στον εργολάβο.' : 'Δοκιμαστική λειτουργία: η σύνοψη ετοιμάστηκε χωρίς να σταλεί στο Viber.') + (pushed ? ' Στάλθηκε και ως ειδοποίηση στο κινητό.' : '') }; }
    catch (e) { log.push({ ...entry, status: 'error', error: e.message, text }); r = { ok: false, message: 'Η σύνοψη δεν στάλθηκε: ' + e.message }; }
  }
  writeJSON(F.log, log.slice(-3000));
  console.log(now(), trigger, 'sum', date, r.message);
  return r;
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

// η σύνοψη της εβδομάδας φεύγει μία φορά, τη μέρα και την ώρα που ορίζονται στις Ρυθμίσεις
setInterval(() => {
  const S = readJSON(F.state, null);
  const c = S && S.settings && S.settings.sum;
  if (!c || !c.auto) return;
  const d = new Date(), today = C.ds(d);
  if (d.getDay() !== +(c.day ?? C.SUM_D.day)) return;
  const [sh, sm] = String(c.time || C.SUM_D.time).split(':').map(Number);
  const late = d.getHours() * 60 + d.getMinutes() - (sh * 60 + sm);
  const meta = readJSON(F.meta, {});
  if (meta.lastSum === today || late < 0 || late > 120) return;
  meta.lastSum = today; writeJSON(F.meta, meta);
  runSum(today, 'auto').catch(e => console.error('auto sum', e));
}, 30000);

// --- εφαρμογή για κινητά (PWA): εικονίδια, manifest, service worker ---
// Δεν περιέχουν δεδομένα, γι' αυτό σερβίρονται χωρίς κωδικό (το κινητό τα ζητά πριν τη σύνδεση).
const PUBLIC = { '/manifest.webmanifest': 'application/manifest+json', '/sw.js': 'text/javascript; charset=utf-8', '/icon-192.png': 'image/png', '/icon-512.png': 'image/png', '/icon-maskable-512.png': 'image/png', '/apple-touch-icon.png': 'image/png' };
// --- κλάδος: κάθε αντίγραφο του server είναι μία εταιρεία, κατασκευαστική (build) ή εστίαση (food) ---
// Ο πρώτος διαχειριστής τον διαλέγει μία φορά μετά την πρώτη σύνδεση και μετά δεν αλλάζει. PARON_INDUSTRY τον ορίζει από πριν.
const INDUSTRIES = ['build', 'food'];
F.industry = path.join(CFG.dataDir, 'industry.json');
F.food = path.join(CFG.dataDir, 'estiasi.json');
const FOOD_HTML = path.join(ROOT, 'estiasi', 'index.html');
function industry() {
  if (INDUSTRIES.includes(process.env.PARON_INDUSTRY)) return process.env.PARON_INDUSTRY;
  const o = readJSON(F.industry, null);
  return o && INDUSTRIES.includes(o.industry) ? o.industry : null;
}
// εγκαταστάσεις που υπήρχαν πριν από την επιλογή κλάδου έχουν ήδη δεδομένα κατασκευαστικής
if (!industry() && fs.existsSync(F.state)) writeJSON(F.industry, { industry: 'build', at: now() });
function saveFood(o) {
  // όπως στην κατασκευαστική: ένα αντίγραφο ασφαλείας ανά μέρα, των τελευταίων 60 ημερών
  if (fs.existsSync(F.food)) {
    const bk = path.join(CFG.dataDir, 'estiasi-backup-' + C.ds(new Date()) + '.json');
    if (!fs.existsSync(bk)) {
      fs.copyFileSync(F.food, bk);
      fs.readdirSync(CFG.dataDir).filter(f => /^estiasi-backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().slice(0, -60).forEach(f => fs.unlinkSync(path.join(CFG.dataDir, f)));
    }
  }
  writeJSON(F.food, o);
}
const foodPage = () => {
  if (!fs.existsSync(FOOD_HTML)) return '<!doctype html><meta charset="utf-8"><p style="font:16px sans-serif;padding:24px">Η εφαρμογή εστίασης δεν έχει εγκατασταθεί σε αυτόν τον server.</p>';
  return '<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' + PWA_HEAD + '</head><body>\n' + fs.readFileSync(FOOD_HTML, 'utf8') + '\n</body></html>\n';
};

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

// --- ειδοποιήσεις στο κινητό (Web Push, πακέτο Συνεργείο) ---
// Κάθε συσκευή που τις ενεργοποιεί γράφεται στο data/push.json, ανά χρήστη. Τα κλειδιά του server (VAPID) φτιάχνονται μία φορά.
// Δεν χρειάζεται πάροχος ούτε χρέωση: τις παραδίδει η υπηρεσία του browser (Google, Apple, Mozilla).
// Είδη: day = το πρόγραμμα της μέρας και οι αλλαγές του, leave = απάντηση σε αίτημα άδειας,
//       field = αναφορές και αιτήματα από το εργοτάξιο (γραφείο), sum = σύνοψη εβδομάδας (διαχειριστής).
const WP = require('./webpush.js');
F.push = path.join(CFG.dataDir, 'push.json'); F.vapid = path.join(CFG.dataDir, 'vapid.json');
let VAPID = readJSON(F.vapid, null);
if (!VAPID || !VAPID.pub || !VAPID.priv) { VAPID = WP.vapidKeys(); writeJSON(F.vapid, VAPID); }
const PUSH_SUBJ = process.env.PUSH_SUBJECT || 'mailto:info@paron.gr';
const PUSH_KINDS = { day: 'Το πρόγραμμά μου', leave: 'Απάντηση στις άδειές μου', field: 'Πρόοδος και άδειες από το εργοτάξιο', sum: 'Σύνοψη εβδομάδας' };
const pushKinds = u => [...(u.workerId ? ['day', 'leave'] : []), ...(u.role !== 'worker' ? ['field'] : []), ...(u.role === 'admin' ? ['sum'] : [])];
// ανοιχτές για την εταιρεία; (αντίγραφο ρυθμίσεων, ώστε να μη γραφτεί το πακέτο στα δεδομένα)
const pushOn = S => { if (!S || !S.settings) return false; C.setState(withPlan({ ...S, settings: { ...S.settings } })); return C.hasF('push'); };
// το κείμενο της ειδοποίησης: χωρίς τον χαιρετισμό, την υπογραφή και κενές γραμμές
const pushBody = t => { const L = String(t || '').split('\n').map(x => x.trim()).filter(Boolean); return L.slice(1, L.length > 2 ? -1 : undefined).join('\n').slice(0, 400); };
// η γλώσσα ενός λογαριασμού εργαζόμενου (οι λογαριασμοί γραφείου μένουν στα ελληνικά)
const langU = u => { const S = readJSON(F.state, null), w = S && u.workerId && (S.workers || []).find(x => x.id === u.workerId); return w ? C.langOf(w, S.settings) : 'el'; };
// kind null = δοκιμή, πάει σε όλες τις συσκευές του χρήστη
async function pushTo(users, kind, msg) {
  const db = readJSON(F.push, {}), dead = [];
  let sent = 0, failed = 0;
  for (const u of users) {
    const e = db[u.id];
    if (!e || !(e.subs || []).length || (kind && ((e.off || []).includes(kind) || !pushKinds(u).includes(kind)))) continue;
    for (const s of e.subs) {
      const r = await WP.send(s, { ...msg, kind: kind || 'test' }, VAPID, PUSH_SUBJ);
      if (r.ok) sent++; else { failed++; if (r.gone) dead.push(s.endpoint); console.log(now(), 'push', u.username, r.status || '', r.error || ''); }
    }
  }
  // συσκευές που δεν δέχονται πια (απεγκαταστάθηκε η εφαρμογή ή έληξε η άδεια) σβήνονται
  if (dead.length) { const cur = readJSON(F.push, {}); for (const k of Object.keys(cur)) cur[k].subs = (cur[k].subs || []).filter(x => !dead.includes(x.endpoint)); writeJSON(F.push, cur); }
  return { sent, failed, removed: dead.length };
}
const usersOf = wid => USERS.filter(u => u.workerId && u.workerId === wid);
const officeUsers = () => USERS.filter(u => u.role !== 'worker');

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
      return send(res, 200, industry() === 'food' ? foodPage() : fullPage(PWA_HEAD), 'text/html; charset=utf-8');
    if (url.pathname === '/api/health') return send(res, 200, { ok: true, time: now() });
    const clm = /^\/c\/([^/]{0,80})(?:\/ph\/([a-f0-9]{16})(_t)?\.jpg)?\/?$/.exec(url.pathname);   // ο κωδικός ελέγχεται στο byShare
    if (clm && req.method === 'GET') return clientPage(res, url, clm);
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
      return send(res, 200, { user: pubU(u), industry: industry() });
    }
    if (url.pathname === '/api/setup' && req.method === 'POST') {
      if (USERS.length) return send(res, 409, { error: 'Υπάρχει ήδη λογαριασμός. Κάνε σύνδεση.' });
      const b = await body(), err = checkUser(b, true);
      if (err) return send(res, 400, { error: err });
      const u = makeUser({ ...b, role: 'admin' }); USERS.push(u); saveUsers(); startSession(req, res, u, true);
      console.log(now(), 'δημιουργήθηκε ο πρώτος διαχειριστής', u.username);
      return send(res, 200, { user: pubU(u), industry: industry() });
    }
    if (url.pathname === '/api/logout' && req.method === 'POST') { endSession(req, res); return send(res, 200, { ok: true }); }
    const me = currentUser(req);
    if (!me) return send(res, 401, { error: 'Χρειάζεται σύνδεση.', setup: !USERS.length });
    if (url.pathname === '/api/me') return send(res, 200, { user: pubU(me), industry: industry() });
    if (url.pathname === '/api/industry' && req.method === 'POST') {
      if (me.role !== 'admin') return send(res, 403, { error: 'Μόνο ο διαχειριστής ορίζει τον κλάδο.' });
      if (industry()) return send(res, 409, { error: 'Ο κλάδος έχει ήδη οριστεί και δεν αλλάζει.' });
      const b = await body();
      if (!INDUSTRIES.includes(b.industry)) return send(res, 400, { error: 'Διάλεξε κατασκευαστική ή εστίαση.' });
      writeJSON(F.industry, { industry: b.industry, at: now(), by: me.username });
      console.log(now(), 'κλάδος', b.industry, 'από', me.username);
      return send(res, 200, { industry: b.industry });
    }
    if (url.pathname === '/api/estiasi/state') {
      if (industry() !== 'food') return send(res, 404, { error: 'Αυτός ο server δεν είναι για εστίαση.' });
      if (me.role === 'worker') return send(res, 403, { error: 'Δεν έχεις πρόσβαση.' });
      if (req.method === 'GET') return send(res, 200, readJSON(F.food, {}));
      if (req.method === 'PUT') {
        let o; try { o = JSON.parse(await readBody(req)); } catch { o = null; }
        if (!o || o.v !== 9 || !Array.isArray(o.staff) || !Array.isArray(o.roles) || !Array.isArray(o.shifts)) return send(res, 400, { error: 'Μη έγκυρα δεδομένα' });
        saveFood(o);
        return send(res, 200, { ok: true });
      }
    }
    // φωτογραφία του ημερολογίου: το γραφείο βλέπει όλες, ο εργαζόμενος μόνο όσες έστειλε ο ίδιος
    const phm = /^\/api\/photo\/([a-f0-9]{16})$/.exec(url.pathname);
    if (phm && req.method === 'GET') {
      const id = phm[1];
      if (me.role === 'worker') { const S = readJSON(F.state, {}); if (!(S.diary || []).some(r => r.ph && r.ph.id === id && !r.x && r.by === 'w' && r.bw === me.workerId)) return send(res, 404, { error: 'Η φωτογραφία δεν βρέθηκε.' }); }
      const f = phFile(id, url.searchParams.get('t') === '1');
      if (!fs.existsSync(f)) return send(res, 404, { error: 'Η φωτογραφία δεν βρέθηκε.' });
      res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' });
      return fs.createReadStream(f).pipe(res);
    }
    if (url.pathname === '/api/password' && req.method === 'POST') {
      const b = await body();
      if (!checkPw(me, b.current || '')) return send(res, 400, { error: 'Ο τωρινός κωδικός δεν είναι σωστός.' });
      if (String(b.password || '').length < 8) return send(res, 400, { error: 'Ο κωδικός θέλει τουλάχιστον 8 χαρακτήρες.' });
      me.salt = crypto.randomBytes(16).toString('hex'); me.hash = hashPw(b.password, me.salt); saveUsers();
      dropSessions(me.id, session(req));   // αποσυνδέει τις άλλες συσκευές
      return send(res, 200, { ok: true });
    }
    if (url.pathname.startsWith('/api/push')) {
      const on = pushOn(readJSON(F.state, null)), db = readJSON(F.push, {}), mine = db[me.id] || { subs: [], off: [] };
      if (url.pathname === '/api/push' && req.method === 'GET') {
        const ep = url.searchParams.get('ep') || '';
        return send(res, 200, { on, key: VAPID.pub, devices: (mine.subs || []).length, here: !!ep && (mine.subs || []).some(x => x.endpoint === ep), kinds: pushKinds(me).map(k => ({ k, name: PUSH_KINDS[k], on: !(mine.off || []).includes(k) })) });
      }
      if (req.method === 'POST') {
        const b = await body(), off = { error: 'Οι ειδοποιήσεις στο κινητό δεν είναι ανοιχτές για την εταιρεία σου.' };
        if (url.pathname === '/api/push/sub') {
          if (!on) return send(res, 403, off);
          const s = b.sub || {}, k = s.keys || {};
          if (!WP.okEndpoint(s.endpoint) || WP.ub64(k.p256dh).length !== 65 || WP.ub64(k.auth).length < 16) return send(res, 400, { error: 'Η συσκευή δεν έδωσε σωστά στοιχεία για ειδοποιήσεις.' });
          // μία συσκευή ανήκει σε έναν χρήστη: αν μπήκε άλλος λογαριασμός, φεύγει από τον προηγούμενο
          for (const id of Object.keys(db)) db[id].subs = (db[id].subs || []).filter(x => x.endpoint !== s.endpoint && (!b.old || x.endpoint !== b.old));
          const e = db[me.id] = db[me.id] || { subs: [], off: [] };
          e.subs = [...e.subs, { endpoint: s.endpoint, keys: { p256dh: k.p256dh, auth: k.auth }, ua: String(req.headers['user-agent'] || '').slice(0, 160), at: now() }].slice(-10);
          writeJSON(F.push, db); console.log(now(), 'ειδοποιήσεις: νέα συσκευή', me.username);
          return send(res, 200, { ok: true, devices: e.subs.length });
        }
        if (url.pathname === '/api/push/unsub') {
          if (db[me.id]) { db[me.id].subs = (db[me.id].subs || []).filter(x => x.endpoint !== b.endpoint); writeJSON(F.push, db); }
          return send(res, 200, { ok: true, devices: db[me.id] ? db[me.id].subs.length : 0 });
        }
        if (url.pathname === '/api/push/prefs') {
          const e = db[me.id] = db[me.id] || { subs: [], off: [] };
          e.off = (Array.isArray(b.off) ? b.off : []).filter(k => PUSH_KINDS[k]); writeJSON(F.push, db);
          return send(res, 200, { ok: true });
        }
        if (url.pathname === '/api/push/test') {
          if (!on) return send(res, 403, off);
          if (!(mine.subs || []).length) return send(res, 400, { error: 'Δεν υπάρχει συσκευή με ειδοποιήσεις για τον λογαριασμό σου.' });
          const l = langU(me), r = await pushTo([me], null, { title: C.I18N.tx(l, '{app}: δοκιμή', { app: C.BRAND.name }), body: C.I18N.tx(l, 'Οι ειδοποιήσεις φτάνουν σε αυτή τη συσκευή.'), url: '/', tag: 'test' });
          return send(res, 200, { ok: r.sent > 0, ...r });
        }
      }
      return send(res, 404, { error: 'Δεν βρέθηκε' });
    }
    if (me.role !== 'worker' && url.pathname === '/api/photo' && req.method === 'POST') {
      const S = readJSON(F.state, null); if (!S) return send(res, 400, { error: 'Δεν υπάρχουν ακόμη δεδομένα.' });
      C.setState(withPlan(S)); if (!C.hasF('diary')) return send(res, 403, { error: 'Το ημερολόγιο έργου δεν είναι ανοιχτό για την εταιρεία σου.' });
      const x = savePhoto(await body()); if (x.err) return send(res, x.full ? 507 : 400, { error: x.err });
      console.log(now(), 'φωτογραφία', me.username, x.ph.kb + ' KB');
      return send(res, 200, { ok: true, ph: x.ph });
    }
    if (me.role !== 'worker' && url.pathname === '/api/client-views' && req.method === 'GET') {
      const S = readJSON(F.state, {}), v = readJSON(F.cviews, {}), out = {};
      (S.projects || []).forEach(p => { const t = p.share && p.share.t; if (t && v[t]) out[p.id] = { n: v[t].n, last: v[t].last }; });
      return send(res, 200, out);
    }
    if (me.role !== 'worker' && url.pathname === '/api/photos' && req.method === 'GET') {
      const u = photoUsage(); return send(res, 200, { n: u.n, mb: Math.round(u.bytes / 1e5) / 10, capGb: Math.round(u.cap / 1e8) / 10, freeGb: u.free == null ? null : Math.round(u.free / 1e8) / 10 });
    }
    if (me.role === 'worker') {
      // ο εργάτης παίρνει μόνο το δικό του εβδομαδιαίο πρόγραμμα, όχι μεροκάματα, οικονομικά ή άλλους εργαζόμενους
      const S = readJSON(F.state, null), w = S && (S.workers || []).find(x => x.id === me.workerId);
      if (url.pathname === '/api/my' && req.method === 'GET') {
        if (!w) return send(res, 200, { unlinked: true, name: me.name });
        C.setState(withPlan(S)); C.today();
        const q = url.searchParams.get('week') || '';
        return send(res, 200, C.myView(C.schedule(), w, C.viewStart(/^\d{4}-\d{2}-\d{2}$/.test(q) ? q : C.ds(new Date()))));
      }
      // η γλώσσα του: η σελίδα του, τα μηνύματα Viber και οι ειδοποιήσεις έρχονται σε αυτή
      if (url.pathname === '/api/my/lang' && req.method === 'POST') {
        if (!w) return send(res, 400, { error: 'Ο λογαριασμός σου δεν έχει συνδεθεί ακόμη με εργαζόμενο.' });
        const b = await body(), l = String(b.lang || '');
        if (!C.I18N.okLang(l)) return send(res, 400, { error: 'Άγνωστη γλώσσα.' });
        if ((w.lang || '') !== l) { w.lang = l; w.langAt = new Date().toISOString();   // ίδια μορφή (UTC) με την εφαρμογή, για τη σύγκριση στη mergeLang
          delete S.settings.planLock; saveState(S); console.log(now(), 'γλώσσα', me.username, l); }
        return send(res, 200, { ok: true, lang: w.lang });
      }
      // ο εργάτης γράφει μόνο δύο πράγματα και μόνο για τον εαυτό του: πρόοδο της εργασίας του σήμερα και αίτημα άδειας
      const mine = ['/api/my/progress', '/api/my/leave', '/api/my/leave/cancel', '/api/my/att', '/api/my/diary'];
      if (mine.includes(url.pathname) && req.method === 'POST') {
        if (!w) return send(res, 400, { error: 'Ο λογαριασμός σου δεν έχει συνδεθεί ακόμη με εργαζόμενο.' });
        const b = await body(); C.setState(withPlan(S)); C.today();
        const feat = url.pathname === '/api/my/progress' ? 'progress' : url.pathname === '/api/my/att' ? 'gps' : url.pathname === '/api/my/diary' ? 'diary' : 'leave';
        if (!C.hasF(feat)) return send(res, 403, { error: 'Αυτή η λειτουργία δεν είναι ανοιχτή για την εταιρεία σου.' });
        if (C.pastPending()) C.freezePast(C.schedule());   // οι μέρες που πέρασαν μένουν όπως έγιναν
        const before = JSON.parse(JSON.stringify(S));
        let out;
        if (feat === 'gps') {
          // «Ήρθα» / «Έφυγα»: η ώρα είναι του server· η θέση έρχεται μόνο τη στιγμή που πατά το κουμπί
          const n = v => (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '')) && isFinite(v) ? +v : NaN;
          const pos = isFinite(n(b.lat)) && isFinite(n(b.lon)) ? { lat: n(b.lat), lon: n(b.lon), acc: n(b.acc) } : null;
          out = C.addAtt(C.schedule(), w, String(b.k || ''), pos, new Date(), typeof b.why === 'string' ? b.why : '');
          if (out.err) return send(res, 400, { error: out.err, ek: out.ek, ep: out.ep });
          delete S.settings.planLock;
          saveState(S);
          console.log(now(), 'παρουσία', me.username, b.k, pos ? 'με θέση' : 'χωρίς θέση');
          return send(res, 200, { ok: true, att: C.attPub(out.r) });
        }
        if (feat === 'diary') {
          // φωτογραφία ή σημείωση για το ημερολόγιο του έργου όπου δουλεύει σήμερα· σβήνει μόνο δικά του και μόνο την ίδια μέρα
          const R = C.schedule();
          if (b.del) {
            out = C.delMyDiary(w, String(b.del)); if (out.err) return send(res, 400, { error: out.err, ek: out.ek, ep: out.ep });
            delete S.settings.planLock; saveState(S); return send(res, 200, { ok: true, diary: C.myDiary(R, w) });
          }
          const md = C.myDiary(R, w), pid = md.ps.some(x => x.id === b.p) ? b.p : (md.ps[0] || {}).id;
          if (!pid) return send(res, 400, { error: 'Σήμερα δεν είσαι σε έργο. Φωτογραφίες στέλνεις τη μέρα που δουλεύεις σε κάποιο.' });
          if (md.items.length >= 40) return send(res, 400, { error: 'Έστειλες ήδη 40 σήμερα. Τα υπόλοιπα στείλ’ τα στο γραφείο.' });
          let ph = null;
          if (b.data) { const x = savePhoto(b); if (x.err) return send(res, x.full ? 507 : 400, { error: x.err }); ph = x.ph; }
          out = C.addDiary({ p: pid, d: C.today(), text: typeof b.text === 'string' ? b.text : '', ph, by: 'w', bw: w.id, bn: w.name });
          if (out.err) return send(res, 400, { error: out.err, ek: out.ek, ep: out.ep });
          delete S.settings.planLock; saveState(S);
          console.log(now(), 'ημερολόγιο', me.username, ph ? 'φωτογραφία ' + ph.kb + ' KB' : 'σημείωση');
          if (pushOn(S)) {
            const pn = (S.projects.find(p => p.id === pid) || {}).name || '';
            pushTo(officeUsers(), 'field', { title: w.name + (ph ? ': φωτογραφία από το εργοτάξιο' : ': σημείωση από το εργοτάξιο'), body: pn + (out.r.text ? ' · «' + out.r.text.slice(0, 120) + '»' : ''), url: '/#diary', tag: 'diary-' + out.r.id }).catch(e => console.error('push', e));
          }
          return send(res, 200, { ok: true, diary: C.myDiary(C.schedule(), w) });
        }
        if (feat === 'progress') out = C.addProgress(C.schedule(), w, String(b.task || ''), b.kind, b.note, C.ds(new Date()));
        else if (url.pathname === '/api/my/leave') out = C.addLeave(w, b.from, b.to, b.note);
        else out = C.cancelLeave(w, String(b.id || ''));
        if (out.err) return send(res, 400, { error: out.err, ek: out.ek, ep: out.ep });
        if (out.e) saveUndo([out.e.id], before);   // το γραφείο μπορεί να την αναιρέσει από το ιστορικό
        delete S.settings.planLock;
        saveState(S);
        console.log(now(), 'από το εργοτάξιο', me.username, url.pathname.slice(8), out.r.k || '');
        // ειδοποίηση στο γραφείο (χωρίς αναμονή, η απάντηση στον εργαζόμενο φεύγει αμέσως)
        const r = out.r, t = r.t && S.tasks.find(x => x.id === r.t), pn = t && (S.projects.find(p => p.id === t.projectId) || {}).name;
        const msg = r.k === 'done' ? { title: w.name + ': τελείωσε «' + (t ? t.title : '') + '»' } : r.k === 'more' ? { title: w.name + ': μία μέρα ακόμη για «' + (t ? t.title : '') + '»' }
          : r.k === 'leave' && url.pathname === '/api/my/leave' ? { title: w.name + ' ζητά άδεια', body: C.fmt(r.from) + (r.to && r.to !== r.from ? ' έως ' + C.fmt(r.to) : '') } : null;
        if (msg && pushOn(S)) {
          if (pn && r.k !== 'leave') msg.body = pn;
          if (r.note) msg.body = (msg.body ? msg.body + ' · ' : '') + '«' + r.note + '»';
          pushTo(officeUsers(), 'field', { ...msg, url: '/?tab=today', tag: 'field-' + r.id }).catch(e => console.error('push', e));
        }
        return send(res, 200, { ok: true });
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
      if (req.method === 'GET') return send(res, 200, withPlan(readJSON(F.state, {})));
      if (req.method === 'PUT') {
        const o = JSON.parse(await readBody(req));
        if (!o || o.v !== 2 || !Array.isArray(o.workers) || !Array.isArray(o.tasks)) return send(res, 400, { error: 'Μη έγκυρα δεδομένα' });
        if (o.settings) { delete o.settings.planLock; if (CFG.plan) o.settings.plan = CFG.plan; }   // το πακέτο το ορίζει η συνδρομή, όχι η εφαρμογή
        // ιστορικό: οι νέες εγγραφές παίρνουν το όνομα του χρήστη που συνδέθηκε, και κρατιούνται τα δεδομένα πριν την αλλαγή
        const cur = readJSON(F.state, null), known = new Set(((cur && cur.hist) || []).map(e => e && e.id));
        const fresh = (Array.isArray(o.hist) ? o.hist : []).filter(e => e && e.id && !known.has(e.id));
        fresh.forEach(e => { e.by = me.name; });
        if (cur && fresh.length && !fresh.some(e => e.undo)) saveUndo(fresh.map(e => String(e.id)), cur);
        if (cur) { C.mergeField(o, cur); C.mergeAtt(o, cur); C.mergeDiary(o, cur); C.mergeLang(o, cur); }   // ό,τι έστειλαν στο μεταξύ οι εργαζόμενοι δεν χάνεται
        // αιτήματα άδειας που μόλις απαντήθηκαν: ειδοποίηση στον εργαζόμενο
        const was = new Map(((cur && cur.field) || []).map(r => [r.id, r.st]));
        const decided = (o.field || []).filter(r => r.k === 'leave' && (r.st === 'ok' || r.st === 'no') && was.get(r.id) === 'new');
        saveState(o);
        if (decided.length && pushOn(o)) for (const r of decided) {
          const l = C.langOf((o.workers || []).find(x => x.id === r.w), o.settings), T0 = C.I18N.tx, f = d => C.fmtX(l, d);
          pushTo(usersOf(r.w), 'leave', { title: T0(l, r.st === 'ok' ? 'Η άδειά σου εγκρίθηκε' : 'Η άδειά σου δεν εγκρίθηκε'), body: r.to && r.to !== r.from ? T0(l, '{a} έως {b}', { a: f(r.from), b: f(r.to) }) : f(r.from), url: '/', tag: 'leave-' + r.id }).catch(e => console.error('push', e));
        }
        return send(res, 200, { ok: true });
      }
    }
    if (url.pathname === '/api/undo' && req.method === 'POST') {
      const b = JSON.parse((await readBody(req)) || '{}'), cur = readJSON(F.state, {}), t = C.undoTarget(cur.hist);
      if (!t || t.id !== b.id) return send(res, 409, { error: 'Στο μεταξύ έγινε άλλη αλλαγή. Δες το ιστορικό και δοκίμασε ξανά.' });
      const u = findUndo(t.id);
      if (!u || !u.state) return send(res, 410, { error: 'Αυτή η αλλαγή δεν αναιρείται πια.' });
      const o = u.state;
      o.hist = (cur.hist || []).concat({ id: 'h' + Date.now().toString(36), at: now().slice(0, 16), by: me.name, msg: 'Αναίρεση: ' + t.msg, undo: u.ids });
      o.dutyDone = cur.dutyDone || {};   // τα «έγινε» των υπενθυμίσεων μένουν όπως είναι
      o.past = cur.past || {};           // και οι μέρες που πέρασαν
      // αναφορές και αιτήματα από το εργοτάξιο που ήρθαν μετά μένουν· αν αναιρείται η ίδια η αναφορά, μένει ως αναιρεμένη
      const fids = new Set((cur.hist || []).filter(e => e && e.fid && u.ids.includes(e.id)).map(e => e.fid));
      C.mergeField(o, cur, fids, true); C.mergeAtt(o, cur, true); C.mergeDiary(o, cur, true); C.mergeLang(o, cur);
      if (o.settings) { delete o.settings.planLock; if (CFG.plan) o.settings.plan = CFG.plan; }
      saveState(o); try { fs.unlinkSync(u.file); } catch {}
      console.log(now(), 'αναίρεση', me.username, t.msg);
      return send(res, 200, withPlan(o));
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
    if (url.pathname === '/api/sum/send' && req.method === 'POST') return send(res, 200, await runSum(C.ds(new Date()), 'manual'));
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
