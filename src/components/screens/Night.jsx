import { useState, useEffect } from "react";
import { F, V } from "../../config/design.js";
import { UI_IMG, SFX2 } from "../../config/assets.js";
import { computeRanking } from "../../config/ranking.js";
import Btn from "../shared/Btn.jsx";

/* 星画像ベースの評価表示 */
function StarRating({ value, max = 5, size = 16 }) {
  const full = Math.floor(value);
  return (
    <span style={{ display: "inline-flex", gap: 1, verticalAlign: "middle" }}>
      {Array.from({ length: max }, (_, i) => (
        <img key={i} src={i < full ? UI_IMG.starFull : UI_IMG.starEmpty}
          width={size} height={size} style={{ imageRendering: "auto" }} />
      ))}
    </span>
  );
}

/* #139: 拡張���ビューテキスト */
const reviewGood = ["最高のピザ！", "また来ます！", "文句なし★★★★★", "焼��加減が最高", "コスパ最高！"];
const reviewMid  = ["まあまあかな", "普通のピザ", "可もなく不可もなく", "もう少し早ければ...", "悪くないけど..."];
const reviewBad  = ["うーん...", "期待はずれ", "もう来ないかも", "ちょっと高いかな...", "ちょっと焦げてた..."];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const satToStars = (pct) => (Math.round(pct / 20 * 10) / 10).toFixed(1);

