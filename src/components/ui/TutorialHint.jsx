import { useState, useEffect } from "react";
import { F, V } from "../../config/design.js";
import Btn from "../shared/Btn.jsx";

/* #145: mode="hint" (自動消去) / mode="modal" (OK!ボタン付きブロッキング) */
export default function TutorialHint({ mode = "hint", text, title, icon, btn, onDismiss }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (mode !== "hint") return;
    const fadeTimer = setTimeout(() => setFading(true), 2500);
    const dismissTimer = setTimeout(onDismiss, 3500);
    return () => { clearTimeout(fadeTimer); clearTimeout(dismissTimer); };
  }, [onDismiss, mode]);

  /* ── Modal mode ── */
  if (mode === "modal") {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 900,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
      }}>
        <div style={{
          background: `linear-gradient(180deg, ${V.night}, ${V.dusk})`,
          border: `2px solid ${V.grape}`,
          borderRadius: 16, padding: "20px 24px",
          maxWidth: 320, width: "85vw",
          textAlign: "center",
          animation: "popIn 0.4s ease-out",
        }}>
          {icon && (
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }}>{icon}</div>
          )}
          {title && (
            <p style={{
              fontFamily: F.d, fontSize: 17, color: V.oilLt,
              marginBottom: 8, fontWeight: 700,
            }}>
              {title}
            </p>
          )}
          <p style={{
            fontFamily: F.b, fontSize: 13,
            color: V.moon, lineHeight: 1.7,
            whiteSpace: "pre-line", margin: "0 0 14px",
            textAlign: "left",
          }}>
            {text}
          </p>
          <Btn onClick={onDismiss}>{btn || "OK!"}</Btn>
        </div>
      </div>
    );
  }

  /* ── Hint mode (auto-dismiss) ── */
  return (
    <div
      onClick={onDismiss}
      style={{
        position: "absolute", left: 0, right: 0, bottom: 60,
        display: "flex", justifyContent: "center",
        pointerEvents: "none", zIndex: 800,
        opacity: fading ? 0 : 1,
        transition: "opacity 1s ease-out",
      }}
    >
      <div style={{
        pointerEvents: "auto",
        background: "rgba(26,16,48,0.85)",
        border: `1px solid ${V.grape}`,
        borderRadius: 10,
        padding: "10px 18px",
        maxWidth: 320,
      }}>
        <p style={{
          fontFamily: F.b, fontSize: 13,
          color: V.moon, lineHeight: 1.6,
          textAlign: "center", margin: 0,
        }}>
          {text}
        </p>
      </div>
    </div>
  );
}
