import { useCallback } from "react";
import { TROPHIES } from "../config/trophies.js";

export default function useTrophies(state, update) {
  const checkTrophies = useCallback(() => {
    const earned = state.trophies || [];
    const earnedIds = new Set(earned.map(t => `${t.id}-${t.tier}`));

    const counters = {
      handmade: state.handmadePizzas || 0,
      perfectBake: state.perfectBakes || 0,
      menusDev: (state.customMenus || []).length,
      dailyProfit: 0, // checked separately per day
      totalMoney: state.money || 0,
      lowCostDays: state.lowCostDays || 0,
      noWasteDays: state.noWasteDays || 0,
      storeCount: (state.stores || []).length + 1,
      cityCount: new Set([state.cityId, ...(state.stores || []).map(s => s.cityId)].filter(Boolean)).size,
      fiveStarReviews: (state.reviews || []).filter(r => r.sat >= 90).length,
      queueFive: state.queueFiveCount || 0,
      staffCount: (state.staff || []).length,
      negativeEvents: state.negativeEventsHandled || 0,
      /* 借金を実際にしてから完済した場合のみ */
      debtRepaid: state.debt === 0 && (state.maxDebtUsed || 0) > 0 ? 1 : 0,
      michelinStars: state.michelinStars || 0,
    };

    for (const trophy of TROPHIES) {
      const tiers = ["bronze", "silver", "gold"];
      for (const tier of tiers) {
        if (!trophy.tiers[tier]) continue;
        const tid = `${trophy.id}-${tier}`;
        if (earnedIds.has(tid)) continue;

        const conditions = trophy.tiers[tier];
        const met = Object.entries(conditions).every(([k, v]) => (counters[k] || 0) >= v);
        if (met) {
          update(prev => ({
            trophies: [...prev.trophies, { id: trophy.id, tier, name: trophy.name, icon: trophy.icon, category: trophy.category }],
            trophyPopup: { id: trophy.id, tier, name: trophy.name, icon: trophy.icon },
          }));
          return; // one at a time
        }
      }
    }
  }, [state, update]);

  return { checkTrophies };
}
