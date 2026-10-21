const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function menu(){
  const root=path.join(__dirname,'..'),nodes=new Map(),events={},classes=new Set();
  const classList={add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,on){if(on??!classes.has(k))classes.add(k);else classes.delete(k)}};
  const document={body:{classList},addEventListener:(k,f)=>events[k]=f,
    getElementById(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',hidden:false,dataset:{},focus(){},setAttribute(k,v){this[k]=v}});return nodes.get(id)},
    querySelector:s=>['.side-top .logo','.mlogo'].includes(s)?{outerHTML:''}:null,querySelectorAll:()=>[]};
  const context=vm.createContext({document,localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{getItem:()=>null},location:{hash:''},
    Date,Intl,URL,TextEncoder,Uint8Array,Map,Set,console,setTimeout(){},setInterval(){},clearTimeout(){}});
  context.window=context;context.scrollTo=()=>{};context.addEventListener=()=>{};
  for(const f of ['i18n.js','core.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',f),'utf8'),context);
  const html=fs.readFileSync(path.join(root,'src/app.html'),'utf8');
  const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
  vm.runInContext(script.replace(/boot\(\);\s*\}\)\(\);\s*$/,'globalThis.navTest={UI,AUTH,setS,renderNav};})();'),context);
  const view=context.navTest,state=context.ErgoCore.demo();view.setS(state);view.AUTH.user={role:'admin',name:'Δοκιμή'};
  const click=data=>{const el={dataset:data};events.click({target:{closest:s=>s==='[data-tab]'?(data.tab?el:null):s==='[data-act]'?(data.act?el:null):null}})};
  const htmlOf=()=>nodes.get('nav').innerHTML;
  const expanded=key=>{const tag=htmlOf().match(new RegExp('<button[^>]*id="nav-toggle-'+key+'"[^>]*>'));assert.ok(tag,'visible category toggle '+key);return /aria-expanded="true"/.test(tag[0])};
  const hidden=key=>{const tag=htmlOf().match(new RegExp('<div[^>]*id="nav-area-'+key+'"[^>]*>'));assert.ok(tag,'linked submenu '+key);return /\bhidden\b/.test(tag[0])};
  view.renderNav();return {view,state,nodes,classes,click,htmlOf,expanded,hidden};
}

test('category arrows expand independently without navigating, closing the drawer or replacing page content',()=>{
  const m=menu();m.nodes.set('main',{innerHTML:'unfinished form'});m.classes.add('nav-open');
  for(const key of ['week','projects','workers','pay'])assert.equal(m.expanded(key),false);
  m.click({act:'areatoggle',area:'projects'});m.click({act:'areatoggle',area:'pay'});
  assert.equal(m.view.UI.tab,'today');assert.ok(m.classes.has('nav-open'));
  assert.equal(m.nodes.get('main').innerHTML,'unfinished form');
  assert.equal(m.hidden('projects'),false);assert.equal(m.hidden('pay'),false);assert.equal(m.hidden('week'),true);
  m.click({act:'areatoggle',area:'projects'});
  assert.equal(m.hidden('projects'),true);assert.equal(m.expanded('pay'),true);
});

test('the active category starts expanded and can stay collapsed during a navigation redraw',()=>{
  const m=menu();m.view.UI.tab='pay';m.view.renderNav();assert.equal(m.expanded('pay'),true);
  m.click({act:'areatoggle',area:'pay'});m.view.renderNav();
  assert.equal(m.expanded('pay'),false);assert.equal(m.hidden('pay'),true);assert.equal(m.view.UI.tab,'pay');
});

test('selecting a page reopens its category and keeps the current page highlight',()=>{
  const m=menu();m.view.UI.tab='projects';m.view.renderNav();m.click({act:'areatoggle',area:'projects'});
  m.click({tab:'tasks'});
  assert.equal(m.view.UI.tab,'tasks');assert.equal(m.expanded('projects'),true);
  assert.match(m.htmlOf(),/data-tab="tasks" aria-current="page"/);
});

test('search results reopen the category for projects, customers and individual programmes',()=>{
  const m=menu();
  for(const route of [{act:'qproj',p:m.state.projects[0].id},{act:'qcli',c:m.state.clients[0].id}]){
    m.view.UI.tab='projects';m.view.renderNav();m.click({act:'areatoggle',area:'projects'});
    assert.equal(m.expanded('projects'),false);m.click(route);assert.equal(m.expanded('projects'),true);
  }
  m.view.UI.tab='week';m.view.renderNav();m.click({act:'areatoggle',area:'week'});
  m.click({act:'qperson',id:m.state.workers[0].id});assert.equal(m.expanded('week'),true);
});

test('disabled pages stay hidden and a category with only one page needs no arrow',()=>{
  const m=menu();m.state.settings.off=['gantt','diary','clients'];m.view.renderNav();
  m.click({act:'areatoggle',area:'projects'});
  assert.doesNotMatch(m.htmlOf(),/data-tab="(?:gantt|diary|clients)"/);
  assert.doesNotMatch(m.htmlOf(),/id="nav-toggle-today"/);
  m.state.settings.off.push('pay','costs','profit','acc');m.view.renderNav();
  assert.doesNotMatch(m.htmlOf(),/id="nav-toggle-pay"/);
});

test('worker accounts never receive expandable office menus',()=>{
  const m=menu();m.view.AUTH.user={role:'worker',name:'Εργαζόμενος'};m.view.UI.tab='mine';m.view.renderNav();
  m.click({act:'areatoggle',area:'pay'});
  assert.doesNotMatch(m.htmlOf(),/nav-toggle-|data-tab="(?:pay|projects|workers)"/);
  assert.equal(m.view.UI.tab,'mine');
});
