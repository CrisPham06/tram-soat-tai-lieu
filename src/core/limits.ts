export const LIMITS = { fileBytes: 25 * 1024 * 1024, zipBytes: 200 * 1024 * 1024, zipEntries: 5000, xmlBytes: 50 * 1024 * 1024, unitChars: 2000000, pasteChars: 2000000, rulepackBytes: 1024 * 1024, timeoutMs: 30000, maxFindings: 10000, maxPages: 2000, xmlDepth: 128 } as const;
export class ScreeningError extends Error { constructor(public code: string) { super(code); this.name = 'ScreeningError'; } }
export function reject(code: string): never { throw new ScreeningError(code); }
export function cleanFileName(name: string) { return name.replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '').slice(0, 160); }
