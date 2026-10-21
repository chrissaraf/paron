const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

// Run the real browser views with in-memory DOM/storage boundaries, without login or network.
function app({demo=false}={}){
  const root=path.join(__dirname,'..'),listeners={},nodes=new Map();
  const document={body:{classList:{remove(){},toggle(){}}},addEventListener:(k,f)=>listeners[k]=f,getElementById:id=>{
    if(!nodes.has(id))nodes.set(id,{innerHTML:'',dataset:{},hidden:false,focus(){},setAttribute(k,v){this[k]=v}});return nodes.get(id);
  },querySelector:selector=>['.side-top .logo','.mlogo'].includes(selector)?{outerHTML:''}:null,querySelectorAll:()=>[]};
  const context=vm.createContext({document,localStorage:{getItem:()=>null,setItem(){}},
    sessionStorage:{getItem:()=>null},location:{hash:''},setInterval(){},setTimeout(){},
    clearTimeout(){},console,Date,Intl,URL,TextEncoder,Uint8Array,Map,Set});
  context.window=context;context.ERGO_DEMO=demo;context.addEventListener=()=>{};
  for(const file of ['i18n.js','core.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),context);
  const html=fs.readFileSync(path.join(root,'src/app.html'),'utf8');
  const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
  vm.runInContext(script.replace(/boot\(\);\s*\}\)\(\);\s*$/, 
    'globalThis.views={setS,UI,AUTH,vToday,vProjects,vWeek,vProject,vDiary,dNote,vTasks,renderNav,sectionNav,workerForm,taskForm,readTaskForm,leadOpts,weekSheets,assignForm,payData,payDayOf};})();'),context);
  const C=context.ErgoCore,V=context.views,state=C.demo();
  state.setup=true;V.setS(state);V.AUTH.user={id:'preview',name:'Δοκιμή',role:'admin'};
  return {C,V,state,nodes,listeners};
}

test('weekly exports include direct project placements in both worker and project sheets',()=>{
  const {C,V,state}=app(),d=C.today(),w=state.workers.find(w=>!C.isOffice(w)&&!C.isExt(w)),p=state.projects[0];
  state.settings.scheduleMode='manual';state.settings.manualFrom='';state.tasks=[];w.off=[];
  assert.equal(C.setPlacement(w.id,d,{type:'project',projectId:p.id}).ok,true);
  const sheets=V.weekSheets(C.schedule(),C.weekStart(d)).sheets;
  const worker=sheets[0].rows.find(r=>r[0]===w.name),project=sheets[1].rows.find(r=>r[0]===p.name);
  assert.ok(worker.some(x=>typeof x==='string'&&x.includes(p.name)));
  assert.ok(project.some(x=>typeof x==='string'&&x.includes(C.short(w.name))));
});

test('changing weeks keeps the selected mobile day inside the displayed week',()=>{
  const {C,V}=app();V.UI.week='2026-10-19';V.UI.weekDay='2026-10-12';
  const html=V.vWeek(C.schedule());
  assert.ok(V.UI.weekDay>='2026-10-19'&&V.UI.weekDay<='2026-10-25');
  assert.match(html,/class="daystrip"/);
  assert.match(html,/data-act="scheduleday"/);
});

test('a closed workday stays visible as a holiday column in the merged weekly table',()=>{
  const {C,V,state}=app(),d=C.nextWork(C.add(C.today(),1));
  state.settings.closed=[d];V.UI.week=C.viewStart(d);V.UI.weekDay=d;
  const html=V.vWeek(C.schedule());
  assert.match(html,/holname/);assert.match(html,/Κλειστά/);assert.ok(html.includes(C.fmt(d)));
});

test('a project schedule shows only that project and its own assignments',()=>{
  const {C,V,state}=app();V.UI.proj=state.projects[0].id;V.UI.projectView='schedule';
  const html=V.vProject(C.schedule());
  assert.match(html,/class="daystrip"/);
  assert.ok(html.includes(state.projects[0].name));
  assert.ok(!html.includes(state.projects[1].name));
});

