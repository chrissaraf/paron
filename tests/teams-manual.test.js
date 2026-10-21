const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../src/core.js');
const C=globalThis.ErgoCore;

function fixture(){
  const state=C.blankState();
  Object.assign(state.settings,{scheduleMode:'auto',manualFrom:'',workdays:[0,1,2,3,4,5,6],fillIdle:false,off:['wx','rating']});
  state.specialties=[{id:'brick',name:'Χτίστες'},{id:'paint',name:'Ελαιοχρωματιστές'}];
  state.projects=[{id:'p1',name:'Έργο Α'},{id:'p2',name:'Έργο Β'}];
  const worker=(id,role='voith',specialtyId='brick')=>({id,name:id,specialtyId,role,wage:role==='voith'?70:100,off:[],rates:{}});
  state.workers=[worker('lead','texn'),worker('other'),worker('mate')];
  state.tasks=[{id:'task',projectId:'p1',title:'Τοιχοποιία',specialtyId:'brick',responsibleId:'lead',helpers:1,days:2,priority:2,status:'todo'}];
  state.teams=[{id:'crew',name:'Ομάδα Α',workerIds:['lead','mate']}];
  C.setState(state);return {state,worker};
}

test('new companies start with a programme entered by the office',()=>{
  assert.equal(C.blankState().settings.scheduleMode,'manual');
});

test('manual mode leaves workers unassigned until a placement is entered',()=>{
  const {state}=fixture();state.settings.scheduleMode='manual';
  const r=C.schedule();assert.equal(r.byDay[C.today()].jobs.length,0);assert.equal(r.asg.length,0);
});

test('a worker can be placed directly on a project without creating a task',()=>{
  const {state}=fixture();state.settings.scheduleMode='manual';state.tasks=[];
  assert.equal(C.setPlacement('lead',C.today(),{type:'project',projectId:'p2'}).err,undefined);
  const r=C.schedule(),a=r.asg.filter(a=>a.workerId==='lead'&&a.date===C.today());
  assert.equal(a.length,1);assert.equal(a[0].projectId,'p2');assert.equal(a[0].taskId,null);assert.equal(a[0].wage,100);
  assert.deepEqual(C.whatDoes(r,'lead',C.today()).projects,['p2']);
  assert.match(C.personDayText(r,state.workers[0],C.today()),/Έργο Β/);
});

test('manual placements override automatic tasks and group preference',()=>{
  const {state}=fixture();state.settings.fillIdle=true;state.settings.preferTeams=true;
  C.setPlacement('mate',C.today(),{type:'project',projectId:'p2'});
  const rows=C.schedule().asg.filter(a=>a.date===C.today()&&a.workerId==='mate');
  assert.equal(rows.length,1);assert.equal(rows[0].projectId,'p2');assert.equal(rows[0].wage,70);
});

test('manually placing a helper on a task does not silently pull in its responsible worker',()=>{
  const {state}=fixture();state.settings.scheduleMode='manual';
  C.setPlacement('mate',C.today(),{type:'task',taskId:'task'});
  const rows=C.schedule().asg.filter(a=>a.date===C.today());
  assert.deepEqual(rows.map(a=>a.workerId),['mate']);
});

test('automatic proposals prefer a qualified member of the responsible worker’s team',()=>{
  const {state}=fixture();state.settings.preferTeams=true;
  assert.equal(C.schedule().byDay[C.today()].jobs[0].helpers[0].id,'mate');
  state.settings.preferTeams=false;
  assert.equal(C.schedule().byDay[C.today()].jobs[0].helpers[0].id,'other');
});

test('team preference respects skills, leave and explicit placements elsewhere',()=>{
  const {state}=fixture();state.settings.preferTeams=true;
  state.workers.find(w=>w.id==='mate').off=[C.today()];
  assert.equal(C.schedule().byDay[C.today()].jobs[0].helpers[0].id,'other');
  state.workers.find(w=>w.id==='mate').off=[];state.workers.find(w=>w.id==='mate').specialtyId='paint';
  assert.equal(C.schedule().byDay[C.today()].jobs[0].helpers[0].id,'other');
});

test('assigning a team keeps absent members on leave and charges each available member once',()=>{
  const {state}=fixture();state.settings.scheduleMode='manual';state.workers.find(w=>w.id==='mate').off=[C.today()];
  const result=C.placeTeam('crew',C.today(),{projectId:'p2'});
  assert.equal(result.assigned,1);assert.equal(result.skipped,1);
  const rows=C.schedule().asg.filter(a=>a.date===C.today());
  assert.equal(rows.length,1);assert.equal(rows[0].workerId,'lead');assert.equal(rows[0].wage,100);
  assert.deepEqual(state.workers.find(w=>w.id==='mate').off,[C.today()]);
});

test('a worker belongs to one regular team and team edits preserve existing day placements',()=>{
  const {state}=fixture();C.setPlacement('lead',C.today(),{type:'project',projectId:'p2'});
  assert.ok(C.saveTeam({id:'another',name:'Ομάδα Β',workerIds:['mate']}).err);
  assert.equal(C.saveTeam({id:'crew',name:'Ομάδα Α νέα',workerIds:['lead','mate']}).err,undefined);
  assert.equal(state.overrides[C.today()+'|lead'].projectId,'p2');
});

