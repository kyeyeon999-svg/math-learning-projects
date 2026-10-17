import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.99.1/+esm';
import { config } from './config.js';
const client = createClient(config.url, config.publishableKey, { auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false } });
const $ = s => document.querySelector(s);
let user = null, generation = 0, pending = null, saving = false;
const say = (text, error = false) => { $('#account-notice').textContent = text; $('#account-notice').dataset.error = String(error); };
function resetView() {
  $('#auth-form').hidden = !!user;
  $('#signed-in').hidden = !user;
  $('#game-area').hidden = !user;
  $('#history-area').hidden = !user;
  $('#history').replaceChildren();
  $('#save-status').textContent = '';
  $('#retry-save').hidden = true;
  $('#identity').textContent = user ? `${user.user_metadata?.username || '학생'}님` : '';
}
async function history(expectedUser = user?.id, expectedGeneration = generation) {
  if (!expectedUser) return;
  const { data, error } = await client.from('alphabet_results').select('round_id,attempts,letters,duration_seconds,created_at').order('created_at', { ascending: false }).limit(30);
  if (generation !== expectedGeneration || user?.id !== expectedUser) return;
  if (error) { say('기록을 불러오지 못했어요. 잠시 뒤 ‘기록 다시 보기’를 눌러 주세요.', true); return; }
  const list = $('#history'); list.replaceChildren();
  if (!data.length) { const li = document.createElement('li'); li.textContent = '아직 저장한 기록이 없어요. 6쌍을 완성해 보세요!'; list.append(li); }
  for (const row of data) {
    const li = document.createElement('li');
    li.textContent = `${new Date(row.created_at).toLocaleString('ko-KR')} · ${row.letters.split('').join(' ')} · 도전 ${row.attempts}번 · 정확도 ${Math.round(6 / row.attempts * 100)}% · ${row.duration_seconds}초`;
    list.append(li);
  }
}
$('#auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  const username = $('#username').value.trim().toLowerCase();
  const password = $('#password').value;
  if (!/^[a-z0-9_]{3,24}$/.test(username)) return say('아이디는 영문 소문자·숫자·밑줄 3~24자로 적어 주세요.', true);
  if (password.length < 6 || password.length > 72) return say('비밀번호는 6~72자로 적어 주세요.', true);
  const signup = event.submitter?.id === 'signup';
  $('#auth-fields').disabled = true;
  say(signup ? '가입하고 있어요…' : '로그인하고 있어요…');
  try {
    const email = `${username}@students.classroom.invalid`;
    const response = signup
      ? await client.auth.signUp({ email, password, options: { data: { username } } })
      : await client.auth.signInWithPassword({ email, password });
    if (response.error) throw response.error;
    if (!response.data.session) { say('가입을 완료하지 못했어요. 담당 교사에게 문의해 주세요.', true); return; }
    user = response.data.user; generation++; pending = null;
    $('#password').value = ''; resetView();
    document.dispatchEvent(new CustomEvent('alphabet-new-session'));
    say('로그인했어요. 6쌍을 완성하면 학습 기록이 저장돼요.');
    await history();
  } catch { say(signup ? '가입하지 못했어요. 다른 아이디를 사용하거나 잠시 후 다시 시도해 주세요.' : '로그인하지 못했어요. 아이디·비밀번호를 확인해 주세요. 비밀번호를 잊었다면 담당 교사에게 문의하세요.', true); }
  finally { $('#auth-fields').disabled = false; }
});
$('#logout').addEventListener('click', async () => {
  if (pending && !window.confirm('저장하지 못한 학습 기록이 있어요. 로그아웃할까요?')) return;
  const { error } = await client.auth.signOut();
  if (error) return say('로그아웃하지 못했어요. 다시 시도해 주세요.', true);
  user = null; generation++; pending = null; resetView();
  document.dispatchEvent(new CustomEvent('alphabet-new-session'));
  say('로그아웃했어요.'); $('#username').focus();
});
async function save() {
  if (!pending || !user || saving) return;
  const item = pending, uid = user.id, epoch = generation;
  saving = true; $('#retry-save').hidden = true; $('#save-status').textContent = '학습 기록을 저장하고 있어요…';
  try {
    const { error } = await client.from('alphabet_results').insert(item);
    if (error && error.code !== '23505') throw error;
    if (error?.code === '23505') {
      const result = await client.from('alphabet_results').select('round_id').eq('round_id', item.round_id).single();
      if (result.error) throw result.error;
    }
    if (uid !== user?.id || epoch !== generation) return;
    if (pending === item) pending = null;
    $('#save-status').textContent = '학습 기록을 저장했어요!'; await history(uid, epoch);
  } catch {
    if (uid !== user?.id || epoch !== generation) return;
    $('#save-status').textContent = '기록을 저장하지 못했어요. 인터넷 연결을 확인하고 다시 저장해 주세요.'; $('#retry-save').hidden = false;
  } finally { saving = false; }
}
document.addEventListener('alphabet-complete', event => {
  if (!user || pending) return;
  pending = event.detail; void save();
});
document.addEventListener('alphabet-before-restart', event => {
  if (pending) { event.preventDefault(); $('#save-status').textContent = '먼저 학습 기록을 다시 저장해 주세요. 저장 후 새 게임을 시작할 수 있어요.'; }
});
$('#retry-save').addEventListener('click', save);
$('#reload-history').addEventListener('click', () => history());
window.addEventListener('beforeunload', event => { if (pending) { event.preventDefault(); event.returnValue = ''; } });
client.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT' && user) { user = null; generation++; pending = null; resetView(); say('로그인이 만료되었어요. 다시 로그인해 주세요.'); } });
resetView(); say('아이디와 비밀번호로 로그인하거나 가입해 주세요.');
