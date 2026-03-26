import { useEffect } from "react";
import useGameState from "./hooks/useGameState.js";
import useEventEngine from "./hooks/useEventEngine.js";
import useRivalSystem from "./hooks/useRivalSystem.js";
import useTrophies from "./hooks/useTrophies.js";
import { LEVELS } from "./config/levels.js";
import { CITIES } from "./config/cities.js";

import TitleScreen from "./components/screens/TitleScreen.jsx";
import Morning from "./components/screens/Morning.jsx";
import Marche from "./components/screens/Marche.jsx";
import Prep from "./components/screens/Prep.jsx";
import Ops from "./components/screens/Ops.jsx";
import Night from "./components/screens/Night.jsx";
import MenuDev from "./components/screens/MenuDev.jsx";
import StaffScreen from "./components/screens/StaffScreen.jsx";
import PromotionScreen from "./components/screens/PromotionScreen.jsx";
import Ending from "./components/screens/Ending.jsx";
import GameOver from "./components/screens/GameOver.jsx";
import MultiStore from "./components/screens/MultiStore.jsx";
import TrophyPopup from "./components/ui/TrophyPopup.jsx";
import LevelUpPopup from "./components/ui/LevelUpPopup.jsx";
import TutorialHint from "./components/ui/TutorialHint.jsx";

