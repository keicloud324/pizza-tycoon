/**
 * ランキングシステム (#101)
 * 100店のNPCショップ + プレイヤー
 * 5軸ランキング、固定ライバル3店
 */

// シード値ベースの擬似乱数
function seededRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// 店名テンプレート
const SHOP_PREFIXES = [
  "トラットリア", "ピッツェリア", "リストランテ", "カフェ", "オステリア",
  "ラ・", "イル・", "ダ・", "アル・", "ベラ・",
];
const SHOP_NAMES = [
  "マリオ", "ソーレ", "ルーチェ", "ステラ", "フィオーレ",
  "ロッソ", "ヴェルデ", "ブオーノ", "アモーレ", "チェーロ",
  "フェリーチェ", "ドルチェ", "ベッラ", "プリマ", "ノッテ",
  "マーレ", "テッラ", "フォルテ", "ヴィータ", "ジョイア",
];

function generateShopName(id) {
  const pi = Math.floor(seededRandom(id * 7 + 3) * SHOP_PREFIXES.length);
  const ni = Math.floor(seededRandom(id * 13 + 7) * SHOP_NAMES.length);
  return `${SHOP_PREFIXES[pi]}${SHOP_NAMES[ni]}`;
}

// 固定ライバル
export const RIVAL_SHOPS = {
  pizzasso:   { id: 50, name: "ピザッソ",     power: 600, band: "50-30", icon: "🏪", trait: "チェーン店・価格競争型" },
  napoliWind: { id: 25, name: "ナポリの風",   power: 750, band: "30-15", icon: "🇮🇹", trait: "老舗・品質重視型" },
  pizzaLab:   { id: 10, name: "ピザラボ",     power: 850, band: "15-5",  icon: "🔬", trait: "テクノロジー型" },
};

// 100店のNPCショップ生成
function generateShops() {
  const shops = [];
  const rivalIds = new Set(Object.values(RIVAL_SHOPS).map(r => r.id));

  for (let i = 1; i <= 100; i++) {
    if (rivalIds.has(i)) {
      const rival = Object.values(RIVAL_SHOPS).find(r => r.id === i);
      shops.push({ id: i, name: rival.name, power: rival.power, isRival: true, icon: rival.icon });
    } else {
      // #128: 上位50店=950-400、下位50店=200-20（Day1で95位付近にランクイン可能に）
      const power = i <= 50
        ? Math.round(950 - (i - 1) * (550 / 49))  // 1位=950, 50位=400
        : Math.round(200 - (i - 51) * (180 / 49)); // 51位=200, 100位=20
      shops.push({ id: i, name: generateShopName(i), power, isRival: false });
    }
  }
  return shops;
}

export const NPC_SHOPS = generateShops();

/**
 * 日次スコアを計算（NPC店）
 */
export function npcDailyScore(shop, day) {
  const noise = (seededRandom(day * 1000 + shop.id) - 0.5) * shop.power * 0.1;
  return shop.power + noise;
}

/**
 * プレイヤーの総合スコアを計算
 */
export function playerScore(totalRevenue, avgSatisfaction, totalCustomers, menuCount) {
  return (
    (totalRevenue || 0) * 0.0004 +
    (avgSatisfaction || 0) * 3 * 0.3 +
    (totalCustomers || 0) * 0.2 +
    (menuCount || 0) * 5 * 0.1
  );
}

/**
 * ランキングを計算（プレイヤー含む全101エントリ）
 */
export function computeRanking(day, totalRevenue, avgSatisfaction, totalCustomers, menuCount) {
  const pScore = playerScore(totalRevenue, avgSatisfaction, totalCustomers, menuCount);

  const entries = NPC_SHOPS.map(shop => ({
    id: shop.id,
    name: shop.name,
    score: npcDailyScore(shop, day),
    isRival: shop.isRival,
    icon: shop.icon,
    isPlayer: false,
  }));

  entries.push({
    id: 0,
    name: "あなたの店",
    score: pScore,
    isRival: false,
    icon: "🍕",
    isPlayer: true,
  });

  entries.sort((a, b) => b.score - a.score);

  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}

/**
 * 5軸ランキングのカテゴリ
 */
export const RANKING_AXES = [
  { key: "revenue",     label: "売上",       icon: "💰" },
  { key: "reputation",  label: "口コミ",     icon: "⭐" },
  { key: "menuCount",   label: "メニュー数", icon: "📖" },
  { key: "served",      label: "提供件数",   icon: "🍕" },
  { key: "efficiency",  label: "コスパ",     icon: "📊" },
];
