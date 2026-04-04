import { useState, useEffect } from "react";
import { F, V, clamp } from "../../config/design.js";
import { PERSONAS } from "../../config/personas.js";
import { DEFAULT_MENUS, getMenuPrice } from "../../config/menus.js";
import { getTablesForLevel } from "../../config/tables.js";
import { EMO, CUST_EMOTE, SFX, SFX2 } from "../../config/assets.js";
import Btn from "../shared/Btn.jsx";
import Cooking from "./Cooking.jsx";
import Prep from "./Prep.jsx";

const Emo = ({ src, size = 56 }) => src
  ? <div style={{ position: "relative", display: "inline-block", animation: "popIn 0.3s ease-out" }}>
      <div style={{ position: "absolute", inset: -4, borderRadius: "50%", background: "rgba(255,255,255,0.8)" }} />
      <img src={src} width={size} height={size} style={{ imageRendering: "auto", position: "relative" }} />
    </div>
  : null;

/* ─── module-level customer ID counter ─── */
let gid = 0;

/* ─── persona key mapping for cityData.personas weights ─── */
const PERSONA_KEYS = ["family", "student", "couple", "business", "gourmet"];

function pickWeightedPersona(personas, distribution) {
  /* distribution = { family:40, student:30, ... } (percentages) */
  if (!distribution) return personas[Math.floor(Math.random() * personas.length)];
  const entries = PERSONA_KEYS.map((k, i) => ({ persona: personas[i], w: distribution[k] || 0 }))
    .filter(e => e.persona);
  /* handle extra personas like "tourist" — map to random existing persona */
  const totalW = entries.reduce((s, e) => s + e.w, 0);
  if (totalW === 0) return personas[Math.floor(Math.random() * personas.length)];
  let r = Math.random() * totalW;
  for (const e of entries) {
    r -= e.w;
    if (r <= 0) return e.persona;
  }
  return entries[entries.length - 1].persona;
}

