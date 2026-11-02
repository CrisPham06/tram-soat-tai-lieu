import type { Destination, Outcome } from '../shared/outcomes';
import type { Severity } from '../shared/severities';
export type Format = 'txt' | 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'paste';
export type UnitKind = 'body' | 'header' | 'footer' | 'notes' | 'comment' | 'cell' | 'slide' | 'pdfpage' | 'metadata';
export interface Unit { kind: UnitKind; index: number; label: string; text: string; hidden?: boolean }
export interface Meta { creator?: string; lastModifiedBy?: string; company?: string; title?: string; paths: string[]; hyperlinks: string[]; commentsCount: number; trackedChanges: number; hiddenItems: number; embeddedObjects: number; externalLinks: number; pdfInfo?: Record<string, unknown> }
export interface DocumentModel { format: Format; fileName: string; sizeBytes: number; sha256: string; units: Unit[]; meta: Meta; warnings: string[] }
export interface Rule { id: string; title: string; group: string; severity: Severity; type: 'regex' | 'wordlist' | 'metadata'; mask: 'full' | 'middle' | 'none'; unit?: 'paragraph' | 'text'; flags?: string; pattern?: string; words?: string[]; ignoreCase?: boolean; ignoreDiacritics?: boolean; caseSensitive?: boolean }
export interface Rulepack { schema: string; id: string; name: string; note: string; severities: Record<Severity, string>; routing: { outcomes: Record<Outcome, string>; destinations: Record<Destination, Record<Severity | 'none', Outcome> & { label: string }> }; rules: Rule[] }
export interface Finding { ruleId: string; title: string; severity: Severity; unitKind: UnitKind; unitIndex: number; label: string; excerptMasked: string; count: number }
export interface ScreenResult { format: Format; fileName: string; sizeBytes: number; sha256: string; destination: Destination; outcome: Outcome; maxSeverity: Severity | 'none'; findings: Finding[]; warnings: string[]; rulepackId: string; rulepackName: string; checkedAt: string; durationMs: number; maskedText?: string }
export const emptyMeta = (): Meta => ({ paths: [], hyperlinks: [], commentsCount: 0, trackedChanges: 0, hiddenItems: 0, embeddedObjects: 0, externalLinks: 0 });
