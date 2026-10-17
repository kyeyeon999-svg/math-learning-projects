const fs = require('node:fs');
const path = require('node:path');
const { buildPublic } = require('./build-public.cjs');
async function buildPages(output = path.join(__dirname, 'pages-output')) {
  await buildPublic('math-hub', output);
  const registry = path.join(output, 'apps.js');
  const { pathToFileURL } = require('node:url');
  const { apps } = await import(pathToFileURL(registry));
  const configPath = path.join(__dirname, 'cloud-links.json');
  const links = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  for (const [id, href] of Object.entries(links)) {
    const url = new URL(href);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('HTTPS app URL required');
    const app = apps.find(a => a.id === id);
    if (app) app.href = href;
    else if (id === 'diary') apps.push({ id, title: '나의 일기장', description: 'Google 계정으로 로그인하고 나의 하루를 안전하게 기록해요.', href, art: '오늘의 한 페이지 ✎', badge: '일기 · Google 로그인', action: '일기 쓰러 가기 ↗' });
  }
  fs.writeFileSync(registry, 'export const apps = ' + JSON.stringify(apps) + ';\n');
  fs.copyFileSync(path.join(__dirname, 'cloud-registry.js'), path.join(output, 'registry.js'));
  const indexPath = path.join(output, 'index.html');
  fs.writeFileSync(indexPath, fs.readFileSync(indexPath, 'utf8').replaceAll('수학 놀이터', '교실 도구 허브'));
  fs.writeFileSync(path.join(output, '.nojekyll'), '');
  console.log(output);
}
if (require.main === module) buildPages(process.argv[2]).catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { buildPages };
