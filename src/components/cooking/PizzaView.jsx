import { COOK } from "../../config/cooking.js";

export default function PizzaView({ pizzaData, cx, cy, baked, scale = 1 }) {
  const { doughVertices, sauceType, sauceBlobs, cheeses, toppings, honeyDrops, oilDrops, bakeLevel } = pizzaData;
  const points = doughVertices.map((r, i) => {
    const angle = (i / doughVertices.length) * Math.PI * 2 - Math.PI / 2;
    return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`;
  }).join(" ");

  const sauceColor = COOK.sauceTypes[sauceType]?.color || "#D4392B";
  const bk = baked ? (bakeLevel || 0) : 0;
  const doughFill = bk > 0 ? `hsl(35,${60 + bk * 10}%,${72 - bk * 18}%)` : "#F0DDB0";
  const filter = bk > 0.5 ? `saturate(${1 - bk * 0.3}) brightness(${1 - bk * 0.15})` : "none";

  return (
    <g>
      <polygon points={points} fill={doughFill} stroke="#C9A06C" strokeWidth={2 * scale} />
      {sauceBlobs.map((b, i) =>
        <ellipse key={`s${i}`} cx={cx + (b.x - cx) * scale * 0.9} cy={cy + (b.y - cy) * scale * 0.9}
          rx={b.rx * scale} ry={b.ry * scale} fill={sauceColor} opacity={b.opacity} style={{ filter }} />
      )}
      {cheeses.map((c, i) => {
        const col = COOK.cheeseTypes[c.type]?.color || "#FFF9C4";
        const w = (bk > 0 ? COOK.cheeseW * (1 + bk * 0.15) : COOK.cheeseW) * scale;
        const h = (bk > 0 ? COOK.cheeseH * (1 + bk * 0.15) : COOK.cheeseH) * scale;
        return (
          <ellipse key={`c${i}`} cx={cx + (c.x - cx) * scale} cy={cy + (c.y - cy) * scale} rx={w / 2} ry={h / 2}
            fill={bk > 0 ? `color-mix(in srgb, ${col} ${100 - bk * 20}%, #F0C860)` : col}
            opacity={0.85} style={{ filter }} />
        );
      })}
      {toppings.map((t, i) => {
        const def = COOK.toppings[t.type];
        if (!def) return null;
        const tx = cx + (t.x - cx) * scale;
        const ty = cy + (t.y - cy) * scale;
        const sz = (def.size || 24) * scale;
        if (def.type === "emoji") return (
          <text key={`t${i}`} x={tx} y={ty} fontSize={sz} textAnchor="middle" dominantBaseline="central"
            transform={`rotate(${t.rotation},${tx},${ty})`} style={{ filter }}>{def.emoji}</text>
        );
        return null;
      })}
      {honeyDrops.map((d, i) =>
        <circle key={`h${i}`} cx={cx + (d.x - cx) * scale} cy={cy + (d.y - cy) * scale}
          r={d.size * scale} fill="#DAA520" opacity={0.7} style={{ filter }} />
      )}
      {(oilDrops || []).map((d, i) =>
        <circle key={`o${i}`} cx={cx + (d.x - cx) * scale} cy={cy + (d.y - cy) * scale}
          r={d.size * scale} fill={COOK.oilColor} opacity={0.5} />
      )}
    </g>
  );
}
