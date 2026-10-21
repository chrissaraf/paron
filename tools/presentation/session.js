require('../../src/core.js');
const C=globalThis.ErgoCore;

function seedPresentation(){
  const state=C.demo();
  state.setup=true;
  state.settings.company={name:'ΔΟΜΗ Κατασκευαστική',addr:'Θεσσαλονίκη'};
  state.settings.ownerName='Γιάννης Αντωνίου';
  state.settings.autoSend=false;
  state.settings.wx.on=false;
  state.settings.off=['wx','client','equip','push','gps','progress','leave','weekly','rating','history'];
  state.workers.forEach(w=>{w.phone=''});
  state.clients.forEach(c=>{c.phone='';c.email=''});
  state.appts.forEach(a=>{a.phone=''});
  state.workers.find(w=>w.id==='w1').specialtyIds=['s1','s2'];
  state.tasks.find(t=>t.id==='t1').specialtyIds=['s1','s2'];
  state.teams=[
    {id:'crew1',name:'Ομάδα Γιώργου',workerIds:['w1','w3','w17']},
    {id:'crew2',name:'Ομάδα Νίκου',workerIds:['w2','w4','w16']},
    {id:'crew3',name:'Ομάδα Βασίλη',workerIds:['w5','w6','w7']},
    {id:'crew4',name:'Ομάδα Σταύρου',workerIds:['w8','w9']},
    {id:'crew5',name:'Ομάδα Μιχάλη',workerIds:['w10','w11']},
    {id:'crew6',name:'Ομάδα Θανάση',workerIds:['w12','w13']},
    {id:'crew7',name:'Ομάδα Γιάννη',workerIds:['w14','w15']}
  ];
  state.settings.preferTeams=true;
  C.setState(state);
  const schedule=C.schedule(),ws=C.viewStart(C.today());
  for(const [workerId,partial] of [['w1',300],['w8',null]]){
    const days=schedule.asg.filter(a=>a.workerId===workerId&&a.date>=ws&&a.date<=C.add(ws,6));
    const earned=Math.round(days.reduce((s,a)=>s+a.wage,0)*100)/100;
    if(!earned)continue;
    state.payments[ws+'|'+workerId]={earned,days:days.reduce((s,a)=>s+(a.share||1),0),lock:false,pays:[{
      id:'demo-pay-'+workerId,amount:partial==null?earned:Math.min(partial,earned/2),date:C.today(),method:'cash',note:'Πληρωμή παραδείγματος'
    }]};
  }
  state.projects.forEach(p=>{
    const dates=schedule.asg.filter(a=>a.projectId===p.id).map(a=>a.date).sort();
    if(dates.length)p.due=C.add(dates.at(-1),3);
  });
  // Sample day placements are explicit, so the presentation starts in the user's manual mode.
  const placements=new Map();
  schedule.asg.filter(a=>a.date>=C.today()&&!C.isOffice(C.W(a.workerId))).forEach(a=>{
    const key=a.date+'|'+a.workerId;
    if(a.taskId){const o=placements.get(key)||{type:'tasks',taskIds:[]};if(!o.taskIds.includes(a.taskId))o.taskIds.push(a.taskId);placements.set(key,o)}
    else if(a.projectId==='gen')placements.set(key,{type:'gen'});
  });
  placements.forEach((value,key)=>state.overrides[key]=value);
  state.settings.scheduleMode='manual';state.settings.manualFrom=C.today();
  return state;
}

// This session owns synthetic data only. It never reads or writes production data or credentials.
// Kept self-contained so the same API runs in the downloadable offline presentation.
function createPresentationSession(seed=seedPresentation()){
  const copy=x=>JSON.parse(JSON.stringify(x)),initial=copy(seed);
  let state=copy(initial);
  const user={id:'presentation',name:'Παρουσίαση PARON',username:'demo',role:'admin',workerId:''};
  const response=(status,body)=>({status,body:copy(body)});
  return {request(method,path,body){
    const route=path.split('?')[0];
    if(route==='/api/state'&&method==='GET')return response(200,state);
    if(route==='/api/state'&&method==='PUT'){
      if(!body||body.v!==2||!body.settings||!['projects','workers','tasks','specialties'].every(k=>Array.isArray(body[k])))
        return response(400,{error:'Το παράδειγμα δεν αποθηκεύτηκε. Τα δεδομένα δεν είναι έγκυρα.'});
      state=copy(body);return response(200,{ok:true});
    }
    if(route==='/api/demo/reset'&&method==='POST'){state=copy(initial);return response(200,{ok:true})}
    if(method!=='GET')return response(403,{error:'Στην παρουσίαση δεν γίνονται αποστολές ή αλλαγές λογαριασμών.'});
    const pages={'/api/me':{user},'/api/users':{users:[user]},'/api/viber/changes':{changes:[]},
      '/api/viber/status':{autoSend:false},'/api/push':{available:false,kinds:[]},'/api/weather':{},'/api/client-views':{}};
    return Object.prototype.hasOwnProperty.call(pages,route)?response(200,pages[route]):response(404,{error:'Δεν διατίθεται στην παρουσίαση.'});
  }};
}
module.exports={seedPresentation,createPresentationSession};
