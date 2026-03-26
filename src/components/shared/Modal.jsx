import { F, V } from "../../config/design.js";

export default function Modal({ children, onClose, title }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,.6)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: V.mozz, borderRadius: 16, padding: 16,
        border: `3px solid ${V.birch}`, maxWidth: 340, width: "90%",
        maxHeight: "80vh", overflow: "auto", animation: "popIn .2s",
      }} onClick={e => e.stopPropagation()}>
        {title && <div style={{
          fontFamily: F.d, fontSize: 18, fontWeight: 700,
          color: V.esp, textAlign: "center", marginBottom: 10,
        }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}
