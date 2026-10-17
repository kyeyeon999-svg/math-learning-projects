const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {openDiary}=require('./diary-store.cjs');
const root=path.join(__dirname,'dist');const port=Number(process.env.PORT ?? 4190);
let diary;
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
async function readJson(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>150000){const e=new Error('일기 내용이 너무 길어요.');e.status=413;throw e;}chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{const e=new Error('일기 형식을 확인해 주세요.');e.status=400;throw e;}}
const server=http.createServer(async(req,res)=>{
  const host=req.headers.host;
  if(![`127.0.0.1:${server.address().port}`,`localhost:${server.address().port}`].includes(host)){res.writeHead(403);return res.end('Forbidden host');}
  let url,pathname;try{url=new URL(req.url,`http://${host}`);pathname=decodeURIComponent(url.pathname);}catch{res.writeHead(400);return res.end('Bad request');}
  if(pathname.startsWith('/api/diary')){
    const expectedOrigin=`http://${host}`;
    if((req.headers.origin&&req.headers.origin!==expectedOrigin)||req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'이 컴퓨터의 일기장 화면에서 사용해 주세요.'});
    const match=pathname.match(/^\/api\/diary(?:\/([a-f0-9-]{36}))?$/);
    if(!match)return json(res,404,{error:'주소를 확인해 주세요.'});
    const id=match[1];
    if(!['GET','POST','PUT','DELETE'].includes(req.method))return json(res,405,{error:'지원하지 않는 요청입니다.'});
    if(req.method!=='GET'&&(req.headers.origin!==expectedOrigin||req.headers['x-diary-request']!=='1'||!req.headers['content-type']?.startsWith('application/json')))return json(res,403,{error:'일기장 화면에서 다시 시도해 주세요.'});
    try{
      if(!diary)diary=openDiary(path.join(process.env.DIARY_DATA_DIR||path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'.local','share'),'MathHub','diary-data'),'diary.sqlite'));
      if(req.method==='GET')return json(res,200,id?diary.get(id):diary.list());
      const input=await readJson(req);
      if(req.method==='POST'&&!id)return json(res,201,diary.create(input));
      if(req.method==='PUT'&&id)return json(res,200,diary.update(id,input));
      if(req.method==='DELETE'&&id){diary.remove(id,input.version);return json(res,200,{deleted:true});}
      return json(res,405,{error:'지원하지 않는 요청입니다.'});
    }catch(error){return json(res,error.status||500,{error:error.status?error.message:'로컬 일기 파일을 읽거나 저장하지 못했어요. 폴더 권한과 디스크 공간을 확인해 주세요.'});}
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('Method not allowed');}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);});
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${server.address().port}`));
function close(){server.close(()=>{diary?.close();process.exit(0);});}
process.on('SIGINT',close);process.on('SIGTERM',close);


