import { SpinePlayer as LocalSpinePlayer } from "@esotericsoftware/spine-player";

/**
 * Adapter for standard Spine Player versions (3.8, 4.0, 4.1, 4.2, 4.3).
 */
export class SpinePlayerAdapter {
  constructor(containerId, model, version, premultipliedAlpha) {
    this.containerId = containerId;
    this.model = model;
    this.version = version;
    this.premultipliedAlpha = premultipliedAlpha;
    this.player = null;
    this.active = true;
  }

  async initialize(onModelLoaded, onLoadError) {
    try {
      let SpinePlayerClass = null;

      if (this.version === "4.3") {
        SpinePlayerClass = LocalSpinePlayer;
      } else {
        if (window.spine && window.spine.SpinePlayer) {
          SpinePlayerClass = window.spine.SpinePlayer;
        } else {
          throw new Error(
            `Spine runtime not loaded in window.spine.SpinePlayer for version ${this.version}`,
          );
        }
      }

      // Build rawDataURIs config mapping
      const rawDataURIs = {};
      Object.keys(this.model.files).forEach((filename) => {
        rawDataURIs[filename] = this.model.files[filename];
      });

      // Setup player config parameters
      const playerConfig = {
        atlasUrl: this.model.atlasFileName,
        rawDataURIs: rawDataURIs,
        premultipliedAlpha: this.premultipliedAlpha,
        showControls: true,
        backgroundColor: "#00000000", // Clear transparent
        alpha: true,
        success: (player) => {
          if (!this.active) return;
          this.player = player;

          try {
            const skeleton = player.skeleton;
            // Depending on version, animation/skin structures might differ slightly,
            // but skeleton.data.animations/skins is standard across versions.
            const animations =
              skeleton.data.animations.map((a) => a.name) || [];
            const skins = skeleton.data.skins.map((s) => s.name) || [];

            if (onModelLoaded) {
              onModelLoaded({
                player: this,
                animations,
                skins,
                skeletonData: skeleton.data,
              });
            }
          } catch (err) {
            console.error("Error reading skeleton info in success callback:", err);
          }
        },
        error: (player, err) => {
          if (!this.active) return;
          console.error("Spine player internal error callback:", err);
          const msg =
            typeof err === "string"
              ? err
              : err?.message ||
                "Verify compatibility between skeleton/atlas assets and the selected Spine runtime.";
          if (onLoadError) onLoadError(msg);
        },
      };

      // Inject skeleton file URL
      if (this.model.isBinary) {
        playerConfig.skelUrl = this.model.skeletonFileName;
      } else {
        playerConfig.jsonUrl = this.model.skeletonFileName;
      }

      if (this.active) {
        new SpinePlayerClass(this.containerId, playerConfig);
      }
    } catch (err) {
      if (onLoadError) onLoadError(err.message || err);
    }
  }

  // --- ISpineAdapter Interface Methods ---

  setAnimation(animName, loop = true, trackIndex = 0) {
    if (this.player) {
      try {
        if (trackIndex === 0 && typeof this.player.setAnimation === "function") {
          this.player.setAnimation(animName, loop);
        } else if (this.player.animationState) {
          this.player.animationState.setAnimation(trackIndex, animName, loop);
        }
      } catch (e) {
        console.error(`Failed to play animation on track ${trackIndex} on SpinePlayer:`, e);
      }
    }
  }

  clearTrack(trackIndex) {
    if (this.player) {
      try {
        if (this.player.animationState) {
          this.player.animationState.clearTrack(trackIndex);
        }
        if (this.player.skeleton) {
          this.player.skeleton.setSlotsToSetupPose();
        }
      } catch (e) {
        console.error(`Failed to clear track ${trackIndex} on SpinePlayer:`, e);
      }
    }
  }

  setSkin(skinName) {
    if (this.player) {
      try {
        if (typeof this.player.setSkin === "function") {
          this.player.setSkin(skinName);
        } else if (this.player.skeleton) {
          this.player.skeleton.setSkinByName(skinName);
          this.player.skeleton.setSlotsToSetupPose();
        }
      } catch (e) {
        console.error("Failed to change skin on SpinePlayer:", e);
      }
    }
  }

  setPlaybackSpeed(speed) {
    if (this.player) {
      try {
        if (this.player.animationState) {
          this.player.animationState.timeScale = speed;
        }
      } catch (e) {
        console.error("Failed to set playback speed on SpinePlayer:", e);
      }
    }
  }

  dispose() {
    this.active = false;
    if (this.player) {
      try {
        this.player.dispose();
      } catch (e) {
        console.warn("Cleanup error during unmount of SpinePlayerAdapter:", e);
      }
      this.player = null;
    }
  }
}
