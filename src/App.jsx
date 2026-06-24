import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './components/Sidebar';
import SpineViewer from './components/SpineViewer';
import { getModels, deleteModel } from './db';

export default function App() {
  // Database / Upload list states
  const [recentModels, setRecentModels] = useState([]);
  const [activeModelId, setActiveModelId] = useState('');
  const [activeModel, setActiveModel] = useState(null);
  const [loadingPreset, setLoadingPreset] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Viewer options
  const [spineVersion, setSpineVersion] = useState('3.6');
  const [premultipliedAlpha, setPremultipliedAlpha] = useState(true);
  const [gridActive, setGridActive] = useState(true);

  // Background states
  const [bgStyle, setBgStyle] = useState('checkered');
  const [bgUrl, setBgUrl] = useState('');
  const [bgColor, setBgColor] = useState('#1e293b');

  // Loaded spine information (from success callback)
  const [loadedAnimations, setLoadedAnimations] = useState([]);
  const [loadedSkins, setLoadedSkins] = useState([]);
  const [activeAnimation, setActiveAnimation] = useState('');
  const [activeSkin, setActiveSkin] = useState('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [activeTracks, setActiveTracks] = useState({ 0: '' });
  const [language, setLanguage] = useState(() => localStorage.getItem('aetherspine_lang') || 'en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const playerRef = useRef(null);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('aetherspine_lang', lang);
  };

  const PRESET_MODELS = [
    {
      id: 'preset-spineboy',
      name: 'Spineboy Pro (Spine 4.3)',
      version: '4.3',
      isBinary: true,
      folder: 'spineboy',
      atlasFileName: 'spineboy.atlas',
      skeletonFileName: 'spineboy-pro.skel',
      pngFiles: ['spineboy.png'],
    },
    {
      id: 'preset-100111',
      name: 'Model 100111 (Spine 3.6)',
      version: '3.6',
      isBinary: true,
      folder: '100111',
      atlasFileName: '100111.atlas',
      skeletonFileName: '100111.skel',
      pngFiles: ['100111.png'],
    },
    {
      id: 'preset-hero-princess',
      name: 'Hero Princess Knight (Spine 3.6)',
      version: '3.6',
      isBinary: true,
      folder: 'hero_princess_knight',
      atlasFileName: 'hero_princess_knight.atlas.txt',
      skeletonFileName: 'hero_princess_knight.skel.txt',
      pngFiles: ['hero_princess_knight.png'],
    }
  ];

  // Load recent models from IndexedDB on component mount
  useEffect(() => {
    loadRecentModels();
  }, []);

  const loadRecentModels = async () => {
    try {
      const list = await getModels();
      setRecentModels(list);
      
      // Auto-load the most recent model if none is selected
      if (list.length > 0 && !activeModelId) {
        handleSelectModel(list[0]);
      }
    } catch (err) {
      console.error("Failed to load recent models from IndexedDB:", err);
    }
  };

  const fetchAsDataURL = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al cargar el archivo del servidor: ${url}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  };

  const handleSelectPreset = async (preset) => {
    setSidebarOpen(false); // Close sidebar on mobile
    setLoadingPreset(true);
    if (activeModel) {
      setIsTransitioning(true);
    }
    try {
      const filesMap = {};
      const basePath = `/sprite/${preset.folder}/`;

      // Fetch atlas
      filesMap[preset.atlasFileName] = await fetchAsDataURL(`${basePath}${preset.atlasFileName}`);

      // Fetch skeleton
      filesMap[preset.skeletonFileName] = await fetchAsDataURL(`${basePath}${preset.skeletonFileName}`);

      // Fetch images
      for (const png of preset.pngFiles) {
        filesMap[png] = await fetchAsDataURL(`${basePath}${png}`);
      }

      const presetModel = {
        id: preset.id,
        name: preset.name,
        files: filesMap,
        atlasFileName: preset.atlasFileName,
        skeletonFileName: preset.skeletonFileName,
        isBinary: preset.isBinary,
        version: preset.version,
        timestamp: Date.now(),
        isPreset: true
      };

      handleSelectModel(presetModel);
    } catch (err) {
      console.error("Failed to load preset:", err);
      alert(`No se pudo cargar el modelo de prueba: ${err.message}`);
    } finally {
      setLoadingPreset(false);
    }
  };

  const handleSelectModel = (model) => {
    setSidebarOpen(false); // Close sidebar on mobile
    if (activeModel) {
      setIsTransitioning(true);
      // Clear everything first to force SpineViewer unmount/cleanup
      setActiveModelId('');
      setActiveModel(null);
      setLoadedAnimations([]);
      setLoadedSkins([]);
      setActiveAnimation('');
      setActiveSkin('');
      setActiveTracks({ 0: '' });
      playerRef.current = null;

      // Load the new model on the next tick
      setTimeout(() => {
        setActiveModelId(model.id);
        setActiveModel(model);
        setSpineVersion(model.version || '3.6');
      }, 100);
    } else {
      setIsTransitioning(true);
      setActiveModelId(model.id);
      setActiveModel(model);
      setSpineVersion(model.version || '3.6');
      
      // Clear previously loaded animations and skins
      setLoadedAnimations([]);
      setLoadedSkins([]);
      setActiveAnimation('');
      setActiveSkin('');
      setActiveTracks({ 0: '' });
      playerRef.current = null;
    }
  };

  const handleDeleteModel = async (id) => {
    try {
      await deleteModel(id);
      
      // Update local state list
      const updatedList = recentModels.filter(m => m.id !== id);
      setRecentModels(updatedList);

      // If the deleted model was active, clear selection or switch to next
      if (activeModelId === id) {
        if (updatedList.length > 0) {
          handleSelectModel(updatedList[0]);
        } else {
          setActiveModelId('');
          setActiveModel(null);
          setLoadedAnimations([]);
          setLoadedSkins([]);
          setActiveAnimation('');
          setActiveSkin('');
          setActiveTracks({ 0: '' });
          playerRef.current = null;
        }
      }
    } catch (err) {
      console.error("Failed to delete model:", err);
    }
  };

  const handleUploadSuccess = (newModel) => {
    // Refresh the local recent list from DB
    loadRecentModels();
    // Set the new model as the active one
    handleSelectModel(newModel);
  };

  // Called when the Spine player successfully loads the skeleton
  const handleModelLoaded = ({ player, animations, skins }) => {
    playerRef.current = player;
    setLoadedAnimations(animations);
    setLoadedSkins(skins);
    setIsTransitioning(false);

    // Apply current playback speed
    player.setPlaybackSpeed(playbackSpeed);

    // Auto-select first skin
    if (skins && skins.length > 0) {
      // Find default skin if present, otherwise use first
      const defaultSkin = skins.find(s => s === 'default') || skins[0];
      setActiveSkin(defaultSkin);
      try {
        player.setSkin(defaultSkin);
      } catch (e) {
        console.warn("Could not set initial skin:", e);
      }
    }

    // Play default animation
    if (animations && animations.length > 0) {
      // Auto-play typical animations if available, otherwise fallback to index 0
      const defaultAnim = animations.find(
        name => name.includes('idle') || 
                name.includes('walk') || 
                name.includes('run') || 
                name.includes('action')
      ) || animations[0];

      setActiveAnimation(defaultAnim);
      setActiveTracks({ 0: defaultAnim });
      try {
        player.setAnimation(defaultAnim, true, 0);
      } catch (e) {
        console.warn("Could not set initial animation:", e);
      }
    } else {
      setActiveTracks({});
    }
  };

  const handlePlayAnimation = (animName, loop = true, trackIndex = 0) => {
    if (playerRef.current) {
      try {
        playerRef.current.setAnimation(animName, loop, trackIndex);
        setActiveTracks(prev => ({ ...prev, [trackIndex]: animName }));
        if (trackIndex === 0) {
          setActiveAnimation(animName);
        }
      } catch (e) {
        console.error(`Failed to play animation on track ${trackIndex}:`, e);
      }
    }
  };

  const handleClearTrack = (trackIndex) => {
    if (playerRef.current) {
      try {
        playerRef.current.clearTrack(trackIndex);
        setActiveTracks(prev => {
          const next = { ...prev };
          delete next[trackIndex];
          return next;
        });
         if (trackIndex === 0) {
          setActiveAnimation('');
        }
      } catch (e) {
        console.error(`Failed to clear track ${trackIndex}:`, e);
      }
    }
  };

  const handlePlaybackSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (playerRef.current) {
      try {
        playerRef.current.setPlaybackSpeed(speed);
      } catch (e) {
        console.error("Failed to change playback speed:", e);
      }
    }
  };

  const handleSkinChange = (skinName) => {
    if (playerRef.current) {
      try {
        playerRef.current.setSkin(skinName);
        setActiveSkin(skinName);
      } catch (e) {
        console.error("Failed to change skin:", e);
      }
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Top Navigation Bar */}
      <div className="mobile-nav-bar">
        <div className="logo-glow" style={{ width: '28px', height: '28px', fontSize: '14px' }}>S</div>
        <span style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.3px' }}>AetherSpine</span>
        <button
          className="menu-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            ) : (
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            )}
          </svg>
        </button>
      </div>

      <Sidebar
        recentModels={recentModels}
        presetModels={PRESET_MODELS}
        loadingPreset={loadingPreset}
        activeModelId={activeModelId}
        loadedAnimations={loadedAnimations}
        loadedSkins={loadedSkins}
        activeAnimation={activeAnimation}
        activeSkin={activeSkin}
        spineVersion={spineVersion}
        premultipliedAlpha={premultipliedAlpha}
        gridActive={gridActive}
        bgStyle={bgStyle}
        bgUrl={bgUrl}
        bgColor={bgColor}
        playbackSpeed={playbackSpeed}
        activeTracks={activeTracks}
        language={language}
        onChangeLanguage={handleLanguageChange}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        onSelectModel={handleSelectModel}
        onSelectPreset={handleSelectPreset}
        onDeleteModel={handleDeleteModel}
        onUploadSuccess={handleUploadSuccess}
        onChangeVersion={setSpineVersion}
        onChangeAlpha={setPremultipliedAlpha}
        onChangeGrid={setGridActive}
        onChangeBgStyle={setBgStyle}
        onChangeBgUrl={setBgUrl}
        onChangeBgColor={setBgColor}
        onPlayAnimation={handlePlayAnimation}
        onChangeSkin={handleSkinChange}
        onChangePlaybackSpeed={handlePlaybackSpeedChange}
        onClearTrack={handleClearTrack}
      />

      {/* Main Spine visualization canvas area */}
      <SpineViewer
        model={activeModel}
        version={spineVersion}
        bgStyle={bgStyle}
        bgUrl={bgUrl}
        bgColor={bgColor}
        gridActive={gridActive}
        premultipliedAlpha={premultipliedAlpha}
        isTransitioning={isTransitioning}
        onModelLoaded={handleModelLoaded}
        onLoadError={(err) => {
          // Clear active controls if display errors
          setLoadedAnimations([]);
          setLoadedSkins([]);
          playerRef.current = null;
          setIsTransitioning(false);
        }}
        loadedAnimations={loadedAnimations}
        loadedSkins={loadedSkins}
        activeSkin={activeSkin}
        playbackSpeed={playbackSpeed}
        activeTracks={activeTracks}
        language={language}
        onPlayAnimation={handlePlayAnimation}
        onChangeSkin={handleSkinChange}
        onChangePlaybackSpeed={handlePlaybackSpeedChange}
        onClearTrack={handleClearTrack}
      />
    </div>
  );
}
