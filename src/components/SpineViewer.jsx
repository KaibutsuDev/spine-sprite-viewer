import React, { useEffect, useRef, useState } from "react";
import { SpinePlayer as LocalSpinePlayer } from "@esotericsoftware/spine-player";

// Supported Spine player CDN targets for runtime switching
const RUNTIME_CDNS = {
  4.3: {
    js: "https://unpkg.com/@esotericsoftware/spine-player@4.3/dist/iife/spine-player.js",
    css: "https://unpkg.com/@esotericsoftware/spine-player@4.3/dist/spine-player.css",
  },
  4.2: {
    js: "https://unpkg.com/@esotericsoftware/spine-player@4.2/dist/iife/spine-player.js",
    css: "https://unpkg.com/@esotericsoftware/spine-player@4.2/dist/spine-player.css",
  },
  4.1: {
    js: "https://unpkg.com/@esotericsoftware/spine-player@4.1/dist/iife/spine-player.js",
    css: "https://unpkg.com/@esotericsoftware/spine-player@4.1/dist/spine-player.css",
  },
  "4.0": {
    js: "https://unpkg.com/@esotericsoftware/spine-player@4.0/dist/iife/spine-player.js",
    css: "https://unpkg.com/@esotericsoftware/spine-player@4.0/dist/spine-player.css",
  },
  3.8: {
    js: "/spine-runtimes/3.8/spine-player.js",
    css: "/spine-runtimes/3.8/spine-player.css",
  },
  3.6: {
    js: "/spine-webgl.min.js",
    css: null,
  },
};

/**
 * Helper to decode base64 Data URLs to Uint8Array
 */