/* ═══════ OPS ═══════ */
export default function Ops({
  day, money, setMoney, prep, stock,
  customMenus, hiddenDefaultMenus, menuPrices, level, cityData,
  activePromotions, activeRivals, staff, reviewBonus,
  unlockedFeatures,
  onEnd, onEmergencyBuy, onEmergencyPrep,
  michelinPhase, michelinNextVisitDay, onMichelinVisit, audio,
  paused, triggerTutorial,
}) {
  const TABLES = getTablesForLevel(level || 1);
  const hdm = hiddenDefaultMenus || [];
  const allMenus = [...DEFAULT_MENUS, ...(customMenus || [])];
  const MENUS = day === 1
    ? allMenus.filter(m => m.id === 1)  /* Day1はマルゲリータのみ */
    : allMenus.filter(m => !m.hidden && m.active !== false && !hdm.includes(m.id));

  const [tick, setTick] = useState(0);
  const [spd, setSpd] = useState(1);
  const [custs, setCusts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [evts, setEvts] = useState(["☀️ 営業開始！"]);
  const [nServed, setNServed] = useState(0);
  const [rev, setRev] = useState(0);
  const [satLog, setSatLog] = useState([]);
  const [cooking, setCooking] = useState(null);
  const [tab, setTab] = useState("orders");
  const [pStock, setPStock] = useState({ dough: prep.dough, sauce: prep.sauce, ...prep.cuts });
  const [ingredientCost, setIngredientCost] = useState(0);
  const [autoKitchenTarget, setAutoKitchenTarget] = useState(null);
  const [totalArrivals, setTotalArrivals] = useState(0);
  // #107: 緊急仕入れ/仕込みモーダル（画面遷移ではなくオーバーレイ）
  const [showEmergencyModal, setShowEmergencyModal] = useState(null); // null | "marche" | "prep"
  const maxCustomers = day === 1 ? 3 : day === 2 ? 5 : day === 3 ? 7 : day === 4 ? 9 : Infinity;

  /* ─── game clock ─── */
  // #114: 営業時間調整 — 360tick=1時間（リアル36秒=ゲーム1時間、9時間営業=リアル約5.4分）
  const gH = 11 + Math.floor(tick / 360);
  const gM = Math.floor((tick % 360) / 6).toString().padStart(2, "0");
  const closing = gH >= 20;

  // #109: 24時で強制営業終了
  useEffect(() => {
    if (gH >= 24) {
      setCusts(pr => pr.map(c => ({ ...c, st: "gone" })));
      setOrders([]);
      setCooking(null);
      onEnd({ nServed, rev, satLog, pStock, ingredientCost, staffCost });
    }
  }, [gH]);

  /* ─── staff helpers ─── */
  const hallStaff = (staff || []).filter(s => s.type === "hall");
  const kitchenStaff = (staff || []).filter(s => s.type === "kitchen");
  const hasHallStaff = hallStaff.length > 0;
  const hasKitchenStaff = kitchenStaff.length > 0;
  const kitchenSkill = hasKitchenStaff
    ? Math.max(...kitchenStaff.map(s => s.skillLevel || 1))
    : 0;

  /* ─── staff cost for the day ─── */
  const staffCost = (staff || []).reduce((sum, s) => {
    const base = s.type === "hall" ? 3000 : 4000;
    return sum + base * (s.skillLevel || 1);
  }, 0);

  /* ─── arrival interval based on city + level ─── */
  /* #38: レベルが低いほど来店間隔を広げ、まったり遊べるようにする */
  const lvl = level || 1;
  const levelIntervalBase = lvl <= 3 ? 150 : lvl <= 6 ? 70 : lvl <= 9 ? 50 : 35;
  const baseInterval = Math.round(levelIntervalBase * (20 / (cityData?.baseCustomers || 18)));

  /* ─── promotion bonus: increases arrival chance ─── */
  const promotionBonus = (activePromotions || []).reduce((acc, p) => {
    const avg = ((p.effectMin || 0) + (p.effectMax || 0)) / 2;
    return acc + avg;
  }, 0);

  /* ─── rival penalty: decreases arrival chance ─── */
  const rivalPenalty = (activeRivals || []).reduce((acc, r) => acc + (r.customerSteal || 0), 0);

  /* ═══ Customer arrival ═══ */
  useEffect(() => {
    if (closing) return;
    if (totalArrivals >= maxCustomers) return;
    // #106: 最初の客は10秒(100tick)後、Day1-3は前の客に提供してから次が来る
    if (totalArrivals === 0 && tick < 100) return;
    // Day1: 1人ずつ対応。提供完了するまで次が来ない。完了したらすぐ来る
    if (day === 1 && totalArrivals > 0 && nServed < totalArrivals) return;
    // Day2-3: 提供完了待ち
    if (day >= 2 && day <= 3 && totalArrivals > 0 && nServed < totalArrivals) return;
    // Day1で提供完了直後 → baseInterval待たず即来店
    const day1Ready = day === 1 && totalArrivals > 0 && nServed >= totalArrivals;
    if (!day1Ready && tick > 0 && tick % baseInterval !== 0) return;
    {
      /* apply promotion/rival modifiers to arrival probability */
      const arrivalChance = clamp(1.0 + promotionBonus - rivalPenalty + (reviewBonus || 0), 0.1, 2.0);
      if (Math.random() > arrivalChance) return; /* customer scared off by rivals */

      const p = pickWeightedPersona(PERSONAS, cityData?.personas);
      // #138: ペルソナの許容価格帯でメニューをフィルタ（プレイヤー設定価格を使用）
      const [prLow, prHigh] = p.priceRange || [0, 9999];
      const sweetSpot = (prLow + prHigh) / 2;
      const affordableMenus = MENUS.filter(m => getMenuPrice(m, menuPrices) <= prHigh * 1.2);
      if (affordableMenus.length === 0) return; // メニューが全部高すぎ→来店しない
      const chosenMenu = affordableMenus[Math.floor(Math.random() * affordableMenus.length)];
      const menuPrice = getMenuPrice(chosenMenu, menuPrices);
      // #138: 価格帯による満足度調整（拡張版）
      const isSweetSpot = menuPrice >= sweetSpot * 0.9 && menuPrice <= sweetSpot * 1.1;
      const priceSatAdj = menuPrice < prLow ? 5
        : isSweetSpot ? 8
        : menuPrice <= prHigh ? 0
        : menuPrice <= prHigh * 1.1 ? -10
        : -25;
      if (priceSatAdj <= -25) {
        setEvts(pr => [`${p.icon}「高い...」`, ...pr.slice(0, 4)]);
      }
      /* #38: レベル別patience倍率 — 序盤はまったり、終盤は戦場 */
      const patienceMul = lvl <= 3 ? 1.7 : lvl <= 6 ? 1.3 : 1.0;
      const nc = {
        id: ++gid, ...p,
        patience: Math.round(p.patience * patienceMul) + (lvl <= 3 ? 50 : 0),
        st: "approach", timer: 0, tbl: null,
        sat: 60 + Math.floor(Math.random() * 30) + priceSatAdj,
        mid: chosenMenu.id,
        el: 0,
        sweetSpot: isSweetSpot, // #138: チップ判定用
      };
      setCusts(pr => [...pr, nc]);
      setTotalArrivals(t => {
        // #145: 初客チュートリアル
        if (t === 0 && triggerTutorial) triggerTutorial("ops_first_customer");
        return t + 1;
      });
      setEvts(pr => [`${p.icon}${p.name}(${p.tag})が来た`, ...pr.slice(0, 4)]);
    }

    // Michelin inspector: arrives once on the scheduled day
    if (michelinPhase && day === michelinNextVisitDay && tick > 0 && tick === baseInterval * 3) {
      const inspector = {
        id: ++gid,
        icon: "🎩", name: "ミシュラン調査員", tag: "覆面調査",
        patience: 400, oTime: 15, eTime: 60,
        st: "approach", timer: 0, tbl: null,
        sat: 70 + Math.floor(Math.random() * 20),
        mid: MENUS[Math.floor(Math.random() * MENUS.length)].id,
        el: 0,
        isMichelinInspector: true,
      };
      setCusts(pr => [...pr, inspector]);
      setEvts(pr => ["🎩 特別なお客様が来店...", ...pr.slice(0, 4)]);
    }
  }, [tick, closing]);

  /* ═══ Main simulation tick ═══ */
  useEffect(() => {
    const iv = setInterval(() => {
      if (paused) return; // #145: チュートリアルmodal表示中は停止
      setTick(t => t + spd);
      setCusts(prev => {
        const occ = prev.filter(c => c.tbl !== null && c.st !== "gone").map(c => c.tbl);
        return prev.map(c => {
          if (c.st === "gone") return c;
          const n = { ...c, timer: c.timer + spd };
          switch (c.st) {
            case "approach":
              if (n.timer > 28) {
                const fr = TABLES.filter(t => !occ.includes(t.id));
                if (fr.length > 0) { n.tbl = fr[0].id; n.st = "seat"; n.timer = 0; }
                else { n.st = "waiting_outside"; n.timer = 0; } /* BUG-05: queue instead of gone */
              }
              break;
            /* BUG-05: waiting queue outside */
            case "waiting_outside": {
              n.el = (c.el || 0) + spd;
              /* consume 30-50% of patience while waiting */
              if (n.el > c.patience * 0.4) {
                n.st = "gone"; n.tbl = null;
                setEvts(pr => [`😞 ${c.icon}${c.name}が待ちきれず帰った`, ...pr.slice(0, 4)]);
              } else {
                /* check if a table freed up */
                const fr2 = TABLES.filter(t => !occ.includes(t.id));
                if (fr2.length > 0) { n.tbl = fr2[0].id; n.st = "seat"; n.timer = 0; }
              }
              break;
            }
            case "seat":
              if (n.timer > c.oTime) { n.st = "order"; n.timer = 0; }
              break;
            case "order":
              if (n.timer > 18) { n.st = "wait"; n.timer = 0; n.el = 0; }
              break;
            /* FEAT-02: customer leaves when patience exceeded */
            case "wait":
              n.el = (c.el || 0) + spd;
              if (n.el > c.patience) {
                n.st = "leave"; n.timer = 0; n.tbl = null;
                n.sat = Math.max(0, n.sat - 40);
                setOrders(prev => prev.filter(o => o.id !== c.id));
                // #90: 調理中の注文もキャンセル
                setCooking(prev => prev?.id === c.id ? null : prev);
                setAutoKitchenTarget(prev => prev === c.id ? null : prev);
                setEvts(pr => [`😤 ${c.icon}${c.name}が怒って帰った！`, ...pr.slice(0, 4)]);
              } else if (n.el > c.patience * 0.5) {
                n.sat = Math.max(10, n.sat - 2);
              }
              break;
            case "eat":
              if (n.timer > c.eTime) { n.st = "pay"; n.timer = 0; }
              break;
            case "pay":
              if (n.timer > 8) { n.st = "leave"; n.timer = 0; n.tbl = null; }
              break;
            case "leave":
              if (n.timer > 12) n.st = "gone";
              break;
          }
          return n;
        });
      });
    }, 100);
    return () => clearInterval(iv);
  }, [spd]);

  /* ═══ Order creation when customer enters "wait" state ═══ */
  useEffect(() => {
    custs.forEach(c => {
      if (c.st === "wait" && c.timer < 2 && !orders.find(o => o.id === c.id)) {
        const m = MENUS.find(mm => mm.id === c.mid) || MENUS[0];
        setOrders(pr => [...pr, {
          id: c.id, icon: c.icon, name: c.name, tag: c.tag,
          menuId: c.mid, menuName: m.name, patience: c.patience, elapsed: 0,
        }]);
        setEvts(pr => [`🎫${c.icon}が${m.name}を注文`, ...pr.slice(0, 4)]);
      }
    });
  }, [custs]);

  /* ═══ Order elapsed timer — synced with customer.el (#89) ═══ */
  useEffect(() => {
    const iv = setInterval(() => {
      setOrders(pr => pr.map(o => {
        const cust = custs.find(c => c.id === o.id);
        return { ...o, elapsed: cust?.el || (o.elapsed + spd) };
      }));
    }, 100);
    return () => clearInterval(iv);
  }, [spd, custs]);

  /* ═══ Payment processing when customer enters "pay" state ═══ */
  useEffect(() => {
    custs.forEach(c => {
      if (c.st === "pay" && c.timer < 2) {
        const m = MENUS.find(mm => mm.id === c.mid) || MENUS[0];

        /* #138: プレイヤー設定価格を使用 */
        let price = getMenuPrice(m, menuPrices);
        (activePromotions || []).forEach(p => {
          if (p.priceReduction) {
            if (!p.targetPersona || p.targetPersona === c.name) {
              price = Math.round(price * (1 - p.priceReduction));
            }
          }
        });

        // #138: スイートスポットならチップ10%
        const tip = c.sweetSpot ? Math.round(price * 0.1) : 0;
        const totalPay = price + tip;
        setMoney(mm => mm + totalPay);
        setRev(r => r + totalPay);
        setNServed(s => s + 1);
        setSatLog(pr => [...pr, { icon: c.icon, name: c.name, tag: c.tag, sat: c.sat }]);
        const tipText = tip > 0 ? `(+チップ¥${tip})` : "";
        setEvts(pr => [`💰+¥${price}${tipText} ${c.icon}${c.sat > 70 ? "😊" : "😐"}`, ...pr.slice(0, 4)]);

        if (c.isMichelinInspector && onMichelinVisit) {
          onMichelinVisit(c.sat);
        }
      }
    });
  }, [custs]);

  /* ═══ Serve (complete cooking) ═══ */
  /* #139: scoreData = {score, bakeScore, recipeScore, bakeQuality} or number (auto-cook) */
  const serve = (oid, scoreData) => {
    // #90: 離脱済みの客には提供しない
    const cust = custs.find(c => c.id === oid);
    if (!cust || cust.st === "leave" || cust.st === "gone") {
      setCooking(null);
      setAutoKitchenTarget(null);
      setEvts(pr => ["🗑️ 注文キャンセル（お客が帰りました）", ...pr.slice(0, 4)]);
      return;
    }
    const m = MENUS.find(mm => mm.id === cust.mid) || MENUS[0];

    // #139: 3層フィードバック — 満足度を焼き40% + トッピング30% + 待ち時間20% + 価格10% で合成
    let finalSat;
    if (typeof scoreData === "number") {
      // auto-cook (kitchen staff): use simple formula
      finalSat = clamp(Math.round(scoreData * 0.7 + cust.sat * 0.3), 0, 100);
    } else {
      const { bakeScore, recipeScore } = scoreData;
      const bakeComponent = (bakeScore / 30) * 40;             // 0-40
      const toppingComponent = (recipeScore / 70) * 30;        // 0-30
      const waitRatio = clamp(1 - (cust.el || 0) / (cust.patience || 300), 0, 1);
      const waitComponent = waitRatio * 20;                     // 0-20
      const priceSatBase = cust.sat - 60; // initial priceSatAdj baked into cust.sat
      const priceComponent = clamp(5 + priceSatBase * 0.2, 0, 10); // 0-10
      finalSat = clamp(Math.round(bakeComponent + toppingComponent + waitComponent + priceComponent), 0, 100);
    }

    const satBreakdown = typeof scoreData === "object" ? scoreData : null;
    setCusts(pr => pr.map(c =>
      c.id === oid
        ? { ...c, st: "eat", timer: 0, sat: finalSat,
            reaction: finalSat > 70 ? EMO.faceHappy : finalSat > 50 ? EMO.heart : null,
            reactionSize: finalSat >= 90 ? "huge" : "normal" }
        : c
    ));
    setTimeout(() => setCusts(pr => pr.map(c => c.id === oid ? { ...c, reaction: null } : c)), 1500);
    setOrders(pr => pr.filter(o => o.id !== oid));
    setPStock(pr => ({ ...pr, dough: Math.max(0, (pr.dough || 0) - 1), sauce: Math.max(0, (pr.sauce || 0) - 1) }));
    setIngredientCost(pr => pr + (m.cost || 0));
    setEvts(pr => ["🍕提供完了！", ...pr.slice(0, 4)]);
    audio?.playSe(SFX2.serve);
    // #145: 初提供チュートリアル
    if (triggerTutorial && nServed === 0) setTimeout(() => triggerTutorial("ops_first_serve"), 500);
    setCooking(null);
    setAutoKitchenTarget(null);
  };

  /* ═══ Hall staff auto-serve: when cooking completes, auto-serve (skip manual tap) ═══ */
  /* This is handled by the Cooking component callback — hall staff just makes serve instant */

  /* ═══ Kitchen staff auto-cook: auto-process one order at a time ═══ */
  useEffect(() => {
    if (!hasKitchenStaff || cooking || autoKitchenTarget) return;
    if (orders.length === 0) return;

    /* pick the most urgent order */
    const sorted = [...orders].sort((a, b) => (b.elapsed / b.patience) - (a.elapsed / a.patience));
    const target = sorted[0];
    if (!target) return;

    setAutoKitchenTarget(target);

    /* auto-cook with reduced quality based on skill */
    const baseScore = 30 + kitchenSkill * 10; /* skill 1→40, 5→80 */
    const score = clamp(baseScore + Math.floor(Math.random() * 15), 20, 85);
    const cookTime = Math.max(800, 2500 - kitchenSkill * 300); /* faster with higher skill */

    const timer = setTimeout(() => {
      serve(target.id, score);
      setEvts(pr => [`🤖 キッチンスタッフが${target.menuName}を自動調理(${score}点)`, ...pr.slice(0, 4)]);
    }, cookTime);

    return () => clearTimeout(timer);
  }, [orders, cooking, autoKitchenTarget, hasKitchenStaff]);

  /* ═══ Fast-forward (skip to closing) ═══ */
  const handleFastForward = () => {
    setSpd(10);
    setEvts(pr => ["⏩ 閉店まで早送り中...", ...pr.slice(0, 4)]);
  };

  const active = custs.filter(c => c.st !== "gone");

  /* BUG-03: cooking is now rendered inside the lower-half tab, not fullscreen */
  /* #139: score is now {score, bakeScore, recipeScore, bakeQuality} or number */
  const handleCookDone = (scoreData) => {
    serve(cooking.id, scoreData);
  };

  /* ═══ RENDER ═══ */
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: V.walnut }}>

      {/* ─── Top: Status Bar ─── */}
      <div style={{
        background: `linear-gradient(180deg,#4A2A15,${V.walnutDk})`, padding: "3px 6px",
        display: "flex", alignItems: "center", gap: 4,
        borderBottom: `2px solid ${V.birch}`, flexShrink: 0,
      }}>
        <span style={{ fontFamily: F.b, color: V.oil, fontSize: 12, fontWeight: "bold" }}>Day{day}</span>
        <span style={{ fontFamily: F.b, color: "#FFF", fontSize: 12 }}>💰¥{money.toLocaleString()}</span>
        <span style={{ fontFamily: F.b, color: "#FFF", fontSize: 12 }}>⏱{gH}:{gM}</span>
        {hasKitchenStaff && (
          <span style={{ fontFamily: F.b, color: V.oil, fontSize: 11 }}>🤖自動</span>
        )}
        <div style={{ marginLeft: "auto", marginRight: 34, display: "flex", gap: 2 }}>
          {[1, 2, 3].map(s => (
            <button key={s} onClick={() => setSpd(s)} style={{
              background: spd === s ? V.terra : "transparent",
              color: "#FFF", border: `1px solid ${V.birch}`,
              borderRadius: 3, padding: "0 4px", fontSize: 11,
              fontFamily: F.b, cursor: "pointer",
            }}>{"▶".repeat(s)}</button>
          ))}
        </div>
      </div>

      {/* ─── Prep stock display ─── */}
      <div style={{
        background: "#FFFDE7", padding: "1px 6px",
        borderBottom: "1px solid #EEE", flexShrink: 0,
        fontFamily: F.b, fontSize: 11, color: "#888",
      }}>
        残り: 🫓{pStock.dough}枚 🍅{pStock.sauce}食分 🧀{pStock.mozz_block||0} 🥩{pStock.salami_log||0} 🦐{pStock.shrimp_pack||0} 🫒{pStock.olive_jar||0}
        {(staff || []).length > 0 && (
          <span style={{ marginLeft: 8 }}>
            👥スタッフ: {hallStaff.length > 0 ? `ホール${hallStaff.length}` : ""}
            {kitchenStaff.length > 0 ? ` 厨房${kitchenStaff.length}` : ""}
          </span>
        )}
      </div>

      {/* ─── Shop floor view ─── */}
      <div style={{
        height: "25%", position: "relative", overflow: "hidden", flexShrink: 0,
        background: `repeating-conic-gradient(${V.flour} 0% 25%,#EDD9BD 0% 50%) 0 0/24px 24px`,
        borderLeft: `4px solid ${V.walnut}`, borderRight: `4px solid ${V.walnut}`,
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: V.walnut, zIndex: 1 }} />

        {/* Door */}
        <div style={{
          position: "absolute", right: 0, top: "25%", width: 20, height: 45, zIndex: 2,
          background: "linear-gradient(180deg,#8B6040,#6B4020)",
          border: `2px solid ${V.walnut}`, borderRight: "none",
          borderRadius: "6px 0 0 6px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 14 }}>🚪</span>
        </div>

        {/* Tables */}
        {TABLES.map(t => {
          const o = active.find(c => c.tbl === t.id);
          return (
            <div key={t.id} style={{
              position: "absolute", left: t.x, top: t.y, width: t.w, height: t.h,
              background: "linear-gradient(135deg,#C0813A,#A06A2E)", borderRadius: 4,
              border: `1.5px solid ${o ? "#7A4A18" : "#B8956A"}`, zIndex: 1,
            }}>
              {o?.st === "eat" && (
                <div style={{ position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)", fontSize: 14 }}>🍕</div>
              )}
            </div>
          );
        })}

        {/* BUG-05: Waiting queue outside shop */}
        {(() => {
          const waiting = active.filter(c => c.st === "waiting_outside");
          if (waiting.length === 0) return null;
          return (
            <div style={{
              position: "absolute", right: 24, top: 4, zIndex: 5,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
            }}>
              <div style={{ fontFamily: F.b, fontSize: 10, color: V.terra, background: "rgba(255,255,255,.8)",
                borderRadius: 4, padding: "1px 3px" }}>待ち{waiting.length}人</div>
              {waiting.slice(0, 6).map(c => (
                <div key={c.id} style={{ fontSize: 14 }}>{c.icon}</div>
              ))}
            </div>
          );
        })()}

        {/* Customers */}
        {active.filter(c => c.st !== "waiting_outside").map(c => {
          const t = c.tbl != null ? TABLES.find(tb => tb.id === c.tbl) : null;
          let cx, cy;
          /* #66: approach — 右端から滑らかに歩いてくる */
          if (c.st === "approach") {
            const progress = Math.min(1, c.timer / 28); // 0→1 over 28 ticks
            cx = 340 - progress * 80; // 340→260
            cy = 35;
          }
          else if (c.st === "leave") { cx = 340; cy = 35; }  /* ドアから退出 */
          else if (t) { cx = t.x + t.w / 2 - 7; cy = t.y - 2; }
          else { cx = 260; cy = 35; }
          return (
            <div key={c.id} style={{
              position: "absolute", left: cx, top: cy, zIndex: 3,
              transition: "left 1.8s ease-in-out, top 1.8s ease-in-out",
            }}>
              <div style={{
                fontSize: 14,
                ...(c.isMichelinInspector ? { animation: "pulse 2s infinite", filter: "drop-shadow(0 0 4px gold)" } : {})
              }}>{c.icon}</div>
              {/* Emote bubble (image-based) */}
              {(() => {
                const isAngry = c.st === "wait" && (c.el || 0) > c.patience * .5;
                const emoteSrc =
                  c.st === "approach" ? null
                  : c.st === "seat" ? EMO.question
                  : c.st === "order" ? EMO.dots
                  : c.st === "wait" ? (isAngry ? EMO.anger : EMO.exclamation)
                  : c.st === "eat" ? (c.sat > 50 ? EMO.music : null)
                  : c.st === "pay" ? EMO.cash
                  : null;
                return emoteSrc ? (
                  <div style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    zIndex: 10, pointerEvents: "none",
                  }}>
                    <Emo src={emoteSrc} size={48} />
                  </div>
                ) : null;
              })()}
              {/* Reaction on serve (image-based) */}
              {c.reaction && (
                <div style={{
                  position: "absolute", top: -26, left: "50%", transform: "translateX(-50%)",
                  zIndex: 11, pointerEvents: "none",
                  animation: "floatUp 1.5s ease-out forwards",
                }}>
                  <Emo src={c.reactionSize === "huge" ? EMO.heart : c.reaction}
                    size={c.reactionSize === "huge" ? 80 : 56} />
                </div>
              )}
            </div>
          );
        })}

        {/* Kitchen bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 18,
          background: "linear-gradient(0deg,#D4D4D4,#C0813A)",
          borderTop: `2px solid ${V.walnut}`, zIndex: 1,
          display: "flex", alignItems: "center", padding: "0 5px", gap: 2,
        }}>
          <span style={{ fontSize: 12 }}>👨‍🍳</span>
          <span style={{ fontSize: 12 }}>👩‍🍳</span>
          <span style={{ fontFamily: F.b, fontSize: 10, color: V.walnut }}>KITCHEN</span>
          {hasKitchenStaff && autoKitchenTarget && (
            <span style={{ fontFamily: F.b, fontSize: 10, color: V.terra, marginLeft: 4 }}>
              🔥{autoKitchenTarget.menuName}調理中...
            </span>
          )}
        </div>
      </div>

      {/* ─── Event feed ─── */}
      <div style={{
        background: `linear-gradient(90deg,${V.walnutDk},${V.walnut})`, padding: "1px 6px",
        display: "flex", alignItems: "center", gap: 3, flexShrink: 0,
      }}>
        <span style={{ fontSize: 11 }}>📢</span>
        <div style={{
          fontFamily: F.b, color: V.mozz, fontSize: 10,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1,
        }}>{evts[0]}</div>
      </div>

      {/* ─── Tabs area (orders / cooking / info) — BUG-03: cooking in lower half ─── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: V.mozz, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: `2px solid ${V.birch}`, flexShrink: 0 }}>
          {[
            { id: "orders", l: `🎫(${orders.length})` },
            ...(cooking ? [{ id: "cooking", l: "🍕 調理" }] : []),
            { id: "info", l: "🔪 仕込み" },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); audio?.playSe(SFX.toggle); }} style={{
              flex: 1, padding: "3px", fontFamily: F.b, fontSize: 13, fontWeight: "bold",
              border: "none", cursor: "pointer",
              background: tab === t.id ? "#FFF" : "#F5F0E5",
              color: tab === t.id ? V.terra : "#999",
              borderBottom: tab === t.id ? `2px solid ${V.terra}` : "2px solid transparent",
            }}>{t.l}</button>
          ))}
        </div>

        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          overflow: tab === "cooking" ? "hidden" : "auto",
          padding: tab === "cooking" ? 0 : "3px 8px",
        }}>
          {tab === "orders" && (
            <>
              {orders.length === 0
                ? <div style={{ fontFamily: F.b, fontSize: 13, color: "#BBB", textAlign: "center", marginTop: 10 }}>
                    注文を待っています...
                  </div>
                : orders.map(o => {
                    const pct = clamp(100 - o.elapsed / o.patience * 100, 0, 100);
                    const urg = pct < 30 ? "urgent" : pct < 60 ? "warn" : "ok";
                    return (
                      <div key={o.id} onClick={() => { if (!hasKitchenStaff) { setCooking(o); setTab("cooking"); if (triggerTutorial && nServed === 0) triggerTutorial("ops_cooking_intro"); } }}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "4px 5px", marginBottom: 2, borderRadius: 7,
                          background: urg === "urgent" ? "#FFF0F0" : urg === "warn" ? "#FFFDE7" : "#FFF",
                          border: `1.5px solid ${urg === "urgent" ? V.terra : urg === "warn" ? V.oil : "#EEE"}`,
                          cursor: hasKitchenStaff ? "default" : "pointer",
                          opacity: hasKitchenStaff && autoKitchenTarget?.id === o.id ? 0.5 : 1,
                        }}>
                        <span style={{ fontSize: 14 }}>{o.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: F.b, fontSize: 14, fontWeight: "bold", color: V.esp }}>
                            {o.menuName}
                            {hasKitchenStaff && autoKitchenTarget?.id === o.id && (
                              <span style={{ fontSize: 11, color: V.terra, marginLeft: 4 }}>🔥調理中</span>
                            )}
                          </div>
                          {/* #17: メニュー名のみ表示。ペルソナ名/タグは非表示 */}
                        </div>
                        <div style={{ width: 40, height: 4, background: "#EEE", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{
                            width: `${pct}%`, height: "100%", borderRadius: 2,
                            background: urg === "urgent" ? V.terra : urg === "warn" ? V.oil : V.basil,
                          }} />
                        </div>
                        {!hasKitchenStaff && (
                          <span style={{ fontFamily: F.b, fontSize: 13, color: V.terra }}>→</span>
                        )}
                      </div>
                    );
                  })
              }
            </>
          )}

          {/* BUG-03: Cooking rendered inside lower-half tab — flex:1 fills remaining height */}
          {/* #130: Cookingをvisibility制御でアンマウントしない */}
          {cooking && (
            <div style={{
              flex: 1, display: tab === "cooking" ? "flex" : "none",
              flexDirection: "column", minHeight: 0,
            }}>
              <Cooking
                key={cooking.id}
                order={{...cooking, elapsed: orders.find(o => o.id === cooking.id)?.elapsed ?? cooking.elapsed}}
                prepStock={pStock}
                onConsumeCuts={(key) => setPStock(pr => ({...pr, [key]: Math.max(0, (pr[key]||0) - 1)}))}
                onDone={(score) => { handleCookDone(score); setTab("orders"); }}
                onBack={() => { setCooking(null); setTab("orders"); }}
                unlockedFeatures={unlockedFeatures}
                customMenus={customMenus}
                audio={audio}
                compact
              />
            </div>
          )}

          {tab === "info" && (
            <div>
              {/* 仕込み残量 */}
              <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: "bold", color: V.esp, marginBottom: 3 }}>🔪 仕込み残量</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, marginBottom: 6 }}>
                {[
                  { l: "生地", v: `${pStock.dough}枚`, i: "🫓", warn: pStock.dough <= 2 },
                  { l: "ソース", v: `${pStock.sauce}食`, i: "🍅", warn: pStock.sauce <= 2 },
                  { l: "チーズ", v: `${pStock.mozz_block || 0}`, i: "🧀" },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: s.warn ? "#FFF3E0" : "#FFF", borderRadius: 6, padding: "3px", textAlign: "center",
                    border: `1px solid ${s.warn ? V.terra : V.birch}`,
                  }}>
                    <div style={{ fontSize: 13 }}>{s.i}</div>
                    <div style={{ fontFamily: F.b, fontSize: 13, fontWeight: "bold", color: s.warn ? V.terra : V.esp }}>{s.v}</div>
                    <div style={{ fontFamily: F.b, fontSize: 10, color: "#888" }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {/* #107: 緊急仕入れ/仕込みボタン（モーダル表��） */}
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                <Btn onClick={() => setShowEmergencyModal("marche")} color="sec" style={{ flex: 1, fontSize: 12, padding: "5px" }}>🏪 緊急仕入れ</Btn>
                <Btn onClick={() => setShowEmergencyModal("prep")} color="sec" style={{ flex: 1, fontSize: 12, padding: "5px" }}>🔪 追加仕込み</Btn>
              </div>
              {/* 営業情報 */}
              <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: "bold", color: V.esp, marginBottom: 3 }}>📊 営業情報</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
                {[
                  { l: "提供", v: `${nServed}`, i: "🍕" },
                  { l: "売上", v: `¥${rev.toLocaleString()}`, i: "💰" },
                  { l: "客数", v: `${active.length}人`, i: "🧑‍🤝‍🧑" },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: "#FFF", borderRadius: 6, padding: "3px", textAlign: "center",
                    border: `1px solid ${V.birch}`,
                  }}>
                    <div style={{ fontSize: 13 }}>{s.i}</div>
                    <div style={{ fontFamily: F.b, fontSize: 13, fontWeight: "bold", color: V.esp }}>{s.v}</div>
                    <div style={{ fontFamily: F.b, fontSize: 10, color: "#888" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom action area ─── */}
      <div style={{
        padding: "3px 8px 5px",
        paddingBottom: "max(5px, env(safe-area-inset-bottom))",
        borderTop: `3px solid ${V.oil}`,
        background: `linear-gradient(180deg,#4A2A15,#2D1A0E)`,
        flexShrink: 0,
      }}>
        {/* #108/#129: 営業終了 — 20時以降 OR 全客対応済み＆全客退店済み */}
        {(() => {
          const allGone = custs.length > 0 && custs.every(c => c.st === "gone" || c.st === "leave");
          const allServed = totalArrivals >= maxCustomers && orders.length === 0 && allGone;
          const canClose = closing || allServed;
          if (canClose) return (
            <>
              {orders.length === 0 && allGone ? (
                <Btn onClick={() => onEnd({ nServed, rev, satLog, pStock, ingredientCost, staffCost })} color="grape" style={{ padding: "7px" }}>
                  🌙 営業終了
                </Btn>
              ) : (
                <Btn disabled color="sec" style={{ padding: "7px", opacity: 0.5 }}>
                  🌙 お客様の退店を待っています...
                </Btn>
              )}
            </>
          );
          return (
          <>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {/* 早送り: 注文なし＆18時以降 */}
              {orders.length === 0 && gH >= 18 && (
                <Btn onClick={handleFastForward} color="sec" style={{ flex: 1, padding: "5px" }}>
                  ⏩ 早送り
                </Btn>
              )}
            </div>
            <div style={{ fontFamily: F.b, fontSize: 13, color: "#888", textAlign: "center" }}>
              {hasKitchenStaff ? "🤖 スタッフが自動調理中" : "注文をタップ → 調理！"}
            </div>
          </>
          );
        })()}
      </div>

      {/* #107: 緊急仕入れ/仕込みモーダル��営業���裏で継続） */}
      {showEmergencyModal && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 500,
          background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: V.flour, borderRadius: 14, padding: "12px 16px",
            width: 320, maxWidth: "90%", maxHeight: "80vh", overflowY: "auto",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}>
            {showEmergencyModal === "prep" ? (
              /* #142: 通常仕込みと同じUIをモーダル内で表示 */
              <Prep modal stock={stock} level={level || 1}
                unlockedFeatures={unlockedFeatures}
                onDone={(pd) => {
                  setPStock(pr => {
                    const ns = { ...pr };
                    if (pd.dough) ns.dough = (ns.dough || 0) + pd.dough;
                    if (pd.sauce) ns.sauce = (ns.sauce || 0) + pd.sauce;
                    Object.entries(pd.cuts || {}).forEach(([k, v]) => { ns[k] = (ns[k] || 0) + v; });
                    return ns;
                  });
                  setShowEmergencyModal(null);
                }}
                onBackToMarche={() => setShowEmergencyModal("marche")}
              />
            ) : (
              /* 簡易仕入れモーダル */
              <div>
                <div style={{ fontFamily: F.b, fontSize: 14, fontWeight: "bold", color: V.esp, marginBottom: 8 }}>
                  🏪 緊急仕入れ（割増価格）
                </div>
                <div style={{ fontFamily: F.b, fontSize: 11, color: V.terra, marginBottom: 8 }}>
                  ⚠️ 通常の1.5倍の価格���す
                </div>
                <Btn onClick={() => {
                  if (onEmergencyBuy) onEmergencyBuy();
                  setShowEmergencyModal(null);
                }} style={{ marginBottom: 4 }}>🏪 仕入れ画��へ</Btn>
                <Btn onClick={() => setShowEmergencyModal(null)} color="sec">閉じる</Btn>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* #142: EmergencyPrepModal は削除済み — <Prep modal> で代替 */
