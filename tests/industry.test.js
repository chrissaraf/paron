const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');

// Real server on a temporary data folder: the first admin picks the industry once, then the restaurant app keeps its data on the server.
const root=path.join(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'paron-ind-')),port=18000+Math.floor(Math.random()*2000);
const base=`http://127.0.0.1:${port}/`;let srv,cookie='';
async function api(method,p,body,ck=cookie){
  const r=await fetch(base+'api/'+p,{method,headers:{'content-type':'application/json',cookie:ck},body:body&&JSON.stringify(body)});
  const sc=r.headers.get('set-cookie');if(sc)cookie=sc.split(';')[0];
  return {status:r.status,body:await r.json().catch(()=>null)};
}
before(async()=>{
  srv=spawn(process.execPath,['server/server.js'],{cwd:root,stdio:'ignore',env:{...process.env,DATA_DIR:dir,PORT:String(port),HOST:'127.0.0.1',ERGO_PASSWORD:'kodikos123',PARON_INDUSTRY:''}});
  for(let i=0;i<100;i++){try{await fetch(base);return}catch{await new Promise(r=>setTimeout(r,100))}}
  throw new Error('server did not start');
});
after(()=>{srv.kill();fs.rmSync(dir,{recursive:true,force:true})});

test('the first admin chooses the industry once and the choice cannot change',async()=>{
  const login=await api('POST','login',{username:'ergolavos',password:'kodikos123'});
  assert.equal(login.status,200);assert.equal(login.body.industry,null);
  assert.equal((await api('POST','industry',{industry:'shop'})).status,400);
  assert.equal((await api('GET','estiasi/state')).status,404);
  const set=await api('POST','industry',{industry:'food'});
  assert.equal(set.status,200);assert.equal(set.body.industry,'food');
  assert.equal((await api('GET','me')).body.industry,'food');
  assert.equal((await api('POST','industry',{industry:'build'})).status,409);
  const page=await (await fetch(base,{headers:{cookie}})).text();
  assert.match(page,/window\.ERGO_SERVER=true/);assert.match(page,/paron\.estiasi\.v1/);
});

test('restaurant data is stored on the server, validated and kept from strangers and workers',async()=>{
  assert.deepEqual((await api('GET','estiasi/state')).body,{});
  assert.equal((await api('PUT','estiasi/state',{v:8,staff:[],roles:[],shifts:[]})).status,400);
  const S={v:9,staff:[{id:'p1',name:'Δοκιμή'}],roles:[{id:'serv',name:'Σερβιτόροι'}],shifts:[],sched:{}};
  assert.equal((await api('PUT','estiasi/state',S)).status,200);
  assert.deepEqual((await api('GET','estiasi/state')).body,S);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'estiasi.json'),'utf8')),S);
  assert.equal((await api('GET','estiasi/state',null,'')).status,401);
  assert.equal((await api('POST','users',{name:'Εργαζόμενος',username:'ergatis',password:'kodikos456',role:'worker',workerId:'p1'})).status,200);
  const admin=cookie;await api('POST','login',{username:'ergatis',password:'kodikos456'});
  assert.equal((await api('GET','estiasi/state')).status,403);
  assert.equal((await api('PUT','estiasi/state',S)).status,403);
  cookie=admin;
});
