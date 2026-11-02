import js from '@eslint/js';
import ts from 'typescript-eslint';
import a11y from 'eslint-plugin-jsx-a11y';
export default ts.config(
  { ignores: ['dist/**', 'dist-offline/**', 'dist-release/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  { files: ['**/*.{ts,tsx,js,mjs}'], languageOptions: { globals: { console: 'readonly', process: 'readonly', Buffer: 'readonly', URL: 'readonly', Blob: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', performance: 'readonly', document: 'readonly', window: 'readonly', self: 'readonly', TextEncoder: 'readonly', TextDecoder: 'readonly', Uint8Array: 'readonly', fetch: 'readonly' } } },
  { files: ['src/core/limits.ts', 'src/core/readers/txt.ts'], rules: { 'no-control-regex': 'off' } },
  { files: ['tools/**/*.mjs'], languageOptions: { globals: { File: 'readonly', innerWidth: 'readonly', location: 'readonly', navigator: 'readonly', localStorage: 'readonly', sessionStorage: 'readonly', indexedDB: 'readonly' } } },
  { files: ['src/**/*.tsx'], plugins: { 'jsx-a11y': a11y }, rules: a11y.configs.recommended.rules }
);
