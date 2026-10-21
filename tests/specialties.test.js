const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../src/core.js');
const C=globalThis.ErgoCore;

function fixture(){
  const state=C.blankState();
  Object.assign(state.settings,{scheduleMode:'auto',workdays:[0,1,2,3,4,5,6],fillIdle:false,off:['wx','rating','avail']});
  state.specialties=[{id:'brick',name:'Χτίστες'},{id:'plaster',name:'Σοβατζήδες'},{id:'paint',name:'Ελαιοχρωματιστές'},{id:'gen',name:'Γενικοί εργάτες'}];
  state.projects=[{id:'p',name:'Ανακαίνιση'}];
  const worker=(id,skills,role='texn',wage=100)=>({id,name:id,specialtyId:skills[0],specialtyIds:skills,role,wage,off:[],rates:{}});
  const task=(id='t',extra={})=>({id,title:id,projectId:'p',specialtyId:'brick',responsibleId:'',helpers:0,days:1,priority:2,status:'todo',...extra});
  C.setState(state);
  return {state,worker,task};
}

test('a worker can lead a task using their third specialty even when availability is disabled',()=>{
  const {state,worker,task}=fixture();
  state.workers=[worker('multi',['brick','plaster','paint'])];
  state.tasks=[task('painting',{specialtyId:'paint'})];
  const result=C.schedule();
  assert.equal(result.byDay[C.today()].jobs[0]?.lead.id,'multi');
  assert.equal(result.asg.filter(a=>a.taskId==='painting').reduce((s,a)=>s+a.wage,0),100);
});

test('a worker with ten specialties can be matched through the tenth specialty',()=>{
  const {state,worker,task}=fixture();
  const skills=Array.from({length:10},(_,i)=>'skill'+(i+1));
  state.specialties=skills.map(id=>({id,name:id}));
  state.workers=[worker('versatile',skills)];
  state.tasks=[task('tenth-skill',{specialtyId:'skill10',specialtyIds:['skill10']})];
  const result=C.schedule();
  assert.equal(result.byDay[C.today()].jobs[0]?.lead.id,'versatile');
  assert.equal(result.asg.filter(a=>a.taskId==='tenth-skill').length,1);
  assert.equal(result.asg.filter(a=>a.taskId==='tenth-skill').reduce((sum,a)=>sum+a.wage,0),100);
});

test('legacy primary and second specialties remain usable without rewriting saved workers',()=>{
  const {state,task}=fixture();
  state.workers=[{id:'old',name:'Παλιός',specialtyId:'brick',spec2:'plaster',role:'texn',wage:80,off:[]}];
  state.tasks=[task('plastering',{specialtyId:'plaster'})];
  assert.equal(C.schedule().byDay[C.today()].jobs[0]?.lead.id,'old');
});

test('helpers are selected using all their specialties',()=>{
  const {state,worker,task}=fixture();
  state.workers=[worker('lead',['paint']),worker('helper',['brick','plaster','paint'],'voith',70)];
  state.tasks=[task('paint',{specialtyId:'paint',responsibleId:'lead',helpers:1})];
  assert.equal(C.schedule().byDay[C.today()].jobs[0]?.helpers[0]?.id,'helper');
});

test('a task can choose a lead from any of its selected specialties',()=>{
  const {state,worker,task}=fixture();
  state.workers=[worker('plaster-only',['plaster'])];
  state.tasks=[task('mixed',{specialtyIds:['brick','plaster']})];
  assert.equal(C.schedule().byDay[C.today()].jobs[0]?.lead.id,'plaster-only');
});

test('a multi-skilled worker is counted once in a task with several matching specialties',()=>{
  const {state,worker,task}=fixture();
  state.workers=[worker('multi',['brick','plaster'])];
  state.tasks=[task('mixed',{specialtyIds:['brick','plaster']})];
  const result=C.schedule();
  assert.equal(result.asg.filter(a=>a.taskId==='mixed'&&a.workerId==='multi').length,1);
  assert.equal(result.asg.filter(a=>a.taskId==='mixed').reduce((s,a)=>s+a.wage,0),100);
});

test('a specialist is not automatically assigned to two tasks on the same day',()=>{
  const {state,worker,task}=fixture();
  state.workers=[worker('plaster',['plaster'])];
  state.tasks=[task('priority',{specialtyId:'plaster',priority:1}),task('mixed',{specialtyIds:['brick','plaster']})];
  const result=C.schedule();
  assert.equal(result.begin.priority,C.today());
  assert.equal(result.begin.mixed,C.add(C.today(),1));
  assert.equal(result.asg.filter(a=>a.date===C.today()&&a.workerId==='plaster').length,1);
});

test('task helper selection considers additional task specialties',()=>{
  const {state,worker,task}=fixture();
  state.workers=[worker('lead',['brick']),worker('helper',['plaster'],'voith',70)];
  state.tasks=[task('mixed',{specialtyIds:['brick','plaster'],responsibleId:'lead',helpers:1})];
  assert.equal(C.schedule().byDay[C.today()].jobs[0].helpers[0]?.id,'helper');
});

test('an explicitly empty modern specialty list does not restore a removed legacy secondary specialty',()=>{
  const {state,worker,task}=fixture(),w=worker('changed',['brick']);w.spec2='plaster';
  state.workers=[w];state.tasks=[task('plastering',{specialtyId:'plaster'})];
  assert.equal(C.schedule().byDay[C.today()].jobs.length,0);
});

test('legacy tasks retain their lead plus helper crew size and wages',()=>{
  const {state,worker,task}=fixture();
  state.workers=[worker('lead',['brick']),worker('helper',['brick'],'voith',70)];
  state.tasks=[task('legacy',{responsibleId:'lead',helpers:1})];
  const result=C.schedule();
  assert.equal(result.byDay[C.today()].jobs[0].helpers.length,1);
  assert.equal(result.asg.filter(a=>a.taskId==='legacy').reduce((s,a)=>s+a.wage,0),170);
});
