export const CONCEPTS = {
  napoli: {
    name: "本格ナポリ", icon: "🇮🇹",
    desc: "伝統素材が高評価",
    affinityBonus: { gourmet: 1.3 },
    affinityPenalty: {},
  },
  casual: {
    name: "カジュアル", icon: "🍕",
    desc: "回転率・コスパ重視",
    affinityBonus: { student: 1.3, business: 1.2 },
    affinityPenalty: {},
  },
  creative: {
    name: "創作ピッツァ", icon: "🎨",
    desc: "ユニークな組み合わせが高評価",
    affinityBonus: { couple: 1.3, gourmet: 1.2 },
    affinityPenalty: {},
  },
  organic: {
    name: "オーガニック", icon: "🌿",
    desc: "高品質素材が必須",
    affinityBonus: { gourmet: 1.3 },
    affinityPenalty: {},
  },
  family: {
    name: "ファミリー向け", icon: "🏠",
    desc: "ボリューム・子供メニュー重視",
    affinityBonus: { family: 1.4 },
    affinityPenalty: {},
  },
  gourmetDining: {
    name: "グルメダイニング", icon: "🍷",
    desc: "見た目・高級食材重視",
    affinityBonus: { gourmet: 1.4, couple: 1.2 },
    affinityPenalty: {},
  },
};

export const CONCEPT_LIST = Object.entries(CONCEPTS).map(([id, data]) => ({ id, ...data }));
