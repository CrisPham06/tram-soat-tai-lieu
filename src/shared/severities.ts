export const SEVERITIES = ['S1', 'S2', 'S3'] as const;
export type Severity = typeof SEVERITIES[number];
export const RANK = { none: 0, S1: 1, S2: 2, S3: 3 } as const;
