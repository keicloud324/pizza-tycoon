import { useState } from "react";
import { F, V } from "../../config/design.js";
import { CITY_LIST } from "../../config/cities.js";
import { CREDITS } from "../../config/credits.js";
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

const sliderRow = {
  display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
  borderBottom: `1px solid ${V.birch}22`,
};

export default function TitleScreen({ onStart, hasSaveData, onContinue, audio, onClearSave }) {
  const [phase, setPhase] = useState("title");
  const [selectedCity, setSelectedCity] = useState(null);

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
          <Btn onClick={() => setPhase("settings")} color="sec">⚙ 設定</Btn>
          <div
            onClick={() => setPhase("credits")}
            style={{
              textAlign: "center", fontFamily: F.b, fontSize: 11,
              color: V.oak, cursor: "pointer", marginTop: 4,
              textDecoration: "underline",
            }}
          >
            Credits
          </div>
        </div>
      </div>
    );
  }

  /* ── Phase: credits ── */
  if (phase === "credits") {
    return (
      <div style={wrapStyle}>
        <div style={headerStyle}>Credits</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {CREDITS.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: F.b, fontSize: 14, fontWeight: "bold",
                color: V.esp, marginBottom: 2,
              }}>
                {cat.category}
              </div>
              <div style={{
                fontFamily: F.b, fontSize: 11, color: V.oak, marginBottom: 6,
              }}>
                Source: {cat.source}
              </div>
              {cat.items.map((item, ii) => (
                <div key={ii} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "3px 0",
                  borderBottom: `1px solid ${V.birch}22`,
                  fontFamily: F.b, fontSize: 12, color: V.esp,
                }}>
                  <span>{item.title}</span>
                  <span style={{ color: V.oak }}>{item.author}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: 12 }}>
          <Btn onClick={() => setPhase("title")} color="sec">← 戻る</Btn>
        </div>
      </div>
    );
  }

  /* ── Phase: settings ── */
  if (phase === "settings") {
    return (
      <div style={wrapStyle}>
        <div style={headerStyle}>⚙ 設定</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {/* BGM Volume */}
          <div style={sliderRow}>
            <span style={{ fontSize: 16, width: 28 }}>🎵</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.b, fontSize: 13, color: V.esp, marginBottom: 2 }}>BGM音量</div>
              <input
                type="range" min={0} max={100} step={5}
                value={Math.round((audio?.bgmVolume ?? 0.5) * 100)}
                onChange={e => audio?.setBgmVolume(Number(e.target.value) / 100)}
                style={{ width: "100%", accentColor: V.terra }}
              />
            </div>
            <span style={{ fontFamily: F.b, fontSize: 12, color: V.oak, minWidth: 32, textAlign: "right" }}>
              {Math.round((audio?.bgmVolume ?? 0.5) * 100)}%
            </span>
          </div>

          {/* SE Volume */}
          <div style={sliderRow}>
            <span style={{ fontSize: 16, width: 28 }}>🔊</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.b, fontSize: 13, color: V.esp, marginBottom: 2 }}>SE音量</div>
              <input
                type="range" min={0} max={100} step={5}
                value={Math.round((audio?.seVolume ?? 0.5) * 100)}
                onChange={e => audio?.setSeVolume(Number(e.target.value) / 100)}
                style={{ width: "100%", accentColor: V.terra }}
              />
            </div>
            <span style={{ fontFamily: F.b, fontSize: 12, color: V.oak, minWidth: 32, textAlign: "right" }}>
              {Math.round((audio?.seVolume ?? 0.5) * 100)}%
            </span>
          </div>

          {/* Mute toggle */}
          <div style={sliderRow}>
            <span style={{ fontSize: 16, width: 28 }}>{audio?.muted ? "🔇" : "🔈"}</span>
            <span style={{ fontFamily: F.b, fontSize: 13, color: V.esp, flex: 1 }}>サウンドON/OFF</span>
            <button
              onClick={() => audio?.toggleMute()}
              style={{
                padding: "4px 12px", borderRadius: 6,
                border: `1px solid ${V.birch}`,
                background: audio?.muted ? V.flour : V.basil,
                color: audio?.muted ? V.esp : "#FFF",
                fontFamily: F.b, fontSize: 12, cursor: "pointer",
              }}
            >
              {audio?.muted ? "OFF" : "ON"}
            </button>
          </div>

          {/* Delete save data */}
          <div style={{ marginTop: 20 }}>
            <Btn
              color="sec"
              onClick={() => {
                if (window.confirm("セーブデータを削除しますか？この操作は取り消せません。")) {
                  onClearSave?.();
                }
              }}
            >
              🗑️ セーブデータ削除
            </Btn>
          </div>

          {/* Info */}
          <div style={{ marginTop: 16, fontFamily: F.b, fontSize: 11, color: "#AAA", textAlign: "center" }}>
            BGMは後日追加予定です
          </div>
        </div>

        <div style={{ padding: 12 }}>
          <Btn onClick={() => setPhase("title")} color="sec">← 戻る</Btn>
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
            onClick={() => onStart(selectedCity, null)}
            disabled={!selectedCity}
          >
            🍕 開店！
          </Btn>
        </div>
      </div>
    );
  }
}