test('an empty company can open the mobile programme and create its first assignment',()=>{
  const {C,V}=app();V.setS(C.blankState());
  const html=V.vWeek(C.schedule());
  assert.match(html,/data-act="quickassign"/);
  assert.match(html,/class="daystrip"/);
  assert.match(html,/Δεν υπάρχουν έργα/);
});

test('worker navigation never exposes office pages or payments',()=>{
  const {V,nodes}=app();V.AUTH.user={role:'worker',name:'Εργαζόμενος'};V.UI.tab='mine';V.renderNav();
  const html=nodes.get('tabbar').innerHTML;
  assert.match(html,/data-tab="mine"/);
  assert.doesNotMatch(html,/data-tab="(?:pay|projects|workers)"/);
  assert.doesNotMatch(nodes.get('nav').innerHTML,/data-tab="(?:clients|appts|duties|diary)"/);
  assert.equal(V.sectionNav(),'');
});

test('office organisation pages open through their menu area and directly from today',()=>{
  const {C,V,nodes}=app();V.renderNav();
  const today=V.vToday(C.schedule());
  for(const route of ['clients','appts','duties','diary']){
    V.UI.tab=route;V.renderNav();
    assert.ok(nodes.get('nav').innerHTML.includes('data-tab="'+route+'" aria-current="page"'),route+' is selected in its menu area');
    assert.ok(today.includes('data-tab="'+route+'"'),route+' is directly accessible from today');
  }
});

test('the mobile menu button reports whether its navigation is open or closed',()=>{
  const {nodes,listeners}=app();
  for(const [act,expanded] of [['navopen','true'],['navclose','false']]){
    const el={dataset:{act}};
    listeners.click({target:{closest:selector=>selector==='[data-act]'?el:null}});
    assert.equal(nodes.get('mnav')['aria-expanded'],expanded);
  }
});

test('a client detail keeps clients selected and offers the other organisation pages',()=>{
  const {V,nodes}=app();V.UI.tab='client';V.renderNav();
  assert.match(nodes.get('nav').innerHTML,/data-tab="clients" aria-current="page"/);
  const local=V.sectionNav();
  assert.match(local,/data-tab="clients" aria-current="page"/);
  for(const route of ['appts','duties','diary'])assert.ok(local.includes('data-tab="'+route+'"'));
});

test('disabled organisation features stay hidden in every navigation entry point',()=>{
  const {C,V,state,nodes}=app();state.settings.off=['clients','diary'];V.UI.tab='appts';V.renderNav();
  const html=nodes.get('nav').innerHTML+V.vToday(C.schedule())+V.sectionNav();
  assert.doesNotMatch(html,/data-tab="(?:clients|diary)"/);
  assert.match(html,/data-tab="appts"/);
  assert.match(html,/data-tab="duties"/);
});

test('the presentation diary offers notes and sample images while photo upload remains available in the real app',()=>{
  for(const demo of [false,true]){
    const {C,V,state,nodes}=app({demo}),html=V.vDiary(C.schedule());
    assert.equal(html.includes('type="file"'),!demo);
    assert.match(html,/<img /);
    V.dNote(state.projects[0].id,C.today());
    assert.equal(nodes.get('modal').innerHTML.includes('id="dn_ph"'),!demo);
    assert.match(nodes.get('modal').innerHTML,/id="dn_text"/);
  }
});

test('a closed-day assignment stays in the date picker and explains why it cannot be scheduled',()=>{
  const {C,V,nodes,listeners}=app();
  nodes.set('qa_worker',{value:'w1'});nodes.set('qa_day',{value:'2026-10-25'});
  nodes.set('modal',{innerHTML:'date-picker'});
  const el={dataset:{act:'chooseassign'}};
  listeners.click({target:{closest:selector=>selector==='[data-act]'?el:null}});
  assert.equal(nodes.get('modal').innerHTML,'date-picker');
  assert.match(nodes.get('toast').textContent,/εργάσιμη/);
  assert.equal(C.schedule().asg.filter(a=>a.date==='2026-10-25').length,0);
});

