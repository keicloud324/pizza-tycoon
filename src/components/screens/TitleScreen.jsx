import { useState } from "react";
import { F, V } from "../../config/design.js";
import { CITY_LIST } from "../../config/cities.js";
import { CONCEPT_LIST } from "../../config/concepts.js";
import Btn from "../shared/Btn.jsx";

const DIFF_SECTIONS = [
  { key: "easy", label: "🟢 Easy", cities: CITY_LIST.filter(c => c.difficulty === "easy") },
  { key: "normal", label: "🟡 Normal", cities: CITY_LIST.filter(c => c.difficulty === "normal") },
  { key: "hard", label: "🔴 Hard", cities: CITY_LIST.filter(c => c.difficulty === "hard") },
];

const headerStyle = {
  background: `linear-gradient(180deg,#4A2A15,${V.walnutDk})`,
  borderBottom: `3px solid ${V.birch}`,
  padding: "14px 0",
  textAlign: "center",
  color: "#FFF",
  fontFamily: F.b,
  fontSize: 13,
  fontWeight: "bold",
};

const wrapStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: V.flour,
  fontFamily: F.b,
  overflow: "hidden",
};

export default function TitleScreen({ onStart, hasSaveData, onContinue }) {
  const [phase, setPhase] = useState("title");
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);

  /* ── Phase: title ── */
  if (phase === "title") {
    return (
      <div style={wrapStyle}>
        <div style={headerStyle} />
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <div style={{
            fontFamily: F.d, fontSize: 32, fontWeight: 700,
            color: V.terra, letterSpacing: 1,
          }}>
            Pizza Tycoon
          </div>
          <div style={{ fontSize: 48, lineHeight: 1 }}>🍕</div>
          <div style={{
            fontFamily: F.b, fontSize: 12, color: "#888",
          }}>
            ピッツェリア経営シミュレーション
          </div>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn onClick={() => setPhase("city")}>🍕 新しいゲームを始める</Btn>
          {hasSaveData && (
            <Btn onClick={onContinue} color="basil">📂 続きから</Btn>
          )}
        </div>
      </div>
    );
  }

  /* ── Phase: city ── */
  if (phase === "city") {
    return (
      <div style={wrapStyle}>
        <div style={headerStyle}>🗺️ 拠点を選ぶ</div>
        <div style={{
          textAlign: "center", fontSize: 11, color: "#999",
          padding: "6px 0",
        }}>
          ※ 後から変更できません
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
          {DIFF_SECTIONS.map(sec => (
            <div key={sec.key} style={{ marginBottom: 10 }}>
              <div style={{
                fontFamily: F.b, fontSize: 13, fontWeight: "bold",
                color: V.esp, margin: "8px 0 4px",
              }}>
                {sec.label}
              </div>
              {sec.cities.map(city => {
                const sel = selectedCity === city.id;
                return (
                  <div
                    key={city.id}
                    onClick={() => setSelectedCity(city.id)}
                    style={{
                      background: sel ? "#FFF8F0" : "#FFF",
                      border: sel ? `2px solid ${V.terra}` : `1px solid ${V.birch}`,
                      borderRadius: 10,
                      padding: "8px 10px",
                      marginBottom: 6,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <span style={{ fontFamily: F.b, fontSize: 14, fontWeight: "bold" }}>
                        {city.icon} {city.name}
                      </span>
                      <span style={{ fontSize: 11, color: "#999" }}>
                        {city.difficulty}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: V.esp, marginTop: 2 }}>
                      家賃: ¥{city.rent}/日
                    </div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                      {city.specialEffect}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: 12 }}>
          <Btn
            onClick={() => setPhase("concept")}
            disabled={!selectedCity}
          >
            決定 → コンセプト
          </Btn>
        </div>
      </div>
    );
  }

  /* ── Phase: concept ── */
  return (
    <div style={wrapStyle}>
      <div style={headerStyle}>🏪 店のコンセプトを選ぶ</div>
      <div style={{
        textAlign: "center", fontSize: 11, color: "#999",
        padding: "6px 0",
      }}>
        ※ 後から変更できません
      </div>

      <div style={{
        flex: 1, overflowY: "auto", padding: "0 12px 12px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
        alignContent: "start",
      }}>
        {CONCEPT_LIST.map(con => {
          const sel = selectedConcept === con.id;
          return (
            <div
              key={con.id}
              onClick={() => setSelectedConcept(con.id)}
              style={{
                background: sel ? "#FFF8F0" : "#FFF",
                border: sel ? `2px solid ${V.terra}` : `1px solid ${V.birch}`,
                borderRadius: 10,
                padding: 10,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24 }}>{con.icon}</div>
              <div style={{
                fontFamily: F.b, fontSize: 13, fontWeight: "bold",
                marginTop: 4,
              }}>
                {con.name}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                {con.desc}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: 12 }}>
        <Btn
          onClick={() => onStart(selectedCity, selectedConcept)}
          disabled={!selectedConcept}
        >
          🍕 開店！
        </Btn>
      </div>
    </div>
  );
}
