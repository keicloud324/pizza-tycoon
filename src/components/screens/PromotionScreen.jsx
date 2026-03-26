import { useState } from "react";
import { F, V } from "../../config/design.js";
import { PROMOTIONS } from "../../config/promotions.js";
import Btn from "../shared/Btn.jsx";

export default function PromotionScreen({
  money, level, snsFollowers, activePromotions, onActivate, onBack,
}) {
  const [confirmId, setConfirmId] = useState(null);

  const active = activePromotions || [];
  const activeKeys = new Set(active.map((p) => p.key));

  const available = Object.entries(PROMOTIONS).filter(
    ([, p]) => p.unlockLevel <= level
  );

  const card = {
    background: "#FFF",
    border: `1px solid ${V.birch}`,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  };

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      background: V.flour,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${V.walnut}, ${V.walnutDk})`,
        padding: "14px 16px", textAlign: "center",
      }}>
        <div style={{ fontFamily: F.d, fontSize: 18, color: "#FFF" }}>
          📣 販促
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>

        {/* Current money */}
        <div style={{
          fontFamily: F.b, fontSize: 13, color: V.oak,
          textAlign: "right", marginBottom: 8,
        }}>
          所持金: <span style={{ fontFamily: F.d, fontSize: 16, color: V.basil }}>
            ¥{(money || 0).toLocaleString()}
          </span>
        </div>

        {/* Active promotions */}
        {active.length > 0 && (
          <>
            <div style={{
              fontFamily: F.b, fontSize: 13, fontWeight: "bold",
              color: V.esp, marginBottom: 6,
            }}>
              実施中の販促
            </div>
            {active.map((p, i) => {
              const def = PROMOTIONS[p.key];
              return (
                <div key={i} style={{
                  ...card,
                  background: "#F0FFF0",
                  border: `1px solid ${V.basil}`,
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span style={{ fontFamily: F.d, fontSize: 13, color: V.esp }}>
                      {def ? def.icon : "📣"} {def ? def.name : p.key}
                    </span>
                    <span style={{
                      fontFamily: F.b, fontSize: 11, color: V.basil,
                      background: "#E0FFE0", borderRadius: 6, padding: "2px 6px",
                    }}>
                      {p.remainingDays === -1 ? "永続" : `残り${p.remainingDays}日`}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Available promotions */}
        <div style={{
          fontFamily: F.b, fontSize: 13, fontWeight: "bold",
          color: V.esp, marginBottom: 6, marginTop: active.length > 0 ? 8 : 0,
        }}>
          利用可能な販促
        </div>

        {available.length === 0 && (
          <div style={{
            ...card, textAlign: "center",
            fontFamily: F.b, fontSize: 13, color: V.oak,
          }}>
            レベルが上がると販促が解放されます
          </div>
        )}

        {available.map(([key, promo]) => {
          const isActive = activeKeys.has(key);
          const cantAfford = promo.cost > (money || 0);
          const disabled = isActive || cantAfford;

          return (
            <div key={key} style={{
              ...card,
              opacity: disabled ? 0.6 : 1,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 4,
              }}>
                <span style={{ fontFamily: F.d, fontSize: 16, color: V.esp }}>
                  {promo.icon} {promo.name}
                </span>
                {isActive && (
                  <span style={{
                    fontFamily: F.b, fontSize: 10, color: "#FFF",
                    background: V.basil, borderRadius: 4, padding: "1px 5px",
                  }}>
                    実施中
                  </span>
                )}
              </div>

              <div style={{
                fontFamily: F.b, fontSize: 12, color: V.oak, marginBottom: 4,
              }}>
                {promo.desc}
              </div>

              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: F.b, fontSize: 11, color: V.oak, marginBottom: 6,
              }}>
                <span>
                  費用: {promo.cost > 0 ? `¥${promo.cost.toLocaleString()}` : "無料"}
                </span>
                <span>
                  期間: {promo.duration === -1
                    ? "永続"
                    : promo.duration === 0
                      ? "即時"
                      : `${promo.duration}日間`}
                </span>
              </div>

              {/* SNS followers display */}
              {key === "sns" && (
                <div style={{
                  fontFamily: F.b, fontSize: 12, color: V.grape,
                  marginBottom: 6, textAlign: "center",
                  background: "#F8F0FF", borderRadius: 6, padding: "3px 0",
                }}>
                  📱 フォロワー: {(snsFollowers || 0).toLocaleString()}人
                </div>
              )}

              {confirmId === key ? (
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn
                    color="sec"
                    onClick={() => setConfirmId(null)}
                    style={{ flex: 1, fontSize: 11, padding: "4px 6px" }}
                  >
                    キャンセル
                  </Btn>
                  <Btn
                    color="terra"
                    onClick={() => { onActivate(key); setConfirmId(null); }}
                    style={{ flex: 1, fontSize: 11, padding: "4px 6px" }}
                  >
                    実行する
                  </Btn>
                </div>
              ) : (
                <Btn
                  color="basil"
                  onClick={() => setConfirmId(key)}
                  disabled={disabled}
                  style={{ fontSize: 12, padding: "5px 8px" }}
                >
                  {isActive ? "実施中" : cantAfford ? "資金不足" : "実行"}
                </Btn>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom */}
      <div style={{
        padding: "10px 16px 14px",
        background: V.flour,
        borderTop: `1px solid ${V.birch}`,
      }}>
        <Btn color="sec" onClick={onBack}>← 戻る</Btn>
      </div>
    </div>
  );
}
