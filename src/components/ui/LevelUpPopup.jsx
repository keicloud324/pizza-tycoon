import { useEffect } from "react";
import { F, V } from "../../config/design.js";

const keyframes = `
@keyframes popIn {
  0%   { transform: scale(0.3); opacity: 0; }
  60%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}
`;

export default function LevelUpPopup({ level, label, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <>
      <style>{keyframes}</style>
      <div
        onClick={onDismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.55)",
        }}
      >
        <div style={{
          background: `linear-gradient(180deg,${V.night},${V.dusk})`,
          border: `2px solid ${V.oilLt}`,
          borderRadius: 16, padding: "26px 32px",
          textAlign: "center", minWidth: 200,
          animation: "popIn .4s ease-out, pulse 1.2s ease-in-out .4s infinite",
        }}>
          <p style={{
            fontFamily: F.d, fontSize: 28, color: V.oil,
            margin: "0 0 6px",
          }}>
            Level Up!
          </p>
          <p style={{
            fontFamily: F.d, fontSize: 36, color: V.oilLt,
            margin: "0 0 10px", fontWeight: "bold",
          }}>
            Lv.{level}
          </p>
          <p style={{
            fontFamily: F.b, fontSize: 14, color: V.moon,
            margin: 0, lineHeight: 1.5,
          }}>
            {label}
          </p>
        </div>
      </div>
    </>
  );
}