export default function PizzaTycoon() {
  /* ?reset でセーブデータを消してタイトルに戻る */
  if (window.location.search.includes("reset")) {
    try { localStorage.removeItem("pizza-tycoon-save"); } catch {}
    window.location.href = window.location.pathname;
    return null;
  }

  const g = useGameState();
  const { checkForEvent } = useEventEngine(g.cityId, g.day, g.lastEventDay, g.update);
  const { activeRivals, getRivalAnnouncements } = useRivalSystem(g.unlockedFeatures);
  const { checkTrophies } = useTrophies(g, g.update);

  // Check for events on morning phase
  useEffect(() => {
    if (g.phase === "morning" && g.cityId) {
      checkForEvent();
      checkTrophies();
      // Update level
      if (g.leveledUp) {
        const lvData = LEVELS.find(l => l.level === g.level);
        g.update({ levelUpPopup: { level: g.level, label: lvData?.label || "" } });
      }
    }
  }, [g.phase, g.day]);

  // Tutorial hints
  const tutorialText = g.day === 1 && g.phase !== "title" && !g.tutorialSeen[g.phase]
    ? {
        morning: "今日の天気や情報を確認しましょう",
        marche: "食材を買って仕込みに備えましょう",
        prep: "今日使う分だけ仕込みましょう",
        ops: "注文が来たらタップして調理しましょう",
      }[g.phase] || null
    : null;

  const dismissTutorial = () => {
    g.update(prev => ({
      tutorialSeen: { ...prev.tutorialSeen, [g.phase]: true },
    }));
  };

  const cityData = g.cityId ? CITIES[g.cityId] : null;
  const cityRent = cityData?.rent || 800;

  return (
    <div style={{
      width: "100%", height: "100dvh", background: "#1a1a2e",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      <div style={{
        width: "min(430px, 100vw)", height: "min(932px, 100dvh)",
        borderRadius: "min(28px, 4vw)",
        overflow: "hidden",
        border: window.innerWidth <= 430 ? "none" : "3px solid #333",
        boxShadow: window.innerWidth <= 430 ? "none" : "0 8px 32px rgba(0,0,0,.5)",
        background: "#000", display: "flex", flexDirection: "column",
        position: "relative",
      }}>

        {/* ===== SCREENS ===== */}
        {g.phase === "title" && (
          <TitleScreen
            onStart={(cityId, conceptId) => g.startGame(cityId, conceptId)}
            hasSaveData={g.hasSaveData()}
            onContinue={() => g.setPhase("morning")}
          />
        )}

        {g.phase === "morning" && (
          <Morning
            day={g.day} money={g.money} cityId={g.cityId}
            level={g.level} totalServed={g.totalServed} totalRevenue={g.totalRevenue}
            nextLevelInfo={g.nextLevelInfo}
            activeEvents={g.activeEvents}
            activeRivals={activeRivals}
            debt={g.debt} warnings={g.warnings}
            unlockedFeatures={g.unlockedFeatures}
            michelinPhase={g.michelinPhase}
            onNext={() => g.setPhase("marche")}
            onMenuDev={() => g.setPhase("menuDev")}
            onPromotion={() => g.setPhase("promotion")}
            onStaff={() => g.setPhase("staff")}
            onMultiStore={g.unlockedFeatures.has("multiStore") ? () => g.setPhase("multiStore") : null}
          />
        )}

        {g.phase === "marche" && (
          <Marche
            money={g.money} stock={g.stock} priceMultiplier={1.0}
            dailyPrices={g.dailyPrices}
            onDone={(cart, cost) => g.finishMarche(cart, cost)}
          />
        )}

        {g.phase === "prep" && (
          <Prep
            stock={g.stock}
            onDone={(pd) => g.finishPrep(pd)}
            onMenuDev={() => g.update({ phase: "menuDev", returnTo: "prep" })}
          />
        )}

        {g.phase === "ops" && g.prep && (
          <Ops
            day={g.day} money={g.money} setMoney={g.setMoney}
            prep={g.prep} customMenus={g.customMenus.filter(m => m.active)}
            level={g.level} cityData={cityData}
            activePromotions={g.activePromotions}
            activeRivals={activeRivals}
            staff={g.staff}
            unlockedFeatures={g.unlockedFeatures}
            onEnd={(data) => {
              g.finishOps(data);
            }}
            onEmergencyBuy={() => g.setPhase("emergencyMarche")}
            onEmergencyPrep={() => {}}
            michelinPhase={g.michelinPhase}
            michelinNextVisitDay={g.michelinNextVisitDay}
            onMichelinVisit={(sat) => g.recordMichelinVisit(sat)}
          />
        )}

        {g.phase === "emergencyMarche" && (
          <Marche
            money={g.money} stock={g.stock} priceMultiplier={1.5}
            dailyPrices={g.dailyPrices}
            onDone={(cart, cost) => {
              g.finishMarche(cart, cost);
              g.update({ phase: "ops" });
            }}
          />
        )}

        {g.phase === "night" && g.nightData && (
          <Night
            day={g.day} money={g.money} cityRent={cityRent}
            data={g.nightData} level={g.level}
            onNext={(profit) => {
              const staffCost = g.nightData.staffCost || 0;
              const totalCost = cityRent + staffCost;
              const newMoney = g.money - totalCost;
              g.setMoney(newMoney);
              g.finishNight(profit);
              setTimeout(() => g.saveGame(), 100);

              // Check michelin ending (victory)
              if (g.michelinStars > 0) {
                setTimeout(() => g.update({ phase: "ending" }), 200);
                return;
              }
              // Check bankruptcy
              if (newMoney < 0 && g.debt >= g.maxDebt) {
                setTimeout(() => g.update({ phase: "gameOver" }), 200);
                return;
              }
              // Offer to borrow if money < 0
              if (newMoney < 0 && g.debt < g.maxDebt) {
                const borrowAmount = Math.min(cityRent * 10, g.maxDebt - g.debt);
                if (window.confirm(`資金不足！¥${borrowAmount.toLocaleString()}を借りますか？`)) {
                  g.borrow(borrowAmount);
                }
              }
            }}
          />
        )}

        {g.phase === "menuDev" && (
          <MenuDev
            customMenus={g.customMenus}
            unlockedFeatures={g.unlockedFeatures}
            onSave={(menu) => g.saveMenu(menu)}
            onToggle={(id) => g.toggleMenu(id)}
            onDelete={(id) => g.deleteMenu(id)}
            onBack={() => g.setPhase(g.returnTo || "morning")}
          />
        )}

        {g.phase === "staff" && (
          <StaffScreen
            staff={g.staff} money={g.money}
            unlockedFeatures={g.unlockedFeatures}
            onHire={(s) => g.hireStaff(s)}
            onBack={() => g.setPhase("morning")}
          />
        )}

        {g.phase === "promotion" && (
          <PromotionScreen
            money={g.money} level={g.level}
            snsFollowers={g.snsFollowers}
            activePromotions={g.activePromotions}
            onActivate={(key, promo) => g.activatePromotion(key, promo)}
            onBack={() => g.setPhase("morning")}
          />
        )}

        {g.phase === "gameOver" && (
          <GameOver
            day={g.day} totalServed={g.totalServed} totalRevenue={g.totalRevenue}
            cityName={cityData?.name || "不明"}
            onRestart={() => g.restartSameCity()}
            onTitle={() => { g.clearSave(); window.location.reload(); }}
          />
        )}

        {g.phase === "multiStore" && (
          <MultiStore
            money={g.money}
            stores={g.stores}
            currentStoreIndex={g.currentStoreIndex}
            mainCityId={g.cityId}
            mainConceptId={g.conceptId}
            onOpenStore={(cId, conId) => g.openNewStore(cId, conId)}
            onSwitch={(idx) => { g.switchStore(idx); g.setPhase("morning"); }}
            onBack={() => g.setPhase("morning")}
          />
        )}

        {g.phase === "ending" && (
          <Ending
            stats={{
              totalServed: g.totalServed, totalRevenue: g.totalRevenue,
              totalDays: g.day, handmadePizzas: g.handmadePizzas,
              perfectBakes: g.perfectBakes,
              storeCount: (g.stores?.length || 0) + 1,
              cityCount: new Set([g.cityId, ...(g.stores || []).map(s => s.cityId)].filter(Boolean)).size,
              totalDebt: g.debt, promotionsUsed: g.promotionsUsed,
              staffCount: g.staff.length,
              customMenuCount: g.customMenus.length,
              avgSatisfaction: 70,
            }}
            trophies={g.trophies}
            michelinStars={g.michelinStars}
            onRestart={() => {
              window.location.reload();
            }}
          />
        )}

        {/* ===== OVERLAYS ===== */}
        {tutorialText && (
          <TutorialHint text={tutorialText} onDismiss={dismissTutorial} />
        )}

        {g.trophyPopup && (
          <TrophyPopup
            trophy={g.trophyPopup}
            tier={g.trophyPopup.tier}
            onDismiss={() => g.update({ trophyPopup: null })}
          />
        )}

        {g.levelUpPopup && (
          <LevelUpPopup
            level={g.levelUpPopup.level}
            label={g.levelUpPopup.label}
            onDismiss={() => g.update({ levelUpPopup: null })}
          />
        )}
      </div>
    </div>
  );
}
