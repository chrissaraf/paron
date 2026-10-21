const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createPresentationSession,seedPresentation}=require('../tools/presentation/session');
const vm=require('node:vm');
const {presentationHtml}=require('../tools/presentation/presentation');
const {fullPage}=require('../build');

test('the presentation starts with a partial payment and a settled worker',()=>{
  const session=createPresentationSession(),state=session.request('GET','/api/state').body;
  assert.equal(state.projects.length,3);
  assert.ok(Object.values(state.payments).some(r=>r.pays.reduce((s,p)=>s+p.amount,0)>0&&r.pays.reduce((s,p)=>s+p.amount,0)<r.earned));
  assert.ok(Object.values(state.payments).some(r=>r.earned>0&&r.pays.reduce((s,p)=>s+p.amount,0)===r.earned));
  assert.equal(state.settings.autoSend,false);
});

test('the presentation enables clients, appointments, reminders and the project diary',()=>{
  const state=seedPresentation();
  for(const feature of ['clients','appts','duties','diary']){
    assert.ok(!state.settings.off.includes(feature),feature+' is available');
    assert.ok(state[feature].length>0,feature+' includes presentation examples');
  }
  assert.ok(state.appts.every(a=>!a.phone));
});

test('restarting the presentation discards only its own edited sample state',()=>{
  const session=createPresentationSession(),original=session.request('GET','/api/state').body;
  const changed=structuredClone(original);changed.projects[0].name='Δοκιμή παρουσίασης';
  assert.equal(session.request('PUT','/api/state',changed).status,200);
  assert.equal(session.request('GET','/api/state').body.projects[0].name,'Δοκιμή παρουσίασης');
  session.request('POST','/api/demo/reset');
  assert.equal(session.request('GET','/api/state').body.projects[0].name,original.projects[0].name);
});

test('demo APIs refuse real sends and account creation',()=>{
  const session=createPresentationSession();
  for(const route of ['/api/viber/send','/api/push/test','/api/setup','/api/users'])
    assert.equal(session.request('POST',route,{}).status,403);
  assert.equal(session.request('GET','/api/me').body.user.role,'admin');
});

test('invalid state cannot erase the running presentation',()=>{
  const session=createPresentationSession(),original=session.request('GET','/api/state').body;
  assert.equal(session.request('PUT','/api/state',{v:2,projects:[]}).status,400);
  assert.deepEqual(session.request('GET','/api/state').body,original);
  assert.equal(seedPresentation().settings.company.name,'ΔΟΜΗ Κατασκευαστική');
});

test('the offline file serves its own demo API under a file URL without touching production storage',async()=>{
  const html=presentationHtml(fullPage,{offline:true}),script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1],removed=[];
  const context={URL,Response,location:{href:'file:///local/paron-demo.html'},localStorage:{removeItem:key=>removed.push(key)}};
  context.window=context;vm.runInNewContext(script,context);
  assert.equal((await (await context.fetch('api/me')).json()).user.username,'demo');
  assert.equal((await (await context.fetch('api/state')).json()).settings.company.name,'ΔΟΜΗ Κατασκευαστική');
  assert.equal((await context.fetch('https://example.invalid/send',{method:'POST',body:'{}'})).status,403);
  assert.ok(removed.every(key=>key.startsWith('paron.presentation.v1.')));
});
