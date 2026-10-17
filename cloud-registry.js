export function validateApps(entries) {
  if (!Array.isArray(entries)) throw new TypeError('앱 목록은 배열이어야 합니다.');
  const ids = new Set();
  for (const app of entries) {
    if (!app || !/^[a-z][a-z0-9-]*$/.test(app.id) || ids.has(app.id)) throw new Error('앱 ID 확인이 필요해요.');
    ids.add(app.id);
    for (const key of ['title', 'description', 'href']) if (typeof app[key] !== 'string' || !app[key].trim()) throw new Error('앱 정보가 비어 있어요.');
    if (/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html$/.test(app.href)) continue;
    const url = new URL(app.href);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('HTTPS 앱 주소를 사용하세요.');
  }
  return entries;
}
