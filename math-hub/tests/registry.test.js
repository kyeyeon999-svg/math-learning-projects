import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { apps } from '../dist/apps.js';
import { validateApps } from '../dist/registry.js';
const extra = {id:'test-tool',title:'검증용 도구',description:'새 앱 확장 검증',href:'test-tool/index.html'};
test('등록된 모든 앱의 id·주소와 실제 진입 파일 확인', () => {
  validateApps(apps);
  for (const app of apps) assert.ok(existsSync(new URL(`../dist/${app.href}`, import.meta.url)), `${app.id} 진입 파일 없음`);
});
test('필수 네 필드만으로 앱 추가, 빈 목록 허용', () => {
  assert.equal(validateApps([...apps,extra]).length,apps.length+1);
  assert.deepEqual(validateApps([]),[]);
});
test('중복 id·잘못된 주소·필수 필드 누락 차단', () => {
  assert.throws(()=>validateApps([extra,extra]));
  for(const href of ['../index.html','https://example.com/app.html','javascript:alert(1)','/index.html','missing.js']) assert.throws(()=>validateApps([{...extra,href}]));
  for(const key of ['title','description','href']) assert.throws(()=>validateApps([{...extra,[key]:''}]));
});
