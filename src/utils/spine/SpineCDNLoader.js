// Supported Spine player CDN/Local targets for runtime switching
export const RUNTIME_CDNS = {
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
export function dataURLToBytes(dataURL) {
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
export function dataURLToString(dataURL) {
  const bytes = dataURLToBytes(dataURL);
  return new TextDecoder().decode(bytes);
}

/**
 * Dynamically injects Spine Player CSS and JS files from CDN or local public assets.
 * @param {string} version - The Spine version (e.g. "4.2")
 * @returns {Promise<void>}
 */
export function loadSpineCDN(version) {
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
