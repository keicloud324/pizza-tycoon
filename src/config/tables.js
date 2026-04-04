// #122: 初期テーブル3つ（2人掛け×3 = 座席6）
const TABLES_3 = [
  { id: 0, x: 30,  y: 40, w: 60, h: 36 },
  { id: 1, x: 115, y: 40, w: 60, h: 36 },
  { id: 2, x: 200, y: 40, w: 60, h: 36 },
];

const TABLES_6 = [
  ...TABLES_3,
  { id: 3, x: 30,  y: 96, w: 60, h: 36 },
  { id: 4, x: 115, y: 96, w: 60, h: 36 },
  { id: 5, x: 200, y: 96, w: 60, h: 36 },
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
  if (level >= 2) return TABLES_6;
  return TABLES_3;
}

export const TABLES = TABLES_3;
