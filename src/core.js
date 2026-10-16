/* ERGODO: κοινή λογική για browser και server */
(function(root){
let S=null;
const setState=s=>{S=s;today()};   // και ανανεώνει τη σημερινή μέρα (ο server τρέχει για μέρες)
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
// κεφαλαία χωρίς τόνους, όπως θέλει η ορθογραφία· όπου ο τόνος χωρίζει δίφθογγο (τσάι, άυλος) μπαίνουν διαλυτικά
const upGR=s=>String(s??'').replace(/([άέόύΆΈΌΎ])([ιυ])/g,(m,a,b)=>a+(b==='ι'?'ϊ':'ϋ')).normalize('NFD').replace(/\u0301/g,'').normalize('NFC').toUpperCase();
const eur=n=>new Intl.NumberFormat('el-GR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0);
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+Math.random().toString(36).slice(2,8);
const short=n=>{const p=String(n||'').trim().split(/\s+/);return p.length>1?p[0]+' '+p[p.length-1][0]+'.':p[0]};
function weekStart(s){const d=dow(s);return add(s,d===0?-6:1-d)}
/* ---------- Demo δεδομένα ---------- */
// ραντεβού στα demo: ο εργολάβος με τον ηλεκτρολόγο σε αυτοψία, παράδοση προσφοράς, επιμέτρηση με τον αλουμινά
function apDemo(wd){
  const nw=s=>{let d=s;for(let i=0;i<14&&!wd.includes(dow(d));i++)d=add(d,1);return d};
  const d0=nw(TODAY),d1=nw(add(TODAY,1)),d3=nw(add(d1,2));
  return [
    {id:'a1',date:d1,time:'10:00',end:'11:00',title:'Αυτοψία για ανακαίνιση μπάνιου',client:'Κ. Ιωάννου',phone:'697 300 4512',place:'Αγ. Δημητρίου 45, Θεσσαλονίκη',projectId:'',people:['owner','w8'],notes:'Να δούμε τον πίνακα και τις παροχές πριν δοθεί προσφορά.',status:'open'},
    {id:'a2',date:d0,time:'13:30',end:'',title:'Παράδοση προσφοράς για το βάψιμο',client:'Κατάστημα Τσιμισκή',phone:'',place:'Τσιμισκή 112, Θεσσαλονίκη',projectId:'p3',people:['w21'],notes:'',status:'open'},
    {id:'a3',date:d3,time:'09:00',end:'10:30',title:'Επιμέτρηση κουφωμάτων',client:'Οικογένεια Νικολαΐδη',phone:'694 220 9981',place:'Αγ. Αντωνίου 7, Πανόραμα',projectId:'p2',people:['w19','w22'],notes:'',status:'open'},
  ];
}
// υπενθυμίσεις στα demo: του εργολάβου (μία εκκρεμεί από χθες) και μία για το ταμείο
function remDemo(wd){
  const nw=s=>{let d=s;for(let i=0;i<14&&!wd.includes(dow(d));i++)d=add(d,1);return d};
  const pw=s=>{let d=add(s,-1);for(let i=0;i<14&&!wd.includes(dow(d));i++)d=add(d,-1);return d};
  const d0=nw(TODAY),d1=nw(add(d0,1));
  return [
    {id:'r1',title:'Υπογραφή σύμβασης με τον πελάτη',workerId:'owner',freq:'once',date:d0,time:'09:30',days:[],dom:'',projectId:'p3',notes:'Να πάρει μαζί την προσφορά και το χρονοδιάγραμμα.'},
    {id:'r2',title:'Τηλέφωνο στον προμηθευτή για τα πλακάκια',workerId:'owner',freq:'once',date:pw(d0),time:'',days:[],dom:'',projectId:'p2',notes:''},
    {id:'r3',title:'Σύσκεψη με τους διαχειριστές έργων',workerId:'owner',freq:'days',date:'',time:'08:00',days:[1],dom:'',projectId:'',notes:''},
    {id:'r4',title:'Έλεγχος πληρωμών ΕΦΚΑ με το λογιστήριο',workerId:'owner',freq:'month',date:'',time:'',days:[],dom:25,projectId:'',notes:''},
    {id:'r5',title:'Επιταγές για τον προμηθευτή σιδήρου',workerId:'w20',freq:'once',date:d1,time:'11:00',days:[],dom:'',projectId:'',notes:''},
  ];
}
// καιρός στα demo: περιοχή ανά έργο και εξωτερικές εργασίες που θέλουν στεγνή μέρα
const WX_DEMO={
  p1:{place:'Καλαμαριά',lat:40.5823,lon:22.9502},
  p2:{place:'Πανόραμα',lat:40.5878,lon:23.0333},
  dry:['t5','t18','t19'],
  tasks:t=>[
    t('t18','p2','Μόνωση και στεγάνωση ταράτσας','s1','w2',1,2,2),
    t('t19','p1','Εξωτερικοί σοβάδες όψης','s2','w5',2,5,3,'t4'),
  ]};
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
    {id:'p1',name:'Πολυκατοικία Καλαμαριάς',location:'Κομνηνών 24, Καλαμαριά',budget:24000,color:'p1',managers:['w19'],...WX_DEMO.p1},
    {id:'p2',name:'Μονοκατοικία Πανοράματος',location:'Αγ. Αντωνίου 7, Πανόραμα',budget:9500,color:'p2',managers:['w19','w21'],...WX_DEMO.p2},
    {id:'p3',name:'Κατάστημα Τσιμισκή',location:'Τσιμισκή 112, Θεσσαλονίκη',budget:5200,color:'p3',managers:['w21']},
  ];
  const t=(id,projectId,title,specialtyId,responsibleId,helpers,days,priority,after,earliestOffset)=>({id,projectId,title,specialtyId,responsibleId,helpers,days,priority,after:after||'',earliest:earliestOffset!=null?add(TODAY,earliestOffset):'',status:'todo',...(WX_DEMO.dry.includes(id)?{dry:true}:{})});
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
    ...WX_DEMO.tasks(t),
    {id:'t0',projectId:'p1',title:'Σκυροδέτηση πλάκας 3ου',specialtyId:'s1',responsibleId:'w1',helpers:3,days:2,priority:1,after:'',earliest:'',status:'done'},
  ];
  const o=officeDemo(),x=extDemo();
  sp.splice(sp.length-1,0,...x.specialties);workers.push(...x.workers);tasks.push(...x.tasks);
  return {v:2,extDemo:true,extEmp:true,wxDemo:true,apDemo:true,remDemo:true,cpay:[],wxMark:{},appts:apDemo([1,2,3,4,5,6]),settings:{start:weekStart(TODAY),workdays:[1,2,3,4,5,6],fillIdle:true,autoSend:false,sendTime:'06:30',wx:wxDefaults(),hol:holDefaults(),closed:[],payFrom:weekStart(TODAY),payCarry:true,payDay:6,payMethod:'cash'},specialties:[...sp,...o.specialties],workers:[...workers,...o.workers],projects,tasks,duties:[...o.duties,...remDemo([1,2,3,4,5,6])],overrides:{},payments:{},dutyDone:{}};
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
  if(o&&o.settings&&!o.settings.hol)o.settings.hol=holDefaults();
  if(o&&o.settings&&!Array.isArray(o.settings.closed))o.settings.closed=[];
  // πληρωμές: από {amount,days,date} (μία πλήρης πληρωμή) σε {earned,days,pays:[…]} που δέχεται μερικά ποσά
  if(o&&o.payments)Object.keys(o.payments).forEach((k,i)=>{const v=o.payments[k];if(v&&!Array.isArray(v.pays))o.payments[k]={earned:+v.amount||0,days:v.days||0,lock:true,pays:[{id:'p'+i+uid(''),amount:+v.amount||0,date:v.date||'',method:'',note:''}]}});
  // τα υπόλοιπα μετράνε από την εβδομάδα που μπήκε η δυνατότητα, όχι από παλιές εβδομάδες που πληρώθηκαν εκτός εφαρμογής
  if(o&&o.settings&&!o.settings.payFrom)o.settings.payFrom=weekStart(ds(new Date()));
  if(o&&o.settings&&!o.settings.wx)o.settings.wx=wxDefaults();
  if(o&&(!o.wxMark||typeof o.wxMark!=='object'))o.wxMark={};
  if(o&&!Array.isArray(o.appts))o.appts=[];
  // μία φορά: παραδείγματα ραντεβού στα demo δεδομένα
  if(o&&Array.isArray(o.workers)&&!o.apDemo){
    o.apDemo=true;
    const has=id=>o.workers.some(w=>w.id===id);
    if(has('w8')&&has('w19')&&has('w21')&&has('w22')&&(o.projects||[]).some(p=>p.id==='p3'&&p.name==='Κατάστημα Τσιμισκή')&&!o.appts.length){
      o.appts=apDemo((o.settings&&o.settings.workdays)||[1,2,3,4,5,6]);
    }
  }
  // μία φορά: παραδείγματα υπενθυμίσεων στα demo δεδομένα
  if(o&&Array.isArray(o.workers)&&!o.remDemo){
    o.remDemo=true;o.duties=o.duties||[];o.dutyDone=o.dutyDone||{};
    if(o.workers.some(w=>w.id==='w20')&&o.duties.some(x=>x.id==='d1')&&(o.projects||[]).some(p=>p.id==='p3')&&!o.duties.some(x=>/^r\d/.test(x.id)))
      o.duties.push(...remDemo((o.settings&&o.settings.workdays)||[1,2,3,4,5,6]));
  }
  // μία φορά: καιρός στα demo δεδομένα (περιοχές έργων, εξωτερικές εργασίες)
  if(o&&Array.isArray(o.tasks)&&!o.wxDemo){
    o.wxDemo=true;
    const dp=id=>(o.projects||[]).find(p=>p.id===id);
    if(dp('p2')&&dp('p2').name==='Μονοκατοικία Πανοράματος'&&dp('p1')&&dp('p1').name==='Πολυκατοικία Καλαμαριάς'&&(o.workers||[]).some(w=>w.id==='w2')&&(o.workers||[]).some(w=>w.id==='w5')){
      ['p1','p2'].forEach(id=>{const p=dp(id);if(p.lat==null)Object.assign(p,WX_DEMO[id])});
      const t5=o.tasks.find(t=>t.id==='t5');if(t5&&t5.dry==null)t5.dry=true;
      const mk=(id,projectId,title,specialtyId,responsibleId,helpers,days,priority,after)=>({id,projectId,title,specialtyId,responsibleId,helpers,days,priority,after:after||'',earliest:'',status:'todo',dry:true});
      WX_DEMO.tasks(mk).forEach(t=>{if(!o.tasks.some(x=>x.id===t.id)){if(t.after&&!o.tasks.some(x=>x.id===t.after))t.after='';o.tasks.push(t)}});
    }
  }
  if(o&&o.settings){if(o.settings.sendTime==null)o.settings.sendTime='06:30';if(o.settings.autoSend==null)o.settings.autoSend=false}
  return o;
}
const byId=(arr,id)=>arr.find(x=>x.id===id);
const P=id=>byId(S.projects,id), W=id=>byId(S.workers,id), T=id=>byId(S.tasks,id), SP=id=>byId(S.specialties,id);
const PSEUDO={office:{name:'Γραφείο',color:'muted'},gen:{name:'Αποθήκη και συντήρηση',color:'hivis'}};
const pname=id=>PSEUDO[id]?.name||P(id)?.name||'—';
/* ---------- Αργίες ----------
   Επίσημες αργίες (σταθερές και του Πάσχα) και μέρες που η εταιρεία είναι κλειστή: δεν μπαίνει πρόγραμμα, δεν στέλνεται Viber.
   settings.hol={on,skip:[id]}: ποιες αργίες δεν τηρούνται· settings.closed=[ΕΕΕΕ-ΜΜ-ΗΗ]. */
