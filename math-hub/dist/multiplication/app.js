import { createSession, advance, choose, sessionResult, groupCounts } from './model.js';
const root = document.querySelector('#lesson');
let session = null, phase = 'learn', a = 2, b = 1;
let mode = 'single', selectedTables = [2];
function focusHeading() { root.querySelector('h1').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'auto'}); }
function confirmLeave(action) {
  if (document.querySelector('#leave-dialog')) return;
  const previous = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.id = 'leave-dialog'; dialog.setAttribute('aria-labelledby', 'leave-title'); dialog.setAttribute('aria-describedby', 'leave-description');
  dialog.innerHTML = '<h2 id="leave-title">이번 연습을 마칠까요?</h2><p id="leave-description">돌아가면 이번 연습의 답과 점수가 사라져요.</p><form method="dialog" class="actions"><button value="cancel" autofocus>계속 풀기</button><button value="leave" class="primary">돌아가기</button></form>';
  dialog.addEventListener('close', () => {
    const leave = dialog.returnValue === 'leave'; dialog.remove();
    if (leave) action(); else previous?.focus();
  }, {once:true});
  document.body.append(dialog); dialog.showModal();
}
function groups(container, items, count) {
  container.setAttribute('role','img'); container.setAttribute('aria-label', items + '개씩 ' + count + '묶음 그림');
  container.replaceChildren();
  for (const [index, size] of groupCounts(items, count).entries()) {
    const group = document.createElement('div'); group.className = 'group';
    const dots = document.createElement('div'); dots.className = 'dots'; dots.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < size; i++) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); dot.setAttribute('viewBox', '0 0 32 32');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      for (const [key,value] of Object.entries({cx:16,cy:16,r:13,fill:'#ffd731',stroke:'#000'})) circle.setAttribute(key,value);
      dot.append(circle); dots.append(dot);
    }
    const label = document.createElement('span'); label.textContent = `${index + 1}묶음 · ${size}개`;
    group.append(dots, label); container.append(group);
  }
}
function learn() {
  phase = 'learn'; session = null;
  root.innerHTML = `<span class="eyebrow">01 / 그림으로 익히기</span><h1 tabindex="-1">몇 개씩, 몇 묶음일까요?</h1><p>동그라미를 묶어서 세어 보세요.</p><section class="panel"><div class="controls"><label>한 묶음에 <select id="items" aria-label="한 묶음의 개수"></select> 개씩</label><label>모두 <select id="count" aria-label="묶음 수"></select> 묶음</label></div><div class="groups" id="groups"></div><p class="equation" id="equation"></p><p id="summary" role="status" aria-live="polite"></p></section><div class="actions"><button class="primary" id="practice">연습하러 가기 →</button><a class="button" href="../index.html">허브로</a></div>`;
  for (const [id, min, max, selected] of [['items',2,9,a],['count',1,9,b]]) {
    const select = root.querySelector(`#${id}`);
    for (let i=min;i<=max;i++) { const option = new Option(String(i),String(i)); option.selected = i===selected; select.add(option); }
    select.addEventListener('change',update);
  }
  function update() {
    a = Number(root.querySelector('#items').value); b = Number(root.querySelector('#count').value);
    groups(root.querySelector('#groups'),a,b);
    root.querySelector('#equation').textContent = `${a} × ${b} = ${a*b}`;
    root.querySelector('#summary').textContent = `${a}개씩 ${b}묶음이면 모두 ${a*b}개예요.`;
  }
  update(); root.querySelector('#practice').onclick = () => { mode='single'; selectedTables=[a]; settings(); };
}
function settings() {
  phase = 'settings'; session = null;
  root.innerHTML = `<span class="eyebrow">02 / 연습 준비</span><h1 tabindex="-1">어떻게 연습할까요?</h1><p>연습 방법과 풀고 싶은 단을 골라 보세요.</p><section class="panel"><fieldset><legend>연습 방법</legend><div class="mode-options"><label class="selection"><input type="radio" name="mode" value="single"> 한 단씩 · 9문제</label><label class="selection"><input type="radio" name="mode" value="mixed"> 여러 단 섞기 · 10문제</label></div></fieldset><fieldset><legend>연습할 단</legend><p id="table-help"></p><div id="tables" class="table-options"></div></fieldset><p id="selection-summary" role="status" aria-live="polite"></p></section><div class="actions"><button class="primary" id="start" aria-describedby="selection-summary">연습 시작 →</button><button id="back">그림으로 익히기</button></div><p class="note">처음 고른 답으로 점수를 세어요. 기록은 저장하지 않아요.</p>`;
  root.querySelector(`input[value="${mode}"]`).checked = true;
  for (const radio of root.querySelectorAll('input[name="mode"]')) radio.onchange = () => {
    mode = radio.value;
    if (mode === 'single') selectedTables = [selectedTables[0] || a];
    renderTables();
  };
  function renderTables() {
    root.querySelector('#table-help').textContent = mode==='single' ? '한 단을 골라요. ×1부터 ×9까지 한 번씩 풀어요.' : '두 단 이상 골라요. 고른 모든 단에서 문제가 나와요.';
    const container=root.querySelector('#tables'); container.replaceChildren();
    for (let table=2;table<=9;table++) {
      const label=document.createElement('label'); label.className='selection';
      const input=document.createElement('input'); input.type=mode==='single'?'radio':'checkbox'; input.name='tables'; input.setAttribute('aria-describedby','table-help'); input.value=String(table); input.checked=selectedTables.includes(table);
      input.onchange=()=>{ selectedTables=mode==='single'?[table]:Array.from(container.querySelectorAll('input:checked'),el=>Number(el.value)); updateSummary(); };
      label.append(input,document.createTextNode(` ${table}단`)); container.append(label);
    }
    updateSummary();
  }
  function updateSummary() {
    const valid=mode==='single'?selectedTables.length===1:selectedTables.length>=2;
    root.querySelector('#start').disabled=!valid;
    root.querySelector('#selection-summary').textContent=valid?`${selectedTables.join('·')}단 · 모두 ${mode==='single'?9:10}문제를 풀어요.`:'여러 단 연습은 두 단 이상 골라 주세요.';
  }
  root.querySelector('#start').onclick=()=>{
    try { session=createSession(mode,selectedTables); practice(); }
    catch { root.querySelector('#selection-summary').textContent='연습할 단을 다시 확인해 주세요.'; }
  };
  root.querySelector('#back').onclick=()=>{learn();focusHeading();}; renderTables(); focusHeading();
}
function practice() {
  phase='practice'; const index=session.currentIndex; const question=session.questions[index]; const total=session.questions.length;
  root.innerHTML=`<span class="eyebrow">03 / 문제 풀기 · ${index+1} / ${total}</span><h1 tabindex="-1">${question.a}개씩 ${question.b}묶음이면?</h1><p>모두 몇 개일까요? 답을 골라 보세요.</p><progress aria-label="완료한 문제" value="${index}" max="${total}"></progress><section class="panel"><p class="equation">${question.a} × ${question.b} = ?</p><div class="choices" role="group" aria-label="답 보기"></div><p id="feedback" role="status" aria-live="polite" aria-atomic="true">천천히 생각해 보세요.</p><div id="hint" hidden><p>한 묶음에 ${question.a}개씩 있어요. 묶음마다 ${question.a}개씩 더하며 세어 보세요.</p><div class="groups" id="hint-groups"></div></div></section><div class="actions"><button class="primary" id="next" aria-describedby="feedback" hidden>${index===total-1?'결과 보기':'다음 문제'} →</button><button id="change">연습 설정으로</button></div>`;
  const choices=root.querySelector('.choices');
  for (const value of question.options) {
    const button=document.createElement('button'); button.textContent=String(value);
    button.onclick=()=>{
      if (phase!=='practice'||session.currentIndex!==index||question.solved) return;
      const correct=choose(question,value);
      root.querySelector('#feedback').textContent=correct?`✓ 맞았어요! ${question.a} × ${question.b} = ${question.answer}예요.`:'↻ 다시 생각해 볼까요? 그림을 보며 세어 보세요.';
      if(correct){
        for(const option of choices.children) option.disabled=true;
        root.querySelector('progress').value=index+1;
        root.querySelector('#next').hidden=false;root.querySelector('#next').focus();
      } else {root.querySelector('#hint').hidden=false;groups(root.querySelector('#hint-groups'),question.a,question.b);}
    };
    choices.append(button);
  }
  root.querySelector('#next').onclick=()=>{
    if(phase!=='practice'||!advance(session,index)) return;
    if(session.currentIndex===total) result(); else practice();
  };
  root.querySelector('#change').onclick=()=>confirmLeave(settings); focusHeading();
}
function result() {
  phase='result';const {correct,total,review}=sessionResult(session);
  root.innerHTML=`<span class="eyebrow">04 / 연습 마무리</span><h1 tabindex="-1">한 걸음 더 자랐어요!</h1><section class="panel result-panel"><p>처음에 맞힌 문제</p><p class="score">${correct}<span> / ${total}</span></p><h2>다시 볼 문제</h2><div id="review"></div><p class="note">다시 풀어서 맞힌 답은 처음 점수를 바꾸지 않아요.</p></section><div class="actions"><button class="primary" id="restart">다시 연습하기 ↻</button><button id="learn">그림으로 익히기</button><a class="button" href="../index.html">허브로</a></div>`;
  const container=root.querySelector('#review');
  if(!review.length) container.textContent='다시 볼 문제가 없어요. 잘했어요!';
  else {const list=document.createElement('ul');list.className='review-list';for(const q of review){const item=document.createElement('li');item.textContent=`${q.a} × ${q.b} = ${q.answer} · ${q.a}개씩 ${q.b}묶음은 ${q.answer}개예요.`;list.append(item);}container.append(list);}
  root.querySelector('#restart').onclick=settings;
  root.querySelector('#learn').onclick=()=>{learn();focusHeading();};focusHeading();
}
window.addEventListener('pageshow', event => {if(event.persisted){learn();focusHeading();}});
document.querySelector('#home').onclick=event=>{if(phase==='practice'){event.preventDefault();confirmLeave(()=>location.assign(document.querySelector('#home').href));}};
learn();

const displayToggle = document.querySelector('#display-toggle');
displayToggle.onclick = () => { const active = document.body.classList.toggle('classroom'); displayToggle.setAttribute('aria-pressed',String(active)); displayToggle.textContent = active ? '교실 크게 보기 켜짐' : '교실 크게 보기'; };



