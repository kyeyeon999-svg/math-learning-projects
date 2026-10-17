import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const require=createRequire(import.meta.url);const {openDiary}=require('../diary-store.cjs');
const sample={date:'2026-10-17',title:'검증용 일기',body:'실제 학생 자료가 아닌 자동 검증용 내용입니다.\n한글과 🌱도 저장해요.'};
test('일기 CRUD·충돌·날짜 검증',()=>{const store=openDiary(':memory:');try{const entry=store.create(sample);assert.equal(store.list().length,1);assert.equal(store.get(entry.id).body,sample.body);const updated=store.update(entry.id,{...sample,title:'수정한 제목',version:1});assert.equal(updated.version,2);assert.throws(()=>store.update(entry.id,{...sample,version:1}),{status:409});assert.throws(()=>store.remove(entry.id,1),{status:409});for(const date of ['2026-02-30','2026-99-99','2026-00-10','2025-02-29'])assert.throws(()=>store.create({...sample,date}),{status:400});assert.throws(()=>store.create({...sample,title:'  '}),{status:400});assert.throws(()=>store.create({...sample,body:'x'.repeat(20001)}),{status:400});store.remove(entry.id,2);assert.equal(store.list().length,0);assert.throws(()=>store.get(entry.id),{status:404});}finally{store.close();}});
test('SQLite 파일을 닫고 다시 열어도 일기 유지',()=>{const folder=fs.mkdtempSync(path.join(os.tmpdir(),'math-diary-store-'));const file=path.join(folder,'diary.sqlite');let store=openDiary(file);try{const entry=store.create(sample);store.close();store=openDiary(file);assert.equal(store.get(entry.id).title,sample.title);}finally{store.close();fs.unlinkSync(file);fs.rmdirSync(folder);}});
test('일기 HTTP 생성·수정·삭제·요청 출처 검사와 DB 파일 비공개',{timeout:20000},async()=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'math-diary-http-'));
  const child=spawn(process.execPath,['server.cjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'0',DIARY_DATA_DIR:folder},stdio:['ignore','pipe','pipe']});
  let stderr='';child.stderr.on('data',chunk=>stderr+=chunk);
  try{
    const base=await new Promise((resolve,reject)=>{child.stdout.on('data',chunk=>{const m=String(chunk).match(/Local: (http:\/\/127\.0\.0\.1:\d+)/);if(m)resolve(m[1]);});child.once('error',reject);child.once('exit',code=>reject(new Error('서버 종료 '+code+' '+stderr)));});
    const headers={'Content-Type':'application/json','X-Diary-Request':'1',Origin:base};
    assert.equal((await fetch(base+'/diary/index.html')).status,200);
    assert.equal((await fetch(base+'/api/diary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(sample)})).status,403);
    assert.equal((await fetch(base+'/api/diary',{method:'POST',headers:{...headers,Origin:'https://example.com'},body:JSON.stringify(sample)})).status,403);
    let response=await fetch(base+'/api/diary',{method:'POST',headers,body:JSON.stringify(sample)});assert.equal(response.status,201);const entry=await response.json();
    assert.equal((await (await fetch(base+'/api/diary')).json()).length,1);
    response=await fetch(base+'/api/diary/'+entry.id,{method:'PUT',headers,body:JSON.stringify({...sample,title:'수정',version:1})});assert.equal(response.status,200);
    assert.equal((await fetch(base+'/api/diary/'+entry.id,{method:'PUT',headers,body:JSON.stringify({...sample,version:1})})).status,409);
    assert.equal((await fetch(base+'/diary-data/diary.sqlite')).status,404);
    assert.equal((await fetch(base+'/api/diary/'+entry.id,{method:'DELETE',headers,body:JSON.stringify({version:2})})).status,200);
    assert.deepEqual(await (await fetch(base+'/api/diary')).json(),[]);
  }finally{const exited=once(child,'exit');child.kill();await exited;const file=path.join(folder,'diary.sqlite');if(fs.existsSync(file))fs.unlinkSync(file);fs.rmdirSync(folder);}
});
