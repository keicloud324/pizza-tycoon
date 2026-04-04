import { useState } from "react";
import { F, V } from "../../config/design.js";
import Btn from "../shared/Btn.jsx";

const SLIDES = [
  {
    icon: "🍕",
    text: "あなたは小さなピザ屋のオーナーです。\nまずは自分の手でピザを作って、お客さんを笑顔にしましょう",
  },
  {
    icon: "👥",
    text: "経営が安定してきたら、スタッフを雇って任せることもできます。\nマネージャーとしてお店を切り盛りしましょう",
  },
  {
    icon: "⭐",
    text: "ミシュランの星を獲得して、日本一のピッツァイオーロを目指しましょう🌟",
  },
  {
    icon: "🏆",
    text: "あなたの経営スタイルによって、得られる称号が変わります。\nいろんな戦略を試してみてください！",
  },
];

export default function IntroSlides({ onComplete, onSkip }) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      background: V.flour,
    }}>
      {/* Progress dots */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 6,
        padding: "16px 0 8px", flexShrink: 0,
      }}>
        {SLIDES.map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i <= idx ? V.terra : V.birch,
            transition: "background 0.3s",
          }} />
        ))}
      </div>

      {/* Slide content */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 24px", gap: 16,
      }}>
        <div style={{
          fontSize: 64, lineHeight: 1,
          animation: "popIn 0.4s ease-out",
        }}>
          {slide.icon}
        </div>
        <p style={{
          fontFamily: F.b, fontSize: 15, color: V.esp,
          lineHeight: 1.8, textAlign: "center",
          whiteSpace: "pre-line", margin: 0,
          animation: "slideIn 0.3s ease-out",
        }}>
          {slide.text}
        </p>
      </div>

      {/* Buttons */}
      <div style={{
        padding: "12px 20px 20px",
        display: "flex", flexDirection: "column", gap: 8,
        flexShrink: 0,
      }}>
        {isLast ? (
          <Btn onClick={onComplete}>さあ、始めよう！</Btn>
        ) : (
          <Btn onClick={() => setIdx(i => i + 1)}>次へ →</Btn>
        )}
        <Btn onClick={onSkip || onComplete} color="sec" style={{ fontSize: 12 }}>
          スキップ
        </Btn>
      </div>
    </div>
  );
}
