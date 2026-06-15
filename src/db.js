const DB_NAME = 'SpineViewerDB';
const DB_VERSION = 1;
const STORE_NAME = 'models';

/**
 * Opens and initializes the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(new Error(`Failed to open IndexedDB: ${event.target.error}`));
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Saves or updates a Spine model in the database.
 * @param {Object} model - The model data including files and metadata.
 * @returns {Promise<string>} - Resolves with the model ID.
 */
export async function saveModel(model) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(transaction.objectStoreNames[0]);
    
    // Ensure timestamp is updated
    model.timestamp = Date.now();
    
    const request = store.put(model);

    request.onsuccess = () => {
      resolve(model.id);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to save model: ${event.target.error}`));
    };
  });
}

/**
 * Retrieves all saved Spine models, ordered by recency.
 * @returns {Promise<Array<Object>>}
 */
export async function getModels() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const result = request.result || [];
      // Sort descending by timestamp
      result.sort((a, b) => b.timestamp - a.timestamp);
      resolve(result);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to retrieve models: ${event.target.error}`));
    };
  });
}

/**
 * Deletes a saved Spine model by its ID.
 * @param {string} id - The model ID.
 * @returns {Promise<void>}
 */
export async function deleteModel(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to delete model: ${event.target.error}`));
    };
  });
}

/**
 * Retrieves a single Spine model by its ID.
 * @param {string} id - The model ID.
 * @returns {Promise<Object>}
 */
export async function getModel(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to retrieve model: ${event.target.error}`));
    };
  });
}
