// PARON: πολλές εταιρείες στην ίδια διεύθυνση (π.χ. app.theparon.gr).
// Κάθε εταιρεία τρέχει το δικό της server.js, με δικό της φάκελο δεδομένων, χρήστες και αντίγραφα.
// Ο gateway διαλέγει εταιρεία από το cookie paron_co και περνά το αίτημα στη σωστή.
// Χωρίς cookie πηγαίνει στην αρχική εταιρεία, που κρατά τα δεδομένα της στο DATA_DIR όπως πριν.
// Νέα εταιρεία: σελίδα /co (ελεύθερη εγγραφή). Ο πρώτος λογαριασμός της φτιάχνεται μόνο από τον browser
// που την έφτιαξε (cookie paron_claim) και μετά ο διαχειριστής διαλέγει κλάδο.
//   Εκκίνηση:  node server/gateway.js     (οι ρυθμίσεις όπως στο server.js, συν τις PARON_* πιο κάτω)
process.env.TZ = process.env.TZ || 'Europe/Athens';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..');

(function loadEnv() {   // ίδιο με το server.js
  const f = path.join(ROOT, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
})();
const CFG = {
  port: +process.env.PORT || 8080,
  host: process.env.HOST || '0.0.0.0',
  trustProxy: process.env.TRUST_PROXY === '1',
  dataDir: path.resolve(ROOT, process.env.DATA_DIR || 'data'),
  basePort: +process.env.PARON_BASE_PORT || (+process.env.PORT || 8080) + 1000,   // θύρες των εταιρειών, μόνο τοπικά
  mainCode: (process.env.PARON_MAIN_CODE || 'main').toLowerCase(),               // κωδικός της αρχικής εταιρείας
  max: +process.env.PARON_MAX_COMPANIES || 30,                                    // κάθε εταιρεία είναι ένα πρόγραμμα στη μνήμη
  signup: process.env.PARON_SIGNUP !== '0',
};
const REG = path.join(CFG.dataDir, 'companies.json'), CDIR = path.join(CFG.dataDir, 'companies');
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJSON = (f, o) => { const tmp = f + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(o, null, 1), { mode: 0o600 }); fs.renameSync(tmp, f); };
const stamp = () => new Date().toISOString().slice(0, 19);
fs.mkdirSync(CDIR, { recursive: true });

// --- κατάλογος εταιρειών: { list: [{ id, name, port, created, claim? }] } (η αρχική δεν γράφεται εδώ) ---
let COS = readJSON(REG, { list: [] }).list || [];
const saveReg = () => writeJSON(REG, { list: COS });
const MAIN = { id: CFG.mainCode, name: process.env.PARON_MAIN_NAME || '', port: CFG.basePort, main: true };
const RESERVED = new Set(['co', 'api', 'admin', 'www', 'app', 'main', 'paron', 'theparon', 'test', CFG.mainCode]);
const byId = id => (id === MAIN.id ? MAIN : COS.find(c => c.id === id)) || null;
const dirOf = c => (c.main ? CFG.dataDir : path.join(CDIR, c.id));

