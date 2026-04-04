import { useState, useRef, useCallback, useEffect } from "react";
import { F, V, clamp } from "../../config/design.js";
import { INGS } from "../../config/ingredients.js";
import { COOK } from "../../config/cooking.js";
import { FOOD_IMG, FOOD_CUT_IMG, FD, SFX2 } from "../../config/assets.js";
import Btn from "../shared/Btn.jsx";

const Img = ({ src, size = 20 }) => <img src={src} width={size} height={size} style={{ imageRendering: "auto", verticalAlign: "middle" }} />;

const CUT_ITEMS = [
  { k: "mozz_block", name: "モッツァレラ", icon: "🧀", img: FD.cheese, imgCut: FD.cheeseCut, u: "塊", su: "枚" },
  { k: "cheddar_block", name: "チェダー", icon: "🧀", img: FD.cheese, imgCut: FD.cheeseCut, u: "塊", su: "枚", unlockLevel: 2 },
  { k: "gorgonzola_block", name: "ゴルゴンゾーラ", icon: "🧀", img: FD.cheese, imgCut: FD.cheeseCut, u: "塊", su: "枚", unlockLevel: 6 },
  { k: "salami_log", name: "サラミ", icon: "🥩", img: FD.sausage, imgCut: FD.sausage, u: "本", su: "枚" },
  { k: "shrimp_pack", name: "エビ", icon: "🦐", img: FD.fish, imgCut: FD.fish, u: "パック", su: "尾", unlockLevel: 3 },
  { k: "olive_jar", name: "オリーブ", icon: "🫒", img: FD.oil, imgCut: FD.oil, u: "瓶", su: "個" },
];

