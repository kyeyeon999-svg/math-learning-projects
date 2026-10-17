const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync(__dirname + '/dist/app.js', 'utf8');
const helpers = code.slice(code.indexOf('function rand('), code.indexOf('function start('));
const ctx = vm.createContext({state: {}, Math});
vm.runInContext(helpers, ctx);
let count = 0;
for (const id of ['arithmetic', 'sequence', 'fraction', 'compare']) {
  for (const hard of [false, true]) {
    ctx.state = {id, hard};
    for (let i = 0; i < 500; i++) {
      const q = vm.runInContext('makeQuestion()', ctx);
      assert.equal(q.choices.filter(c => c.value === q.answer).length, 1);
      assert.equal(new Set(q.choices.map(c => c.value)).size, q.choices.length);
      assert.ok(Number.isFinite(q.answer));
      if (id === 'fraction') {
        const [a,b,den] = q.label.match(/\d+/g).map(Number);
        assert.equal(a * den, q.answer * b);
      }
      if (id === 'compare') assert.equal(q.answer, Math.max(...q.choices.map(c => c.value)));
      if (id === 'arithmetic') {
        const [a,b] = q.label.match(/\d+/g).map(Number);
        assert.equal(q.answer, q.label.includes('+') ? a+b : q.label.includes('×') ? a*b : a-b);
      }
      if (id === 'sequence') {
        const n = q.label.match(/\d+/g).map(Number);
        assert.equal(q.answer, n[2]-n[1] === n[1]-n[0] ? n[3]+n[1]-n[0] : n[3]*n[1]/n[0]);
      }
      count++;
    }
  }
}
console.log(`${count} generated questions passed answer and choice checks.`);
