import test from 'node:test';
import assert from 'node:assert/strict';
import { countText, pageText } from '../dist/pdf-counter/count.js';
test('한글 조합·이모지·공백·줄바꿈 계산', () => {
  assert.deepEqual(countText('가나다 ABC 12!\n👨‍👩‍👧‍👦\t한'), {included:14, excluded:11});
  assert.deepEqual(countText(''), {included:0, excluded:0});
});
test('PDF 조각의 띄어쓰기와 줄바꿈 복원', () => {
  const item = (str,x,y,width,hasEOL=false) => ({str,transform:[12,0,0,12,x,y],width,hasEOL});
  const text = pageText([item('Hello',0,100,30),item('world',36,100,30,true),item('PDF',0,80,20)]);
  assert.equal(text, 'Hello world\nPDF');
  assert.deepEqual(countText(text), {included:14,excluded:13});
});
test('실제 PDF 바이트에서 PDF.js 텍스트 추출', async () => {
  // 텍스트 추출만 검증. 렌더링에 사용하는 브라우저 DOMMatrix는 호출하지 않음.
  globalThis.DOMMatrix ??= class DOMMatrix {};
  const pdfjs = await import('../dist/pdf-counter/vendor/build/pdf.mjs');
  const stream = 'BT /F1 12 Tf 72 720 Td (Hello PDF 123!) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let source = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((obj,i) => { offsets.push(source.length); source += `${i+1} 0 obj\n${obj}\nendobj\n`; });
  const start = source.length;
  source += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  const task = pdfjs.getDocument({data:new TextEncoder().encode(source),useSystemFonts:true,isEvalSupported:false});
  try {
    const pdf = await task.promise; assert.equal(pdf.numPages,1);
    const content = await (await pdf.getPage(1)).getTextContent();
    assert.equal(pageText(content.items),'Hello PDF 123!');
    assert.deepEqual(countText(pageText(content.items)),{included:14,excluded:12});
  } finally { await task.destroy(); }
});

