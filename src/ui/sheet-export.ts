import type { ScreenResult } from '../core/types';
export const findingCount = (result: ScreenResult) => result.findings.reduce((sum, finding) => sum + finding.count, 0);
export function exportSheet(result: ScreenResult) {
  const { maskedText: _text, ...sheet } = result;
  void _text;
  return { ...sheet, findingCount: findingCount(result), findings: sheet.findings.map(f => ({ ...f, excerptMasked: '' })) };
}
