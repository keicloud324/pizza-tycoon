import { useMemo } from "react";
import { RIVALS } from "../config/rivals.js";

export default function useRivalSystem(unlockedFeatures) {
  const activeRivals = useMemo(() => {
    return Object.entries(RIVALS)
      .filter(([, r]) => unlockedFeatures.has(r.unlockFeature))
      .map(([key, r]) => ({ key, ...r }));
  }, [unlockedFeatures]);

  const getRivalAnnouncements = () => {
    return activeRivals.map(r => {
      if (r.saleChance && Math.random() < r.saleChance) {
        return `${r.icon} ${r.name}がセール中！客足-${Math.round(r.saleEffect * 100)}%`;
      }
      return `${r.icon} ${r.name}が営業中 (客足-${Math.round(r.customerSteal * 100)}%)`;
    });
  };

  return { activeRivals, getRivalAnnouncements };
}
