import { useState, useRef, useCallback } from "react";
import { F, V, clamp } from "../../config/design.js";
import { COOK } from "../../config/cooking.js";
import { DEFAULT_MENUS } from "../../config/menus.js";
import Btn from "../shared/Btn.jsx";
import PizzaView from "../cooking/PizzaView.jsx";
import SalamiCSS from "../cooking/SalamiCSS.jsx";
import MushroomCSS from "../cooking/MushroomCSS.jsx";
import AnchovyCSS from "../cooking/AnchovyCSS.jsx";

const DEFAULT_IDS = new Set(DEFAULT_MENUS.map(m => m.id));

const SVG_W = 310;
const SVG_H = 280;
const CX = 155;
const CY = 140;

/* Generate perfectly round dough vertices */
function generatePerfectDough() {
  return Array(24).fill(COOK.guideRadius);
}

/* Auto-fill sauce blobs covering the dough */
function generateAutoSauce(cx, cy, radius, sauceType) {
  const blobs = [];
  // Center blob
  blobs.push({ x: cx, y: cy, rx: 20, ry: 16, opacity: 0.8 });
  // Ring of blobs
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const r = radius * 0.5;
    blobs.push({
      x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 10,
      y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 10,
      rx: 12 + Math.random() * 6,
      ry: 10 + Math.random() * 4,
      opacity: 0.6 + Math.random() * 0.15,
    });
  }
  // Fill gaps
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + 0.3;
    const r = radius * 0.25;
    blobs.push({
      x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 8,
      y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 8,
      rx: 10 + Math.random() * 5,
      ry: 8 + Math.random() * 4,
      opacity: 0.65 + Math.random() * 0.1,
    });
  }
  return blobs;
}

