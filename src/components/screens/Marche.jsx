import { useState } from "react";
import { F, V } from "../../config/design.js";
import { INGS, SUPPLIERS } from "../../config/ingredients.js";
import Btn from "../shared/Btn.jsx";

const GREETINGS = ["いらっしゃい！", "何がいるかい？", "新鮮なものを揃えてるよ！"];
const randomGreeting = () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

export default function Marche({ money, stock, priceMultiplier, dailyPrices, onDone }) {
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

      {/* Item list */}
      <div style={{ flex: 1, overflow: "auto", padding: "6px 10px" }}>
        {sup.items.map((iid, ii) => {
          const ing = INGS[iid];
          if (!ing) return null;
          const cnt = cart[iid] || 0;
          const p = getPrice(iid);
          const ratio = getRatio(iid);
          const isCheap = ratio < 0.92;
          const isExpensive = ratio > 1.12;
          const maxAffordable = Math.min(20, Math.floor(rem / p) + cnt);

          return (
            <div key={ii} style={{
              background: "#FFF",
              borderRadius: 8,
              marginBottom: 5,
              padding: "7px 10px",
              border: `1px solid ${V.birch}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{ fontSize: 22 }}>{ing.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: F.b,
                  fontSize: 14,
                  color: V.esp,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexWrap: "wrap",
                }}>
                  {ing.name}
                  {isCheap && (
                    <span style={{
                      fontSize: 11,
                      color: V.basil,
                      background: "#E8F5E9",
                      borderRadius: 3,
                      padding: "0 3px",
                      fontWeight: "bold",
                    }}>お買い得!</span>
                  )}
                  {isExpensive && (
                    <span style={{
                      fontSize: 11,
                      color: V.terra,
                      background: "#FFEBEE",
                      borderRadius: 3,
                      padding: "0 3px",
                      fontWeight: "bold",
                    }}>高騰中</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                  <span style={{
                    fontFamily: F.b,
                    fontSize: 14,
                    color: isCheap ? V.basil : isExpensive ? V.terra : V.esp,
                    fontWeight: "bold",
                  }}>¥{p}</span>
                  {(isCheap || isExpensive) && (
                    <span style={{
                      fontFamily: F.b,
                      fontSize: 11,
                      color: "#AAA",
                      textDecoration: "line-through",
                    }}>¥{ing.price}</span>
                  )}
                  <span style={{
                    fontFamily: F.b,
                    fontSize: 12,
                    color: "#AAA",
                    background: "#F5F5F5",
                    padding: "0 4px",
                    borderRadius: 4,
                  }}>在庫:{stock[iid] || 0}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1, 3, 5, 10].filter(q => q <= maxAffordable).map(q => (
                    <button key={q} onClick={() => {
                      setCart(prev => ({ ...prev, [iid]: q }));
                    }}
                    style={{
                      fontFamily: F.b, fontSize: 14, padding: "4px 8px",
                      borderRadius: 6, cursor: "pointer", border: "none",
                      background: cnt === q ? V.terra : "#F5F5F5",
                      color: cnt === q ? "#FFF" : V.esp,
                      fontWeight: cnt === q ? "bold" : "normal",
                    }}>
                      {q}個
                    </button>
                  ))}
                </div>
                {cnt > 0 && (
                  <span style={{ fontFamily: F.b, fontSize: 13, color: V.basil, fontWeight: "bold" }}>
                    🧺 {cnt}個 (¥{cnt * p})
                  </span>
                )}
              </div>
            </div>
          );
        })}
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
