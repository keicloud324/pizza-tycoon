import { useState } from "react";
import { F, V } from "../../config/design.js";
import { INGS, SUPPLIERS } from "../../config/ingredients.js";
import { FOOD_IMG, SFX } from "../../config/assets.js";
import { EQUIPMENT_LIST, EQUIPMENT } from "../../config/equipment.js";
import { ENABLE_EQUIPMENT } from "../../config/features.js";
import Btn from "../shared/Btn.jsx";

const GREETINGS = ["いらっしゃい！", "何がいるかい？", "新鮮なものを揃えてるよ！"];
const randomGreeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

/* #45: 変換レートに合わせた購入プリセット */
const PURCHASE_PRESETS = {
  tomato:      [
    { qty: 9,  label: "9個(3食分)" },
    { qty: 18, label: "18個(6食分)" },
    { qty: 36, label: "36個(12食分)" },
  ],
  basil_i:     [
    { qty: 2,  label: "2個" },
    { qty: 5,  label: "5個" },
    { qty: 10, label: "10個" },
  ],
  flour_bag:   [
    { qty: 1,  label: "1袋(25枚)" },
    { qty: 2,  label: "2袋(50枚)" },
  ],
  mozz_block:  [
    { qty: 1,  label: "1塊(6枚)" },
    { qty: 2,  label: "2塊(12枚)" },
    { qty: 3,  label: "3塊(18枚)" },
  ],
  salami_log:  [
    { qty: 1,  label: "1本(8枚)" },
    { qty: 2,  label: "2本(16枚)" },
  ],
  shrimp_pack: [
    { qty: 1,  label: "1パック(8尾)" },
    { qty: 2,  label: "2パック(16尾)" },
  ],
  olive_jar:   [
    { qty: 1,  label: "1瓶(12個)" },
    { qty: 2,  label: "2瓶(24個)" },
  ],
};
const getPresets = (iid) => PURCHASE_PRESETS[iid] || [{ qty: 1, label: "1個" }, { qty: 3, label: "3個" }, { qty: 5, label: "5個" }];

