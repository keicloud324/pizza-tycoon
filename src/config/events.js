export const EVENTS = {
  // === ポジティブ ===
  foodFestival: {
    name: "フードフェスの招待", icon: "🎪", type: "positive",
    cost: 5000, effectDesc: "出店費¥5,000、売上2倍",
    revenueMultiplier: 2.0, duration: 1,
  },
  tvCoverage: {
    name: "テレビ取材", icon: "📺", type: "positive",
    effectDesc: "翌日から3日間来客+30〜80%",
    customerBoostMin: 0.30, customerBoostMax: 0.80, duration: 3,
  },
  cherryBlossom: {
    name: "お花見シーズン", icon: "🌸", type: "positive",
    effectDesc: "カップル・ファミリー増",
    personaBoost: { couple: 1.5, family: 1.5 }, duration: 3,
  },
  christmas: {
    name: "クリスマス特需", icon: "🎄", type: "positive",
    effectDesc: "カップル急増、高単価メニュー人気",
    personaBoost: { couple: 2.0 }, priceBoost: 1.2, duration: 3,
  },
  famousChef: {
    name: "有名シェフ来店", icon: "👨‍🍳", type: "positive",
    effectDesc: "高評価で口コミ爆発",
    reviewBoost: 3.0, duration: 1,
  },
  groupBooking: {
    name: "団体予約", icon: "🏫", type: "positive",
    effectDesc: "学生大量来店",
    personaBoost: { student: 3.0 }, duration: 1,
  },

  // === ネガティブ ===
  typhoon: {
    name: "台風接近", icon: "🌧️", type: "negative",
    effectDesc: "来客-50〜70%",
    customerReductionMin: 0.50, customerReductionMax: 0.70, duration: 1,
  },
  priceHike: {
    name: "食材値上げ", icon: "📈", type: "negative",
    effectDesc: "3日間仕入れ1.5倍",
    ingredientMarkup: 1.5, duration: 3,
  },
  ovenBreak: {
    name: "窯の故障", icon: "🔧", type: "negative",
    effectDesc: "修理費¥8,000 or 1日休業",
    repairCost: 8000, duration: 1,
  },

  // === 都市固有 ===
  snowFestival: {
    name: "雪まつり", icon: "❄️", type: "positive", cityOnly: "sapporo",
    effectDesc: "観光客3倍",
    customerMultiplier: 3.0, duration: 5,
  },
  carpGame: {
    name: "カープ試合日", icon: "⚾", type: "positive", cityOnly: "hiroshima",
    effectDesc: "客5倍",
    customerMultiplier: 5.0, duration: 1,
  },
  carpChampion: {
    name: "カープ優勝セール", icon: "⚾", type: "positive", cityOnly: "hiroshima",
    effectDesc: "3日間全客テンション最高",
    satisfactionBoost: 20, duration: 3,
  },
  autumnLeaves: {
    name: "紅葉シーズン", icon: "🍂", type: "positive", cityOnly: "kyoto",
    effectDesc: "グルメ・観光客2倍",
    personaBoost: { gourmet: 2.0 }, customerMultiplier: 2.0, duration: 5,
  },
  michelinRumor: {
    name: "ミシュラン噂", icon: "🏆", type: "positive", cityOnly: "tokyo",
    effectDesc: "緊張の伏線",
    satisfactionBoost: 0, duration: 0,
  },
};