// --- ένα server.js για κάθε εταιρεία· αν πέσει, ξεκινά ξανά ---
const KIDS = new Map();   // id -> { proc, tries, ready }
let STOP = false;
function start(c) {
  const env = { ...process.env, PORT: String(c.port), HOST: '127.0.0.1', TRUST_PROXY: '1', DATA_DIR: dirOf(c) };
  if (!c.main) { delete env.ERGO_PASSWORD; delete env.ERGO_USER; delete env.PARON_INDUSTRY; delete env.ERGO_PLAN; }   // ο πρώτος λογαριασμός και ο κλάδος από τη σελίδα
  const k = KIDS.get(c.id) || { tries: 0 };
  k.ready = false;
  k.proc = spawn(process.execPath, [path.join(ROOT, 'server', 'server.js')], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const tag = '[' + c.id + '] ';
  for (const s of [k.proc.stdout, k.proc.stderr]) s.on('data', b => { for (const l of String(b).split('\n')) if (l) (s === k.proc.stderr ? console.error : console.log)(tag + l); });
  k.proc.on('exit', code => {
    k.ready = false;
    if (STOP || !byId(c.id)) return;
    const wait = Math.min(60e3, 1e3 * 2 ** Math.min(k.tries++, 6));
    console.error(stamp(), tag + 'σταμάτησε (' + code + '), ξεκινά ξανά σε ' + wait / 1e3 + ' δ.');
    setTimeout(() => { if (!STOP) start(c); }, wait);
  });
  KIDS.set(c.id, k);
  return k;
}
async function ready(c, ms = 15e3) {
  const k = KIDS.get(c.id); if (!k) return false;
  if (k.ready) return true;
  for (const t = Date.now(); Date.now() - t < ms;) {
    try { const r = await fetch(`http://127.0.0.1:${c.port}/api/health`); if (r.ok) { k.ready = true; k.tries = 0; return true; } } catch {}
    await new Promise(r => setTimeout(r, 150));
  }
  return false;
}

// --- βοηθητικά http ---
function cookie(req, name) {
  for (const p of (req.headers.cookie || '').split(';')) { const i = p.indexOf('='); if (i > 0 && p.slice(0, i).trim() === name) return decodeURIComponent(p.slice(i + 1).trim()); }
  return '';
}
const isHttps = req => !!req.socket.encrypted || (CFG.trustProxy && (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https');
const ck = (req, name, val, age) => `${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; SameSite=Lax${isHttps(req) ? '; Secure' : ''}; Max-Age=${age}`;
const clientIp = req => (CFG.trustProxy && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || '';
function send(res, code, obj, headers = {}) {
  const html = typeof obj === 'string';
  res.writeHead(code, { 'content-type': html ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(html ? obj : JSON.stringify(obj));
}
function readBody(req, max = 1e4) {
  return new Promise((ok, no) => { let b = ''; req.on('data', d => { b += d; if (b.length > max) { no(new Error('big')); req.destroy(); } }); req.on('end', () => ok(b)); req.on('error', no); });
}
const sameOrigin = req => { const o = req.headers.origin; return /^application\/json/i.test(req.headers['content-type'] || '') && (!o || o === 'null' || new URL(o).host === req.headers.host); };
const h = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// --- προώθηση στην εταιρεία ---
async function proxy(req, res, c) {
  if (!(await ready(c, 8e3))) return send(res, 503, req.url.startsWith('/api/') ? { error: 'Η εφαρμογή ξεκινά. Δοκίμασε ξανά σε λίγο.' } : page('Η εφαρμογή ξεκινά', '<p>Δοκίμασε ξανά σε λίγα δευτερόλεπτα.</p>'));
  const headers = { ...req.headers, 'x-forwarded-for': clientIp(req), 'x-forwarded-proto': isHttps(req) ? 'https' : 'http' };
  const up = http.request({ host: '127.0.0.1', port: c.port, method: req.method, path: req.url, headers }, r => {
    // ο πρώτος λογαριασμός φτιάχτηκε: η εταιρεία ανήκει πια στον διαχειριστή της
    if (c.claim && req.method === 'POST' && req.url.split('?')[0] === '/api/setup' && r.statusCode === 200) {
      delete c.claim; saveReg();
      r.headers['set-cookie'] = [].concat(r.headers['set-cookie'] || [], ck(req, 'paron_claim', '', 0));
    }
    res.writeHead(r.statusCode, r.headers); r.pipe(res);
  });
  up.on('error', () => { if (!res.headersSent) send(res, 502, { error: 'Η εφαρμογή δεν απαντά. Δοκίμασε ξανά σε λίγο.' }); else res.destroy(); });
  req.pipe(up);
}

// --- εγγραφή νέας εταιρείας (όριο ανά διεύθυνση, για να μη γεμίσει ο server) ---
const SIGNS = new Map();   // ip -> [χρόνοι]
const LAT = { α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'y', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o' };
const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[α-ω]/g, x => LAT[x] || '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
function codeErr(code) {
  if (!/^[a-z0-9][a-z0-9-]{2,29}$/.test(code)) return 'Ο κωδικός εταιρείας θέλει 3 έως 30 λατινικά γράμματα, αριθμούς ή παύλες.';
  if (RESERVED.has(code) || byId(code)) return 'Αυτός ο κωδικός υπάρχει ήδη. Διάλεξε άλλον.';
  return '';
}
async function signup(req, res) {
  if (!CFG.signup) return send(res, 403, { error: 'Οι νέες εγγραφές είναι κλειστές.' });
  let b; try { b = JSON.parse((await readBody(req)) || '{}') || {}; } catch { return send(res, 400, { error: 'Μη έγκυρο αίτημα.' }); }
  const name = String(b.name || '').trim().slice(0, 80), code = String(b.code || '').trim().toLowerCase();
  if (!name) return send(res, 400, { error: 'Γράψε το όνομα της εταιρείας.' });
  const err = codeErr(code); if (err) return send(res, 400, { error: err });
  if (COS.length >= CFG.max) return send(res, 503, { error: 'Δεν γίνονται άλλες εγγραφές αυτή τη στιγμή. Επικοινώνησε μαζί μας.' });
  const ip = clientIp(req), t = Date.now(), mine = (SIGNS.get(ip) || []).filter(x => t - x < 864e5);
  if (mine.length >= 3) return send(res, 429, { error: 'Έφτιαξες ήδη αρκετές εταιρείες σήμερα. Δοκίμασε αύριο.' });
  SIGNS.set(ip, [...mine, t]);
  const port = Math.max(MAIN.port, ...COS.map(x => x.port)) + 1, claim = crypto.randomBytes(18).toString('base64url');
  const c = { id: code, name, port, created: stamp(), claim };
  fs.mkdirSync(path.join(CDIR, code), { recursive: true, mode: 0o700 });
  COS.push(c); saveReg(); start(c);
  console.log(stamp(), 'νέα εταιρεία', code, '«' + name + '»', 'από', ip);
  if (!(await ready(c))) return send(res, 503, { error: 'Η εταιρεία φτιάχτηκε αλλά αργεί να ξεκινήσει. Δοκίμασε σε λίγο από το /co/' + code + '.' });
  send(res, 200, { ok: true, code, name }, { 'set-cookie': [ck(req, 'paron_co', code, 400 * 86400), ck(req, 'paron_claim', claim, 7 * 86400)] });
}

// --- σελίδα /co: είσοδος σε εταιρεία ή νέα εταιρεία ---
function page(title, body) {
  return `<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${h(title)} · PARON</title>
<meta name="robots" content="noindex"><style>
:root{--forest:#0E3B34;--accent:#C2CF7E;--bg:#E8ECE4;--card:#F6F8F3;--text:#14231F;--mut:#55655F;--line:#CBD3C7;--err:#A33A2B}
@media (prefers-color-scheme:dark){:root{--bg:#0B2C27;--card:#123A33;--text:#E8EDE4;--mut:#A9B8B1;--line:#2C524A;--err:#F2A08F}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:440px;margin:0 auto;padding:28px 16px 40px}.logo{font:800 30px/1 "Fira Sans Condensed",system-ui,sans-serif;letter-spacing:.04em;color:var(--forest);margin:0 0 18px}
@media (prefers-color-scheme:dark){.logo{color:var(--accent)}}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin:0 0 16px}h1{font-size:20px;margin:0 0 6px}h2{font-size:17px;margin:0 0 10px}
p{margin:0 0 12px;color:var(--mut)}label{display:block;font-weight:600;margin:0 0 12px}input{display:block;width:100%;margin-top:6px;padding:12px;font:inherit;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--text)}
button,.btn{display:block;width:100%;min-height:46px;border:0;border-radius:10px;background:var(--forest);color:#fff;font:600 16px/1 inherit;font-family:inherit;cursor:pointer;text-align:center;text-decoration:none;padding:15px}
@media (prefers-color-scheme:dark){button,.btn{background:var(--accent);color:#0B2C27}}
.small{display:block;font-weight:400;color:var(--mut);margin-top:6px}.err{color:var(--err);min-height:1.2em;margin:8px 0 0}.small{font-size:14px}a{color:inherit}.cur{font-weight:600;color:var(--text)}
</style></head><body><main><p class="logo">PARON</p>${body}</main></body></html>`;
}
// καθαρίζει τα αποθηκευμένα της προηγούμενης εταιρείας στον browser, για να μη φανούν δεδομένα της σε άλλη
const CLEAR = 'try{localStorage.clear();sessionStorage.clear()}catch(e){}';
function coPage(req) {
  const cur = byId(cookie(req, 'paron_co')) || MAIN;
  return page('Εταιρεία', `
<section class="card"><h1>Μπες στην εταιρεία σου</h1>
<p>${cur.main && !cur.name ? '' : `Τώρα: <span class="cur">${h(cur.name || cur.id)}</span>. `}Γράψε τον κωδικό της εταιρείας σου (σου τον δίνει το γραφείο).</p>
<form id="go"><label>Κωδικός εταιρείας<input id="g_code" autocapitalize="none" autocorrect="off" spellcheck="false" dir="ltr" required></label>
<button type="submit">Συνέχεια</button><p class="err" id="g_err" role="alert"></p></form></section>
${CFG.signup ? `<section class="card"><h2>Νέα εταιρεία</h2><p>Φτιάξε δωρεάν λογαριασμό για την επιχείρησή σου. Μετά φτιάχνεις τον διαχειριστή και διαλέγεις κλάδο.</p>
<form id="new"><label>Όνομα επιχείρησης<input id="n_name" autocomplete="organization" required maxlength="80"></label>
<label>Κωδικός εταιρείας<input id="n_code" autocapitalize="none" autocorrect="off" spellcheck="false" dir="ltr" required maxlength="30"><span class="small">Με αυτόν μπαίνουν οι άνθρωποί σου. Λατινικά, αριθμοί, παύλες.</span></label>
<button type="submit">Δημιουργία εταιρείας</button><p class="err" id="n_err" role="alert"></p></form></section>` : ''}
<p class="small"><a href="/">Πίσω στη σύνδεση</a></p>
<script>
const LAT=${JSON.stringify(LAT)};
const slug=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[α-ω]/g,x=>LAT[x]||'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,30);
const $=id=>document.getElementById(id);
async function post(u,b){const r=await fetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Κάτι πήγε στραβά.');return j}
function enter(){${CLEAR}location.href='/'}
$('go').onsubmit=async e=>{e.preventDefault();$('g_err').textContent='';try{await post('/co/api/switch',{code:$('g_code').value.trim().toLowerCase()});enter()}catch(x){$('g_err').textContent=x.message}};
const nf=$('new');if(nf){let touched=false;$('n_code').oninput=()=>touched=true;$('n_name').oninput=()=>{if(!touched)$('n_code').value=slug($('n_name').value)};
nf.onsubmit=async e=>{e.preventDefault();$('n_err').textContent='';const b=nf.querySelector('button');b.disabled=true;
try{await post('/co/api/signup',{name:$('n_name').value,code:$('n_code').value.trim().toLowerCase()});enter()}catch(x){$('n_err').textContent=x.message;b.disabled=false}}}
</script>`);
}

// --- αιτήματα ---
http.createServer(async (req, res) => {
  try {
    const p = req.url.split('?')[0];
    if (p === '/co' || p === '/co/') return send(res, 200, coPage(req));
    const link = /^\/co\/([a-z0-9-]{1,30})\/?$/.exec(p);   // σύνδεσμος που στέλνει το γραφείο: /co/<κωδικός>
    if (link && req.method === 'GET') {
      const c = byId(link[1]);
      if (!c) return send(res, 404, page('Δεν βρέθηκε', '<section class="card"><h1>Δεν βρέθηκε η εταιρεία</h1><p>Έλεγξε τον σύνδεσμο ή γράψε τον κωδικό.</p><a class="btn" href="/co">Επιλογή εταιρείας</a></section>'));
      return send(res, 200, `<!doctype html><meta charset="utf-8"><script>${CLEAR}location.replace('/')</script>`, { 'set-cookie': ck(req, 'paron_co', c.id, 400 * 86400) });
    }
    if (p === '/co/api/current') { const c = byId(cookie(req, 'paron_co')) || MAIN; return send(res, 200, { code: c.id, name: c.name || '', main: !!c.main, signup: CFG.signup }); }
    if (p.startsWith('/co/api/')) {
      if (req.method !== 'POST' || !sameOrigin(req)) return send(res, 403, { error: 'Μη επιτρεπτό αίτημα' });
      if (p === '/co/api/signup') return await signup(req, res);
      if (p === '/co/api/switch') {
        let b; try { b = JSON.parse((await readBody(req)) || '{}') || {}; } catch { b = {}; }
        const c = byId(String(b.code || '').trim().toLowerCase());
        if (!c) return send(res, 404, { error: 'Δεν υπάρχει εταιρεία με αυτόν τον κωδικό.' });
        return send(res, 200, { ok: true, code: c.id }, { 'set-cookie': ck(req, 'paron_co', c.id, 400 * 86400) });
      }
      return send(res, 404, { error: 'Δεν βρέθηκε' });
    }
    const c = byId(cookie(req, 'paron_co')) || MAIN;
    // εταιρεία χωρίς διαχειριστή: τον πρώτο λογαριασμό τον φτιάχνει μόνο ο browser που την έφτιαξε
    if (c.claim && p === '/api/setup' && cookie(req, 'paron_claim') !== c.claim) return send(res, 403, { error: 'Τον πρώτο λογαριασμό τον φτιάχνει όποιος έφτιαξε την εταιρεία.' });
    return await proxy(req, res, c);
  } catch (e) {
    console.error(stamp(), 'gateway', e.message);
    if (!res.headersSent) send(res, 500, { error: 'Σφάλμα του server' });
  }
}).listen(CFG.port, CFG.host, () => {
  console.log(stamp(), `PARON gateway στη θύρα ${CFG.port}: αρχική εταιρεία «${MAIN.id}» + ${COS.length} ακόμα`);
});
start(MAIN); for (const c of COS) start(c);
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => { STOP = true; for (const k of KIDS.values()) try { k.proc.kill('SIGTERM'); } catch {} setTimeout(() => process.exit(0), 1500).unref(); });
