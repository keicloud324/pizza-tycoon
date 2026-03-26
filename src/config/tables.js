const TABLES_6 = [
  { id: 0, x: 30,  y: 18, w: 60, h: 36 },
  { id: 1, x: 115, y: 18, w: 60, h: 36 },
  { id: 2, x: 200, y: 18, w: 60, h: 36 },
  { id: 3, x: 30,  y: 76, w: 60, h: 36 },
  { id: 4, x: 115, y: 76, w: 60, h: 36 },
  { id: 5, x: 200, y: 76, w: 60, h: 36 },
];

const TABLES_8 = [
  ...TABLES_6,
  { id: 6, x: 30,  y: 134, w: 60, h: 36 },
  { id: 7, x: 115, y: 134, w: 60, h: 36 },
];

const TABLES_10 = [
  ...TABLES_8,
  { id: 8, x: 200, y: 134, w: 60, h: 36 },
  { id: 9, x: 115, y: 192, w: 60, h: 36 },
];

export function getTablesForLevel(level) {
  if (level >= 7) return TABLES_10;
  if (level >= 4) return TABLES_8;
  return TABLES_6;
}

export const TABLES = TABLES_6;
