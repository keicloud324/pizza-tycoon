import { F, V } from "../../config/design.js";

export default function EventBanner({ event }) {
  const isNegative = event.type === "negative";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 12px",
      background: isNegative
        ? "linear-gradient(90deg, rgba(212,57,43,0.18), rgba(212,57,43,0.06))"
        : "linear-gradient(90deg, rgba(218,165,32,0.22), rgba(218,165,32,0.08))",
      border: `1px solid ${isNegative ? V.tomato : V.oilLt}`,
      borderRadius: 8,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
        {event.icon}
      </span>
      <span style={{
        fontFamily: F.b, fontSize: 12, color: V.esp,
        fontWeight: "bold", flexShrink: 0,
      }}>
        {event.name}
      </span>
      <span style={{
        fontFamily: F.b, fontSize: 12, color: V.walnut,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {event.effectDesc}
      </span>
    </div>
  );
}
