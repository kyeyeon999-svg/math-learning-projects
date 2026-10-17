import { apps } from './apps.js';
import { validateApps } from './registry.js';
const list = document.querySelector('#apps');
try { validateApps(apps); } catch (error) {
  list.textContent = '앱 목록을 확인해 주세요. 목록의 이름과 주소를 수정한 뒤 새로고침해 주세요.';
  throw error;
}
if (!apps.length) list.textContent = '새로운 수학 놀이를 준비하고 있어요.';
for (const app of apps) {
  const card = document.createElement('article'); card.className = 'app-card';
  const art = document.createElement('div'); art.className = 'card-art'; art.setAttribute('aria-hidden', 'true'); art.textContent = app.art || '✦';
  const badge = document.createElement('span'); badge.className = 'tag'; badge.textContent = app.badge || '학습 도구';
  const title = document.createElement('h3'); title.textContent = app.title;
  const description = document.createElement('p'); description.textContent = app.description;
  const link = document.createElement('a'); link.className = 'button primary'; link.href = app.href; link.textContent = app.action || '시작하기 ↗'; link.setAttribute('aria-label', `${app.title} 시작하기`);
  card.append(art, badge, title, description, link); list.append(card);
}
