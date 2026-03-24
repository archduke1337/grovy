/**
 * IndexedDB-backed offline cache for song metadata and search results.
 * Audio streams are too large for IndexedDB but metadata can be cached
 * to enable offline queue browsing and faster search.
 */

const DB_NAME = "grovy-offline";
const DB_VERSION = 1;

const STORES = {
  songs: "songs",        // Cached song metadata by ID
  searches: "searches",  // Cached search results by query
  playlists: "playlists", // User playlists
  favorites: "favorites", // Favorite song IDs
  history: "history",     // Recently played songs
} as const;

// Singleton DB connection to prevent connection leaks
let _dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_dbInstance) return Promise.resolve(_dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.songs)) {
        db.createObjectStore(STORES.songs, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.searches)) {
        const store = db.createObjectStore(STORES.searches, { keyPath: "query" });
        store.createIndex("timestamp", "timestamp");
      }
      if (!db.objectStoreNames.contains(STORES.playlists)) {
        db.createObjectStore(STORES.playlists, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.favorites)) {
        db.createObjectStore(STORES.favorites, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.history)) {
        const store = db.createObjectStore(STORES.history, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
      }
    };
    req.onsuccess = () => {
      _dbInstance = req.result;
      // Reset singleton if the DB is closed externally
      _dbInstance.onclose = () => { _dbInstance = null; };
      resolve(_dbInstance);
    };
    req.onerror = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, store: string, mode: IDBTransactionMode) {
  return db.transaction(store, mode).objectStore(store);
}

// ─── Song Metadata Cache ───

export async function cacheSong(song: { id: string; [key: string]: any }): Promise<void> {
  try {
    const db = await openDB();
    const store = tx(db, STORES.songs, "readwrite");
    store.put({ ...song, _cachedAt: Date.now() });
  } catch (e) {
    // Fail silently — cache is best-effort
  }
}

export async function cacheSongs(songs: { id: string; [key: string]: any }[]): Promise<void> {
  try {
    const db = await openDB();
    const store = tx(db, STORES.songs, "readwrite");
    for (const song of songs) {
      store.put({ ...song, _cachedAt: Date.now() });
    }
  } catch (e) {}
}

export async function getCachedSong(id: string): Promise<any | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const req = tx(db, STORES.songs, "readonly").get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

// ─── Search Results Cache ───

export async function cacheSearchResults(query: string, results: any[]): Promise<void> {
  try {
    const db = await openDB();
    const store = tx(db, STORES.searches, "readwrite");
    store.put({ query: query.toLowerCase().trim(), results, timestamp: Date.now() });
  } catch (e) {}
}

export async function getCachedSearch(query: string, maxAge = 5 * 60 * 1000): Promise<any[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const req = tx(db, STORES.searches, "readonly").get(query.toLowerCase().trim());
      req.onsuccess = () => {
        const entry = req.result;
        if (!entry) return resolve(null);
        // Stale check
        if (Date.now() - entry.timestamp > maxAge) return resolve(null);
        resolve(entry.results);
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

// ─── User Playlists ───

export async function savePlaylists(playlists: any[]): Promise<void> {
  try {
    const db = await openDB();
    const store = tx(db, STORES.playlists, "readwrite");
    // Clear and re-save is simplest for small sets
    store.clear();
    for (const pl of playlists) {
      store.put(pl);
    }
  } catch (e) {}
}

export async function getPlaylists(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const req = tx(db, STORES.playlists, "readonly").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

// ─── Favorites ───

export async function saveFavorites(favoriteIds: string[]): Promise<void> {
  try {
    const db = await openDB();
    const store = tx(db, STORES.favorites, "readwrite");
    store.clear();
    for (const id of favoriteIds) {
      store.put({ id });
    }
  } catch (e) {}
}

export async function getFavorites(): Promise<string[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const req = tx(db, STORES.favorites, "readonly").getAll();
      req.onsuccess = () => resolve((req.result || []).map((f: any) => f.id));
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

// ─── History ───

export async function addToHistory(song: any): Promise<void> {
  try {
    const db = await openDB();
    const store = tx(db, STORES.history, "readwrite");
    store.put({ ...song, timestamp: Date.now() });
    
    // Limit history to 50 items
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result > 50) {
        const idx = store.index("timestamp");
        idx.openCursor().onsuccess = (e: any) => {
          const cursor = e.target.result;
          if (cursor) cursor.delete();
        };
      }
    };
  } catch (e) {}
}

export async function getHistory(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const store = tx(db, STORES.history, "readonly");
      const idx = store.index("timestamp");
      const req = idx.getAll(); // get all sorted by timestamp
      req.onsuccess = () => resolve((req.result || []).reverse()); // Newest first
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

// ─── Cleanup ───

export async function clearOfflineCache(): Promise<void> {
  try {
    const db = await openDB();
    tx(db, STORES.songs, "readwrite").clear();
    tx(db, STORES.searches, "readwrite").clear();
  } catch (e) {}
}

/** Evict search entries older than maxAge (default 1 hour) */
export async function evictStaleSearches(maxAge = 60 * 60 * 1000): Promise<void> {
  try {
    const db = await openDB();
    const store = tx(db, STORES.searches, "readwrite");
    const cutoff = Date.now() - maxAge;
    const idx = store.index("timestamp");
    const range = IDBKeyRange.upperBound(cutoff);
    const req = idx.openCursor(range);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (e) {}
}
