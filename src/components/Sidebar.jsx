import React, { useRef, useState } from "react";
import { saveModel } from "../db";

export default function Sidebar({
  recentModels,
  presetModels = [],
  loadingPreset = false,
  activeModelId,
  loadedAnimations,
  loadedSkins,
  activeAnimation,
  activeSkin,
  spineVersion,
  premultipliedAlpha,
  gridActive,
  bgStyle,
  bgUrl,
  bgColor,
  onSelectModel,
  onSelectPreset,
  onDeleteModel,
  onUploadSuccess,
  onChangeVersion,
  onChangeAlpha,
  onChangeGrid,
  onChangeBgStyle,
  onChangeBgUrl,
  onChangeBgColor,
  onPlayAnimation,
  onChangeSkin,
  playerInstance,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loadingUpload, setLoadingUpload] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const bgFileInputRef = useRef(null);
  const [loopAnimation, setLoopAnimation] = useState(true);

  // Drag handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = async (filesList) => {
    setLoadingUpload(true);
    setUploadError("");

    let atlasFile = null;
    let skeletonFile = null;
    const pngFiles = [];

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const name = file.name.toLowerCase();

      // Match file extensions
      if (name.endsWith(".atlas") || name.endsWith(".atlas.txt")) {
        atlasFile = file;
      } else if (
        name.endsWith(".json") ||
        name.endsWith(".skel") ||
        name.endsWith(".skel.txt") ||
        name.endsWith(".json.txt")
      ) {
        skeletonFile = file;
      } else if (name.endsWith(".png")) {
        pngFiles.push(file);
      }
    }

    if (!atlasFile) {
      setUploadError("Falta el archivo Atlas (.atlas o .atlas.txt)");
      setLoadingUpload(false);
      return;
    }
    if (!skeletonFile) {
      setUploadError(
        "Falta el archivo de Esqueleto (.json, .skel o .skel.txt)",
      );
      setLoadingUpload(false);
      return;
    }
    if (pngFiles.length === 0) {
      setUploadError("Falta el archivo de Imagen (.png)");
      setLoadingUpload(false);
      return;
    }

    // Convert file to Base64 Data URL
    const fileToDataURL = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    };

    try {
      const filesMap = {};

      // Load atlas as Data URL
      filesMap[atlasFile.name] = await fileToDataURL(atlasFile);

      // Load skeleton as Data URL
      filesMap[skeletonFile.name] = await fileToDataURL(skeletonFile);

      // Load all image textures as Data URLs
      for (const png of pngFiles) {
        filesMap[png.name] = await fileToDataURL(png);
      }

      const isBinary =
        skeletonFile.name.endsWith(".skel") ||
        skeletonFile.name.endsWith(".skel.txt");
      const folderName = skeletonFile.name.replace(
        /\.(json|skel|skel\.txt|json\.txt)$/i,
        "",
      );

      // Attempt to read version from JSON if text
      let detectedVersion = "4.2"; // default baseline
      if (!isBinary) {
        try {
          const text = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(skeletonFile);
          });
          const parsed = JSON.parse(text);
          if (parsed.skeleton?.spine) {
            const versionString = parsed.skeleton.spine;
            if (versionString.startsWith("3.8")) detectedVersion = "3.8";
            else if (versionString.startsWith("4.0")) detectedVersion = "4.0";
            else if (versionString.startsWith("4.1")) detectedVersion = "4.1";
            else if (versionString.startsWith("4.2")) detectedVersion = "4.2";
            else if (versionString.startsWith("4.3")) detectedVersion = "4.3";
          }
        } catch (e) {
          console.warn("Could not read Spine version from JSON:", e);
        }
      }

      const newModel = {
        id: Date.now().toString(),
        name: folderName,
        files: filesMap,
        atlasFileName: atlasFile.name,
        skeletonFileName: skeletonFile.name,
        isBinary: isBinary,
        version: detectedVersion,
        timestamp: Date.now(),
      };

      // Save to IndexedDB
      await saveModel(newModel);
      onUploadSuccess(newModel);
    } catch (err) {
      console.error(err);
      setUploadError("Error procesando los archivos: " + err.message);
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleBgImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        onChangeBgUrl(reader.result);
        onChangeBgStyle("custom-image");
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const activeModel = recentModels.find((m) => m.id === activeModelId);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-glow">S</div>
        <div>
          <h1 className="logo-title">AetherSpine</h1>
          <span className="version-badge">2D Viewer</span>
        </div>
      </div>

      <div className="sidebar-content">
        {/* Upload Block */}
        <div>
          <div className="section-title">
            <span>Cargar Assets</span>
          </div>

          <div
            className={`dropzone ${dragActive ? "dragover" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-icon">
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
              </svg>
            </div>
            <div className="dropzone-text">Arrastra aquí tus archivos</div>
            <div className="dropzone-subtext">
              Sube en conjunto tus archivos (.png, .atlas.txt, y .skel.txt /
              .json) o haz clic para buscar.
            </div>

            {loadingUpload && (
              <div className="loading-overlay" style={{ borderRadius: "12px" }}>
                <div
                  className="spinner"
                  style={{ width: "24px", height: "24px" }}
                />
                <span style={{ fontSize: "11px" }}>Procesando archivos...</span>
              </div>
            )}
          </div>

          {/* Input Selectors */}
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button
              className="action-btn"
              style={{ flex: 1, fontSize: "12px", padding: "6px" }}
              onClick={() => fileInputRef.current?.click()}
            >
              Seleccionar Archivos
            </button>
            <button
              className="action-btn"
              style={{
                flex: 1,
                fontSize: "12px",
                padding: "6px",
                background: "#3b82f6",
              }}
              onClick={() => folderInputRef.current?.click()}
            >
              Subir Carpeta
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            multiple
            accept=".png,.atlas,.txt,.json,.skel"
            onChange={handleFileSelect}
          />
          <input
            type="file"
            ref={folderInputRef}
            style={{ display: "none" }}
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={handleFileSelect}
          />

          {uploadError && (
            <div
              style={{
                color: "#ef4444",
                fontSize: "12px",
                marginTop: "8px",
                background: "rgba(239,68,68,0.1)",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {uploadError}
            </div>
          )}
        </div>

        {/* Model Configurations */}
        {activeModel && (
          <div>
            <div className="section-title">Configuración del Sprite</div>
            <div className="card controls-grid">
              <div>
                <span className="control-label">Modelo Activo:</span>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--accent-cyan)",
                  }}
                >
                  {activeModel.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                    wordBreak: "break-all",
                  }}
                >
                  {activeModel.skeletonFileName}
                </div>
              </div>

              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid var(--border-color)",
                  margin: "4px 0",
                }}
              />

              <div>
                <label className="control-label">
                  Versión de Spine Runtime:
                </label>
                <select
                  className="select-control"
                  value={spineVersion}
                  onChange={(e) => onChangeVersion(e.target.value)}
                >
                  <option value="4.3">Spine 4.3 (Latest/Local)</option>
                  <option value="4.2">Spine 4.2</option>
                  <option value="4.1">Spine 4.1</option>
                  <option value="4.0">Spine 4.0</option>
                  <option value="3.6">Spine 3.6 (WebGL Local)</option>
                </select>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  Nota: El visor se reiniciará para cargar el reproductor
                  correspondiente de CDN.
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={premultipliedAlpha}
                    onChange={(e) => onChangeAlpha(e.target.checked)}
                  />
                  <span>Premultiplied Alpha (PMA)</span>
                </label>
              </div>

              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={gridActive}
                    onChange={(e) => onChangeGrid(e.target.checked)}
                  />
                  <span>Mostrar Cuadrícula de Guía</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Skin Selector */}
        {activeModel && loadedSkins.length > 1 && (
          <div>
            <div className="section-title">Skin / Aspecto</div>
            <div className="card">
              <select
                className="select-control"
                value={activeSkin || ""}
                onChange={(e) => onChangeSkin(e.target.value)}
              >
                {loadedSkins.map((skinName) => (
                  <option key={skinName} value={skinName}>
                    {skinName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Animations List */}
        {activeModel && loadedAnimations.length > 0 && (
          <div>
            <div className="section-title">
              <span>Animaciones ({loadedAnimations.length})</span>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                  textTransform: "none",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={loopAnimation}
                  onChange={(e) => setLoopAnimation(e.target.checked)}
                />
                <span>Loop</span>
              </label>
            </div>

            <div
              className="card"
              style={{ padding: "8px", maxHeight: "250px", overflowY: "auto" }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                {loadedAnimations.map((animName) => {
                  const isActive = activeAnimation === animName;
                  return (
                    <button
                      key={animName}
                      className={`preset-btn ${isActive ? "active" : ""}`}
                      style={{
                        height: "auto",
                        padding: "8px 12px",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: isActive
                          ? "rgba(99, 102, 241, 0.12)"
                          : "rgba(0,0,0,0.15)",
                        border: isActive
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border-color)",
                        color: isActive ? "white" : "var(--text-secondary)",
                      }}
                      onClick={() => onPlayAnimation(animName, loopAnimation)}
                    >
                      <span style={{ display: "flex", alignItems: "center" }}>
                        {isActive ? (
                          <svg
                            width="12"
                            height="12"
                            fill="var(--accent-cyan)"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                          </svg>
                        ) : (
                          <svg
                            width="12"
                            height="12"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: isActive ? "600" : "400",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {animName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Background Selector */}
        <div>
          <div className="section-title">Fondo de Pantalla</div>
          <div className="card controls-grid">
            <div className="bg-presets">
              <button
                title="Cuadrícula Alfa"
                className={`preset-btn preset-checkered ${bgStyle === "checkered" ? "active" : ""}`}
                onClick={() => onChangeBgStyle("checkered")}
              >
                <span className="preset-btn-label">Cuadrícula</span>
              </button>
              <button
                title="Blueprint"
                className={`preset-btn preset-blueprint ${bgStyle === "blueprint" ? "active" : ""}`}
                onClick={() => onChangeBgStyle("blueprint")}
              >
                <span className="preset-btn-label">Guía</span>
              </button>
              <button
                title="Espacio Cósmico"
                className={`preset-btn preset-space ${bgStyle === "space" ? "active" : ""}`}
                onClick={() => onChangeBgStyle("space")}
              >
                <span className="preset-btn-label">Espacio</span>
              </button>
              <button
                title="Amanecer Neón"
                className={`preset-btn preset-neon-dusk ${bgStyle === "neon-dusk" ? "active" : ""}`}
                onClick={() => onChangeBgStyle("neon-dusk")}
              >
                <span className="preset-btn-label">Neón</span>
              </button>
              <button
                title="Estudio Gris"
                className={`preset-btn preset-studio ${bgStyle === "studio" ? "active" : ""}`}
                onClick={() => onChangeBgStyle("studio")}
              >
                <span className="preset-btn-label">Estudio</span>
              </button>
              <button
                title="Gris Pizarra"
                className={`preset-btn preset-slate-grey ${bgStyle === "slate-grey" ? "active" : ""}`}
                onClick={() => onChangeBgStyle("slate-grey")}
              >
                <span className="preset-btn-label">Pizarra</span>
              </button>
              <button
                title="Negro Absoluto"
                className={`preset-btn preset-dark-obsidian ${bgStyle === "dark-obsidian" ? "active" : ""}`}
                onClick={() => onChangeBgStyle("dark-obsidian")}
              >
                <span className="preset-btn-label">Oscuro</span>
              </button>
              <button
                title="Blanco Papel"
                className={`preset-btn preset-paper-white ${bgStyle === "paper-white" ? "active" : ""}`}
                onClick={() => onChangeBgStyle("paper-white")}
              >
                <span className="preset-btn-label">Claro</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="control-label" style={{ margin: 0 }}>
                Color Sólido:
              </span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => {
                  onChangeBgColor(e.target.value);
                  onChangeBgStyle("custom-color");
                }}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  width: "32px",
                  height: "24px",
                }}
              />
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--border-color)",
              }}
            />

            <div>
              <span className="control-label">Cargar Fondo Personalizado:</span>

              <div className="url-input-container">
                <input
                  type="text"
                  placeholder="Pegar URL de imagen..."
                  className="text-input"
                  value={
                    bgStyle === "custom-image" && !bgUrl.startsWith("data:")
                      ? bgUrl
                      : ""
                  }
                  onChange={(e) => {
                    onChangeBgUrl(e.target.value);
                    onChangeBgStyle("custom-image");
                  }}
                />
              </div>

              <button
                className="action-btn"
                style={{
                  width: "100%",
                  marginTop: "8px",
                  fontSize: "11px",
                  padding: "6px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                }}
                onClick={() => bgFileInputRef.current?.click()}
              >
                Subir Imagen de Fondo Local
              </button>

              <input
                type="file"
                ref={bgFileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleBgImageUpload}
              />
            </div>
          </div>
        </div>

        {/* Preset/Test Models List */}
        <div>
          <div className="section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Modelos de Prueba</span>
            {loadingPreset && (
              <div className="spinner" style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent-cyan)" }} />
            )}
          </div>

          <div className="recent-list" style={{ marginBottom: "16px" }}>
            {presetModels.map((preset) => {
              const isActive = preset.id === activeModelId;
              return (
                <div
                  key={preset.id}
                  className={`recent-item ${isActive ? "active" : ""}`}
                  onClick={() => !loadingPreset && onSelectPreset(preset)}
                  style={{ 
                    cursor: loadingPreset ? "not-allowed" : "pointer", 
                    opacity: loadingPreset && !isActive ? 0.5 : 1,
                    pointerEvents: loadingPreset ? "none" : "auto"
                  }}
                >
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div className="recent-name" title={preset.name}>
                      {preset.name}
                    </div>
                    <div className="recent-date">
                      Carpeta: public/sprite/{preset.folder} •{" "}
                      <span style={{ color: "var(--accent-cyan)" }}>
                        Spine {preset.version}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Uploads List */}
        <div>
          <div className="section-title">
            <span>Modelos Recientes</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              ({recentModels.length})
            </span>
          </div>

          {recentModels.length === 0 ? (
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "12px",
                background: "rgba(0,0,0,0.1)",
                borderRadius: "8px",
                border: "1px dashed var(--border-color)",
              }}
            >
              Aún no has subido modelos.
            </div>
          ) : (
            <div className="recent-list">
              {recentModels.map((model) => {
                const isActive = model.id === activeModelId;
                const formattedDate = new Date(
                  model.timestamp,
                ).toLocaleDateString("es-ES", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={model.id}
                    className={`recent-item ${isActive ? "active" : ""}`}
                    onClick={() => onSelectModel(model)}
                  >
                    <div
                      style={{ flexGrow: 1, minWidth: 0, paddingRight: "8px" }}
                    >
                      <div className="recent-name" title={model.name}>
                        {model.name}
                      </div>
                      <div className="recent-date">
                        {formattedDate} •{" "}
                        <span style={{ color: "var(--accent-cyan)" }}>
                          Spine {model.version}
                        </span>
                      </div>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteModel(model.id);
                      }}
                      title="Eliminar del historial"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