export default function Night({ day, money, cityRent, data, level, onNext,
  totalRevenue, totalServed, customMenus,
  michelinStars, consecutiveHighSatDays, michelinPhase, audio,
}) {
  const [showRanking, setShowRanking] = useState(false);
  const { nServed, rev, satLog, pStock, ingredientCost, staffCost } = data;

  // #143: 振り返り画面表示時に売上SE
  useEffect(() => {
    if (rev > 0) audio?.playSe(SFX2.cashCount);
  }, []);

  const avg = satLog.length > 0
    ? Math.round(satLog.reduce((s, c) => s + c.sat, 0) / satLog.length)
    : 0;

  const profit = rev - ingredientCost - cityRent - staffCost;

  // 廃棄食材の計算（金額換算付き）
  const wastePrices = { dough: 32, sauce: 200, mozz_block: 83, salami_log: 60, shrimp_pack: 75, olive_jar: 15 };
  const wasteItems = [];
  if (pStock?.dough > 0) wasteItems.push({ name: "生地", qty: pStock.dough, unit: "枚", icon: "🫓", cost: pStock.dough * wastePrices.dough });
  if (pStock?.sauce > 0) wasteItems.push({ name: "ソース", qty: pStock.sauce, unit: "食分", icon: "🍅", cost: pStock.sauce * wastePrices.sauce });
  if (pStock?.mozz_block > 0) wasteItems.push({ name: "チーズ", qty: pStock.mozz_block, unit: "枚", icon: "🧀", cost: pStock.mozz_block * wastePrices.mozz_block });
  if (pStock?.salami_log > 0) wasteItems.push({ name: "サラミ", qty: pStock.salami_log, unit: "枚", icon: "🥩", cost: pStock.salami_log * wastePrices.salami_log });
  if (pStock?.shrimp_pack > 0) wasteItems.push({ name: "エビ", qty: pStock.shrimp_pack, unit: "尾", icon: "🦐", cost: pStock.shrimp_pack * wastePrices.shrimp_pack });
  if (pStock?.olive_jar > 0) wasteItems.push({ name: "オリーブ", qty: pStock.olive_jar, unit: "個", icon: "🫒", cost: pStock.olive_jar * wastePrices.olive_jar });
  const totalWasteCost = wasteItems.reduce((s, w) => s + (w.cost || 0), 0);

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
      background: V.flour,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(180deg, ${V.walnut}, ${V.walnutDk})`,
        padding: "7px 12px",
        borderBottom: `3px solid ${V.birch}`,
        flexShrink: 0, textAlign: "center",
      }}>
        <div style={{ fontFamily: F.b, color: "#FFF", fontSize: 13 }}>
          🌙 Day {day} の振り返り
        </div>
        <div style={{ fontFamily: F.b, fontSize: 13, color: V.birch, marginTop: 2 }}>
          Lv.{level}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 14px" }}>

        {/* Profit display */}
        <div style={{
          textAlign: "center", marginBottom: 8, padding: "10px 0",
          background: `linear-gradient(135deg, ${V.walnut}, ${V.walnutDk})`,
          borderRadius: 10,
        }}>
          <div style={{ fontFamily: F.b, fontSize: 12, color: V.birch }}>本日の利益</div>
          <div style={{
            fontFamily: F.d, fontSize: 28, fontWeight: 700,
            color: profit > 0 ? V.basil : V.terra,
          }}>
            ¥{profit.toLocaleString()}
          </div>
        </div>

        {/* Breakdown */}
        <div style={{
          background: "#FFF", border: `1px solid ${V.birch}`,
          borderRadius: 10, padding: 7, marginBottom: 8,
        }}>
          {breakdownItems.map((item, idx) => (
            <div key={idx} style={{
              display: "flex", justifyContent: "space-between",
              padding: "2px 4px",
              borderBottom: idx < breakdownItems.length - 1
                ? `1px solid ${V.birch}22` : "none",
            }}>
              <span style={{ fontFamily: F.b, fontSize: 12, color: V.oak }}>
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
            { l: "満足度", v: satToStars(avg), i: "star", starVal: Math.round(avg / 20) },
          ].map((s, i) => (
            <div key={i} style={{
              background: "#FFF", border: `1px solid ${V.birch}`,
              borderRadius: 7, padding: "4px 2px", textAlign: "center",
            }}>
              <div style={{ fontSize: 13 }}>{s.i === "star" ? <StarRating value={s.starVal} size={12} /> : s.i}</div>
              <div style={{
                fontFamily: F.b, fontSize: 13, fontWeight: "bold", color: V.esp,
              }}>{s.i === "star" ? `★${s.v}` : s.v}</div>
              <div style={{ fontFamily: F.b, fontSize: 10, color: V.oak }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Customer voices (高評価のみ表示 — 低評価は無言で退店) */}
        {satLog.filter(c => c.sat > 50).length > 0 && (
          <div style={{
            background: "#FFF", border: `1px solid ${V.birch}`,
            borderRadius: 10, padding: 7, marginBottom: 8,
          }}>
            <div style={{
              fontFamily: F.b, fontSize: 13, fontWeight: "bold",
              color: V.esp, marginBottom: 3,
            }}>
              😊 お客様の声
            </div>
            {satLog.filter(c => c.sat > 50).slice(-5).map((c, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "2px 0",
                borderBottom: i < Math.min(satLog.length, 5) - 1
                  ? `1px solid ${V.birch}22` : "none",
              }}>
                <span style={{ fontSize: 14 }}>{c.icon}</span>
                <span style={{
                  fontFamily: F.b, fontSize: 12, color: V.esp, flex: 1,
                }}>
                  {c.name}
                  <span style={{ fontSize: 10, color: V.oak, marginLeft: 3 }}>
                    {c.tag}
                  </span>
                </span>
                <span style={{
                  fontFamily: F.b, fontSize: 13, fontWeight: "bold",
                  color: c.sat > 70 ? V.basil : c.sat > 50 ? V.oil : V.terra,
                }}>
                  ★{satToStars(c.sat)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div style={{
            background: "#FFF", border: `1px solid ${V.birch}`,
            borderRadius: 10, padding: 7,
          }}>
            <div style={{
              fontFamily: F.b, fontSize: 13, fontWeight: "bold",
              color: V.esp, marginBottom: 3,
            }}>
              📝 レビュー
            </div>
            {reviews.slice(0, 5).map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "3px 0",
                borderBottom: i < Math.min(reviews.length, 5) - 1
                  ? `1px solid ${V.birch}22` : "none",
              }}>
                <span style={{ fontSize: 14 }}>{r.icon}</span>
                <span style={{
                  fontFamily: F.b, fontSize: 12, color: V.esp, flex: 1,
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

        {/* #139: 口コミ影響バナー */}
        {satLog.length > 0 && (
          <div style={{
            background: avg >= 80 ? "#E8F5E9" : avg < 60 ? "#FFEBEE" : "#FFF8E1",
            border: `1px solid ${avg >= 80 ? V.basil : avg < 60 ? V.terra : V.oil}`,
            borderRadius: 10, padding: 7, marginTop: 8, marginBottom: 8, textAlign: "center",
          }}>
            <div style={{ fontFamily: F.b, fontSize: 12, color: V.esp }}>
              {avg >= 80 ? "📈 口コミ効果: 明日の来客数 +10%" : avg < 60 ? "📉 口コミ効果: 明日の来客数 -10%" : "➡️ 口コミ: 明日の来客数に変化なし"}
            </div>
          </div>
        )}

        {/* #139: ミシュラン進捗 */}
        {michelinPhase && (
          <div style={{
            background: "#FFF", border: `1px solid ${V.oil}`,
            borderRadius: 10, padding: 7, marginBottom: 8,
          }}>
            <div style={{ fontFamily: F.b, fontSize: 13, fontWeight: "bold", color: V.esp, marginBottom: 4 }}>
              ⭐ ミシュラン {michelinStars > 0 ? `${"★".repeat(michelinStars)}獲得！` : "挑戦中"}
            </div>
            {michelinStars < 1 && (
              <div style={{ fontFamily: F.b, fontSize: 11, color: V.oak }}>
                ★1つ星まで: 高評価(★4.0以上) {consecutiveHighSatDays || 0}/7日連続
              </div>
            )}
            {michelinStars === 1 && (
              <div style={{ fontFamily: F.b, fontSize: 11, color: V.oak }}>
                ★★2つ星まで: 高評価(★4.5以上) {consecutiveHighSatDays || 0}/14日連続 + メニュー5品以上
              </div>
            )}
            {michelinStars === 2 && (
              <div style={{ fontFamily: F.b, fontSize: 11, color: V.oak }}>
                ★★★3つ星まで: 最高評価(★4.8以上) {consecutiveHighSatDays || 0}/30日連続 + メニュー10品以上 + 全都市制覇
              </div>
            )}
            <div style={{
              height: 6, borderRadius: 3, background: V.flour, overflow: "hidden", marginTop: 4,
            }}>
              <div style={{
                height: "100%", borderRadius: 3, background: V.oil,
                width: `${Math.min(100, (consecutiveHighSatDays || 0) / (michelinStars < 1 ? 7 : michelinStars === 1 ? 14 : 30) * 100)}%`,
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        )}

        {/* 今日の廃棄 */}
        {wasteItems.length > 0 && (
          <div style={{
            background: "#FFF8E1", border: `1px solid ${V.oil}`,
            borderRadius: 10, padding: 7, marginTop: 8,
          }}>
            <div style={{
              fontFamily: F.b, fontSize: 13, fontWeight: "bold",
              color: V.terra, marginBottom: 3,
            }}>
              🗑️ 今日の廃棄
            </div>
            {wasteItems.map((w, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "2px 0",
                fontFamily: F.b, fontSize: 12, color: V.esp,
              }}>
                <span>{w.icon}</span>
                <span style={{ flex: 1 }}>{w.name} {w.qty}{w.unit}</span>
                <span style={{ fontSize: 11, color: V.terra }}>¥{(w.cost || 0).toLocaleString()}</span>
              </div>
            ))}
            {totalWasteCost > 0 && (
              <div style={{
                fontFamily: F.b, fontSize: 13, fontWeight: "bold",
                color: V.terra, textAlign: "right", marginTop: 3,
                borderTop: `1px solid ${V.oil}`, paddingTop: 3,
              }}>
                合計廃棄コスト: ¥{totalWasteCost.toLocaleString()}
              </div>
            )}
          </div>
        )}
        {/* ランキング (#101) */}
        {(() => {
          const menuCount = (customMenus || []).length;
          const ranking = computeRanking(day, totalRevenue || 0, avg, totalServed || 0, menuCount);
          const me = ranking.find(r => r.isPlayer);
          const prevRanking = computeRanking(day - 1, (totalRevenue || 0) - rev, avg, (totalServed || 0) - nServed, menuCount);
          const prevMe = prevRanking.find(r => r.isPlayer);
          const diff = prevMe ? prevMe.rank - me.rank : 0;
          return (
            <div style={{
              background: "#FFF", border: `1px solid ${V.birch}`,
              borderRadius: 10, padding: 7, marginTop: 8,
            }}>
              <div
                onClick={() => setShowRanking(s => !s)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              >
                <div>
                  <span style={{ fontFamily: F.b, fontSize: 13, fontWeight: "bold", color: V.esp }}>
                    📊 総合: {me?.rank || "?"}位
                    {diff > 0 && <span style={{ color: V.basil, marginLeft: 4 }}>▲{diff}</span>}
                    {diff < 0 && <span style={{ color: V.terra, marginLeft: 4 }}>▼{Math.abs(diff)}</span>}
                    <span style={{ color: V.oak, fontWeight: "normal", marginLeft: 6 }}>
                      スコア: {Math.round(me?.score || 0)}pt
                    </span>
                  </span>
                  <div style={{ fontFamily: F.b, fontSize: 9, color: "#999", marginTop: 1 }}>
                    売上・満足度・来客数・メニュー数から算出
                  </div>
                </div>
                <span style={{ fontSize: 10, color: V.oak }}>{showRanking ? "▲" : "▼"}</span>
              </div>
              {showRanking && (
                <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 4 }}>
                  {(() => {
                    // #115: 自分の前後15店を表示
                    const myIdx = ranking.findIndex(r => r.isPlayer);
                    const start = Math.max(0, Math.min(myIdx - 15, ranking.length - 31));
                    return ranking.slice(start, start + 31);
                  })().map(r => (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "2px 0", borderBottom: `1px solid ${V.birch}22`,
                      fontFamily: F.b, fontSize: 11,
                      background: r.isPlayer ? "#FFF8EE" : "transparent",
                      fontWeight: r.isPlayer || r.isRival ? "bold" : "normal",
                    }}>
                      <span style={{ width: 24, textAlign: "right", color: V.oak }}>{r.rank}.</span>
                      <span style={{ fontSize: 12 }}>{r.icon || "🏠"}</span>
                      <span style={{ flex: 1, color: r.isPlayer ? V.terra : r.isRival ? V.basil : V.esp }}>
                        {r.name}
                      </span>
                      <span style={{ color: V.oak }}>{Math.round(r.score)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Bottom button */}
      <div style={{
        padding: "6px 12px",
        borderTop: `3px solid ${V.birch}`,
        background: V.flour, flexShrink: 0,
      }}>
        <Btn onClick={() => onNext(profit)} color="basil">
          🌅 翌日へ → Day {day + 1}
        </Btn>
      </div>
    </div>
  );
}
