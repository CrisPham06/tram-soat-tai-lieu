import { expect, test } from 'vitest';
import rules from '../rulepacks/demo-v1.json';
test('bộ quy tắc giữ nhãn và bảng định tuyến gốc', () => {
  expect(rules.schema).toBe('tram-soat-rulepack/1');
  for (const destination of Object.values(rules.routing.destinations)) expect(destination.S3).toBe('C');
});
