// Ειδοποιήσεις στο κινητό (Web Push: RFC 8030, 8291, 8292) χωρίς βιβλιοθήκες.
// Το μήνυμα κρυπτογραφείται για τη συγκεκριμένη συσκευή (aes128gcm) και ο server υπογράφει με τα δικά του κλειδιά VAPID,
// οπότε η υπηρεσία του browser (Google, Apple, Mozilla) το παραδίδει χωρίς να μπορεί να το διαβάσει.
'use strict';
const crypto = require('crypto'), https = require('https'), http = require('http');
const b64u = b => Buffer.from(b).toString('base64url'), ub64 = s => Buffer.from(String(s || ''), 'base64url');
// ζεύγος κλειδιών του server, μία φορά (φυλάγεται στον φάκελο δεδομένων)
function vapidKeys() { const e = crypto.createECDH('prime256v1'); e.generateKeys(); return { pub: b64u(e.getPublicKey()), priv: b64u(e.getPrivateKey()) }; }
// RFC 8291: ένα κομμάτι (record) με το μήνυμα και το 0x02 στο τέλος. opt.asPriv και opt.salt μόνο για δοκιμές με γνωστά δεδομένα.
function encrypt(payload, sub, opt = {}) {
  const ua = ub64(sub.keys && sub.keys.p256dh), auth = ub64(sub.keys && sub.keys.auth);
  if (ua.length !== 65 || auth.length < 16) throw new Error('bad keys');
  const e = crypto.createECDH('prime256v1');
  if (opt.asPriv) e.setPrivateKey(ub64(opt.asPriv)); else e.generateKeys();
  const asPub = e.getPublicKey(), secret = e.computeSecret(ua);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', secret, auth, Buffer.concat([Buffer.from('WebPush: info\0'), ua, asPub]), 32));
  const salt = opt.salt ? ub64(opt.salt) : crypto.randomBytes(16);
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const head = Buffer.alloc(21); salt.copy(head, 0); head.writeUInt32BE(opt.rs || 4096, 16); head[20] = asPub.length;
  return Buffer.concat([head, asPub, body]);
}
// RFC 8292: JWT με ES256 για την υπηρεσία push του endpoint
function vapidAuth(endpoint, keys, subject) {
  const pub = ub64(keys.pub);
  const key = crypto.createPrivateKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', d: keys.priv, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) } });
  const data = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })) + '.' + b64u(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject }));
  return 'vapid t=' + data + '.' + b64u(crypto.sign('sha256', Buffer.from(data), { key, dsaEncoding: 'ieee-p1363' })) + ', k=' + keys.pub;
}
// μόνο https· http μόνο προς τον ίδιο υπολογιστή, για δοκιμές
function okEndpoint(ep) {
  try { const u = new URL(ep); return u.protocol === 'https:' || (u.protocol === 'http:' && process.env.ERGO_PUSH_TEST === '1' && ['127.0.0.1', 'localhost'].includes(u.hostname)); } catch { return false; }
}
// gone = η συσκευή δεν δέχεται πια (404/410), οπότε η εγγραφή σβήνεται
function send(sub, payload, keys, subject, ttl = 86400) {
  return new Promise(resolve => {
    if (!okEndpoint(sub.endpoint)) return resolve({ ok: false, gone: true, status: 0, error: 'Μη έγκυρη διεύθυνση συσκευής' });
    let body; try { body = encrypt(JSON.stringify(payload), sub); } catch { return resolve({ ok: false, gone: true, status: 0, error: 'Μη έγκυρα κλειδιά συσκευής' }); }
    const u = new URL(sub.endpoint), mod = u.protocol === 'http:' ? http : https;
    const req = mod.request(u, { method: 'POST', timeout: 15000, headers: { TTL: String(ttl), Urgency: 'normal', 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', 'Content-Length': body.length, Authorization: vapidAuth(sub.endpoint, keys, subject) } }, res => {
      res.resume(); res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, gone: res.statusCode === 404 || res.statusCode === 410 }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', e => resolve({ ok: false, status: 0, error: e.message }));
    req.end(body);
  });
}
module.exports = { vapidKeys, encrypt, vapidAuth, okEndpoint, send, b64u, ub64 };