export default function MenuDev({
  customMenus, hiddenDefaultMenus, onSave, onToggle, onDelete, onBack, unlockedFeatures,
}) {
  const hdm = hiddenDefaultMenus || [];
  const uf = unlockedFeatures || new Set();

  /* ── Mode: list vs create ── */
  const [mode, setMode] = useState("list"); // "list" | "create"
  const [step, setStep] = useState("sauce"); // "sauce" | "cheese" | "topping" | "save"

  /* ── Pizza creation state ── */
  const [pizzaData, setPizzaData] = useState({
    doughVertices: generatePerfectDough(),
    sauceType: "tomato", sauceBlobs: [],
    cheeses: [], toppings: [], honeyDrops: [], oilDrops: [],
    bakeLevel: 0, bakeQuality: null,
  });
  const [selectedSauce, setSelectedSauce] = useState("tomato");
  const [selectedCheese, setSelectedCheese] = useState("mozzarella");
  const [selectedTopping, setSelectedTopping] = useState("basil");
  const [isDrizzling, setIsDrizzling] = useState(false);

  /* ── Save step state ── */
  const [menuName, setMenuName] = useState("");
  const [price, setPrice] = useState(1200);

  const areaRef = useRef(null);

  /* ── Coordinate conversion (same as Cooking) ── */
  const getPos = useCallback(e => {
    const r = areaRef.current?.getBoundingClientRect();
    if (!r) return null;
    const t = e.touches?.length ? e.touches[0] : e.changedTouches?.[0] || e;
    if (!t || t.clientX == null) return null;
    const domX = t.clientX - r.left;
    const domY = t.clientY - r.top;
    return { x: domX / r.width * SVG_W, y: domY / r.height * SVG_H };
  }, []);

  /* ── Filtered ingredients by unlocked features ── */
  const availableSauces = Object.entries(COOK.sauceTypes).filter(([k]) => {
    if (k === "tomato") return true;
    if (k === "genovese") return uf.has("genoveseSauce") || uf.has("sauceGenovese") || uf.has("sauce_genovese");
    if (k === "white") return uf.has("whiteSauce") || uf.has("sauceWhite") || uf.has("sauce_white");
    if (k === "soy") return uf.has("soySauce") || uf.has("sauceSoy") || uf.has("sauce_soy");
    return false;
  });

  const availableCheeses = Object.entries(COOK.cheeseTypes).filter(([k]) => {
    if (k === "mozzarella") return true;
    if (k === "cheddar") return uf.has("cheddar") || uf.has("cheeseCheddar") || uf.has("cheese_cheddar");
    if (k === "gorgonzola") return uf.has("gorgonzola") || uf.has("cheeseGorgonzola") || uf.has("cheese_gorgonzola");
    return false;
  });

  const availableToppings = Object.entries(COOK.toppings).filter(([k]) => {
    if (["basil", "salami", "olive", "mushroom"].includes(k)) return true;
    if (k === "shrimp") return uf.has("toppingShrimp") || uf.has("topping_shrimp");
    if (k === "tomato_s") return uf.has("toppingTomato") || uf.has("topping_tomato");
    if (k === "anchovy") return uf.has("toppingAnchovy") || uf.has("topping_anchovy");
    if (k === "honey") return uf.has("toppingHoney") || uf.has("topping_honey");
    return false;
  });

  /* ── Cheese tap (same as Cooking) ── */
  const cheeseTap = useCallback(e => {
    const p = getPos(e);
    if (!p) return;
    setPizzaData(prev => ({ ...prev, cheeses: [...prev.cheeses,
      { x: p.x, y: p.y, type: selectedCheese, key: Date.now() + Math.random() }] }));
  }, [getPos, selectedCheese]);

  /* ── Topping tap (same as Cooking) ── */
  const toppingTap = useCallback(e => {
    const p = getPos(e);
    if (!p) return;
    const def = COOK.toppings[selectedTopping];
    if (!def) return;
    if (def.type === "drizzle") return;
    setPizzaData(prev => ({ ...prev, toppings: [...prev.toppings,
      { x: p.x, y: p.y, type: selectedTopping, rotation: Math.random() * 30 - 15, key: Date.now() + Math.random() }] }));
  }, [getPos, selectedTopping]);

  /* ── Drizzle move (honey) ── */
  const drizzleMove = useCallback(e => {
    if (!isDrizzling) return;
    const p = getPos(e);
    if (!p) return;
    if (Math.random() > 0.4) return;
    setPizzaData(prev => ({ ...prev, honeyDrops: [...prev.honeyDrops,
      { x: p.x, y: p.y, size: 3 + Math.random() * 3, key: Date.now() + Math.random() }] }));
  }, [isDrizzling, getPos]);

  /* ── Start creating a new menu ── */
  const startCreate = () => {
    setPizzaData({
      doughVertices: generatePerfectDough(),
      sauceType: "tomato", sauceBlobs: [],
      cheeses: [], toppings: [], honeyDrops: [], oilDrops: [],
      bakeLevel: 0, bakeQuality: null,
    });
    setSelectedSauce("tomato");
    setSelectedCheese("mozzarella");
    setSelectedTopping("basil");
    setMenuName("");
    setPrice(1200);
    setStep("sauce");
    setMode("create");
  };

  /* ── Save handler ── */
  const handleSave = () => {
    if (!menuName.trim()) return;
    const cost = pizzaData.cheeses.length * 83 + pizzaData.toppings.length * 50 + 200;
    const sauceColor = COOK.sauceTypes[pizzaData.sauceType]?.color || "#D4392B";
    // Build emoji array for tops
    const tops = [];
    pizzaData.cheeses.forEach(() => tops.push("🧀"));
    pizzaData.toppings.forEach(t => {
      const def = COOK.toppings[t.type];
      tops.push(def?.emoji || "🍕");
    });
    onSave({
      name: menuName.trim(),
      price,
      cost,
      tops: tops.slice(0, 5),
      sc: sauceColor,
      pizzaData: {
        doughVertices: [...pizzaData.doughVertices],
        sauceType: pizzaData.sauceType,
        sauceBlobs: [...pizzaData.sauceBlobs],
        cheeses: [...pizzaData.cheeses],
        toppings: [...pizzaData.toppings],
        honeyDrops: [],
        oilDrops: [],
        bakeLevel: 0.85,
        bakeQuality: "perfect",
      },
    });
    setMode("list");
  };

  /* ── Shared styles ── */
  const card = {
    background: "#FFF",
    border: `1px solid ${V.birch}`,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  };

  const pizzaBg = `repeating-conic-gradient(rgba(200,50,50,.04) 0% 25%,transparent 0% 50%) 0 0/22px 22px, radial-gradient(circle at 50% 48%,#FFF8EE,#EEDFC0)`;

  const btnBar = {
    padding: "5px 8px 6px",
    borderTop: `3px solid ${V.oil}`,
    background: V.mozz,
    flexShrink: 0,
    display: "flex",
    gap: 4,
  };

  const allMenus = customMenus || [];

  /* ════════════════════════════════════════════════════
     LIST MODE
     ════════════════════════════════════════════════════ */
  if (mode === "list") {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: V.flour }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${V.walnut}, ${V.walnutDk})`,
          padding: "14px 16px", textAlign: "center",
        }}>
          <div style={{ fontFamily: F.d, fontSize: 18, color: "#FFF" }}>
            📖 メニュー管理
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {/* Default menus */}
          {DEFAULT_MENUS.map(m => {
            const isHidden = hdm.includes(m.id);
            return (
            <div key={`d${m.id}`} style={{
              ...card, opacity: isHidden ? 0.4 : 1, background: "#F9F5EE",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div>
                  <span style={{ fontFamily: F.d, fontSize: 16, color: V.esp }}>{m.name}</span>
                  <span style={{
                    fontFamily: F.b, fontSize: 10, color: V.oak, marginLeft: 6,
                    background: V.flour, padding: "1px 5px", borderRadius: 4,
                  }}>
                    デフォルト
                  </span>
                </div>
                <span style={{ fontFamily: F.d, fontSize: 13, color: V.basil }}>
                  ¥{m.price.toLocaleString()}
                </span>
              </div>
              <div style={{ fontFamily: F.b, fontSize: 11, color: V.oak, marginBottom: 4 }}>
                原価: ¥{m.cost} ｜ {(m.tops || []).join(" ")}
              </div>
              <Btn
                color="sec"
                onClick={() => onToggle(m.id)}
                style={{ fontSize: 11, padding: "4px 6px" }}
              >
                {isHidden ? "表示する" : "非表示にする"}
              </Btn>
            </div>
            );
          })}

          {/* Custom menus */}
          {allMenus.filter(m => !DEFAULT_IDS.has(m.id)).map(m => {
            const tops = m.tops || [];
            return (
              <div key={m.id} style={{
                ...card, opacity: m.hidden ? 0.5 : 1,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: F.d, fontSize: 16, color: V.esp }}>{m.name}</span>
                  <span style={{ fontFamily: F.d, fontSize: 13, color: V.basil }}>
                    ¥{m.price.toLocaleString()}
                  </span>
                </div>
                <div style={{ fontFamily: F.b, fontSize: 11, color: V.oak, marginBottom: 4 }}>
                  原価: ¥{m.cost} ｜ {tops.join(" ")}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn
                    color="sec"
                    onClick={() => onToggle(m.id)}
                    style={{ flex: 1, fontSize: 11, padding: "4px 6px" }}
                  >
                    {m.hidden ? "表示する" : "非表示"}
                  </Btn>
                  <Btn
                    color="sec"
                    onClick={() => { if (window.confirm(`「${m.name}」を削除しますか？`)) onDelete(m.id); }}
                    style={{ flex: 1, fontSize: 11, padding: "4px 6px" }}
                  >
                    削除
                  </Btn>
                </div>
              </div>
            );
          })}

          {/* New menu button */}
          <Btn color="basil" onClick={startCreate} style={{ marginTop: 4 }}>
            ＋ 新メニューを作る
          </Btn>
        </div>

        {/* Bottom */}
        <div style={{ padding: "10px 16px 14px", background: V.flour, borderTop: `1px solid ${V.birch}` }}>
          <Btn color="sec" onClick={onBack}>← 戻る</Btn>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     CREATE MODE — Step header
     ════════════════════════════════════════════════════ */
  const stepNames = { sauce: "① ソース", cheese: "② チーズ", topping: "③ トッピング", save: "④ 登録" };
  const stepProgress = { sauce: 1, cheese: 2, topping: 3, save: 4 };

  const header = (
    <div style={{
      padding: "4px 8px", display: "flex", alignItems: "center", gap: 4,
      borderBottom: `2px solid ${V.birch}`, flexShrink: 0, background: V.mozz,
    }}>
      <span style={{ fontSize: 13 }}>📖</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: "bold", color: V.esp }}>メニュー作成</div>
        <div style={{ fontFamily: F.b, fontSize: 10, color: V.terra }}>{stepNames[step]}</div>
      </div>
      <div style={{ display: "flex", gap: 1 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i <= stepProgress[step] ? V.terra : "#DDD",
          }} />
        ))}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════
     STEP: SAUCE — Pick sauce type
     ════════════════════════════════════════════════════ */
  if (step === "sauce") {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: V.mozz }}>
        {header}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 16 }}>
          <div style={{ fontFamily: F.b, fontSize: 13, color: V.esp, fontWeight: "bold" }}>ソースを選ぶ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 250 }}>
            {availableSauces.map(([k, v]) => (
              <button key={k} onClick={() => setSelectedSauce(k)}
                style={{
                  padding: "10px 8px", borderRadius: 10,
                  border: `2px solid ${selectedSauce === k ? V.terra : V.birch}`,
                  background: selectedSauce === k ? "#FFF8EE" : "#FFF",
                  cursor: "pointer", textAlign: "center",
                }}>
                <div style={{ fontSize: 20 }}>{v.icon}</div>
                <div style={{ fontFamily: F.b, fontSize: 11, color: V.esp, marginTop: 2 }}>{v.name}</div>
                <div style={{ width: 20, height: 10, borderRadius: 4, background: v.color, margin: "3px auto 0" }} />
              </button>
            ))}
          </div>
        </div>
        <div style={btnBar}>
          <Btn onClick={() => setMode("list")} color="sec" style={{ flex: 1 }}>← 戻る</Btn>
          <Btn onClick={() => {
            const blobs = generateAutoSauce(CX, CY, COOK.guideRadius, selectedSauce);
            setPizzaData(prev => ({ ...prev, sauceType: selectedSauce, sauceBlobs: blobs }));
            setStep("cheese");
          }} style={{ flex: 2 }}>次へ</Btn>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     STEP: CHEESE — Interactive cheese placement
     ════════════════════════════════════════════════════ */
  if (step === "cheese") {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: V.mozz }}>
        {header}
        <div ref={areaRef} style={{
          flex: 1, position: "relative", overflow: "hidden", touchAction: "none", background: pizzaBg,
        }}
          onClick={cheeseTap}
          onTouchEnd={e => { e.preventDefault(); cheeseTap(e); }}
        >
          <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ position: "absolute", top: 0, left: 0 }}>
            <PizzaView pizzaData={pizzaData} cx={CX} cy={CY} baked={false} />
          </svg>
          <div style={{
            position: "absolute", top: 8, right: 8, fontFamily: F.b, fontSize: 12, color: V.esp,
            background: "rgba(255,255,255,.8)", padding: "2px 6px", borderRadius: 6,
          }}>
            🧀 {pizzaData.cheeses.length}枚
          </div>
        </div>
        {/* Cheese type selector */}
        <div style={{ padding: "3px 8px", background: V.mozz, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            {availableCheeses.map(([k, v]) => (
              <button key={k} onClick={() => setSelectedCheese(k)}
                style={{
                  flex: 1, padding: "4px 2px", borderRadius: 8,
                  border: `2px solid ${selectedCheese === k ? V.terra : V.birch}`,
                  background: selectedCheese === k ? "#FFF8EE" : "#FFF",
                  cursor: "pointer", textAlign: "center",
                }}>
                <div style={{ width: 16, height: 12, borderRadius: 3, background: v.color, margin: "0 auto" }} />
                <div style={{ fontFamily: F.b, fontSize: 10, color: V.esp, marginTop: 1 }}>{v.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={btnBar}>
          <Btn onClick={() => setStep("sauce")} color="sec" style={{ flex: 1 }}>← ソース</Btn>
          <Btn onClick={() => setStep("topping")} style={{ flex: 2 }}>次へ → トッピング</Btn>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     STEP: TOPPING — Interactive topping placement
     ════════════════════════════════════════════════════ */
  if (step === "topping") {
    const def = COOK.toppings[selectedTopping];
    const isDrizzleMode = def?.type === "drizzle";
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: V.mozz }}>
        {header}
        <div ref={areaRef} style={{
          flex: 1, position: "relative", overflow: "hidden", touchAction: "none", background: pizzaBg,
        }}
          onClick={isDrizzleMode ? undefined : toppingTap}
          onTouchEnd={isDrizzleMode ? undefined : e => { e.preventDefault(); toppingTap(e); }}
          onMouseDown={isDrizzleMode ? () => setIsDrizzling(true) : undefined}
          onMouseUp={isDrizzleMode ? () => setIsDrizzling(false) : undefined}
          onMouseLeave={isDrizzleMode ? () => setIsDrizzling(false) : undefined}
          onMouseMove={isDrizzleMode ? drizzleMove : undefined}
          onTouchStart={isDrizzleMode ? () => setIsDrizzling(true) : undefined}
          onTouchMove={isDrizzleMode ? drizzleMove : undefined}
        >
          <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ position: "absolute", top: 0, left: 0 }}>
            <PizzaView pizzaData={pizzaData} cx={CX} cy={CY} baked={false} />
          </svg>
          {/* CSS toppings overlay */}
          {pizzaData.toppings.filter(t => COOK.toppings[t.type]?.type === "css").map((t) => {
            const d = COOK.toppings[t.type];
            const style = {
              position: "absolute", left: t.x - d.size / 2, top: t.y - d.size / 2,
              transform: `rotate(${t.rotation}deg)`, pointerEvents: "none", animation: "popIn .2s",
            };
            if (t.type === "salami") return <SalamiCSS key={t.key} size={d.size} style={style} />;
            if (t.type === "mushroom") return <MushroomCSS key={t.key} size={d.size} style={style} />;
            if (t.type === "anchovy") return <AnchovyCSS key={t.key} style={{ ...style, left: t.x - 15, top: t.y - 6 }} />;
            return null;
          })}
          <div style={{
            position: "absolute", top: 8, right: 8, fontFamily: F.b, fontSize: 12, color: V.esp,
            background: "rgba(255,255,255,.8)", padding: "2px 6px", borderRadius: 6,
          }}>
            🍕 {pizzaData.toppings.length}個
          </div>
        </div>
        {/* Topping type selector */}
        <div style={{ padding: "3px 8px", background: V.mozz, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {availableToppings.map(([k, v]) => (
              <button key={k} onClick={() => setSelectedTopping(k)}
                style={{
                  padding: "3px 6px", borderRadius: 6,
                  border: `2px solid ${selectedTopping === k ? V.terra : V.birch}`,
                  background: selectedTopping === k ? "#FFF8EE" : "#FFF",
                  cursor: "pointer", textAlign: "center", minWidth: 40,
                }}>
                <div style={{ fontSize: 14 }}>{v.emoji || "🔧"}</div>
                <div style={{ fontFamily: F.b, fontSize: 10, color: V.esp }}>{v.name}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={btnBar}>
          <Btn onClick={() => setStep("cheese")} color="sec" style={{ flex: 1 }}>← チーズ</Btn>
          <Btn onClick={() => setStep("save")} style={{ flex: 2 }}>次へ → 登録</Btn>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════
     STEP: SAVE — Name, price, save
     ════════════════════════════════════════════════════ */
  const cost = pizzaData.cheeses.length * 83 + pizzaData.toppings.length * 50 + 200;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: V.mozz }}>
      {header}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
        {/* Pizza preview (baked appearance) */}
        <div style={{
          position: "relative", width: "100%", height: 200, background: pizzaBg,
          borderRadius: 12, overflow: "hidden", marginBottom: 10,
          border: `1px solid ${V.birch}`,
        }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ position: "absolute", top: 0, left: 0 }}>
            <PizzaView pizzaData={{ ...pizzaData, bakeLevel: 0.85, bakeQuality: "perfect" }} cx={CX} cy={CY} baked={true} />
          </svg>
          {/* CSS toppings overlay */}
          {pizzaData.toppings.filter(t => COOK.toppings[t.type]?.type === "css").map((t) => {
            const d = COOK.toppings[t.type];
            const style = {
              position: "absolute", left: t.x - d.size / 2, top: t.y - d.size / 2,
              transform: `rotate(${t.rotation}deg)`, pointerEvents: "none",
            };
            if (t.type === "salami") return <SalamiCSS key={t.key} size={d.size} style={style} />;
            if (t.type === "mushroom") return <MushroomCSS key={t.key} size={d.size} style={style} />;
            if (t.type === "anchovy") return <AnchovyCSS key={t.key} style={{ ...style, left: t.x - 15, top: t.y - 6 }} />;
            return null;
          })}
          <div style={{
            position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
            fontFamily: F.b, fontSize: 10, color: "#FFF", background: "rgba(0,0,0,.45)",
            padding: "2px 8px", borderRadius: 8,
          }}>
            メニュー写真プレビュー
          </div>
        </div>

        {/* Name input */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: F.b, fontSize: 11, color: V.oak, marginBottom: 2 }}>メニュー名</div>
          <input
            type="text"
            value={menuName}
            onChange={e => setMenuName(e.target.value)}
            placeholder="メニュー名を入力"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 10px", borderRadius: 8,
              border: `1px solid ${V.birch}`,
              fontFamily: F.b, fontSize: 14,
              background: V.mozz,
            }}
          />
        </div>

        {/* Price input */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: F.b, fontSize: 11, color: V.oak, marginBottom: 2 }}>販売価格</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setPrice(p => Math.max(100, p - 100))}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${V.birch}`, background: V.flour,
                fontFamily: F.b, fontSize: 18, cursor: "pointer",
              }}
            >
              −
            </button>
            <span style={{
              fontFamily: F.d, fontSize: 18, color: V.esp,
              minWidth: 70, textAlign: "center",
            }}>
              ¥{price.toLocaleString()}
            </span>
            <button
              onClick={() => setPrice(p => p + 100)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${V.birch}`, background: V.flour,
                fontFamily: F.b, fontSize: 18, cursor: "pointer",
              }}
            >
              ＋
            </button>
          </div>
        </div>

        {/* Cost display */}
        <div style={{
          background: V.flour, borderRadius: 8, padding: 8, marginBottom: 10,
          border: `1px solid ${V.birch}`,
        }}>
          <div style={{ fontFamily: F.b, fontSize: 11, color: V.oak }}>
            原価: ¥{cost} （チーズ{pizzaData.cheeses.length}枚 + トッピング{pizzaData.toppings.length}個 + ソース）
          </div>
          <div style={{ fontFamily: F.b, fontSize: 11, color: price > cost ? V.basil : V.terra, marginTop: 2 }}>
            利益: ¥{price - cost} / 枚
          </div>
        </div>
      </div>

      <div style={btnBar}>
        <Btn onClick={() => setStep("topping")} color="sec" style={{ flex: 1 }}>← 戻る</Btn>
        <Btn
          onClick={handleSave}
          disabled={!menuName.trim()}
          style={{ flex: 2 }}
        >
          メニューに登録
        </Btn>
      </div>
    </div>
  );
}