export default function Prep({ stock, onDone, onMenuDev, onBackToMarche, unlockedFeatures, activePromotions, onPromotion, staff, onStaff, level, modal, audio }) {
  const uf = unlockedFeatures || new Set();
  const playerLevel = level || 1;
  const flourBags = stock.flour_bag || 0;
  const tomatoCount = stock.tomato || 0;
  const maxDough = Math.floor(flourBags * 25);
  const maxSauce = Math.min(20, Math.floor(tomatoCount / 3));
  const [dough, setDough] = useState(Math.min(25, maxDough));
  const [sauce, setSauce] = useState(Math.min(6, maxSauce));
  // ソースタイプセレクター
  const availableSauces = Object.entries(COOK.sauceTypes).filter(([k]) => {
    if (k === "tomato") return true;
    if (k === "genovese") return uf.has("genoveseSauce");
    if (k === "white") return uf.has("whiteSauce");
    if (k === "soy") return uf.has("soySauce");
    return false;
  });
  const [sauceType, setSauceType] = useState("tomato");
  const [cuts, setCuts] = useState({ mozz_block: 0, salami_log: 0, shrimp_pack: 0, olive_jar: 0 });
  const [openSection, setOpenSection] = useState("dough"); // #135: 生地&ソース&チーズをデフォルト開き
  const canStart = dough >= 1 && sauce >= 1;

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
    // #142: モーダルモード（緊急仕込み）でも通常と同じミニゲームを実行
    const q = [];
    if (dough > 0) q.push({ type: "dough", target: dough, icon: "🫓", label: "生地こねる", unit: "枚" });
    if (sauce > 0) q.push({ type: "sauce", target: sauce, icon: "🍅", label: "トマトを潰す", unit: "食分" });
    CUT_ITEMS.forEach(ci => {
      if ((cuts[ci.k] || 0) > 0) q.push({ type: "cut", target: cuts[ci.k], icon: ci.icon, label: `${ci.name}カット`, unit: ci.su });
    });
    if (q.length === 0) { onDone({ dough, sauce, sauceType, cuts }); return; }
    finishData.current = { dough, sauce, sauceType, cuts };
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
    // #143: カットSE
    if (task.type === "cut") audio?.playSe(SFX2.knifecut);
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
  }, [task, advanceTask, audio]);

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

  // ── Accordion header helper ──
  const AccHead = ({ id, icon, label }) => (
    <div
      onClick={() => setOpenSection(s => s === id ? null : id)}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 10px",
        background: openSection === id ? V.mozz : "#FFF",
        borderRadius: openSection === id ? "10px 10px 0 0" : 10,
        border: `2px solid ${V.birch}`, cursor: "pointer", marginBottom: openSection === id ? 0 : 6,
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontFamily: F.b, fontSize: 14, fontWeight: "bold", color: V.esp, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: V.oak }}>{openSection === id ? "▲" : "▼"}</span>
    </div>
  );

  // ── Phase: select ──
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: V.flour }}>
      {hdr}
      <div style={{ background: "#FFFDE7", padding: "3px 12px", borderBottom: "1px solid #EEE", flexShrink: 0 }}>
        <span style={{ fontFamily: F.b, fontSize: 12, color: "#888" }}>⚠️ 在庫の範囲内で。仕込んだ分だけ今日使えます</span>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "6px 10px" }}>
        {/* ── Accordion: 生地 & ソース & チーズ ── */}
        <AccHead id="dough" icon="🫓" label="生地 & ソース & チーズ" />
        {openSection === "dough" && (
          <div style={{ background: "#FFF", borderRadius: "0 0 10px 10px", padding: 8, border: `2px solid ${V.birch}`, borderTop: "none", marginBottom: 6 }}>
            <PresetRow icon="🫓" iconImg={FD.loaf} name="レギュラー生地" sub={`小麦粉${flourBags}袋`}
              value={dough} unit="枚"
              presets={[
                ...(flourBags >= 1 ? [{ label: "1袋(25枚)", value: 25 }] : []),
                ...(flourBags >= 2 ? [{ label: "2袋(50枚)", value: 50 }] : []),
              ]}
              onChange={setDough} />
            {/* ソースタイプセレクター */}
            {availableSauces.length > 1 && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontFamily: F.b, fontSize: 12, color: V.esp, marginBottom: 3 }}>ソースの種類</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {availableSauces.map(([k, v]) => (
                    <button key={k} onClick={() => setSauceType(k)} style={{
                      padding: "4px 8px", borderRadius: 6, fontSize: 11, fontFamily: F.b,
                      border: `2px solid ${sauceType === k ? V.terra : V.birch}`,
                      background: sauceType === k ? "#FFF8EE" : "#FFF",
                      color: sauceType === k ? V.terra : V.esp, cursor: "pointer",
                    }}>
                      {v.icon} {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <PresetRow icon={COOK.sauceTypes[sauceType]?.icon || "🍅"} iconImg={FD.tomato} name={`${COOK.sauceTypes[sauceType]?.name || "トマト"}ソース`} sub={`トマト${tomatoCount}個`}
              value={sauce} unit="食分"
              presets={[
                ...(tomatoCount >= 3 ? [{ label: "3個(1食分)", value: 1 }] : []),
                ...(tomatoCount >= 9 ? [{ label: "9個(3食分)", value: 3 }] : []),
                ...(tomatoCount >= 18 ? [{ label: "18個(6食分)", value: 6 }] : []),
                ...(tomatoCount >= 36 ? [{ label: "36個(12食分)", value: 12 }] : []),
                ...(tomatoCount >= 45 ? [{ label: "45個(15食分)", value: 15 }] : []),
                ...(tomatoCount >= 60 ? [{ label: "60個(20食分)", value: 20 }] : []),
              ]}
              onChange={setSauce} />
            <div style={{ fontFamily: F.b, fontSize: 13, color: V.esp, marginTop: 5, background: "#E8F5E9", borderRadius: 5, padding: "5px 8px" }}>
              ℹ️ トマト3個 = ソース1食分 / 小麦粉1袋 = 生地25枚分
            </div>
            <div style={{ fontFamily: F.b, fontSize: 11, color: "#999", marginTop: 3, background: "#FFFDE7", borderRadius: 5, padding: "3px 6px" }}>
              使用: トマト<b>{sauce * 3}</b>個(在庫{tomatoCount}) / 小麦粉から生地<b>{dough}</b>枚分
            </div>
            {/* #135: チーズをここに配置 */}
            {CUT_ITEMS.filter(ci => ci.k.includes("_block") && (ci.unlockLevel || 1) <= playerLevel).map(ci => {
              const per = INGS[ci.k]?.perUnit || 1;
              const stk = stock[ci.k] || 0;
              const presets = [];
              for (let n = 1; n <= stk; n++) {
                presets.push({ label: `${n}${ci.u}(${n * per}${ci.su})`, value: n * per });
              }
              return <PresetRow key={ci.k} icon={ci.icon} iconImg={ci.imgCut} name={ci.name} sub={`在庫${stk}${ci.u}(1${ci.u}=${per}${ci.su})`}
                value={cuts[ci.k] || 0} unit={ci.su} presets={presets}
                onChange={v => setCuts(p => ({ ...p, [ci.k]: v }))} />;
            })}
          </div>
        )}

        {/* ── Accordion: トッピングのカット ── */}
        <AccHead id="toppings" icon="🔪" label="トッピングのカット" />
        {openSection === "toppings" && (
          <div style={{ background: "#FFF", borderRadius: "0 0 10px 10px", padding: 8, border: `2px solid ${V.birch}`, borderTop: "none", marginBottom: 6 }}>
            <div style={{ fontFamily: F.b, fontSize: 11, color: "#999", marginBottom: 4 }}>ℹ️ カット済み=今日のみ使用可</div>
            {CUT_ITEMS.filter(ci => !ci.k.includes("_block") && (ci.unlockLevel || 1) <= playerLevel).map(ci => {
              const per = INGS[ci.k]?.perUnit || 1;
              const stk = stock[ci.k] || 0;
              const presets = [];
              for (let n = 1; n <= stk; n++) {
                presets.push({ label: `${n}${ci.u}(${n * per}${ci.su})`, value: n * per });
              }
              return <PresetRow key={ci.k} icon={ci.icon} iconImg={ci.imgCut} name={ci.name} sub={`在庫${stk}${ci.u}(1${ci.u}=${per}${ci.su})`}
                value={cuts[ci.k] || 0} unit={ci.su} presets={presets}
                onChange={v => setCuts(p => ({ ...p, [ci.k]: v }))} />;
            })}
          </div>
        )}

        {/* ── Accordion: 販促 ── */}
        <AccHead id="promo" icon="📣" label={uf.has("promotions") ? "販促" : "販促（Lv5で解放）"} />
        {openSection === "promo" && (
          <div style={{
            background: uf.has("promotions") ? "#FFF" : "#F5F5F5",
            borderRadius: "0 0 10px 10px", padding: 8,
            border: `2px solid ${V.birch}`, borderTop: "none", marginBottom: 6,
            opacity: uf.has("promotions") ? 1 : 0.5,
          }}>
            {!uf.has("promotions") ? (
              <div style={{ fontFamily: F.b, fontSize: 12, color: "#999", textAlign: "center", padding: 10 }}>
                🔒 Lv5で解放されます
              </div>
            ) : (
              <>
                {(activePromotions || []).length > 0 ? (
                  <div>
                    <div style={{ fontFamily: F.b, fontSize: 12, color: V.esp, marginBottom: 4 }}>実施中の販促:</div>
                    {(activePromotions || []).map((p, i) => (
                      <div key={i} style={{
                        fontFamily: F.b, fontSize: 12, color: V.basil, padding: "2px 0",
                        borderBottom: `1px solid ${V.birch}22`,
                      }}>
                        📣 {p.name} (残り{p.daysLeft > 0 ? `${p.daysLeft}日` : "永続"})
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontFamily: F.b, fontSize: 12, color: "#999", textAlign: "center" }}>
                    販促なし
                  </div>
                )}
                {onPromotion && (
                  <Btn onClick={onPromotion} color="sec" style={{ marginTop: 6, fontSize: 12 }}>
                    📣 販促を設定する
                  </Btn>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Accordion: スタッフ ── */}
        <AccHead id="staff" icon="👥" label={uf.has("hallStaff") ? "スタッフ" : "スタッフ（Lv4で解放）"} />
        {openSection === "staff" && (
          <div style={{
            background: uf.has("hallStaff") ? "#FFF" : "#F5F5F5",
            borderRadius: "0 0 10px 10px", padding: 8,
            border: `2px solid ${V.birch}`, borderTop: "none", marginBottom: 6,
            opacity: uf.has("hallStaff") ? 1 : 0.5,
          }}>
            {!uf.has("hallStaff") ? (
              <div style={{ fontFamily: F.b, fontSize: 12, color: "#999", textAlign: "center", padding: 10 }}>
                🔒 Lv4で解放されます
              </div>
            ) : (
              <>
                {(staff || []).length > 0 ? (
                  <div>
                    <div style={{ fontFamily: F.b, fontSize: 12, color: V.esp, marginBottom: 4 }}>現在のスタッフ:</div>
                    {(staff || []).map((s, i) => (
                      <div key={i} style={{
                        fontFamily: F.b, fontSize: 12, color: V.esp, padding: "2px 0",
                        borderBottom: `1px solid ${V.birch}22`,
                      }}>
                        {s.type === "hall" ? "🤵" : "👨‍🍳"} {s.name} (★{s.skill})
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontFamily: F.b, fontSize: 12, color: "#999", textAlign: "center" }}>
                    スタッフなし
                  </div>
                )}
                {onStaff && (
                  <Btn onClick={onStaff} color="sec" style={{ marginTop: 6, fontSize: 12 }}>
                    👥 スタッフを管理する
                  </Btn>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom buttons ── */}
      <div style={{ padding: "6px 12px", borderTop: `3px solid ${V.oil}`, background: "#FFF", flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        {!canStart && (
          <div style={{ fontFamily: F.b, fontSize: 11, color: V.terra, textAlign: "center" }}>
            ⚠️ 生地1枚以上・ソース1食分以上が必要です
          </div>
        )}
        <Btn onClick={startMinigame} disabled={!canStart}>
          {modal ? "🔪 仕込み開始" : "🔪 仕込み開始！"}
        </Btn>
        {!modal && onBackToMarche && <Btn onClick={onBackToMarche} color="sec">🏪 仕入れに戻る</Btn>}
        {!modal && onMenuDev && <Btn onClick={onMenuDev} color="sec">📖 メニューを見る</Btn>}
      </div>
    </div>
  );
}

function PresetRow({ icon, iconImg, name, sub, value, unit, presets, onChange }) {
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
        {iconImg ? <Img src={iconImg} size={20} /> : <span style={{ fontSize: 16 }}>{icon}</span>}
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
