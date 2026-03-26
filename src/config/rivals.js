export const RIVALS = {
  pizzasso: {
    name: "ピザッソ", icon: "🏪",
    desc: "安い・速い",
    unlockFeature: "rivalPizzasso",
    customerSteal: 0.12,
    behavior: "たまにセールを打つ",
    saleChance: 0.15,
    saleEffect: 0.08,
  },
  napoliWind: {
    name: "ナポリの風", icon: "🍷",
    desc: "本格・高品質",
    unlockFeature: "rivalNapoli",
    customerSteal: 0.15,
    behavior: "グルメ客を重点的に奪う",
    targetPersona: "gourmet",
    targetSteal: 0.3,
  },
  pizzaLab: {
    name: "ピザラボ", icon: "📱",
    desc: "SNS映え・トレンド",
    unlockFeature: "rivalPizzaLab",
    customerSteal: 0.18,
    behavior: "SNSキャンペーンでカップル・学生を奪う",
    targetPersonas: ["couple", "student"],
    targetSteal: 0.25,
  },
};
