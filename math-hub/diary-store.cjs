const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
class DiaryError extends Error { constructor(status,message){super(message);this.status=status;} }
function validateEntry(input){
  if(!input||typeof input!=='object')throw new DiaryError(400,'일기 내용을 확인해 주세요.');
  const {date,title,body}=input;
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<'1900-01-01'||date>'9999-12-31'||(!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date))throw new DiaryError(400,'올바른 날짜를 골라 주세요.');
  if(typeof title!=='string'||!title.trim()||title.trim().length>100)throw new DiaryError(400,'제목을 1~100자로 적어 주세요.');
  if(typeof body!=='string'||!body.trim()||body.length>20000)throw new DiaryError(400,'일기 내용을 1~20,000자로 적어 주세요.');
  return {date,title:title.trim(),body};
}
function openDiary(filename){
  if(filename!==':memory:')fs.mkdirSync(path.dirname(filename),{recursive:true});
  const db=new DatabaseSync(filename);
  db.exec('CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY,date TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1)');
  const get=id=>db.prepare('SELECT * FROM entries WHERE id=?').get(id);
  return {
    list(){return db.prepare('SELECT * FROM entries ORDER BY date DESC,createdAt DESC,id').all();},
    get(id){const row=get(id);if(!row)throw new DiaryError(404,'일기를 찾을 수 없어요.');return row;},
    create(input){const entry=validateEntry(input),id=randomUUID(),now=new Date().toISOString();db.prepare('INSERT INTO entries VALUES (?,?,?,?,?,?,1)').run(id,entry.date,entry.title,entry.body,now,now);return get(id);},
    update(id,input){const entry=validateEntry(input);if(!Number.isInteger(input.version))throw new DiaryError(400,'일기를 다시 불러온 뒤 저장해 주세요.');const result=db.prepare('UPDATE entries SET date=?,title=?,body=?,updatedAt=?,version=version+1 WHERE id=? AND version=?').run(entry.date,entry.title,entry.body,new Date().toISOString(),id,input.version);if(!result.changes){if(!get(id))throw new DiaryError(404,'일기를 찾을 수 없어요.');throw new DiaryError(409,'다른 화면에서 변경된 일기예요. 목록에서 다시 열어 주세요.');}return get(id);},
    remove(id,version){if(!Number.isInteger(version))throw new DiaryError(400,'일기를 다시 불러온 뒤 삭제해 주세요.');const result=db.prepare('DELETE FROM entries WHERE id=? AND version=?').run(id,version);if(!result.changes){if(!get(id))throw new DiaryError(404,'일기를 찾을 수 없어요.');throw new DiaryError(409,'다른 화면에서 변경된 일기예요. 다시 열어 주세요.');}},
    close(){db.close();}
  };
}
module.exports={openDiary,DiaryError};

