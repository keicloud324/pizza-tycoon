import { useState, useRef, useCallback, useEffect } from "react";
import { F, V, clamp } from "../../config/design.js";
import { INGS } from "../../config/ingredients.js";
import Btn from "../shared/Btn.jsx";

const CUT_ITEMS = [
  { k: "mozz_block", name: "モッツァレラ", icon: "🧀", u: "塊", su: "枚" },
  { k: "salami_log", name: "サラミ", icon: "🥩", u: "本", su: "枚" },
  { k: "shrimp_pack", name: "エビ", icon: "🦐", u: "パック", su: "尾" },
  { k: "olive_jar", name: "オリーブ", icon: "🫒", u: "瓶", su: "個" },
];

export default function Prep({ stock, onDone, onMenuDev }) {
  const flourBags = stock.flour_bag || 0;
  const tomatoCount = stock.tomato || 0;
  const maxDough = Math.floor(flourBags * 25);
  const maxSauce = Math.floor(tomatoCount / 3);
  const [dough, setDough] = useState(Math.min(25, maxDough));
  const [sauce, setSauce] = useState(Math.min(6, maxSauce));
  const [cuts, setCuts] = useState({ mozz_block: 0, salami_log: 0, shrimp_pack: 0, olive_jar: 0 });

  const [phase, setPhase] = useState("select"); // "select" | "minigame" | "complete"
  const [taskQueue, setTaskQueue] = useState([]);
  const [currentTask, setCurrentTask] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [swipeDist, setSwipeDist] = useState(0);
  const [animating, setAnimating] = useState(false);
  const lastPos = useRef(null);

  const finishData = useRef({ dough: 0, sauce: 0, cuts: {} });

  const startMinigame = () => {
    const q = [];
    if (dough > 0) q.push({ type: "dough", target: dough, icon: "🫓", label: "生地こねる", unit: "枚" });
    if (sauce > 0) q.push({ type: "sauce", target: sauce, icon: "🍅", label: "トマトを潰す", unit: "食分" });
    CUT_ITEMS.forEach(ci => {
      if ((cuts[ci.k] || 0) > 0) q.push({ type: "cut", target: cuts[ci.k], icon: ci.icon, label: `${ci.name}カット`, unit: ci.su });
    });
    if (q.length === 0) { onDone({ dough, sauce, cuts }); return; }
    finishData.current = { dough, sauce, cuts };
    setTaskQueue(q);
    setCurrentTask(0);
    setProgress(0);
    setTapCount(0);
    setSwipeDist(0);
    lastPos.current = null;
    setPhase("minigame");
  };

  const advanceTask = useCallback(() => {
    setCurrentTask(i => {
      const next = i + 1;
      if (next >= taskQueue.length) { setPhase("complete"); return i; }
      setProgress(0); setTapCount(0); setSwipeDist(0); lastPos.current = null;
      return next;
    });
  }, [taskQueue.length]);

  useEffect(() => {
    if (phase === "complete") {
      const t = setTimeout(() => onDone(finishData.current), 1000);
      return () => clearTimeout(t);
    }
  }, [phase, onDone]);

  const flash = () => { setAnimating(true); setTimeout(() => setAnimating(false), 120); };

  const task = taskQueue[currentTask];

  const handleSwipe = useCallback(e => {
    if (!task || task.type !== "dough") return;
    const t = e.touches?.[0] || e;
    if (!t.clientX) return;
    if (lastPos.current) {
      const dx = t.clientX - lastPos.current.x;
      const dy = t.clientY - lastPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setSwipeDist(d => d + dist);
    }
    lastPos.current = { x: t.clientX, y: t.clientY };
  }, [task]);

  useEffect(() => {
    if (!task || task.type !== "dough") return;
    if (swipeDist >= 200) {
      flash();
      setSwipeDist(0);
      setProgress(p => {
        const next = p + 1;
        if (next >= task.target) setTimeout(advanceTask, 200);
        return next;
      });
    }
  }, [swipeDist, task, advanceTask]);

  const handleTap = useCallback(e => {
    if (!task || task.type === "dough") return;
    if (e.type === "touchend") e.preventDefault();
    flash();
    if (task.type === "sauce") {
      setTapCount(tc => {
        const next = tc + 1;
        if (next >= 3) {
          setTapCount(0);
          setProgress(p => {
            const np = p + 1;
            if (np >= task.target) setTimeout(advanceTask, 200);
            return np;
          });
        }
        return next;
      });
    } else {
      setProgress(p => {
        const np = p + 1;
        if (np >= task.target) setTimeout(advanceTask, 200);
        return np;
      });
    }
  }, [task, advanceTask]);

  const resetSwipe = () => { lastPos.current = null; };

  // ── RENDER ──
  const hdr = (
    <div style={{ background: `linear-gradient(180deg,#4A2A15,${V.walnutDk})`, padding: "7px 12px", borderBottom: `3px solid ${V.birch}`, flexShrink: 0, textAlign: "center" }}>
      <div style={{ fontFamily: F.b, color: "#FFF", fontSize: 13 }}>🔪 仕込み</div>
    </div>
  );

  if (phase === "complete") {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: V.flour }}>
        {hdr}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 60, animation: "pulse 0.5s ease-in-out infinite alternate" }}>✅</div>
          <div style={{ fontFamily: F.b, fontSize: 18, color: V.basil }}>仕込み完了！</div>
        </div>
      </div>
    );
  }

  if (phase === "minigame" && task) {
    const pct = task.target > 0 ? (progress / task.target) * 100 : 0;
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: V.flour }}>
        {hdr}
        <div style={{ background: "#FFFDE7", padding: "3px 12px", borderBottom: "1px solid #EEE", flexShrink: 0 }}>
          <span style={{ fontFamily: F.b, fontSize: 12, color: "#888" }}>タスク {currentTask + 1}/{taskQueue.length}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, touchAction: "none", userSelect: "none" }}
          onTouchMove={handleSwipe} onMouseMove={handleSwipe}
          onTouchEnd={e => { resetSwipe(); handleTap(e); }} onClick={handleTap}>
          <div style={{ width: "80%", height: 8, background: "#EEE", borderRadius: 4 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: V.basil, borderRadius: 4, transition: "width 0.15s" }} />
          </div>
          <div style={{ fontFamily: F.b, fontSize: 14, color: V.esp }}>
            {task.label} ({progress}/{task.target}{task.unit})
          </div>
          {task.type === "sauce" && <div style={{ fontFamily: F.b, fontSize: 12, color: V.terra }}>タップ {tapCount}/3</div>}
          <div style={{ fontSize: 80, transition: "transform 0.1s", transform: animating ? "scale(0.75) rotate(10deg)" : "scale(1)" }}>
            {task.icon}
          </div>
          <div style={{ fontFamily: F.b, fontSize: 13, color: "#888" }}>
            {task.type === "dough" ? "👆 ぐるぐるスワイプ！" : "👆 タップ！"}
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: select ──
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: V.flour }}>
      {hdr}
      <div style={{ background: "#FFFDE7", padding: "3px 12px", borderBottom: "1px solid #EEE", flexShrink: 0 }}>
        <span style={{ fontFamily: F.b, fontSize: 12, color: "#888" }}>⚠️ 在庫の範囲内で。仕込んだ分だけ今日使えます</span>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "6px 10px" }}>
        <div style={{ background: "#FFF", borderRadius: 10, padding: 8, border: `2px solid ${V.birch}`, marginBottom: 6 }}>
          <div style={{ fontFamily: F.b, fontSize: 14, fontWeight: "bold", color: V.esp, marginBottom: 4 }}>🫓 生地 & 🥫 ソース</div>
          <PresetRow icon="🫓" name="レギュラー生地" sub={`小麦粉${flourBags}袋`}
            value={dough} unit="枚"
            presets={[
              ...(flourBags >= 1 ? [{ label: "1袋(25枚)", value: 25 }] : []),
              ...(flourBags >= 2 ? [{ label: "2袋(50枚)", value: 50 }] : []),
            ]}
            onChange={setDough} />
          <PresetRow icon="🍅" name="トマトソース" sub={`トマト${tomatoCount}個`}
            value={sauce} unit="食分"
            presets={[
              ...(tomatoCount >= 3 ? [{ label: "3個(1食分)", value: 1 }] : []),
              ...(tomatoCount >= 9 ? [{ label: "9個(3食分)", value: 3 }] : []),
              ...(tomatoCount >= 18 ? [{ label: "18個(6食分)", value: 6 }] : []),
              ...(tomatoCount >= 36 ? [{ label: "36個(12食分)", value: 12 }] : []),
            ]}
            onChange={setSauce} />
          <div style={{ fontFamily: F.b, fontSize: 13, color: V.esp, marginTop: 5, background: "#E8F5E9", borderRadius: 5, padding: "5px 8px" }}>
            ℹ️ トマト3個 = ソース1食分 / 小麦粉1袋 = 生地25枚分
          </div>
          <div style={{ fontFamily: F.b, fontSize: 11, color: "#999", marginTop: 3, background: "#FFFDE7", borderRadius: 5, padding: "3px 6px" }}>
            使用: トマト<b>{sauce * 3}</b>個(在庫{tomatoCount}) / 小麦粉から生地<b>{dough}</b>枚分
          </div>
        </div>
        <div style={{ background: "#FFF", borderRadius: 10, padding: 8, border: `2px solid ${V.birch}`, marginBottom: 6 }}>
          <div style={{ fontFamily: F.b, fontSize: 14, fontWeight: "bold", color: V.esp, marginBottom: 3 }}>🔪 トッピングのカット</div>
          <div style={{ fontFamily: F.b, fontSize: 11, color: "#999", marginBottom: 4 }}>ℹ️ カット済み=今日のみ使用可</div>
          {CUT_ITEMS.map(ci => {
            const per = INGS[ci.k]?.perUnit || 1;
            const stk = stock[ci.k] || 0;
            const presets = [];
            for (let n = 1; n <= stk; n++) {
              presets.push({ label: `${n}${ci.u}(${n * per}${ci.su})`, value: n * per });
            }
            return <PresetRow key={ci.k} icon={ci.icon} name={ci.name} sub={`在庫${stk}${ci.u}(1${ci.u}=${per}${ci.su})`}
              value={cuts[ci.k] || 0} unit={ci.su} presets={presets}
              onChange={v => setCuts(p => ({ ...p, [ci.k]: v }))} />;
          })}
        </div>
      </div>
      <div style={{ padding: "6px 12px", borderTop: `3px solid ${V.oil}`, background: "#FFF", flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        <Btn onClick={startMinigame}>🔪 仕込み開始！</Btn>
        <Btn onClick={() => onDone({ dough, sauce, cuts })} color="sec">⏩ スキップ（自動仕込み）</Btn>
        {onMenuDev && <Btn onClick={onMenuDev} color="sec">📖 メニュー開発</Btn>}
      </div>
    </div>
  );
}

function PresetRow({ icon, name, sub, value, unit, presets, onChange }) {
  const pbtn = (selected) => ({
    padding: "4px 8px", borderRadius: 6, fontSize: 11, fontFamily: F.b,
    border: `2px solid ${selected ? V.terra : V.birch}`,
    background: selected ? "#FFF8EE" : "#FFF",
    color: selected ? V.terra : V.esp,
    fontWeight: selected ? "bold" : "normal",
    cursor: "pointer",
  });
  return (
    <div style={{ padding: "4px 0", borderBottom: "1px solid #F5F5F5" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.b, fontSize: 14, color: V.esp }}>{name}</div>
          <div style={{ fontFamily: F.b, fontSize: 11, color: "#AAA" }}>{sub}</div>
        </div>
        <span style={{ fontFamily: F.b, fontSize: 14, color: V.esp, fontWeight: "bold" }}>{value}{unit}</span>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <button onClick={() => onChange(0)} style={pbtn(value === 0)}>なし</button>
        {presets.map((p, i) => (
          <button key={i} onClick={() => onChange(p.value)} style={pbtn(value === p.value)}>{p.label}</button>
        ))}
      </div>
    </div>
  );
}
