export function maskMatch(value: string, mode: 'full' | 'middle' | 'none') {
  if (mode === 'none') return '';
  if (mode === 'full' || value.length <= 4) return `•••• (${value.length} ký tự)`;
  return value.slice(0, 2) + '••••' + value.slice(-2);
}
export function fold(text: string, diacritics = false, lower = false) { const value = diacritics ? text.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D') : text; return lower ? value.toLocaleLowerCase('vi') : value; }
export function foldWithOffsets(text: string, diacritics = false, lower = false) {
  const direct = fold(text, diacritics, lower);
  if (!/\p{M}/u.test(text) && direct.length === text.length) return { folded: direct, starts: [] as number[], ends: [] as number[], identity: true };
  let folded = '', offset = 0;
  const starts: number[] = [], ends: number[] = [];
  for (const point of text) {
    const value = fold(point, diacritics, lower), end = offset + point.length;
    if (!value.length && ends.length) ends[ends.length - 1] = end;
    for (let i = 0; i < value.length; i++) { starts.push(offset); ends.push(end); }
    folded += value; offset = end;
  }
  return { folded, starts, ends, identity: false };
}