// Ορθόδοξο Πάσχα: υπολογισμός στο ιουλιανό ημερολόγιο + 13 μέρες (ισχύει για 1900-2099)
function easter(y){const a=y%4,b=y%7,c=y%19,d=(19*c+15)%30,e=(2*a+4*b-d+34)%7,m=Math.floor((d+e+114)/31),day=(d+e+114)%31+1;return add(y+'-'+pad(m)+'-'+pad(day),13)}
const HOLIDAYS=[['ny','Πρωτοχρονιά',y=>y+'-01-01'],['theo','Θεοφάνεια',y=>y+'-01-06'],['kd','Καθαρά Δευτέρα',y=>add(easter(y),-48)],['25m','25η Μαρτίου',y=>y+'-03-25'],
  ['mp','Μεγάλη Παρασκευή',y=>add(easter(y),-2)],['dp','Δευτέρα του Πάσχα',y=>add(easter(y),1)],['pm','Πρωτομαγιά',y=>y+'-05-01'],['ap','Αγίου Πνεύματος',y=>add(easter(y),50)],
  ['dek','Δεκαπενταύγουστος',y=>y+'-08-15'],['28o','28η Οκτωβρίου',y=>y+'-10-28'],['xm','Χριστούγεννα',y=>y+'-12-25'],['sx','Σύναξη της Θεοτόκου',y=>y+'-12-26']];
