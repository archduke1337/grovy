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
