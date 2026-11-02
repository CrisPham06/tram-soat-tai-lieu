export const OUTCOMES = { A: 'Được xem xét công khai', B: 'Giữ nội bộ', C: 'Chuyển người có thẩm quyền xem xét' } as const;
export type Outcome = keyof typeof OUTCOMES;
export const DESTINATIONS = ['internal', 'national', 'ai', 'outside'] as const;
export type Destination = typeof DESTINATIONS[number];
