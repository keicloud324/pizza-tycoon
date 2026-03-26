import { useState, useCallback } from "react";
import { DEFAULT_MENUS } from "../config/menus.js";
import { computeLevel, getUnlockedFeatures, getNextLevelProgress } from "../config/levels.js";
import { CITIES } from "../config/cities.js";
import { generateDailyPrices } from "../config/ingredients.js";

/* NEW-03: Save/Load helpers */
const SAVE_KEY = "pizza-tycoon-save";
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.day && data.cityId) return { ...data, phase: "morning", nightData: null, prep: null };
    return null;
  } catch { return null; }
}

const defaultState = {
    phase: "title",  // title | morning | marche | prep | ops | night | menuDev | staff | promotion | ending
    day: 1,
    money: 50000,
    cityId: null,
    conceptId: null,
    stock: { tomato: 8, basil_i: 5, mozz_block: 3, flour_bag: 2, salami_log: 2, shrimp_pack: 1, olive_jar: 1 },
    prep: null,
    nightData: null,

    // Progression
    totalServed: 0,
    totalRevenue: 0,
    level: 1,
    prevLevel: 1,

    // Custom content
    customMenus: [],
    nextMenuId: 100,

    // Staff
    staff: [],

    // Trophies
    trophies: [],
    trophyPopup: null,

    // Reviews
    reviews: [],

    // Rivals
    activeRivals: [],

    // Promotions
    activePromotions: [],
    snsFollowers: 0,

    // Events
    activeEvents: [],
    lastEventDay: 0,

    // Financial
    debt: 0,
    maxDebt: 0,

    // Multi-store
    stores: [],
    currentStoreIndex: 0,

    // Michelin
    michelinPhase: false,
    michelinVisits: 0,
    michelinScores: [],
    michelinStars: 0,
    michelinNextVisitDay: 0,

    // Tutorial
    tutorialSeen: {},

    // Daily prices
    dailyPrices: null,

    // Stats tracking
    handmadePizzas: 0,
    perfectBakes: 0,
    lowCostDays: 0,
    noWasteDays: 0,
    negativeEventsHandled: 0,
    promotionsUsed: 0,
    queueFiveCount: 0,
};

