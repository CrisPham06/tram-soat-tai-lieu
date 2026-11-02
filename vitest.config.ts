import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/**/*.test.ts'], reporters: ['default', 'json'], outputFile: 'reports/checks/unit/vitest_report.json', coverage: { provider: 'v8', include: ['src/core/**/*.ts'], reporter: ['text', 'json-summary'], reportsDirectory: 'reports/checks/unit/coverage' } } });
