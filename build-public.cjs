// Public releases contain static assets only. Never copy an entire project directory.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = __dirname;
const projects = {
  'math-hub': ['index.html', 'style.css', 'hub.js', 'registry.js', 'alphabet', 'multiplication', 'pdf-counter'],
  'math-play': ['index.html', 'style.css', 'app.js'],
};
function copyAsset(source, target) {
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) throw new Error('Symbolic links are not allowed in public assets.');
  if (stat.isDirectory()) {
    fs.mkdirSync(target);
    for (const name of fs.readdirSync(source)) copyAsset(path.join(source, name), path.join(target, name));
  } else {
    if (!/\.(html|css|js|mjs|wasm|bcmap|pfb|ttf)$/.test(source) && !/^LICENSE(?:_|$)/.test(path.basename(source))) {
      throw new Error('Unexpected public asset type: ' + path.relative(root, source));
    }
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  }
}
async function buildPublic(project, output) {
  if (!Object.hasOwn(projects, project)) throw new Error('Unknown project');
  fs.mkdirSync(output); // Never overwrite an existing release.
  const source = path.join(root, project, 'dist');
  for (const asset of projects[project]) copyAsset(path.join(source, asset), path.join(output, asset));
  if (project === 'math-hub') {
    const { apps } = await import(pathToFileURL(path.join(source, 'apps.js')).href);
    const { validateApps } = await import(pathToFileURL(path.join(source, 'registry.js')).href);
    const publicApps = validateApps(apps.filter(app => app.id !== 'diary'));
    if (publicApps.some(app => /diary/i.test(app.href))) throw new Error('Diary route in public registry');
    for (const app of publicApps) {
      if (!fs.existsSync(path.join(output, app.href))) throw new Error('Missing app entry: ' + app.id);
    }
    fs.writeFileSync(path.join(output, 'apps.js'), 'export const apps = ' + JSON.stringify(publicApps) + ';\n', { flag: 'wx' });
  }
  return output;
}
if (require.main === module) {
  const project = process.argv[2];
  const releaseRoot = path.join(root, 'public-releases');
  fs.mkdirSync(releaseRoot, { recursive: true });
  const output = path.join(releaseRoot, `${project}-${Date.now()}-${require('node:crypto').randomBytes(3).toString('hex')}`);
  buildPublic(project, output).then(result => console.log(result)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { buildPublic };
