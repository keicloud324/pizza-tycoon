import { useState } from "react";
import { F, V } from "../../config/design.js";
import Btn from "../shared/Btn.jsx";

const STAFF_NAMES = [
  "マルコ", "ジュリア", "アントニオ", "ソフィア",
  "ルカ", "エレナ", "ダニエル", "ローザ",
];

function randomName(existing) {
  const used = new Set((existing || []).map((s) => s.name));
  const available = STAFF_NAMES.filter((n) => !used.has(n));
  const pool = available.length > 0 ? available : STAFF_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function randomSkill() {
  return Math.floor(Math.random() * 3) + 1;
}

export default function StaffScreen({ staff, money, unlockedFeatures, onHire, onBack }) {
  const uf = unlockedFeatures || new Set();
  const currentStaff = staff || [];

  const [hallCandidate] = useState(() => ({
    name: randomName(currentStaff),
    type: "hall",
    skill: randomSkill(),
  }));
  const hallWage = 500 + hallCandidate.skill * 100;

  const [kitchenCandidate] = useState(() => ({
    name: randomName([...currentStaff, hallCandidate]),
    type: "kitchen",
    skill: randomSkill(),
  }));
  const kitchenWage = 800 + kitchenCandidate.skill * 200;

  const card = {
    background: "#FFF",
    border: `1px solid ${V.birch}`,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  };

  const typeLabel = (t) => (t === "hall" ? "ホール" : "キッチン");
  const typeIcon = (t) => (t === "hall" ? "🙋" : "👨‍🍳");
  const wageFor = (s) =>
    s.type === "hall" ? 500 + s.skill * 100 : 800 + s.skill * 200;

  const skillStars = (n) => "★".repeat(n) + "☆".repeat(3 - n);

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      background: V.flour,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${V.walnut}, ${V.walnutDk})`,
        padding: "14px 16px", textAlign: "center",
      }}>
        <div style={{ fontFamily: F.d, fontSize: 18, color: "#FFF" }}>
          👥 スタッフ管理
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>

        {/* Current money */}
        <div style={{
          fontFamily: F.b, fontSize: 13, color: V.oak,
          textAlign: "right", marginBottom: 8,
        }}>
          所持金: <span style={{ fontFamily: F.d, fontSize: 16, color: V.basil }}>
            ¥{(money || 0).toLocaleString()}
          </span>
        </div>

        {/* Current staff */}
        {currentStaff.length > 0 && (
          <>
            <div style={{
              fontFamily: F.b, fontSize: 13, fontWeight: "bold",
              color: V.esp, marginBottom: 6,
            }}>
              現在のスタッフ
            </div>
            {currentStaff.map((s, i) => (
              <div key={i} style={card}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <span style={{ fontSize: 16, marginRight: 6 }}>
                      {typeIcon(s.type)}
                    </span>
                    <span style={{ fontFamily: F.d, fontSize: 13, color: V.esp }}>
                      {s.name}
                    </span>
                    <span style={{
                      fontFamily: F.b, fontSize: 10, color: "#FFF",
                      background: s.type === "hall" ? V.oil : V.terra,
                      borderRadius: 4, padding: "1px 5px", marginLeft: 6,
                    }}>
                      {typeLabel(s.type)}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: F.b, fontSize: 12, color: V.oak,
                  }}>
                    ¥{wageFor(s).toLocaleString()}/日
                  </span>
                </div>
                <div style={{
                  fontFamily: F.b, fontSize: 12, color: V.oilLt, marginTop: 4,
                }}>
                  スキル: {skillStars(s.skill)}
                </div>
              </div>
            ))}
          </>
        )}

        {currentStaff.length === 0 && (
          <div style={{
            ...card, textAlign: "center",
            fontFamily: F.b, fontSize: 13, color: V.oak,
          }}>
            まだスタッフがいません
          </div>
        )}

        {/* Hiring section */}
        <div style={{
          fontFamily: F.b, fontSize: 13, fontWeight: "bold",
          color: V.esp, marginBottom: 6, marginTop: 8,
        }}>
          採用候補
        </div>

        {/* Hall staff */}
        {uf.has("hallStaff") && (
          <div style={{
            ...card,
            background: "#FFFDF5",
            border: `1px solid ${V.oilLt}`,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 6,
            }}>
              <div>
                <span style={{ fontSize: 16, marginRight: 6 }}>🙋</span>
                <span style={{ fontFamily: F.d, fontSize: 13, color: V.esp }}>
                  {hallCandidate.name}
                </span>
                <span style={{
                  fontFamily: F.b, fontSize: 10, color: "#FFF",
                  background: V.oil, borderRadius: 4,
                  padding: "1px 5px", marginLeft: 6,
                }}>
                  ホール
                </span>
              </div>
            </div>
            <div style={{
              fontFamily: F.b, fontSize: 12, color: V.oilLt, marginBottom: 4,
            }}>
              スキル: {skillStars(hallCandidate.skill)}
            </div>
            <div style={{
              fontFamily: F.b, fontSize: 12, color: V.oak, marginBottom: 6,
            }}>
              日給: ¥{hallWage.toLocaleString()}
            </div>
            <Btn
              color="basil"
              onClick={() => onHire({ ...hallCandidate, wage: hallWage })}
              style={{ fontSize: 12, padding: "5px 8px" }}
            >
              雇う（¥{hallWage.toLocaleString()}/日）
            </Btn>
          </div>
        )}

        {/* Kitchen staff */}
        {uf.has("kitchenStaff") && (
          <div style={{
            ...card,
            background: "#FFF5F0",
            border: `1px solid ${V.terra}`,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 6,
            }}>
              <div>
                <span style={{ fontSize: 16, marginRight: 6 }}>👨‍🍳</span>
                <span style={{ fontFamily: F.d, fontSize: 13, color: V.esp }}>
                  {kitchenCandidate.name}
                </span>
                <span style={{
                  fontFamily: F.b, fontSize: 10, color: "#FFF",
                  background: V.terra, borderRadius: 4,
                  padding: "1px 5px", marginLeft: 6,
                }}>
                  キッチン
                </span>
              </div>
            </div>
            <div style={{
              fontFamily: F.b, fontSize: 12, color: V.oilLt, marginBottom: 4,
            }}>
              スキル: {skillStars(kitchenCandidate.skill)}
            </div>
            <div style={{
              fontFamily: F.b, fontSize: 12, color: V.oak, marginBottom: 6,
            }}>
              日給: ¥{kitchenWage.toLocaleString()}
            </div>
            <Btn
              color="terra"
              onClick={() => onHire({ ...kitchenCandidate, wage: kitchenWage })}
              style={{ fontSize: 12, padding: "5px 8px" }}
            >
              雇う（¥{kitchenWage.toLocaleString()}/日）
            </Btn>
          </div>
        )}

        {!uf.has("hallStaff") && !uf.has("kitchenStaff") && (
          <div style={{
            ...card, textAlign: "center",
            fontFamily: F.b, fontSize: 13, color: V.oak,
          }}>
            採用可能なスタッフ枠がまだ解放されていません
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{
        padding: "10px 16px 14px",
        background: V.flour,
        borderTop: `1px solid ${V.birch}`,
      }}>
        <Btn color="sec" onClick={onBack}>← 戻る</Btn>
      </div>
    </div>
  );
}
