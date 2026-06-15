import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import SpineViewer from './components/SpineViewer';
import { getModels, deleteModel } from './db';

export default function App() {
  // Database / Upload list states
  const [recentModels, setRecentModels] = useState([]);
  const [activeModelId, setActiveModelId] = useState('');
  const [activeModel, setActiveModel] = useState(null);

  // Viewer options
  const [spineVersion, setSpineVersion] = useState('4.2');
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
  const [playerInstance, setPlayerInstance] = useState(null);

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

  const handleSelectModel = (model) => {
    setActiveModelId(model.id);
    setActiveModel(model);
    setSpineVersion(model.version || '4.2');
    
    // Clear previously loaded animations and skins
    setLoadedAnimations([]);
    setLoadedSkins([]);
    setActiveAnimation('');
    setActiveSkin('');
    setPlayerInstance(null);
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
          setPlayerInstance(null);
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
    setPlayerInstance(player);
    setLoadedAnimations(animations);
    setLoadedSkins(skins);

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
      try {
        player.setAnimation(defaultAnim, true);
      } catch (e) {
        console.warn("Could not set initial animation:", e);
      }
    }
  };

  const handlePlayAnimation = (animName, loop = true) => {
    if (playerInstance) {
      try {
        playerInstance.setAnimation(animName, loop);
        setActiveAnimation(animName);
      } catch (e) {
        console.error("Failed to play animation:", e);
      }
    }
  };

  const handleSkinChange = (skinName) => {
    if (playerInstance) {
      try {
        playerInstance.setSkin(skinName);
        setActiveSkin(skinName);
      } catch (e) {
        console.error("Failed to change skin:", e);
      }
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar controls and uploads */}
      <Sidebar
        recentModels={recentModels}
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
        onSelectModel={handleSelectModel}
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
        playerInstance={playerInstance}
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
        onModelLoaded={handleModelLoaded}
        onLoadError={(err) => {
          // Clear active controls if display errors
          setLoadedAnimations([]);
          setLoadedSkins([]);
          setPlayerInstance(null);
        }}
      />
    </div>
  );
}
