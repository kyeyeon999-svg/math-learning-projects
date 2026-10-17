const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, 'public');
if (!fs.existsSync(path.join(source, 'config.js'))) throw new Error('배포 전에 public/config.js를 설정하세요.');
fs.cpSync(source, path.join(__dirname, 'dist'), { recursive: true });