const holDefaults=()=>({on:true,skip:['ap']});
const HC={k:'',y:{}};
// το όνομα της αργίας ή «Κλειστά» για μια μέρα, αλλιώς ''
function holName(d){
  const st=S&&S.settings||{},hol=st.hol||holDefaults(),closed=st.closed||[];
  const k=JSON.stringify([hol,closed]);if(HC.k!==k){HC.k=k;HC.y={}}
  if(closed.includes(d))return 'Κλειστά';
  if(hol.on===false)return '';
  const y=+d.slice(0,4);
  if(!HC.y[y]){const m={};HOLIDAYS.forEach(([id,n,f])=>{if(!(hol.skip||[]).includes(id))m[f(y)]=n});HC.y[y]=m}
  return HC.y[y][d]||'';
}
const isWork=s=>S.settings.workdays.includes(dow(s))&&!holName(s);
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
/* ---------- Υπενθυμίσεις ----------
   Τι έχει να κάνει ο καθένας κάθε μέρα, και ο εργολάβος. Αποθηκεύονται στο S.duties (τα παλιά «καθήκοντα γραφείου»).
   Συχνότητα: κάθε εργάσιμη (daily), συγκεκριμένες μέρες (days), κάθε μήνα (month, μέρα dom) ή μία φορά (once, date).
   Το «έγινε» κρατιέται στο S.dutyDone ανά μέρα. Μια «μία φορά» που δεν έγινε φαίνεται ως εκκρεμότητα στη σημερινή μέρα. */
