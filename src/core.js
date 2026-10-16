/* ERGODO: κοινή λογική για browser και server */
(function(root){
let S=null;
const setState=s=>{S=s};
const ROLES={arxi:'Αρχιεργάτης',texn:'Τεχνίτης',voith:'Βοηθός',ypal:'Υπάλληλος γραφείου',ext:'Εξωτερικός συνεργάτης'};
const DAYS=['Κυρ','Δευ','Τρί','Τετ','Πέμ','Παρ','Σάβ'];
const MONTHS=['Ιαν','Φεβ','Μαρ','Απρ','Μαΐ','Ιουν','Ιουλ','Αυγ','Σεπ','Οκτ','Νοε','Δεκ'];

const pad=n=>String(n).padStart(2,'0');
const ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const add=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ds(d)};
const dow=s=>pd(s).getDay();
const fmt=s=>{if(!s)return '—';const d=pd(s);return DAYS[d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1)};
const fmtS=s=>{if(!s)return '—';const d=pd(s);return d.getDate()+' '+MONTHS[d.getMonth()]};
let TODAY=ds(new Date());
const today=()=>(TODAY=ds(new Date()));
const eur=n=>new Intl.NumberFormat('el-GR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0);
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+Math.random().toString(36).slice(2,8);
const short=n=>{const p=String(n||'').trim().split(/\s+/);return p.length>1?p[0]+' '+p[p.length-1][0]+'.':p[0]};
function weekStart(s){const d=dow(s);return add(s,d===0?-6:1-d)}
/* ---------- Demo δεδομένα ---------- */
function officeDemo(){
  return {
    specialties:[{id:'o1',name:'Γραμματεία',office:true},{id:'o2',name:'Διαχείριση έργων',office:true,pm:true},{id:'o3',name:'Ταμείο και λογιστήριο',office:true},{id:'o4',name:'Εξωτερικός υπάλληλος',office:true}],
    workers:[
      {id:'w18',name:'Ελένη Παπαδάκη',specialtyId:'o1',role:'ypal',wage:60,phone:'697 220 4410',off:[],rates:{}},
      {id:'w19',name:'Αντώνης Ρίζος',specialtyId:'o2',role:'ypal',wage:110,phone:'694 551 0378',off:[],rates:{}},
      {id:'w21',name:'Κατερίνα Λιάπη',specialtyId:'o2',role:'ypal',wage:105,phone:'697 846 3302',off:[],rates:{}},
      {id:'w20',name:'Μαρία Κυριακίδου',specialtyId:'o3',role:'ypal',wage:70,phone:'698 913 2265',off:[],rates:{}},
      {id:'w24',name:'Παναγιώτης Ρήγας',specialtyId:'o4',role:'ypal',wage:65,phone:'693 402 7719',off:[],rates:{}},
    ],
    duties:[
      {id:'d1',title:'Email, τηλέφωνα και αλληλογραφία',workerId:'w18',freq:'daily',days:[],date:'',projectId:''},
      {id:'d2',title:'Αναγγελίες προσωπικού στην ΕΡΓΑΝΗ',workerId:'w18',freq:'daily',days:[],date:'',projectId:''},
      {id:'d3',title:'Παραγγελίες υλικών από προμηθευτές',workerId:'w18',freq:'days',days:[1,4],date:'',projectId:''},
      {id:'d4',title:'Επίσκεψη και έλεγχος εργοταξίου',workerId:'w19',freq:'daily',days:[],date:'',projectId:'p1'},
      {id:'d5',title:'Έλεγχος προόδου ανακαίνισης',workerId:'w19',freq:'days',days:[2,5],date:'',projectId:'p2'},
      {id:'d6',title:'Εβδομαδιαία αναφορά στον εργολάβο',workerId:'w19',freq:'days',days:[6],date:'',projectId:''},
      {id:'d7',title:'Καταγραφή εξόδων ημέρας',workerId:'w20',freq:'daily',days:[],date:'',projectId:''},
      {id:'d8',title:'Τιμολόγια προμηθευτών',workerId:'w20',freq:'days',days:[3],date:'',projectId:''},
      {id:'d9',title:'Πληρωμή μεροκαμάτων εβδομάδας',workerId:'w20',freq:'days',days:[6],date:'',projectId:''},
      {id:'d10',title:'Παραλαβή υλικών στην Καλαμαριά',workerId:'w1',freq:'days',days:[1],date:'',projectId:'p1'},
      {id:'d11',title:'Τράπεζες, ΔΟΥ και ΕΦΚΑ',workerId:'w24',freq:'days',days:[1,3,5],date:'',projectId:''},
      {id:'d12',title:'Πολεοδομία και άδειες έργων',workerId:'w24',freq:'days',days:[2,4],date:'',projectId:''},
      {id:'d13',title:'Παραλαβή και μεταφορά εγγράφων στα εργοτάξια',workerId:'w24',freq:'daily',days:[],date:'',projectId:''},
    ]};
}
// εξωτερικοί συνεργάτες: δεν είναι στη μισθοδοσία, πληρώνονται κατ' αποκοπή ανά εργασία ή με μεροκάματο
function extDemo(){
  return {
    specialties:[{id:'s7',name:'Αλουμινάδες'},{id:'s8',name:'Γυψοσανιδάδες'}],
    workers:[
      {id:'w22',name:'Χρήστος Παπαγεωργίου',company:'Αλουμίνια Παπαγεωργίου',afm:'',specialtyId:'s7',role:'ext',pay:'job',wage:0,phone:'697 551 2208',off:[],rates:{}},
      {id:'w23',name:'Κώστας Ζαχαρίου',company:'Ζαχαρίου Γυψοσανίδες',afm:'',specialtyId:'s8',role:'ext',pay:'day',wage:130,phone:'694 117 8830',off:[],rates:{}},
    ],
    tasks:[
      {id:'t16',projectId:'p2',title:'Κουφώματα αλουμινίου',specialtyId:'s7',responsibleId:'w22',helpers:0,days:3,priority:2,after:'t9',earliest:'',status:'todo',price:4800},
      {id:'t17',projectId:'p3',title:'Ψευδοροφή γυψοσανίδας',specialtyId:'s8',responsibleId:'w23',helpers:0,days:2,priority:2,after:'t14',earliest:'',status:'todo'},
    ]};
}
function demo(){
  const sp=[['s1','Χτίστες'],['s2','Σοβατζήδες'],['s3','Ηλεκτρολόγοι'],['s4','Υδραυλικοί'],['s5','Πλακάδες'],['s6','Ελαιοχρωματιστές'],['gen','Γενικοί βοηθοί']].map(([id,name])=>({id,name}));
  const w=(id,name,specialtyId,role,wage,phone,rates)=>({id,name,specialtyId,role,wage,phone,off:[],rates:rates||{}});
  const workers=[
    w('w1','Γιώργος Παπαδόπουλος','s1','arxi',95,'694 120 3381',{p1:105}),
    w('w2','Νίκος Κωνσταντίνου','s1','texn',80,'697 455 1290'),
    w('w3','Αλέξης Χατζής','s1','voith',55,'693 778 0042'),
    w('w4','Δημήτρης Λάμπρου','s1','voith',55,'698 301 7765'),
    w('w5','Βασίλης Αθανασίου','s2','arxi',90,'694 662 1180'),
    w('w6','Ερμάλ Κόλα','s2','voith',55,'690 214 5539'),
    w('w7','Πέτρος Μιχαηλίδης','s2','voith',50,'695 870 2214'),
    w('w8','Σταύρος Ιωάννου','s3','arxi',100,'697 113 9020'),
    w('w9','Κώστας Δημητρίου','s3','voith',60,'693 505 6612'),
    w('w10','Μιχάλης Γεωργίου','s4','arxi',100,'694 998 0217'),
    w('w11','Άρης Νικολάου','s4','voith',60,'698 640 3375'),
    w('w12','Θανάσης Βλάχος','s5','arxi',95,'697 287 4401'),
    w('w13','Λευτέρης Σταμάτης','s5','texn',80,'690 733 1158'),
    w('w14','Γιάννης Μαυρίδης','s6','arxi',85,'695 402 6693'),
    w('w15','Φώτης Ντούκας','s6','voith',55,'694 351 7720'),
    w('w16','Σπύρος Καραγιάννης','gen','voith',50,'693 114 8806',{p2:55}),
    w('w17','Ηλίας Μπέκας','gen','voith',50,'698 027 5541'),
  ];
  const projects=[
    {id:'p1',name:'Πολυκατοικία Καλαμαριάς',location:'Κομνηνών 24, Καλαμαριά',budget:24000,color:'p1',managers:['w19']},
    {id:'p2',name:'Μονοκατοικία Πανοράματος',location:'Αγ. Αντωνίου 7, Πανόραμα',budget:9500,color:'p2',managers:['w19','w21']},
    {id:'p3',name:'Κατάστημα Τσιμισκή',location:'Τσιμισκή 112, Θεσσαλονίκη',budget:5200,color:'p3',managers:['w21']},
  ];
  const t=(id,projectId,title,specialtyId,responsibleId,helpers,days,priority,after,earliestOffset)=>({id,projectId,title,specialtyId,responsibleId,helpers,days,priority,after:after||'',earliest:earliestOffset!=null?add(TODAY,earliestOffset):'',status:'todo'});
  const tasks=[
    t('t1','p1','Τοιχοποιία 2ου ορόφου','s1','w1',2,6,1),
    t('t2','p1','Ηλεκτρολογικές σωληνώσεις 2ου','s3','w8',1,4,1,'t1'),
    t('t3','p1','Υδραυλικά δίκτυα 2ου','s4','w10',1,4,1,'t1'),
    t('t4','p1','Σοβάδες 2ου ορόφου','s2','w5',2,7,2,'t2'),
    t('t5','p1','Τοιχοποιία 3ου ορόφου','s1','w1',2,6,2,'t1'),
    t('t6','p1','Πλακάκια κλιμακοστασίου','s5','w12',1,4,3,'t4'),
    t('t7','p2','Καθαιρέσεις και αποξηλώσεις','s1','w2',2,3,1),
    t('t8','p2','Νέο υδραυλικό μπάνιου','s4','w10',1,3,1,'t7'),
    t('t9','p2','Νέα ηλεκτρολογική εγκατάσταση','s3','w8',1,5,2,'t7'),
    t('t10','p2','Πλακάκια μπάνιου και κουζίνας','s5','w12',1,5,2,'t8'),
    t('t11','p2','Βάψιμο εσωτερικών χώρων','s6','w14',1,6,2,'t10'),
    t('t12','p3','Μερεμέτια και επισκευές τοίχων','s2','w5',1,2,1),
    t('t13','p3','Δάπεδο πλακάκι 80×80','s5','w13',1,4,1,'',2),
    t('t14','p3','Ηλεκτρολογικά φωτισμού','s3','w8',0,3,2),
    t('t15','p3','Βάψιμο καταστήματος','s6','w14',1,3,2,'t12'),
    {id:'t0',projectId:'p1',title:'Σκυροδέτηση πλάκας 3ου',specialtyId:'s1',responsibleId:'w1',helpers:3,days:2,priority:1,after:'',earliest:'',status:'done'},
  ];
  const o=officeDemo(),x=extDemo();
  sp.splice(sp.length-1,0,...x.specialties);workers.push(...x.workers);tasks.push(...x.tasks);
  return {v:2,extDemo:true,extEmp:true,cpay:[],settings:{start:weekStart(TODAY),workdays:[1,2,3,4,5,6],fillIdle:true,autoSend:false,sendTime:'06:30'},specialties:[...sp,...o.specialties],workers:[...workers,...o.workers],projects,tasks,duties:o.duties,overrides:{},payments:{},dutyDone:{}};
}
function migrate(o){
  if(o.v===1){
    const d=officeDemo();
    o.workers.forEach(w=>w.rates=w.rates||{});
    d.specialties.forEach(s=>{if(!o.specialties.some(x=>x.id===s.id))o.specialties.push(s)});
    d.workers.forEach(w=>{if(!o.workers.some(x=>x.id===w.id))o.workers.push(w)});
    o.duties=d.duties.filter(x=>o.workers.some(w=>w.id===x.workerId));
    o.overrides={};o.payments={};o.dutyDone={};o.settings.fillIdle=true;o.v=2;
  }
  if(o&&Array.isArray(o.projects)){
    const o2=(o.specialties||[]).find(s=>s.id==='o2');if(o2&&o2.pm==null)o2.pm=true;
    const pms=(o.workers||[]).filter(w=>(o.specialties||[]).some(s=>s.pm&&s.id===w.specialtyId)).map(w=>w.id);
    o.projects.forEach(p=>{if(!Array.isArray(p.managers))p.managers=pms.slice(0,1)});
  }
  // μία φορά: προσθέτει τους demo συνεργάτες σε demo δεδομένα
  if(o&&Array.isArray(o.workers)&&!o.extDemo){
    o.extDemo=true;
    if(o.workers.some(w=>w.id==='w1')&&o.projects.some(p=>p.id==='p2')&&o.projects.some(p=>p.id==='p3')){
      const x=extDemo();const gi=o.specialties.findIndex(s=>s.id==='gen');
      x.specialties.forEach(s=>{if(!o.specialties.some(y=>y.id===s.id))o.specialties.splice(gi<0?o.specialties.length:gi,0,s)});
      x.workers.forEach(w=>{if(!o.workers.some(y=>y.id===w.id))o.workers.push(w)});
      x.tasks.forEach(t=>{if(!o.tasks.some(y=>y.id===t.id)){if(t.after&&!o.tasks.some(y=>y.id===t.after))t.after='';o.tasks.push(t)}});
    }
  }
  if(o&&Array.isArray(o.specialties)&&!o.extEmp){
    o.extEmp=true;const d=officeDemo();
    if(!o.specialties.some(s=>s.id==='o4'))o.specialties.push(d.specialties.find(s=>s.id==='o4'));
    if(o.workers.some(w=>w.id==='w19')&&!o.workers.some(w=>w.id==='w24')){o.workers.push(d.workers.find(w=>w.id==='w24'));o.duties=o.duties||[];d.duties.filter(x=>x.workerId==='w24').forEach(x=>{if(!o.duties.some(y=>y.id===x.id))o.duties.push(x)})}
  }
  if(o&&!Array.isArray(o.cpay))o.cpay=[];
  if(o&&o.settings){if(o.settings.sendTime==null)o.settings.sendTime='06:30';if(o.settings.autoSend==null)o.settings.autoSend=false}
  return o;
}
const byId=(arr,id)=>arr.find(x=>x.id===id);
const P=id=>byId(S.projects,id), W=id=>byId(S.workers,id), T=id=>byId(S.tasks,id), SP=id=>byId(S.specialties,id);
const PSEUDO={office:{name:'Γραφείο',color:'muted'},gen:{name:'Αποθήκη και συντήρηση',color:'hivis'}};
const pname=id=>PSEUDO[id]?.name||P(id)?.name||'—';
const isWork=s=>S.settings.workdays.includes(dow(s));
const nextWork=(s,dir=1)=>{let d=s;for(let i=0;i<14&&!isWork(d);i++)d=add(d,dir);return d};
const isOffice=w=>!!SP(w.specialtyId)?.office;
const isPM=w=>!!SP(w.specialtyId)?.pm;
const isExt=w=>!!w&&w.role==='ext';
// τι κοστίζει μια μέρα ενός ατόμου σε μια εργασία: κατ' αποκοπή συνεργάτης = τιμή εργασίας / μέρες
const dayCost=(w,t)=>isExt(w)&&w.pay==='job'?(t&&t.responsibleId===w.id?(+t.price||0)/Math.max(1,+t.days||1):0):rate(w,t?t.projectId:'gen');
// σε ποια έργα είναι ένας διαχειριστής μια μέρα (ανάθεση του έργου ή αλλαγή της ημέρας)
function pmProjects(wid,d){
  const w=W(wid);if(!w||!isPM(w)||isOff(w,d))return [];
  const o=ov(d,wid);
  const ids=o&&o.type==='pm'?o.projectIds||[]:S.projects.filter(p=>(p.managers||[]).includes(wid)).map(p=>p.id);
  return ids.filter(id=>P(id));
}
const managersOf=(pid,d)=>S.workers.filter(w=>isPM(w)&&pmProjects(w.id,d).includes(pid));
const ov=(d,wid)=>S.overrides[d+'|'+wid];
const isOff=(w,d)=>(w.off||[]).includes(d)||ov(d,w.id)?.type==='off';
const rate=(w,pid)=>{const r=w.rates&&w.rates[pid];return +(r!==''&&r!=null?r:w.wage)||0};
const dutyOn=(x,d)=>x.freq==='daily'?isWork(d):x.freq==='days'?(x.days||[]).includes(dow(d)):x.date===d;
const dutiesFor=(wid,d)=>S.duties.filter(x=>x.workerId===wid&&dutyOn(x,d));

/* ---------- Αυτόματος προγραμματισμός ---------- */
function schedule(){
  today();
  const start=nextWork(S.settings.start||TODAY);
  const minEnd=add(weekStart(TODAY),13);
  const open=S.tasks.filter(t=>t.status!=='done');
  const rem={},begin={},finish={},prevCrew={},waiting={};
  open.forEach(t=>rem[t.id]=Math.max(1,+t.days||1));
  const done=new Set(S.tasks.filter(t=>t.status==='done').map(t=>t.id));
  const byDay={},asg=[];
  let left=open.length,day=start,idleStreak=0,guard=0;
  const depOk=(t,d)=>{if(!t.after||done.has(t.after)||!T(t.after))return true;return finish[t.after]&&finish[t.after]<d};
  const lastEnd={v:start};
  while(guard<500&&((left>0&&idleStreak<40)||day<=minEnd)){
    guard++;
    if(!isWork(day)){day=add(day,1);continue}
    const busy=new Set(S.workers.filter(w=>isOff(w,day)||isOffice(w)).map(w=>w.id));
    // χειροκίνητες αναθέσεις της ημέρας
    const forced={},gen=[];
    S.workers.forEach(w=>{if(busy.has(w.id))return;const o=ov(day,w.id);if(!o)return;
      if(o.type==='task'||o.type==='tasks'){taskIdsOf(o).forEach(id=>{const t=T(id);if(t&&t.status!=='done'&&rem[t.id]>0){(forced[t.id]=forced[t.id]||[]).push(w);busy.add(w.id)}})}
      else if(o.type==='gen'){gen.push({w,forced:true});busy.add(w.id)}});
    const jobs=[];
    const ready=open.filter(t=>rem[t.id]>0&&(forced[t.id]||((!t.earliest||t.earliest<=day)&&depOk(t,day))))
      .sort((a,b)=>(a.priority-b.priority)||((begin[a.id]?0:1)-(begin[b.id]?0:1))||((a.earliest||'').localeCompare(b.earliest||''))||S.tasks.indexOf(a)-S.tasks.indexOf(b));
    for(const t of ready){
      const fx=forced[t.id]||[];
      let lead=fx.find(w=>w.id===t.responsibleId)||fx.find(w=>w.role!=='voith'&&w.specialtyId===t.specialtyId)||null,sub=false;
      if(lead)sub=lead.id!==t.responsibleId;
      else{
        const r=W(t.responsibleId);
        if(r&&!busy.has(r.id))lead=r;
        else if(isExt(r))lead=null;   // ο συνεργάτης δεν αντικαθίσταται από το προσωπικό
        else{lead=S.workers.find(w=>w.specialtyId===t.specialtyId&&w.role!=='voith'&&!isExt(w)&&!busy.has(w.id))||null;sub=!!lead}
        if(lead)busy.add(lead.id);
        else{lead=fx.find(w=>w.role!=='voith')||null;sub=!!lead}
      }
      if(!lead&&!fx.length){(waiting[day]=waiting[day]||[]).push({task:t,reason:W(t.responsibleId)&&isOff(W(t.responsibleId),day)?(isExt(W(t.responsibleId))?'Ο συνεργάτης δεν είναι διαθέσιμος':'Ο υπεύθυνος είναι σε άδεια'):(isExt(W(t.responsibleId))?'Ο συνεργάτης είναι σε άλλη εργασία':'Ο υπεύθυνος είναι σε άλλη εργασία')});continue}
      const helpers=fx.filter(w=>w!==lead);
      const need=Math.max(0,+t.helpers||0);
      if(lead&&helpers.length<need){
        const prev=prevCrew[t.id]||[];
        const pool=S.workers.filter(w=>w.role==='voith'&&!busy.has(w.id)&&(w.specialtyId===t.specialtyId||w.specialtyId==='gen'))
          .sort((a,b)=>((prev.includes(a.id)?0:2)+(a.specialtyId===t.specialtyId?0:1))-((prev.includes(b.id)?0:2)+(b.specialtyId===t.specialtyId?0:1)));
        pool.slice(0,need-helpers.length).forEach(w=>{helpers.push(w);busy.add(w.id)});
      }
      prevCrew[t.id]=helpers.map(w=>w.id);
      jobs.push({task:t,lead,sub,helpers,forced:new Set(fx.map(w=>w.id)),extra:new Set(),short:helpers.length<need,dayNo:(+t.days||1)-rem[t.id]+1});
      if(lead){
        if(!begin[t.id])begin[t.id]=day;
        rem[t.id]--;
        if(rem[t.id]===0){finish[t.id]=day;left--}
      }
    }
    // όλοι να έχουν δουλειά: όσοι περισσεύουν ενισχύουν συνεργεία ή πάνε αποθήκη
    if(S.settings.fillIdle&&jobs.length){
      S.workers.filter(w=>!busy.has(w.id)&&!isExt(w)).forEach(w=>{
        const same=jobs.filter(j=>j.task.specialtyId===w.specialtyId);
        const cand=same.length?same:(w.role==='voith'?jobs.slice():[]);
        if(cand.length){cand.sort((a,b)=>(a.helpers.length-(+a.task.helpers||0))-(b.helpers.length-(+b.task.helpers||0))||a.helpers.length-b.helpers.length);const j=cand[0];j.helpers.push(w);j.extra.add(w.id)}
        else gen.push({w,forced:false});
        busy.add(w.id)});
    }
    // όποιος είναι σε πολλές εργασίες την ίδια μέρα μοιράζει το μεροκάματο ισόποσα
    const cnt={};jobs.forEach(j=>{j.multi=new Set();[j.lead,...j.helpers].filter(Boolean).forEach(w=>cnt[w.id]=(cnt[w.id]||0)+1)});
    jobs.forEach(j=>[j.lead,...j.helpers].filter(Boolean).forEach(w=>{const n=cnt[w.id];if(n>1)j.multi.add(w.id);
      asg.push(Object.assign({date:day,taskId:j.task.id,projectId:j.task.projectId,workerId:w.id,wage:dayCost(w,j.task)/n},n>1?{share:1/n}:{},isExt(w)&&w.pay==='job'?{job:true}:{}))}));
    gen.forEach(g=>asg.push({date:day,taskId:null,projectId:'gen',workerId:g.w.id,wage:rate(g.w,'gen')}));
    S.workers.filter(w=>isOffice(w)&&!isOff(w,day)).forEach(w=>{
      const pp=pmProjects(w.id,day);
      if(pp.length)pp.forEach(pid=>asg.push({date:day,taskId:null,projectId:pid,workerId:w.id,wage:rate(w,pid)/pp.length,share:1/pp.length,pm:true}));
      else asg.push({date:day,taskId:null,projectId:'office',workerId:w.id,wage:+w.wage||0})});
    byDay[day]={jobs,gen};
    if(jobs.length)lastEnd.v=day;
    idleStreak=jobs.length?0:idleStreak+1;
    day=add(day,1);
  }
  const unplanned=open.filter(t=>rem[t.id]>0);
  const end=Object.values(finish).sort().pop()||start;
  return {start,end,byDay,asg,begin,finish,rem,waiting,unplanned};
}
// τι κάνει ένας εργαζόμενος μια μέρα
const taskIdsOf=o=>!o?[]:o.type==='tasks'?(o.taskIds||[]):o.type==='task'?[o.taskId]:[];
function whatDoes(R,wid,d){
  const w=W(wid);const res={off:isOff(w,d),job:null,lead:false,jobs:[],gen:false,forced:!!ov(d,wid)&&ov(d,wid).type!=='off',duties:dutiesFor(wid,d),pm:pmProjects(wid,d)};
  if(res.off)return res;
  const day=R.byDay[d];
  if(day){
    for(const j of day.jobs){const lead=!!(j.lead&&j.lead.id===wid);if(lead||j.helpers.some(x=>x.id===wid))res.jobs.push({job:j,lead})}
    if(res.jobs.length){res.job=res.jobs[0].job;res.lead=res.jobs[0].lead}
    else if(day.gen.some(g=>g.w.id===wid))res.gen=true;
  }
  return res;
}
// έχει δουλειά σε έργο κάποια από αυτές τις μέρες (για να μη στέλνεται κενό μήνυμα σε συνεργάτες)
const hasJob=(R,wid,days)=>days.some(d=>whatDoes(R,wid,d).jobs.length>0);
const weekDays=ws=>{const a=[];for(let i=0;i<7;i++){const d=add(ws,i);if(isWork(d))a.push(d)}return a};
// μία μέρα ενός εργαζόμενου σε κείμενο
function dayBlock(R,w,d){
  const x=whatDoes(R,w.id,d);let s='';
  if(x.off)return 'Άδεια\n';
  if(x.jobs.length){if(x.jobs.length>1)s+=x.jobs.length+' εργασίες σήμερα:\n';
    x.jobs.forEach(({job,lead})=>{const p=P(job.task.projectId);s+=p.name+' ('+p.location+')\n  '+job.task.title+(lead?', υπεύθυνος':'')+'\n';
    const others=[job.lead,...job.helpers].filter(o=>o&&o.id!==w.id).map(o=>short(o.name));if(others.length)s+='  Μαζί: '+others.join(', ')+'\n'})}
  else if(x.gen)s+='Αποθήκη και συντήρηση εξοπλισμού\n';
  else if(x.pm.length)s+='Διαχείριση έργων:\n'+x.pm.map(pid=>'  '+P(pid).name+' ('+P(pid).location+')\n').join('');
  else if(isOffice(w))s+=(SP(w.specialtyId)?.name||'Γραφείο')+'\n';
  else if(isExt(w))s+='Καμία εργασία\n';
  else s+='Χωρίς ανάθεση (θα ενημερωθείς)\n';
  x.duties.forEach(t=>s+='  • '+t.title+(t.projectId?' ('+P(t.projectId)?.name+')':'')+'\n');
  return s;
}
// υπογραφή σε κάθε μήνυμα προς το προσωπικό
const SIGN='\n✅ ERGODO · Get the job Done';
function personText(R,w,ws){
  let s='ΠΡΟΓΡΑΜΜΑ ΕΒΔΟΜΑΔΑΣ '+fmtS(ws)+' – '+fmtS(add(ws,6))+'\n'+w.name+'\n';
  weekDays(ws).forEach(d=>{s+='\n'+fmt(d)+': '+dayBlock(R,w,d)});
  return s+SIGN;
}
// το καθημερινό μήνυμα που φεύγει αυτόματα
function personDayText(R,w,d){
  return 'Γεια σου '+String(w.name).split(/\s+/)[0]+'! Το πρόγραμμά σου για '+fmt(d)+':\n\n'+dayBlock(R,w,d)+SIGN;
}
// η εβδομάδα ενός εργαζόμενου σε δεδομένα, για τη σελίδα «Το πρόγραμμά μου».
// Περιέχει μόνο ό,τι χρειάζεται ο ίδιος: πού, τι και με ποιους. Όχι μεροκάματα ή κόστη.
function personWeek(R,w,ws){
  return {name:w.name,specialty:SP(w.specialtyId)?.name||'',weekStart:ws,days:weekDays(ws).map(d=>{
    const x=whatDoes(R,w.id,d),o={date:d,off:x.off,items:[],duties:[]};
    if(x.off)return o;
    x.jobs.forEach(({job,lead})=>{const p=P(job.task.projectId);o.items.push({kind:'job',project:p.name,location:p.location||'',color:p.color||'',task:job.task.title,lead,
      with:[job.lead,...job.helpers].filter(q=>q&&q.id!==w.id).map(q=>q.name)})});
    if(!x.jobs.length){
      if(x.gen)o.items.push({kind:'gen',title:'Αποθήκη και συντήρηση εξοπλισμού'});
      else if(x.pm.length)x.pm.forEach(pid=>{const p=P(pid);o.items.push({kind:'pm',project:p.name,location:p.location||'',color:p.color||'',task:'Διαχείριση έργου'})});
      else if(isOffice(w))o.items.push({kind:'office',title:SP(w.specialtyId)?.name||'Γραφείο'});
      else o.items.push({kind:'none',title:isExt(w)?'Καμία εργασία':'Χωρίς ανάθεση ακόμη. Θα ενημερωθείς.'});
    }
    o.duties=x.duties.map(t=>({title:t.title,project:t.projectId?P(t.projectId)?.name||'':''}));
    return o})};
}
root.ErgoCore={setState,today,ROLES,DAYS,MONTHS,pad,ds,pd,add,dow,fmt,fmtS,eur,h,uid,short,weekStart,officeDemo,demo,migrate,
  byId,P,W,T,SP,PSEUDO,pname,isWork,nextWork,isOffice,isPM,pmProjects,managersOf,ov,isOff,rate,dutyOn,dutiesFor,schedule,whatDoes,taskIdsOf,hasJob,isExt,dayCost,extDemo,weekDays,dayBlock,personText,personDayText,personWeek};
})(typeof window!=='undefined'?window:globalThis);
