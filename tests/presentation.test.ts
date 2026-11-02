import { expect, test } from 'vitest';
import { screen } from '../src/core/engine';
import { DEFAULT_RULEPACK } from '../src/core/rulepack';
import { emptyMeta } from '../src/core/types';
import { presentPaste } from '../src/worker/paste-presentation';
import { exportSheet, findingCount } from '../src/ui/sheet-export';
const make = (text: string) => screen({ format: 'paste', fileName: 'giả lập', sizeBytes: 0, sha256: '', units: [{ kind: 'body', index: 1, label: 'Đoạn 1', text }], meta: emptyMeta(), warnings: [] }, DEFAULT_RULEPACK, 'ai');
test('đánh số đoạn che và giữ vị trí dòng, không lộ phần khớp', () => {
  const text = 'Tài liệu giả lập\r\n0912345678\r\n0987654321';
  const result = make(text), presentation = presentPaste(text, DEFAULT_RULEPACK, result)!;
  expect(presentation.redactions).toEqual([{ number: 1, ruleId: 'PII-01', line: 2 }, { number: 2, ruleId: 'PII-01', line: 3 }]);
  expect(presentation.text).toContain('[ĐÃ CHE 2:');
  expect(JSON.stringify(presentation)).not.toMatch(/0912345678|0987654321/);
  expect(findingCount(result)).toBe(2);
});
test('không tạo bản trình bày cho mức dừng', () => { const text = 'TỐI MẬT\n0912345678'; expect(presentPaste(text, DEFAULT_RULEPACK, make(text))).toBeNull(); });
test('không có phát hiện thì bản sao giữ nguyên văn bản', () => { const text = 'Sinh hoạt câu lạc bộ giả lập'; expect(presentPaste(text, DEFAULT_RULEPACK, make(text))?.text).toBe(text); });
test('hai quy tắc cùng che một đoạn đều có số tham chiếu, không lộ phần chồng lấn', () => {
  const text = '0912345678@mail.example.vn', presentation = presentPaste(text, DEFAULT_RULEPACK, make(text))!;
  expect(presentation.redactions.map(r => r.ruleId)).toEqual(expect.arrayContaining(['PII-01', 'PII-02']));
  expect(new Set(presentation.redactions.map(r => r.number)).size).toBe(1);
  expect(presentation.parts.filter(p => p.number)).toHaveLength(1);
  expect(presentation.text).not.toContain(text);
  expect(presentation.text).not.toContain('0912345678');
});
test('JSON phiếu cộng số lần và loại văn bản cùng đoạn trích', () => { const result = make('0912345678 và 0987654321'); const exported = exportSheet(result); expect(exported.findingCount).toBe(2); expect(exported).not.toHaveProperty('maskedText'); expect(exported.findings.every(f => f.excerptMasked === '')).toBe(true); });
