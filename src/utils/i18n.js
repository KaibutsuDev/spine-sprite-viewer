const translations = {
  es: {
    logoSubtitle: "Visor 2D",
    loadAssets: "Cargar Assets",
    dragDropText: "Arrastra aquí tus archivos",
    dragDropSubtext:
      "Sube en conjunto tus archivos (.png, .atlas.txt, y .skel.txt / .json) o haz clic para buscar.",
    selectFiles: "Seleccionar Archivos",
    uploadFolder: "Subir Carpeta",
    processingFiles: "Procesando archivos...",
    spriteSettings: "Configuración del Sprite",
    activeModel: "Modelo Activo:",
    spineVersion: "Versión de Spine Runtime:",
    spineVersionNote:
      "Nota: El visor se reiniciará para cargar el reproductor correspondiente de CDN.",
    showGrid: "Mostrar Cuadrícula de Guía",
    canvasBackground: "Fondo de Pantalla",
    bgCheckered: "Cuadrícula",
    bgBlueprint: "Guía",
    bgSpace: "Espacio",
    bgNeon: "Neón",
    bgStudio: "Estudio",
    bgSlate: "Pizarra",
    bgDark: "Oscuro",
    bgLight: "Claro",
    solidColor: "Color Sólido:",
    customBgUrl: "Cargar Fondo Personalizado:",
    pasteUrlPlaceholder: "Pegar URL de imagen...",
    uploadBgLocal: "Subir Imagen de Fondo Local",
    presetModels: "Modelos de Prueba",
    recentUploads: "Modelos Recientes",
    noRecentUploads: "Aún no has subido modelos.",
    folderText: "Carpeta",
    deleteHistory: "Eliminar del historial",

    // ControlBar
    spriteActions: "Acciones del Sprite",
    loop: "Loop",
    load: "Cargar",
    skinOutfit: "Skin / Aspecto",
    playbackSpeed: "Velocidad de Reproducción",

    // SpineViewer
    loadingSpine: "Cargando modelo Spine ({version})...",
    displayError: "Error de Visualización",
    displayErrorTip:
      "Tip: Intenta cambiar la versión de Spine en el panel lateral si el archivo fue exportado en una versión diferente.",
    loadingAssets: "Cargando recursos del modelo...",
    emptyStateText:
      "Sube una carpeta o selecciona archivos que contengan un atlas (`.atlas.txt`), un esqueleto (`.json` o `.skel.txt`), y texturas (`.png`) para visualizar tu modelo 2D.",
  },
  en: {
    logoSubtitle: "2D Viewer",
    loadAssets: "Load Assets",
    dragDropText: "Drag & drop your files here",
    dragDropSubtext:
      "Upload your files (.png, .atlas.txt, and .skel.txt / .json) together or click to browse.",
    selectFiles: "Select Files",
    uploadFolder: "Upload Folder",
    processingFiles: "Processing files...",
    spriteSettings: "Sprite Settings",
    activeModel: "Active Model:",
    spineVersion: "Spine Runtime Version:",
    spineVersionNote:
      "Note: The viewer will restart to load the corresponding player from CDN.",
    showGrid: "Show Guide Grid",
    canvasBackground: "Canvas Background",
    bgCheckered: "Checkered",
    bgBlueprint: "Blueprint",
    bgSpace: "Space",
    bgNeon: "Neon",
    bgStudio: "Studio",
    bgSlate: "Slate",
    bgDark: "Obsidian",
    bgLight: "Light",
    solidColor: "Solid Color:",
    customBgUrl: "Custom Background URL:",
    pasteUrlPlaceholder: "Paste image URL...",
    uploadBgLocal: "Upload Local Background",
    presetModels: "Preset Models",
    recentUploads: "Recent Uploads",
    noRecentUploads: "No models uploaded yet.",
    folderText: "Folder",
    deleteHistory: "Remove from history",

    // ControlBar
    spriteActions: "Sprite Actions",
    loop: "Loop",
    load: "Load",
    skinOutfit: "Skin / Outfit",
    playbackSpeed: "Playback Speed",

    // SpineViewer
    loadingSpine: "Loading Spine model ({version})...",
    displayError: "Display Error",
    displayErrorTip:
      "Tip: Try changing the Spine version in the sidebar if the assets were exported in a different version.",
    loadingAssets: "Loading model assets...",
    emptyStateText:
      "Upload a folder or select files containing an atlas (`.atlas.txt`), a skeleton (`.json` or `.skel.txt`), and textures (`.png`) to visualize your 2D model.",
  },
};

export function getTranslation(lang, key, params = {}) {
  const dict = translations[lang] || translations["en"];
  let text = dict[key] || key;

  Object.keys(params).forEach((param) => {
    text = text.replace(`{${param}}`, params[param]);
  });

  return text;
}
