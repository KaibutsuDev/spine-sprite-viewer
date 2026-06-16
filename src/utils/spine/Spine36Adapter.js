import { dataURLToBytes, dataURLToString } from "./SpineCDNLoader";

/**
 * Adapter for Spine 3.6 using raw WebGL rendering.
 */
export class Spine36Adapter {
  constructor(containerId, model, premultipliedAlpha) {
    this.containerId = containerId;
    this.model = model;
    this.premultipliedAlpha = premultipliedAlpha;
    this.speedMultiplier = 1.0;
    this.active = true;
    this.isRunning = true;
    this.canvas = null;
    this.gl = null;
    this.shader = null;
    this.skeleton = null;
    this.animationState = null;
    this.animations = [];
    this.skins = [];
  }

  async initialize(onModelLoaded, onLoadError) {
    try {
      const container = document.getElementById(this.containerId);
      if (!container) throw new Error("Container not found");

      // Create canvas
      this.canvas = document.createElement("canvas");
      this.canvas.width = container.clientWidth || 800;
      this.canvas.height = container.clientHeight || 600;
      container.appendChild(this.canvas);

      // Initialize WebGL context
      this.gl =
        this.canvas.getContext("webgl", { alpha: true }) ||
        this.canvas.getContext("experimental-webgl", { alpha: true });
      if (!this.gl) throw new Error("WebGL not supported");

      const spine = window.spine;
      if (!spine) throw new Error("Spine 3.6 runtime not loaded in window");

      // Get skeleton data from model
      const atlasData = this.model.files[this.model.atlasFileName];
      const skeletonFileData = this.model.files[this.model.skeletonFileName];

      if (!atlasData || !skeletonFileData) {
        throw new Error("Missing atlas or skeleton data");
      }

      // Parse atlas text (decode base64 if it's a data URL)
      const atlasText =
        typeof atlasData === "string" && atlasData.startsWith("data:")
          ? dataURLToString(atlasData)
          : atlasData instanceof ArrayBuffer
            ? new TextDecoder().decode(atlasData)
            : atlasData;

      // Preload textures as WebGL GLTextures asynchronously
      const textures = {};
      const imagePromises = Object.keys(this.model.files)
        .filter((filename) => filename.toLowerCase().endsWith(".png"))
        .map((filename) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              try {
                const glTexture = new spine.webgl.GLTexture(this.gl, img);
                textures[filename] = glTexture;
                resolve();
              } catch (err) {
                reject(err);
              }
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${filename}`));
            img.src = this.model.files[filename];
          });
        });

      await Promise.all(imagePromises);

      if (!this.active) return;

      // Create atlas
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
      if (this.model.isBinary) {
        const skeletonBytes =
          typeof skeletonFileData === "string" && skeletonFileData.startsWith("data:")
            ? dataURLToBytes(skeletonFileData)
            : new Uint8Array(skeletonFileData);
        const skeletonLoader = new spine.SkeletonBinary(attachmentLoader);
        skeletonData = skeletonLoader.readSkeletonData(skeletonBytes);
      } else {
        const skeletonText =
          typeof skeletonFileData === "string" && skeletonFileData.startsWith("data:")
            ? dataURLToString(skeletonFileData)
            : skeletonFileData instanceof ArrayBuffer
              ? new TextDecoder().decode(skeletonFileData)
              : skeletonFileData;
        const skeletonJson = JSON.parse(skeletonText);
        const skeletonLoader = new spine.SkeletonJson(attachmentLoader);
        skeletonData = skeletonLoader.readSkeletonData(skeletonJson);
      }

      if (!skeletonData) {
        throw new Error("Failed to load skeleton data");
      }

      // Create skeleton
      this.skeleton = new spine.Skeleton(skeletonData);
      this.skeleton.setToSetupPose();

      // Setup animation state
      const animationStateData = new spine.AnimationStateData(skeletonData);
      this.animationState = new spine.AnimationState(animationStateData);

      // Get names of animations and skins
      this.animations = skeletonData.animations.map((a) => a.name);
      this.skins = skeletonData.skins.map((s) => s.name);

      // Set default animation
      if (this.animations.length > 0) {
        this.animationState.setAnimation(0, this.animations[0], true);
      }

      // Create renderer
      this.shader = spine.webgl.Shader.newTwoColoredTextured(this.gl);
      const batcher = new spine.webgl.PolygonBatcher(this.gl);
      const renderer = new spine.webgl.SkeletonRenderer(this.gl);

      // Calculate bounds of skeleton for camera positioning
      this.skeleton.updateWorldTransform();
      const boundsOffset = new spine.Vector2();
      const boundsSize = new spine.Vector2();
      this.skeleton.getBounds(boundsOffset, boundsSize, []);

      // Setup matrices
      const mvp = new spine.webgl.Matrix4();

      let lastFrameTime = Date.now();

      const render = () => {
        if (!this.isRunning || !this.active) return;

        const now = Date.now();
        // Incorporate the playback speed multiplier
        const deltaTime = ((now - lastFrameTime) / 1000) * this.speedMultiplier;
        lastFrameTime = now;

        // Handle canvas resizing and viewport updating
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 600;
        if (this.canvas.width !== w || this.canvas.height !== h) {
          this.canvas.width = w;
          this.canvas.height = h;
          this.gl.viewport(0, 0, w, h);
        }

        // Center camera on skeleton bounds
        const centerX = boundsOffset.x + boundsSize.x / 2;
        const centerY = boundsOffset.y + boundsSize.y / 2;
        const scaleX = boundsSize.x / this.canvas.width;
        const scaleY = boundsSize.y / this.canvas.height;
        let scale = 1.2 * Math.max(scaleX, scaleY);
        if (scale < 1.0) scale = 1.0;

        const orthoWidth = this.canvas.width * scale;
        const orthoHeight = this.canvas.height * scale;
        mvp.ortho2d(centerX - orthoWidth / 2, centerY - orthoHeight / 2, orthoWidth, orthoHeight);

        // Update animation
        this.animationState.update(deltaTime);
        this.animationState.apply(this.skeleton);
        this.skeleton.updateWorldTransform();

        // Clear and render
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Bind WebGL shader and set uniforms
        this.shader.bind();
        this.shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
        this.shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);

        batcher.begin(this.shader);
        renderer.draw(batcher, this.skeleton);
        batcher.end();

        this.shader.unbind();

        requestAnimationFrame(render);
      };

      // Start rendering loop
      render();

      if (onModelLoaded) {
        onModelLoaded({
          player: this,
          animations: this.animations,
          skins: this.skins,
          skeletonData: skeletonData,
        });
      }
    } catch (err) {
      console.error("Spine 3.6 initialization error in adapter:", err);
      if (onLoadError) onLoadError(err.message || err);
    }
  }

  // --- ISpineAdapter Interface Methods ---

  setAnimation(animName, loop = true, trackIndex = 0) {
    try {
      this.animationState.setAnimation(trackIndex, animName, loop);
    } catch (e) {
      console.error(`Failed to play animation on track ${trackIndex}:`, e);
    }
  }

  clearTrack(trackIndex) {
    try {
      this.animationState.clearTrack(trackIndex);
      if (this.skeleton) {
        this.skeleton.setSlotsToSetupPose();
      }
    } catch (e) {
      console.error(`Failed to clear track ${trackIndex}:`, e);
    }
  }

  setSkin(skinName) {
    try {
      this.skeleton.setSkinByName(skinName);
      this.skeleton.setSlotsToSetupPose();
    } catch (e) {
      console.error("Failed to set skin:", e);
    }
  }

  setPlaybackSpeed(speed) {
    this.speedMultiplier = speed;
  }

  dispose() {
    this.active = false;
    this.isRunning = false;
    try {
      if (this.shader && this.gl) {
        this.gl.deleteProgram(this.shader.program);
      }
      const container = document.getElementById(this.containerId);
      if (container && this.canvas && container.contains(this.canvas)) {
        container.removeChild(this.canvas);
      }
    } catch (e) {
      console.warn("Error disposing Spine36Adapter:", e);
    }
  }
}
