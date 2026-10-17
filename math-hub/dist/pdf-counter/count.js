const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });
export function countText(text) {
  const normalized = text.normalize('NFC').replace(/\r\n?/g, '\n');
  const withoutBreaks = normalized.replace(/[\n\u2028\u2029]/g, '');
  return { included: [...segmenter.segment(withoutBreaks)].length,
    excluded: [...segmenter.segment(normalized.replace(/\s/gu, ''))].length };
}
export function pageText(items) {
  let text = '';
  let previous;
  for (const item of items) {
    if (typeof item.str !== 'string') continue;
    if (previous && !text.endsWith('\n') && !/\s$/u.test(text) && !/^\s/u.test(item.str)) {
      const sameLine = Math.abs(previous.transform[5] - item.transform[5]) < Math.max(1, Math.abs(item.transform[3]) * .25);
      const gap = item.transform[4] - (previous.transform[4] + previous.width);
      if (!sameLine) text += '\n';
      else if (gap > Math.max(1, Math.abs(item.transform[0]) * .15)) text += ' ';
    }
    text += item.str;
    if (item.hasEOL) text += '\n';
    previous = item;
  }
  return text.normalize('NFC');
}
