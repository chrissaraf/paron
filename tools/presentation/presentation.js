const fs=require('node:fs');
const path=require('node:path');
const {seedPresentation,createPresentationSession}=require('./session');

function offlineBootstrap(seed){
  return `<script>
window.ERGO_SERVER=true;window.ERGO_DEMO=true;
(()=>{
  const session=(${createPresentationSession.toString()})(${JSON.stringify(seed).replace(/</g,'\\u003c')});
  window.fetch=async(input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href);
    const route='/api/'+url.pathname.split('/api/').pop();
    let body;try{body=options.body?JSON.parse(options.body):undefined}catch(e){return new Response('{}',{status:400})}
    const result=session.request(options.method||'GET',route,body);
    return new Response(JSON.stringify(result.body),{status:result.status,headers:{'content-type':'application/json'}});
  };
  // A refresh starts a clean rehearsal; only this demo's navigation keys are cleared.
  try{for(const suffix of ['tab','proj','cli'])localStorage.removeItem('paron.presentation.v1.'+suffix)}catch(e){}
})();
</script>`;
}

function presentationHtml(fullPage,{offline=false}={}){
  const extra=offline?offlineBootstrap(seedPresentation()):'<script>window.ERGO_SERVER=true;window.ERGO_DEMO=true;</script>';
  return fullPage(extra).replace('<html lang="el">','<html lang="el" data-theme="light">');
}

function writePresentation(fullPage){
  const output=path.join(__dirname,'..','paron-demo.html');
  fs.writeFileSync(output,presentationHtml(fullPage,{offline:true}));
  fs.writeFileSync(path.join(__dirname,'..','presentation-guide.html'),guidePage().replace('href="/review"','href="paron-demo.html"'));
  return output;
}

function reviewPage(){
  return `<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PARON · Παρουσίαση</title><style>
*{box-sizing:border-box}body{margin:0;background:#e9eee8;color:#163b32;font:14px system-ui}header{max-width:1440px;margin:auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}header b{font-size:23px}header small{color:#56675f}nav{display:flex;gap:6px;flex-wrap:wrap}button,a{font:inherit;color:inherit;background:white;border:1px solid #becbbe;border-radius:9px;padding:10px 14px;cursor:pointer;text-decoration:none}button[aria-pressed=true]{background:#0e3b34;color:white;border-color:#0e3b34}.stage{display:flex;justify-content:center;padding:0 16px 16px}iframe{background:white;border:1px solid #becbbe;width:390px;height:calc(100dvh - 92px);min-height:580px;border-radius:18px}body.desktop iframe{width:100%;border-radius:12px}footer{text-align:center;padding:0 16px 12px;font-size:12px;color:#56675f}@media(max-width:600px){header{padding:12px 16px}header small{display:none}nav{gap:4px}button,a{padding:8px 10px}.stage{padding:0 6px 8px}iframe{max-width:100%;min-height:500px;height:calc(100dvh - 135px)}}
</style></head><body><header><div><b>PARON</b> <small>Έργα, συνεργεία, μεροκάματα και κόστος</small></div><nav aria-label="Προβολή παρουσίασης"><button id="phone" aria-pressed="true">Κινητό</button><button id="desktop" aria-pressed="false">Mac</button><button id="reset">Από την αρχή</button><a href="/guide">Οδηγός 5 λεπτών</a></nav></header><div class="stage"><iframe id="app" title="PARON · Δοκιμαστική εταιρεία" src="/app?tab=today"></iframe></div><footer>Δεδομένα παραδείγματος · Οι αλλαγές της επίδειξης αποθηκεύονται μόνο σε αυτή τη δοκιμαστική έκδοση.</footer><script>
const frame=document.getElementById('app');let selectedMode='phone';
function showMode(mode){
  selectedMode=mode;const desktop=mode==='desktop',stage=document.querySelector('.stage'),scale=Math.min(1,(document.documentElement.clientWidth-32)/1280);
  document.body.classList.toggle('desktop',desktop);for(const key of ['phone','desktop'])document.getElementById(key).setAttribute('aria-pressed',key===mode);
  frame.style.width=desktop?'1280px':'';frame.style.maxWidth=desktop?'none':'';frame.style.height=desktop?Math.max(580,(innerHeight-110)/scale)+'px':'';
  frame.style.transform=desktop?'scale('+scale+')':'';frame.style.transformOrigin='top left';
  stage.style.display=desktop?'block':'';stage.style.overflow='hidden';stage.style.height=desktop?Math.max(500,innerHeight-110)+'px':'';
}
for(const mode of ['phone','desktop'])document.getElementById(mode).onclick=()=>showMode(mode);
addEventListener('resize',()=>showMode(selectedMode));
document.getElementById('reset').onclick=async()=>{const r=await fetch('/api/demo/reset',{method:'POST'});if(r.ok)frame.src='/app?tab=today&reset='+Date.now()};
</script></body></html>`;
}