// η μέρα του μήνα του d όπου πέφτει μια μηνιαία υπενθύμιση· αν δεν είναι εργάσιμη, πάει στην επόμενη εργάσιμη
const monthDay=(x,d)=>{const [y,m]=d.split('-').map(Number);const last=new Date(y,m,0).getDate();return nextWork(y+'-'+pad(m)+'-'+pad(Math.min(Math.max(+x.dom||1,1),last)))};
const dutyOn=(x,d)=>x.freq==='daily'?isWork(d):x.freq==='days'?(x.days||[]).includes(dow(d)):x.freq==='month'?(monthDay(x,d)===d||monthDay(x,add(d.slice(0,8)+'01',-1))===d):x.date===d;
const doneKey=(x,d)=>(x.freq==='once'?x.date:d)+'|'+x.id;
const isDone=(x,d)=>!!(S.dutyDone||{})[doneKey(x,d)];
const dutySort=(a,b)=>(a.time||'99').localeCompare(b.time||'99');
function dutiesFor(wid,d){
  const on=S.duties.filter(x=>x.workerId===wid&&dutyOn(x,d));
  // εκκρεμότητες: «μία φορά» υπενθυμίσεις που πέρασαν χωρίς να γίνουν, μόνο στη σημερινή (ή την επόμενη εργάσιμη) μέρα.
  // Όσες τσεκαρίστηκαν σήμερα μένουν ορατές ως «έγινε» μέχρι να τελειώσει η μέρα.
  const late=d===nextWork(TODAY)?S.duties.filter(x=>x.workerId===wid&&x.freq==='once'&&x.date<d&&x.date>=add(d,-60)&&(!isDone(x,x.date)||S.dutyDone[doneKey(x,x.date)]===d)).map(x=>({...x,late:x.date})):[];
  return [...late,...on.sort(dutySort)];
}

