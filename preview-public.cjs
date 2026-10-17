// Local verification only: serve the existing release folders, never source or DBs.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const releases = [
  'math-hub-1792216067696-353263',
  'math-play-1792216068242-92a497',
];
const servers = releases.map(name => {
  const root = fs.realpathSync(path.join(__dirname, 'public-releases', name));
  const server = http.createServer((req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400); return res.end('Bad request'); }
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
    fs.realpath(file, (error, real) => {
      if (error || !real.startsWith(root + path.sep)) { res.writeHead(404); return res.end('Not found'); }
      fs.readFile(real, (error, data) => {
        if (error) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm' })[path.extname(real)] || 'application/octet-stream' });
        res.end(req.method === 'HEAD' ? undefined : data);
      });
    });
  });
  server.listen(0, '127.0.0.1', () => console.log(name + ' http://127.0.0.1:' + server.address().port));
  return server;
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { for (const server of servers) server.close(); });
