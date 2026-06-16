import React, { useEffect, useRef, useState } from "react";
import { createSpineAdapter } from "../utils/spine/SpineAdapterFactory";

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
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const adapterRef = useRef(null);
  const containerId = "spine-player-container-mount";

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
              Cargando modelo Spine ({version})...
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
                Error de Visualización
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
                Tip: Intenta cambiar la versión de Spine en el panel lateral si
                el archivo fue exportado en una versión diferente.
              </div>
            </div>
          </div>
        )}

        {isTransitioning && (
          <div className="loading-overlay" style={{ zIndex: 10 }}>
            <div className="spinner" />
            <div style={{ fontSize: "14px", fontWeight: "500", marginTop: "12px", color: "var(--accent-cyan)" }}>
              Cargando recursos del modelo...
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
              Sube una carpeta o selecciona archivos que contengan un atlas
              (`.atlas.txt`), un esqueleto (`.json` o `.skel.txt`), y texturas
              (`.png`) para visualizar tu modelo 2D.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
