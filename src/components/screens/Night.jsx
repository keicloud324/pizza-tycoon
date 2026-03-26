import { F, V } from "../../config/design.js";
import Btn from "../shared/Btn.jsx";

const reviewGood = ["最高のピザ！", "また来ます！", "文句なし★★★★★"];
const reviewMid  = ["まあまあかな", "普通のピザ", "可もなく不可もなく"];
const reviewBad  = ["うーん...", "期待はずれ", "もう来ないかも"];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function Night({ day, money, cityRent, data, level, onNext }) {
  const { nServed, rev, satLog, pStock, ingredientCost, staffCost } = data;

  const avg = satLog.length > 0
    ? Math.round(satLog.reduce((s, c) => s + c.sat, 0) / satLog.length)
    : 0;

  const profit = rev - ingredientCost - cityRent - staffCost;

  // Generate reviews: 25% chance per customer
  const reviews = satLog
    .filter(() => Math.random() < 0.25)
    .map((c) => {
      const text = c.sat > 80
        ? pickRandom(reviewGood)
        : c.sat > 50
          ? pickRandom(reviewMid)
          : pickRandom(reviewBad);
      return { icon: c.icon, name: c.name, sat: c.sat, text };
    });

  const breakdownItems = [
    { l: "売上",     v: rev,            c: V.basil, p: "+" },
    { l: "原材料",   v: ingredientCost, c: V.terra, p: "-" },
    { l: "家賃",     v: cityRent,       c: V.terra, p: "-" },
    { l: "人件費",   v: staffCost,      c: V.terra, p: "-" },
  ];

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      background: V.night,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(180deg, ${V.dusk}, ${V.night})`,
        padding: "7px 12px",
        borderBottom: `3px solid ${V.grape}`,
        flexShrink: 0, textAlign: "center",
      }}>
        <div style={{ fontFamily: F.b, color: V.moon, fontSize: 13 }}>
          🌙 Day {day} の振り返り
        </div>
        <div style={{ fontFamily: F.b, fontSize: 13, color: V.grape, marginTop: 2 }}>
          Lv.{level}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 14px" }}>

        {/* Profit display */}
        <div style={{
          textAlign: "center", marginBottom: 8, padding: "10px 0",
          background: `linear-gradient(135deg, ${V.dusk}, #3D2060)`,
          borderRadius: 10,
        }}>
          <div style={{ fontFamily: F.b, fontSize: 12, color: "#AAA" }}>本日の利益</div>
          <div style={{
            fontFamily: F.d, fontSize: 28, fontWeight: 700,
            color: profit > 0 ? V.basil : V.terra,
          }}>
            ¥{profit.toLocaleString()}
          </div>
        </div>

        {/* Breakdown */}
        <div style={{
          background: "rgba(255,255,255,.05)",
          borderRadius: 10, padding: 7, marginBottom: 8,
        }}>
          {breakdownItems.map((item, idx) => (
            <div key={idx} style={{
              display: "flex", justifyContent: "space-between",
              padding: "2px 4px",
              borderBottom: idx < breakdownItems.length - 1
                ? "1px solid rgba(255,255,255,.05)" : "none",
            }}>
              <span style={{ fontFamily: F.b, fontSize: 12, color: "#AAA" }}>
                {item.l}
              </span>
              <span style={{
                fontFamily: F.b, fontSize: 13, fontWeight: "bold", color: item.c,
              }}>
                {item.p}¥{item.v.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 4, marginBottom: 8,
        }}>
          {[
            { l: "提供", v: `${nServed}食`, i: "🍕" },
            { l: "満足度", v: `${avg}%`, i: avg > 70 ? "😊" : "😐" },
            { l: "生地残", v: `${pStock?.dough || 0}枚`, i: "🫓" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,.05)",
              borderRadius: 7, padding: "4px 2px", textAlign: "center",
            }}>
              <div style={{ fontSize: 13 }}>{s.i}</div>
              <div style={{
                fontFamily: F.b, fontSize: 13, fontWeight: "bold", color: V.moon,
              }}>{s.v}</div>
              <div style={{ fontFamily: F.b, fontSize: 10, color: "#888" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Customer voices */}
        {satLog.length > 0 && (
          <div style={{
            background: "rgba(255,255,255,.05)",
            borderRadius: 10, padding: 7, marginBottom: 8,
          }}>
            <div style={{
              fontFamily: F.b, fontSize: 13, fontWeight: "bold",
              color: V.moon, marginBottom: 3,
            }}>
              😊 お客様の声
            </div>
            {satLog.slice(-5).map((c, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "2px 0",
                borderBottom: i < Math.min(satLog.length, 5) - 1
                  ? "1px solid rgba(255,255,255,.05)" : "none",
              }}>
                <span style={{ fontSize: 14 }}>{c.icon}</span>
                <span style={{
                  fontFamily: F.b, fontSize: 12, color: V.moon, flex: 1,
                }}>
                  {c.name}
                  <span style={{ fontSize: 10, color: "#555", marginLeft: 3 }}>
                    {c.tag}
                  </span>
                </span>
                <span style={{
                  fontFamily: F.b, fontSize: 13, fontWeight: "bold",
                  color: c.sat > 70 ? V.basil : c.sat > 50 ? V.oil : V.terra,
                }}>
                  {c.sat}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div style={{
            background: "rgba(255,255,255,.05)",
            borderRadius: 10, padding: 7,
          }}>
            <div style={{
              fontFamily: F.b, fontSize: 13, fontWeight: "bold",
              color: V.moon, marginBottom: 3,
            }}>
              📝 レビュー
            </div>
            {reviews.slice(0, 5).map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "3px 0",
                borderBottom: i < Math.min(reviews.length, 5) - 1
                  ? "1px solid rgba(255,255,255,.05)" : "none",
              }}>
                <span style={{ fontSize: 14 }}>{r.icon}</span>
                <span style={{
                  fontFamily: F.b, fontSize: 12, color: V.moon, flex: 1,
                }}>
                  {r.name}
                </span>
                <span style={{
                  fontFamily: F.h, fontSize: 14,
                  color: r.sat > 80 ? V.basil : r.sat > 50 ? V.oilLt : V.terra,
                  fontStyle: "italic",
                }}>
                  「{r.text}」
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div style={{
        padding: "6px 12px",
        borderTop: `3px solid ${V.grape}`,
        background: V.night, flexShrink: 0,
      }}>
        <Btn onClick={() => onNext(profit)} color="grape">
          🌅 翌日へ → Day {day + 1}
        </Btn>
      </div>
    </div>
  );
}
