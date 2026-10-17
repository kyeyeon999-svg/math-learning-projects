const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildPublic } = require('./build-public.cjs');
for (const project of ['math-hub', 'math-play']) {
  test(project + ': public package excludes diary, server, secrets and logs', async () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'public-release-'));
    try {
      const out = await buildPublic(project, path.join(temp, 'site'));
      const files = fs.readdirSync(out, { recursive: true }).filter(name => fs.statSync(path.join(out, name)).isFile());
      assert.ok(files.includes('index.html'));
      for (const name of files) {
        assert.doesNotMatch(name, /diary|server|\.env|\.sqlite|\.log$|\.cmd$|package\.json|test/i);
        if (/\.(js|mjs)$/.test(name)) {
          const check = spawnSync(process.execPath, ['--check', '--input-type=module'], {
            input: fs.readFileSync(path.join(out, name)), encoding: 'utf8',
          });
          assert.equal(check.status, 0, name + ': ' + check.stderr);
        }
        if (/\.html$/.test(name)) {
          const html = fs.readFileSync(path.join(out, name), 'utf8');
          for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
            if (/^(?:https?:|data:)/.test(match[1])) continue;
            const asset = path.resolve(path.dirname(path.join(out, name)), match[1].split(/[?#]/)[0]);
            assert.ok(asset.startsWith(out + path.sep), 'Asset escapes release: ' + name);
            assert.ok(fs.existsSync(asset), 'Missing asset: ' + name + ' -> ' + match[1]);
          }
        }
      }
      if (project === 'math-hub') {
        const code = fs.readFileSync(path.join(out, 'apps.js'), 'utf8');
        assert.doesNotMatch(code, /diary/);
        const apps = JSON.parse(code.slice('export const apps = '.length).trim().replace(/;$/, ''));
        assert.equal(apps.length, 3);
        for (const app of apps) assert.ok(fs.existsSync(path.join(out, app.href)));
      }
      await assert.rejects(buildPublic(project, out), { code: 'EEXIST' });
    } finally {
      // Only this test's newly allocated synthetic output is removed.
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });
}
