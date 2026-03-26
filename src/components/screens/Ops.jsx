import { useState, useEffect } from "react";
import { F, V, clamp } from "../../config/design.js";
import { PERSONAS } from "../../config/personas.js";
import { DEFAULT_MENUS } from "../../config/menus.js";
import { getTablesForLevel } from "../../config/tables.js";
import Btn from "../shared/Btn.jsx";
import Cooking from "./Cooking.jsx";

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
  day, money, setMoney, prep,
  customMenus, hiddenDefaultMenus, level, cityData,
  activePromotions, activeRivals, staff,
  unlockedFeatures,
  onEnd, onEmergencyBuy, onEmergencyPrep,
  michelinPhase, michelinNextVisitDay, onMichelinVisit,
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
  const maxCustomers = day === 1 ? 3 : day === 2 ? 5 : day === 3 ? 7 : day === 4 ? 9 : Infinity;

  /* ─── game clock ─── */
  const gH = 11 + Math.floor(tick / 180);
  const gM = Math.floor((tick % 180) / 3).toString().padStart(2, "0");
  const closing = gH >= 21;

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
  const levelIntervalBase = lvl <= 3 ? 90 : lvl <= 6 ? 70 : lvl <= 9 ? 50 : 35;
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
    if (tick > 0 && tick % baseInterval === 0) {
      /* apply promotion/rival modifiers to arrival probability */
      const arrivalChance = clamp(1.0 + promotionBonus - rivalPenalty, 0.1, 2.0);
      if (Math.random() > arrivalChance) return; /* customer scared off by rivals */

      const p = pickWeightedPersona(PERSONAS, cityData?.personas);
      /* #38: レベル別patience倍率 — 序盤はまったり、終盤は戦場 */
      const patienceMul = lvl <= 3 ? 1.7 : lvl <= 6 ? 1.3 : 1.0;
      const nc = {
        id: ++gid, ...p,
        patience: Math.round(p.patience * patienceMul),
        st: "approach", timer: 0, tbl: null,
        sat: 60 + Math.floor(Math.random() * 30),
        mid: MENUS[Math.floor(Math.random() * MENUS.length)].id,
        el: 0,
      };
      setCusts(pr => [...pr, nc]);
      setTotalArrivals(t => t + 1);
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

  /* ═══ Order elapsed timer ═══ */
  useEffect(() => {
    const iv = setInterval(() => {
      setOrders(pr => pr.map(o => ({ ...o, elapsed: o.elapsed + spd })));
    }, 100);
    return () => clearInterval(iv);
  }, [spd]);

  /* ═══ Payment processing when customer enters "pay" state ═══ */
  useEffect(() => {
    custs.forEach(c => {
      if (c.st === "pay" && c.timer < 2) {
        const m = MENUS.find(mm => mm.id === c.mid) || MENUS[0];

        /* apply price reduction from promotions if applicable */
        let price = m.price;
        (activePromotions || []).forEach(p => {
          if (p.priceReduction) {
            if (!p.targetPersona || p.targetPersona === c.name) {
              price = Math.round(price * (1 - p.priceReduction));
            }
          }
        });

        setMoney(mm => mm + price);
        setRev(r => r + price);
        setNServed(s => s + 1);
        setSatLog(pr => [...pr, { icon: c.icon, name: c.name, tag: c.tag, sat: c.sat }]);
        setEvts(pr => [`💰+¥${price} ${c.icon}${c.sat > 70 ? "😊" : "😐"}`, ...pr.slice(0, 4)]);

        if (c.isMichelinInspector && onMichelinVisit) {
          onMichelinVisit(c.sat);
        }
      }
    });
  }, [custs]);

  /* ═══ Serve (complete cooking) ═══ */
  const serve = (oid, score) => {
    const m = MENUS.find(mm => mm.id === (custs.find(c => c.id === oid)?.mid)) || MENUS[0];
    setCusts(pr => pr.map(c =>
      c.id === oid
        ? { ...c, st: "eat", timer: 0, sat: clamp(c.sat + (score > 70 ? 15 : score > 50 ? 5 : -10), 0, 100),
            reaction: score > 70 ? "😋美味しい！" : score > 50 ? "😊ありがとう" : "😐うーん…" }
        : c
    ));
    setTimeout(() => setCusts(pr => pr.map(c => c.id === oid ? { ...c, reaction: null } : c)), 1500);
    setOrders(pr => pr.filter(o => o.id !== oid));
    setPStock(pr => ({ ...pr, dough: Math.max(0, (pr.dough || 0) - 1), sauce: Math.max(0, (pr.sauce || 0) - 1) }));
    setIngredientCost(pr => pr + (m.cost || 0));
    setEvts(pr => ["🍕提供完了！", ...pr.slice(0, 4)]);
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
  const handleCookDone = (score) => {
    serve(cooking.id, score);
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
        <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
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
          if (c.st === "approach" && c.timer <= 2) { cx = 320; cy = 35; }  /* 画面外からスタート */
          else if (c.st === "approach") { cx = 260; cy = 35; }  /* ドア前に移動 */
          else if (c.st === "leave") { cx = 320; cy = 35; }  /* ドアから退出 */
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
              {["approach", "seat", "order", "wait", "eat", "pay"].includes(c.st) && (
                <div style={{
                  position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                  background: "#FFF",
                  border: `1px solid ${c.st === "wait" && (c.el || 0) > c.patience * .5 ? V.terra : V.birch}`,
                  borderRadius: 4, padding: "0 2px",
                  fontFamily: F.b, fontSize: 10, whiteSpace: "nowrap", zIndex: 10,
                }}>
                  {c.st === "approach" ? "👀"
                    : c.st === "seat" ? "📖"
                    : c.st === "order" ? "🤔"
                    : c.st === "wait" ? ((c.el || 0) > c.patience * .5 ? "😤" : "⏱")
                    : c.st === "eat" ? "😋"
                    : "💰"}
                </div>
              )}
              {c.reaction && (
                <div style={{
                  position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
                  background: "#FFFDE7", border: `1px solid ${V.oil}`,
                  borderRadius: 6, padding: "1px 4px",
                  fontFamily: F.b, fontSize: 9, whiteSpace: "nowrap", zIndex: 11,
                  animation: "fadeInUp 0.3s ease-out",
                }}>
                  {c.reaction}
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
            { id: "info", l: "📊" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
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
                      <div key={o.id} onClick={() => { if (!hasKitchenStaff) { setCooking(o); setTab("cooking"); } }}
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
          {tab === "cooking" && cooking && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              {(() => {
                const liveOrder = orders.find(o => o.id === cooking.id);
                return <Cooking
                  order={{...cooking, elapsed: liveOrder?.elapsed ?? cooking.elapsed}} prepStock={pStock}
                  onConsumeCuts={(key) => setPStock(pr => ({...pr, [key]: Math.max(0, (pr[key]||0) - 1)}))}
                  onDone={(score) => { handleCookDone(score); setTab("orders"); }}
                  onBack={() => { setCooking(null); setTab("orders"); }}
                  unlockedFeatures={unlockedFeatures}
                  compact
                />;
              })()}
            </div>
          )}

          {tab === "info" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, padding: "4px 0" }}>
              {[
                { l: "提供", v: `${nServed}`, i: "🍕" },
                { l: "売上", v: `¥${rev.toLocaleString()}`, i: "💰" },
                { l: "生地残", v: `${pStock.dough}枚`, i: "🫓" },
                { l: "材料費", v: `¥${ingredientCost.toLocaleString()}`, i: "📦" },
                { l: "人件費", v: `¥${staffCost.toLocaleString()}`, i: "👥" },
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
        {closing && orders.length === 0 ? (
          <Btn onClick={() => onEnd({ nServed, rev, satLog, pStock, ingredientCost, staffCost })} color="grape" style={{ padding: "7px" }}>
            🌙 営業終了
          </Btn>
        ) : (
          <>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {/* FEAT-03: Skip / end early buttons */}
              {orders.length === 0 && gH >= 18 && !closing && (
                <Btn onClick={handleFastForward} color="sec" style={{ flex: 1, padding: "5px" }}>
                  ⏩ 早送り
                </Btn>
              )}
              {/* FEAT-03: Force close button — cancels remaining orders */}
              {!closing && gH >= 14 && (
                <Btn onClick={() => {
                  setOrders([]);
                  setCusts(pr => pr.map(c => {
                    if (c.st === "wait" || c.st === "order") return { ...c, st: "leave", timer: 0, tbl: null };
                    if (c.st === "eat" || c.st === "pay") return { ...c, st: "pay", timer: 6 };
                    return c;
                  }));
                  setTick(180 * 10);
                }} color="grape" style={{ flex: 1, padding: "5px" }}>
                  🌙 営業終了
                </Btn>
              )}
              {/* Emergency buy/prep buttons */}
              {(pStock.dough <= 2 || pStock.sauce <= 2) && onEmergencyBuy && (
                <Btn onClick={onEmergencyBuy} color="sec" style={{ padding: "4px", fontSize: 12 }}>
                  🏪仕入れ
                </Btn>
              )}
              {(pStock.dough <= 2 || pStock.sauce <= 2) && onEmergencyPrep && (
                <Btn onClick={onEmergencyPrep} color="sec" style={{ padding: "4px", fontSize: 12 }}>
                  🔪仕込み
                </Btn>
              )}
            </div>
            {closing ? (
              <div style={{ fontFamily: F.b, fontSize: 13, color: "#888", textAlign: "center" }}>
                残り{orders.length}件...
              </div>
            ) : (
              <div style={{ fontFamily: F.b, fontSize: 13, color: "#888", textAlign: "center" }}>
                {hasKitchenStaff ? "🤖 スタッフが自動調理中" : "注文をタップ → 調理！"}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
