// Teacher-only utility. Never include this file or the secret key in public/.
const readline = require('node:readline/promises');
async function main() {
  const api = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!api || !secret) throw new Error('교사 환경에 SUPABASE_URL, SUPABASE_SECRET_KEY가 필요합니다.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const username = (await rl.question('본인 확인을 마친 학생 아이디(이메일): ')).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) throw new Error('이메일 형식 오류');
  const headers = { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' };
  let target;
  for (let page = 1; !target; page++) {
    const response = await fetch(`${api}/auth/v1/admin/users?page=${page}&per_page=100`, { headers });
    if (!response.ok) throw new Error('관리자 인증 또는 사용자 조회 실패');
    const data = await response.json();
    target = data.users.find(u => u.email === username);
    if (!target && data.users.length < 100) throw new Error('해당 학생을 찾지 못했습니다.');
  }
  const password = require('node:crypto').randomBytes(9).toString('base64url');
  if ((await rl.question(`${username} 학생의 비밀번호를 재설정할까요? yes 입력: `)) !== 'yes') { rl.close(); return; }
  const response = await fetch(`${api}/auth/v1/admin/users/${target.id}`, { method: 'PUT', headers, body: JSON.stringify({ password }) });
  if (!response.ok) throw new Error('비밀번호 재설정 실패');
  console.log(`학생에게 직접 전달할 새 비밀번호: ${password}`); rl.close();
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
