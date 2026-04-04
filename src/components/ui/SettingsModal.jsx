import { F, V } from "../../config/design.js";

const row = {
  display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
  borderBottom: `1px solid ${V.birch}22`,
};

export default function SettingsModal({ audio, onClose }) {
  if (!audio) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: V.flour, borderRadius: 14, padding: "16px 20px",
        width: 300, maxWidth: "90vw",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: F.b, fontSize: 16, fontWeight: "bold", color: V.esp, marginBottom: 12 }}>
          ⚙ 設定
        </div>

        {/* BGM Volume */}
        <div style={row}>
          <span style={{ fontSize: 16, width: 24 }}>🎵</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.b, fontSize: 12, color: V.esp }}>BGM音量</div>
            <input type="range" min={0} max={100} step={5}
              value={Math.round(audio.bgmVolume * 100)}
              onChange={e => audio.setBgmVolume(Number(e.target.value) / 100)}
              style={{ width: "100%", accentColor: V.terra }} />
          </div>
          <span style={{ fontFamily: F.b, fontSize: 11, color: V.oak, minWidth: 28 }}>
            {Math.round(audio.bgmVolume * 100)}%
          </span>
        </div>

        {/* SE Volume */}
        <div style={row}>
          <span style={{ fontSize: 16, width: 24 }}>🔊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.b, fontSize: 12, color: V.esp }}>SE音量</div>
            <input type="range" min={0} max={100} step={5}
              value={Math.round(audio.seVolume * 100)}
              onChange={e => audio.setSeVolume(Number(e.target.value) / 100)}
              style={{ width: "100%", accentColor: V.terra }} />
          </div>
          <span style={{ fontFamily: F.b, fontSize: 11, color: V.oak, minWidth: 28 }}>
            {Math.round(audio.seVolume * 100)}%
          </span>
        </div>

        {/* Mute */}
        <div style={row}>
          <span style={{ fontSize: 16, width: 24 }}>{audio.muted ? "🔇" : "🔈"}</span>
          <span style={{ fontFamily: F.b, fontSize: 12, color: V.esp, flex: 1 }}>サウンド</span>
          <button onClick={() => audio.toggleMute()} style={{
            padding: "3px 10px", borderRadius: 6, border: `1px solid ${V.birch}`,
            background: audio.muted ? V.flour : V.basil,
            color: audio.muted ? V.esp : "#FFF",
            fontFamily: F.b, fontSize: 11, cursor: "pointer",
          }}>{audio.muted ? "OFF" : "ON"}</button>
        </div>

        {/* Close */}
        <button onClick={onClose} style={{
          width: "100%", marginTop: 12, padding: "8px",
          borderRadius: 8, border: `1px solid ${V.birch}`,
          background: "#FFF", fontFamily: F.b, fontSize: 13,
          color: V.esp, cursor: "pointer",
        }}>閉じる</button>
      </div>
    </div>
  );
}