test('invalid project and closed-day placements cannot modify the programme',()=>{
  const {state}=fixture();
  assert.ok(C.setPlacement('lead',C.today(),{type:'project',projectId:'missing'}).err);
  state.settings.closed=[C.today()];
  assert.ok(C.setPlacement('lead',C.today(),{type:'project',projectId:'p1'}).err);
  assert.deepEqual(state.overrides,{});
});

test('past direct project wages remain frozen when a future team or wage changes',()=>{
  const {state}=fixture(),d=C.add(C.today(),-1);state.settings.start=d;state.settings.scheduleMode='manual';
  C.setPlacement('lead',d,{type:'project',projectId:'p2'});
  C.freezePast(C.schedule());state.workers[0].wage=200;state.teams=[];
  const r=C.schedule();assert.equal(r.asg.find(a=>a.date===d&&a.workerId==='lead').wage,100);
  assert.deepEqual(C.whatDoes(r,'lead',d).projects,['p2']);
});

test('a manually entered project placement several weeks ahead is included',()=>{
  const {state}=fixture();state.settings.scheduleMode='manual';state.tasks=[];
  const d=C.add(C.today(),60);C.setPlacement('lead',d,{type:'project',projectId:'p2'});
  const r=C.schedule();assert.equal(r.asg.find(a=>a.date===d&&a.workerId==='lead')?.projectId,'p2');
  assert.equal(r.end,d,'whole-programme cost reports must include the last manually entered work day');
});

test('every manually entered team day counts even when it exceeds the task estimate',()=>{
  const {state}=fixture();state.settings.scheduleMode='manual';state.tasks[0].days=1;
  const dates=Array.from({length:7},(_,i)=>C.add(C.today(),i));
  for(const d of dates)assert.equal(C.placeTeam('crew',d,{projectId:'p1',taskId:'task'}).assigned,2);
  const r=C.schedule();
  for(const d of dates){
    const rows=r.asg.filter(a=>a.date===d);
    assert.equal(rows.length,2);assert.equal(rows.reduce((s,a)=>s+a.wage,0),170);
    assert.equal(r.byDay[d].jobs[0].dayNo,dates.indexOf(d)+1);
  }
  assert.equal(r.rem.task,0);assert.equal(r.finish.task,dates.at(-1));assert.equal(state.tasks[0].days,1);
});

test('removing a project preserves past wages and does not break worker schedules',()=>{
  const {state}=fixture(),d=C.add(C.today(),-1);state.settings.start=d;state.settings.scheduleMode='manual';
  C.setPlacement('lead',d,{type:'project',projectId:'p2'});C.freezePast(C.schedule());
  state.projects=state.projects.filter(p=>p.id!=='p2');
  const r=C.schedule(),w=state.workers[0];
  assert.equal(r.asg.find(a=>a.workerId===w.id&&a.date===d).wage,100);
  assert.match(C.personDayText(r,w,d),/Έργο που αφαιρέθηκε/);
  assert.equal(C.personWeek(r,w,C.weekStart(d)).days.find(x=>x.date===d).items[0].project,'Έργο που αφαιρέθηκε');
});

test('an accepted placement beyond the automatic scheduling horizon is included',()=>{
  const {state}=fixture();state.settings.scheduleMode='manual';state.tasks=[];
  const d=C.add(C.today(),600);
  assert.equal(C.setPlacement('lead',d,{type:'project',projectId:'p2'}).ok,true);
  assert.equal(C.schedule().asg.find(a=>a.date===d&&a.workerId==='lead')?.wage,100);
});

test('extra manual days never increase a partner’s agreed fixed fee',()=>{
  for(const frozen of [false,true]){
  const {state}=fixture(),d=C.add(C.today(),-1);state.settings.start=d;state.settings.scheduleMode='manual';
  const w=state.workers[0];w.role='ext';w.pay='job';state.tasks[0].days=1;state.tasks[0].price=1000;
  C.setPlacement(w.id,d,{type:'task',taskId:'task'});if(frozen)C.freezePast(C.schedule());
  C.setPlacement(w.id,C.today(),{type:'task',taskId:'task'});
  const rows=C.schedule().asg.filter(a=>a.workerId===w.id);
  assert.equal(rows.length,2);assert.equal(rows.reduce((s,a)=>s+a.wage,0),1000);
  assert.equal(rows.find(a=>a.date===d).wage,1000);
  }
});

test('an unrelated past placement edit never reprices a frozen fixed-fee partner row',()=>{
  const {state}=fixture(),d=C.add(C.today(),-1);state.settings.start=d;state.settings.scheduleMode='manual';
  const w=state.workers[0];w.role='ext';w.pay='job';state.tasks[0].days=1;state.tasks[0].price=1000;
  C.setPlacement(w.id,d,{type:'task',taskId:'task'});C.freezePast(C.schedule());
  state.tasks[0].price=500;assert.equal(C.schedule().asg.find(a=>a.workerId===w.id).wage,1000);
  C.setPlacement('other',d,{type:'none'});
  assert.equal(C.schedule().asg.find(a=>a.workerId===w.id).wage,1000);
});
