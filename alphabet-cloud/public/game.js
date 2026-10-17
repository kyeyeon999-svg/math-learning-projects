const $ = (selector) => document.querySelector(selector);
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
let selected = { upper: null, lower: null };
let found = 0;
let attempts = 0;
let roundId, startedAt, roundLetters;
function updateScore() {
  $('#score').textContent = `찾은 짝 ${found} / 6`;
  $('#attempts').textContent = `도전 ${attempts}번`;
  $('#progress').value = found;
}
function pick(button, side) {
  if (button.disabled) return;
  if (selected[side] === button) {
    button.setAttribute('aria-pressed', 'false');
    selected[side] = null;
    return;
  }
  selected[side]?.setAttribute('aria-pressed', 'false');
  selected[side] = button;
  button.setAttribute('aria-pressed', 'true');
  if (!selected.upper || !selected.lower) {
    $('#message').textContent = `${button.textContent} 선택! ${side === 'upper' ? '소문자' : '대문자'} 짝꿍을 찾아요.`;
    return;
  }
  attempts++;
  const { upper, lower } = selected;
  const correct = upper.dataset.letter === lower.dataset.letter;
  for (const tile of [upper, lower]) {
    tile.setAttribute('aria-pressed', 'false');
    if (correct) {
      tile.disabled = true;
      tile.classList.add('matched');
      tile.setAttribute('aria-label', `${tile.textContent}, 짝 찾음`);
    }
  }
  selected = { upper: null, lower: null };
  if (correct) found++;
  updateScore();
  if (found === 6) document.dispatchEvent(new CustomEvent('alphabet-complete', { detail: { round_id: roundId, attempts, letters: roundLetters, duration_seconds: Math.min(86400, Math.round((Date.now() - startedAt) / 1000)) } }));
  $('#message').textContent = correct
    ? found === 6 ? `모두 찾았어요! ${attempts}번 도전해서 6쌍 완성! 새 알파벳으로 또 놀아요.` : `정답! ${upper.textContent}와 ${lower.textContent}는 짝꿍이에요.`
    : `${upper.textContent}와 ${lower.textContent}는 다른 알파벳이에요. 다시 골라보세요!`;
  if (correct) {
    const next = found === 6 ? $('#restart') : document.querySelector(`#${side} button:not(:disabled)`);
    next?.focus();
  }
}
function start() {
  selected = { upper: null, lower: null };
  found = 0;
  attempts = 0;
  const letters = shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ').slice(0, 6);
  roundId = crypto.randomUUID(); startedAt = Date.now(); roundLetters = letters.join('');
  for (const side of ['upper', 'lower']) {
    const container = $(`#${side}`);
    container.replaceChildren();
    for (const letter of shuffle(letters)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'letter';
      button.dataset.letter = letter;
      button.textContent = side === 'upper' ? letter : letter.toLowerCase();
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => pick(button, side));
      container.append(button);
    }
  }
  updateScore();
  $('#message').textContent = '같은 알파벳의 대문자와 소문자를 찾아보세요.';
}
$('#restart').addEventListener('click', () => { if (!document.dispatchEvent(new CustomEvent('alphabet-before-restart', { cancelable: true }))) return; start(); $('#upper button').focus(); });
document.addEventListener('alphabet-new-session', start);
start();
