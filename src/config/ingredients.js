export const INGS = {
  tomato:        { name: "トマト",          icon: "🍅", price: 200, volatility: "high", unlockLevel: 1 },
  basil_i:       { name: "バジル",          icon: "🌿", price: 150, volatility: "high", unlockLevel: 1 },
  mozz_block:    { name: "モッツァレラ(塊)", icon: "🧀", price: 500, perUnit: 6, volatility: "mid", unlockLevel: 1 },
  cheddar_block: { name: "チェダー(塊)",     icon: "🧀", price: 550, perUnit: 6, volatility: "mid", unlockLevel: 2 },
  flour_bag:     { name: "小麦粉(5kg)",     icon: "🌾", price: 800, volatility: "low", unlockLevel: 1 },
  salami_log:    { name: "サラミ(本)",       icon: "🥩", price: 480, perUnit: 8, volatility: "mid", unlockLevel: 1 },
  shrimp_pack:   { name: "エビ(パック)",     icon: "🦐", price: 600, perUnit: 8, volatility: "high", unlockLevel: 3 },
  olive_jar:     { name: "オリーブ(瓶)",     icon: "🫒", price: 180, perUnit: 12, volatility: "low", unlockLevel: 1 },
  gorgonzola_block: { name: "ゴルゴンゾーラ(塊)", icon: "🧀", price: 700, perUnit: 4, volatility: "mid", unlockLevel: 6 },
};

/* 食材価格変動: 毎日ランダムに変動。乾物は±5%、生鮮は±20% */
const VOLATILITY_RANGE = { low: 0.05, mid: 0.10, high: 0.20 };

export function generateDailyPrices(eventMarkup = 1.0) {
  const prices = {};
  for (const [id, ing] of Object.entries(INGS)) {
    const range = VOLATILITY_RANGE[ing.volatility] || 0.10;
    const fluctuation = 1 + (Math.random() * 2 - 1) * range; // e.g. 0.80 ~ 1.20
    prices[id] = {
      price: Math.round(ing.price * fluctuation * eventMarkup),
      basePrice: ing.price,
      ratio: fluctuation * eventMarkup, // < 1 = cheap, > 1 = expensive
    };
  }
  return prices;
}

export const SUPPLIERS = [
  { name: "農家のジョバンニ", icon: "🧑‍🌾", trust: 3, items: ["tomato", "basil_i"], desc: "新鮮な地元野菜" },
  { name: "チーズ工房マリア", icon: "🧀",   trust: 2, items: ["mozz_block", "cheddar_block", "gorgonzola_block"], desc: "最高品質のチーズ" },
  { name: "業務用スーパー",   icon: "🏬",   trust: 4, items: ["flour_bag", "salami_log", "shrimp_pack", "olive_jar"], desc: "安くて大量" },
];
