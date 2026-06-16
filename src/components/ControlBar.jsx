import React, { useState, useEffect } from "react";
import { getTranslation } from "../utils/i18n";

export default function ControlBar({
  loadedAnimations = [],
  loadedSkins = [],
  activeSkin = "",
  onChangeSkin,
  playbackSpeed = 1.0,
  onChangePlaybackSpeed,
  onPlayAnimation,
  language = "es",
}) {
  const [selectedAnimation, setSelectedAnimation] = useState("");
  const [loopAnimation, setLoopAnimation] = useState(true);

  const t = (key, params) => getTranslation(language, key, params);

  // Sync selectedAnimation to the first animation when loadedAnimations updates
  useEffect(() => {
    if (loadedAnimations && loadedAnimations.length > 0) {
      if (!loadedAnimations.includes(selectedAnimation)) {
        setSelectedAnimation(loadedAnimations[0]);
      }
    } else {
      setSelectedAnimation("");
    }
  }, [loadedAnimations]);

  if (loadedAnimations.length === 0) return null;

  return (
    <div className="bottom-control-bar">
      {/* 1. Selección de Acción y Carga */}
      <div className="control-section" style={{ flex: "2 1 350px" }}>
        <div className="control-section-title">{t("spriteActions")}</div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "6px" }}>
          <select
            className="select-control compact"
            value={selectedAnimation}
            onChange={(e) => setSelectedAnimation(e.target.value)}
            style={{ flexGrow: 1, padding: "6px 10px", minWidth: "150px" }}
          >
            {loadedAnimations.map((anim) => (
              <option key={anim} value={anim}>
                {anim}
              </option>
            ))}
          </select>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              cursor: "pointer",
              userSelect: "none",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap"
            }}
          >
            <input
              type="checkbox"
              checked={loopAnimation}
              onChange={(e) => setLoopAnimation(e.target.checked)}
            />
            <span>{t("loop")}</span>
          </label>

          <button
            className="action-btn"
            style={{
              padding: "6px 16px",
              fontSize: "12px",
              fontWeight: "600",
              background: "var(--accent)",
              color: "white"
            }}
            onClick={() => onPlayAnimation(selectedAnimation, loopAnimation, 0)}
          >
            {t("load")}
          </button>
        </div>
      </div>

      {/* 2. Skin / Aspecto */}
      {loadedSkins.length > 1 && (
        <div className="control-section" style={{ flex: "1 1 180px" }}>
          <div className="control-section-title">{t("skinOutfit")}</div>
          <select
            className="select-control compact"
            value={activeSkin}
            onChange={(e) => onChangeSkin(e.target.value)}
            style={{ marginTop: "6px", padding: "6px 10px" }}
          >
            {loadedSkins.map((skinName) => (
              <option key={skinName} value={skinName}>
                {skinName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Relación de Reproducción (Velocidad) */}
      <div className="control-section" style={{ flex: "1.2 1 200px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="control-section-title">{t("playbackSpeed")}</div>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-cyan)" }}>
            {playbackSpeed.toFixed(1)}x
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.1"
          value={playbackSpeed}
          onChange={(e) => onChangePlaybackSpeed(parseFloat(e.target.value))}
          style={{
            width: "100%",
            marginTop: "8px",
            accentColor: "var(--accent)",
            cursor: "pointer",
            background: "rgba(255,255,255,0.1)",
            height: "4px",
            borderRadius: "2px"
          }}
        />
      </div>
    </div>
  );
}
