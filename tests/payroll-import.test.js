const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../src/core.js');
const C=globalThis.ErgoCore;
// Invented names and amounts only. Never commit a company workbook as a fixture.
function sheet(name,wages=[],overtime=[],period=''){
  const cells={A6:'ΕΡΓΑΖΟΜΕΝΟΙ',B6:'ΗΜΕΡ/ΘΙΟ',G6:'ΕΡΓΑΖΟΜΕΝΟΙ',H6:'ΩΡΕΣ',I6:'ΣΥΝΟΛΟ',G4:'ΥΠΕΡΩΡΙΕΣ: '+period};
  wages.forEach(([n,w],i)=>Object.assign(cells,{['A'+(i+7)]:n,['B'+(i+7)]:w}));
  overtime.forEach(([n,h,a],i)=>Object.assign(cells,{['G'+(i+7)]:n,['H'+(i+7)]:h,['I'+(i+7)]:a}));
  return {name,cells};
}
function scan(books){return C.payrollScan(books,{year:2026})}
function company(){const s=C.blankState();s.settings.off=['wx','rating'];C.setState(s);return s}

test('Greek sheet ranges include mixed Latin months, cross-month and cross-year overtime',()=>{
  assert.deepEqual(C.payrollPeriod('9 - 15 MAIOY',2026),{from:'2026-05-09',to:'2026-05-15'});
  assert.deepEqual(C.payrollPeriod('31 ΙΑΝΟΥΑΡΙΟΥ - 6 ΦΕΒΡΟΥΑΡΙΟΥ',2026),{from:'2026-01-31',to:'2026-02-06'});
  assert.deepEqual(C.payrollPeriod('19/12/25 - 8/1/26',2026),{from:'2025-12-19',to:'2026-01-08'});
  assert.deepEqual(C.payrollPeriod('9 - 22/1/26',2026),{from:'2026-01-09',to:'2026-01-22'});
  assert.equal(C.payrollPeriod('31 - 32 ΦΕΒΡΟΥΑΡΙΟΥ',2026),null);
});

test('all sheets are chronological and increases and decreases take effect on the first day',()=>{
  const s=company(),b=scan([sheet('17 - 23 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',75]]),sheet('3 - 9 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70]]),sheet('10 - 16 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',90]])]);
  const p=C.payrollPlan(b,[]);assert.deepEqual(p.errors,[]);C.applyPayroll(s,p);const w=s.workers[0];
  assert.equal(C.wageAt(w,'2026-01-09'),70);assert.equal(C.wageAt(w,'2026-01-10'),90);assert.equal(C.wageAt(w,'2026-01-16'),90);assert.equal(C.wageAt(w,'2026-01-17'),75);
});

test('Athens and province aliases add one employee, with the allowance added once by project',()=>{
  const s=company();s.projects=[{id:'local',name:'Αθήνα'},{id:'province',name:'Έργο',prov:true}];
  const b=scan([sheet('3 - 9 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α ΑΘΗΝΑ',70],['Δοκιμή Α\nΣΕΡΙΦΟΣ',90],['Δοκιμή Α ΜΟΝΕΜΒΑΣΙΑ',90]])]),p=C.payrollPlan(b,[]);
  assert.deepEqual(p.errors,[]);C.applyPayroll(s,p);assert.equal(s.workers.length,1);assert.equal(C.rate(s.workers[0],'local','2026-01-03'),70);assert.equal(C.rate(s.workers[0],'province','2026-01-03'),90);
  assert.equal(s.projects.length,2);
});

test('identifiers and descriptors stay distinct while payment annotations and wage suffixes are cleaned',()=>{
  assert.notEqual(C.payrollName('Δοκιμή1').key,C.payrollName('Δοκιμή2').key);
  assert.notEqual(C.payrollName('Δοκιμή ΟΔΗΓΟΣ').key,C.payrollName('Δοκιμή ΜΙΚΡΟΣ').key);
  assert.equal(C.payrollName('Δοκιμή Α ΣΕΡΙΦΟΣ / Μετρητά',90).name,'ΔΟΚΙΜΗ Α');
  assert.equal(C.payrollName('Δοκιμή Α + Τραπεζα 123,45',70).name,'ΔΟΚΙΜΗ Α');
  assert.equal(C.payrollName('Δοκιμή Α 70',70).name,'ΔΟΚΙΜΗ Α');
  assert.equal(C.payrollName('Δοκιμή Α(70)',70).name,'ΔΟΚΙΜΗ Α');
  assert.equal(C.payrollName('Δοκιμή Α ΤΡΑΠ',70).name,'ΔΟΚΙΜΗ Α');
});

