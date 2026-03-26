export const TROPHIES = [
  // === 職人系 (Product) ===
  { id: "pizzaiolo",     name: "ピッツァイオーロ", category: "artisan",  icon: "🍕",
    tiers: { bronze: { handmade: 50 },  silver: { handmade: 200 }, gold: { handmade: 500 } } },
  { id: "recipeCollector", name: "レシピコレクター", category: "artisan",icon: "📖",
    tiers: { bronze: { menusDev: 3 },   silver: { menusDev: 7 },   gold: { menusDev: 15 } } },
  { id: "perfectionist", name: "完璧主義者",       category: "artisan",  icon: "✨",
    tiers: { bronze: { perfectBake: 10 }, silver: { perfectBake: 50 }, gold: { perfectBake: 100 } } },
  { id: "ingredientMaster", name: "素材マスター",  category: "artisan",  icon: "🧑‍🍳",
    tiers: { bronze: { allToppingsUsed: 1 } } },

  // === 商売人系 (Price) ===
  { id: "firstProfit",   name: "初めての黒字",     category: "merchant", icon: "💰",
    tiers: { bronze: { dailyProfit: 1000 }, silver: { dailyProfit: 5000 }, gold: { dailyProfit: 10000 } } },
  { id: "savingsKing",   name: "貯金王",           category: "merchant", icon: "🏦",
    tiers: { bronze: { totalMoney: 100000 }, silver: { totalMoney: 500000 }, gold: { totalMoney: 1000000 } } },
  { id: "costManager",   name: "コスト管理の鬼",   category: "merchant", icon: "📊",
    tiers: { bronze: { lowCostDays: 7 }, silver: { lowCostDays: 14 }, gold: { lowCostDays: 30 } } },
  { id: "zeroWaste",     name: "廃棄ゼロ",         category: "merchant", icon: "♻️",
    tiers: { bronze: { noWasteDays: 5 }, silver: { noWasteDays: 15 }, gold: { noWasteDays: 30 } } },

  // === 開拓者系 (Place) ===
  { id: "multiStore",    name: "多店舗経営",       category: "explorer", icon: "🏪",
    tiers: { bronze: { storeCount: 2 }, silver: { storeCount: 3 }, gold: { storeCount: 5 } } },
  { id: "nationwide",    name: "全国制覇",         category: "explorer", icon: "🗾",
    tiers: { bronze: { cityCount: 4 }, silver: { cityCount: 8 }, gold: { cityCount: 12 } } },
  { id: "localMaster",   name: "ご当地マスター",   category: "explorer", icon: "🏠",
    tiers: { bronze: { singleCityLv10: 1 } } },

  // === 人気者系 (Promotion) ===
  { id: "reviewStar",    name: "口コミの星",       category: "celebrity", icon: "⭐",
    tiers: { bronze: { fiveStarReviews: 10 }, silver: { fiveStarReviews: 50 }, gold: { fiveStarReviews: 100 } } },
  { id: "longQueue",     name: "行列のできる店",   category: "celebrity", icon: "🚶",
    tiers: { bronze: { queueFive: 10 }, silver: { queueFive: 30 }, gold: { queueFive: 50 } } },
  { id: "repeater",      name: "リピーター量産",   category: "celebrity", icon: "🔄",
    tiers: { bronze: { samePersona3: 1 } } },
  { id: "snsBuzz",       name: "SNSバズ",         category: "celebrity", icon: "📱",
    tiers: { bronze: { snsBoost50: 1 } } },

  // === ボス系 ===
  { id: "firstHire",     name: "はじめての仲間",   category: "boss",     icon: "🤝",
    tiers: { bronze: { staffCount: 1 }, silver: { staffCount: 3 }, gold: { staffCount: 5 } } },
  { id: "trustedTeam",   name: "信頼のチーム",     category: "boss",     icon: "💪",
    tiers: { bronze: { allStaffLv5: 1 } } },
  { id: "delegator",     name: "委任の達人",       category: "boss",     icon: "👔",
    tiers: { bronze: { autoRunDay: 1 } } },

  // === 特殊系 ===
  { id: "stormSurvivor", name: "嵐を乗り越えて",   category: "special",  icon: "🌪️",
    tiers: { bronze: { negativeEvents: 3 } } },
  { id: "debtFree",      name: "借金完済",         category: "special",  icon: "🎊",
    tiers: { bronze: { debtRepaid: 1 } } },
  { id: "michelin1",     name: "ミシュラン1つ星",  category: "special",  icon: "⭐",
    tiers: { bronze: { michelinStars: 1 } } },
  { id: "michelin3",     name: "ミシュラン3つ星",  category: "special",  icon: "🌟",
    tiers: { bronze: { michelinStars: 3 } } },
];
