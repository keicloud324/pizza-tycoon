import { useState } from "react";
import { F, V } from "../../config/design.js";
import Btn from "../shared/Btn.jsx";

/* ── axis helpers ── */
const axisA = (h) => h > 300;
const axisB = (s) => s > 75;
const axisC = (c) => c > 3;
const axisD = (d, p) => d > 0 || p > 10;

function typeName(art, qual, loc, aud) {
  if (art && qual && loc && !aud) return "老舗の名店タイプ";
  if (!art && !qual && !loc && aud) return "フランチャイズ王タイプ";
  if (art && qual && !loc && aud) return "全国展開の匠タイプ";
  if (!art && qual && loc && !aud) return "地域密着コンサルタイプ";
  if (!art && !qual && loc && aud) return "攻めのローカルチェーンタイプ";
  /* fallback */
  if (art) return "こだわりピッツァイオーロタイプ";
  return "やり手オーナータイプ";
}

const TIER_ICON = { gold: "🥇", silver: "🥈", bronze: "🥉" };
const TIER_LABEL = { gold: "金", silver: "銀", bronze: "銅" };

/* ── Tab Components ── */

function DiagnosisTab({ stats }) {
  const art = axisA(stats.handmadePizzas);
  const qual = axisB(stats.avgSatisfaction);
  const loc = !axisC(stats.cityCount);
  const aud = axisD(stats.totalDebt, stats.promotionsUsed);

  const axes = [
    { left: "職人 (Artigiano)", right: "経営者 (Imprenditore)", isLeft: art },
    { left: "品質 (Qualità)", right: "コスパ (Economia)", isLeft: qual },
    { left: "地元 (Locale)", right: "全国 (Nazionale)", isLeft: loc },
    { left: "堅実 (Prudente)", right: "挑戦 (Audace)", isLeft: !aud },
  ];

  const name = typeName(art, qual, loc, aud);

  return (
    <div>
      <p style={{ fontFamily: F.d, fontSize: 20, color: V.oilLt, textAlign: "center", margin: "12px 0 16px" }}>
        経営タイプ診断
      </p>

      {axes.map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <span style={{
            flex: 1, textAlign: "right", fontFamily: F.b, fontSize: 12,
            color: a.isLeft ? V.oilLt : V.moon, opacity: a.isLeft ? 1 : 0.5,
          }}>{a.left}</span>

          <div style={{
            width: 80, height: 8, background: "rgba(255,255,255,0.12)",
            borderRadius: 4, margin: "0 8px", position: "relative",
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              background: V.oilLt, border: `2px solid ${V.moon}`,
              position: "absolute", top: -3,
              left: a.isLeft ? 4 : 58,
              transition: "left .3s",
            }} />
          </div>

          <span style={{
            flex: 1, textAlign: "left", fontFamily: F.b, fontSize: 12,
            color: !a.isLeft ? V.oilLt : V.moon, opacity: !a.isLeft ? 1 : 0.5,
          }}>{a.right}</span>
        </div>
      ))}

      <div style={{
        marginTop: 20, textAlign: "center", padding: 16,
        background: "rgba(155,89,182,0.15)", borderRadius: 12,
        border: `1px solid ${V.grape}`,
      }}>
        <p style={{ fontFamily: F.h, fontSize: 16, color: V.moon, marginBottom: 4 }}>
          あなたの経営タイプは…
        </p>
        <p style={{ fontFamily: F.d, fontSize: 22, color: V.oilLt, fontWeight: "bold" }}>
          {name}
        </p>
      </div>
    </div>
  );
}

