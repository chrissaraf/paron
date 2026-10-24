const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');

// Real gateway on a temporary data folder: the existing company keeps working without a cookie,
// a new company signs up at /co, only its creator makes the first admin, and data stays separate.
const root=path.join(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'paron-gw-')),port=20000+Math.floor(Math.random()*2000);
const base=`http://127.0.0.1:${port}`;let gw;
function jar(){
  const c={};
  return {
    get header(){return Object.entries(c).map(([k,v])=>k+'='+v).join('; ')},
    take(r){for(const sc of r.headers.getSetCookie()){const [kv]=sc.split(';'),i=kv.indexOf('=');const k=kv.slice(0,i),v=kv.slice(i+1);if(/Max-Age=0/.test(sc))delete c[k];else c[k]=v}},
    has:k=>k in c,
  };
}
async function call(j,method,p,body){
  const r=await fetch(base+p,{method,headers:{'content-type':'application/json',cookie:j.header},body:body&&JSON.stringify(body),redirect:'manual'});
  j.take(r);
  const t=await r.text();let b;try{b=JSON.parse(t)}catch{b=t}
  return {status:r.status,body:b};
}
before(async()=>{
  gw=spawn(process.execPath,['server/gateway.js'],{cwd:root,stdio:'ignore',env:{...process.env,DATA_DIR:dir,PORT:String(port),PARON_BASE_PORT:String(port+1),HOST:'127.0.0.1',ERGO_PASSWORD:'kodikos123',PARON_INDUSTRY:'build',PARON_MAIN_CODE:'arxiki'}});
  for(let i=0;i<150;i++){try{const r=await fetch(base+'/api/health');if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,100))}
  throw new Error('gateway did not start');
});
after(()=>{gw.kill();fs.rmSync(dir,{recursive:true,force:true})});

test('without a company cookie everything goes to the existing company, as before',async()=>{
  const j=jar();
  const login=await call(j,'POST','/api/login',{username:'ergolavos',password:'kodikos123'});
  assert.equal(login.status,200);assert.equal(login.body.industry,'build');
  assert.ok(fs.existsSync(path.join(dir,'users.json')));
  const cur=await call(j,'GET','/co/api/current');
  assert.deepEqual(cur.body,{code:'arxiki',name:'',main:true,signup:true});
  assert.match((await call(j,'GET','/co')).body,/Νέα εταιρεία/);
});

test('a new company signs up, its creator makes the first admin and picks the industry',async()=>{
  const j=jar();
  assert.equal((await call(j,'POST','/co/api/signup',{name:'Cartel',code:'arxiki'})).status,400);
  assert.equal((await call(j,'POST','/co/api/signup',{name:'Cartel',code:'Κ'})).status,400);
  const s=await call(j,'POST','/co/api/signup',{name:'Cartel Bar',code:'cartel'});
  assert.equal(s.status,200);assert.ok(j.has('paron_co'));assert.ok(j.has('paron_claim'));
  assert.equal((await call(j,'POST','/co/api/signup',{name:'Άλλη',code:'cartel'})).status,400);
  assert.equal((await call(j,'GET','/co/api/current')).body.name,'Cartel Bar');
  // ξένος browser που ξέρει τον κωδικό δεν μπορεί να πάρει την εταιρεία
  const x=jar();assert.equal((await call(x,'POST','/co/api/switch',{code:'cartel'})).status,200);
  assert.equal((await call(x,'POST','/api/setup',{name:'Ξένος',username:'xenos',password:'kodikos999'})).status,403);
  const me=await call(j,'GET','/api/me');assert.equal(me.status,401);assert.equal(me.body.setup,true);
  const setup=await call(j,'POST','/api/setup',{name:'Ιδιοκτήτης',username:'owner',password:'kodikos456'});
  assert.equal(setup.status,200);assert.equal(setup.body.industry,null);assert.ok(!j.has('paron_claim'));
  assert.equal((await call(j,'POST','/api/industry',{industry:'food'})).status,200);
  assert.ok(fs.existsSync(path.join(dir,'companies','cartel','users.json')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'companies.json'),'utf8')).list[0].claim,undefined);
  // οι εταιρείες δεν βλέπουν η μία την άλλη
  assert.equal((await call(j,'POST','/api/login',{username:'ergolavos',password:'kodikos123'})).status,401);
  const m=jar();assert.equal((await call(m,'POST','/api/login',{username:'owner',password:'kodikos456'})).status,401);
  assert.equal((await call(m,'GET','/co/cartel')).status,200);assert.equal(m.has('paron_co'),true);
  assert.equal((await call(m,'POST','/api/login',{username:'owner',password:'kodikos456'})).status,200);
  assert.equal((await call(m,'GET','/co/nope')).status,404);
});

test('requests from other sites cannot sign up or switch the company',async()=>{
  const r=await fetch(base+'/co/api/signup',{method:'POST',headers:{'content-type':'application/json',origin:'https://evil.example'},body:'{"name":"x","code":"evil1"}'});
  assert.equal(r.status,403);
  const r2=await fetch(base+'/co/api/switch',{method:'POST',headers:{'content-type':'text/plain'},body:'{"code":"cartel"}'});
  assert.equal(r2.status,403);
});
