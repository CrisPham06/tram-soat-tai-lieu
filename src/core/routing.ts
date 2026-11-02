import { RANK } from '../shared/severities';
import type { Severity } from '../shared/severities';
import type { Destination } from '../shared/outcomes';
import type { Finding, Rulepack } from './types';
export function maximumSeverity(findings: Finding[]): Severity | 'none' { return findings.reduce<Severity | 'none'>((max, f) => RANK[f.severity] > RANK[max] ? f.severity : max, 'none'); }
export function route(pack: Rulepack, destination: Destination, severity: Severity | 'none') { return pack.routing.destinations[destination][severity]; }