test('today lets the contractor tap a crew member to edit that day directly',()=>{
  const {C,V}=app();const html=V.vToday(C.schedule());
  assert.match(html,new RegExp('data-act="assign" data-w="w1" data-d="'+V.UI.day+'"'));
});

test('project overview includes materials in cost even when there are no labour assignments',()=>{
  const {C,V}=app(),state=C.blankState();
  state.projects=[{id:'site',name:'Ανακαίνιση',location:'',color:'p1',budget:1000,contract:5000,costs:[{id:'material',kind:'mat',amount:3210,date:C.today(),desc:'Πλακάκια'}]}];
  V.setS(state);V.UI.proj='site';const schedule=C.schedule();
  assert.ok(V.vProjects(schedule).includes(C.eur(3210)));
  assert.ok(V.vProject(schedule).includes(C.eur(3210)));
});

test('editing a worker preserves every selected specialty including legacy secondary skills',()=>{
  const {V,state,nodes}=app(),w=state.workers[0];
  w.specialtyIds=[w.specialtyId,'s2','s3'];V.workerForm(w);
  const html=nodes.get('modal').innerHTML;
  assert.match(html,/data-worker-spec="s2" checked/);
  assert.match(html,/data-worker-spec="s3" checked/);
  delete w.specialtyIds;w.spec2='s2';V.workerForm(w);
  assert.match(nodes.get('modal').innerHTML,/data-worker-spec="s2" checked/);
});

test('the worker form displays ten specialties without dropping any selections',()=>{
  const {V,state,nodes}=app(),w=state.workers[0];
  state.specialties=Array.from({length:10},(_,i)=>({id:'trade'+(i+1),name:'Ειδικότητα '+(i+1)}));
  w.specialtyId='trade1';w.specialtyIds=state.specialties.map(s=>s.id);
  V.workerForm(w);
  const selected=[...nodes.get('modal').innerHTML.matchAll(/data-worker-spec="([^"]+)" checked/g)].map(m=>m[1]);
  assert.deepEqual(selected,['trade2','trade3','trade4','trade5','trade6','trade7','trade8','trade9','trade10']);
});

test('task responsible choices include workers with a matching additional specialty',()=>{
  const {V,state}=app();state.workers=[{id:'multi',name:'Πολυτεχνίτης',specialtyId:'s1',specialtyIds:['s1','s2','s3'],role:'texn'}];
  assert.equal(V.leadOpts('s3')[0]?.[0],'multi');
});

test('reading a task preserves all selected specialties and its helper count',()=>{
  const {V,nodes}=app();
  for(const [id,value] of Object.entries({f_project:'p1',f_title:'Τοιχοποιία και σοβάτισμα',f_spec:'s1',f_resp:'w1',f_help:'1',f_days:'3',f_prio:'2',f_after:'',f_earliest:'',f_price:'0'}))nodes.set(id,{value});
  nodes.set('tf',{dataset:{id:'mixed',new:'1'},querySelectorAll:()=>[
    {dataset:{taskSpec:'s1'}},{dataset:{taskSpec:'s2'}}
  ]});
  nodes.set('f_dry',{checked:false});nodes.set('f_diff',null);nodes.set('f_mat',null);
  const task=V.readTaskForm();
  assert.ok(Array.isArray(task.specialtyIds));
  assert.deepEqual(Array.from(task.specialtyIds),['s1','s2']);
  assert.equal(task.helpers,1);
});

