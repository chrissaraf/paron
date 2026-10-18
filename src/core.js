/* PARON: κοινή λογική για browser και server */
(function(root){
let S=null;
// όνομα και σύνθημα της εφαρμογής σε ένα σημείο, για εύκολη μετονομασία
const BRAND={name:'PARON',tag:'ΟΛΟΙ ΣΤΗ ΘΕΣΗ ΤΟΥΣ',mark:3,site:'paron.gr'};   // mark: ποιο γράμμα του ονόματος γίνεται ο κύκλος με το άτομο
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
// κλητική του μικρού ονόματος για τον χαιρετισμό: Γιώργος → Γιώργο, Αλέξανδρος → Αλέξανδρε, Βασίλης → Βασίλη, Κώστας → Κώστα.
// Στα -ος: δισύλλαβα σε -ο, τα υπόλοιπα σε -ε. Οι συλλαβές μετριούνται με τις διφθόγγους και το «ι/υ» πριν από φωνήεν (Γιώρ-γος, Στέ-λιος).
const VOW='αεηιουωάέήίόύώϊϋΐΰ';
function sylls(w){let s=String(w).toLowerCase().replace(/ς/g,'σ');
  s=s.replace(/[αεο][ιυίύ]|υ[ιί]/g,'V');
  s=s.replace(new RegExp('(^|[^'+VOW+'V])[ιυ](?=['+VOW+'V])','g'),'$1');
  return (s.match(new RegExp('['+VOW+'V]','g'))||[]).length}
function voc(name){const n=String(name||'').trim().split(/\s+/)[0]||'';const m=n.match(/^(.*[^\s])([οόΟ])([ςσΣ])$|^(.*)([ηήαάΗΑ])([ςσΣ])$/);if(!m)return n;
  if(m[4]!=null)return m[4]+m[5];
  const up=m[2]==='Ο',e=sylls(n)<=2?'ο':'ε';return m[1]+(up?e.toUpperCase():m[2]==='ό'?(e==='ο'?'ό':'έ'):e)}
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
// demo βαθμοί εργαζομένων και δυσκολία εργασιών
const RATE_DEMO={w:{w1:5,w2:4,w3:3,w4:2,w5:4,w6:4,w7:2,w8:5,w9:3,w10:4,w11:3,w12:5,w13:3,w14:4,w15:3,w16:3,w17:2},
  t:{t0:5,t1:4,t3:3,t4:3,t5:4,t6:3,t7:4,t9:4,t11:2,t12:2,t13:5,t14:2,t15:2,t18:5,t19:4}};
// demo προθεσμίες παράδοσης, σε μέρες από σήμερα
const DUE_DEMO={p1:17,p2:28,p3:12};
// demo: η ολοκληρωμένη εργασία τελείωσε μέσα στην εβδομάδα, για να φαίνεται στη σύνοψη
const doneDemo=()=>TODAY>weekStart(TODAY)?add(TODAY,-1):TODAY;
// demo διαθεσιμότητα και δεύτερη ειδικότητα
const AVAIL_DEMO={days:{w7:[1,2,3,4,5],w17:[1,3,5]},spec2:{w13:'s2',w9:'s4'}};
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
    {id:'p1',name:'Πολυκατοικία Καλαμαριάς',location:'Κομνηνών 24, Καλαμαριά',budget:24000,color:'p1',managers:['w19'],clientId:'c1',...WX_DEMO.p1,share:clientDemo()},
    {id:'p2',name:'Μονοκατοικία Πανοράματος',location:'Αγ. Αντωνίου 7, Πανόραμα',budget:9500,color:'p2',managers:['w19','w21'],clientId:'c2',...WX_DEMO.p2},
    {id:'p3',name:'Κατάστημα Τσιμισκή',location:'Τσιμισκή 112, Θεσσαλονίκη',budget:5200,color:'p3',managers:['w21'],clientId:'c3'},
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
  workers.forEach(w=>{if(RATE_DEMO.w[w.id])w.rating=RATE_DEMO.w[w.id]});projects.forEach(p=>{if(DUE_DEMO[p.id]!=null)p.due=add(TODAY,DUE_DEMO[p.id])});workers.forEach(w=>{if(AVAIL_DEMO.days[w.id])w.days=AVAIL_DEMO.days[w.id].slice();if(AVAIL_DEMO.spec2[w.id])w.spec2=AVAIL_DEMO.spec2[w.id]});tasks.forEach(t=>{if(RATE_DEMO.t[t.id])t.diff=RATE_DEMO.t[t.id];if(t.status==='done')t.doneOn=doneDemo()});
  const xw=EXPW_DEMO();workers.forEach(w=>{if(xw[w.id])w.exp=xw[w.id]});
  profitDemo({projects,tasks});attDemoSites({projects});
  return {v:2,profitDemo:true,attSeed:true,attDemo:true,att:[],diarySeed:true,diary:diaryDemo([1,2,3,4,5,6]),wxLog:wxLogDemo([1,2,3,4,5,6]),eqDemo:true,equip:eqDemo(),fieldDemo:true,field:fieldDemo(),sumDemo:true,extDemo:true,rateDemo:true,dueDemo:true,availDemo:true,extEmp:true,wxDemo:true,apDemo:true,remDemo:true,cpay:[],wxMark:{},appts:apDemo([1,2,3,4,5,6]).map(a=>({...a,clientId:CLI_DEMO.a[a.id]})),cliDemo:true,clients:cliDemo(),settings:{start:weekStart(TODAY),workdays:[1,2,3,4,5,6],fillIdle:true,autoSend:false,sendTime:'06:30',wx:wxDefaults(),hol:holDefaults(),closed:[],payFrom:weekStart(TODAY),payCarry:true,payDay:6,payMethod:'cash',plan:'ergotaxio',yard:{lat:40.65592,lon:22.86531,r:200}},specialties:[...sp,...o.specialties],workers:[...workers,...o.workers],projects,tasks,duties:[...o.duties,...remDemo([1,2,3,4,5,6])],overrides:{},payments:{},dutyDone:{}};
}
/* ---------- Αρχεία Excel ----------
   Μικρός συγγραφέας .xlsx χωρίς βιβλιοθήκες: ZIP χωρίς συμπίεση με τα ελάχιστα XML του Excel.
   sheets: [{name, rows:[[κελί]], widths:[πλάτος], freeze:γραμμές}], κελί: κείμενο, αριθμός, null ή {v, s:'b'|'m'|'bm'}
   (b = έντονα, m = ποσό με δύο δεκαδικά). */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
function zipStore(files){
  const enc=new TextEncoder(),parts=[],cd=[];let off=0;
  const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  for(const f of files){const nm=enc.encode(f.name),d=typeof f.data==='string'?enc.encode(f.data):f.data,c=crc32(d);
    const head=[...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(d.length),...u32(d.length),...u16(nm.length),...u16(0)];
    parts.push(Uint8Array.from([0x50,0x4b,3,4,...head]),nm,d);
    cd.push(Uint8Array.from([0x50,0x4b,1,2,...u16(20),...head,...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nm);
    off+=30+nm.length+d.length}
  const cdl=cd.reduce((s,x)=>s+x.length,0);
  const end=Uint8Array.from([0x50,0x4b,5,6,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cdl),...u32(off),...u16(0)]);
  const all=[...parts,...cd,end],out=new Uint8Array(all.reduce((s,x)=>s+x.length,0));let i=0;for(const x of all){out.set(x,i);i+=x.length}
  return out;
}
const xesc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
const colName=i=>{let s='';i++;while(i){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
function xlsx(sheets){
  const used=new Set(),names=sheets.map(sh=>{let n=String(sh.name||'Φύλλο').replace(/[\[\]:*?\/\\]/g,' ').trim().slice(0,31)||'Φύλλο',b=n,k=2;while(used.has(n.toLowerCase()))n=b.slice(0,28)+' '+k++;used.add(n.toLowerCase());return n});
  const ST={b:1,m:2,bm:3};
  const sheetXml=sh=>{const rows=(sh.rows||[]).map((r,ri)=>`<row r="${ri+1}">`+(r||[]).map((c,ci)=>{if(c==null||c==='')return '';const o=typeof c==='object'?c:{v:c},s=ST[o.s]?` s="${ST[o.s]}"`:'',ref=colName(ci)+(ri+1);
      return typeof o.v==='number'&&isFinite(o.v)?`<c r="${ref}"${s}><v>${o.v}</v></c>`:`<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${xesc(o.v)}</t></is></c>`}).join('')+'</row>').join('');
    const fr=sh.freeze?`<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sh.freeze}" topLeftCell="A${sh.freeze+1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`:'';
    const cols=sh.widths&&sh.widths.length?'<cols>'+sh.widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')+'</cols>':'';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${fr}${cols}<sheetData>${rows}</sheetData></worksheet>`};
  const files=[
    {name:'[Content_Types].xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${names.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`},
    {name:'_rels/.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
    {name:'xl/workbook.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n,i)=>`<sheet name="${xesc(n)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`},
    {name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${names.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
    {name:'xl/styles.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="4" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`},
    ...sheets.map((sh,i)=>({name:`xl/worksheets/sheet${i+1}.xml`,data:sheetXml(sh)}))];
  return zipStore(files);
}
/* ---------- Κατάσταση για τον λογιστή ----------
   Οι μέρες κάθε εργαζόμενου σε κάθε έργο μέσα στον μήνα, μέχρι σήμερα, για την ΑΠΔ. Η εφαρμογή δεν υποβάλλει τίποτα στον e-ΕΦΚΑ.
   Μισή μέρα (0,5) σημαίνει ότι την ίδια μέρα δούλεψε και σε άλλο έργο. */
const okAmka=x=>/^\d{11}$/.test(String(x||'').replace(/\s/g,''));
function accReport(R,ym){
  const [y,m]=ym.split('-').map(Number),first=ds(new Date(y,m-1,1)),last=ds(new Date(y,m,0)),upto=last<TODAY?last:TODAY;
  const dates=[];for(let d=first;d<=last;d=add(d,1))dates.push(d);
  const A=first>TODAY?[]:R.asg.filter(a=>a.date>=first&&a.date<=upto),G={};
  A.forEach(a=>{const w=W(a.workerId);if(!w||isExt(w))return;const g=G[a.projectId]=G[a.projectId]||{};const r=g[w.id]=g[w.id]||{};r[a.date]=Math.round(((r[a.date]||0)+(a.share||1))*100)/100});
  const order=[...S.projects.map(p=>p.id),'gen','office'].filter(pid=>G[pid]);
  const groups=order.map(pid=>{const p=P(pid);
    const rows=S.workers.filter(w=>G[pid][w.id]).map(w=>{const d=G[pid][w.id];return {w,amka:(w.amka||'').replace(/\s/g,''),spec:(SP(w.specialtyId)||{}).name||'',d,n:Math.round(Object.values(d).reduce((s,x)=>s+x,0)*100)/100}});
    return {pid,name:pname(pid),amoe:p?(p.amoe||'').trim():'',location:p?p.location||'':'',site:!!p,rows,n:Math.round(rows.reduce((s,r)=>s+r.n,0)*100)/100}});
  const seen=new Set(),noAmka=[];groups.forEach(g=>g.rows.forEach(r=>{if(!okAmka(r.amka)&&!seen.has(r.w.id)){seen.add(r.w.id);noAmka.push(r.w)}}));
  return {ym,first,last,upto,dates,groups,noAmka,noAmoe:groups.filter(g=>g.site&&!g.amoe).map(g=>P(g.pid))};
}
/* ---------- Οδηγός πρώτης ρύθμισης ----------
   Προτάσεις ανά κλάδο: ειδικότητες έργων και γραφείου. Σήμερα μόνο οι κατασκευές· άλλοι κλάδοι μπαίνουν εδώ ως νέο κλειδί. */
const PRESETS={build:{name:'Κατασκευές',
  site:['Χτίστες','Σοβατζήδες','Ηλεκτρολόγοι','Υδραυλικοί','Πλακάδες','Ελαιοχρωματιστές','Καλουπατζήδες','Σιδεράδες','Μονωτές','Γυψοσανιδάδες','Αλουμινάδες'],
  office:[['Γραμματεία'],['Διαχείριση έργων',true],['Ταμείο και λογιστήριο'],['Εξωτερικός υπάλληλος']]}};
const GEN={id:'gen',name:'Γενικοί βοηθοί'};
// άδεια δεδομένα για νέα εταιρεία: κρατά τις ρυθμίσεις (πακέτο, λειτουργίες, καιρό, αργίες…) και το ιστορικό αλλαγών
// --- εξοπλισμός, οχήματα και λήξεις (πακέτο Εργοτάξιο) ---
// S.equip = [{id,name,kind,code,projectId,holder,notes,exp:[{id,label,due,every}]}]: πού βρίσκεται κάθε μηχάνημα και όχημα και τι λήγει.
// Λήξεις έχουν και οι άνθρωποι (w.exp: άδεια χειριστή, ιατρικές εξετάσεις, εκπαιδεύσεις). every = μήνες ως την επόμενη ανανέωση.
const EQ_KINDS=[['veh','Όχημα'],['mach','Μηχάνημα'],['tool','Εργαλείο και ικρίωμα'],['other','Άλλο']];
const EXP_LABELS={veh:['ΚΤΕΟ','Ασφάλεια','Τέλη κυκλοφορίας','Κάρτα καυσαερίων','Σέρβις'],mach:['Πιστοποίηση','Ασφάλεια','Τεχνικός έλεγχος','Σέρβις'],tool:['Έλεγχος καταλληλότητας'],other:[],person:['Άδεια χειριστή μηχανημάτων','Δίπλωμα οδήγησης','Ιατρικές εξετάσεις','Εκπαίδευση ασφάλειας']};
const expWarn=()=>+((S.settings&&S.settings.expWarn)||30);
const expIn=d=>Math.round((pd(d)-pd(TODAY))/864e5);
const expState=d=>{const n=expIn(d);return n<0?'bad':n<=expWarn()?'warn':'ok'};
const expWhen=d=>{const n=expIn(d);return n<0?(n===-1?'έληξε χθες':'έληξε πριν από '+(-n)+' μέρες'):n===0?'λήγει σήμερα':n===1?'λήγει αύριο':'σε '+n+' μέρες'};
// όλες οι λήξεις, με αυτό που αφορούν, από την πιο κοντινή
function expAll(){const xs=[];
  (S.equip||[]).forEach(e=>(e.exp||[]).forEach(x=>{if(x.due)xs.push({x,e,name:e.name})}));
  S.workers.forEach(w=>(w.exp||[]).forEach(x=>{if(x.due)xs.push({x,w,name:w.name})}));
  return xs.sort((a,b)=>a.x.due.localeCompare(b.x.due))}
const expSoon=days=>expAll().filter(o=>expIn(o.x.due)<=(days==null?expWarn():days));
// επόμενη λήξη μετά από ανανέωση: από την παλιά ημερομηνία (ή από σήμερα αν έχει περάσει πολύ), με τους μήνες της επανάληψης
function expNext(x){const m=+x.every||12;let d=pd(x.due&&x.due>add(TODAY,-60)?x.due:TODAY);const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+m);
  d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));return ds(d)}
const eqWhere=e=>e.projectId&&P(e.projectId)?P(e.projectId).name:'Αποθήκη';
function eqDemo(){const t=n=>add(TODAY,n);
  return [{id:'e1',name:'Φορτηγάκι Iveco Daily',kind:'veh',code:'ΝΗΖ-4521',projectId:'p1',holder:'w1',notes:'',exp:[{id:'x1',label:'ΚΤΕΟ',due:t(9),every:24},{id:'x2',label:'Ασφάλεια',due:t(96),every:12},{id:'x3',label:'Τέλη κυκλοφορίας',due:'',every:12}]},
    {id:'e2',name:'Ανυψωτικό JCB 3CX',kind:'mach',code:'ΜΕ 128734',projectId:'p2',holder:'',notes:'Χειριστής μόνο με άδεια.',exp:[{id:'x4',label:'Πιστοποίηση',due:t(-3),every:12},{id:'x5',label:'Ασφάλεια',due:t(210),every:12}]},
    {id:'e3',name:'Μπετονιέρα 350 λίτρων',kind:'mach',code:'',projectId:'p1',holder:'',notes:'',exp:[]},
    {id:'e4',name:'Σκαλωσιά 120 τ.μ.',kind:'tool',code:'',projectId:'p1',holder:'',notes:'Τα πλαίσια είναι μετρημένα: 48.',exp:[{id:'x6',label:'Έλεγχος καταλληλότητας',due:t(48),every:6}]},
    {id:'e5',name:'Κομπρεσέρ Atlas Copco',kind:'mach',code:'',projectId:'',holder:'',notes:'',exp:[{id:'x7',label:'Σέρβις',due:t(150),every:12}]}]}
// λήξεις προσωπικού στο demo
const EXPW_DEMO=()=>({w1:[{id:'x8',label:'Ιατρικές εξετάσεις',due:add(TODAY,21),every:12}],w2:[{id:'x9',label:'Άδεια χειριστή μηχανημάτων',due:add(TODAY,300),every:60}]});
// --- κέρδος ανά έργο και υλικά πριν την εργασία (πακέτο Εργοτάξιο) ---
// p.contract = τι πληρώνει ο πελάτης χωρίς ΦΠΑ. p.costs = [{id,date,kind,desc,sup,amount,task}]: υλικά, άλλα έξοδα και πρόσθετες εργασίες που πληρώνει ο πελάτης.
// t.mat = {what,lead,est,ordered,sup}: τι υλικά θέλει η εργασία, πόσες μέρες πριν ξεκινήσει παραγγέλνονται, εκτίμηση κόστους, πότε παραγγέλθηκαν.
const COST_K=[['mat','Υλικά'],['exp','Άλλο έξοδο'],['inc','Πρόσθετη εργασία']];
const LOW_M=10;   // % κέρδους κάτω από το οποίο το έργο θέλει προσοχή
const isJob=w=>isExt(w)&&w.pay==='job';
// τα οικονομικά ενός έργου: τι έχει κοστίσει ως σήμερα και τι θα κοστίσει όταν τελειώσει με το τωρινό πρόγραμμα
function profitOf(R,p){
  const sum=(xs,f)=>xs.reduce((s,x)=>s+(+f(x)||0),0);
  const A=R.asg.filter(a=>a.projectId===p.id&&!a.job),now=a=>a.date<=TODAY;
  const st=A.filter(a=>!isExt(W(a.workerId))),ex=A.filter(a=>isExt(W(a.workerId)));
  // κατ' αποκοπή: όλη η τιμή της εργασίας· ως σήμερα όσο αναλογεί στις μέρες που δούλεψε (ή όλη αν τελείωσε)
  const jobs=S.tasks.filter(t=>t.projectId===p.id&&isJob(W(t.responsibleId))),jA=R.asg.filter(a=>a.projectId===p.id&&a.job);
  const jobNow=t=>t.status==='done'?+t.price||0:Math.min(+t.price||0,sum(jA.filter(a=>a.taskId===t.id&&now(a)),a=>a.wage));
  const lab={now:sum(st.filter(now),a=>a.wage),all:sum(st,a=>a.wage)};
  const par={now:sum(ex.filter(now),a=>a.wage)+sum(jobs,jobNow),all:sum(ex,a=>a.wage)+sum(jobs,t=>t.price)};
  const C=p.costs||[],kind=k=>sum(C.filter(c=>c.kind===k),c=>c.amount);
  const mat=kind('mat'),oth=kind('exp'),inc=kind('inc');
  // υλικά που δεν έχουν παραγγελθεί ακόμη: μετρά η εκτίμηση της εργασίας
  const est=hasF('materials')?sum(S.tasks.filter(t=>t.projectId===p.id&&t.status!=='done'&&matOn(t)&&!t.mat.ordered),t=>t.mat.est):0;
  const contract=+p.contract||0,rev=contract+inc;
  const spent=lab.now+par.now+mat+oth,cost=lab.all+par.all+mat+oth+est;
  const profit=rev-cost,margin=rev?profit/rev*100:null;
  const unpl=R.unplanned.filter(t=>t.projectId===p.id).length;
  return {contract,inc,rev,lab,par,mat,oth,est,spent,cost,profit,margin,unpl,st:!rev?'mute':profit<0?'bad':margin<LOW_M?'warn':'ok'}}
const pctS=n=>n==null?'—':String(Math.round(n)).replace('-','−')+'%';
function addCost(pid,c){const p=P(pid);if(!p)return null;p.costs=p.costs||[];
  const x={id:uid('c'),date:c.date||TODAY,kind:COST_K.some(k=>k[0]===c.kind)?c.kind:'exp',desc:String(c.desc||'').trim(),sup:String(c.sup||'').trim(),amount:Math.round((+c.amount||0)*100)/100,...(c.task?{task:c.task}:{})};
  p.costs.push(x);return x}
// υλικά πριν την εργασία
const matOn=t=>!!(t&&t.mat&&String(t.mat.what||'').trim());
const matLead=t=>{const n=+(t.mat&&t.mat.lead);return n>=0&&t.mat.lead!==''&&t.mat.lead!=null?n:3};
// ως πότε πρέπει να παραγγελθούν: τόσες μέρες πριν ξεκινήσει η εργασία στο πρόγραμμα
const matBy=(R,t)=>R.begin[t.id]?add(R.begin[t.id],-matLead(t)):null;
// όσα δεν έχουν παραγγελθεί και η προθεσμία τους είναι ως `upto` (ή έχει περάσει)
function matTodo(R,upto){return S.tasks.filter(t=>t.status!=='done'&&matOn(t)&&!t.mat.ordered&&R.begin[t.id])
  .map(t=>({t,by:matBy(R,t),b:R.begin[t.id]})).filter(x=>x.by<=(upto||add(TODAY,3))).sort((a,b)=>a.by.localeCompare(b.by)||a.b.localeCompare(b.b))}
const matState=x=>x.b<=TODAY?'bad':x.by<=TODAY?'warn':'ok';
const matWhen=x=>x.b<=TODAY?(x.b===TODAY?'η εργασία ξεκινά σήμερα':'η εργασία ξεκίνησε '+fmt(x.b)):x.by<TODAY?'έπρεπε να παραγγελθούν έως '+fmt(x.by):x.by===TODAY?'παραγγελία σήμερα':'παραγγελία έως '+fmt(x.by);
// «Παραγγέλθηκαν»: σημειώνεται στην εργασία και, αν δόθηκε ποσό, μπαίνει στα έξοδα του έργου
function orderMat(tid,o){const t=T(tid);if(!t||!matOn(t))return null;o=o||{};
  t.mat.ordered=o.date||TODAY;if(o.sup!=null)t.mat.sup=String(o.sup).trim();
  const amt=+o.amount||0;let c=null;if(amt>0&&hasF('profit'))c=addCost(t.projectId,{date:t.mat.ordered,kind:'mat',desc:t.mat.what,sup:t.mat.sup,amount:amt,task:t.id});
  return {t,c}}
// demo: τιμές συμβολαίων, έξοδα και υλικά (ημερομηνίες σε σχέση με σήμερα)
const PROFIT_DEMO={contract:{p1:32500,p2:18600,p3:9100},
  costs:{p1:[[-12,'mat','Σκυρόδεμα C25/30, 38 κ.μ.','Μπετόν Θεσσαλονίκης',3420],[-12,'exp','Αντλία σκυροδέματος','Μπετόν Θεσσαλονίκης',480],[-6,'mat','Τούβλα και κονίαμα 2ου ορόφου','Δομικά Υλικά Καλαμαριάς',3850],[-2,'mat','Σωλήνες και καλώδια 2ου','Ηλεκτρολογικά Παπαδόπουλος',1180]],
    p2:[[-5,'exp','Κάδοι μπάζων, 2 δρομολόγια','Ανακυκλώσεις Πανοράματος',360],[-3,'mat','Υλικά υδραυλικών μπάνιου','Υδραυλικά Σταυρίδης',940],[-1,'inc','Πέργκολα κήπου, συμφωνία με τον πελάτη','',1800]],
    p3:[[-4,'mat','Πλακάκια 80×80, 95 τ.μ.','Κεραμικά Βορείου',2450],[-4,'exp','Κάδος μπάζων','Ανακυκλώσεις Πανοράματος',180],[-2,'mat','Φωτιστικά οροφής LED, 24 τεμ.','Ηλεκτρολογικά Παπαδόπουλος',1320],[-5,'mat','Χρώματα καταστήματος','Χρώματα Βαρδάρη',410]]},
  mat:{t5:{what:'Τούβλα και κονίαμα 3ου ορόφου',lead:3,est:3700},t6:{what:'Πλακάκια και κόλλα κλιμακοστασίου',lead:7,est:1450},t10:{what:'Πλακάκια μπάνιου και κουζίνας, 42 τ.μ.',lead:4,est:2600},
    t11:{what:'Χρώματα και στόκοι',lead:2,est:640},t13:{what:'Πλακάκια 80×80 και κόλλα',lead:5,est:2450,ordered:-4,sup:'Κεραμικά Βορείου'},t15:{what:'Χρώματα καταστήματος',lead:2,est:420,ordered:-5,sup:'Χρώματα Βαρδάρη'}}};
function profitDemo(o){const P0=PROFIT_DEMO;
  (o.projects||[]).forEach(p=>{if(P0.contract[p.id]&&p.contract==null)p.contract=P0.contract[p.id];
    if(P0.costs[p.id]&&!(p.costs||[]).length)p.costs=P0.costs[p.id].map(([d,kind,desc,sup,amount],i)=>({id:'c'+p.id.slice(1)+i,date:add(TODAY,d),kind,desc,sup,amount}))});
  (o.tasks||[]).forEach(t=>{const m=P0.mat[t.id];if(m&&!t.mat)t.mat={...m,ordered:m.ordered!=null?add(TODAY,m.ordered):''}})}
// --- παρουσίες με GPS (πακέτο Εργοτάξιο) ---
// S.att = [{id,d,w,p,in,out,by,u,x,note}]: in/out = {t:'07:42',at,lat,lon,acc,m}. Η θέση διαβάζεται μόνο τη στιγμή του «Ήρθα»/«Έφυγα».
// p.site = {lat,lon,r}: το σημείο του εργοταξίου και πόσα μέτρα γύρω του μετράνε ως «στο εργοτάξιο».
const ATT_R=150,ATT_GEO=60,ATT_KEEP=400;   // μέτρα· μέρες που κρατιούνται οι συντεταγμένες· μέρες που κρατιούνται οι παρουσίες
const gpsOn=()=>hasF('gps');
const siteOf=p=>p&&p.site&&hasLL(p.site)?{lat:+p.site.lat,lon:+p.site.lon,r:+p.site.r>0?+p.site.r:ATT_R}:null;
// όσοι δεν είναι σε έργο εκείνη τη μέρα (αποθήκη, γενικές εργασίες): το σημείο της αποθήκης από τις Ρυθμίσεις
const yardOf=()=>siteOf({site:S.settings&&S.settings.yard});
const siteFor=pid=>pid?siteOf(P(pid)):yardOf();
function distM(a,b){const R0=6371000,rad=x=>x*Math.PI/180,dLa=rad(b.lat-a.lat),dLo=rad(b.lon-a.lon);
  const q=Math.sin(dLa/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLo/2)**2;return Math.round(2*R0*Math.asin(Math.min(1,Math.sqrt(q))))}
const distS=m=>m<1000?Math.round(m/10)*10+' μ.':(Math.round(m/100)/10).toString().replace('.',',')+' χλμ.';
// «40.58231, 22.95018» ή σύνδεσμος Google Maps (…@40.58,22.95,17z ή ?q=40.58,22.95)
function parseLL(s){s=String(s||'').trim();const m=/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/.exec(s)||/[?&](?:q|query|ll|destination)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i.exec(s)||/^(-?\d{1,2}[.,]\d+)\s*[,; ]\s*(-?\d{1,3}[.,]\d+)$/.exec(s);
  if(!m)return null;const lat=+String(m[1]).replace(',','.'),lon=+String(m[2]).replace(',','.');return lat>=-90&&lat<=90&&lon>=-180&&lon<=180?{lat,lon}:null}
const attList=()=>(S.att||[]).filter(r=>!r.x);
const attOf=(d,wid)=>attList().find(r=>r.d===d&&r.w===wid)||null;
// σε ποια έργα είναι ο εργαζόμενος εκείνη τη μέρα (με το πρόγραμμα)
const attProjects=(R,wid,d)=>[...new Set(R.asg.filter(a=>a.date===d&&a.workerId===wid&&a.projectId&&P(a.projectId)).map(a=>a.projectId))];
// απόσταση ενός σημείου από το εργοτάξιο: από τις συντεταγμένες όσο κρατιούνται, αλλιώς όπως καταγράφηκε
function attDist(r,pt){if(!pt)return null;const s=siteFor(r.p);if(s&&hasLL(pt))return distM(s,pt);return pt.m!=null?pt.m:null}
// πού ήταν: ok στο εργοτάξιο · far μακριά · nopos χωρίς θέση · nosite το έργο δεν έχει σημείο
function attWhere(r,pt){if(!pt)return null;const s=siteFor(r.p),m=attDist(r,pt);
  if(!hasLL(pt)&&pt.m==null)return {k:'nopos',m:null};if(!s)return {k:'nosite',m:null};return {k:m<=s.r?'ok':'far',m,yard:!r.p}}
const ATT_W={ok:['ok','στο εργοτάξιο'],far:['warn',''],nopos:['mute','χωρίς θέση'],nosite:['mute','χωρίς σημείο εργοταξίου']};
const attWS=x=>!x?'':x.k==='far'?distS(x.m)+' μακριά':x.k==='ok'&&x.yard?'στην αποθήκη':ATT_W[x.k][1];
const toMin=t=>{const m=/^(\d{1,2}):(\d{2})$/.exec(t||'');return m?+m[1]*60+ +m[2]:null};
const attMin=r=>{const a=toMin(r&&r.in&&r.in.t),b=toMin(r&&r.out&&r.out.t);return a!=null&&b!=null&&b>a?b-a:null};
const hrsS=m=>m==null?'—':Math.floor(m/60)+':'+pad(m%60);
const hrsL=m=>{const h0=Math.floor(m/60),mm=m%60;return (h0?h0+(h0===1?' ώρα':' ώρες'):'')+(h0&&mm?' ':'')+(mm||!h0?mm+' λεπτά':'')};
const hmOf=t=>pad(t.getHours())+':'+pad(t.getMinutes());
const tStr=m=>pad(Math.floor(m/60))+':'+pad(m%60);
// ο εργαζόμενος πατά «Ήρθα» ή «Έφυγα»· pos = {lat,lon,acc} ή null αν δεν δόθηκε θέση· at = η ώρα του server
function addAtt(R,w,k,pos,at,why){at=at||new Date();const d=ds(at),t=hmOf(at);S.att=S.att||[];
  if(!w||isOffice(w)||isExt(w))return {err:'Οι παρουσίες είναι για το προσωπικό των εργοταξίων.'};
  const pt={t,at:at.toISOString()};
  if(pos&&isFinite(pos.lat)&&isFinite(pos.lon)&&Math.abs(pos.lat)<=90&&Math.abs(pos.lon)<=180){pt.lat=Math.round(pos.lat*1e5)/1e5;pt.lon=Math.round(pos.lon*1e5)/1e5;if(isFinite(pos.acc))pt.acc=Math.round(Math.min(pos.acc,1e5))}
  else if(why)pt.why=String(why).slice(0,60);   // γιατί δεν δόθηκε θέση, όπως το είπε το κινητό
  let r=attOf(d,w.id);
  if(k==='in'){if(r&&r.in)return {err:'Έχεις ήδη δηλώσει ότι ήρθες στις '+r.in.t+'.'};
    // σε ποιο έργο: όπου είναι στο πρόγραμμα· με δύο έργα, το πιο κοντινό
    const ps=attProjects(R,w.id,d),near=xs=>hasLL(pt)?xs.map(id=>({id,s:siteOf(P(id))})).filter(x=>x.s).sort((a,b)=>distM(a.s,pt)-distM(b.s,pt))[0]:null;
    let p=ps.length>1?(near(ps)||{id:ps[0]}).id:ps[0]||null;
    if(!p){const n=near(S.projects.filter(x=>!x.closed).map(x=>x.id));if(n&&distM(n.s,pt)<=2000)p=n.id}
    if(!r){r={id:uid('a'),d,w:w.id,p,in:null,out:null,by:'w'};S.att.push(r)}
    r.in=pt;if(!r.p)r.p=p}
  else if(k==='out'){if(!r||!r.in)return {err:'Πάτησε πρώτα «Ήρθα».'};if(r.out)return {err:'Έχεις ήδη δηλώσει ότι έφυγες στις '+r.out.t+'.'};r.out=pt}
  else return {err:'Άγνωστη ενέργεια.'};
  const s=siteFor(r.p);if(s&&hasLL(pt))pt.m=distM(s,pt);
  r.u=stamp();r.n=(r.n||0)+1;attPrune(S);return {r}}
// το γραφείο καταχωρίζει ή διορθώνει: ώρες χωρίς θέση, με σημείωση
function setAtt(wid,d,o){S.att=S.att||[];let r=attOf(d,wid);const fix=(old,t)=>!t?null:old&&old.t===t?old:{t,by:'o'};
  if(!r){r={id:uid('a'),d,w:wid,p:o.p||null,in:null,out:null,by:'o'};S.att.push(r)}
  r.in=fix(r.in,o.in);r.out=fix(r.out,o.out);if(o.p!==undefined)r.p=o.p||null;r.note=String(o.note||'').trim().slice(0,200);r.u=stamp();r.n=(r.n||0)+1;
  if(!r.in&&!r.out){r.x=1}
  // «ήρθε» μετά από «δεν ήρθε»: η απουσία σβήνει
  const k=d+'|'+wid;if(r.in&&S.overrides[k]&&S.overrides[k].why==='absent')delete S.overrides[k];
  return r}
const delAtt=id=>{const r=(S.att||[]).find(x=>x.id===id);if(r){r.x=1;r.u=stamp();r.n=(r.n||0)+1}return r};
// «Δεν ήρθε»: η μέρα γίνεται απουσία, άρα χωρίς μεροκάματο, και το πρόγραμμα βρίσκει αντικαταστάτη αν είναι σήμερα ή αργότερα
function markAbsent(wid,d){const r=attOf(d,wid);if(r){r.x=1;r.u=stamp();r.n=(r.n||0)+1}S.overrides[d+'|'+wid]={type:'off',why:'absent'};return true}
const isAbsent=(wid,d)=>S.overrides[d+'|'+wid]?.why==='absent';
// οι παρουσίες μιας μέρας για το γραφείο: όσοι είναι στο πρόγραμμα των εργοταξίων και όσοι ήρθαν χωρίς να είναι
function attDay(R,d){const seen=new Set(),rows=[];
  R.asg.filter(a=>a.date===d&&!a.job).forEach(a=>{const w=W(a.workerId);if(!w||isOffice(w)||isExt(w)||seen.has(w.id))return;seen.add(w.id);
    const r=attOf(d,w.id),ps=attProjects(R,w.id,d);rows.push({w,ps,r,st:attSt(r,d)})});
  attList().filter(r=>r.d===d&&!seen.has(r.w)).forEach(r=>{const w=W(r.w);if(w)rows.push({w,ps:r.p?[r.p]:[],r,st:attSt(r,d),extra:true})});
  S.workers.filter(w=>isAbsent(w.id,d)&&!seen.has(w.id)&&!rows.some(x=>x.w.id===w.id)).forEach(w=>rows.push({w,ps:[],r:null,st:'absent'}));
  return rows.sort((a,b)=>ATT_ORD.indexOf(a.st)-ATT_ORD.indexOf(b.st)||a.w.name.localeCompare(b.w.name,'el'))}
const ATT_ORD=['none','in','out','absent'];
const attSt=(r,d)=>r&&r.in?(r.out?'out':'in'):'none';
// για τη σύνοψη και τις πληρωμές: περασμένες μέρες με πρόγραμμα αλλά χωρίς δήλωση και χωρίς απόφαση
function attMissing(R,from,to){const out=[];if(!gpsOn())return out;
  const first=(S.att||[]).reduce((m,r)=>!m||r.d<m?r.d:m,'');if(!first)return out;   // πριν από την πρώτη παρουσία δεν μετράει
  Object.keys(R.byDay).filter(d=>d>=from&&d<=to&&d<TODAY&&d>=first).sort().forEach(d=>attDay(R,d).forEach(x=>{if(x.st==='none')out.push({d,w:x.w})}));
  return out}
// ό,τι πέρασε τις 60 μέρες χάνει τις συντεταγμένες (μένουν ώρα και απόσταση)· μετά από 400 μέρες σβήνει
function attPrune(o){if(!Array.isArray(o.att))return;const g=add(TODAY,-ATT_GEO),k=add(TODAY,-ATT_KEEP);
  o.att=o.att.filter(r=>r.d>=k&&!(r.x&&r.d<add(TODAY,-30)));
  o.att.forEach(r=>{if(r.d<g)['in','out'].forEach(x=>{const pt=r[x];if(pt&&hasLL(pt)){delete pt.lat;delete pt.lon;delete pt.acc}})})}
// ό,τι έγραψαν οι εργαζόμενοι στο μεταξύ μένει όταν αποθηκεύει το γραφείο. Κάθε αλλαγή μιας εγγραφής ανεβάζει το n:
// κερδίζει όποια έχει τις περισσότερες αλλαγές· με ίσες, του γραφείου, συμπληρωμένη με ό,τι δήλωσε στο μεταξύ ο εργαζόμενος
// στην αναίρεση δεν ξαναμπαίνουν όσες έγραψε το γραφείο μετά το αντίγραφο
function mergeAtt(o,cur,undo){if(!o||!cur||!Array.isArray(cur.att))return o;o.att=Array.isArray(o.att)?o.att:[];
  const mine=new Map(o.att.map(r=>[r.id,r])),ws=new Set((o.workers||[]).map(w=>w.id));
  cur.att.forEach(r=>{if(!ws.has(r.w))return;const x=mine.get(r.id);if(!x){if(!undo||r.by!=='o')o.att.push({...r});return}
    if((r.n||0)>(x.n||0))Object.assign(x,r);else if((r.n||0)===(x.n||0)&&!x.x){if(!x.in&&r.in)x.in=r.in;if(!x.out&&r.out)x.out=r.out}});
  return o}
// για «Το πρόγραμμά μου»: χωρίς συντεταγμένες
const attPub=r=>{if(!r)return null;const pt=x=>r[x]?{t:r[x].t,where:attWhere(r,r[x])?.k||null,m:attDist(r,r[x]),yard:!r.p}:null;return {in:pt('in'),out:pt('out'),min:attMin(r)}};
// demo: σημεία εργοταξίων και παρουσίες των τελευταίων ημερών (με σταθερά «τυχαία» από την ημερομηνία)
const ATT_SITE={p1:{lat:40.58231,lon:22.95018,r:150},p2:{lat:40.58762,lon:23.03311,r:150},p3:{lat:40.63262,lon:22.94401,r:100}};
function attDemoSites(o){(o.projects||[]).forEach(p=>{if(ATT_SITE[p.id]&&!p.site)p.site={...ATT_SITE[p.id]}});if(o.settings&&!o.settings.yard)o.settings.yard={lat:40.65592,lon:22.86531,r:200}}
function attDemoFill(R,now){if(!S.attDemo||!gpsOn())return 0;now=now||new Date();S.att=S.att||[];let n=0;
  const hsh=s=>{let x=2166136261;for(const c of s)x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0};
  const days=Object.keys(R.byDay).filter(d=>d<=TODAY&&d>=add(TODAY,-6)).sort();
  const cut=hmOf(now),off=(s,m,b)=>{const k=m/111320;return {lat:Math.round((s.lat+k*Math.cos(b))*1e5)/1e5,lon:Math.round((s.lon+k*Math.sin(b)/Math.cos(s.lat*Math.PI/180))*1e5)/1e5}};
  days.forEach(d=>{if(S.att.some(r=>r.d===d))return;
    attDay(R,d).forEach((x,i)=>{if(x.r||x.st==='absent')return;const h0=hsh(d+x.w.id),p=x.ps[0]||null,s=siteFor(p);
      if(h0%23===0)return;                                        // κάποιος ξέχασε να το δηλώσει
      if(d===TODAY&&h0%7===0)return;                              // σήμερα: δεν έχει δηλώσει ακόμη
      const ti=7*60+15+h0%40,to=15*60+45+(h0>>>8)%45;if(d===TODAY&&tStr(ti)>cut)return;
      const pt=(t,m)=>{const q={t:tStr(t),at:d+'T'+tStr(t)};if(h0%17===3)return q;if(s){Object.assign(q,off(s,m,(h0%360)*Math.PI/180),{acc:8+h0%25});q.m=distM(s,q)}return q};
      const far=h0%13===5;const r={id:'a'+d.replace(/-/g,'').slice(2)+x.w.id,d,w:x.w.id,p,in:pt(ti,far?1400:15+h0%90),out:null,by:'w',u:d+'T'+tStr(ti)};
      if(d<TODAY||tStr(to)<=cut)r.out=pt(to,20+(h0>>>4)%80);S.att.push(r);n++})});
  return n}
// --- ημερολόγιο έργου (πακέτο Εργοτάξιο) ---
// Κάθε μέρα ενός έργου μαζεύεται μόνη της από όσα υπάρχουν ήδη: ποιοι δούλεψαν (πρόγραμμα και παρουσίες), ποιες εργασίες έγιναν και ποιες τελείωσαν,
// τι δήλωσε το εργοτάξιο, ποια υλικά ήρθαν, ραντεβού, καιρός. Από πάνω μπαίνουν σημειώσεις και φωτογραφίες από το γραφείο και από το εργοτάξιο.
// S.diary = [{id,p,d,k:'note'|'photo',text,ph,by:'o'|'w',bw,bn,at,u,n,x,hide}]
//   ph = {id,w,h,kb}: η φωτογραφία φυλάγεται στον server (ή στη συσκευή χωρίς server)· {demo,w,h}: φωτογραφία-δείγμα
//   hide = μόνο για την εταιρεία: δεν μπαίνει στο PDF για τον πελάτη ούτε στη σελίδα του πελάτη
// S.wxLog = {'ημερομηνία|έργο':{code,tmin,tmax,mm,p}}: ο καιρός κάθε μέρας όπως ήταν, για να μείνει και όταν η πρόγνωση δεν τον δείχνει πια
const DIARY_TXT=1000,DIARY_X=30;   // χαρακτήρες σημείωσης· μέρες που μένουν τα σβησμένα ως σημάδι
const diaryOn=()=>hasF('diary');
const isDS=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'');
const diaryList=()=>(S.diary||[]).filter(r=>!r.x&&P(r.p));
const diaryOf=(pid,d)=>diaryList().filter(r=>r.p===pid&&(!d||r.d===d)).sort((a,b)=>String(a.at).localeCompare(String(b.at)));
const diaryPhotos=pid=>diaryList().filter(r=>r.ph&&(!pid||r.p===pid)).sort((a,b)=>(b.d+b.at).localeCompare(a.d+a.at));
// o = {p,d,text,ph,by,bw,bn,hide,at}
function addDiary(o){S.diary=S.diary||[];o=o||{};
  const p=P(o.p);if(!p)return {err:'Διάλεξε έργο.'};
  const d=o.d||TODAY;if(!isDS(d)||d>TODAY)return {err:'Το ημερολόγιο γράφεται για σήμερα ή για μέρες που πέρασαν.'};
  const text=String(o.text||'').trim().slice(0,DIARY_TXT),ph=o.ph;
  if(!ph&&!text)return {err:'Γράψε τη σημείωση.'};
  if(ph&&!ph.demo&&!/^[a-z0-9]{8,32}$/.test(String(ph.id||'')))return {err:'Η φωτογραφία δεν ανέβηκε.'};
  const at=o.at||stamp(),r={id:o.id||uid('j'),p:p.id,d,k:ph?'photo':'note',text,by:o.by==='w'?'w':'o',at,u:at,n:1};
  if(ph)r.ph=ph.demo?{demo:String(ph.demo),w:+ph.w||1600,h:+ph.h||1200}:{id:String(ph.id),w:+ph.w||0,h:+ph.h||0,kb:+ph.kb||0};
  if(o.bw)r.bw=String(o.bw);if(o.bn)r.bn=String(o.bn).slice(0,80);if(o.hide)r.hide=1;
  S.diary.push(r);diaryPrune(S);return {r}}
function editDiary(id,o){const r=(S.diary||[]).find(x=>x.id===id&&!x.x);if(!r)return null;o=o||{};
  if(o.text!=null){const t=String(o.text).trim().slice(0,DIARY_TXT);if(!t&&!r.ph)return null;r.text=t}
  if(o.hide!=null){if(o.hide)r.hide=1;else delete r.hide}
  if(o.d&&isDS(o.d)&&o.d<=TODAY)r.d=o.d;
  if(o.p&&P(o.p))r.p=o.p;
  r.u=stamp();r.n=(r.n||0)+1;delete r.ub;return r}
// ub:'w' = την τελευταία αλλαγή (το σβήσιμο) την έκανε ο ίδιος ο εργαζόμενος· μια αναίρεση του γραφείου δεν τη γυρίζει πίσω
const delDiary=(id,w)=>{const r=(S.diary||[]).find(x=>x.id===id);if(r&&!r.x){r.x=1;r.u=stamp();r.n=(r.n||0)+1;if(w)r.ub='w';else delete r.ub}return r||null};
// τα σβησμένα μένουν 30 μέρες ως σημάδι, ώστε ένα παλιό αντίγραφο να μην τα ξαναφέρει· ο καιρός κρατιέται όσο και οι περασμένες μέρες
function diaryPrune(o){if(Array.isArray(o.diary)){const lim=add(TODAY,-DIARY_X);o.diary=o.diary.filter(r=>!(r.x&&String(r.u||r.at||'').slice(0,10)<lim))}
  if(o.wxLog&&typeof o.wxLog==='object'){const k=add(TODAY,-550);Object.keys(o.wxLog).forEach(x=>{if(x.slice(0,10)<k)delete o.wxLog[x]})}}
// οι φωτογραφίες που χρειάζονται ακόμη (για τον server: ό,τι δεν είναι εδώ σβήνεται μετά από μερικές μέρες)
const diaryRefs=o=>{const ps=new Set(((o&&o.projects)||[]).map(p=>p.id));return new Set(((o&&o.diary)||[]).filter(r=>r.ph&&r.ph.id&&!r.x&&ps.has(r.p)).map(r=>r.ph.id))};
// ό,τι έστειλαν στο μεταξύ οι εργαζόμενοι ή άλλος χρήστης του γραφείου δεν χάνεται όταν αποθηκεύει ένα παλιότερο αντίγραφο.
// Κάθε αλλαγή ανεβάζει το n και κερδίζει η εγγραφή με τις περισσότερες αλλαγές. Στην αναίρεση κερδίζει το αντίγραφο
// και ξαναμπαίνουν μόνο όσα έστειλε στο μεταξύ το εργοτάξιο.
function mergeDiary(o,cur,undo){if(!o||!cur)return o;
  if(Array.isArray(cur.diary)){o.diary=Array.isArray(o.diary)?o.diary:[];const mine=new Map(o.diary.map(r=>[r.id,r])),ps=new Set((o.projects||[]).map(p=>p.id));
    cur.diary.forEach(r=>{if(!ps.has(r.p))return;const x=mine.get(r.id);
      if(!x){if(!undo||r.by==='w')o.diary.push({...r});return}
      if((r.n||0)>(x.n||0)){if(undo&&r.ub!=='w')x.n=(r.n||0)+1;else Object.assign(x,r)}})}
  if(cur.wxLog&&typeof cur.wxLog==='object'){o.wxLog=o.wxLog&&typeof o.wxLog==='object'?o.wxLog:{};Object.keys(cur.wxLog).forEach(k=>{if(!o.wxLog[k])o.wxLog[k]=cur.wxLog[k]})}
  return o}
// ο καιρός των τελευταίων 7 ημερών και του σήμερα γράφεται στο ημερολόγιο για κάθε έργο που δούλεψε
function wxLogFill(R){if(!diaryOn()||!R||!getWeather())return 0;S.wxLog=S.wxLog&&typeof S.wxLog==='object'?S.wxLog:{};let n=0;const from=add(TODAY,-7),ps={};
  R.asg.forEach(a=>{if(a.date>=from&&a.date<=TODAY&&a.projectId&&P(a.projectId))(ps[a.date]=ps[a.date]||new Set()).add(a.projectId)});
  Object.keys(ps).forEach(d=>ps[d].forEach(pid=>{const f=wxDay(pid,d);if(!f||f.code==null)return;
    const v={code:f.code,tmin:f.tmin,tmax:f.tmax,mm:f.mm,p:f.p},k=d+'|'+pid;if(JSON.stringify(S.wxLog[k])!==JSON.stringify(v)){S.wxLog[k]=v;n++}}));
  return n}
const wxOf=(pid,d)=>{const f=wxDay(pid,d);return f&&f.code!=null?f:(S.wxLog||{})[d+'|'+pid]||null};
// πότε τελείωσε κάθε ολοκληρωμένη εργασία του έργου: η τελευταία μέρα που ήταν στο πρόγραμμα πριν την ολοκλήρωση
function diaryFin(R,pid){const f={},ts=S.tasks.filter(t=>t.projectId===pid&&t.status==='done'&&t.doneOn);if(!ts.length)return f;
  const ds0=Object.keys(R.byDay).sort();
  ts.forEach(t=>{for(let i=ds0.length-1;i>=0;i--){const d=ds0[i];if(d>=t.doneOn)continue;if(R.byDay[d].jobs.some(j=>j.task&&j.task.id===t.id)){f[t.id]=d;break}}});
  return f}
// οι μέρες του έργου με κάτι να γράψουν, από την πιο πρόσφατη
function diaryDays(R,pid){const p=P(pid),s=new Set();if(!p)return [];
  R.asg.forEach(a=>{if(a.projectId===pid&&a.date<=TODAY&&!a.pm)s.add(a.date)});   // μόνο ο υπεύθυνος του έργου δεν κάνει μέρα ημερολογίου
  diaryOf(pid).forEach(r=>s.add(r.d));
  (S.field||[]).forEach(r=>{if(r.k!=='leave'&&r.st==='ok'&&r.d<=TODAY&&T(r.t)&&T(r.t).projectId===pid)s.add(r.d)});
  (p.costs||[]).forEach(c=>{if(c.kind==='mat'&&isDS(c.date)&&c.date<=TODAY)s.add(c.date)});
  if(hasF('appts'))(S.appts||[]).forEach(a=>{if(a.projectId===pid&&a.date<=TODAY)s.add(a.date)});
  return [...s].sort().reverse()}
// μία μέρα ενός έργου
function diaryDay(R,pid,d,fin){const p=P(pid);if(!p)return null;const D=R.byDay[d];fin=fin||diaryFin(R,pid);
  const jobs=(D?D.jobs:[]).filter(j=>j.task&&j.task.projectId===pid).map(j=>{const t=T(j.task.id)||j.task;
    return {tid:t.id,title:t.title,sp:SP(t.specialtyId)?.name||'',day:j.dayNo||1,days:+t.days||1,lead:j.lead?j.lead.name:'',n:[j.lead,...(j.helpers||[])].filter(Boolean).length,end:fin[t.id]===d}});
  const ppl=new Map(),put=(id,o)=>{if(id===OWNER)return;const w=W(id);if(!w)return;
    const x=ppl.get(id)||{id,name:w.name,sp:SP(w.specialtyId)?.name||'',role:w.role||'',ext:isExt(w),pm:false,att:null};Object.assign(x,o||{});ppl.set(id,x)};
  R.asg.forEach(a=>{if(a.date===d&&a.projectId===pid)put(a.workerId,a.pm?{pm:true}:null)});
  if(gpsOn())attList().forEach(r=>{if(r.d!==d||!(r.p===pid||(!r.p&&ppl.has(r.w))))return;if(!ppl.has(r.w))put(r.w,{extra:true});
    ppl.get(r.w)&&(ppl.get(r.w).att={in:r.in?r.in.t:'',out:r.out?r.out.t:'',min:attMin(r)})});
  const done=S.tasks.filter(t=>t.projectId===pid&&fin[t.id]===d).map(t=>t.title);
  const wet=(D&&D.wet||[]).filter(t=>t&&t.projectId===pid).map(t=>t.title);
  const rep=(S.field||[]).filter(r=>r.k!=='leave'&&r.st==='ok'&&r.d===d&&T(r.t)&&T(r.t).projectId===pid)
    .map(r=>({k:r.k,task:T(r.t).title,who:W(r.w)?.name||'',note:r.note||'',at:r.at||''}));
  const mats=(p.costs||[]).filter(c=>c.kind==='mat'&&c.date===d).map(c=>({what:c.desc||'',sup:c.sup||''}));
  S.tasks.forEach(t=>{if(t.projectId===pid&&t.mat&&t.mat.ordered===d&&!mats.some(m=>m.what===t.mat.what))mats.push({what:t.mat.what||'',sup:t.mat.sup||'',order:true})});
  const appts=hasF('appts')?(S.appts||[]).filter(a=>a.projectId===pid&&a.date===d).sort((a,b)=>(a.time||'').localeCompare(b.time||''))
    .map(a=>({time:apTime(a),title:a.title,client:a.client||'',done:a.status==='done',with:(a.people||[]).map(apPerson).filter(Boolean).map(x=>x.name)})):[];
  const people=[...ppl.values()].sort((a,b)=>(a.pm-b.pm)||a.name.localeCompare(b.name,'el'));
  const items=diaryOf(pid,d);
  return {d,p:pid,jobs,people,crew:people.filter(x=>!x.pm).length,done,wet,rep,mats,appts,wx:wxOf(pid,d),items,
    empty:!jobs.length&&!people.length&&!rep.length&&!mats.length&&!appts.length&&!items.length}}
// για «Το πρόγραμμά μου»: σε ποια έργα είναι σήμερα ο εργαζόμενος και τι έχει στείλει ο ίδιος σήμερα
function myDiary(R,w){const ps=[...new Set(R.asg.filter(a=>a.date===TODAY&&a.workerId===w.id&&a.projectId&&P(a.projectId)).map(a=>a.projectId))];
  return {ps:ps.map(id=>({id,name:P(id).name})),items:diaryList().filter(r=>r.d===TODAY&&r.by==='w'&&r.bw===w.id)
    .sort((a,b)=>String(a.at).localeCompare(String(b.at))).map(r=>({id:r.id,p:r.p,project:P(r.p).name,text:r.text,ph:r.ph||null,at:String(r.at).slice(11,16)}))}}
// ο εργαζόμενος σβήνει κάτι δικό του, την ίδια μέρα
function delMyDiary(w,id){const r=(S.diary||[]).find(x=>x.id===id&&!x.x);
  if(!r||r.by!=='w'||r.bw!==w.id)return {err:'Δεν βρέθηκε.'};if(r.d!==TODAY)return {err:'Σβήνεται μόνο την ίδια μέρα. Πες το στο γραφείο.'};
  delDiary(id,true);return {r}}
// demo: σημειώσεις και φωτογραφίες-δείγματα των τελευταίων ημερών, και ο καιρός τους
function diaryDemo(wd){wd=wd||[1,2,3,4,5,6];const pw=[];for(let d=add(TODAY,-1),i=0;pw.length<8&&i<30;i++,d=add(d,-1))if(wd.includes(dow(d)))pw.push(d);
  const T0=wd.includes(dow(TODAY))?TODAY:pw[0],at=(d,t)=>d+'T'+t,sl=add(weekStart(TODAY),1),slab=sl<TODAY&&wd.includes(dow(sl))?sl:pw[0];   // η πλάκα του demo τελειώνει τη δεύτερη μέρα της εβδομάδας
  const it=(id,p,d,t,o)=>Object.assign({id,p,d,k:o.ph?'photo':'note',text:o.text,by:o.bw?'w':'o',at:at(d,t),u:at(d,t),n:1},o.ph?{ph:{demo:o.ph,w:1600,h:1200}}:{},o.bw?{bw:o.bw}:{},{bn:o.bn},o.hide?{hide:1}:{});
  const G={bw:'w1',bn:'Γιώργος Παπαδόπουλος'},AR={bn:'Αντώνης Ρίζος'},KL={bn:'Κατερίνα Λιάπη'};
  const xs=[
    it('jd1','p1',T0,'07:52',{...G,ph:'site',text:'Πρωί στο εργοτάξιο. Σήμερα κλείνει η τοιχοποιία του 2ου ορόφου.'}),
    it('jd2','p1',slab,'13:10',{...G,ph:'slab',text:'Σκυροδέτηση πλάκας 3ου ορόφου. Ήρθαν 38 κ.μ., τελειώσαμε στις 13:00.'}),
    it('jd3','p1',slab,'15:20',{...AR,text:'Πέρασε ο επιβλέπων μηχανικός. Εντάξει ο οπλισμός και η σκυροδέτηση της πλάκας.'}),
    it('jd4','p1',pw[1],'16:05',{...G,ph:'brick',text:'Τοιχοποιία 2ου ορόφου, βόρεια πλευρά.'}),
    it('jd5','p1',pw[2],'11:30',{...AR,hide:true,text:'Ο πελάτης ζήτησε να μετακινηθεί ο ηλεκτρικός πίνακας. Να το δούμε με τον ηλεκτρολόγο πριν τις σωληνώσεις.'}),
    it('jd6','p2',pw[0],'12:40',{bw:'w2',bn:'Νίκος Κωνσταντίνου',ph:'pipe',text:'Καθαιρέσεις: φάνηκαν οι παλιές σωληνώσεις του μπάνιου. Αλλάζουν όλες.'}),
    it('jd7','p2',pw[2],'10:15',{bw:'w2',bn:'Νίκος Κωνσταντίνου',ph:'demol',text:'Καθαιρέσεις: βγήκαν τα παλιά πλακάκια και ο σοβάς της κουζίνας.'}),
    it('jd8','p2',pw[1],'17:00',{...KL,text:'Ο πελάτης διάλεξε πλακάκια μπάνιου: λευκό ματ 30×60 και δάπεδο γκρι 60×60.'}),
    it('jd9','p3',pw[1],'14:25',{bw:'w13',bn:'Λευτέρης Σταμάτης',ph:'tile',text:'Ήρθαν τα πλακάκια 80×80 για το δάπεδο, 95 τ.μ.'}),
    it('jd10','p3',pw[2],'09:40',{...KL,hide:true,text:'Ο ιδιοκτήτης θέλει να ανοίξει το κατάστημα στις 15 του επόμενου μήνα. Να μη χαθεί μέρα στα πλακάκια.'}),
    it('jd11','p3',pw[0],'12:00',{bw:'w14',bn:'Γιάννης Μαυρίδης',ph:'paint',text:'Βάψιμο καταστήματος: δεύτερο χέρι στον τοίχο της βιτρίνας.'})];
  return xs.filter(r=>r.d)}
function wxLogDemo(wd){wd=wd||[1,2,3,4,5,6];const o={},C0=[[1,13,22,0,5],[2,12,21,0,10],[0,11,23,0,0],[3,14,20,0.4,30],[51,13,18,1.6,60],[1,12,22,0,10],[2,13,23,0,5],[0,10,21,0,0],[3,12,19,0.2,25],[1,11,22,0,5]];
  for(let i=1,k=0;i<=14;i++){const d=add(TODAY,-i);if(!wd.includes(dow(d)))continue;const c=C0[k++%C0.length];
    ['p1','p2','p3'].forEach((p,j)=>{o[d+'|'+p]={code:c[0],tmin:c[1]+(j===1?-1:0),tmax:c[2]+(j===1?-1:0),mm:c[3],p:c[4]}})}
  return o}
/* ---------- Σελίδα προόδου για τον πελάτη ----------
   Ιδιωτικός σύνδεσμος ανά έργο (p.share.t), που ανοίγει χωρίς κωδικό. Ο πελάτης βλέπει πρόοδο, εργασίες, ημερολόγιο και φωτογραφίες.
   Ποτέ ονόματα, μεροκάματα, κόστη, προμηθευτές, ώρες ή ό,τι είναι «Μόνο για εμάς». Ο server φτιάχνει τη σελίδα χωρίς JavaScript. */
const DAYS_L=['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'],MON_G=['Ιανουαρίου','Φεβρουαρίου','Μαρτίου','Απριλίου','Μαΐου','Ιουνίου','Ιουλίου','Αυγούστου','Σεπτεμβρίου','Οκτωβρίου','Νοεμβρίου','Δεκεμβρίου'];
const fmtL=s=>{const d=pd(s);return DAYS_L[d.getDay()]+' '+d.getDate()+' '+MON_G[d.getMonth()]+(d.getFullYear()!==pd(TODAY).getFullYear()?' '+d.getFullYear():'')};
const CL_DAYS=14,CL_PH=24,CL_MSG=500,CL_TOK=/^[A-Za-z0-9_-]{20,64}$/;
const clientOn=()=>hasF('client');
const shareOf=p=>p&&p.share&&CL_TOK.test(p.share.t||'')?p.share:null;
const clientOpt=p=>{const o=(p&&p.share&&p.share.opt)||{};return {ph:o.ph!==0,days:o.days!==0,plan:o.plan!==0,end:o.end!==0}};
const byShare=t=>typeof t==='string'&&CL_TOK.test(t)?S.projects.find(p=>shareOf(p)&&p.share.t===t)||null:null;
// η φωτογραφία ανήκει στο έργο και επιτρέπεται να τη δει ο πελάτης
const clientPhotoOk=(pid,id)=>clientOpt(P(pid)).ph&&diaryList().some(r=>r.p===pid&&r.ph&&r.ph.id===id&&!r.hide);
// η πρόοδος ενός έργου σε μέρες εργασίας: ό,τι έγινε, ό,τι γίνεται τώρα και ό,τι ακολουθεί
function projProg(R,pid){const ts=S.tasks.filter(t=>t.projectId===pid),worked={},cur={},F=diaryFin(R,pid);
  Object.keys(R.byDay).forEach(d=>R.byDay[d].jobs.forEach(j=>{const t=j.task;if(!t||t.projectId!==pid)return;
    if(d<TODAY&&j.lead)worked[t.id]=(worked[t.id]||0)+1;if(d===TODAY)cur[t.id]=j.dayNo||1}));
  let tot=0,dn=0;
  const rows=ts.map(t=>{const days=Math.max(1,+t.days||1),f=R.finish[t.id],done=t.status==='done'||(!!f&&f<TODAY&&!cur[t.id]);
    const w=done?days:Math.min(days,worked[t.id]||0);tot+=days;dn+=w;
    const st=done?'done':cur[t.id]||(w>0&&R.begin[t.id]&&R.begin[t.id]<=TODAY)?'now':'next';
    return {title:t.title,st,days,day:cur[t.id]||null,from:R.begin[t.id]||null,to:(done?F[t.id]||f||t.doneOn:f)||null}});
  const ord=(a,b)=>String(a||'9999').localeCompare(String(b||'9999'));
  const done=rows.filter(r=>r.st==='done').sort((a,b)=>ord(a.to,b.to)),now=rows.filter(r=>r.st==='now').sort((a,b)=>ord(a.from,b.from)),next=rows.filter(r=>r.st==='next').sort((a,b)=>ord(a.from,b.from));
  const pct=!tot?0:done.length===rows.length?100:Math.min(99,Math.round(dn/tot*100));
  const fin=rows.map(r=>r.to).filter(Boolean).sort().pop()||null;
  return {rows,done,now,next,pct,fin,F}}
function clientView(R,pid,all){const p=P(pid);if(!p)return null;const o=clientOpt(p),sh=p.share||{},co=(S.settings&&S.settings.company)||{};
  const {rows,done,now,next,pct,fin,F}=projProg(R,pid);
  const end=!o.end||!rows.length?null:done.length===rows.length?{k:'done',d:fin}:hasF('deadline')&&p.due?{k:'due',d:p.due}:R.unplanned.some(t=>t.projectId===pid)||!fin?null:{k:'est',d:fin};
  let days=[],more=false,gal=[];
  if(o.days){
    for(const d of diaryDays(R,pid)){const x=diaryDay(R,pid,d,F),items=x.items.filter(r=>!r.hide);
      if(!x.jobs.length&&!items.length&&!x.wet.length)continue;
      if(!all&&days.length>=CL_DAYS){more=true;break}
      const sp=new Map();x.people.filter(q=>!q.pm).forEach(q=>{const k=q.sp||'Άλλοι';sp.set(k,(sp.get(k)||0)+1)});
      days.push({d,wx:x.wx?wxText(x.wx):'',jobs:x.jobs.map(j=>({title:j.title,day:j.day,days:j.days,end:j.end})),wet:x.wet,crew:x.crew,sp:[...sp],
        notes:items.filter(r=>!r.ph).map(r=>r.text),ph:o.ph?items.filter(r=>r.ph).map(r=>({ph:r.ph,text:r.text})):[]})}}
  else if(o.ph)gal=diaryPhotos(pid).filter(r=>!r.hide).slice(0,all?999:CL_PH).map(r=>({ph:r.ph,text:r.text,d:r.d}));
  return {co:{name:co.name||'',phone:co.phone||''},p:{name:p.name,loc:p.location||''},o,pct,rows:rows.length,done,now,next,end,
    msg:String(sh.msg||'').slice(0,CL_MSG),days,more,gal,at:stamp(),today:TODAY}}
// η σελίδα: ίδιο HTML στον server και στην προεπισκόπηση της εφαρμογής. u.ph(ph,big) δίνει τη διεύθυνση της φωτογραφίας, u.all τον σύνδεσμο για όλες τις μέρες
const CL_CSS=`:root{--bg:#E8ECE4;--card:#F6F8F3;--ink:#17241F;--mut:#56655F;--line:#D6DDD2;--forest:#0E3B34;--lime:#C2CF7E;--soft:#E8EDCD;--softink:#2E5310;--seg:rgba(255,255,255,.16)}
@media (prefers-color-scheme:dark){:root{--bg:#0B2C27;--card:#113A33;--ink:#E7EEE4;--mut:#A7B8B0;--line:#21504A;--soft:#26391C;--softink:#DCE6B5}.hero{box-shadow:inset 0 0 0 1px var(--line)}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 Commissioner,system-ui,-apple-system,"Segoe UI",sans-serif}
.w{max-width:760px;margin:0 auto;padding:12px 16px 24px}
.top{display:flex;align-items:center;gap:12px;min-height:52px}.co{flex:1;font-weight:700;font-size:17px;line-height:1.25}
.call{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:999px;background:var(--card);border:1px solid var(--line);color:var(--ink);text-decoration:none;font-weight:600;white-space:nowrap}
.call svg{width:18px;height:18px}
.hero{background:var(--forest);color:#EEF3EA;border-radius:22px;padding:22px 20px 20px;margin-top:4px}
.hero h1{font:800 clamp(30px,7vw,44px)/1.04 "Fira Sans Condensed",Commissioner,sans-serif;margin:0;letter-spacing:-.01em}
.loc{color:#B3C5BD;margin:4px 0 0}
.pg{margin:20px 0 0;font-size:17px}.pg b{font:800 30px/1 "Fira Sans Condensed",sans-serif;color:var(--lime);margin-right:4px}
.strip{display:flex;gap:3px;height:16px;margin:10px 0 0}.strip i{flex:var(--d) 1 0;min-width:4px;border-radius:4px;background:var(--seg)}
.strip i.done{background:var(--lime)}.strip i.now{background:repeating-linear-gradient(135deg,var(--lime) 0 5px,#8FA154 5px 10px)}
.kv{display:grid;gap:4px;margin:16px 0 0;font-size:15.5px}.kv span{color:#B3C5BD}.kv b{font-weight:600;color:#fff}
.msg{background:var(--soft);color:var(--softink);border-radius:16px;padding:14px 16px;margin:14px 0 0;white-space:pre-line}.msg small{display:block;opacity:.8;margin-bottom:2px;font-size:13px}
h2{font:800 23px/1.2 "Fira Sans Condensed",Commissioner,sans-serif;margin:30px 0 10px}
.list{list-style:none;margin:0;padding:0;background:var(--card);border:1px solid var(--line);border-radius:18px}
.list li{display:flex;gap:12px;padding:12px 16px;border-top:1px solid var(--line)}.list li:first-child{border-top:0}
.mk{flex:none;width:24px;height:24px;border-radius:50%;border:2px solid var(--line);margin-top:1px;display:grid;place-items:center}
.done .mk{background:var(--lime);border-color:var(--lime);color:#21360F}.mk svg{width:14px;height:14px}
.now .mk{border-color:var(--ink)}.now .mk:after{content:"";width:10px;height:10px;border-radius:50%;background:var(--ink)}
.t{flex:1;min-width:0}.t b{font-weight:600}.when{display:block;color:var(--mut);font-size:14.5px}.done .t b{font-weight:500}
details.list{padding:0}details.list summary{padding:12px 16px;cursor:pointer;color:var(--mut);list-style:none}details.list summary::-webkit-details-marker{display:none}
details.list summary:before{content:"+ "}details[open].list summary:before{content:"− "}details.list ul{list-style:none;margin:0;padding:0}
.list+.list{margin-top:8px}
.day{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px 16px;margin:0 0 10px}
.dh{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px}.dh b{font-weight:700;font-size:17px}.tag{font-size:13px;font-weight:600;background:var(--soft);color:var(--softink);padding:1px 8px;border-radius:999px}
.wx{color:var(--mut);font-size:14.5px;flex-basis:100%}
.day p{margin:7px 0 0}.day .l{color:var(--mut)}.note{border-left:3px solid var(--lime);padding-left:10px}
.ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:12px}
.ph a{display:block;position:relative;aspect-ratio:4/3;border-radius:12px;overflow:hidden;background:var(--line);color:#fff;text-decoration:none}
.ph img{width:100%;height:100%;object-fit:cover;display:block}.ph a:only-child{grid-column:1/-1;max-width:460px}
.ph span{position:absolute;left:0;right:0;bottom:0;padding:16px 8px 6px;font-size:13px;line-height:1.3;background:linear-gradient(transparent,rgba(0,0,0,.62));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.more{display:block;text-align:center;padding:12px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-weight:600;text-decoration:none}
.empty{color:var(--mut)}
footer{color:var(--mut);font-size:13.5px;margin:30px 0 8px;text-align:center}footer p{margin:2px 0}
a:focus-visible,summary:focus-visible{outline:3px solid var(--lime);outline-offset:2px}
@media (min-width:640px){.w{padding:20px 24px 32px}.hero{padding:28px 30px 26px}.kv{grid-template-columns:auto 1fr;column-gap:14px}}
@media print{body{background:#fff}.call,.more{display:none}.hero{border:1px solid #ccc}}`;
const CL_OK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CL_TEL='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5l2.6.4 1.3 4-2 1.5a12 12 0 0 0 6.1 6.1l1.5-2 4 1.3.4 2.6c-.1 1.5-1.4 2.6-2.9 2.6C10.3 20 4 13.7 4 6.4c0-1.5 1.1-2.8 2.6-2.9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
function clientHtml(v,u){const tel=String(v.co.phone||'').replace(/[^\d+]/g,'');
  const jobTxt=j=>h(j.title)+(j.end?' (τελείωσε)':j.days>1?' (μέρα '+j.day+' από '+j.days+')':'');
  const li=r=>`<li class="${r.st}"><span class="mk">${r.st==='done'?CL_OK:''}</span><span class="t"><b>${h(r.title)}</b><span class="when">${
    r.st==='done'?(r.to?'Τελείωσε '+h(fmtL(r.to)):'Τελείωσε'):r.st==='now'?(r.day?'Σε εξέλιξη, μέρα '+r.day+' από '+r.days:'Σε εξέλιξη'):!v.o.plan?'Ακολουθεί':r.from?'Ξεκινά '+h(fmtL(r.from)):'Θα μπει σύντομα στο πρόγραμμα'}</span></span></li>`;
  const phs=xs=>(xs=xs.filter(x=>u.ph(x.ph,false))).length?`<div class="ph">${xs.map(x=>`<a href="${h(u.ph(x.ph,true))}" target="_blank" rel="noopener"><img src="${h(u.ph(x.ph,false))}" alt="${h(x.text||'Φωτογραφία από το εργοτάξιο')}" loading="lazy">${x.text?`<span>${h(x.text)}</span>`:''}</a>`).join('')}</div>`:'';
  const crew=x=>x.crew?(x.crew==1?'1 άτομο':x.crew+' άτομα')+(x.sp.length?' ('+x.sp.map(([s,n])=>h(s)+' '+n).join(', ')+')':''):'';
  const day=x=>`<article class="day"><div class="dh"><b>${h(fmtL(x.d))}</b>${x.d===v.today?'<span class="tag">Σήμερα</span>':''}${x.wx?`<span class="wx">${h(x.wx)}</span>`:''}</div>
    ${x.jobs.length?`<p><span class="l">${x.d===v.today?'Σήμερα':'Έγινε'}:</span> ${x.jobs.map(jobTxt).join(', ')}</p>`:''}
    ${x.wet.length?`<p><span class="l">Δεν έγινε λόγω καιρού:</span> ${h(x.wet.join(', '))}</p>`:''}
    ${x.crew?`<p><span class="l">Στο εργοτάξιο:</span> ${crew(x)}</p>`:''}
    ${x.notes.map(t=>`<p class="note">${h(t).replace(/\n/g,'<br>')}</p>`).join('')}${phs(x.ph)}</article>`;
  const segs=[...v.done,...v.now,...v.next].map(r=>`<i class="${r.st}" style="--d:${r.days}"></i>`).join('');
  const cur=v.now.length?v.now.map(r=>h(r.title)).join(', '):'';
  const endTxt=v.end?(v.end.k==='done'?['Ολοκληρώθηκε',fmtL(v.end.d)]:v.end.k==='due'?['Παράδοση',fmtL(v.end.d)]:['Εκτιμώμενο τέλος',fmtL(v.end.d)]):null;
  const nextUp=!cur&&v.next.length&&v.o.plan&&v.next[0].from?v.next[0]:null;
  const old=v.done.length>4?v.done.slice(0,v.done.length-3):[],recent=v.done.slice(old.length);
  return `<div class="w"><header class="top"><div class="co">${h(v.co.name||'Πρόοδος του έργου')}</div>${tel?`<a class="call" href="tel:${h(tel)}">${CL_TEL}Κλήση</a>`:''}</header>
  <section class="hero"><h1>${h(v.p.name)}</h1>${v.p.loc?`<p class="loc">${h(v.p.loc)}</p>`:''}
    ${v.rows?`<p class="pg"><b>${v.pct}%</b> ${v.pct===100?'ολοκληρώθηκε':'της δουλειάς έχει γίνει'}</p><div class="strip" aria-hidden="true">${segs}</div>`:'<p class="pg">Οι εργασίες του έργου μπαίνουν σύντομα.</p>'}
    ${cur||endTxt||nextUp?`<div class="kv">${cur?`<span>Τώρα</span><b>${cur}</b>`:''}${nextUp?`<span>Επόμενο</span><b>${h(nextUp.title)}, ${h(fmtL(nextUp.from))}</b>`:''}${endTxt?`<span>${endTxt[0]}</span><b>${h(endTxt[1])}</b>`:''}</div>`:''}</section>
  ${v.msg?`<div class="msg"><small>Μήνυμα από ${h(v.co.name||'την εταιρεία')}</small>${h(v.msg)}</div>`:''}
  ${v.rows?`<h2>Εργασίες</h2>${old.length?`<details class="list"><summary>${old.length==1?'1 ακόμη εργασία τελείωσε':old.length+' ακόμη εργασίες τελείωσαν'} νωρίτερα</summary><ul>${old.map(li).join('')}</ul></details>`:''}<ul class="list">${[...recent,...v.now,...v.next].map(li).join('')}</ul>`:''}
  ${v.o.days?`<h2>Ημερολόγιο</h2>${v.days.length?v.days.map(day).join(''):'<p class="empty">Οι μέρες γράφονται εδώ μόλις ξεκινήσει η δουλειά στο εργοτάξιο.</p>'}${v.more&&u.all?`<a class="more" href="${h(u.all)}">Όλες οι μέρες</a>`:''}`
    :v.gal.length?`<h2>Φωτογραφίες</h2>${phs(v.gal)}`:''}
  <footer><p>Ενημερώθηκε ${h(fmtL(String(v.at).slice(0,10)))}, ${h(String(v.at).slice(11,16))}.</p><p>Ο σύνδεσμος είναι προσωπικός, για εσάς.</p><p>Με το ${h(BRAND.name)}</p></footer></div>`}
const CL_FONTS='https://fonts.googleapis.com/css2?family=Commissioner:wght@400..800&family=Fira+Sans+Condensed:wght@800&display=swap';
const clientDoc=(v,u)=>`<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta name="color-scheme" content="light dark">
<title>${h(v.p.name)}: πρόοδος${v.co.name?' · '+h(v.co.name):''}</title><link rel="stylesheet" href="${CL_FONTS}"><style>${CL_CSS}</style></head><body>${clientHtml(v,u)}</body></html>`;
const clientGone=()=>`<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>Ο σύνδεσμος δεν ισχύει</title><style>${CL_CSS}</style></head>
<body><div class="w"><section class="hero" style="margin-top:24px"><h1>Ο σύνδεσμος δεν ισχύει</h1><p class="loc">Ζητήστε νέο σύνδεσμο από την εταιρεία που κάνει το έργο.</p></section></div></body></html>`;
// demo: μία σελίδα πελάτη ήδη ανοιχτή στο πρώτο έργο, ώστε να φαίνεται στην προεπισκόπηση
const TOK_A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const newTok=()=>{const b=new Uint8Array(24),c=globalThis.crypto;if(c&&c.getRandomValues)c.getRandomValues(b);else for(let i=0;i<24;i++)b[i]=Math.random()*256|0;return [...b].map(x=>TOK_A[x&63]).join('')};   // 144 bit
const clientDemo=()=>({t:newTok(),at:stamp(),opt:{ph:1,days:1,plan:1,end:1},msg:'Από Δευτέρα ξεκινούν οι ηλεκτρολογικές σωληνώσεις στον 2ο όροφο. Θα σας πούμε από πριν αν χρειαστεί να κλείσει το ρεύμα στο κλιμακοστάσιο.'});
/* ---------- Καρτέλα πελάτη (πακέτο Συνεργείο) ----------
   S.clients=[{id,name,person,phone,email,addr,afm,notes,at,log:[{id,d,k,text,by,at}]}]. Τα έργα και τα ραντεβού δείχνουν τον πελάτη με clientId.
   Ραντεβού χωρίς clientId ανήκουν στον πελάτη με το ίδιο όνομα, ή στον πελάτη του έργου τους όταν δεν γράφουν όνομα. */
const CLI_K=[['note','Σημείωση'],['call','Τηλεφώνημα'],['meet','Συνάντηση'],['offer','Προσφορά'],['msg','Μήνυμα ή email']];
const CLI_LOG=1000;   // σημειώσεις ανά πελάτη· οι πιο παλιές φεύγουν πρώτες
const cliList=()=>(S&&S.clients)||[];
const cliById=id=>id?cliList().find(c=>c.id===id)||null:null;
const cliByName=n=>{const f=fold(n);return f?cliList().find(c=>fold(c.name)===f)||null:null};
const cliOfP=p=>p?cliById(p.clientId):null;
const cliOfA=a=>!a?null:a.clientId&&cliById(a.clientId)||cliByName(a.client)||(a.projectId&&!String(a.client||'').trim()?cliOfP(P(a.projectId)):null);
const cliProjects=c=>S.projects.filter(p=>p.clientId===c.id);
const apOrd=(a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''));
const cliAppts=c=>(S.appts||[]).filter(a=>{const x=cliOfA(a);return x&&x.id===c.id}).sort(apOrd);
const cliUpcoming=c=>cliAppts(c).filter(a=>a.status!=='done'&&a.date>=TODAY);
const projDone=p=>{const ts=S.tasks.filter(t=>t.projectId===p.id);return ts.length>0&&ts.every(t=>t.status==='done')};
// now: έργο σε εξέλιξη· lead: χωρίς έργο ακόμη· done: όλα τα έργα τελείωσαν
const cliState=c=>{const ps=cliProjects(c);return !ps.length?'lead':ps.every(projDone)?'done':'now'};
// η πιο πρόσφατη επαφή: σημείωση ή ραντεβού που πέρασε
const cliLast=c=>[...(c.log||[]).map(r=>r.d),...cliAppts(c).filter(a=>a.date<=TODAY).map(a=>a.date)].filter(d=>d&&d<=TODAY).sort().pop()||'';
// το ιστορικό του πελάτη, από το πιο πρόσφατο: σημειώσεις, ραντεβού που πέρασαν, αρχή και τέλος κάθε έργου, σελίδα προόδου
function cliHistory(R,c){const L=[];
  (c.log||[]).forEach(r=>L.push({d:r.d,k:r.k||'note',text:r.text,by:r.by||'',id:r.id,at:r.at||''}));
  if(hasF('appts'))cliAppts(c).filter(a=>a.date<TODAY||a.status==='done').forEach(a=>L.push({d:a.date,k:'appt',text:a.title,a:a.id,p:a.projectId||'',sub:(a.time?a.time+' · ':'')+(a.status==='done'?'Έγινε':'Δεν σημειώθηκε ότι έγινε'),at:a.date+'T'+(a.time||'00:00')}));
  cliProjects(c).forEach(p=>{
    const s=R&&[...R.asg.filter(a=>a.projectId===p.id&&!a.pm&&a.date<=TODAY).map(a=>a.date),...diaryOf(p.id).map(r=>r.d).filter(d=>d<=TODAY)].sort()[0];
    if(s&&!S.tasks.some(t=>t.projectId===p.id&&t.doneOn&&t.doneOn<s))L.push({d:s,k:'start',text:'Ξεκίνησε η δουλειά: '+p.name,p:p.id,at:s+'T00:01'});
    if(projDone(p)){const e=S.tasks.filter(t=>t.projectId===p.id).map(t=>t.doneOn).filter(Boolean).sort().pop();if(e)L.push({d:e,k:'done',text:'Ολοκληρώθηκε: '+p.name,p:p.id,at:e+'T23:59'})}
    if(hasF('client')&&shareOf(p)&&p.share.at)L.push({d:String(p.share.at).slice(0,10),k:'link',text:'Φτιάχτηκε ο σύνδεσμος για «'+p.name+'»',p:p.id,at:p.share.at})});
  if(c.at)L.push({d:String(c.at).slice(0,10),k:'new',text:'Μπήκε στους πελάτες',at:'0'});
  return L.filter(x=>x.d).sort((a,b)=>b.d.localeCompare(a.d)||String(b.at).localeCompare(String(a.at)))}
// ονόματα πελατών από τα ραντεβού που δεν έχουν καρτέλα ακόμη
function cliFromAppts(){const m=new Map();
  (S.appts||[]).filter(a=>String(a.client||'').trim()&&!cliOfA(a)).sort(apOrd).forEach(a=>{const k=fold(a.client),x=m.get(k)||{name:a.client.trim(),phone:'',addr:'',ids:[]};
    if(a.phone)x.phone=a.phone;if(a.place&&!a.projectId)x.addr=a.place;x.ids.push(a.id);m.set(k,x)});
  return [...m.values()]}
const cliNew=o=>({id:uid('c'),name:'',person:'',phone:'',email:'',addr:'',afm:'',notes:'',log:[],at:stamp(),...o});
// νέες καρτέλες από τα ραντεβού· τα ραντεβού δείχνουν πια την καρτέλα
function cliImport(){const xs=cliFromAppts();S.clients=S.clients||[];
  xs.forEach(x=>{const c=cliNew({name:x.name,phone:x.phone,addr:x.addr});S.clients.push(c);x.ids.forEach(id=>{const a=S.appts.find(y=>y.id===id);if(a)a.clientId=c.id})});
  return xs.length}
function cliAddLog(c,r){c.log=c.log||[];c.log.push({id:uid('n'),d:r.d||TODAY,k:CLI_K.some(x=>x[0]===r.k)?r.k:'note',text:String(r.text||'').trim().slice(0,2000),by:r.by||'',at:stamp()});
  if(c.log.length>CLI_LOG)c.log=c.log.slice(-CLI_LOG);return c.log[c.log.length-1]}
// διαγραφή: τα έργα και τα ραντεβού μένουν, με το όνομα του πελάτη γραμμένο στο ραντεβού
function cliDel(id){const c=cliById(id);if(!c)return;
  (S.appts||[]).forEach(a=>{if(cliOfA(a)===c){if(!String(a.client||'').trim())a.client=c.name;if(!a.phone&&c.phone)a.phone=c.phone}});
  S.clients=cliList().filter(x=>x.id!==id);
  S.projects.forEach(p=>{if(p.clientId===id)delete p.clientId});(S.appts||[]).forEach(a=>{if(a.clientId===id)delete a.clientId})}
// demo: ένας πελάτης για κάθε έργο και ένας που περιμένει αυτοψία
function cliDemo(){const d=n=>add(TODAY,-n),at=n=>d(n)+'T09:00';
  const L=(id,n,k,text,by,t)=>({id,d:d(n),k,text,by,at:d(n)+'T'+(t||'10:15')});
  return [
    {id:'c1',name:'Αφοί Δημητρίου ΟΕ',person:'Νίκος Δημητρίου',phone:'697 512 3340',email:'n.dimitriou@example.com',addr:'Εγνατίας 88, Θεσσαλονίκη',afm:'',notes:'Κατασκευαστική εταιρεία, έργο με αντιπαροχή. Οι λογαριασμοί πάνε στο λογιστήριό τους με email.',at:at(45),
      log:[L('n1',40,'offer','Στάλθηκε η προσφορά για τον σκελετό και τις τοιχοποιίες.','Αντώνης Ρίζος'),L('n2',33,'meet','Υπογράφηκε το συμφωνητικό. Πληρωμή σε 4 δόσεις, μία με κάθε όροφο.','Αντώνης Ρίζος','12:30'),L('n3',3,'call','Ζήτησε να μπει και θυροτηλέφωνο στην προσφορά των ηλεκτρολογικών.','Ελένη Παπαδάκη','11:40')]},
    {id:'c2',name:'Οικογένεια Νικολαΐδη',person:'Γιώργος Νικολαΐδης',phone:'694 220 9981',email:'',addr:'Αγ. Αντωνίου 7, Πανόραμα',afm:'',notes:'Μένουν στο σπίτι όσο γίνεται η ανακαίνιση. Πριν από θόρυβο νωρίς το πρωί, ένα τηλέφωνο την προηγούμενη μέρα.',at:at(30),
      log:[L('n4',6,'call','Θέλουν να δουν δείγματα πλακιδίων πριν την επιμέτρηση των κουφωμάτων.','Ελένη Παπαδάκη','17:05')]},
    {id:'c3',name:'Κατάστημα Τσιμισκή',person:'Σοφία Μαυρίδου',phone:'2310 233 415',email:'',addr:'Τσιμισκή 112, Θεσσαλονίκη',afm:'',notes:'Το κατάστημα μένει ανοιχτό. Δουλειές με σκόνη μόνο πριν τις 10:00.',at:at(20),
      log:[L('n5',10,'meet','Διάλεξαν χρώματα για το βάψιμο. Θέλουν προσφορά και για τη βιτρίνα.','Κατερίνα Λιάπη')]},
    {id:'c4',name:'Κ. Ιωάννου',person:'',phone:'697 300 4512',email:'',addr:'Αγ. Δημητρίου 45, Θεσσαλονίκη',afm:'',notes:'Ενδιαφέρεται για ανακαίνιση μπάνιου.',at:at(2),
      log:[L('n6',2,'call','Πήρε τηλέφωνο για ανακαίνιση μπάνιου. Κλείσαμε αυτοψία.','Ελένη Παπαδάκη','09:20')]}]}
const CLI_DEMO={p:{p1:'c1',p2:'c2',p3:'c3'},a:{a1:'c4',a2:'c3',a3:'c2'}};
// demo: ένα αίτημα άδειας που περιμένει και μία «+1 μέρα» από την προηγούμενη μέρα (η επιπλέον μέρα είναι ήδη μέσα στις μέρες της εργασίας)
function fieldDemo(){let y=add(TODAY,-1);if(dow(y)===0)y=add(y,-1);const nw=add(weekStart(TODAY),8);
  return [{id:'fd1',k:'more',w:'w1',t:'t1',d:y,note:'Δεν ήρθαν τα τούβλα, συνεχίζουμε αύριο',at:y+'T16:40',st:'ok'},
    {id:'fd2',k:'leave',w:'w3',from:nw,to:add(nw,1),note:'Βάφτιση του ανιψιού',at:stamp(),st:'new'}]}
function blankState(cur){
  const o=demo(),st=(cur&&cur.settings)||{};
  Object.assign(o,{specialties:[],workers:[],projects:[],tasks:[],duties:[],appts:[],cpay:[],overrides:{},payments:{},dutyDone:{},wxMark:{},past:{},field:[],equip:[],att:[],attDemo:false,diary:[],wxLog:{},clients:[]});
  o.settings=Object.assign({},o.settings,st,{start:TODAY,payFrom:weekStart(TODAY)});if(!st.yard)delete o.settings.yard;
  if(cur&&cur.hist)o.hist=cur.hist;
  return o;
}
// σύγκριση ονομάτων χωρίς τόνους και πεζά/κεφαλαία· οι ειδικότητες ταιριάζουν και σε ενικό («Χτίστης» = «Χτίστες»)
const fold=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ς/g,'σ').replace(/\s+/g,' ').trim();
const sameSpec=(a,b)=>{a=fold(a);b=fold(b);if(!a||!b)return false;if(a===b)return true;return a.length>=5&&b.length>=5&&a.slice(0,5)===b.slice(0,5)};
const ROLE_W=[['αρχιεργατ','arxi'],['αρχιτεχνιτ','arxi'],['εργοδηγ','arxi'],['τεχνιτ','texn'],['μαστορ','texn'],['βοηθ','voith'],['εργατ','voith'],['υπαλληλ','ypal']];
// γραμμές από Excel ή λίστα: όνομα, ειδικότητα, ρόλος, μεροκάματο, κινητό, με όποια σειρά. Επιστρέφει [{name,spec,role,wage,phone}]
function parsePeople(text,specs){
  const out=[];
  String(text||'').split(/\r?\n/).forEach(line=>{
    if(!line.trim())return;
    let cells=line.includes('\t')?line.split('\t'):line.includes(';')?line.split(';'):line.includes(',')?line.split(','):[line];
    cells=cells.map(c=>c.trim()).filter(Boolean);
    const r={name:'',spec:'',role:'',wage:'',phone:''};
    if(cells.length===1){const m=cells[0].match(/(\+?\d[\d ]{8,}\d)\s*$/);if(m){r.phone=m[1].trim();cells=[cells[0].slice(0,m.index).trim()].filter(Boolean)}}
    if(cells.some(c=>/^(ονομα|ονοματεπωνυμο|επωνυμο)/.test(fold(c))))return;   // γραμμή επικεφαλίδων
    for(const c of cells){
      const dg=c.replace(/\D/g,''),f=fold(c);
      if(!r.phone&&dg.length>=10&&/^[\d\s+().-]+$/.test(c)){r.phone=c;continue}
      if(!r.wage&&/^\d{1,3}([.,]\d{1,2})?\s*(€|ευρω)?$/.test(f)){r.wage=+c.replace(',','.').replace(/[^\d.]/g,'');continue}
      const rl=!r.role&&ROLE_W.find(([k])=>f.startsWith(k)&&f.split(' ').length<=2);if(rl){r.role=rl[1];continue}
      const sp=!r.spec&&(specs||[]).find(x=>sameSpec(x,c));if(sp&&(r.name||cells.length>1)){r.spec=sp;continue}
      if(!r.name){r.name=c.replace(/\s+/g,' ');continue}
      if(!r.spec&&/^[^\d]+$/.test(c)){r.spec=c.charAt(0).toUpperCase()+c.slice(1);continue}
    }
    if(r.name)out.push(r);
  });
  return out;
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
  // μία φορά: demo βαθμοί και δυσκολίες σε demo δεδομένα (μόνο όπου όνομα και τίτλος είναι του demo)
  if(o&&Array.isArray(o.workers)&&Array.isArray(o.tasks)&&!o.rateDemo){
    o.rateDemo=true;const d=demo();
    o.workers.forEach(w=>{const x=d.workers.find(y=>y.id===w.id);if(x&&x.rating&&w.rating==null&&x.name===w.name)w.rating=x.rating});
    o.tasks.forEach(t=>{const x=d.tasks.find(y=>y.id===t.id);if(x&&x.diff&&t.diff==null&&x.title===t.title)t.diff=x.diff});
  }
  // μία φορά: demo διαθεσιμότητα και δεύτερη ειδικότητα σε demo εργαζόμενους
  if(o&&Array.isArray(o.workers)&&!o.availDemo){
    o.availDemo=true;const d=demo();
    o.workers.forEach(w=>{const x=d.workers.find(y=>y.id===w.id);if(!x||x.name!==w.name)return;if(x.days&&w.days==null)w.days=x.days;if(x.spec2&&w.spec2==null&&(o.specialties||[]).some(s=>s.id===x.spec2))w.spec2=x.spec2});
  }
  // μία φορά: ημερομηνία ολοκλήρωσης στις ολοκληρωμένες εργασίες του demo
  if(o&&Array.isArray(o.tasks)&&!o.sumDemo){
    o.sumDemo=true;const d=demo();
    o.tasks.forEach(t=>{const x=d.tasks.find(y=>y.id===t.id);if(x&&x.doneOn&&t.status==='done'&&!t.doneOn&&x.title===t.title)t.doneOn=x.doneOn});
  }
  // μία φορά: demo εξοπλισμός και λήξεις, όταν τα έργα και οι εργαζόμενοι είναι του demo
  if(o&&Array.isArray(o.workers)&&Array.isArray(o.projects)&&!o.eqDemo){
    o.eqDemo=true;const d=demo(),same=(a,b,k)=>{const x=(a||[]).find(y=>y.id===k),z=(b||[]).find(y=>y.id===k);return x&&z&&x.name===z.name};
    if(!(o.equip||[]).length&&same(o.projects,d.projects,'p1')&&same(o.projects,d.projects,'p2')&&same(o.workers,d.workers,'w1')){o.equip=d.equip;
      const xw=EXPW_DEMO();o.workers.forEach(w=>{if(xw[w.id]&&!w.exp&&same(o.workers,d.workers,w.id))w.exp=xw[w.id]})}}
  // μία φορά: demo συμβόλαια, έξοδα και υλικά, όταν τα έργα και οι εργασίες είναι του demo
  if(o&&Array.isArray(o.projects)&&Array.isArray(o.tasks)&&!o.profitDemo){
    o.profitDemo=true;const d=demo(),same=(a,b,k)=>{const x=(a||[]).find(y=>y.id===k),z=(b||[]).find(y=>y.id===k);return x&&z&&(x.name||x.title)===(z.name||z.title)};
    if(['p1','p2','p3'].every(k=>same(o.projects,d.projects,k))){const ts=o.tasks.filter(t=>same(o.tasks,d.tasks,t.id));profitDemo({projects:o.projects,tasks:ts})}}
  // μία φορά: σημεία εργοταξίων του demo για τις παρουσίες· στα δεδομένα του demo γεμίζουν και παρουσίες των τελευταίων ημερών
  if(o&&Array.isArray(o.projects)&&!o.attSeed){
    o.attSeed=true;const d=demo(),same=k=>{const x=o.projects.find(y=>y.id===k),z=d.projects.find(y=>y.id===k);return x&&z&&x.name===z.name};
    if(['p1','p2','p3'].every(same)){attDemoSites(o);o.attDemo=true}}
  // μία φορά: demo σημειώσεις και φωτογραφίες-δείγματα στο ημερολόγιο, όταν τα έργα και οι εργαζόμενοι είναι του demo
  if(o&&Array.isArray(o.projects)&&Array.isArray(o.workers)&&!o.diarySeed){
    o.diarySeed=true;const d=demo(),same=(a,b,k)=>{const x=(a||[]).find(y=>y.id===k),z=(b||[]).find(y=>y.id===k);return x&&z&&x.name===z.name};
    if(!(o.diary||[]).length&&['p1','p2','p3'].every(k=>same(o.projects,d.projects,k))&&['w1','w2','w10'].every(k=>same(o.workers,d.workers,k))){
      const wd=(o.settings&&o.settings.workdays)||[1,2,3,4,5,6];o.diary=diaryDemo(wd);o.wxLog=Object.assign(wxLogDemo(wd),o.wxLog||{})}}
  // μία φορά: demo αναφορές από το εργοτάξιο, όταν οι εργαζόμενοι και η εργασία είναι του demo
  if(o&&Array.isArray(o.workers)&&Array.isArray(o.tasks)&&!o.fieldDemo){
    o.fieldDemo=true;const d=demo(),same=(a,b,k)=>{const x=(a||[]).find(y=>y.id===k),z=(b||[]).find(y=>y.id===k);return x&&z&&(x.name||x.title)===(z.name||z.title)};
    if(!(o.field||[]).length&&same(o.workers,d.workers,'w1')&&same(o.workers,d.workers,'w3')&&same(o.tasks,d.tasks,'t1'))o.field=d.field}
  // μία φορά: demo προθεσμίες σε demo έργα
  if(o&&Array.isArray(o.projects)&&!o.dueDemo){
    o.dueDemo=true;const d=demo();
    o.projects.forEach(p=>{const x=d.projects.find(y=>y.id===p.id);if(x&&x.due&&p.due==null&&x.name===p.name)p.due=x.due});
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
  if(o&&!Array.isArray(o.clients))o.clients=[];
  // μία φορά: demo πελάτες, όταν τα έργα είναι του demo· τα έργα και τα ραντεβού του demo δείχνουν την καρτέλα τους
  if(o&&Array.isArray(o.projects)&&!o.cliDemo){
    o.cliDemo=true;const d=demo(),same=(a,b,k,f)=>{const x=(a||[]).find(y=>y.id===k),z=(b||[]).find(y=>y.id===k);return x&&z&&x[f]===z[f]};
    if(!o.clients.length&&['p1','p2','p3'].every(k=>same(o.projects,d.projects,k,'name'))){o.clients=cliDemo();
      Object.entries(CLI_DEMO.p).forEach(([k,c])=>{const p=o.projects.find(y=>y.id===k);if(p&&!p.clientId)p.clientId=c});
      Object.entries(CLI_DEMO.a).forEach(([k,c])=>{const a=(o.appts||[]).find(y=>y.id===k);if(a&&!a.clientId&&same(o.appts,d.appts,k,'title'))a.clientId=c})}}
  if(o&&o.settings){if(o.settings.sendTime==null)o.settings.sendTime='06:30';if(o.settings.autoSend==null)o.settings.autoSend=false}
  return o;
}
const byId=(arr,id)=>arr.find(x=>x.id===id);
const P=id=>byId(S.projects,id), W=id=>byId(S.workers,id), T=id=>byId(S.tasks,id), SP=id=>byId(S.specialties,id);
const PSEUDO={office:{name:'Γραφείο',color:'muted'},gen:{name:'Αποθήκη και συντήρηση',color:'gen'}};
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
// Πακέτα συνδρομής. Κάθε λειτουργία ανοίγει από το χαμηλότερο πακέτο που την έχει· ό,τι δεν είναι στο FEATS υπάρχει σε όλα.
// people: άτομα στα έργα (γραφείο και εργολάβος δεν μετράνε), office: χρήστες γραφείου (0 = χωρίς όριο). Τα όρια μόνο προειδοποιούν.
const PLANS=[{id:'mastoras',name:'Μάστορας',gen:'Μάστορα',price:9.99,people:5,office:1},{id:'synergeio',name:'Συνεργείο',gen:'Συνεργείου',price:19.99,people:15,office:3},{id:'ergotaxio',name:'Εργοτάξιο',gen:'Εργοταξίου',price:39.99,people:40,office:0}];
const FEATS={wx:['synergeio','Πρόγραμμα με τον καιρό'],partners:['synergeio','Συνεργάτες'],appts:['synergeio','Ραντεβού με πελάτες'],clients:['synergeio','Καρτέλα πελάτη'],pm:['synergeio','Διαχειριστές έργων'],
  gaps:['synergeio','Τι λείπει: κενά στο πρόγραμμα'],deadline:['synergeio','Προθεσμία παράδοσης ανά έργο'],avail:['synergeio','Διαθεσιμότητα και δεύτερη ειδικότητα'],search:['synergeio','Αναζήτηση σε όλη την εφαρμογή'],weekly:['synergeio','Εβδομαδιαία σύνοψη για τον εργολάβο'],setup:['synergeio','Οδηγός πρώτης ρύθμισης'],
  progress:['synergeio','Πρόοδος από το εργοτάξιο'],leave:['synergeio','Άδειες από το κινητό'],acc:['synergeio','Κατάσταση για τον λογιστή'],export:['synergeio','Εξαγωγή σε Excel και PDF'],push:['synergeio','Ειδοποιήσεις στο κινητό'],
  rating:['ergotaxio','Βαθμός εργαζομένου και δυσκολία εργασίας'],history:['ergotaxio','Ιστορικό αλλαγών με αναίρεση'],profit:['ergotaxio','Κέρδος ανά έργο'],gps:['ergotaxio','Παρουσίες με GPS'],materials:['ergotaxio','Υλικά πριν την εργασία'],equip:['ergotaxio','Μηχανήματα, οχήματα και λήξεις'],diary:['ergotaxio','Ημερολόγιο έργου με φωτογραφίες'],client:['ergotaxio','Σελίδα προόδου για τον πελάτη']};
const planIx=id=>{const i=PLANS.findIndex(p=>p.id===id);return i<0?PLANS.length-1:i};   // χωρίς ρύθμιση: το ανώτερο
const planOf=st=>PLANS[planIx(((st||S&&S.settings)||{}).plan)];
const planHas=(f,st)=>!FEATS[f]||planIx(planOf(st).id)>=planIx(FEATS[f][0]);
// λειτουργίες που έκλεισε ο διαχειριστής στις Ρυθμίσεις (settings.off)· τα δεδομένα τους μένουν
const isOn=(f,st)=>!((((st||S&&S.settings)||{}).off)||[]).includes(f);
const hasF=(f,st)=>planHas(f,st)&&isOn(f,st);
const needPlan=f=>FEATS[f]?PLANS[planIx(FEATS[f][0])]:PLANS[0];
const planPeople=()=>S.workers.filter(w=>!isOffice(w)).length;
// Βαθμός εργαζομένου (1-5, τον βλέπει μόνο το γραφείο) και δυσκολία εργασίας (1-5).
// Οι καλύτεροι μπαίνουν στις δύσκολες, αλλά μετά από `streak` συνεχόμενες μέρες σε δύσκολη εργασία πάνε σε πιο ελαφριά.
// bonus: % του μεροκάματου ανά μέρα σε δύσκολη εργασία, μόνο ως πρόταση στις Πληρωμές.
const RATE_D={on:true,hard:4,streak:2,bonus:10};
const rateCfg=()=>Object.assign({},RATE_D,(S&&S.settings&&S.settings.rate)||{});
const rateOn=()=>hasF('rating')&&rateCfg().on!==false;
const wRate=w=>Math.min(5,Math.max(1,Math.round(+(w&&w.rating)||3)));
const tDiff=t=>Math.min(5,Math.max(1,Math.round(+(t&&t.diff)||3)));
const isHard=t=>tDiff(t)>=+rateCfg().hard;
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
// ιστορικό αλλαγών: S.hist=[{id,at,by,msg,undo?}]· undo = οι αλλαγές που αναίρεσε μια εγγραφή
const stamp=()=>{const d=new Date();return ds(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
function undoneIds(hist){const U=new Set();(hist||[]).forEach(e=>{if(e&&e.undo)[].concat(e.undo).forEach(x=>U.add(x))});return U}
// η τελευταία αλλαγή που δεν έχει αναιρεθεί: μόνο αυτή αναιρείται, ώστε να μη χαθεί κάτι που έγινε αργότερα
function undoTarget(hist){hist=hist||[];const U=undoneIds(hist);for(let i=hist.length-1;i>=0;i--){const e=hist[i];if(!e||e.undo||U.has(e.id))continue;return e}return null}
// διαθεσιμότητα (πακέτο Συνεργείο): w.days = οι μέρες της εβδομάδας που δουλεύει· τις άλλες έχει ρεπό
const availOn=()=>hasF('avail');
const isRest=(w,d)=>availOn()&&Array.isArray(w.days)&&w.days.length>0&&!w.days.includes(dow(d));
const isLeave=(w,d)=>(w.off||[]).includes(d)||ov(d,w.id)?.type==='off';
const isOff=(w,d)=>isLeave(w,d)||isRest(w,d);
const offWord=(w,d)=>isLeave(w,d)?(S.overrides[d+'|'+w.id]?.why==='absent'?'Απουσία':'Άδεια'):'Ρεπό';
// δεύτερη ειδικότητα: μπαίνει βοηθός ή αναπληρωτής υπεύθυνος και σε αυτή
const sp2=w=>availOn()&&w&&w.spec2&&w.spec2!==w.specialtyId?w.spec2:null;
const canSpec=(w,sid)=>w.specialtyId===sid||sp2(w)===sid;
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
  if(!hasF('duties'))return [];
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
const wxCfg=()=>{const c=Object.assign(wxDefaults(),(S&&S.settings&&S.settings.wx)||{});if(S&&S.settings&&!hasF('wx'))c.on=false;return c};
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
function wxDay(pid,d){if(S&&S.settings&&!hasF('wx'))return null;const l=projLoc(pid),x=WX&&WX.locs[locKey(l.lat,l.lon)];return x&&x.days[d]||null}
const isWet=(f,c)=>!!f&&(+f.mm||0)>=(+c.minMm||0)&&(f.p==null||f.p>=(+c.minProb||0));
// βρέχει σε ένα έργο μια μέρα; πρώτα ό,τι όρισες εσύ για τη μέρα, μετά η πρόγνωση
function rainy(pid,d){
  if(!hasF('wx'))return false;
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
const apptsOn=(d,wid)=>!hasF('appts')?[]:(S.appts||[]).filter(a=>a.date===d&&(!wid||(a.people||[]).includes(wid))).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
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
// περασμένες μέρες: καταγράφονται όπως έγιναν (S.past[ημέρα]) και δεν ξαναϋπολογίζονται.
// Αν αλλάξει κάτι γι' αυτή τη μέρα (άδεια ή χειροκίνητη ανάθεση), αλλάζουν μόνο τα άτομα που αφορά.
const dayFp=d=>Object.keys(S.overrides||{}).filter(k=>k.startsWith(d+'|')).sort().map(k=>k+JSON.stringify(S.overrides[k])).join(';')+'#'+S.workers.filter(w=>(w.off||[]).includes(d)).map(w=>w.id).sort().join(',');
function packDay(R,d){const D=R.byDay[d],ids=xs=>xs.filter(Boolean).map(w=>w.id);
  return {fp:dayFp(d),
    j:D.jobs.map(j=>({t:j.task.id,tt:j.task.title,p:j.task.projectId,sp:j.task.specialtyId,l:j.lead?j.lead.id:null,h:ids(j.helpers),x:[...(j.extra||[])],f:[...(j.forced||[])],m:[...(j.multi||[])],s:j.sub?1:0,k:j.short?1:0,n:j.dayNo,r:j.rain?1:0})),
    g:D.gen.map(g=>[g.w.id,g.forced?1:0]),w:(D.wet||[]).map(t=>t.id),
    q:(R.waiting[d]||[]).map(x=>[x.task.id,x.reason,x.rain?1:0]),
    a:R.asg.filter(a=>a.date===d).map(a=>[a.taskId,a.projectId,a.workerId,a.wage,a.share||0,(a.job?1:0)|(a.pm?2:0)]),
    e:S.workers.map(w=>w.id)}}
function unpackDay(rec,d,asg,waiting){
  let jobs=rec.j.map(x=>({task:T(x.t)||{id:x.t,title:x.tt||'',projectId:x.p,specialtyId:x.sp,days:0,gone:true},lead:x.l?anyone(x.l)||null:null,sub:!!x.s,
    helpers:(x.h||[]).map(anyone).filter(Boolean),forced:new Set(x.f||[]),extra:new Set(x.x||[]),multi:new Set(x.m||[]),short:!!x.k,dayNo:x.n,rain:!!x.r,past:true}));
  let gen=(rec.g||[]).map(([w,f])=>({w:anyone(w),forced:!!f})).filter(g=>g.w);
  const q=(rec.q||[]).map(([t,reason,r])=>({task:T(t),reason,rain:!!r})).filter(x=>x.task);if(q.length)waiting[d]=q;
  const wet=(rec.w||[]).map(T).filter(Boolean);
  const A=(rec.a||[]).map(([t,p,w,wage,sh,fl])=>Object.assign({date:d,taskId:t,projectId:p,workerId:w,wage},sh?{share:sh}:{},fl&1?{job:true}:{},fl&2?{pm:true}:{}));
  if(rec.fp===dayFp(d)){asg.push(...A);return {jobs,gen,wet}}
  // διόρθωση: όποιος είναι πια σε άδεια ή έχει χειροκίνητη ανάθεση φεύγει από τη θέση του
  const gone=w=>isOff(w,d)||!!ov(d,w.id);
  jobs.forEach(j=>{if(j.lead&&gone(j.lead)){j.lead=null;j.sub=false}j.helpers=j.helpers.filter(w=>!gone(w));j.forced.forEach(id=>{if(!ov(d,id))j.forced.delete(id)})});
  gen=gen.filter(g=>!gone(g.w));
  S.workers.forEach(w=>{const o=ov(d,w.id);if(!o||isOff(w,d)||isOffice(w))return;
    if(o.type==='gen'){gen.push({w,forced:true});return}
    taskIdsOf(o).forEach(id=>{const t=T(id);if(!t)return;let j=jobs.find(x=>x.task.id===id);
      if(!j){j={task:t,lead:null,sub:false,helpers:[],forced:new Set(),extra:new Set(),multi:new Set(),short:false,dayNo:null,rain:false,past:true};jobs.push(j)}
      j.forced.add(w.id);
      if(!j.lead&&w.role!=='voith'&&canSpec(w,t.specialtyId)){j.lead=w;j.sub=w.id!==t.responsibleId}else j.helpers.push(w)})});
  // όποιος ξαναβρέθηκε διαθέσιμος (π.χ. σβήστηκε η άδεια) ενισχύει συνεργείο της ειδικότητάς του ή πάει αποθήκη
  const inDay=new Set();jobs.forEach(j=>[j.lead,...j.helpers].filter(Boolean).forEach(w=>inDay.add(w.id)));gen.forEach(g=>inDay.add(g.w.id));
  if(S.settings.fillIdle)S.workers.filter(w=>(rec.e||[]).includes(w.id)&&!inDay.has(w.id)&&!isOff(w,d)&&!isOffice(w)&&!isExt(w)).forEach(w=>{
    const lj=w.role!=='voith'&&(jobs.find(j=>!j.lead&&j.task.responsibleId===w.id)||jobs.find(j=>!j.lead&&canSpec(w,j.task.specialtyId)));
    if(lj){lj.lead=w;lj.sub=w.id!==lj.task.responsibleId;return}
    const j=jobs.find(j=>j.lead&&canSpec(w,j.task.specialtyId))||(w.role==='voith'?jobs.find(j=>j.lead):null);
    if(j){j.helpers.push(w);j.extra.add(w.id)}else gen.push({w,forced:false})});
  jobs=jobs.filter(j=>j.lead||j.helpers.length);
  // μεροκάματα: όπου το άτομο έμεινε στην ίδια θέση κρατιέται το ποσό που καταγράφηκε
  const old={};A.forEach(a=>{old[a.taskId+'|'+a.workerId]=a});
  const cnt={};jobs.forEach(j=>{j.multi=new Set();[j.lead,...j.helpers].filter(Boolean).forEach(w=>cnt[w.id]=(cnt[w.id]||0)+1)});
  jobs.forEach(j=>[j.lead,...j.helpers].filter(Boolean).forEach(w=>{const n=cnt[w.id],o=old[j.task.id+'|'+w.id];if(n>1)j.multi.add(w.id);
    asg.push(Object.assign({date:d,taskId:j.task.id,projectId:j.task.projectId,workerId:w.id,wage:o&&(o.share||1)===(n>1?1/n:1)?o.wage:dayCost(w,j.task)/n},n>1?{share:1/n}:{},isExt(w)&&w.pay==='job'?{job:true}:{}))}));
  gen.forEach(g=>{const o=old['null|'+g.w.id];asg.push({date:d,taskId:null,projectId:'gen',workerId:g.w.id,wage:o&&o.projectId==='gen'?o.wage:rate(g.w,'gen')})});
  // γραφείο: όπως καταγράφηκε, εκτός από όσους λείπουν ή άλλαξαν διαχείριση έργων εκείνη τη μέρα
  S.workers.filter(w=>isOffice(w)&&(rec.e||[]).includes(w.id)&&!isOff(w,d)).forEach(w=>{
    const mine=A.filter(a=>a.workerId===w.id&&!a.taskId&&a.projectId!=='gen');
    if(mine.length&&!ov(d,w.id)){asg.push(...mine);return}
    const pp=pmProjects(w.id,d);
    if(pp.length)pp.forEach(pid=>asg.push({date:d,taskId:null,projectId:pid,workerId:w.id,wage:rate(w,pid)/pp.length,share:1/pp.length,pm:true}));
    else asg.push({date:d,taskId:null,projectId:'office',workerId:w.id,wage:+w.wage||0})});
  return {jobs,gen,wet}}
// γράφει όσες περασμένες εργάσιμες λείπουν ή άλλαξαν· επιστρέφει πόσες γράφτηκαν
function freezePast(R){if(!S.past||typeof S.past!=='object')S.past={};let n=0;
  Object.keys(R.byDay).forEach(d=>{if(d>=TODAY)return;const r=S.past[d];if(r&&r.fp===dayFp(d))return;S.past[d]=packDay(R,d);n++});
  // κρατά περίπου ενάμιση χρόνο
  const lim=add(TODAY,-550);Object.keys(S.past).forEach(d=>{if(d<lim){delete S.past[d];n++}});
  return n}
// χρειάζεται καταγραφή; (φθηνός έλεγχος χωρίς να στηθεί το πρόγραμμα)
function pastPending(){today();const P0=S.past||{};let d=nextWork(S.settings.start||TODAY);for(let i=0;i<500&&d<TODAY;i++,d=add(d,1)){if(isWork(d)&&!P0[d])return true}return false}
function schedule(){
  today();
  const start=nextWork(S.settings.start||TODAY);
  const minEnd=add(weekStart(TODAY),13);
  // μια εργασία που ολοκληρώθηκε μετράει ως ανοιχτή στις μέρες πριν την ολοκλήρωσή της, ώστε να μην αλλάζουν οι περασμένες μέρες
  const live=(t,d)=>t.status!=='done'||(!!t.doneOn&&d<t.doneOn);
  const open=S.tasks.filter(t=>live(t,start));
  const rem={},begin={},finish={},prevCrew={},waiting={},lastOn={};
  open.forEach(t=>rem[t.id]=Math.max(1,+t.days||1));
  const byDay={},asg=[],PAST=S.past||{};
  let left=open.length,day=start,idleStreak=0,guard=0;
  const depOk=(t,d)=>{const a=T(t.after);if(!t.after||!a||(a.status==='done'&&!live(a,d)))return true;return finish[t.after]&&finish[t.after]<d};
  const lastEnd={v:start};
  // συνεχόμενες εργάσιμες μέρες κάθε εργαζόμενου σε δύσκολη εργασία
  const RO=rateOn(),RC=rateCfg(),hardRun={};
  const tired=(w,t)=>RO&&isHard(t)&&(hardRun[w.id]||0)>=+RC.streak;
  // ταίριασμα βαθμού και δυσκολίας: στις δύσκολες οι καλύτεροι, στις εύκολες φυλάγονται
  const fit=(w,t)=>!RO?0:(tired(w,t)?100:0)+(isHard(t)?-(wRate(w)-3)*0.5:tDiff(t)<=2?(wRate(w)-3)*0.3:0);
  while(guard<500&&((left>0&&idleStreak<40)||day<=minEnd)){
    guard++;
    if(!isWork(day)){day=add(day,1);continue}
    // όσες ολοκληρώθηκαν από σήμερα και μετά δεν παίρνουν άλλες μέρες
    open.forEach(t=>{if(rem[t.id]>0&&!live(t,day)){rem[t.id]=0;left--;if(begin[t.id])finish[t.id]=lastOn[t.id]}});
    // περασμένη μέρα που έχει καταγραφεί: μένει όπως ήταν
    const rec=day<TODAY?PAST[day]:null;let jobs,gen,wet;
    if(rec){({jobs,gen,wet}=unpackDay(rec,day,asg,waiting));
      jobs.forEach(j=>{const t=j.task;if(j.dayNo==null)j.dayNo=rem[t.id]>0?(+t.days||1)-rem[t.id]+1:+t.days||1;if(j.lead&&rem[t.id]>0){if(!begin[t.id])begin[t.id]=day;lastOn[t.id]=day;rem[t.id]--;if(rem[t.id]===0){finish[t.id]=day;left--}}
        prevCrew[t.id]=j.helpers.filter(w=>!j.extra.has(w.id)).map(w=>w.id)});
    }else{
    const busy=new Set(S.workers.filter(w=>isOff(w,day)||isOffice(w)).map(w=>w.id));
    // χειροκίνητες αναθέσεις της ημέρας
    const forced={};gen=[];
    S.workers.forEach(w=>{if(busy.has(w.id))return;const o=ov(day,w.id);if(!o)return;
      if(o.type==='task'||o.type==='tasks'){taskIdsOf(o).forEach(id=>{const t=T(id);if(t&&live(t,day)&&rem[t.id]>0){(forced[t.id]=forced[t.id]||[]).push(w);busy.add(w.id)}})}
      else if(o.type==='gen'){gen.push({w,forced:true});busy.add(w.id)}});
    jobs=[];wet=[];
    // όσες θέλουν στεγνή μέρα και στο έργο τους βρέχει μένουν για την επόμενη στεγνή· το συνεργείο πάει αλλού
    const ready=open.filter(t=>{
      if(rem[t.id]<=0||!live(t,day))return false;if(forced[t.id])return true;
      if(!((!t.earliest||t.earliest<=day)&&depOk(t,day)))return false;
      if(t.dry&&rainy(t.projectId,day)){wet.push(t);(waiting[day]=waiting[day]||[]).push({task:t,reason:'Βροχή: θέλει στεγνή μέρα',rain:true});return false}
      return true})
      .sort((a,b)=>(a.priority-b.priority)||((begin[a.id]?0:1)-(begin[b.id]?0:1))||(RO?tDiff(b)-tDiff(a):0)||((a.earliest||'').localeCompare(b.earliest||''))||S.tasks.indexOf(a)-S.tasks.indexOf(b));
    for(const t of ready){
      const fx=forced[t.id]||[];
      let lead=fx.find(w=>w.id===t.responsibleId)||fx.find(w=>w.role!=='voith'&&canSpec(w,t.specialtyId))||null,sub=false;
      if(lead)sub=lead.id!==t.responsibleId;
      else{
        const r=W(t.responsibleId);
        if(r&&!busy.has(r.id))lead=r;
        else if(isExt(r))lead=null;   // ο συνεργάτης δεν αντικαθίσταται από το προσωπικό
        else{lead=S.workers.filter(w=>canSpec(w,t.specialtyId)&&w.role!=='voith'&&!isExt(w)&&!busy.has(w.id)).sort((a,b)=>((a.specialtyId===t.specialtyId?0:1)-(b.specialtyId===t.specialtyId?0:1))||fit(a,t)-fit(b,t))[0]||null;sub=!!lead}
        if(lead)busy.add(lead.id);
        else{lead=fx.find(w=>w.role!=='voith')||null;sub=!!lead}
      }
      if(!lead&&!fx.length){(waiting[day]=waiting[day]||[]).push({task:t,reason:W(t.responsibleId)&&isOff(W(t.responsibleId),day)?(isExt(W(t.responsibleId))?'Ο συνεργάτης δεν είναι διαθέσιμος':isLeave(W(t.responsibleId),day)?'Ο υπεύθυνος είναι σε άδεια':'Ο υπεύθυνος έχει ρεπό'):(isExt(W(t.responsibleId))?'Ο συνεργάτης είναι σε άλλη εργασία':'Ο υπεύθυνος είναι σε άλλη εργασία')});continue}
      const helpers=fx.filter(w=>w!==lead);
      const need=Math.max(0,+t.helpers||0);
      if(lead&&helpers.length<need){
        const prev=prevCrew[t.id]||[];
        const near=w=>w.specialtyId===t.specialtyId?0:sp2(w)===t.specialtyId?0.5:1;
        const pool=S.workers.filter(w=>w.role==='voith'&&!busy.has(w.id)&&(canSpec(w,t.specialtyId)||w.specialtyId==='gen'))
          .sort((a,b)=>((prev.includes(a.id)?0:2)+near(a)+fit(a,t))-((prev.includes(b.id)?0:2)+near(b)+fit(b,t)));
        pool.slice(0,need-helpers.length).forEach(w=>{helpers.push(w);busy.add(w.id)});
      }
      prevCrew[t.id]=helpers.map(w=>w.id);
      jobs.push({task:t,lead,sub,helpers,forced:new Set(fx.map(w=>w.id)),extra:new Set(),short:helpers.length<need,dayNo:(+t.days||1)-rem[t.id]+1,rain:!!t.dry&&rainy(t.projectId,day)});
      if(lead){
        if(!begin[t.id])begin[t.id]=day;
        lastOn[t.id]=day;rem[t.id]--;
        if(rem[t.id]===0){finish[t.id]=day;left--}
      }
    }
    // όλοι να έχουν δουλειά: όσοι περισσεύουν ενισχύουν συνεργεία ή πάνε αποθήκη
    if(S.settings.fillIdle&&jobs.length){
      S.workers.filter(w=>!busy.has(w.id)&&!isExt(w)).forEach(w=>{
        let same=jobs.filter(j=>j.task.specialtyId===w.specialtyId);if(!same.length&&sp2(w))same=jobs.filter(j=>j.task.specialtyId===sp2(w));
        let cand=same.length?same:(w.role==='voith'?jobs.slice():[]);
        // κουρασμένος από δύσκολες: πάει σε ελαφριά εργασία ή στην αποθήκη, όχι ξανά σε δύσκολη
        if(RO&&cand.length&&cand.every(j=>tired(w,j.task))){const lite=jobs.filter(j=>!isHard(j.task)&&(canSpec(w,j.task.specialtyId)||w.role==='voith'));cand=lite}
        if(cand.length){cand.sort((a,b)=>((tired(w,a.task)?1:0)-(tired(w,b.task)?1:0))||(a.helpers.length-(+a.task.helpers||0))-(b.helpers.length-(+b.task.helpers||0))||a.helpers.length-b.helpers.length);const j=cand[0];j.helpers.push(w);j.extra.add(w.id)}
        else gen.push({w,forced:false});
        busy.add(w.id)});
    }
    // εναλλαγή: όποιος έχει κουραστεί σε δύσκολη αλλάζει θέση με κάποιον από ελαφριά εργασία που μπορεί να τον αντικαταστήσει
    if(RO){const ok=(w,t)=>canSpec(w,t.specialtyId)||(w.role==='voith'&&w.specialtyId==='gen');
      jobs.forEach(j=>{if(!isHard(j.task))return;
        j.helpers.forEach((w,i)=>{if(j.forced.has(w.id)||!tired(w,j.task))return;
          for(const k of jobs){if(k===j||isHard(k.task)||!ok(w,k.task))continue;
            const ix=k.helpers.findIndex(x=>!k.forced.has(x.id)&&!tired(x,j.task)&&ok(x,j.task)&&!j.helpers.includes(x));
            if(ix<0)continue;const x=k.helpers[ix];k.helpers[ix]=w;j.helpers[i]=x;
            const we=j.extra.has(w.id),xe=k.extra.has(x.id);j.extra.delete(w.id);k.extra.delete(x.id);if(we)j.extra.add(x.id);if(xe)k.extra.add(w.id);break}})});
      jobs.forEach(j=>{prevCrew[j.task.id]=j.helpers.filter(w=>!j.extra.has(w.id)).map(w=>w.id)})}
    // όποιος είναι σε πολλές εργασίες την ίδια μέρα μοιράζει το μεροκάματο ισόποσα
    const cnt={};jobs.forEach(j=>{j.multi=new Set();[j.lead,...j.helpers].filter(Boolean).forEach(w=>cnt[w.id]=(cnt[w.id]||0)+1)});
    jobs.forEach(j=>[j.lead,...j.helpers].filter(Boolean).forEach(w=>{const n=cnt[w.id];if(n>1)j.multi.add(w.id);
      asg.push(Object.assign({date:day,taskId:j.task.id,projectId:j.task.projectId,workerId:w.id,wage:dayCost(w,j.task)/n},n>1?{share:1/n}:{},isExt(w)&&w.pay==='job'?{job:true}:{}))}));
    gen.forEach(g=>asg.push({date:day,taskId:null,projectId:'gen',workerId:g.w.id,wage:rate(g.w,'gen')}));
    S.workers.filter(w=>isOffice(w)&&!isOff(w,day)).forEach(w=>{
      const pp=pmProjects(w.id,day);
      if(pp.length)pp.forEach(pid=>asg.push({date:day,taskId:null,projectId:pid,workerId:w.id,wage:rate(w,pid)/pp.length,share:1/pp.length,pm:true}));
      else asg.push({date:day,taskId:null,projectId:'office',workerId:w.id,wage:+w.wage||0})});
    }
    if(RO){const hd=new Set();jobs.forEach(j=>{if(isHard(j.task))[j.lead,...j.helpers].filter(Boolean).forEach(w=>hd.add(w.id))});
      S.workers.forEach(w=>{hardRun[w.id]=hd.has(w.id)?(hardRun[w.id]||0)+1:0})}
    byDay[day]={jobs,gen,wet};
    if(jobs.length)lastEnd.v=day;
    idleStreak=jobs.length?0:idleStreak+1;
    day=add(day,1);
  }
  const unplanned=open.filter(t=>rem[t.id]>0&&t.status!=='done');
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
  if(x.off)return offWord(w,d)+'\n';
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
const SIGN0='\n'+BRAND.name+' · '+BRAND.tag;
const sign=()=>(S&&S.settings&&S.settings.company&&S.settings.company.name?'\n'+S.settings.company.name:'')+SIGN0;
function personText(R,w,ws){
  let s='ΠΡΟΓΡΑΜΜΑ ΕΒΔΟΜΑΔΑΣ '+fmtS(ws)+' – '+fmtS(add(ws,6))+'\n'+w.name+'\n';
  weekDays(ws).forEach(d=>{s+='\n'+fmt(d)+': '+(dayBlock(R,w,d)||'—\n')});
  return s+sign();
}
// σύνοψη εβδομάδας για τον εργολάβο: τι τελείωσε, τι προχωρά, πόσο κόστισε κάθε έργο και αν προλαβαίνει την παράδοση
const SUM_D={day:5,time:'17:00',auto:false};
const sumCfg=()=>({...SUM_D,...((S&&S.settings&&S.settings.sum)||{})});
const nf1=n=>String(Math.round(n*10)/10).replace('.',',');
function weekSum(R,ws){
  ws=weekStart(ws||TODAY);const we=add(ws,6),nws=add(ws,7),nwe=add(ws,13),days=weekDays(ws);
  const A=R.asg.filter(a=>a.date>=ws&&a.date<=we),dl=hasF('deadline');
  const sum=xs=>({cost:xs.reduce((s,a)=>s+a.wage,0),md:xs.reduce((s,a)=>s+(a.share||1),0)});
  const projects=S.projects.map(p=>{
    const PA=A.filter(a=>a.projectId===p.id),ts=S.tasks.filter(t=>t.projectId===p.id),open=ts.filter(t=>t.status!=='done');
    const done=ts.filter(t=>t.status==='done'&&t.doneOn&&t.doneOn>=ws&&t.doneOn<=we);
    const prog=open.filter(t=>PA.some(a=>a.taskId===t.id));
    const next=open.filter(t=>R.begin[t.id]>=nws&&R.begin[t.id]<=nwe&&!prog.includes(t)).sort((a,b)=>R.begin[a.id].localeCompare(R.begin[b.id])).map(t=>({t,d:R.begin[t.id]}));
    const unpl=R.unplanned.filter(t=>t.projectId===p.id).length;
    const fin=open.map(t=>R.finish[t.id]).filter(Boolean).sort().pop()||'';
    const due=dl&&p.due||'',late=due&&open.length&&!unpl&&fin>due?Math.round((pd(fin)-pd(due))/864e5):0;
    const pf=hasF('profit')&&(+p.contract||0)?profitOf(R,p):null;
    return {p,...sum(PA),done,prog,next,nDone:ts.length-open.length,nAll:ts.length,fin,unpl,due,late,bad:!!due&&open.length>0&&(unpl>0||late>0),pf}});
  return {ws,we,last:days[days.length-1]||we,nws,days,...sum(A),other:sum(A.filter(a=>!P(a.projectId))),projects,
    nDone:projects.reduce((s,x)=>s+x.done.length,0),nBad:projects.filter(x=>x.bad).length,
    apNext:hasF('appts')?(S.appts||[]).filter(a=>a.date>=nws&&a.date<=nwe&&a.status!=='done').length:0,
    exp:hasF('equip')?expAll().filter(o=>o.x.due<=nwe):[],
    mat:hasF('materials')?matTodo(R,nwe):[]};
}
function weekSumText(X){
  const L=['ΣΥΝΟΨΗ ΕΒΔΟΜΑΔΑΣ '+fmtS(X.ws)+' – '+fmtS(X.last),'',
    'Μεροκάματα: '+eur(X.cost)+' ('+nf1(X.md)+' μεροκάματα)',
    'Ολοκληρώθηκαν: '+(X.nDone==1?'1 εργασία':X.nDone+' εργασίες')+(X.nBad?'. Αργούν: '+(X.nBad==1?'1 έργο':X.nBad+' έργα'):'')];
  X.projects.filter(x=>x.nAll||x.cost).forEach(x=>{
    L.push('',x.p.name,'Κόστος εβδομάδας: '+eur(x.cost)+' ('+nf1(x.md)+' μεροκάματα)');
    if(x.done.length)L.push('Ολοκληρώθηκαν: '+x.done.map(t=>t.title).join(', '));
    if(x.prog.length)L.push('Σε εξέλιξη: '+x.prog.map(t=>t.title).join(', '));
    L.push('Πρόοδος: '+x.nDone+' από '+x.nAll+' εργασίες');
    if(x.nAll&&x.nDone===x.nAll)L.push('Όλες οι εργασίες ολοκληρώθηκαν.');
    else if(x.unpl)L.push('Προσοχή: '+(x.unpl==1?'1 εργασία δεν χωρά':x.unpl+' εργασίες δεν χωρούν')+' στο πρόγραμμα με το τωρινό προσωπικό.');
    else if(x.fin)L.push('Εκτιμώμενο τέλος: '+fmt(x.fin)+(x.due?(x.late?', '+(x.late==1?'1 μέρα':x.late+' μέρες')+' μετά την παράδοση ('+fmt(x.due)+')':', πριν την παράδοση ('+fmt(x.due)+')'):''));
    if(x.next.length)L.push('Ξεκινούν την επόμενη εβδομάδα: '+x.next.map(n=>n.t.title+' ('+fmt(n.d)+')').join(', '));
    if(x.pf)L.push('Εκτιμώμενο κέρδος: '+eur(x.pf.profit)+' ('+pctS(x.pf.margin)+' των εσόδων)'+(x.pf.st==='bad'?', ζημιά':x.pf.st==='warn'?', χαμηλό':''));
  });
  if(X.other.cost)L.push('','Γραφείο και αποθήκη: '+eur(X.other.cost));
  if(X.apNext)L.push('','Ραντεβού την επόμενη εβδομάδα: '+X.apNext);
  if(X.mat&&X.mat.length)L.push('','Υλικά να παραγγελθούν: '+X.mat.map(m=>m.t.mat.what+' για '+m.t.title+' ('+(m.by<TODAY?'καθυστερεί':'έως '+fmt(m.by))+')').join(', '));
  if(X.exp&&X.exp.length)L.push('','Λήξεις έως '+fmtS(add(X.ws,13))+': '+X.exp.map(o=>o.x.label+' '+o.name+' ('+(o.x.due<TODAY?'έληξε '+fmt(o.x.due):fmt(o.x.due))+')').join(', '));
  return L.join('\n')+'\n'+sign();
}
// το καθημερινό μήνυμα που φεύγει αυτόματα
// ο καιρός της μέρας εκεί που δουλεύει (στο πρώτο έργο του, αλλιώς στην έδρα)
function wxFor(R,wid,d){const x=whatDoes(R,wid,d);if(x.off||wxCfg().on===false)return null;return wxDay(x.jobs.length?x.jobs[0].job.task.projectId:x.pm.length?x.pm[0]:'',d)}
function personDayText(R,w,d,upd){
  const f=wxFor(R,w.id,d);
  const hi=w.id===OWNER&&!(S.settings&&S.settings.ownerName)?'Καλημέρα! ':'Γεια σου '+voc(w.name)+'! ';
  // ώρα έναρξης από τις Ρυθμίσεις, μόνο για όσους πάνε σε εργοτάξιο ή αποθήκη
  const x=whatDoes(R,w.id,d),st=S.settings&&S.settings.startTime;
  const start=st&&!x.off&&(x.jobs.length||x.gen)?'Έναρξη: '+st+'\n':'';
  return hi+(upd?'Άλλαξε το πρόγραμμά σου για ':'Το πρόγραμμά σου για ')+fmt(d)+':\n\n'+start+dayBlock(R,w,d)+(f?'\nΚαιρός: '+wxText(f)+'\n':'')+sign();
}
// --- από το εργοτάξιο: πρόοδος από τον υπεύθυνο της εργασίας και αιτήματα άδειας από τον εργαζόμενο ---
// S.field = [{id,k:'done'|'more'|'leave',w,t,d,from,to,note,at,st,by,dec}]
// Πρόοδος: st 'ok' (ισχύει αμέσως) ή 'no' (το γραφείο την αναίρεσε). Άδεια: 'new', και μετά 'ok'/'no' από το γραφείο ή 'x' αν την ακύρωσε ο ίδιος.
// Τις γράφει και ο server για τους λογαριασμούς εργαζομένων, γι' αυτό η mergeField τις κρατά όταν το γραφείο αποθηκεύει παλιότερα δεδομένα.
const fRank=r=>(r.k==='leave'?{new:0,x:1,no:2,ok:2}:{ok:0,no:1})[r.st]||0;
function fieldEffect(o,r,sign){
  const t=(o.tasks||[]).find(x=>x.id===r.t);if(!t)return;
  if(r.k==='more')t.days=Math.max(1,(+t.days||1)+sign);
  else if(r.k==='done'){const on=add(r.d,1);   // τη μέρα της αναφοράς η εργασία μένει στο πρόγραμμα: εκείνη τη μέρα δουλεύτηκε
    if(sign>0){if(t.status!=='done'){t.status='done';t.doneOn=on}}
    else if(t.status==='done'&&t.doneOn===on){t.status=r.prev&&r.prev!=='done'?r.prev:'todo';delete t.doneOn}}
}
function pruneField(o){const p=add(TODAY,-60),l=add(TODAY,-120);
  o.field=(o.field||[]).filter(r=>r.k==='leave'?r.st==='new'||r.to>=l:r.d>=p)}
const canReport=(R,wid,tid,d)=>whatDoes(R,wid,d).jobs.some(({job,lead})=>job.task.id===tid&&(lead||job.task.responsibleId===wid));
const progressOf=(tid,d)=>(S.field||[]).filter(r=>r.k!=='leave'&&r.t===tid&&r.d===d&&r.st==='ok');
// αναφορά προόδου: αλλάζει αμέσως την εργασία και γράφεται στο ιστορικό με το όνομα του εργαζόμενου
function addProgress(R,w,tid,k,note,d){
  const t=T(tid);if(!t||!['done','more'].includes(k))return {err:'Η εργασία δεν βρέθηκε.'};
  if(!canReport(R,w.id,tid,d))return {err:'Πρόοδο στέλνει ο υπεύθυνος της εργασίας, τη μέρα που δουλεύει σε αυτή.'};
  if(k==='done'&&t.status==='done')return {err:'Έχει ήδη δηλωθεί ότι η εργασία τελείωσε.'};
  if(k==='more'&&progressOf(tid,d).some(r=>r.k==='more'))return {err:'Η επιπλέον μέρα έχει ήδη δηλωθεί σήμερα.'};
  const r={id:uid('f'),k,w:w.id,t:tid,d,note:String(note||'').trim().slice(0,300),at:stamp(),st:'ok'};if(k==='done')r.prev=t.status||'todo';
  fieldEffect(S,r,1);(S.field=S.field||[]).push(r);pruneField(S);
  const p=P(t.projectId),e={id:uid('h'),at:r.at,by:w.name,fid:r.id,msg:(k==='done'?'Από το εργοτάξιο: τελείωσε η εργασία «':'Από το εργοτάξιο: μία μέρα ακόμη για την εργασία «')+t.title+'»'+(p?' ('+p.name+')':'')};
  (S.hist=S.hist||[]).push(e);
  return {r,e};
}
// εργάσιμες μέρες μιας άδειας για τον συγκεκριμένο εργαζόμενο
function leaveDays(w,from,to){const xs=[];for(let d=from;d<=to&&xs.length<100;d=add(d,1))if(isWork(d)&&!isRest(w,d))xs.push(d);return xs}
function addLeave(w,from,to,note){
  const re=/^\d{4}-\d{2}-\d{2}$/;to=to||from;
  if(!re.test(from||'')||!re.test(to))return {err:'Διάλεξε από ποια μέρα έως ποια.'};
  if(to<from)return {err:'Η τελευταία μέρα είναι πριν από την πρώτη.'};
  if(from<today())return {err:'Η άδεια δεν μπορεί να ξεκινά σε μέρα που πέρασε.'};
  if(to>add(from,59))return {err:'Ζήτα έως 60 μέρες τη φορά.'};
  if(!leaveDays(w,from,to).length)return {err:'Δεν υπάρχει εργάσιμη μέρα σε αυτές τις ημερομηνίες.'};
  if((S.field||[]).some(r=>r.k==='leave'&&r.w===w.id&&r.st==='new'&&r.from<=to&&r.to>=from))return {err:'Έχεις ήδη ζητήσει άδεια για αυτές τις μέρες.'};
  const r={id:uid('f'),k:'leave',w:w.id,from,to,note:String(note||'').trim().slice(0,300),at:stamp(),st:'new'};
  (S.field=S.field||[]).push(r);pruneField(S);return {r};
}
function cancelLeave(w,id){const r=(S.field||[]).find(x=>x.id===id&&x.k==='leave'&&x.w===w.id);
  if(!r)return {err:'Το αίτημα δεν βρέθηκε.'};if(r.st!=='new')return {err:'Το γραφείο έχει ήδη απαντήσει στο αίτημα.'};
  r.st='x';r.dec=stamp();return {r}}
// έγκριση από το γραφείο: οι εργάσιμες μέρες μπαίνουν στις μέρες άδειας και το πρόγραμμα βρίσκει αντικαταστάτη
function decideLeave(id,ok,by){const r=(S.field||[]).find(x=>x.id===id&&x.k==='leave'),w=r&&W(r.w);
  if(!r||!w||r.st!=='new')return null;
  r.st=ok?'ok':'no';r.by=by||'';r.dec=stamp();
  if(ok)w.off=[...new Set([...(w.off||[]),...leaveDays(w,r.from,r.to)])].sort();
  return r}
const myLeave=wid=>(S.field||[]).filter(r=>r.k==='leave'&&r.w===wid&&(r.st==='new'||r.to>=add(TODAY,-30))).sort((a,b)=>b.from.localeCompare(a.from)).slice(0,8);
// ένωση με τα δεδομένα του server: ό,τι έγραψαν οι εργαζόμενοι και δεν το έχει η αποθήκευση του γραφείου μπαίνει με το αποτέλεσμά του,
// και η πιο «τελική» κατάσταση κερδίζει (απάντηση γραφείου > ακύρωση > αναμονή, αναίρεση > ισχύει).
// skip: αναφορές που αναιρούνται τώρα. onlyNew: στην αναίρεση κρατά μόνο όσες γράφτηκαν μετά το αντίγραφο.
function mergeField(o,cur,skip,onlyNew){
  if(!o||!cur||!Array.isArray(cur.field))return o;
  o.field=Array.isArray(o.field)?o.field:[];
  const mine=new Map(o.field.map(r=>[r.id,r]));
  const ws=new Set((o.workers||[]).map(w=>w.id));
  cur.field.forEach(r0=>{const r={...r0},x=mine.get(r.id);if(!ws.has(r.w))return;   // ο εργαζόμενος διαγράφηκε ή τα δεδομένα ξεκίνησαν από την αρχή
    if(skip&&skip.has(r.id)&&r.k!=='leave'&&r.st==='ok'){r.st='no';r.dec=stamp()}
    if(!x){if(r.k!=='leave'&&r.st==='ok')fieldEffect(o,r,1);o.field.push(r);return}
    if(!onlyNew&&fRank(r)>fRank(x)){if(x.k!=='leave'&&x.st==='ok')fieldEffect(o,x,-1);Object.assign(x,r)}
  });
  if(!onlyNew){const hs=new Set((o.hist||[]).map(e=>e&&e.id)),xs=(cur.hist||[]).filter(e=>e&&e.fid&&!hs.has(e.id));
    if(xs.length)o.hist=(o.hist||[]).concat(xs).sort((a,b)=>String(a.at).localeCompare(String(b.at)))}
  return o;
}
// η εβδομάδα ενός εργαζόμενου σε δεδομένα, για τη σελίδα «Το πρόγραμμά μου».
// Περιέχει μόνο ό,τι χρειάζεται ο ίδιος: πού, τι και με ποιους. Όχι μεροκάματα ή κόστη.
function personWeek(R,w,ws){
  return {name:w.name,specialty:SP(w.specialtyId)?.name||'',weekStart:ws,days:weekDays(ws).map(d=>{
    const x=whatDoes(R,w.id,d),o={date:d,off:x.off,rest:x.off&&!isLeave(w,d),items:[],duties:[]};
    if(x.off)return o;
    const f=wxFor(R,w.id,d);if(f){const k=wxKind(f.code);o.wx={k:k.k,text:wxText(f),wet:isWet(f,wxCfg())}}
    x.jobs.forEach(({job,lead})=>{const p=P(job.task.projectId),t=job.task;
      // ο υπεύθυνος της εργασίας στέλνει πρόοδο μόνο για σήμερα
      const rep=d===TODAY&&hasF('progress')&&(lead||t.responsibleId===w.id)?{done:t.status==='done',more:progressOf(t.id,d).some(r=>r.k==='more'),day:job.dayNo,days:+t.days||1}:null;
      o.items.push({kind:'job',tid:t.id,project:p.name,location:p.location||'',color:p.color||'',task:t.title,lead,rep,
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
// ό,τι βλέπει ο εργαζόμενος στο «Το πρόγραμμά μου»: η εβδομάδα του και τα δικά του αιτήματα άδειας
function myView(R,w,ws){const o=personWeek(R,w,ws);o.feats={progress:hasF('progress'),leave:hasF('leave'),push:hasF('push'),gps:hasF('gps')&&!isOffice(w)&&!isExt(w),diary:hasF('diary')&&!isOffice(w)};
  o.days.forEach(d=>{if(d.off&&isAbsent(w.id,d.date))d.absent=true;const r=o.feats.gps&&attOf(d.date,w.id);if(r)d.att=attPub(r)});
  if(o.feats.diary)o.diary=myDiary(R,w);
  if(o.feats.leave)o.leave=myLeave(w.id).map(r=>({id:r.id,from:r.from,to:r.to,note:r.note,st:r.st,days:leaveDays(w,r.from,r.to).length}));
  return o}
root.ErgoCore={projProg,CLI_K,cliList,cliById,cliByName,cliOfP,cliOfA,cliProjects,cliAppts,cliUpcoming,projDone,cliState,cliLast,cliHistory,cliFromAppts,cliNew,cliImport,cliAddLog,cliDel,cliDemo,DAYS_L,MON_G,fmtL,CL_DAYS,CL_MSG,CL_TOK,clientOn,shareOf,clientOpt,byShare,clientPhotoOk,clientView,CL_CSS,clientHtml,clientDoc,clientGone,newTok,clientDemo,DIARY_TXT,diaryOn,diaryList,diaryOf,diaryPhotos,addDiary,editDiary,delDiary,diaryPrune,diaryRefs,mergeDiary,wxLogFill,wxOf,diaryFin,diaryDays,diaryDay,myDiary,delMyDiary,diaryDemo,wxLogDemo,ATT_R,gpsOn,siteOf,yardOf,siteFor,distM,distS,parseLL,attList,attOf,attProjects,attDist,attWhere,ATT_W,attWS,toMin,attMin,hrsS,hrsL,hmOf,tStr,addAtt,setAtt,delAtt,markAbsent,isAbsent,attDay,attSt,attMissing,attPrune,mergeAtt,attPub,attDemoSites,attDemoFill,COST_K,LOW_M,isJob,profitOf,pctS,addCost,matOn,matLead,matBy,matTodo,matState,matWhen,orderMat,profitDemo,EQ_KINDS,EXP_LABELS,expWarn,expIn,expState,expWhen,expAll,expSoon,expNext,eqWhere,eqDemo,myView,fieldEffect,pruneField,canReport,progressOf,addProgress,leaveDays,addLeave,cancelLeave,decideLeave,myLeave,mergeField,xlsx,okAmka,accReport,PRESETS,GEN,blankState,sameSpec,parsePeople,planHas,isOn,dayFp,packDay,freezePast,pastPending,SUM_D,sumCfg,weekSum,weekSumText,stamp,undoneIds,undoTarget,availOn,isRest,isLeave,offWord,sp2,canSpec,BRAND,PLANS,FEATS,planIx,planOf,hasF,needPlan,planPeople,RATE_D,rateCfg,rateOn,wRate,tDiff,isHard,setState,today,ROLES,DAYS,MONTHS,upGR,voc,pad,ds,pd,add,dow,fmt,fmtS,eur,h,uid,short,weekStart,officeDemo,demo,migrate,
  setWeather,getWeather,wxDefaults,wxCfg,hasLL,locKey,projLoc,wxLocs,wxUrl,wxParse,wxDay,isWet,rainy,wxKind,wxText,wxFor,
  easter,HOLIDAYS,holDefaults,holName,sign,
  OWNER,ownerName,apPerson,apptsOn,apTime,apConflicts,apDemo,ownerW,anyone,monthDay,doneKey,isDone,remDemo,dutyLine,
  byId,P,W,T,SP,PSEUDO,pname,isWork,nextWork,isOffice,isPM,pmProjects,managersOf,ov,isOff,rate,dutyOn,dutiesFor,schedule,whatDoes,taskIdsOf,hasJob,isExt,dayCost,extDemo,weekDays,dayBlock,dayKey,personText,personDayText,personWeek};
})(typeof window!=='undefined'?window:globalThis);
