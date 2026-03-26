export default function MushroomCSS({ size, style: st = {} }) {
  return (
    <div style={{ width: size, height: size, position: "relative", ...st }}>
      <div style={{
        position: "absolute", top: 0, left: "10%", width: "80%", height: "55%",
        borderRadius: "50% 50% 10% 10%", background: "linear-gradient(180deg,#8B6914,#6B4E12)",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: "35%", width: "30%", height: "55%",
        borderRadius: "4px 4px 2px 2px", background: "linear-gradient(180deg,#F5F0E0,#E0D8C0)",
      }} />
    </div>
  );
}
