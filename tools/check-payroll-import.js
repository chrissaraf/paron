// Optional browser integration check. Needs Playwright on NODE_PATH and a local Chrome executable.
// Uses invented payroll data and an isolated in-memory presentation server. Never touches production.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const {createPresentationServer}=require('./presentation/server');
const C=globalThis.ErgoCore;
const rows=(wage,province)=>[
  ['ΕΒΔΟΜΑΔΙΑΙΕΣ ΠΛΗΡΩΜΕΣ'],[],[],[null,null,null,null,null,null,'ΥΠΕΡΩΡΙΕΣ: 3 - 9/1/26'],[],
  ['ΕΡΓΑΖΟΜΕΝΟΙ','ΗΜΕΡ/ΘΙΟ',null,null,null,null,'ΕΡΓΑΖΟΜΕΝΟΙ','ΩΡΕΣ','ΣΥΝΟΛΟ'],
  ['Δοκιμή Εισαγωγής Α ΑΘΗΝΑ',wage,null,null,null,null,'Δοκιμή Εισαγωγής Β',3.5,35],
  ['Δοκιμή Εισαγωγής Α ΣΕΡΙΦΟΣ',province,null,null,null,null,'Δοκιμή Εισαγωγής Α',2,17.5],
  ['Δοκιμή Εισαγωγής Β',80]
];
const workbook=Buffer.from(C.xlsx([
  {name:'3 - 9 ΙΑΝΟΥΑΡΙΟΥ',rows:rows(70,90)},
  {name:'10 - 16 ΙΑΝΟΥΑΡΙΟΥ',rows:rows(90,110)},
  {name:'17 - 23 ΙΑΝΟΥΑΡΙΟΥ',rows:rows(75,95)}
]));
const upload=page=>page.locator('input[data-payroll-file="workers"]').setInputFiles({name:'Δοκιμή 2026.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:workbook});
async function act(page,action){await page.evaluate(a=>{const b=document.createElement('button');b.dataset.act=a;document.body.append(b);b.click();b.remove()},action)}
async function run(){
  const server=createPresentationServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin='http://127.0.0.1:'+server.address().port;
  const executablePath=process.env.PARON_BROWSER_EXECUTABLE||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
    for(const [width,height] of [[390,844],[1440,1000]]){
      await fetch(origin+'/api/demo/reset',{method:'POST'});
      const context=await browser.newContext({viewport:{width,height},colorScheme:'light'}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
      await page.addInitScript(()=>localStorage.setItem('paron.presentation.v1.tab','workers'));
      await page.goto(origin+'/app');await page.waitForSelector('input[data-payroll-file="workers"]',{state:'attached'});
      const before=await page.evaluate(()=>fetch('/api/state').then(r=>r.json()));
      const solo=Buffer.from(C.xlsx([{name:'3 - 9 ΙΑΝΟΥΑΡΙΟΥ',rows:[[],[],[],[],[],['ΕΡΓΑΖΟΜΕΝΟΙ','ΗΜΕΡ/ΘΙΟ'],['Δοκιμή Μόνο ΣΕΡΙΦΟΣ',90]]}]));
      await page.locator('input[data-payroll-file="workers"]').setInputFiles({name:'Έλεγχος 2026.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:solo});
      await page.waitForSelector('.modal.payroll');await page.locator('[data-pay-detail="aliases"]>summary').click();await page.locator('.pay-person>summary').click();
      assert.equal(await page.locator('[data-pay-wage]').inputValue(),'70');
      await page.locator('#pay_premium').fill('25');await page.locator('#pay_premium').dispatchEvent('change');assert.equal(await page.locator('#pay_confirm').isDisabled(),true);await act(page,'payroll-refresh');assert.equal(await page.locator('[data-pay-wage]').inputValue(),'65');
      await page.locator('[data-pay-adjust]').uncheck();assert.equal(await page.locator('[data-pay-wage]').inputValue(),'90');
      await act(page,'payroll-cancel');
      await upload(page);await page.waitForSelector('.modal.payroll');
      assert.equal(await page.locator('.pay-person').count(),2);assert.equal(await page.locator('.pay-errors').count(),0);
      assert.equal(await page.evaluate(()=>fetch('/api/state').then(r=>r.json()).then(s=>s.workers.length)),before.workers.length,'preview cannot write staff');
      const aliases=page.locator('[data-pay-detail="aliases"]');await aliases.locator('summary').click();
      assert.equal(await page.locator('.pay-alias').count(),4);
      await page.locator('[data-pay-detail="n:ΔΟΚΙΜΗ ΕΙΣΑΓΩΓΗΣ Α"]>summary').click();
      assert.equal(await page.locator('[data-pay-wage]').count(),4);
      const latestWage=page.locator('[data-pay-wage="n:ΔΟΚΙΜΗ ΕΙΣΑΓΩΓΗΣ Α|2026-01-17"]');
      await latestWage.fill('76');assert.equal(await page.locator('#pay_confirm').isDisabled(),true);await act(page,'payroll-refresh');assert.equal(await latestWage.inputValue(),'76');
      await latestWage.fill('75');await act(page,'payroll-refresh');assert.equal(await latestWage.inputValue(),'75');
      const hasOverflow=await page.locator('.modal.payroll').evaluate(e=>e.scrollWidth>e.clientWidth+1);assert.equal(hasOverflow,false,'no horizontal scrolling');
      if(process.env.PARON_CHECK_SCREENSHOTS){fs.mkdirSync(process.env.PARON_CHECK_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.PARON_CHECK_SCREENSHOTS,'payroll-'+width+'.png')})}
      await page.locator('#pay_confirm').check();await page.locator('[data-act="payroll-apply"]').click();await page.waitForSelector('.modal.payroll',{state:'detached'});
      await page.waitForFunction(()=>JSON.parse(localStorage.getItem('paron.presentation.v1')).workers.some(w=>w.name==='ΔΟΚΙΜΗ ΕΙΣΑΓΩΓΗΣ Α'));
      const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('paron.presentation.v1'))),a=state.workers.find(w=>w.name==='ΔΟΚΙΜΗ ΕΙΣΑΓΩΓΗΣ Α');
      assert.equal(state.workers.length,before.workers.length+2);assert.deepEqual(a.wageHistory.map(r=>r.wage),[70,90,75]);assert.equal(a.overtimeImports.length,1);assert.equal(a.overtimeImports[0].amount,17.5);
      await upload(page);await page.waitForSelector('.modal.payroll');await page.locator('#pay_confirm').check();await page.locator('[data-act="payroll-apply"]').click();
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('paron.presentation.v1')).workers.length),state.workers.length);
      await page.locator('[data-act="editworker"][data-id="'+a.id+'"]').click();await page.locator('#h_wage').fill('85');await page.locator('#h_wage_from').fill(C.today());await page.locator('[data-act="saveworker"]').click();
      const edited=await page.evaluate(id=>{const w=JSON.parse(localStorage.getItem('paron.presentation.v1')).workers.find(w=>w.id===id);return {now:ErgoCore.wageAt(w,ErgoCore.today()),past:ErgoCore.wageAt(w,'2026-01-17')}},a.id);
      assert.deepEqual(edited,{now:85,past:75});
      await act(page,'payroll-archive');assert.match(await page.locator('.modal.payroll').innerText(),/3,5|3.5/);await act(page,'close');
      // The setup wizard must stage imports until the final step, then preserve their histories.
      await act(page,'guide');await page.locator('[name="g1_mode"][value="fresh"]').check();await act(page,'g-next');await act(page,'g-next');
      await page.locator('input[data-payroll-file="guide"]').setInputFiles({name:'Δοκιμή 2026.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:workbook});
      await page.waitForSelector('.modal.payroll');await page.locator('#pay_confirm').check();await act(page,'payroll-apply');await page.waitForSelector('.modal.guide');
      assert.equal(await page.locator('[data-gp]').count(),2);await page.locator('[data-gp="0"] [data-k="phone"]').fill('000');await act(page,'g-next');await act(page,'g-finish');
      const fresh=await page.evaluate(()=>JSON.parse(localStorage.getItem('paron.presentation.v1')));assert.equal(fresh.workers.length,2);assert.equal(fresh.workers[0].wageHistory.length,3);assert.equal(fresh.workers[0].phone,'000');assert.equal(fresh.workers[0].overtimeImports.length,1);
      assert.deepEqual(errors,[]);
      console.log('PASS payroll upload, review, dates, archive, repeat upload and setup wizard at '+width+'px');
      // Optional private workbook check: preview only, no apply and no screenshots of company data.
      const source=process.argv.indexOf('--source');if(source>=0&&width===390){await act(page,'close');await page.reload();await page.waitForSelector('input[data-payroll-file="workers"]',{state:'attached'});
        await page.locator('input[data-payroll-file="workers"]').setInputFiles(process.argv[source+1]);await page.waitForSelector('.modal.payroll');
        console.log('PASS source workbook decompression and preview; groups='+await page.locator('.pay-person').count());await act(page,'payroll-cancel')}
      await context.close();
    }
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
}
run().catch(e=>{console.error(e);process.exitCode=1});