test('totals, cumulative totals and unrelated sheets never become personnel',()=>{
  const b=scan([sheet('3 - 9 ΙΑΝΟΥΑΡΙΟΥ',[['ΣΥΝΟΛΑ',1000],['ΠΡΟΟΔΕΥΤΙΚΑ ΣΥΝΟΛΑ',5000],['Δοκιμή Α',70]],[['ΠΡΟΟΔΕΥΤΙΚΑ ΣΥΝΟΛΑ',null,5000]]),{name:'Σημειώσεις',cells:{A7:'Κείμενο',B7:40}}]);
  assert.equal(b.aliases.length,1);assert.equal(b.skipped.length,1);assert.deepEqual(C.payrollPlan(b,[]).errors,[]);
});

test('G H I use their own employee names and retain exact hours, totals and source periods',()=>{
  const s=company(),b=scan([sheet('3 - 9 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70],['Δοκιμή Β',80]],[['Δοκιμή Β',3.5,35],['Δοκιμή Α',2,17.5]],'19/12/25 - 8/1/26')]);
  C.applyPayroll(s,C.payrollPlan(b,[]));const a=s.workers.find(w=>w.name==='ΔΟΚΙΜΗ Α'),bWorker=s.workers.find(w=>w.name==='ΔΟΚΙΜΗ Β');
  assert.equal(a.overtimeImports[0].hours,2);assert.equal(a.overtimeImports[0].amount,17.5);assert.equal(bWorker.overtimeImports[0].hours,3.5);
  assert.equal(a.overtimeImports[0].from,'2025-12-19');assert.equal(a.overtimeImports[0].to,'2026-01-08');assert.equal(C.overtimeRateAt(a,'2026-01-03'),8.75);
  assert.deepEqual(s.payments,{}); // Source provides no payment confirmation; don't manufacture a debt or payment.
});

test('repeated periods and repeated uploads never duplicate staff or overtime totals',()=>{
  const s=company(),b=scan([sheet('3 - 9 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70]],[['Δοκιμή Α',2,20]],'3 - 9/1/26'),sheet('10 - 16 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70]],[['Δοκιμή Α',2,20]],'3 - 9/1/26')]);
  C.applyPayroll(s,C.payrollPlan(b,[]));const before=JSON.stringify(s.workers);const r=C.applyPayroll(s,C.payrollPlan(b,s.workers));
  assert.equal(s.workers.length,1);assert.equal(s.workers[0].overtimeImports.length,1);assert.equal(r.added,0);assert.equal(r.overtime,0);assert.equal(JSON.stringify(s.workers),before);
});

test('correcting a previously imported increase replaces it even when the new preview has no change that week',()=>{
  const s=company();C.applyPayroll(s,C.payrollPlan(scan([sheet('3 - 9 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70]]),sheet('10 - 16 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',90]]),sheet('17 - 23 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70]])]),[]));
  const corrected=scan([sheet('3 - 9 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70]]),sheet('10 - 16 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70]]),sheet('17 - 23 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70]])]);
  const p=C.payrollPlan(corrected,s.workers);assert.equal(p.groups[0].changes.length,1);C.applyPayroll(s,p);assert.equal(C.wageAt(s.workers[0],'2026-01-10'),70);
});