export default function useGameState() {
  const [state, setState] = useState(() => {
    const saved = loadSave();
    return saved || { ...defaultState };
  });

  const s = state;

  // Computed values
  const cityData = s.cityId ? CITIES[s.cityId] : null;
  const level = computeLevel(s.totalServed, s.totalRevenue);
  const unlockedFeatures = getUnlockedFeatures(level);
  const nextLevelInfo = getNextLevelProgress(level, s.totalServed, s.totalRevenue);
  const leveledUp = level > s.prevLevel;
  const warnings = [];
  if (cityData && s.money < cityData.rent * 3) warnings.push("⚠️ 資金ピンチ！家賃3日分を下回っています");
  if (s.debt > 0) warnings.push(`💸 借金: ¥${s.debt.toLocaleString()}`);

  // Update helper
  const update = useCallback((patch) => {
    setState(prev => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  // Phase navigation
  const setPhase = useCallback((phase) => update({ phase }), [update]);

  // Start game
  const startGame = useCallback((cityId, conceptId) => {
    const city = CITIES[cityId];
    update({
      cityId, conceptId,
      phase: "morning",
      maxDebt: city ? city.rent * 30 : 24000,
      dailyPrices: null, // no fluctuation until Day 5
    });
  }, [update]);

  // Shopping done
  const finishMarche = useCallback((cart, cost) => {
    update(prev => {
      const ns = { ...prev.stock };
      Object.entries(cart).forEach(([id, q]) => { ns[id] = (ns[id] || 0) + q; });
      return { stock: ns, money: prev.money - cost, phase: "prep" };
    });
  }, [update]);

  // Prep done
  const finishPrep = useCallback((pd) => {
    update(prev => {
      const ns = { ...prev.stock };
      ns.flour_bag = Math.max(0, (ns.flour_bag || 0) - Math.ceil(pd.dough / 25));
      ns.tomato = Math.max(0, (ns.tomato || 0) - pd.sauce * 3);
      return { stock: ns, prep: pd, phase: "ops" };
    });
  }, [update]);

  // Ops done
  const finishOps = useCallback((data) => {
    update(prev => ({
      nightData: data,
      phase: "night",
      totalServed: prev.totalServed + data.nServed,
      totalRevenue: prev.totalRevenue + data.rev,
      handmadePizzas: prev.handmadePizzas + data.nServed,
      perfectBakes: prev.perfectBakes + (data.satLog?.filter(c => c.sat > 85).length || 0),
    }));
  }, [update]);

  // NEW-03: Auto-save on night end
  const saveGame = useCallback(() => {
    setState(prev => {
      try {
        const { nightData, prep, trophyPopup, levelUpPopup, ...saveable } = prev;
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveable));
      } catch {}
      return prev;
    });
  }, []);

  const hasSaveData = useCallback(() => {
    try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
  }, []);

  const clearSave = useCallback(() => {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
  }, []);

  // Night done (advance day)
  const finishNight = useCallback((profit) => {
    update(prev => {
      const newLevel = computeLevel(prev.totalServed, prev.totalRevenue);
      // Decrement promotion durations
      const promos = prev.activePromotions
        .map(p => ({ ...p, daysLeft: p.daysLeft - 1 }))
        .filter(p => p.daysLeft > 0 || p.daysLeft === -1);
      // SNS follower decay
      const followers = Math.max(0, prev.snsFollowers - Math.floor(Math.random() * 2 + 1));
      // Check event scheduling
      const daysSinceEvent = prev.day - prev.lastEventDay;
      let newEvents = [...prev.activeEvents].map(e => ({ ...e, daysLeft: e.daysLeft - 1 })).filter(e => e.daysLeft > 0);

      // Generate daily prices — fluctuation starts from Day 5
      const nextDay = prev.day + 1;
      let dailyPrices;
      if (nextDay < 5) {
        dailyPrices = null; // use base prices for first 4 days
      } else {
        const eventMarkup = newEvents.some(e => e.ingredientMarkup)
          ? Math.max(...newEvents.filter(e => e.ingredientMarkup).map(e => e.ingredientMarkup))
          : 1.0;
        const cityMarkup = prev.cityId && CITIES[prev.cityId]?.ingredientMarkup || 1.0;
        dailyPrices = generateDailyPrices(eventMarkup * cityMarkup);
      }

      // Michelin phase management
      let michelinPhase = prev.michelinPhase;
      let michelinNextVisitDay = prev.michelinNextVisitDay;
      if (newLevel >= 10 && !michelinPhase) {
        michelinPhase = true;
        michelinNextVisitDay = nextDay + 3 + Math.floor(Math.random() * 8);
      }

      return {
        day: nextDay,
        nightData: null,
        prep: null,
        phase: "morning",
        level: newLevel,
        prevLevel: newLevel,
        activePromotions: promos,
        snsFollowers: followers,
        activeEvents: newEvents,
        dailyPrices,
        michelinPhase,
        michelinNextVisitDay,
      };
    });
  }, [update]);

  // Menu dev
  const saveMenu = useCallback((menu) => {
    update(prev => ({
      customMenus: [...prev.customMenus, { ...menu, id: prev.nextMenuId, active: true }],
      nextMenuId: prev.nextMenuId + 1,
    }));
  }, [update]);

  const toggleMenu = useCallback((menuId) => {
    update(prev => ({
      customMenus: prev.customMenus.map(m =>
        m.id === menuId ? { ...m, active: !m.active } : m
      ),
    }));
  }, [update]);

  const deleteMenu = useCallback((menuId) => {
    update(prev => ({
      customMenus: prev.customMenus.filter(m => m.id !== menuId),
    }));
  }, [update]);

  // Staff
  const hireStaff = useCallback((staffMember) => {
    update(prev => ({
      staff: [...prev.staff, staffMember],
      money: prev.money - 1000, // hiring fee
    }));
  }, [update]);

  // Promotions
  const activatePromotion = useCallback((promoKey, promo) => {
    update(prev => {
      const effect = promo.effectMin
        ? promo.effectMin + Math.random() * (promo.effectMax - promo.effectMin)
        : 0;
      return {
        money: prev.money - (promo.cost || 0),
        activePromotions: [...prev.activePromotions, {
          key: promoKey, name: promo.name, effect, daysLeft: promo.duration,
          targetPersona: promo.targetPersona,
          priceReduction: promo.priceReduction || 0,
        }],
        snsFollowers: promoKey === "sns"
          ? prev.snsFollowers + Math.floor(Math.random() * 12 + 3)
          : prev.snsFollowers,
        promotionsUsed: prev.promotionsUsed + 1,
      };
    });
  }, [update]);

  // Michelin: record inspector visit
  const recordMichelinVisit = useCallback((satisfaction) => {
    update(prev => {
      const scores = [...prev.michelinScores, satisfaction];
      const visits = prev.michelinVisits + 1;
      let stars = 0;
      if (visits >= 3) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg >= 95) stars = 3;
        else if (avg >= 90) stars = 2;
        else if (avg >= 80) stars = 1;
        // If failed, allow retry
        if (stars === 0) {
          return {
            michelinVisits: 0,
            michelinScores: [],
            michelinNextVisitDay: prev.day + 5 + Math.floor(Math.random() * 6),
          };
        }
      }
      return {
        michelinVisits: visits,
        michelinScores: scores,
        michelinStars: stars,
        michelinNextVisitDay: visits < 3
          ? prev.day + 3 + Math.floor(Math.random() * 8)
          : prev.michelinNextVisitDay,
      };
    });
  }, [update]);

  // Multi-store
  const openNewStore = useCallback((cityId, conceptId) => {
    const city = CITIES[cityId];
    if (!city) return;
    const openCost = city.rent * 20;
    update(prev => ({
      stores: [...prev.stores, {
        cityId, conceptId,
        stock: { tomato: 8, basil_i: 5, mozz_block: 3, flour_bag: 2, salami_log: 2, shrimp_pack: 1, olive_jar: 1 },
        staff: [],
        customMenus: [],
        prep: null,
        lastDayRevenue: 0,
        lastDaySatisfaction: 0,
      }],
      money: prev.money - openCost,
    }));
  }, [update]);

  const switchStore = useCallback((index) => {
    update(prev => {
      // Save current store state
      const stores = [...prev.stores];
      if (prev.currentStoreIndex === 0) {
        // Main store — save to root
      } else {
        stores[prev.currentStoreIndex - 1] = {
          ...stores[prev.currentStoreIndex - 1],
          stock: prev.stock, staff: prev.staff, customMenus: prev.customMenus,
        };
      }
      // Load target store
      if (index === 0) {
        return { stores, currentStoreIndex: 0 };
      } else {
        const store = stores[index - 1];
        return {
          stores, currentStoreIndex: index,
          stock: store.stock, staff: store.staff, customMenus: store.customMenus,
          cityId: store.cityId, conceptId: store.conceptId,
        };
      }
    });
  }, [update]);

  // Bankruptcy
  const borrow = useCallback((amount) => {
    update(prev => ({
      debt: prev.debt + amount,
      money: prev.money + amount,
      maxDebtUsed: Math.max(prev.maxDebtUsed || 0, prev.debt + amount),
    }));
  }, [update]);

  const checkBankruptcy = useCallback(() => {
    const city = s.cityId ? CITIES[s.cityId] : null;
    const rent = city?.rent || 800;
    if (s.money < rent && s.debt >= s.maxDebt) {
      return true; // bankrupt
    }
    return false;
  }, [s.money, s.debt, s.maxDebt, s.cityId]);

  const restartSameCity = useCallback(() => {
    update(prev => ({
      ...defaultState,
      phase: "morning",
      cityId: prev.cityId,
      conceptId: prev.conceptId,
      maxDebt: prev.maxDebt,
    }));
  }, [update]);

  // Set money (for Ops)
  const setMoney = useCallback((fn) => {
    setState(prev => ({
      ...prev,
      money: typeof fn === "function" ? fn(prev.money) : fn,
    }));
  }, []);

  return {
    ...state,
    cityData,
    level,
    unlockedFeatures,
    nextLevelInfo,
    leveledUp,
    warnings,
    update,
    setPhase,
    startGame,
    finishMarche,
    finishPrep,
    finishOps,
    finishNight,
    saveMenu,
    toggleMenu,
    deleteMenu,
    hireStaff,
    activatePromotion,
    borrow,
    checkBankruptcy,
    restartSameCity,
    recordMichelinVisit,
    openNewStore,
    switchStore,
    setMoney,
    saveGame,
    hasSaveData,
    clearSave,
  };
}
