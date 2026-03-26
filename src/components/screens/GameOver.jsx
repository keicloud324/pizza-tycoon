import { F, V } from "../../config/design.js";
import Btn from "../shared/Btn.jsx";

const slideInKeyframes = `
@keyframes slideIn {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

export default function GameOver({ day, totalServed, totalRevenue, cityName, onRestart, onTitle }) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: V.night, color: V.moon, boxSizing: "border-box",
    }}>
      <style>{slideInKeyframes}</style>

      {/* Header */}
      <div style={{
        background: `linear-gradient(180deg,${V.dusk},${V.night})`,
        padding: "18px 16px 14px", textAlign: "center",
      }}>
        <p style={{
          fontFamily: F.b, fontSize: 13, color: "#FFF", margin: 0,
        }}>
          🌙 閉店のお知らせ
        </p>
      </div>

      {/* Center content */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "16px 20px", gap: 16,
      }}>
        <p style={{
          fontFamily: F.d, fontSize: 28, color: V.terra,
          margin: 0, fontWeight: "bold", letterSpacing: 2,
        }}>
          GAME OVER
        </p>

        <p style={{
          fontFamily: F.b, fontSize: 14, color: V.moon,
          margin: 0, textAlign: "center", lineHeight: 1.6,
        }}>
          残念ながら、お店を続けることができなくなりました...
        </p>

        {/* Stats card */}
        <div style={{
          width: "100%", maxWidth: 280,
          background: "rgba(255,255,255,0.06)", borderRadius: 12,
          padding: 14,
          animation: "slideIn 0.6s ease-out both",
        }}>
          {[
            ["営業日数", `${day}日`],
            ["累計提供", `${totalServed}食`],
            ["累計売上", `¥${totalRevenue.toLocaleString()}`],
            ["拠点", cityName],
          ].map(([k, v], i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "5px 0",
              borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <span style={{ fontFamily: F.b, fontSize: 14, color: V.moon }}>{k}</span>
              <span style={{ fontFamily: F.b, fontSize: 14, color: V.oilLt }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom buttons */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn color="terra" onClick={onRestart}>
          🔄 同じ拠点でやり直す
        </Btn>
        <Btn color="sec" onClick={onTitle}>
          🏠 タイトルに戻る
        </Btn>
      </div>
    </div>
  );
}
