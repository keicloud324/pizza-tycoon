export default function SalamiCSS({ size, style: st = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "radial-gradient(circle at 40% 35%,#E04030,#B22020)",
      position: "relative", boxShadow: "inset 0 -2px 4px rgba(0,0,0,.2)", ...st,
    }}>
      {[{ x: 30, y: 25, s: 4 }, { x: 55, y: 40, s: 3 }, { x: 40, y: 60, s: 5 }, { x: 65, y: 20, s: 3 }, { x: 20, y: 50, s: 4 }].map((d, i) =>
        <div key={i} style={{
          position: "absolute", left: `${d.x}%`, top: `${d.y}%`,
          width: d.s, height: d.s, borderRadius: "50%", background: "rgba(255,255,255,.6)",
        }} />
      )}
    </div>
  );
}
