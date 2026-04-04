/**
 * 設備投資システム (#99)
 * マルシェ画面のアコーディオンに「設備」カテゴリを追加
 * Lv3以降で解放
 */

export const EQUIPMENT = {
  /* ── A. 機能系設備 ── */
  table_2seat: {
    name: "2人掛けテーブル", icon: "🪑", category: "functional",
    cost: 5000, effect: { seatsAdd: 2 },
    desc: "座席+2", maxOwn: 3,
  },
  table_4seat: {
    name: "4人掛けテーブル", icon: "🪑", category: "functional",
    cost: 8000, effect: { seatsAdd: 4 },
    desc: "座席+4", maxOwn: 2,
  },
  counter_seats: {
    name: "カウンター席", icon: "🍽️", category: "functional",
    cost: 3000, effect: { seatsAdd: 3 },
    desc: "座席+3（1人客向け）", maxOwn: 1,
  },
  oven_pro: {
    name: "高性能窯", icon: "🔥", category: "functional",
    cost: 15000, effect: { ovenRangeBonus: 30 },
    desc: "最適温度範囲が広がる", maxOwn: 1,
  },
  work_bench: {
    name: "作業台拡張", icon: "🔧", category: "functional",
    cost: 10000, effect: { parallelCook: true },
    desc: "同時に2つの注文を並行調理可能", maxOwn: 1,
  },
  fridge: {
    name: "冷蔵庫", icon: "❄️", category: "functional",
    cost: 8000, effect: { freshnessDaysAdd: 1 },
    desc: "食材の鮮度日数が+1日", maxOwn: 1,
  },

  /* ── B. 装飾系設備 ── */
  candle: {
    name: "テーブルキャンドル", icon: "🕯️", category: "decoration",
    cost: 2000, effect: { coupleSatBonus: 5 },
    desc: "カップル客の満足度+5%", maxOwn: 1,
  },
  wall_tile: {
    name: "壁タイル変更", icon: "🧱", category: "decoration",
    cost: 5000, effect: { shopLook: "wall" },
    desc: "店の雰囲気が変わる", maxOwn: 1,
  },
  floor_tile: {
    name: "床タイル変更", icon: "🏠", category: "decoration",
    cost: 5000, effect: { shopLook: "floor" },
    desc: "床の見た目が変化", maxOwn: 1,
  },
  plant: {
    name: "観葉植物", icon: "🌿", category: "decoration",
    cost: 3000, effect: { allSatBonus: 2 },
    desc: "全客の満足度+2%", maxOwn: 3,
  },
  signboard: {
    name: "看板リニューアル", icon: "📋", category: "decoration",
    cost: 8000, effect: { arrivalBonus: 0.1 },
    desc: "通りすがり来店率UP", maxOwn: 1,
  },
};

export const EQUIPMENT_LIST = Object.entries(EQUIPMENT).map(([id, eq]) => ({ id, ...eq }));

/**
 * 所持設備から追加座席数を計算
 */
export function calcEquipmentSeats(ownedEquipment) {
  return (ownedEquipment || []).reduce((sum, eid) => {
    const eq = EQUIPMENT[eid];
    return sum + (eq?.effect?.seatsAdd || 0);
  }, 0);
}

/**
 * 所持設備から満足度ボーナスを計算
 */
export function calcEquipmentSatBonus(ownedEquipment, customerPersona) {
  let bonus = 0;
  for (const eid of (ownedEquipment || [])) {
    const eq = EQUIPMENT[eid];
    if (!eq) continue;
    if (eq.effect.allSatBonus) bonus += eq.effect.allSatBonus;
    if (eq.effect.coupleSatBonus && customerPersona === "couple") bonus += eq.effect.coupleSatBonus;
  }
  return bonus;
}

/**
 * 所持設備から来店ボーナスを計算
 */
export function calcEquipmentArrivalBonus(ownedEquipment) {
  return (ownedEquipment || []).reduce((sum, eid) => {
    const eq = EQUIPMENT[eid];
    return sum + (eq?.effect?.arrivalBonus || 0);
  }, 0);
}
