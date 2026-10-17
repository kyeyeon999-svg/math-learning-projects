// Exercise the request handler with synthetic objects; no socket is opened.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
test('static handler: method restriction, nosniff and HEAD without body', () => {
  let handler;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'server.cjs'), 'utf8'), {
    require(name) {
      if (name === 'node:http') return { createServer(fn) { handler = fn; return { listen() {} }; } };
      if (name === 'node:fs') return { readFile(file, cb) { cb(null, Buffer.from('synthetic asset')); } };
      return require(name);
    },
    __dirname, process: { env: {} }, URL, console,
  });
  function request(method, url = '/') {
    const result = { headers: {} };
    handler({ method, url }, {
      setHeader(k, v) { result.headers[k] = v; },
      writeHead(code, headers) { result.status = code; Object.assign(result.headers, headers); },
      end(body) { result.body = body; },
    });
    return result;
  }
  assert.equal(request('POST').status, 405);
  assert.equal(request('POST').headers.Allow, 'GET, HEAD');
  assert.equal(request('GET').headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(request('GET').body.toString(), 'synthetic asset');
  assert.equal(request('HEAD').body, undefined);
  assert.equal(request('GET', '/%ZZ').status, 400);
  assert.equal(request('GET', '/..%2fprivate').status, 403);
});
