import { useState } from "react";
import { F, V } from "../../config/design.js";
import { CITIES, CITY_LIST } from "../../config/cities.js";
import { CONCEPT_LIST } from "../../config/concepts.js";
import Btn from "../shared/Btn.jsx";

export default function MultiStore({
  money, stores, currentStoreIndex, mainCityId, mainConceptId,
  onOpenStore, onSwitch, onBack,
}) {
  const [selCity, setSelCity] = useState("");
  const [selConcept, setSelConcept] = useState(CONCEPT_LIST[0]?.id ?? "");

  /* Gather used city IDs */
  const usedCities = new Set([mainCityId, ...stores.map((s) => s.cityId)]);
  const availableCities = CITY_LIST.filter((c) => !usedCities.has(c.id));

  /* All stores unified: index 0 = main, 1+ = from stores array */
  const allStores = [
    { cityId: mainCityId, conceptId: mainConceptId, lastDayRevenue: null, staff: null, isMain: true },
    ...stores.map((s) => ({ ...s, isMain: false })),
  ];

  const totalRent = allStores.reduce((sum, s) => sum + (CITIES[s.cityId]?.rent ?? 0), 0);
  const openCost = selCity ? (CITIES[selCity]?.rent ?? 0) * 20 : 0;
  const canOpen = selCity && selConcept && money >= openCost;

  const conceptName = (cid) => CONCEPT_LIST.find((c) => c.id === cid)?.name ?? cid;

  /* Shared select style */
  const selectStyle = {
    width: "100%", padding: "6px 8px", borderRadius: 6,
    border: `1px solid ${V.birch}`, background: "rgba(255,255,255,0.08)",
    color: V.moon, fontFamily: F.b, fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: V.night, color: V.moon, boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(180deg,${V.walnut},${V.walnutDk})`,
        padding: "14px 16px", textAlign: "center",
      }}>
        <p style={{ fontFamily: F.b, fontSize: 13, color: "#FFF", margin: 0 }}>
          🏪 店舗管理
        </p>
        <p style={{ fontFamily: F.b, fontSize: 12, color: V.flour, margin: "4px 0 0" }}>
          店舗数: {allStores.length} ／ 合計家賃: ¥{totalRent.toLocaleString()}/日
        </p>
      </div>

      {/* Scrollable body */}
      <div style={{
        flex: 1, overflowY: "auto", padding: 14,
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        {/* Current stores list */}
        <div>
          <p style={{ fontFamily: F.d, fontSize: 13, color: V.oilLt, margin: "0 0 8px" }}>
            運営中の店舗
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {allStores.map((s, i) => {
              const city = CITIES[s.cityId];
              const isCurrent = i === currentStoreIndex;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", borderRadius: 8,
                  background: isCurrent
                    ? "rgba(155,89,182,0.15)"
                    : "rgba(255,255,255,0.06)",
                  border: isCurrent ? `1px solid ${V.grape}` : "1px solid transparent",
                }}>
                  <span style={{ fontSize: 20 }}>{city?.icon ?? "🏪"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: F.b, fontSize: 14, color: V.moon, margin: 0 }}>
                      {city?.name ?? s.cityId}
                      <span style={{
                        fontFamily: F.b, fontSize: 12, color: V.birch, marginLeft: 6,
                      }}>
                        {conceptName(s.conceptId)}
                      </span>
                    </p>
                    {s.lastDayRevenue != null && (
                      <p style={{ fontFamily: F.b, fontSize: 12, color: V.oilLt, margin: "2px 0 0" }}>
                        昨日の売上: ¥{s.lastDayRevenue.toLocaleString()}
                      </p>
                    )}
                    {s.staff != null && (
                      <p style={{ fontFamily: F.b, fontSize: 12, color: V.moon, margin: "1px 0 0", opacity: 0.7 }}>
                        スタッフ: {s.staff}人
                      </p>
                    )}
                  </div>
                  {isCurrent ? (
                    <span style={{
                      fontFamily: F.b, fontSize: 12, color: V.grape,
                      background: "rgba(155,89,182,0.2)", padding: "2px 8px",
                      borderRadius: 4, whiteSpace: "nowrap",
                    }}>
                      📍 現在
                    </span>
                  ) : (
                    <button onClick={() => onSwitch(i)} style={{
                      padding: "4px 10px", borderRadius: 6, border: `1px solid ${V.birch}`,
                      background: "rgba(255,255,255,0.08)", color: V.moon,
                      fontFamily: F.b, fontSize: 12, cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}>
                      切替
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Open new store section */}
        {money >= 20000 && availableCities.length > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 12,
            padding: 14, border: `1px solid rgba(255,255,255,0.08)`,
          }}>
            <p style={{ fontFamily: F.d, fontSize: 13, color: V.oilLt, margin: "0 0 10px" }}>
              新しい店を開く
            </p>

            {/* City selector */}
            <label style={{ fontFamily: F.b, fontSize: 12, color: V.moon, marginBottom: 4, display: "block" }}>
              出店先
            </label>
            <select
              value={selCity}
              onChange={(e) => setSelCity(e.target.value)}
              style={selectStyle}
            >
              <option value="">-- 都市を選択 --</option>
              {availableCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}（家賃 ¥{c.rent}/日）
                </option>
              ))}
            </select>

            {/* Concept selector */}
            <label style={{
              fontFamily: F.b, fontSize: 12, color: V.moon,
              marginTop: 10, marginBottom: 4, display: "block",
            }}>
              コンセプト
            </label>
            <select
              value={selConcept}
              onChange={(e) => setSelConcept(e.target.value)}
              style={selectStyle}
            >
              {CONCEPT_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name} — {c.desc}
                </option>
              ))}
            </select>

            {/* Cost display */}
            {selCity && (
              <p style={{
                fontFamily: F.b, fontSize: 13, color: V.terra,
                margin: "10px 0 4px", textAlign: "center",
              }}>
                開店費用: ¥{openCost.toLocaleString()}
              </p>
            )}

            {/* Open button */}
            <div style={{ marginTop: 10 }}>
              <Btn
                color="basil"
                disabled={!canOpen}
                onClick={() => { if (canOpen) onOpenStore(selCity, selConcept); }}
              >
                🏪 開店！
              </Btn>
            </div>
          </div>
        )}

        {money < 20000 && (
          <p style={{
            fontFamily: F.b, fontSize: 13, color: V.moon, opacity: 0.5,
            textAlign: "center", margin: "8px 0",
          }}>
            新店舗の開店には ¥20,000 以上の資金が必要です
          </p>
        )}
      </div>

      {/* Bottom */}
      <div style={{ padding: "10px 14px 16px" }}>
        <Btn color="sec" onClick={onBack}>
          ← 戻る
        </Btn>
      </div>
    </div>
  );
}
