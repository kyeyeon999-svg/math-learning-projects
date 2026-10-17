import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('알파벳 생성, 양방향 선택, 오답 재도전, 완성 및 재시작', () => {
  class Element {
    children = []; dataset = {}; attrs = {}; disabled = false; textContent = '';
    classList = { add() {} };
    setAttribute(k, v) { this.attrs[k] = v; }
    addEventListener(k, fn) { this[k] = fn; }
    append(child) { this.children.push(child); }
    replaceChildren() { this.children = []; }
    focus() {}
  }
  const elements = Object.fromEntries(['upper', 'lower', 'score', 'attempts', 'progress', 'message', 'restart'].map(id => [id, new Element()]));
  const document = {
    createElement: () => new Element(),
    querySelector(selector) {
      const [id, child] = selector.slice(1).split(' ');
      return child ? elements[id].children.find(b => !b.disabled) : elements[id];
    },
  };
  vm.runInNewContext(readFileSync(new URL('../dist/alphabet/app.js', import.meta.url), 'utf8'), { document, Math });
  const upper = elements.upper.children;
  const lower = elements.lower.children;
  assert.equal(new Set(upper.map(b => b.textContent)).size, 6);
  assert.deepEqual(upper.map(b => b.textContent.toLowerCase()).sort(), lower.map(b => b.textContent).sort());
  upper[0].click();
  lower.find(b => b.dataset.letter !== upper[0].dataset.letter).click();
  assert.equal(elements.progress.value, 0);
  assert.match(elements.message.textContent, /다른 알파벳/);
  for (const tile of upper) {
    lower.find(b => b.dataset.letter === tile.dataset.letter).click();
    tile.click();
  }
  assert.equal(elements.progress.value, 6);
  assert.equal(elements.attempts.textContent, '도전 7번');
  assert.ok([...upper, ...lower].every(b => b.disabled));
  assert.match(elements.message.textContent, /모두 찾았어요/);
  elements.restart.click();
  assert.equal(elements.progress.value, 0);
  assert.equal(elements.attempts.textContent, '도전 0번');
  assert.equal(elements.upper.children.length, 6);
  assert.ok(elements.upper.children.every(b => !b.disabled));
});