/* ---------- Καιρός ----------
   Πρόγνωση από το Open-Meteo (δωρεάν, χωρίς κλειδί): 7 μέρες πίσω και 16 μπροστά, ανά περιοχή έργου.
   Μια εργασία με «θέλει στεγνή μέρα» δεν μπαίνει στο πρόγραμμα όταν στο έργο της αναμένεται βροχή. */
let WX=null;
const setWeather=w=>{WX=w&&w.locs?w:null};
const getWeather=()=>WX;
function wxDefaults(){return {on:true,place:'Θεσσαλονίκη',lat:40.6403,lon:22.9439,minProb:50,minMm:1}}
const wxCfg=()=>Object.assign(wxDefaults(),(S&&S.settings&&S.settings.wx)||{});
const hasLL=o=>!!o&&o.lat!=null&&o.lon!=null&&o.lat!==''&&o.lon!==''&&isFinite(o.lat)&&isFinite(o.lon);
const locKey=(lat,lon)=>(+lat).toFixed(2)+','+(+lon).toFixed(2);
// πού είναι ένα έργο για τον καιρό: η δική του περιοχή ή η έδρα της εταιρείας
function projLoc(pid){const p=P(pid);if(hasLL(p))return {lat:+p.lat,lon:+p.lon,place:p.place||''};const c=wxCfg();return {lat:+c.lat,lon:+c.lon,place:c.place||''}}
// τα σημεία που χρειάζονται πρόγνωση: η έδρα και κάθε έργο με ανοιχτές εργασίες
function wxLocs(){
  const m={},put=l=>{const k=locKey(l.lat,l.lon);if(!m[k])m[k]={key:k,lat:+(+l.lat).toFixed(2),lon:+(+l.lon).toFixed(2)}};
  put(projLoc(''));
  S.projects.forEach(p=>{if(S.tasks.some(t=>t.projectId===p.id&&t.status!=='done'))put(projLoc(p.id))});
  return Object.values(m);
}
const WX_API='https://api.open-meteo.com/v1/forecast';
const wxUrl=(locs,base)=>(base||WX_API)+'?latitude='+locs.map(l=>l.lat).join(',')+'&longitude='+locs.map(l=>l.lon).join(',')
  +'&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Europe%2FAthens&past_days=7&forecast_days=16';
// η απάντηση του Open-Meteo (ένα σημείο ή λίστα με τη σειρά των locs) σε {at, locs:{key:{days:{ημερομηνία:{…}}}}}
function wxParse(j,locs){
  const arr=Array.isArray(j)?j:[j],n=v=>v==null||v===''||!isFinite(v)?null:+v,out={at:new Date().toISOString(),locs:{}};
  arr.forEach((r,i)=>{const l=locs[i],d=r&&r.daily;if(!l||!d||!Array.isArray(d.time))return;const days={};
    d.time.forEach((t,k)=>{const g=a=>n(d[a]&&d[a][k]);days[t]={mm:g('precipitation_sum'),p:g('precipitation_probability_max'),code:g('weather_code'),tmax:g('temperature_2m_max'),tmin:g('temperature_2m_min')}});
    out.locs[l.key]={lat:l.lat,lon:l.lon,days}});
  if(!Object.keys(out.locs).length)throw new Error('Η πρόγνωση καιρού δεν είχε δεδομένα.');
  return out;
}
// η πρόγνωση μιας μέρας για ένα έργο ('' = η έδρα)
function wxDay(pid,d){const l=projLoc(pid),x=WX&&WX.locs[locKey(l.lat,l.lon)];return x&&x.days[d]||null}
const isWet=(f,c)=>!!f&&(+f.mm||0)>=(+c.minMm||0)&&(f.p==null||f.p>=(+c.minProb||0));
// βρέχει σε ένα έργο μια μέρα; πρώτα ό,τι όρισες εσύ για τη μέρα, μετά η πρόγνωση
function rainy(pid,d){
  const m=S.wxMark&&S.wxMark[d];if(m==='rain')return true;if(m==='dry')return false;
  const c=wxCfg();return c.on!==false&&isWet(wxDay(pid,d),c);
}
// κωδικοί καιρού WMO σε εικονίδιο και λέξη
function wxKind(code){
  const c=+code;
  if(code==null||!isFinite(c))return {k:'cloud',l:'Χωρίς πρόγνωση'};
  if(c===0)return {k:'sun',l:'Λιακάδα'};
  if(c<=2)return {k:'pcloud',l:'Λίγα σύννεφα'};
  if(c===3)return {k:'cloud',l:'Συννεφιά'};
  if(c===45||c===48)return {k:'fog',l:'Ομίχλη'};
  if(c>=51&&c<=57)return {k:'rain',l:'Ψιχάλα'};
  if((c>=61&&c<=67)||(c>=80&&c<=82))return {k:'rain',l:'Βροχή'};
  if((c>=71&&c<=77)||c===85||c===86)return {k:'snow',l:'Χιόνι'};
  if(c>=95)return {k:'storm',l:'Καταιγίδα'};
  return {k:'cloud',l:'Συννεφιά'};
}
// η πρόγνωση σε σύντομο κείμενο, π.χ. «Βροχή (πιθανότητα βροχής 80%), 12–18°C»
function wxText(f){
  if(!f)return '';
  const k=wxKind(f.code);
  return k.l+(f.p!=null&&f.p>=20?' (πιθανότητα βροχής '+Math.round(f.p)+'%)':'')+(f.tmin!=null&&f.tmax!=null?', '+Math.round(f.tmin)+'–'+Math.round(f.tmax)+'°C':'');
}

