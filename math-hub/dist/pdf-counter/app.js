import * as pdfjs from './vendor/build/pdf.mjs';
import { countText, pageText } from './count.js';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/build/pdf.worker.mjs', import.meta.url).href;
const $ = id => document.getElementById(id);
let generation = 0;
let task;
function reset(message = '선택한 파일이 없습니다.') {
  generation++;
  if (task) { void task.destroy().catch(() => {}); task = undefined; }
  $('file').value = '';
  $('result').hidden = true;
  $('progress').hidden = true;
  $('rows').replaceChildren(); $('text').textContent = ''; $('filename').textContent = '';
  for (const id of ['included', 'excluded', 'pages']) $(id).textContent = '0';
  $('warning').textContent = ''; $('warning').hidden = true;
  $('status').textContent = message;
}
async function analyze(file) {
  reset();
  if (!file) return;
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') { $('status').textContent = 'PDF 파일을 선택해 주세요.'; return; }
  if (file.size > 100 * 1024 * 1024) { $('status').textContent = '100MB 이하의 PDF를 선택해 주세요.'; return; }
  const current = generation;
  const active = () => current === generation;
  let localTask;
  try {
    $('status').textContent = 'PDF를 이 브라우저에서 여는 중…';
    const data = new Uint8Array(await file.arrayBuffer());
    if (!active()) return;
    localTask = pdfjs.getDocument({ data, cMapUrl: new URL('./vendor/cmaps/', import.meta.url).href, cMapPacked: true,
      standardFontDataUrl: new URL('./vendor/standard_fonts/', import.meta.url).href,
      wasmUrl: new URL('./vendor/wasm/', import.meta.url).href, isEvalSupported: false, useWorkerFetch: true });
    task = localTask;
    localTask.onPassword = (update, reason) => {
      if (!active()) return;
      const password = window.prompt(reason === pdfjs.PasswordResponses.INCORRECT_PASSWORD ? '암호가 맞지 않습니다. PDF 암호를 다시 입력하세요.' : 'PDF 암호를 입력하세요. 암호는 외부로 전송되지 않습니다.');
      if (password === null) reset('암호 입력을 취소했습니다.'); else update(password);
    };
    const pdf = await localTask.promise;
    if (!active()) return;
    const results = []; let included = 0, excluded = 0, empty = 0;
    $('progress').hidden = false; $('progress').max = pdf.numPages; $('progress').value = 0;
    for (let n = 1; n <= pdf.numPages; n++) {
      if (!active()) return;
      $('status').textContent = `${pdf.numPages}쪽 중 ${n}쪽 분석 중…`;
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      if (!active()) return;
      const text = pageText(content.items); const counts = countText(text);
      included += counts.included; excluded += counts.excluded;
      if (!counts.excluded) empty++;
      results.push({ text, ...counts }); page.cleanup();
      $('progress').value = n;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (!active()) return;
    $('filename').textContent = file.name;
    for (const [id, value] of [['included', included], ['excluded', excluded], ['pages', results.length]]) $(id).textContent = value.toLocaleString('ko-KR');
    const fragment = document.createDocumentFragment();
    results.forEach((row, i) => {
      const tr = document.createElement('tr');
      for (const value of [`${i + 1}쪽`, row.included.toLocaleString('ko-KR'), row.excluded.toLocaleString('ko-KR')]) { const td = document.createElement('td'); td.textContent = value; tr.append(td); }
      fragment.append(tr);
    });
    $('rows').replaceChildren(fragment);
    $('text').textContent = results.map((row, i) => `── ${i + 1}쪽 ──\n${row.text}`).join('\n\n');
    if (empty) { $('warning').hidden = false; $('warning').textContent = `텍스트가 없는 페이지가 ${empty}쪽 있습니다. 빈 페이지 또는 스캔·이미지 페이지일 수 있으며, 이미지 속 글자는 계산되지 않았습니다.`; }
    $('result').hidden = false; $('progress').hidden = true;
    $('status').textContent = '분석 완료. 파일과 결과는 서버로 전송하지 않았습니다.';
  } catch (error) {
    if (!active()) return;
    $('progress').hidden = true;
    $('status').textContent = error.name === 'InvalidPDFException' ? 'PDF를 읽을 수 없습니다. 손상되었거나 올바른 PDF가 아닙니다.' : 'PDF를 처리하지 못했습니다. 파일이 손상되었거나 지원하지 않는 형식일 수 있습니다.';
  } finally {
    if (localTask) { await localTask.destroy().catch(() => {}); if (task === localTask) task = undefined; }
  }
}
$('file').addEventListener('change', event => void analyze(event.target.files[0]));
$('clear').addEventListener('click', () => reset('파일과 결과를 지웠습니다.'));
for (const type of ['dragover', 'dragleave', 'drop']) $('drop').addEventListener(type, event => {
  event.preventDefault(); $('drop').classList.toggle('over', type === 'dragover');
  if (type === 'drop') { if (event.dataTransfer.files.length !== 1) { reset('PDF 파일을 한 개씩 선택해 주세요.'); return; } void analyze(event.dataTransfer.files[0]); }
});
window.addEventListener('pagehide', () => reset());
