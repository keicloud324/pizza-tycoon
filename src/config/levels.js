export const LEVELS = [
  { level: 1,  servedNeeded: 0,   revenueNeeded: 0,
    unlocks: ["baseDough", "tomatoSauce", "mozzarella", "menu1", "menu2"],
    label: "開店" },
  { level: 2,  servedNeeded: 10,  revenueNeeded: 0,
    unlocks: ["genoveseSauce", "cheddar"],
    label: "ジェノベーゼ & チェダー解放" },
  { level: 3,  servedNeeded: 0,   revenueNeeded: 20000,
    unlocks: ["menuDev"],
    label: "オリジナルメニュー開発" },
  { level: 4,  servedNeeded: 30,  revenueNeeded: 0,
    unlocks: ["hallStaff", "tables8"],
    label: "ホールスタッフ & 8席" },
  { level: 5,  servedNeeded: 0,   revenueNeeded: 50000,
    unlocks: ["promotions", "rivalPizzasso"],
    label: "販促 & ライバル出現" },
  { level: 6,  servedNeeded: 60,  revenueNeeded: 0,
    unlocks: ["whiteSauce", "gorgonzola", "wholeWheatDough"],
    label: "新素材解放" },
  { level: 7,  servedNeeded: 0,   revenueNeeded: 100000,
    unlocks: ["kitchenStaff", "tables10", "rivalNapoli"],
    label: "調理スタッフ & 10席" },
  { level: 8,  servedNeeded: 100, revenueNeeded: 0,
    unlocks: ["soySauce", "delivery"],
    label: "和風醤油 & デリバリー" },
  { level: 9,  servedNeeded: 0,   revenueNeeded: 180000,
    unlocks: ["multiStore", "foodFestival", "rivalPizzaLab"],
    label: "2号店 & フードフェス" },
  { level: 10, servedNeeded: 150, revenueNeeded: 0,
    unlocks: ["michelin"],
    label: "ミシュラン評価フェーズ" },
];

export function computeLevel(totalServed, totalRevenue) {
  let current = 1;
  for (const lv of LEVELS) {
    if (lv.level <= 1) continue;
    if (totalServed >= lv.servedNeeded && totalRevenue >= lv.revenueNeeded) {
      current = lv.level;
    } else {
      break;
    }
  }
  return current;
}

export function getUnlockedFeatures(level) {
  const features = new Set();
  for (const lv of LEVELS) {
    if (lv.level <= level) {
      lv.unlocks.forEach(u => features.add(u));
    }
  }
  return features;
}

export function getNextLevelProgress(level, totalServed, totalRevenue) {
  const next = LEVELS.find(lv => lv.level === level + 1);
  if (!next) return { progress: 1, nextLabel: "MAX", servedPct: 1, revenuePct: 1 };
  const servedPct = next.servedNeeded > 0 ? Math.min(1, totalServed / next.servedNeeded) : 1;
  const revenuePct = next.revenueNeeded > 0 ? Math.min(1, totalRevenue / next.revenueNeeded) : 1;
  return {
    progress: Math.min(servedPct, revenuePct),
    nextLabel: next.label,
    servedPct,
    revenuePct,
    servedNeeded: next.servedNeeded,
    revenueNeeded: next.revenueNeeded,
  };
}