test('historical overtime rates apply only to their source period and cannot override future wage increases',()=>{
  const s=company(),b=scan([sheet('3 - 9 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70]],[['Δοκιμή Α',2,20]],'3 - 9/1/26'),sheet('10 - 16 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',90]])]);
  C.applyPayroll(s,C.payrollPlan(b,[]));const w=s.workers[0];assert.equal(C.overtimeRateAt(w,'2026-01-09'),10);assert.equal(C.overtimeRateAt(w,'2026-01-10'),11.25);
  C.setWage(w,100,'2026-10-01');assert.equal(C.overtimeRateAt(w,'2026-10-01'),12.5);
});

test('same-week base discrepancies and conflicting overtime require explicit resolution before any writes',()=>{
  const s=company(),b=scan([sheet('3 - 9 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70],['Δοκιμή Α ΣΕΡΙΦΟΣ',100]],[['Δοκιμή Α',2,20],['Δοκιμή Α ΣΕΡΙΦΟΣ',3,30]],'3 - 9/1/26')]);
  let p=C.payrollPlan(b,[]);assert.ok(p.errors.length>=2);assert.throws(()=>C.applyPayroll(s,p));assert.equal(s.workers.length,0);
  p=C.payrollPlan(b,[],{wages:{'n:ΔΟΚΙΜΗ Α|2026-01-03':80},overtime:{'n:ΔΟΚΙΜΗ Α|2026-01-03|2026-01-09':1}});assert.deepEqual(p.errors,[]);C.applyPayroll(s,p);
  assert.equal(C.wageAt(s.workers[0],'2026-01-03'),80);assert.equal(s.workers[0].overtimeImports[0].hours,3);
});

test('typos require mapping, which is remembered on subsequent uploads',()=>{
  const s=company(),b=scan([sheet('3 - 9 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70]],[['Δοκίμ Α',2,20]])]);
  assert.ok(C.payrollPlan(b,[]).errors.some(e=>e.includes('μόνο στις υπερωρίες')));
  const mapping={'ΔΟΚΙΜ Α':'n:ΔΟΚΙΜΗ Α'};let p=C.payrollPlan(b,[],{mapping});assert.deepEqual(p.errors,[]);C.applyPayroll(s,p);
  p=C.payrollPlan(b,s.workers);assert.equal(p.groups.length,1);assert.deepEqual(p.errors,[]);
});

test('existing workers keep skills, phones, teams and later manual wage changes',()=>{
  const s=company(),w={id:'w',name:'Δοκιμή Α',wage:65,role:'texn',specialtyId:'gen',specialtyIds:['gen','brick'],phone:'000',rates:{p:110},wageHistory:[{from:'2026-11-01',wage:100}]};
  s.workers=[w];s.teams=[{id:'team',workerIds:['w']}];const b=scan([sheet('3 - 9 ΙΑΝΟΥΑΡΙΟΥ',[['Δοκιμή Α',70]])]);C.applyPayroll(s,C.payrollPlan(b,s.workers));
  assert.equal(C.wageAt(w,'2026-01-02'),65);assert.equal(C.wageAt(w,'2026-01-03'),70);assert.equal(C.wageAt(w,'2026-11-01'),100);
  assert.deepEqual(w.specialtyIds,['gen','brick']);assert.equal(w.phone,'000');assert.equal(w.rates.p,110);assert.deepEqual(s.teams[0].workerIds,['w']);
});

test('dated wages apply to direct, task, warehouse, office and project-manager schedule rows',()=>{
  const s=company(),d=C.today(),next=C.add(d,1);Object.assign(s.settings,{start:d,workdays:[0,1,2,3,4,5,6],scheduleMode:'manual',manualFrom:'',fillIdle:false});
  s.specialties=[{id:'gen',name:'Γενικά'},{id:'office',name:'Γραφείο',office:true},{id:'pm',name:'Διαχείριση',office:true,pm:true}];
  s.workers=['direct','task','warehouse','office','pm'].map(id=>({id,name:id,role:id==='office'||id==='pm'?'ypal':'texn',specialtyId:id==='office'||id==='pm'?id:'gen',wage:70,wageBase:70,wageHistory:[{from:next,wage:90}],off:[],rates:{}}));
  s.projects=[{id:'p',name:'Έργο',managers:['pm']}];s.tasks=[{id:'t',title:'Εργασία',projectId:'p',specialtyId:'gen',responsibleId:'task',helpers:0,days:10,status:'todo'}];
  for(const date of [d,next]){C.setPlacement('direct',date,{type:'project',projectId:'p'});C.setPlacement('task',date,{type:'task',taskId:'t'});C.setPlacement('warehouse',date,{type:'gen'})}
  const r=C.schedule();for(const w of s.workers){assert.equal(r.asg.filter(a=>a.workerId===w.id&&a.date===d).reduce((n,a)=>n+a.wage,0),70,w.id);assert.equal(r.asg.filter(a=>a.workerId===w.id&&a.date===next).reduce((n,a)=>n+a.wage,0),90,w.id)}
});

test('repricing honours date boundaries and locked payments, and manual decreases preserve the prior base',()=>{
  const s=company(),w={id:'w',name:'Δοκιμή',role:'voith',specialtyId:'gen',wage:70,rates:{},off:[]};s.workers=[w];
  C.setWage(w,60,'2026-01-10');assert.equal(C.wageAt(w,'2026-01-09'),70);assert.equal(C.wageAt(w,'2026-01-10'),60);
  s.past={'2026-01-09':{a:[[null,'gen','w',70,0,0]]},'2026-01-10':{a:[[null,'gen','w',70,0,0]]},'2026-01-17':{a:[[null,'gen','w',70,0,0]]}};
  s.payments[C.viewStart('2026-01-17')+'|w']={lock:true};C.repricePast('w');assert.equal(s.past['2026-01-09'].a[0][3],70);assert.equal(s.past['2026-01-10'].a[0][3],60);assert.equal(s.past['2026-01-17'].a[0][3],70);
});

test('bad dates are blocked, missing overtime periods are visible and can be corrected',()=>{
  const b=scan([sheet('χωρίς ημερομηνία',[['Δοκιμή Α',70]],[['Δοκιμή Α',2,20]])]);let p=C.payrollPlan(b,[]);assert.ok(p.errors.length);assert.equal(b.sheets[0].estimated,true);
  p=C.payrollPlan(b,[],{sheets:{'0':{from:'2026-01-03',otFrom:'2026-01-01',otTo:'2026-01-09'}}});assert.deepEqual(p.errors,[]);assert.equal(p.groups[0].overtime[0].from,'2026-01-01');
});