/* ---------- Ραντεβού ----------
   Συναντήσεις με πελάτες, αυτοψίες, επιμετρήσεις, υπηρεσίες. Μπορούν να πάνε πολλοί μαζί (π.χ. ο εργολάβος με τον ηλεκτρολόγο).
   Δεν κοστίζουν μεροκάματο και δεν αλλάζουν τα συνεργεία: μπαίνουν σαν επιπλέον γραμμή στο πρόγραμμα του καθενός. */
const OWNER='owner';
const ownerName=()=>(S&&S.settings&&S.settings.ownerName)||'Εργολάβος';
const apPerson=id=>id===OWNER?{id:OWNER,name:ownerName()}:W(id);
// ο εργολάβος ως παραλήπτης: παίρνει Viber με τα ραντεβού και τις υπενθυμίσεις του, αν έχει δοθεί κινητό στις Ρυθμίσεις
const ownerW=()=>{const ph=(S&&S.settings&&S.settings.ownerPhone)||'';return {id:OWNER,name:ownerName(),phone:ph,role:'owner',specialtyId:'',off:[],viber:!!ph}};
const anyone=id=>id===OWNER?ownerW():W(id);
const apptsOn=(d,wid)=>(S.appts||[]).filter(a=>a.date===d&&(!wid||(a.people||[]).includes(wid))).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
const apTime=a=>a.time?a.time+(a.end?'–'+a.end:''):'Χωρίς ώρα';
const apMin=t=>{const m=/^(\d\d):(\d\d)$/.exec(t||'');return m?+m[1]*60+ +m[2]:null};
// ποιοι από τα άτομα ενός ραντεβού έχουν άλλο ραντεβού την ίδια ώρα ή άδεια εκείνη τη μέρα
function apConflicts(a){
  const span=x=>{const s=apMin(x.time);if(s==null)return [0,1440];const e=apMin(x.end);return [s,e!=null&&e>s?e:s+60]};
  const [s,e]=span(a),out=[];
  (a.people||[]).forEach(id=>{
    const p=apPerson(id);if(!p)return;
    if(id!==OWNER&&isOff(p,a.date))out.push({id,name:p.name,why:'άδεια'});
    (S.appts||[]).forEach(b=>{if(b.id===a.id||b.date!==a.date||b.status==='done'||!(b.people||[]).includes(id))return;
      const [s2,e2]=span(b);if(s<e2&&s2<e)out.push({id,name:p.name,why:'«'+b.title+'» '+apTime(b)})});
  });
  return out;
}

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
    const jobs=[],wet=[];
    // όσες θέλουν στεγνή μέρα και στο έργο τους βρέχει μένουν για την επόμενη στεγνή· το συνεργείο πάει αλλού
    const ready=open.filter(t=>{
      if(rem[t.id]<=0)return false;if(forced[t.id])return true;
      if(!((!t.earliest||t.earliest<=day)&&depOk(t,day)))return false;
      if(t.dry&&rainy(t.projectId,day)){wet.push(t);(waiting[day]=waiting[day]||[]).push({task:t,reason:'Βροχή: θέλει στεγνή μέρα',rain:true});return false}
      return true})
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
      jobs.push({task:t,lead,sub,helpers,forced:new Set(fx.map(w=>w.id)),extra:new Set(),short:helpers.length<need,dayNo:(+t.days||1)-rem[t.id]+1,rain:!!t.dry&&rainy(t.projectId,day)});
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
    byDay[day]={jobs,gen,wet};
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
  const w=anyone(wid)||{id:wid};const res={off:isOff(w,d),job:null,lead:false,jobs:[],gen:false,forced:!!ov(d,wid)&&ov(d,wid).type!=='off',duties:dutiesFor(wid,d),pm:pmProjects(wid,d),appts:apptsOn(d,wid)};
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
const hasJob=(R,wid,days)=>days.some(d=>whatDoes(R,wid,d).jobs.length>0||apptsOn(d,wid).length>0);
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
  else if(w.id===OWNER);
  else if(isOffice(w))s+=(SP(w.specialtyId)?.name||'Γραφείο')+'\n';
  else if(isExt(w))s+='Καμία εργασία\n';
  else s+='Χωρίς ανάθεση (θα ενημερωθείς)\n';
  x.appts.forEach(a=>{s+='Ραντεβού '+apTime(a)+': '+a.title+(a.client?', '+a.client:'')+(a.place?' ('+a.place+')':'')+'\n';
    const o=(a.people||[]).filter(id=>id!==w.id).map(apPerson).filter(Boolean).map(p=>short(p.name));if(o.length)s+='  Μαζί: '+o.join(', ')+'\n'});
  if(x.duties.length)s+='Υπενθυμίσεις:\n'+x.duties.map(dutyLine).join('');
  return s;
}
const dutyLine=t=>'  • '+(t.time?t.time+' ':'')+t.title+(t.projectId&&P(t.projectId)?' ('+P(t.projectId).name+')':'')+(t.late?', εκκρεμεί από '+fmt(t.late):'')+'\n';
// ό,τι μετρά για να μάθει ένας εργαζόμενος ότι άλλαξε η μέρα του: πού, τι και με ποιον ρόλο (όχι ποιοι άλλοι είναι στο συνεργείο)
const dayKey=(R,w,d)=>dayBlock(R,w,d).split('\n').filter(l=>!/^\s+Μαζί:/.test(l)).join('\n');
// υπογραφή σε κάθε μήνυμα προς το προσωπικό
const SIGN0='\n✅ ERGODO · Get the job Done';
const sign=()=>(S&&S.settings&&S.settings.company&&S.settings.company.name?'\n'+S.settings.company.name:'')+SIGN0;
function personText(R,w,ws){
  let s='ΠΡΟΓΡΑΜΜΑ ΕΒΔΟΜΑΔΑΣ '+fmtS(ws)+' – '+fmtS(add(ws,6))+'\n'+w.name+'\n';
  weekDays(ws).forEach(d=>{s+='\n'+fmt(d)+': '+(dayBlock(R,w,d)||'—\n')});
  return s+sign();
}
// το καθημερινό μήνυμα που φεύγει αυτόματα
// ο καιρός της μέρας εκεί που δουλεύει (στο πρώτο έργο του, αλλιώς στην έδρα)
function wxFor(R,wid,d){const x=whatDoes(R,wid,d);if(x.off||wxCfg().on===false)return null;return wxDay(x.jobs.length?x.jobs[0].job.task.projectId:x.pm.length?x.pm[0]:'',d)}
function personDayText(R,w,d,upd){
  const f=wxFor(R,w.id,d);
  const hi=w.id===OWNER&&!(S.settings&&S.settings.ownerName)?'Καλημέρα! ':'Γεια σου '+String(w.name).split(/\s+/)[0]+'! ';
  // ώρα έναρξης από τις Ρυθμίσεις, μόνο για όσους πάνε σε εργοτάξιο ή αποθήκη
  const x=whatDoes(R,w.id,d),st=S.settings&&S.settings.startTime;
  const start=st&&!x.off&&(x.jobs.length||x.gen)?'Έναρξη: '+st+'\n':'';
  return hi+(upd?'Άλλαξε το πρόγραμμά σου για ':'Το πρόγραμμά σου για ')+fmt(d)+':\n\n'+start+dayBlock(R,w,d)+(f?'\nΚαιρός: '+wxText(f)+'\n':'')+sign();
}
// η εβδομάδα ενός εργαζόμενου σε δεδομένα, για τη σελίδα «Το πρόγραμμά μου».
// Περιέχει μόνο ό,τι χρειάζεται ο ίδιος: πού, τι και με ποιους. Όχι μεροκάματα ή κόστη.
function personWeek(R,w,ws){
  return {name:w.name,specialty:SP(w.specialtyId)?.name||'',weekStart:ws,days:weekDays(ws).map(d=>{
    const x=whatDoes(R,w.id,d),o={date:d,off:x.off,items:[],duties:[]};
    if(x.off)return o;
    const f=wxFor(R,w.id,d);if(f){const k=wxKind(f.code);o.wx={k:k.k,text:wxText(f),wet:isWet(f,wxCfg())}}
    x.jobs.forEach(({job,lead})=>{const p=P(job.task.projectId);o.items.push({kind:'job',project:p.name,location:p.location||'',color:p.color||'',task:job.task.title,lead,
      with:[job.lead,...job.helpers].filter(q=>q&&q.id!==w.id).map(q=>q.name)})});
    if(!x.jobs.length){
      if(x.gen)o.items.push({kind:'gen',title:'Αποθήκη και συντήρηση εξοπλισμού'});
      else if(x.pm.length)x.pm.forEach(pid=>{const p=P(pid);o.items.push({kind:'pm',project:p.name,location:p.location||'',color:p.color||'',task:'Διαχείριση έργου'})});
      else if(isOffice(w))o.items.push({kind:'office',title:SP(w.specialtyId)?.name||'Γραφείο'});
      else o.items.push({kind:'none',title:isExt(w)?'Καμία εργασία':'Χωρίς ανάθεση ακόμη. Θα ενημερωθείς.'});
    }
    o.duties=x.duties.map(t=>({title:t.title,project:t.projectId?P(t.projectId)?.name||'':'',time:t.time||'',late:t.late||'',notes:t.notes||''}));
    o.appts=x.appts.map(a=>({time:apTime(a),title:a.title,client:a.client||'',phone:a.phone||'',place:a.place||'',done:a.status==='done',
      with:(a.people||[]).filter(id=>id!==w.id).map(apPerson).filter(Boolean).map(p=>p.name)}));
    return o})};
}
root.ErgoCore={setState,today,ROLES,DAYS,MONTHS,upGR,pad,ds,pd,add,dow,fmt,fmtS,eur,h,uid,short,weekStart,officeDemo,demo,migrate,
  setWeather,getWeather,wxDefaults,wxCfg,hasLL,locKey,projLoc,wxLocs,wxUrl,wxParse,wxDay,isWet,rainy,wxKind,wxText,wxFor,
  easter,HOLIDAYS,holDefaults,holName,sign,
  OWNER,ownerName,apPerson,apptsOn,apTime,apConflicts,apDemo,ownerW,anyone,monthDay,doneKey,isDone,remDemo,dutyLine,
  byId,P,W,T,SP,PSEUDO,pname,isWork,nextWork,isOffice,isPM,pmProjects,managersOf,ov,isOff,rate,dutyOn,dutiesFor,schedule,whatDoes,taskIdsOf,hasJob,isExt,dayCost,extDemo,weekDays,dayBlock,dayKey,personText,personDayText,personWeek};
})(typeof window!=='undefined'?window:globalThis);
