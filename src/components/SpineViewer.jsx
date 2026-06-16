import React, { useEffect, useRef, useState } from "react";
import { createSpineAdapter } from "../utils/spine/SpineAdapterFactory";
import { getTranslation } from "../utils/i18n";
import ControlBar from "./ControlBar";

export default function SpineViewer({
  model,
  version,
  bgStyle,
  bgUrl,
  bgColor,
  gridActive,
  premultipliedAlpha,
  isTransitioning,
  onModelLoaded,
  onLoadError,
  loadedAnimations,
  loadedSkins,
  activeSkin,
  playbackSpeed,
  activeTracks,
  language = "es",
  onPlayAnimation,
  onChangeSkin,
  onChangePlaybackSpeed,
  onClearTrack,
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const adapterRef = useRef(null);
  const containerId = "spine-player-container-mount";
  
  const t = (key, params) => getTranslation(language, key, params);

  useEffect(() => {
    let active = true;

    if (!model) {
      setErrorMsg("");
      return;
    }

    const initPlayer = async () => {
      setLoading(true);
      setErrorMsg("");

      // Cleanup existing adapter/player instance
      if (adapterRef.current) {
        try {
          adapterRef.current.dispose();
        } catch (e) {
          console.warn("Error disposing previous spine adapter:", e);
        }
        adapterRef.current = null;
      }

      // Clear DOM container
      const mountNode = document.getElementById(containerId);
      if (mountNode) {
        mountNode.innerHTML = "";
      }

      try {
        await createSpineAdapter(
          containerId,
          model,
          version,
          premultipliedAlpha,
          ({ player, animations, skins, skeletonData }) => {
            if (!active) {
              player.dispose();
              return;
            }
            adapterRef.current = player;
            if (onModelLoaded) {
              onModelLoaded({ player, animations, skins, skeletonData });
            }
            setLoading(false);
          },
          (err) => {
            if (!active) return;
            console.error("Spine adapter initialization failed:", err);
            setErrorMsg(err || "An unexpected error occurred during loading.");
            setLoading(false);
            if (onLoadError) onLoadError(err);
          }
        );
      } catch (err) {
        if (!active) return;
        console.error("Failed to setup Spine adapter:", err);
        setErrorMsg(
          err.message || "An unexpected error occurred during loading."
        );
        setLoading(false);
        if (onLoadError) onLoadError(err.message);
      }
    };

    initPlayer();

    return () => {
      active = false;
      if (adapterRef.current) {
        try {
          adapterRef.current.dispose();
        } catch (e) {
          console.warn("Cleanup error during unmount:", e);
        }
        adapterRef.current = null;
      }
      const mountNode = document.getElementById(containerId);
      if (mountNode) {
        mountNode.innerHTML = "";
      }
    };
  }, [model, version, premultipliedAlpha]);

  // Determine container styling for background
  const getContainerStyle = () => {
    if (bgStyle === "custom-color") {
      return { backgroundColor: bgColor };
    }
    if (bgStyle === "custom-image") {
      return {
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }
    return {};
  };

  const getBackgroundClass = () => {
    switch (bgStyle) {
      case "checkered":
        return "preset-checkered";
      case "blueprint":
        return "preset-blueprint";
      case "space":
        return "preset-space";
      case "neon-dusk":
        return "preset-neon-dusk";
      case "studio":
        return "preset-studio";
      case "dark-obsidian":
        return "preset-dark-obsidian";
      case "slate-grey":
        return "preset-slate-grey";
      case "paper-white":
        return "preset-paper-white";
      default:
        return "preset-checkered";
    }
  };

  return (
    <div className="main-display">
      <div
        className={`display-canvas-container ${getBackgroundClass()}`}
        style={getContainerStyle()}
      >
        {gridActive && <div className="grid-overlay" />}

        {/* Mount container for SpinePlayer / custom canvas */}
        <div id={containerId} className="spine-viewer-mount" />

        {loading && (
          <div className="loading-overlay">
            <div className="spinner" />
            <div style={{ fontSize: "14px", fontWeight: "500" }}>
              {t("loadingSpine", { version })}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="loading-overlay" style={{ zIndex: 9 }}>
            <div
              style={{
                background: "#ef444415",
                border: "1px solid #ef444430",
                padding: "24px",
                borderRadius: "12px",
                maxWidth: "450px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#f87171",
                  fontWeight: "600",
                  marginBottom: "8px",
                  fontSize: "16px",
                }}
              >
                {t("displayError")}
              </div>
              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  marginBottom: "16px",
                  overflowWrap: "break-word",
                }}
              >
                {errorMsg}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                {t("displayErrorTip")}
              </div>
            </div>
          </div>
        )}

        {isTransitioning && (
          <div className="loading-overlay" style={{ zIndex: 10 }}>
            <div className="spinner" />
            <div style={{ fontSize: "14px", fontWeight: "500", marginTop: "12px", color: "var(--accent-cyan)" }}>
              {t("loadingAssets")}
            </div>
          </div>
        )}

        {!model && !isTransitioning && (
          <div className="empty-state">
            <div
              className="logo-glow"
              style={{
                width: "64px",
                height: "64px",
                fontSize: "32px",
                marginBottom: "16px",
              }}
            >
              S
            </div>
            <h2 className="empty-state-title">AetherSpine Viewer</h2>
            <p className="empty-state-text">
              {t("emptyStateText")}
            </p>
          </div>
        )}
      </div>

      {model && !isTransitioning && !loading && !errorMsg && (
        <ControlBar
          loadedAnimations={loadedAnimations}
          loadedSkins={loadedSkins}
          activeSkin={activeSkin}
          onChangeSkin={onChangeSkin}
          playbackSpeed={playbackSpeed}
          onChangePlaybackSpeed={onChangePlaybackSpeed}
          onPlayAnimation={onPlayAnimation}
          language={language}
        />
      )}
    </div>
  );
}
