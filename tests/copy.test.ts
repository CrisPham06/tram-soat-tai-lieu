import { expect, test } from 'vitest';
import { vi } from '../src/ui/copy.vi';
import { FORBIDDEN_PHRASES } from '../src/shared/forbidden-phrases';
import { nextSteps } from '../src/ui/next-steps.vi';
test('ngôn từ cố định không đưa ra kết luận vượt thẩm quyền', () => { const copy = JSON.stringify({ vi, nextSteps }).toLocaleLowerCase('vi'); for (const phrase of FORBIDDEN_PHRASES) expect(copy).not.toContain(phrase); });
