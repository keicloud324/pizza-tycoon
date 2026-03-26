import { useEffect } from "react";
import { F, V } from "../../config/design.js";

const TIER_ICON = { bronze: "🥉", silver: "🥈", gold: "🥇" };

const popInKeyframes = `
@keyframes popIn {
  0%   { transform: scale(0.3); opacity: 0; }
  60%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes goldGlow {
  0%, 100% { box-shadow: 0 0 12px rgba(218,165,32,0.4); }
  50%      { box-shadow: 0 0 28px rgba(218,165,32,0.8); }
}
`;

export default function TrophyPopup({ trophy, tier, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <>
      <style>{popInKeyframes}</style>
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
          borderRadius: 16, padding: "24px 28px",
          textAlign: "center", minWidth: 200,
          animation: "popIn .4s ease-out, goldGlow 1.5s ease-in-out infinite",
        }}>
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 6 }}>
            {trophy.icon}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 8 }}>
            {TIER_ICON[tier]}
          </div>
          <p style={{
            fontFamily: F.d, fontSize: 18, color: V.oilLt,
            marginBottom: 4,
          }}>
            {trophy.name}
          </p>
          <p style={{
            fontFamily: F.b, fontSize: 14, color: V.moon,
          }}>
            トロフィー獲得！
          </p>
        </div>
      </div>
    </>
  );
}