function FourPTab({ stats }) {
  const items = [
    {
      label: "Product（製品）",
      icon: "🍕",
      desc: `ピザの手作り体験、${stats.customMenuCount}品のレシピ開発`,
    },
    {
      label: "Price（価格）",
      icon: "💰",
      desc: "メニュー価格設定で原価率との戦い",
    },
    {
      label: "Place（流通）",
      icon: "🏪",
      desc: `${stats.cityCount}都市に出店、拠点の特性を活かした経営`,
    },
    {
      label: "Promotion（販促）",
      icon: "📣",
      desc: `${stats.promotionsUsed}回の販促施策でお客を呼び込み`,
    },
  ];

  return (
    <div>
      <p style={{
        fontFamily: F.d, fontSize: 18, color: V.oilLt,
        textAlign: "center", margin: "12px 0 6px",
      }}>
        4P 振り返りレポート
      </p>
      <p style={{
        fontFamily: F.b, fontSize: 13, color: V.moon,
        textAlign: "center", marginBottom: 16, lineHeight: 1.6,
      }}>
        実はあなたがやっていたことは…<br />マーケティングの4Pでした！
      </p>

      {items.map((it, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          marginBottom: 10, padding: "8px 10px",
          background: "rgba(255,255,255,0.06)", borderRadius: 8,
        }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{it.icon}</span>
          <div>
            <p style={{ fontFamily: F.d, fontSize: 13, color: V.oilLt, marginBottom: 2 }}>
              {it.label}
            </p>
            <p style={{ fontFamily: F.b, fontSize: 12, color: V.moon, lineHeight: 1.5 }}>
              {it.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrophyTab({ trophies }) {
  if (!trophies || trophies.length === 0) {
    return (
      <p style={{ fontFamily: F.b, fontSize: 13, color: V.moon, textAlign: "center", marginTop: 24 }}>
        トロフィーはまだありません
      </p>
    );
  }

  return (
    <div>
      <p style={{ fontFamily: F.d, fontSize: 18, color: V.oilLt, textAlign: "center", margin: "12px 0 14px" }}>
        トロフィー一覧
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {trophies.map((t, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 10px", background: "rgba(255,255,255,0.06)",
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 22 }}>{t.trophy.icon}</span>
            <span style={{ fontSize: 18 }}>{TIER_ICON[t.tier]}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: F.b, fontSize: 13, color: V.moon }}>
                {t.trophy.name}
              </p>
              <p style={{ fontFamily: F.b, fontSize: 11, color: V.grape }}>
                {TIER_LABEL[t.tier]}ランク
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main ── */

const TAB_KEYS = ["診断", "4P振り返り", "トロフィー"];

export default function Ending({ stats, trophies, michelinStars, onRestart }) {
  const [tab, setTab] = useState(0);

  const starStr = michelinStars > 0 ? "⭐".repeat(michelinStars) : "—";

  return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(180deg,${V.night},${V.dusk})`,
      color: V.moon, padding: 16, boxSizing: "border-box",
    }}>
      {/* Header */}
      <p style={{
        fontFamily: F.d, fontSize: 26, color: V.oilLt,
        textAlign: "center", margin: "12px 0 4px",
      }}>
        Ending
      </p>
      <p style={{
        fontFamily: F.b, fontSize: 13, color: V.moon,
        textAlign: "center", marginBottom: 16,
      }}>
        おつかれさまでした！あなたのピザ経営の記録です
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {TAB_KEYS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flex: 1, padding: "6px 0", borderRadius: 6,
            border: "none", cursor: "pointer",
            background: tab === i ? V.grape : "rgba(255,255,255,0.08)",
            color: tab === i ? "#FFF" : V.moon,
            fontFamily: F.b, fontSize: 12, fontWeight: "bold",
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div style={{
        background: "rgba(255,255,255,0.04)", borderRadius: 12,
        padding: 14, marginBottom: 16, minHeight: 200,
      }}>
        {tab === 0 && <DiagnosisTab stats={stats} />}
        {tab === 1 && <FourPTab stats={stats} />}
        {tab === 2 && <TrophyTab trophies={trophies} />}
      </div>

      {/* Michelin Stars */}
      <div style={{
        textAlign: "center", marginBottom: 14, padding: "8px 0",
        background: "rgba(155,89,182,0.10)", borderRadius: 8,
      }}>
        <p style={{ fontFamily: F.d, fontSize: 13, color: V.oilLt }}>Michelin Stars</p>
        <p style={{ fontSize: 22, letterSpacing: 4 }}>{starStr}</p>
      </div>

      {/* Result Card */}
      <div style={{
        background: "rgba(255,255,255,0.06)", borderRadius: 12,
        padding: 14, marginBottom: 18,
      }}>
        <p style={{
          fontFamily: F.d, fontSize: 15, color: V.oilLt,
          textAlign: "center", marginBottom: 10,
        }}>
          リザルトカード
        </p>
        {[
          ["営業日数", `${stats.totalDays}日`],
          ["提供数", `${stats.totalServed}食`],
          ["総売上", `¥${stats.totalRevenue.toLocaleString()}`],
          ["店舗数", `${stats.storeCount}店舗`],
          ["スタッフ", `${stats.staffCount}人`],
          ["完璧な焼き", `${stats.perfectBakes}回`],
          ["平均満足度", `${stats.avgSatisfaction}%`],
        ].map(([k, v], i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between",
            padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ fontFamily: F.b, fontSize: 12, color: V.moon }}>{k}</span>
            <span style={{ fontFamily: F.b, fontSize: 12, color: V.oilLt }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Restart */}
      <Btn color="grape" onClick={onRestart} style={{ fontSize: 13, padding: "10px 0" }}>
        もう一度遊ぶ
      </Btn>
    </div>
  );
}
