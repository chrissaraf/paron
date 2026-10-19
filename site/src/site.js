(function(){
  var $=function(id){return document.getElementById(id)};

  // Tagline spans the wordmark width, as in the app.
  function fitLogo(){
    document.querySelectorAll('.logo .wm').forEach(function(wm){
      var b=wm.querySelector('b'),t=wm.querySelector('small');if(!b||!t||!b.getBoundingClientRect().width)return;
      var n=t.textContent.length;t.style.letterSpacing='0px';t.style.marginRight='0px';
      var ls=(b.getBoundingClientRect().width-t.getBoundingClientRect().width)/(n-1);
      t.style.letterSpacing=ls+'px';t.style.marginRight=(-ls)+'px';
    });
  }
  fitLogo();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitLogo);addEventListener('resize',fitLogo);
  $('yr').textContent=new Date().getFullYear();

  var nf=function(n,d){return n.toLocaleString('el-GR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0})};

  // Plans: monthly price per plan and the people it fits. Yearly = 10 months.
  var PLANS=[['Μάστορας',9.99,5],['Συνεργείο',19.99,15],['Εργοτάξιο',39.99,40]];
  var yearly=false;
  function monthly(m){return yearly?m*10/12:m}
  function renderPrices(){
    document.querySelectorAll('[data-m]').forEach(function(b){
      var m=+b.dataset.m,n=+b.dataset.n,pm=monthly(m),plan=b.closest('.plan');
      b.textContent=nf(yearly?Math.round(m*1000)/100:m,2);
      plan.querySelector('[data-unit]').textContent=yearly?'€ / χρόνο + ΦΠΑ':'€ / μήνα + ΦΠΑ';
      plan.querySelector('[data-per]').innerHTML=(yearly?'Ίσο με '+nf(pm,2)+' € τον μήνα':'Χρέωση κάθε μήνα')+'<strong>Από '+nf(pm/n,2)+' € ανά άτομο τον μήνα</strong>';
    });
    $('bMonth').setAttribute('aria-pressed',!yearly);
    $('bYear').setAttribute('aria-pressed',yearly);
    calc();
  }
  $('bMonth').onclick=function(){yearly=false;renderPrices()};
  $('bYear').onclick=function(){yearly=true;renderPrices()};

  // Savings estimate, kept conservative: scheduling still takes 15 minutes a day, payroll half its time.
  var WAGE=50,DAYS=22,WEEKS=52/12;
  function calc(){
    var w=+$('cWorkers').value,mins=+$('cMins').value,pay=+$('cPay').value,err=+$('cErr').value,rate=+$('cRate').value;
    $('oWorkers').textContent=w;$('oMins').textContent=mins;$('oPay').textContent=pay;$('oErr').textContent=err;$('oRate').textContent=rate+' €';
    var hours=Math.max(0,mins-15)*DAYS/60+pay*0.5*WEEKS;
    var euro=hours*rate+err*WAGE;
    var p=PLANS[w<=5?0:w<=15?1:2],price=monthly(p[1]);
    var hr=Math.round(hours*2)/2;$('rHours').textContent=nf(hr,hr%1?1:0);
    $('rEuro').textContent=nf(Math.round(euro))+' €';
    $('rPlan').textContent=p[0];
    var roi=euro/price;$('rRoi').textContent=(roi>=10?nf(Math.round(roi)):nf(roi,1))+'×';
  }
  ['cWorkers','cMins','cPay','cErr','cRate'].forEach(function(id){$(id).addEventListener('input',calc)});
  renderPrices();

  // Plan buttons preselect team size in the form
  document.querySelectorAll('[data-plan]').forEach(function(a){a.addEventListener('click',function(){$('fSize').selectedIndex=+a.dataset.plan})});

  // Phone: show the bottom call to action once the hero is gone, hide it at the form
  if('IntersectionObserver' in window){
    var seen={hero:true,start:false};
    var io=new IntersectionObserver(function(es){es.forEach(function(e){seen[e.target.id]=e.isIntersecting});$('mbar').classList.toggle('show',!seen.hero&&!seen.start)});
    io.observe($('hero'));io.observe($('start'));
  }

  // Lead form (not wired to a backend yet)
  $('leadForm').addEventListener('submit',function(e){
    e.preventDefault();
    var name=$('fName'),phone=$('fPhone'),bad=null;
    [phone,name].forEach(function(i){var ok=!!i.value.trim();i.classList.toggle('err',!ok);if(!ok)bad=i});
    if(bad){bad.focus();return}
    $('formOkText').textContent='Ευχαριστούμε, '+name.value.trim().split(/\s+/)[0]+'. Αυτή είναι δοκιμαστική έκδοση του site και η φόρμα δεν στέλνει ακόμη τίποτα.';
    $('formOk').hidden=false;
  });
})();
