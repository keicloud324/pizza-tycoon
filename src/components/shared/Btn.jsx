import { F, V } from "../../config/design.js";

const bgs = {
  terra: `linear-gradient(180deg,${V.terra},${V.terraDk})`,
  basil: `linear-gradient(180deg,${V.basil},${V.basilDk})`,
  grape: `linear-gradient(180deg,${V.grape},#7D3C98)`,
  green: `linear-gradient(180deg,#4A7C3F,#3A6530)`,
  sec: V.mozz,
};

export default function Btn({ children, onClick, disabled, color = "terra", style: st = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "8px 14px", borderRadius: 10,
      border: color === "sec" ? `2px solid ${V.birch}` : "none",
      background: disabled ? "#CCC" : bgs[color],
      color: disabled ? "#999" : color === "sec" ? V.esp : "#FFF",
      fontFamily: F.b, fontSize: 13, fontWeight: "bold",
      cursor: disabled ? "default" : "pointer",
      width: "100%", ...st,
    }}>{children}</button>
  );
}