test('saving a worker updates all specialties without restoring a removed old secondary skill',()=>{
  const {C,V,state,nodes,listeners}=app(),w=state.workers[0];w.spec2='s2';state.settings.off=['history'];
  const values={h_name:w.name,h_spec:'s1',h_role:'texn',h_wage:'95',h_phone:'',h_off:''};
  for(const [id,value] of Object.entries(values))nodes.set(id,{value});
  for(const id of ['h_amka','h_rate','h_lang','h_days'])nodes.set(id,null);
  nodes.set('wf',{dataset:{id:w.id,new:'0'},querySelector:()=>null,querySelectorAll:()=>[{dataset:{workerSpec:'s3'}},{dataset:{workerSpec:'s4'}}]});
  const el={dataset:{act:'saveworker'}};listeners.click({target:{closest:s=>s==='[data-act]'?el:null}});
  assert.deepEqual(Array.from(w.specialtyIds),['s1','s3','s4']);
  assert.equal(C.canSpec(w,'s2'),false);
  assert.equal(C.canSpec(w,'s4'),true);
});

test('temporarily selecting an office specialty does not erase unsaved site skills',()=>{
  const {V,state,nodes,listeners}=app(),w=state.workers[0];w.specialtyIds=['s1','s2','s3'];V.workerForm(w);
  const box={html:nodes.get('modal').innerHTML,
    get dataset(){const attr=k=>(this.html.match(new RegExp('data-'+k+'="([^"]*)"'))||[])[1]||'';return {primary:attr('primary'),skills:attr('skills').replace(/&quot;/g,'"')}},
    querySelectorAll(){return [...this.html.matchAll(/data-worker-spec="([^"]+)" checked/g)].map(m=>({dataset:{workerSpec:m[1]}}))},
    set outerHTML(html){this.html=html}
  };
  nodes.set('workerSkills',box);
  for(const value of ['o1','s1'])listeners.change({target:{id:'h_spec',value,dataset:{},closest:()=>null}});
  assert.match(box.html,/data-worker-spec="s2" checked/);
  assert.match(box.html,/data-worker-spec="s3" checked/);
});

test('task specialty filtering finds tasks through their additional specialties',()=>{
  const {C,V,state}=app();state.tasks=[{...state.tasks[0],title:'Εργασία με πολλές ειδικότητες',specialtyIds:['s1','s2']}];V.UI.fSpec='s2';
  assert.ok(V.vTasks(C.schedule()).includes('Εργασία με πολλές ειδικότητες'));
});

test('office users can reach regular teams from the people section',()=>{
  const {V}=app();V.UI.tab='workers';assert.match(V.sectionNav(),/data-tab="teams"/);
});

test('manual today offers a project picker for every site worker',()=>{
  const {C,V,state}=app();state.settings.scheduleMode='manual';
  const html=V.vToday(C.schedule());
  assert.match(html,/data-placement="w1"/);
  assert.match(html,/Πού δουλεύει ο καθένας/);
});

test('direct project assignments appear on today and the mobile programme',()=>{
  const {C,V,state}=app();state.settings.scheduleMode='manual';
  C.setPlacement('w1',C.today(),{type:'project',projectId:'p1'});
  const r=C.schedule();assert.match(V.vToday(r),/Ανάθεση στο έργο/);
  assert.match(V.vWeek(r),/Ανάθεση στο έργο/);
});

test('the team assignment form applies its optional task through the rest of the working week',()=>{
  for(const startDay of [6,1]){
  const {C,state,nodes,listeners}=app(),t=state.tasks[0];state.settings.weekFrom=startDay;
  const d=C.nextWork(C.viewStart(C.add(C.today(),7)));
  state.settings.scheduleMode='manual';state.settings.off=['history','wx','rating'];state.teams=[{id:'crew',name:'Ομάδα',workerIds:['w1','w3']}];
  t.days=1;state.workers.filter(w=>['w1','w3'].includes(w.id)).forEach(w=>{w.off=[];w.days=null});
  for(const [id,value] of Object.entries({ta_team:'crew',ta_day:d,ta_project:t.projectId,ta_task:t.id}))nodes.set(id,{value});
  nodes.set('ta_week',{checked:true});
  const el={dataset:{act:'saveteamassign'}};listeners.click({target:{closest:s=>s==='[data-act]'?el:null}});
  const dates=C.weekDays(C.viewStart(d)).filter(x=>x>=d),r=C.schedule();
  assert.ok(dates.length>1);
  for(const date of dates)for(const id of ['w1','w3'])assert.equal(r.asg.filter(a=>a.date===date&&a.workerId===id&&a.taskId===t.id).length,1);
  assert.ok(!r.asg.some(a=>a.workerId==='w1'&&a.date>C.add(C.viewStart(d),6)));
  }
});

test('a project picker moves only the selected worker and preserves regular team membership',()=>{
  const {C,state,listeners}=app(),d=C.today();state.settings.scheduleMode='manual';state.settings.off=['history'];
  state.teams=[{id:'crew',name:'Ομάδα',workerIds:['w1','w3']}];state.workers.filter(w=>['w1','w3'].includes(w.id)).forEach(w=>w.off=[]);
  C.placeTeam('crew',d,{projectId:'p1'});
  listeners.change({target:{dataset:{placement:'w1',d},value:'p:p2'}});
  assert.equal(state.overrides[d+'|w1'].projectId,'p2');assert.equal(state.overrides[d+'|w3'].projectId,'p1');
  assert.deepEqual(state.teams[0].workerIds,['w1','w3']);
});

test('manual wages follow the shared Saturday-to-Friday payment week after merging upstream',()=>{
  const {C,V,state}=app(),w=state.workers[0];state.workers=[w];state.tasks=[];
  Object.assign(state.settings,{scheduleMode:'manual',weekFrom:6,payDay:6});w.off=[];w.days=null;
  const saturday=C.viewStart(C.add(C.today(),7)),friday=C.add(saturday,-1);
  C.setPlacement(w.id,friday,{type:'project',projectId:'p1'});
  C.setPlacement(w.id,saturday,{type:'project',projectId:'p1'});
  const r=C.schedule();
  assert.equal(V.payData(r,C.viewStart(friday))[0].amount,C.rate(w,'p1'));
  assert.equal(V.payData(r,saturday)[0].amount,C.rate(w,'p1'));
  assert.equal(V.payDayOf(saturday),C.add(saturday,7));
});

test('office assignment choices contain leave instead of an ineffective site assignment',()=>{
  const {C,V,state,nodes}=app(),w=state.workers.find(C.isOffice);V.assignForm(w.id,C.today());
  assert.doesNotMatch(nodes.get('modal').innerHTML,/value="none"/);
  assert.match(nodes.get('modal').innerHTML,/value="off"/);
});

test('saving a task requires a specialty and can pick a responsible through an extra worker skill',()=>{
  const {state,nodes,listeners}=app();state.settings.off=['history','wx'];state.tasks=[];
  state.workers=[{id:'multi',name:'Τεχνίτης',specialtyId:'s1',specialtyIds:['s1','s2'],role:'texn',wage:90,off:[]}];
  for(const [id,value] of Object.entries({f_project:'p1',f_title:'Σοβάτισμα',f_resp:'',f_help:'0',f_days:'2',f_prio:'2',f_after:'',f_earliest:'',f_price:'0'}))nodes.set(id,{value});
  let selected=[];
  nodes.set('tf',{dataset:{id:'new-task',new:'1'},querySelectorAll:()=>selected.map(taskSpec=>({dataset:{taskSpec}}))});
  nodes.set('f_dry',{checked:false});nodes.set('f_diff',null);nodes.set('f_mat',null);
  const el={dataset:{act:'savetask'}},event={target:{closest:s=>s==='[data-act]'?el:null}};
  listeners.click(event);
  assert.equal(state.tasks.length,0);
  assert.match(nodes.get('toast').textContent,/ειδικότητα/);
  selected=['s2'];listeners.click(event);
  assert.equal(state.tasks.length,1);
  assert.equal(state.tasks[0].responsibleId,'multi');
  assert.deepEqual(Array.from(state.tasks[0].specialtyIds),['s2']);
});
