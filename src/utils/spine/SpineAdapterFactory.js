import { loadSpineCDN } from "./SpineCDNLoader";
import { Spine36Adapter } from "./Spine36Adapter";
import { SpinePlayerAdapter } from "./SpinePlayerAdapter";

/**
 * Creates and initializes the appropriate Spine adapter based on the specified version.
 * 
 * @param {string} containerId - The HTML element ID where the player/canvas will be mounted.
 * @param {object} model - The database model object containing assets and filenames.
 * @param {string} version - The target Spine version (e.g. "3.6", "4.3", etc.)
 * @param {boolean} premultipliedAlpha - Alpha blending option.
 * @param {function} onModelLoaded - Success callback when skeleton is fully parsed.
 * @param {function} onLoadError - Failure callback when load fails.
 * @returns {Promise<ISpineAdapter>} Resolves with the initialized adapter instance.
 */
export async function createSpineAdapter(
  containerId,
  model,
  version,
  premultipliedAlpha,
  onModelLoaded,
  onLoadError
) {
  // 1. Ensure CDN/Local dependencies are loaded
  await loadSpineCDN(version);

  // 2. Select appropriate adapter class
  let adapter;
  if (version === "3.6") {
    adapter = new Spine36Adapter(containerId, model, premultipliedAlpha);
  } else {
    adapter = new SpinePlayerAdapter(containerId, model, version, premultipliedAlpha);
  }

  // 3. Initialize it asynchronously
  await adapter.initialize(onModelLoaded, onLoadError);

  return adapter;
}
