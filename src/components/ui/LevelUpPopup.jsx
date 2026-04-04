import { useEffect } from "react";
import { F, V } from "../../config/design.js";
import Btn from "../shared/Btn.jsx";

const UNLOCK_LABELS = {
  genoveseSauce: "ジェノベーゼソースが仕込めるように！",
  cheddar: "チェダーチーズがマルシェに入荷！",
  menuDev: "オリジナルメニュー開発が可能に！",
  hallStaff: "ホールスタッフを雇えるように！",
  tables8: "テーブルが8席に拡張！",
  promotions: "販促キャンペーンが利用可能に！",
  rivalPizzasso: "ライバル「ピザッソ」が出現…！",
  whiteSauce: "ホワイトソースが仕込めるように！",
  gorgonzola: "ゴルゴンゾーラチーズが入荷！",
  wholeWheatDough: "全粒粉生地が使えるように！",
  kitchenStaff: "調理スタッフを雇えるように！",
  tables10: "テーブルが10席に拡張！",
  rivalNapoli: "ライバル「ナポリの風」が出現…！",
  soySauce: "和風醤油ソースが仕込めるように！",
  delivery: "デリバリー（準備中）",
  multiStore: "多店舗経営が可能に！",
  foodFestival: "フードフェスイベント解放！",
  rivalPizzaLab: "ライバル「ピザラボ」が出現…！",
  michelin: "ミシュラン評価フェーズ開始！",
};

// 紙吹雪CSS
const confettiStyle = `
@keyframes confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
}
`;
const COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];

export default function LevelUpPopup({ level, prevLevel, label, unlocks, onDismiss, audio }) {
  const unlockedItems = (unlocks || []).map(k => UNLOCK_LABELS[k]).filter(Boolean);

  // #136: ファンファーレSE
  useEffect(() => {
    try {
      const se = new Audio("/audio/ミニファンファーレ.mp3");
      se.volume = audio?.seVolume ?? 0.85;
      if (!audio?.muted) se.play().catch(() => {});
    } catch {}
  }, []);

  return (
    <>
      <style>{confettiStyle}</style>
      <div style={{
        position: "fixed", inset: 0, zIndex: 900,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
      }}>
        {/* 紙吹雪パーティクル */}
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${10 + Math.random() * 80}%`,
            top: `${-5 - Math.random() * 10}%`,
            width: 8 + Math.random() * 6,
            height: 8 + Math.random() * 6,
            background: COLORS[i % COLORS.length],
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confetti ${1.5 + Math.random() * 1.5}s ease-out ${Math.random() * 0.5}s forwards`,
            pointerEvents: "none",
          }} />
        ))}

        <div style={{
          background: `linear-gradient(180deg, ${V.walnut}, ${V.walnutDk})`,
          border: `2px solid ${V.oilLt}`,
          borderRadius: 16, padding: "20px 24px",
          textAlign: "center", minWidth: 240, maxWidth: 300,
          animation: "slideIn 0.3s ease-out",
          position: "relative",
        }}>
          <div style={{ fontSize: 40, marginBottom: 4, animation: "popIn 0.4s ease-out" }}>🎉</div>
          <p style={{
            fontFamily: F.d, fontSize: 26, color: V.oilLt,
            margin: "0 0 4px", animation: "popIn 0.5s ease-out",
          }}>
            Level Up!
          </p>
          <p style={{
            fontFamily: F.d, fontSize: 32, color: "#FFF",
            margin: "0 0 8px", fontWeight: "bold",
          }}>
            {prevLevel && prevLevel < level ? `Lv.${prevLevel} → Lv.${level}` : `Lv.${level}`}
          </p>
          <p style={{
            fontFamily: F.b, fontSize: 13, color: V.birch,
            margin: "0 0 12px",
          }}>
            {label}
          </p>

          {unlockedItems.length > 0 && (
            <div style={{
              background: "rgba(0,0,0,0.25)", borderRadius: 10,
              padding: "10px 12px", marginBottom: 12, textAlign: "left",
            }}>
              <div style={{ fontFamily: F.b, fontSize: 11, color: V.oilLt, marginBottom: 4 }}>
                🔓 解放された機能:
              </div>
              {unlockedItems.map((item, i) => (
                <div key={i} style={{
                  fontFamily: F.b, fontSize: 12, color: "#FFF",
                  padding: "3px 0",
                  borderBottom: i < unlockedItems.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
                }}>
                  ・{item}
                </div>
              ))}
            </div>
          )}

          <Btn onClick={onDismiss} color="basil" style={{ fontSize: 14, padding: "8px 20px" }}>OK</Btn>
        </div>
      </div>
    </>
  );
}
