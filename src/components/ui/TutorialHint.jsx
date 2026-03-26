import { F, V } from "../../config/design.js";

export default function TutorialHint({ text, onDismiss }) {
  return (
    <div
      onClick={onDismiss}
      style={{
        position: "absolute", left: 0, right: 0, bottom: 60,
        display: "flex", justifyContent: "center",
        pointerEvents: "none", zIndex: 800,
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
