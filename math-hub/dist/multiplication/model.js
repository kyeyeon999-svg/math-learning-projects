export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createQuestion(a = 3, b = 4, random = Math.random) {
  groupCounts(a, b);
  const answer = a * b;
  const distractors = shuffle(Array.from({length: 81}, (_, i) => i + 1).filter(v => v !== answer), random).slice(0, 3);
  return { a, b, answer, options: shuffle([answer, ...distractors], random), firstChoice: null, solved: false };
}
export function createSession(mode, tables, random = Math.random) {
  if (!['single', 'mixed'].includes(mode) || !Array.isArray(tables) || new Set(tables).size !== tables.length || tables.some(t => !Number.isInteger(t) || t < 2 || t > 9) || (mode === 'single' ? tables.length !== 1 : tables.length < 2)) throw new RangeError('연습 범위를 확인해 주세요.');
  const pool = tables.flatMap(a => Array.from({length: 9}, (_, i) => [a, i + 1]));
  let pairs;
  if (mode === 'single') pairs = shuffle(pool, random);
  else {
    const required = tables.map(a => [a, 1 + Math.floor(random() * 9)]);
    const used = new Set(required.map(([a,b]) => `${a}:${b}`));
    pairs = shuffle([...required, ...shuffle(pool.filter(([a,b]) => !used.has(`${a}:${b}`)), random).slice(0, 10 - required.length)], random);
  }
  return {mode, tables: [...tables], questions: pairs.map(([a,b]) => createQuestion(a,b,random)), currentIndex: 0};
}
export function advance(session, expectedIndex) {
  if (session.currentIndex !== expectedIndex || !session.questions[expectedIndex]?.solved) return false;
  session.currentIndex++;
  return true;
}
export function choose(question, value) {
  if (question.solved || !question.options.includes(value)) return false;
  if (question.firstChoice === null) question.firstChoice = value;
  question.solved = value === question.answer;
  return question.solved;
}
export function score(question) { return Number(question.firstChoice === question.answer); }
export function sessionResult(session) {
  return {correct: session.questions.reduce((sum,q) => sum + score(q), 0), total: session.questions.length, review: session.questions.filter(q => q.firstChoice !== null && q.firstChoice !== q.answer)};
}
export function groupCounts(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 2 || a > 9 || b < 1 || b > 9) throw new RangeError('묶음 범위를 확인하세요.');
  return Array.from({ length: b }, () => a);
}