function dataURLToBytes(dataURL) {
  const base64 = dataURL.split(",")[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Helper to decode base64 Data URLs to string
 */
function dataURLToString(dataURL) {
  const bytes = dataURLToBytes(dataURL);
  return new TextDecoder().decode(bytes);
}

/**
 * Dynamically injects Spine Player CSS and JS files from CDN.
 * @param {string} version - The Spine version (e.g. "4.2")
 * @returns {Promise<void>}
 */
function loadSpineCDN(version) {
  return new Promise((resolve, reject) => {
    const config = RUNTIME_CDNS[version];
    if (!config) {
      reject(new Error(`Unsupported CDN version: ${version}`));
      return;
    }

    const scriptId = `spine-runtime-script-${version}`;
    const cssId = `spine-runtime-css-${version}`;

    // If already loaded in window
    if (document.getElementById(scriptId) && window.spine) {
      resolve();
      return;
    }

    // Remove any other dynamic Spine runtimes from DOM
    const dynamicScripts = document.querySelectorAll(
      'script[id^="spine-runtime-script-"]',
    );
    dynamicScripts.forEach((el) => el.remove());
    const dynamicCSS = document.querySelectorAll(
      'link[id^="spine-runtime-css-"]',
    );
    dynamicCSS.forEach((el) => el.remove());

    // Flush global namespace
    window.spine = undefined;

    // Load CSS (if available)
    if (config.css) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = config.css;
      document.head.appendChild(link);
    }

    // Load JS
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = config.js;
    script.async = true;

    script.onload = () => {
      // Small timeout to guarantee global namespace attachment
      setTimeout(() => {
        if (window.spine) {
          resolve();
        } else {
          reject(
            new Error(
              `Loaded spine script but window.spine is undefined for version ${version}`,
            ),
          );
        }
      }, 100);
    };

    script.onerror = () => {
      reject(new Error(`Failed to load Spine script from ${config.js}`));
    };

    document.body.appendChild(script);
  });
}

/**
 * Initialize Spine 3.6 WebGL renderer
 */
async function initSpine36WebGL(
  containerId,
  model,
  onModelLoaded,
  onLoadError,
  setLoading,
  setErrorMsg,
  active,
  playerRef,
) {
  try {
    const container = document.getElementById(containerId);
    if (!container) throw new Error("Container not found");

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 600;
    container.appendChild(canvas);

    // Initialize WebGL context
    const gl =
      canvas.getContext("webgl", { alpha: true }) ||
      canvas.getContext("experimental-webgl", { alpha: true });
    if (!gl) throw new Error("WebGL not supported");

    const spine = window.spine;
    if (!spine) throw new Error("Spine runtime not loaded");

    // Get skeleton data from model
    const atlasData = model.files[model.atlasFileName];
    const skeletonFileData = model.files[model.skeletonFileName];

    if (!atlasData || !skeletonFileData) {
      throw new Error("Missing atlas or skeleton data");
    }

    // Parse atlas text (decode base64 if it's a data URL)
    const atlasText = typeof atlasData === "string" && atlasData.startsWith("data:")
      ? dataURLToString(atlasData)
      : (atlasData instanceof ArrayBuffer ? new TextDecoder().decode(atlasData) : atlasData);

    // Preload textures as WebGL GLTextures asynchronously
    const textures = {};
    const imagePromises = Object.keys(model.files)
      .filter((filename) => filename.toLowerCase().endsWith(".png"))
      .map((filename) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            try {
              const glTexture = new spine.webgl.GLTexture(gl, img);
              textures[filename] = glTexture;
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = () => reject(new Error(`Failed to load image: ${filename}`));
          img.src = model.files[filename];
        });
      });

    await Promise.all(imagePromises);

    if (!active) return;

    // Create atlas (Spine 3.6 uses TextureAtlas with callback function)
    const atlas = new spine.TextureAtlas(atlasText, (imagePath) => {
      const texture = textures[imagePath];
      if (!texture) {
        console.error("Missing image for atlas:", imagePath);
        return null;
      }
      return texture;
    });

    // Create attachment loader
    const attachmentLoader = new spine.AtlasAttachmentLoader(atlas);

    // Parse and load skeleton
    let skeletonData = null;
    if (model.isBinary) {
      const skeletonBytes = typeof skeletonFileData === "string" && skeletonFileData.startsWith("data:")
        ? dataURLToBytes(skeletonFileData)
        : new Uint8Array(skeletonFileData);
      const skeletonLoader = new spine.SkeletonBinary(attachmentLoader);
      skeletonData = skeletonLoader.readSkeletonData(skeletonBytes);
    } else {
      const skeletonText = typeof skeletonFileData === "string" && skeletonFileData.startsWith("data:")
        ? dataURLToString(skeletonFileData)
        : (skeletonFileData instanceof ArrayBuffer ? new TextDecoder().decode(skeletonFileData) : skeletonFileData);
      const skeletonJson = JSON.parse(skeletonText);
      const skeletonLoader = new spine.SkeletonJson(attachmentLoader);
      skeletonData = skeletonLoader.readSkeletonData(skeletonJson);
    }

    if (!skeletonData) {
      throw new Error("Failed to load skeleton data");
    }

    // Create skeleton
    const skeleton = new spine.Skeleton(skeletonData);
    skeleton.setToSetupPose();

    // Setup animation state
    const animationStateData = new spine.AnimationStateData(skeletonData);
    const animationState = new spine.AnimationState(animationStateData);

    // Set default animation
    const animationNames = skeletonData.animations.map((a) => a.name);
    if (animationNames.length > 0) {
      animationState.setAnimation(0, animationNames[0], true);
    }

    // Get skins
    const skinNames = skeletonData.skins.map((s) => s.name);

    // Create renderer
    const shader = spine.webgl.Shader.newTwoColoredTextured(gl);
    const batcher = new spine.webgl.PolygonBatcher(gl);
    const renderer = new spine.webgl.SkeletonRenderer(gl);

    // Calculate bounds of skeleton for camera positioning
    skeleton.updateWorldTransform();
    const boundsOffset = new spine.Vector2();
    const boundsSize = new spine.Vector2();
    skeleton.getBounds(boundsOffset, boundsSize, []);

    // Setup matrices
    const mvp = new spine.webgl.Matrix4();

    let lastFrameTime = Date.now();
    let isRunning = true;

    const render = () => {
      if (!isRunning || !active) return;

      const now = Date.now();
      const deltaTime = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      // Handle canvas resizing and viewport updating
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }

      // Center camera on skeleton bounds
      const centerX = boundsOffset.x + boundsSize.x / 2;
      const centerY = boundsOffset.y + boundsSize.y / 2;
      const scaleX = boundsSize.x / canvas.width;
      const scaleY = boundsSize.y / canvas.height;
      let scale = 1.2 * Math.max(scaleX, scaleY);
      if (scale < 1.0) scale = 1.0;

      const orthoWidth = canvas.width * scale;
      const orthoHeight = canvas.height * scale;
      mvp.ortho2d(centerX - orthoWidth / 2, centerY - orthoHeight / 2, orthoWidth, orthoHeight);

      // Update animation
      animationState.update(deltaTime);
      animationState.apply(skeleton);
      skeleton.updateWorldTransform();

      // Clear and render
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Bind WebGL shader and set uniforms
      shader.bind();
      shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
      shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);

      batcher.begin(shader);
      renderer.draw(batcher, skeleton);
      batcher.end();

      shader.unbind();

      requestAnimationFrame(render);
    };

    // Start rendering
    render();

    // Create proxy player object compatible with the standard player interface
    const proxyPlayer = {
      skeleton: skeleton,
      animationState: animationState,
      dispose: () => {
        isRunning = false;
        try {
          gl.deleteProgram(shader.program);
          if (container.contains(canvas)) {
            container.removeChild(canvas);
          }
        } catch (e) {
          console.warn("Error during cleanup:", e);
        }
      },
      setAnimation: (animationName, loop) => {
        try {
          animationState.setAnimation(0, animationName, loop);
        } catch (e) {
          console.error("Failed to play animation on proxy:", e);
        }
      },
      setSkin: (skinName) => {
        try {
          skeleton.setSkinByName(skinName);
          skeleton.setSlotsToSetupPose();
        } catch (e) {
          console.error("Failed to set skin on proxy:", e);
        }
      },
      state: {
        setAnimation: (trackIndex, animationName, loop) => {
          animationState.setAnimation(trackIndex, animationName, loop);
        },
        clearAnimation: (trackIndex) => {
          animationState.clearAnimation(trackIndex);
        },
      },
    };

    playerRef.current = proxyPlayer;

    if (onModelLoaded) {
      onModelLoaded({
        player: proxyPlayer,
        animations: animationNames,
        skins: skinNames,
        skeletonData: skeletonData,
      });
    }

    setLoading(false);
  } catch (err) {
    console.error("Spine 3.6 initialization error:", err);
    setErrorMsg(err.message || "Error initializing Spine 3.6 renderer");
    setLoading(false);
    if (onLoadError) onLoadError(err.message);
  }
}

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
  const playerRef = useRef(null);
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

      // Cleanup existing player instance
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.warn("Error disposing previous spine player:", e);
        }
        playerRef.current = null;
      }

      // Clear DOM container
      const mountNode = document.getElementById(containerId);
      if (mountNode) {
        mountNode.innerHTML = "";
      }

      try {
        // Special handling for Spine 3.6 with WebGL
        if (version === "3.6") {
          await loadSpineCDN(version);
          if (!active) return;
          if (!window.spine) {
            throw new Error("Failed to load Spine 3.6 WebGL runtime");
          }
          await initSpine36WebGL(
            containerId,
            model,
            onModelLoaded,
            onLoadError,
            setLoading,
            setErrorMsg,
            active,
            playerRef,
          );
        } else {
          let SpinePlayerClass = null;

          // Determine if we need to load from CDN or bundle
          // Local bundle is 4.3.7. If they selected "4.3", we can use the local bundle directly.
          if (version === "4.3") {
            SpinePlayerClass = LocalSpinePlayer;
          } else {
            // Load specific player version from CDN
            await loadSpineCDN(version);
            if (!active) return;
            if (window.spine && window.spine.SpinePlayer) {
              SpinePlayerClass = window.spine.SpinePlayer;
            } else {
              throw new Error(
                `Failed to load Spine player from CDN for version ${version}`,
              );
            }
          }

          // Build rawDataURIs config mapping
          const rawDataURIs = {};
          Object.keys(model.files).forEach((filename) => {
            rawDataURIs[filename] = model.files[filename];
          });

          // Setup player config parameters
          const playerConfig = {
            atlasUrl: model.atlasFileName,
            rawDataURIs: rawDataURIs,
            premultipliedAlpha: premultipliedAlpha,
            showControls: true,
            backgroundColor: "#00000000", // Clear transparent
            alpha: true,
            success: (player) => {
              if (!active) return;
              playerRef.current = player;

              // Extract skins and animations to pass to parent controls
              try {
                const skeleton = player.skeleton;
                const animations =
                  skeleton.data.animations.map((a) => a.name) || [];
                const skins = skeleton.data.skins.map((s) => s.name) || [];

                if (onModelLoaded) {
                  onModelLoaded({
                    player,
                    animations,
                    skins,
                    skeletonData: skeleton.data,
                  });
                }
              } catch (err) {
                console.error(
                  "Error reading skeleton info in success callback:",
                  err,
                );
              }
              setLoading(false);
            },
            error: (player, err) => {
              if (!active) return;
              console.error("Spine player internal error callback:", err);
              const msg =
                typeof err === "string"
                  ? err
                  : err?.message ||
                    "Verify compatibility between skeleton/atlas assets and the selected Spine runtime.";
              setErrorMsg(msg);
              setLoading(false);
              if (onLoadError) onLoadError(msg);
            },
          };

          // Inject skeleton file url
          if (model.isBinary) {
            playerConfig.skelUrl = model.skeletonFileName;
          } else {
            playerConfig.jsonUrl = model.skeletonFileName;
          }

          // Instantiate SpinePlayer on the target mount node
          if (active) {
            new SpinePlayerClass(containerId, playerConfig);
          }
        }
      } catch (err) {
        if (!active) return;
        console.error("Failed to initialize Spine player:", err);
        setErrorMsg(
          err.message || "An unexpected error occurred during loading.",
        );
        setLoading(false);
        if (onLoadError) onLoadError(err.message);
      }
    };

    initPlayer();

    return () => {
      active = false;
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.warn("Cleanup error during unmount:", e);
        }
        playerRef.current = null;
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

        {/* Mount container for SpinePlayer */}
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
