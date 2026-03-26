import { F, V } from "../../config/design.js";
import { CITIES } from "../../config/cities.js";
import Btn from "../shared/Btn.jsx";

export default function Morning({
  day, money, cityId, level, totalServed, totalRevenue,
  nextLevelInfo, activeEvents, activeRivals, debt, warnings,
  michelinPhase,
  onNext, onMenuDev, onPromotion, onStaff, onMultiStore, unlockedFeatures,
}) {
  const city = CITIES[cityId];
  const weather = ["☀️ 晴れ", "☁️ 曇り", "🌧️ 雨"][day % 3];
  const dayN = ["月", "火", "水", "木", "金", "土", "日"][(day - 1) % 7] + "曜日";
  const ev = [null, "🎓 大学で学園祭", null, "🏟️ サッカー試合", null, null, "🎪 商店街セール"][(day - 1) % 7];

  const nl = nextLevelInfo || {};
  const progressPct = Math.min(100, Math.round((nl.progress || 0) * 100));

  const card = {
    background: "#FFF",
    border: `1px solid ${V.birch}`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: V.flour }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${V.walnut}, ${V.walnutDk})`,
        padding: "14px 16px",
        textAlign: "center",
      }}>
        <div style={{ fontFamily: F.d, fontSize: 18, color: "#FFF" }}>
          🌅 Day {day} — おはようございます
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>

        {/* Day info card */}
        <div style={card}>
          <div style={{ fontFamily: F.d, fontSize: 24, color: V.esp }}>Day {day}</div>
          <div style={{ fontFamily: F.h, fontSize: 18, color: V.oak, marginBottom: 6 }}>Buongiorno!</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: F.d, fontSize: 20, color: V.basil }}>
              ¥{money.toLocaleString()}
            </span>
            <span style={{
              fontFamily: F.d, fontSize: 16, color: "#FFF",
              background: V.terra, borderRadius: 8, padding: "2px 10px",
            }}>
              Lv.{level}
            </span>
          </div>
          {debt > 0 && (
            <div style={{ fontFamily: F.b, fontSize: 13, color: V.tomato, marginTop: 4 }}>
              借金: ¥{debt.toLocaleString()}
            </div>
          )}
        </div>

        {/* Level progress card */}
        {nl.nextLabel && (
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{
                fontFamily: F.d, fontSize: 13, color: "#FFF",
                background: V.oil, borderRadius: 8, padding: "2px 8px",
              }}>
                Lv.{level}
              </span>
              <span style={{ fontFamily: F.b, fontSize: 13, color: V.oak }}>
                → {nl.nextLabel}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{
              height: 10, borderRadius: 5,
              background: V.flour, overflow: "hidden", marginBottom: 6,
            }}>
              <div style={{
                height: "100%", width: `${progressPct}%`,
                background: V.terra, borderRadius: 5,
                transition: "width 0.3s",
              }} />
            </div>
            <div style={{ fontFamily: F.b, fontSize: 14, color: V.oak, display: "flex", justifyContent: "space-between" }}>
              {nl.servedNeeded != null && (
                <span>あと{Math.max(0, nl.servedNeeded - (totalServed || 0))}食</span>
              )}
              {nl.revenueNeeded != null && (
                <span>あと¥{Math.max(0, nl.revenueNeeded - (totalRevenue || 0)).toLocaleString()}</span>
              )}
            </div>
          </div>
        )}

        {/* Today's info card */}
        <div style={card}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
            fontFamily: F.b, fontSize: 14, color: V.esp,
          }}>
            <div style={{ textAlign: "center", padding: 6, background: V.flour, borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: V.oak, marginBottom: 2 }}>曜日</div>
              <div>{dayN}</div>
            </div>
            <div style={{ textAlign: "center", padding: 6, background: V.flour, borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: V.oak, marginBottom: 2 }}>天気</div>
              <div>{weather}</div>
            </div>
          </div>
          {ev && (
            <div style={{
              marginTop: 8, fontFamily: F.b, fontSize: 13,
              color: V.oil, textAlign: "center",
            }}>
              {ev}
            </div>
          )}
        </div>

        {/* Day 1 hint */}
        {day === 1 && (
          <div style={{ background: "#E3F2FD", borderRadius: 12, padding: 10, border: "2px solid #90CAF9", marginBottom: 10 }}>
            <div style={{ fontFamily: F.b, fontSize: 14, color: "#1565C0", fontWeight: "bold" }}>💡 初日のヒント</div>
            <div style={{ fontFamily: F.b, fontSize: 13, color: "#333", marginTop: 4 }}>今日は約2〜3食分の注文が来ます。生地3枚・ソース3食分を仕込みましょう！</div>
          </div>
        )}

        {/* Michelin banner */}
        {michelinPhase && (
          <div style={{
            ...card,
            background: "linear-gradient(135deg, #FFF8E1, #FFF3C4)",
            border: "2px solid #FFD54F",
          }}>
            <div style={{ fontFamily: F.b, fontSize: 14, color: "#F57F17", fontWeight: "bold" }}>
              🎩 ミシュラン調査員が来るかもしれません...
            </div>
            <div style={{ fontFamily: F.b, fontSize: 12, color: "#888", marginTop: 2 }}>
              最高の品質とサービスで星を獲得しましょう！
            </div>
          </div>
        )}

        {/* Event banner */}
        {activeEvents && activeEvents.length > 0 && (
          <div style={{
            ...card,
            background: "#FFF8DC",
            border: `1px solid ${V.oilLt}`,
          }}>
            <div style={{ fontFamily: F.b, fontSize: 13, color: V.oil, marginBottom: 4 }}>
              📢 本日のイベント
            </div>
            {activeEvents.map((evt, i) => (
              <div key={i} style={{ fontFamily: F.b, fontSize: 13, color: V.esp, marginBottom: 2 }}>
                {evt.icon || "🎉"} {evt.name}{evt.effectDesc ? ` — ${evt.effectDesc}` : ""}
              </div>
            ))}
          </div>
        )}

        {/* Rival alert */}
        {activeRivals && activeRivals.length > 0 && (
          <div style={{
            ...card,
            background: "#FFF0F0",
            border: `1px solid ${V.tomato}`,
          }}>
            <div style={{ fontFamily: F.b, fontSize: 13, color: V.tomato, marginBottom: 4 }}>
              ⚔️ ライバル情報
            </div>
            {activeRivals.map((r, i) => (
              <div key={i} style={{ fontFamily: F.b, fontSize: 13, color: V.esp, marginBottom: 2 }}>
                {r.icon || "🍕"} {r.name} — {r.behavior}
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div style={{
            ...card,
            background: "#FFE0E0",
            border: `1px solid ${V.tomato}`,
          }}>
            {warnings.map((w, i) => (
              <div key={i} style={{ fontFamily: F.b, fontSize: 14, color: V.tomato }}>
                {w}
              </div>
            ))}
          </div>
        )}

        {/* City info */}
        {city && (
          <div style={{
            fontFamily: F.b, fontSize: 14, color: V.oak,
            textAlign: "center", padding: "4px 0",
          }}>
            {city.icon} {city.name} ｜ 家賃 ¥{city.rent.toLocaleString()}/日
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div style={{
        padding: "10px 16px 14px",
        background: V.flour,
        borderTop: `1px solid ${V.birch}`,
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <Btn onClick={onNext}>🏪 マルシェへ仕入れに行く</Btn>

        {unlockedFeatures && unlockedFeatures.has("menuDev") && (
          <Btn color="sec" onClick={onMenuDev}>📖 メニュー開発</Btn>
        )}
        {unlockedFeatures && unlockedFeatures.has("promotions") && (
          <Btn color="sec" onClick={onPromotion}>📣 販促</Btn>
        )}
        {unlockedFeatures && (unlockedFeatures.has("hallStaff") || unlockedFeatures.has("kitchenStaff")) && (
          <Btn color="sec" onClick={onStaff}>👥 スタッフ</Btn>
        )}
        {onMultiStore && (
          <Btn color="sec" onClick={onMultiStore}>🏪 店舗管理</Btn>
        )}
      </div>
    </div>
  );
}
