const $=selector=>document.querySelector(selector);
let entries=[],current=null,baseline='',busy=false;
const fields={date:$('#entry-date'),title:$('#entry-title'),body:$('#entry-body')};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const value=()=>({date:fields.date.value,title:fields.title.value,body:fields.body.value});
const dirty=()=>JSON.stringify(value())!==baseline;
function notice(text,error=false){$('#notice').textContent=text;$('#notice').dataset.error=String(error);}
function setBusy(active){busy=active;$('#entry-fields').disabled=active;$('#new').disabled=active;$('#reload').disabled=active;}
async function request(path='',method='GET',data){
  const response=await fetch(`/api/diary${path}`,{method,cache:'no-store',headers:method==='GET'?{}:{'Content-Type':'application/json','X-Diary-Request':'1'},body:data?JSON.stringify(data):undefined});
  if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('일기 서버를 다시 실행해 주세요. start.cmd를 종료한 뒤 다시 열어 주세요.');
  const result=await response.json();if(!response.ok)throw new Error(result.error||'처리하지 못했어요.');return result;
}
function confirmAction(text,label){const dialog=$('#confirm');$('#confirm-text').textContent=text;$('#confirm-yes').textContent=label;dialog.returnValue='';dialog.showModal();return new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue==='yes'),{once:true}));}
async function canLeave(){return !dirty()||await confirmAction('아직 저장하지 않은 내용이 사라져요. 이동할까요?','이동하기');}
function renderList(){
  const query=$('#search').value.trim().toLocaleLowerCase();const filtered=entries.filter(e=>(e.title+' '+e.body).toLocaleLowerCase().includes(query));
  $('#list-count').textContent=`전체 ${entries.length}편 · 표시 ${filtered.length}편`;const list=$('#entries');list.replaceChildren();
  if(!filtered.length){const li=document.createElement('li');li.textContent=entries.length?'찾는 일기가 없어요.':'첫 번째 일기를 적어 보세요.';list.append(li);return;}
  for(const entry of filtered){const li=document.createElement('li'),button=document.createElement('button'),title=document.createElement('strong'),date=document.createElement('time'),preview=document.createElement('span');title.textContent=entry.title;date.dateTime=entry.date;date.textContent=entry.date;preview.textContent=entry.body.slice(0,60)+(entry.body.length>60?'…':'');button.setAttribute('aria-current',String(current?.id===entry.id));button.append(date,title,preview);button.onclick=async()=>{if(busy||!await canLeave())return;setBusy(true);try{fill(await request('/'+entry.id));notice('일기를 불러왔어요. 수정한 뒤 저장할 수 있어요.');$('#editor-title').focus();}catch(e){notice(e.message,true);}finally{setBusy(false);}};li.append(button);list.append(li);}
}
function fill(entry=null){current=entry;fields.date.value=entry?.date||today();fields.title.value=entry?.title||'';fields.body.value=entry?.body||'';baseline=JSON.stringify(value());$('#editor-title').textContent=entry?'일기 읽기와 수정':'새 일기';$('#delete').hidden=!entry;$('#saved-at').textContent=entry?'마지막 저장: '+new Date(entry.updatedAt).toLocaleString('ko-KR'):'';updateCount();renderList();}
function updateCount(){$('#body-count').textContent=`${fields.body.value.length.toLocaleString()} / 20,000자`;}
for(const input of Object.values(fields))input.addEventListener('input',()=>{updateCount();notice(dirty()?'아직 저장하지 않은 내용이 있어요.':'저장된 내용과 같아요.');});
$('#search').oninput=renderList;
$('#new').onclick=async()=>{if(busy||!await canLeave())return;fill();notice('새 일기를 적어 보세요.');fields.title.focus();};
$('#reload').onclick=async()=>{if(busy)return;setBusy(true);try{entries=await request();renderList();notice('목록을 다시 불러왔어요. 작성 중인 내용은 유지했어요.');}catch(e){notice(e.message,true);}finally{setBusy(false);}};
$('#entry-form').onsubmit=async event=>{
  event.preventDefault();if(busy)return;
  if(!fields.title.value.trim()||!fields.body.value.trim()){notice('제목과 내용을 적어 주세요.',true);return;}
  setBusy(true);notice('이 컴퓨터에 저장하고 있어요.');
  try{const entry=await request(current?'/'+current.id:'',current?'PUT':'POST',{...value(),...(current?{version:current.version}:{})});entries=entries.filter(e=>e.id!==entry.id);entries.push(entry);entries.sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));fill(entry);notice('일기를 이 컴퓨터에 저장했어요.');}
  catch(e){notice(e.message+' 작성한 내용은 화면에 남아 있어요.',true);}finally{setBusy(false);}
};
$('#delete').onclick=async()=>{if(busy||!current)return;const entry=current;if(!await confirmAction('이 일기를 삭제하면 되돌릴 수 없어요. 삭제할까요?','일기 삭제'))return;setBusy(true);try{await request('/'+entry.id,'DELETE',{version:entry.version});entries=entries.filter(e=>e.id!==entry.id);fill();notice('일기를 삭제했어요.');}catch(e){notice(e.message,true);}finally{setBusy(false);}};
$('#home').onclick=async event=>{event.preventDefault();if(busy)return;if(await canLeave())location.assign('../index.html');};
window.addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue='';}});
fill();setBusy(true);try{entries=await request();renderList();notice('일기를 쓸 준비가 됐어요. 저장한 일기는 이 컴퓨터에 남아요.');}catch(e){notice(e.message,true);}finally{setBusy(false);}
