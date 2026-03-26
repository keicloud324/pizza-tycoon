export default function AnchovyCSS({ style: st = {} }) {
  return (
    <div style={{
      width: 30, height: 12, borderRadius: "6px/4px",
      background: "linear-gradient(90deg,#7B5530,#5A3A1A,#7B5530)",
      boxShadow: "inset 0 1px 2px rgba(255,255,255,.15)", ...st,
    }} />
  );
}
