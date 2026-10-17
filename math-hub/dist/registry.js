// 앱 목록은 신뢰하는 개발 소스입니다. 진입 주소는 프로젝트 안의 HTML로 제한합니다.
export function validateApps(entries) {
  if (!Array.isArray(entries)) throw new TypeError('앱 목록은 배열이어야 합니다.');
  const ids = new Set();
  for (const app of entries) {
    if (!app || !/^[a-z][a-z0-9-]*$/.test(app.id) || ids.has(app.id)) throw new Error('앱 id가 잘못되었거나 중복되었습니다.');
    ids.add(app.id);
    for (const key of ['title', 'description', 'href']) {
      if (typeof app[key] !== 'string' || !app[key].trim()) throw new Error(`${app.id}: ${key}가 필요합니다.`);
    }
    if (!/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html$/.test(app.href)) throw new Error(`${app.id}: 프로젝트 내부 HTML 주소를 사용하세요.`);
  }
  return entries;
}
