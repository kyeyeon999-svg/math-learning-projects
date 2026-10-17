const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');
class Element extends EventTarget {
  children = []; dataset = {}; attrs = {}; hidden = false; disabled = false; value = ''; textContent = '';
  classList = { add() {} };
  setAttribute(k,v) { this.attrs[k] = v; }
  append(...items) { this.children.push(...items); }
  replaceChildren() { this.children = []; }
  focus() {}
  click() { this.dispatchEvent(new Event('click')); }
}
function dom() {
  const elements = new Map();
  const document = new EventTarget();
  document.createElement = () => new Element();
  document.querySelector = selector => {
    const [id, child] = selector.slice(1).split(' ');
    if (!elements.has(id)) elements.set(id,new Element());
    const e = elements.get(id);
    return child ? e.children.find(b=>!b.disabled) : e;
  };
  return { document, $: id=>document.querySelector('#'+id) };
}
const settle = () => new Promise(r=>setImmediate(r));
test('game sends exactly one completed round, counts errors, and respects unsaved restart guard', () => {
  const {document,$} = dom();
  const completed = [];
  document.addEventListener('alphabet-complete', e=>completed.push(e.detail));
  vm.runInNewContext(fs.readFileSync(__dirname+'/public/game.js','utf8'),{document,Math,Date,crypto:webcrypto,CustomEvent});
  const upper = $('upper').children, lower = $('lower').children;
  upper[0].click(); lower.find(x=>x.dataset.letter!==upper[0].dataset.letter).click();
  for (const tile of upper) { tile.click(); lower.find(x=>x.dataset.letter===tile.dataset.letter).click(); }
  assert.equal(completed.length,1);
  assert.equal(completed[0].attempts,7);
  assert.match(completed[0].round_id,/^[a-f0-9-]{36}$/);
  assert.equal(new Set(completed[0].letters).size,6);
  const block = e=>e.preventDefault(); document.addEventListener('alphabet-before-restart',block);
  $('restart').click(); assert.equal($('progress').value,6);
  document.removeEventListener('alphabet-before-restart',block); $('restart').click();
  assert.equal($('progress').value,0);
});
function accountHarness() {
  const {document,$} = dom();
  const control = { saved:[], fail:false, signupArgs:null };
  const client = {
    auth: {
      signUp:async args=>{control.signupArgs=args;return {data:{session:null},error:null};},
      signInWithPassword:async()=>({data:{user:{id:'student-a',user_metadata:{username:'student'}},session:{}},error:null}),
      signOut:async()=>({error:null}), onAuthStateChange() {}
    },
    from:()=>({
      insert:async item=>{if(control.fail)return {error:{code:'network'}};control.saved.push(item);return {error:null};},
      select:()=>({order:()=>({limit:async()=>({data:control.saved.map(x=>({...x,created_at:'2026-10-17T01:00:00Z'})),error:null})}),eq:()=>({single:async()=>({data:{},error:null})})})
    })
  };
  const source = fs.readFileSync(__dirname+'/public/account.js','utf8').replace(/^import .*;\r?\n/gm,'');
  vm.runInNewContext(source,{document,window:new EventTarget(),createClient:()=>client,config:{},location:{origin:'https://classroom-alphabet.vercel.app'},CustomEvent,Date});
  async function submit(id) {
    $('username').value='Student@Example.org'; $('password').value='synthetic-test-password';
    const event = new Event('submit',{cancelable:true}); event.submitter={id};
    $('auth-form').dispatchEvent(event); await settle(); await settle();
  }
  return {$,document,control,submit};
}
test('signup preserves email verification and uses a real email identifier', async()=>{
  const {$,control,submit}=accountHarness(); await submit('signup');
  assert.equal(control.signupArgs.email,'student@example.org');
  assert.equal(control.signupArgs.options.emailRedirectTo,'https://classroom-alphabet.vercel.app');
  assert.match($('account-notice').textContent,/가입 확인 메일/);
  assert.equal($('game-area').hidden,true);
  assert.equal($('password').value,'');
});
test('failed save blocks restart, retry saves once, and logout clears displayed history',async()=>{
  const {$,document,control,submit}=accountHarness(); await submit('login');
  assert.equal($('game-area').hidden,false);
  control.fail=true;
  document.dispatchEvent(new CustomEvent('alphabet-complete',{detail:{round_id:'qa-round',attempts:7,letters:'ABCDEF',duration_seconds:10}}));
  await settle();
  assert.equal($('retry-save').hidden,false);
  assert.equal(document.dispatchEvent(new CustomEvent('alphabet-before-restart',{cancelable:true})),false);
  control.fail=false; $('retry-save').click(); await settle(); await settle();
  assert.equal(control.saved.length,1); assert.match($('save-status').textContent,/저장했어요/);
  assert.equal(document.dispatchEvent(new CustomEvent('alphabet-before-restart',{cancelable:true})),true);
  $('logout').click(); await settle();
  assert.equal($('history').children.length,0); assert.equal($('game-area').hidden,true);
});