export default function Marche({ money, stock, priceMultiplier, dailyPrices, onDone, level, ownedEquipment, onPurchaseEquipment, audio }) {
  const playerLevel = level || 1;
  const [selectedSupplier, setSelectedSupplier] = useState(0);
  const [cart, setCart] = useState({});
  const pm = priceMultiplier || 1;

  const getPrice = (iid) => {
    const dp = dailyPrices?.[iid];
    const base = dp ? dp.price : (INGS[iid]?.price || 0);
    return Math.round(base * pm);
  };
  const getRatio = (iid) => {
    const dp = dailyPrices?.[iid];
    return dp ? dp.ratio * pm : pm;
  };

  const spent = Object.entries(cart).reduce((s, [id, q]) => s + getPrice(id) * q, 0);
  const rem = money - spent;
  const totalItems = Object.values(cart).reduce((s, v) => s + v, 0);

  const sup = SUPPLIERS[selectedSupplier];

  /* Shopkeeper speech bubble logic */
  const getSpeech = () => {
    const cheapItem = sup.items.find((iid) => getRatio(iid) < 0.92);
    if (cheapItem) {
      return `今日は${INGS[cheapItem]?.name || ""}がお買い得だよ！`;
    }
    const expItem = sup.items.find((iid) => getRatio(iid) > 1.12);
    if (expItem) {
      return `すまない、${INGS[expItem]?.name || ""}がちょっと高いんだ…`;
    }
    return randomGreeting();
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#E8D5B8" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg,#4A7C3F,#3A6530)",
        padding: "7px 12px",
        borderBottom: "3px solid #2D4F24",
        flexShrink: 0,
        textAlign: "center",
      }}>
        <div style={{ fontFamily: F.b, color: "#FFF", fontSize: 13 }}>🏪 マルシェ通り</div>
      </div>

      {/* Emergency markup banner */}
      {pm > 1 && (
        <div style={{
          background: "#FFF0F0",
          padding: "4px 12px",
          borderBottom: "2px solid #E88",
          flexShrink: 0,
          textAlign: "center",
        }}>
          <span style={{ fontFamily: F.b, fontSize: 14, color: V.terra, fontWeight: "bold" }}>
            ⚠️ 営業中割増: {Math.round(pm * 100)}%
          </span>
        </div>
      )}

      {/* Money bar */}
      <div style={{
        background: "#FFF8EE",
        padding: "4px 12px",
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid #D4A76A",
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: F.b, fontSize: 14 }}>
          💰 残り: <b style={{ color: rem < 3000 ? V.terra : V.basil }}>¥{rem.toLocaleString()}</b>
        </span>
        <span style={{ fontFamily: F.b, fontSize: 14 }}>🧺 {totalItems}点</span>
      </div>

      {/* Supplier tabs */}
      <div style={{
        display: "flex",
        background: "#FFF",
        borderBottom: "2px solid #EEE",
        flexShrink: 0,
      }}>
        {SUPPLIERS.map((s, i) => (
          <div
            key={i}
            onClick={() => setSelectedSupplier(i)}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "6px 0",
              cursor: "pointer",
              borderBottom: i === selectedSupplier ? `3px solid ${V.terra}` : "3px solid transparent",
              background: i === selectedSupplier ? "#FFF8EE" : "#FFF",
              transition: "background 0.15s",
            }}
          >
            <span style={{ fontSize: 22 }}>{s.icon}</span>
          </div>
        ))}
      </div>

      {/* Shopkeeper area */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 16px 6px",
        background: "#FFF8EE",
        borderBottom: "1px solid #EEE",
      }}>
        <span style={{ fontSize: 60, lineHeight: 1 }}>{sup.icon}</span>
        <div style={{ fontFamily: F.b, fontSize: 14, fontWeight: "bold", color: V.esp, marginTop: 2 }}>
          {sup.name}
        </div>
        {/* Speech bubble */}
        <div style={{ position: "relative", marginTop: 6, marginBottom: 2 }}>
          {/* Triangle pointer */}
          <div style={{
            position: "absolute",
            top: -6,
            left: "50%",
            marginLeft: -6,
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderBottom: "6px solid #FFF",
          }} />
          <div style={{
            background: "#FFF",
            borderRadius: 10,
            padding: "6px 14px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            border: "1px solid #EEE",
          }}>
            <span style={{ fontFamily: F.b, fontSize: 14, color: V.esp }}>
              {getSpeech()}
            </span>
          </div>
        </div>
      </div>

      {/* Item stall — tap to add to basket */}
      <div style={{ flex: 1, overflow: "auto", padding: "6px 10px" }}>
        {/* Wooden stall background */}
        <div style={{
          background: "repeating-linear-gradient(90deg, #D4A76A 0px, #C49660 4px, #D4A76A 8px)",
          borderRadius: 10, padding: "8px 6px", marginBottom: 4,
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(sup.items.length, 3)}, 1fr)`,
            gap: 6,
          }}>
            {sup.items.map((iid) => {
              const ing = INGS[iid];
              if (!ing) return null;
              const locked = (ing.unlockLevel || 1) > playerLevel;
              const cnt = cart[iid] || 0;
              const p = getPrice(iid);
              const ratio = getRatio(iid);
              const isCheap = ratio < 0.92;
              const isExpensive = ratio > 1.12;
              const canAfford = (rem >= p || cnt > 0) && !locked;
              const preset = getPresets(iid);
              const nextQty = cnt === 0
                ? preset[0]?.qty || 1
                : (preset.find(pr => pr.qty > cnt)?.qty || cnt + 1);

              if (locked) return (
                <div key={iid} style={{
                  background: "#E8E8E8", borderRadius: 10, padding: "8px 4px",
                  textAlign: "center", border: `1px solid #CCC`, opacity: 0.6,
                }}>
                  <div style={{ fontSize: 28, filter: "grayscale(1)" }}>🔒</div>
                  <div style={{ fontFamily: F.b, fontSize: 10, color: "#999", marginTop: 2 }}>
                    Lv{ing.unlockLevel}で解放
                  </div>
                </div>
              );

              return (
                <div key={iid}
                  onClick={() => {
                    if (rem >= p * (nextQty - cnt) || nextQty <= cnt) {
                      setCart(prev => ({ ...prev, [iid]: nextQty }));
                      audio?.playSe(SFX.select);
                    }
                  }}
                  style={{
                    background: cnt > 0 ? "#FFF8EE" : "#FFF",
                    borderRadius: 10,
                    padding: "8px 4px",
                    textAlign: "center",
                    cursor: canAfford ? "pointer" : "default",
                    border: cnt > 0 ? `2px solid ${V.terra}` : `1px solid ${V.birch}`,
                    opacity: canAfford ? 1 : 0.5,
                    position: "relative",
                    transition: "transform 0.1s",
                  }}
                >
                  {/* Price badge */}
                  {isCheap && (
                    <div style={{
                      position: "absolute", top: -4, right: -4, fontSize: 9, fontWeight: "bold",
                      background: V.basil, color: "#FFF", borderRadius: 4, padding: "1px 4px",
                    }}>安い!</div>
                  )}
                  {isExpensive && (
                    <div style={{
                      position: "absolute", top: -4, right: -4, fontSize: 9, fontWeight: "bold",
                      background: V.terra, color: "#FFF", borderRadius: 4, padding: "1px 4px",
                    }}>高騰</div>
                  )}
                  {/* Food emoji */}
                  <div style={{ lineHeight: 1, marginBottom: 2 }}>
                    {FOOD_IMG[iid]
                      ? <img src={FOOD_IMG[iid]} width={36} height={36} style={{ imageRendering: "auto" }} />
                      : <span style={{ fontSize: 32 }}>{ing.icon}</span>}
                  </div>
                  <div style={{ fontFamily: F.b, fontSize: 11, color: V.esp, fontWeight: "bold" }}>{ing.name}</div>
                  <div style={{
                    fontFamily: F.b, fontSize: 12, fontWeight: "bold",
                    color: isCheap ? V.basil : isExpensive ? V.terra : V.esp,
                  }}>¥{p}</div>
                  {/* Cart count badge */}
                  {cnt > 0 && (
                    <div style={{
                      position: "absolute", top: -6, left: -6,
                      background: V.terra, color: "#FFF", borderRadius: "50%",
                      width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: F.b, fontSize: 11, fontWeight: "bold",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }}>{cnt}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart details — items in basket */}
        {totalItems > 0 && (
          <div style={{
            background: "#FFF", borderRadius: 8, padding: "6px 8px",
            border: `1px solid ${V.birch}`, marginTop: 4,
          }}>
            <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: "bold", color: V.esp, marginBottom: 3 }}>
              🧺 カゴの中身
            </div>
            {Object.entries(cart).filter(([, q]) => q > 0).map(([iid, q]) => {
              const ing = INGS[iid];
              if (!ing) return null;
              return (
                <div key={iid} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "2px 0", borderBottom: `1px solid ${V.birch}22`,
                }}>
                  <span style={{ fontFamily: F.b, fontSize: 12, color: V.esp }}>
                    {ing.icon} {ing.name} ×{q}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontFamily: F.b, fontSize: 12, color: V.oak }}>
                      ¥{(getPrice(iid) * q).toLocaleString()}
                    </span>
                    <button onClick={() => setCart(prev => ({ ...prev, [iid]: 0 }))}
                      style={{
                        fontSize: 10, padding: "1px 4px", borderRadius: 4,
                        border: `1px solid ${V.birch}`, background: "#FFF",
                        cursor: "pointer", fontFamily: F.b, color: V.terra,
                      }}>✕</button>
                  </div>
                </div>
              );
            })}
            {/* Preset quick-adjust per item */}
            {Object.entries(cart).filter(([, q]) => q > 0).map(([iid]) => {
              const cnt = cart[iid];
              const maxAffordable = Math.min(50, Math.floor(rem / getPrice(iid)) + cnt);
              return (
                <div key={`p${iid}`} style={{ display: "flex", gap: 2, flexWrap: "wrap", marginTop: 2 }}>
                  {getPresets(iid).filter(pr => pr.qty <= maxAffordable).map(pr => (
                    <button key={pr.qty} onClick={() => setCart(prev => ({ ...prev, [iid]: pr.qty }))}
                      style={{
                        fontFamily: F.b, fontSize: 10, padding: "2px 5px",
                        borderRadius: 4, cursor: "pointer", border: "none",
                        background: cnt === pr.qty ? V.terra : "#F0F0F0",
                        color: cnt === pr.qty ? "#FFF" : V.esp,
                      }}>{pr.label}</button>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* 設備投資セクション (#99) — #117: フラグで無効化可能 */}
        {ENABLE_EQUIPMENT && onPurchaseEquipment && (
          <div style={{
            background: playerLevel >= 3 ? "#FFF" : "#F0F0F0",
            borderRadius: 8, padding: "6px 8px",
            border: `1px solid ${V.birch}`, marginTop: 4,
            opacity: playerLevel >= 3 ? 1 : 0.6,
          }}>
            <div style={{ fontFamily: F.b, fontSize: 12, fontWeight: "bold", color: V.esp, marginBottom: 4 }}>
              🏗️ 設備投資 {playerLevel < 3 && <span style={{ fontSize: 10, color: "#999", fontWeight: "normal" }}>（Lv3で解放）</span>}
            </div>
            {playerLevel < 3 ? (
              <div style={{ fontFamily: F.b, fontSize: 11, color: "#999", textAlign: "center", padding: 8 }}>
                🔒 Lv3で解放されます
              </div>
            ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {EQUIPMENT_LIST.map(eq => {
                const owned = (ownedEquipment || []).filter(e => e === eq.id).length;
                const atMax = owned >= (eq.maxOwn || 1);
                const canAfford = (money - spent) >= eq.cost;
                return (
                  <div key={eq.id}
                    onClick={() => !atMax && canAfford && onPurchaseEquipment(eq.id)}
                    style={{
                      background: atMax ? "#F0F0F0" : "#FFF",
                      border: `1px solid ${V.birch}`,
                      borderRadius: 8, padding: 6, textAlign: "center",
                      cursor: atMax || !canAfford ? "default" : "pointer",
                      opacity: atMax ? 0.5 : canAfford ? 1 : 0.6,
                    }}
                  >
                    <div style={{ fontSize: 20 }}>{eq.icon}</div>
                    <div style={{ fontFamily: F.b, fontSize: 10, color: V.esp }}>{eq.name}</div>
                    <div style={{ fontFamily: F.b, fontSize: 10, color: V.oak }}>{eq.desc}</div>
                    <div style={{ fontFamily: F.b, fontSize: 11, fontWeight: "bold", color: atMax ? V.basil : V.terra }}>
                      {atMax ? "✅ 設置済" : `¥${eq.cost.toLocaleString()}`}
                    </div>
                    {owned > 0 && !atMax && (
                      <div style={{ fontFamily: F.b, fontSize: 9, color: V.oak }}>{owned}/{eq.maxOwn}</div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        background: "#FFF",
        padding: "6px 12px",
        borderTop: `3px solid ${V.oil}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: F.b, fontSize: 13, color: "#888" }}>合計</div>
          <div style={{ fontFamily: F.b, fontSize: 15, fontWeight: "bold", color: V.terra }}>
            ¥{spent.toLocaleString()}
          </div>
        </div>
        <Btn onClick={() => onDone(cart, spent)} style={{ width: "auto", padding: "8px 18px" }}>
          購入 → 仕込み
        </Btn>
      </div>
    </div>
  );
}