function guidePage(){
  return `<!doctype html><html lang="el"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PARON · Οδηγός παρουσίασης</title><style>body{font:17px/1.65 system-ui;background:#f2f5f2;color:#162925;max-width:780px;margin:32px auto;padding:0 24px 40px}h1{font-size:32px;line-height:1.2}h2{font-size:21px;margin-bottom:4px}li{margin:22px 0}a{color:#0e3b34}small{color:#56675f}blockquote{margin:24px 0;padding:16px 20px;background:white;border-left:4px solid #9eaf4b}strong{color:#0e3b34}@media print{body{font-size:12pt;background:white}a.back{display:none}}</style><a class="back" href="/review">Επιστροφή στην παρουσίαση</a><h1>PARON σε 5 λεπτά</h1><p>«Βλέπεις ποιος δουλεύει σε κάθε έργο, οργανώνεις τις εργασίες και ξέρεις τι κοστίζουν και τι έχεις πληρώσει.»</p><ol>
<li><h2>Σήμερα και ομάδες · 1 λεπτό</h2>Στο <strong>Πού δουλεύει ο καθένας</strong> πάτησε <strong>Ανάθεση ομάδας</strong> στην Ομάδα Γιώργου. Δείξε την επιλογή έργου, την προαιρετική εργασία και την επανάληψη στην υπόλοιπη εβδομάδα. Πάτησε <strong>Άκυρο</strong>. Άνοιξε <strong>Ανάθεση ανά άτομο</strong>: κάθε μέλος μπορεί να πάει σε άλλο έργο, χωρίς να αλλάζει η σταθερή ομάδα του.</li>
<li><h2>Έργα και εργασίες · 1 λεπτό</h2>Άνοιξε την <strong>Πολυκατοικία Καλαμαριάς</strong>. Δείξε κόστος ως σήμερα, εκτίμηση ολοκλήρωσης και τις εργασίες. Από τις <strong>Εργασίες</strong> άνοιξε την «Τοιχοποιία 2ου ορόφου»: υπεύθυνος, συνεργείο και διάρκεια.</li>
<li><h2>Πρόγραμμα · 1 λεπτό</h2>Στο έργο άνοιξε το <strong>Πρόγραμμα</strong> και άλλαξε ημέρα. Στο Mac δείξε και τη γενική ενότητα Πρόγραμμα με τον εβδομαδιαίο πίνακα. Το πρόγραμμα το συμπληρώνεις εσύ, ανά εργαζόμενο ή ομάδα· μπορείς να επιλέγεις μόνο έργο ή και συγκεκριμένες εργασίες.</li>
<li><h2>Κόστος έργου · 1 λεπτό</h2>Στο έργο άνοιξε το <strong>Κόστος</strong>. Δείξε εργατικά, συνεργάτες, υλικά και άλλα έξοδα. Το «Ως σήμερα» βασίζεται στο πρόγραμμα και στα καταχωρισμένα έξοδα· το «Στο τέλος» είναι εκτίμηση.</li>
<li><h2>Πληρωμές · 1 λεπτό</h2>Δείξε τον Γιώργο, που έχει μερική πληρωμή, και τον Σταύρο, που είναι εξοφλημένος. Πάτησε <strong>Πληρωμή</strong> στον Γιώργο, γράψε 100 € και δείξε πώς αλλάζει το υπόλοιπο πριν πατήσεις <strong>Καταχώριση πληρωμής</strong>. Πρόκειται για καταχώριση στο παράδειγμα, όχι μεταφορά χρημάτων.</li></ol>
<blockquote>Κλείσιμο: «Ένα μέρος για τα έργα, τους ανθρώπους και τα χρήματα της δουλειάς. Τι από αυτά σας δυσκολεύει περισσότερο σήμερα;»</blockquote><p><strong>Πριν ξεκινήσεις:</strong> άνοιξε το «Από την αρχή», δοκίμασε μία φορά τη διαδρομή και κράτησε το <code>paron-demo.html</code> στο Mac ως εφεδρικό. Για το κινητό χρησιμοποίησε τη διεύθυνση δικτύου που εμφανίζεται όταν ξεκινάς το demo, με τις συσκευές στο ίδιο Wi-Fi.</p><small>Στην παρουσίαση δεν γίνονται πραγματικές αποστολές. Τα ποσά της εβδομάδας βγαίνουν από το πρόγραμμα· μην τα παρουσιάσεις ως επιβεβαιωμένες παρουσίες ή τραπεζικές συναλλαγές.</small></html>`;
}
module.exports={presentationHtml,writePresentation,reviewPage,guidePage};
