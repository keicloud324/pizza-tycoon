import { useState, useEffect } from "react";
import useGameState from "./hooks/useGameState.js";
import useEventEngine from "./hooks/useEventEngine.js";
import useRivalSystem from "./hooks/useRivalSystem.js";
import useTrophies from "./hooks/useTrophies.js";
import useAudio from "./hooks/useAudio.js";
import { LEVELS } from "./config/levels.js";
import { CITIES } from "./config/cities.js";
import { TUTORIALS, PHASE_TUTORIALS } from "./config/tutorials.js";

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
import IntroSlides from "./components/screens/IntroSlides.jsx";
import TrophyPopup from "./components/ui/TrophyPopup.jsx";
import LevelUpPopup from "./components/ui/LevelUpPopup.jsx";
import TutorialHint from "./components/ui/TutorialHint.jsx";
import SettingsModal from "./components/ui/SettingsModal.jsx";

export default function PizzaTycoon() {
  /* ?reset でセーブデータを消してタイトルに戻る */
  if (window.location.search.includes("reset")) {
    try { localStorage.removeItem("pizza-tycoon-save"); } catch {}
    window.location.href = window.location.pathname;
    return null;
  }

  const g = useGameState();
  const audio = useAudio();
  const [showSettings, setShowSettings] = useState(false);
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
        g.update({ levelUpPopup: { level: g.level, prevLevel: g.prevLevel, label: lvData?.label || "", unlocks: lvData?.unlocks || [] } });
      }
    }
  }, [g.phase, g.day]);

  // BGM: start on first morning, play continuously (#93: 振り返りでも止めない)
  useEffect(() => {
    if (g.phase === "morning" && g.cityId) {
      if (!audio.bgmStarted && !audio.muted) audio.startBgm();
      else audio.resumeBgm();
    }
  }, [g.phase]);

  // #145: Day1 チュートリアルポップアップシステム
  const TUTORIAL_DONE_KEY = "pizza-tycoon-tutorial-done";
  const tutorialDone = (() => { try { return !!localStorage.getItem(TUTORIAL_DONE_KEY); } catch { return false; } })();
  const [activeTutorialId, setActiveTutorialId] = useState(null);

  // フェーズ遷移時に自動チュートリアルをトリガー
  useEffect(() => {
    if (tutorialDone || g.day !== 1) return;
    const tutId = PHASE_TUTORIALS[g.phase];
    if (tutId && !g.tutorialSeen[tutId]) {
      setActiveTutorialId(tutId);
    }
  }, [g.phase, g.day]);

  // Day1完了時にチュートリアル完了フラグを保存
  useEffect(() => {
    if (g.day === 2 && !tutorialDone) {
      try { localStorage.setItem(TUTORIAL_DONE_KEY, "1"); } catch {}
    }
  }, [g.day]);

  // トリガーベースのチュートリアル（外部からsetActiveTutorialIdで呼び出し）
  const triggerTutorial = (triggerId) => {
    if (tutorialDone || g.day !== 1) return;
    if (g.tutorialSeen[triggerId]) return;
    setActiveTutorialId(triggerId);
  };

  const dismissTutorial = () => {
    if (activeTutorialId) {
      g.update(prev => ({
        tutorialSeen: { ...prev.tutorialSeen, [activeTutorialId]: true },
      }));
    }
    setActiveTutorialId(null);
  };

  const activeTutorial = activeTutorialId ? TUTORIALS[activeTutorialId] : null;
  const tutorialPaused = activeTutorial?.mode === "modal" && g.phase === "ops";

  // Day2 hints (keep simple old system for Day 2)
  const tutKey2 = `${g.phase}_d${g.day}`;
  const day2HintText = g.day === 2 && g.phase !== "title" && !g.tutorialSeen[tutKey2]
    ? ({
        morning: "天気やイベントによってお客さんの数が変わります",
        marche: "昨日の結果を参考に仕入れ量を調整しましょう",
      })[g.phase] || null
    : null;

  const dismissDay2Hint = () => {
    g.update(prev => ({
      tutorialSeen: { ...prev.tutorialSeen, [tutKey2]: true },
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
            onStart={(cityId, conceptId) => {
              g.startGame(cityId, conceptId);
              g.setPhase("introSlides");
            }}
            hasSaveData={g.hasSaveData()}
            onContinue={() => g.setPhase("morning")}
            audio={audio}
            onClearSave={() => { g.clearSave(); window.location.reload(); }}
          />
        )}

        {g.phase === "introSlides" && (
          <IntroSlides onComplete={() => g.setPhase("morning")} />
        )}

        {g.phase === "morning" && (
          <Morning
            day={g.day} money={g.money} cityId={g.cityId}
            level={g.level} totalServed={g.totalServed} totalRevenue={g.totalRevenue}
            nextLevelInfo={g.nextLevelInfo}
            activeEvents={g.activeEvents}
            activeRivals={activeRivals}
            reviewBonus={g.reviewBonus || 0}
            debt={g.debt} warnings={g.warnings}
            unlockedFeatures={g.unlockedFeatures}
            michelinPhase={g.michelinPhase}
            dailyHistory={g.dailyHistory}
            discardedDough={g.discardedDough}
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
            dailyPrices={g.dailyPrices} level={g.level}
            ownedEquipment={g.ownedEquipment} onPurchaseEquipment={g.purchaseEquipment}
            audio={audio}
            onDone={(cart, cost) => g.finishMarche(cart, cost)}
          />
        )}

        {g.phase === "prep" && (
          <Prep
            stock={g.stock}
            audio={audio}
            onDone={(pd) => g.finishPrep(pd)}
            onBackToMarche={() => g.setPhase("marche")}
            onMenuDev={() => g.update({ phase: "menuDev", returnTo: "prep" })}
            unlockedFeatures={g.unlockedFeatures}
            activePromotions={g.activePromotions}
            onPromotion={g.unlockedFeatures.has("promotions") ? () => g.update({ phase: "promotion", returnTo: "prep" }) : null}
            staff={g.staff}
            onStaff={g.unlockedFeatures.has("hallStaff") ? () => g.update({ phase: "staff", returnTo: "prep" }) : null}
            level={g.level}
          />
        )}

        {g.phase === "ops" && g.prep && (
          <Ops
            day={g.day} money={g.money} setMoney={g.setMoney} stock={g.stock}
            prep={g.prep} customMenus={g.customMenus.filter(m => m.active)}
            hiddenDefaultMenus={g.hiddenDefaultMenus || []}
            menuPrices={g.menuPrices || {}}
            level={g.level} cityData={cityData}
            activePromotions={g.activePromotions}
            activeRivals={activeRivals}
            staff={g.staff}
            unlockedFeatures={g.unlockedFeatures}
            onEnd={(data) => {
              g.finishOps(data);
            }}
            onEmergencyBuy={() => g.setPhase("emergencyMarche")}
            onEmergencyPrep={() => g.update({ phase: "prep", returnTo: "ops" })}
            michelinPhase={g.michelinPhase}
            michelinNextVisitDay={g.michelinNextVisitDay}
            onMichelinVisit={(sat) => g.recordMichelinVisit(sat)}
            audio={audio}
            paused={tutorialPaused}
            triggerTutorial={triggerTutorial}
          />
        )}

        {g.phase === "emergencyMarche" && (
          <Marche
            money={g.money} stock={g.stock} priceMultiplier={1.5}
            dailyPrices={g.dailyPrices} level={g.level}
            ownedEquipment={g.ownedEquipment} onPurchaseEquipment={g.purchaseEquipment}
            audio={audio}
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
            totalRevenue={g.totalRevenue} totalServed={g.totalServed} customMenus={g.customMenus}
            michelinStars={g.michelinStars} consecutiveHighSatDays={g.consecutiveHighSatDays}
            michelinPhase={g.michelinPhase} audio={audio}
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
            hiddenDefaultMenus={g.hiddenDefaultMenus || []}
            unlockedFeatures={g.unlockedFeatures}
            menuPrices={g.menuPrices || {}}
            onSetPrice={(id, price) => g.setMenuPrice(id, price)}
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
        {g.phase !== "title" && g.phase !== "introSlides" && (
          <div onClick={() => setShowSettings(true)} style={{
            position: "absolute", top: 6, right: 6, zIndex: 100,
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(255,255,255,0.7)", border: "1px solid #CCC",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 14,
          }}>⚙</div>
        )}
        {showSettings && (
          <SettingsModal audio={audio} onClose={() => setShowSettings(false)} />
        )}
        {/* #145: Day1 チュートリアルポップアップ */}
        {activeTutorial && (
          <TutorialHint
            mode={activeTutorial.mode}
            icon={activeTutorial.icon}
            title={activeTutorial.title}
            text={activeTutorial.body || activeTutorial.text}
            btn={activeTutorial.btn}
            onDismiss={dismissTutorial}
          />
        )}
        {/* Day2 ヒント（従来の自動消去方式） */}
        {!activeTutorial && day2HintText && (
          <TutorialHint text={day2HintText} onDismiss={dismissDay2Hint} />
        )}

        {g.trophyPopup && (
          <TrophyPopup
            trophy={g.trophyPopup}
            tier={g.trophyPopup.tier}
            onDismiss={() => g.update({ trophyPopup: null })}
            audio={audio}
          />
        )}

        {g.levelUpPopup && (
          <LevelUpPopup
            level={g.levelUpPopup.level}
            prevLevel={g.levelUpPopup.prevLevel}
            label={g.levelUpPopup.label}
            unlocks={g.levelUpPopup.unlocks}
            onDismiss={() => g.update({ levelUpPopup: null })}
            audio={audio}
          />
        )}
      </div>
    </div>
  );
}
