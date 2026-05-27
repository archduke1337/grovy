/**
 * Appwrite-backed metadata cache and user collections.
 * Songs/search/history are stored in preferences.
 * Playlists/favorites are synced through Appwrite Databases.
 * Falls back to in-memory state when sync is unavailable.
 */

import { getGrovyPrefs, patchGrovyPrefs } from "@/app/lib/appwrite/prefsClient";
import { Client } from "appwrite";

import {
  APPWRITE_TABLE_IDS,
  getPublicAppwriteConfig,
} from "@/app/lib/appwrite/config";

type SongRecord = { id: string; [key: string]: any };
type SearchEntry = { results: any[]; timestamp: number };

type OfflineState = {
  songs: Record<string, SongRecord>;
  searches: Record<string, SearchEntry>;
  playlists: any[];
  favorites: any[];
  history: any[];
};

const PREF_KEYS = {
  songs: "cachedSongs",
  searches: "cachedSearches",
  playlists: "playlists",
  favorites: "favorites",
  history: "history",
} as const;

const LIBRARY_ENDPOINT = "/api/user/library";
const LIBRARY_SYNC_WINDOW_MS = 2000;
const LIBRARY_REALTIME_DEBOUNCE_MS = 350;

let memoryState: OfflineState = {
  songs: {},
  searches: {},
  playlists: [],
  favorites: [],
  history: [],
};

let librarySyncPromise: Promise<void> | null = null;
let lastLibrarySyncAt = 0;
let realtimeClient: Client | null = null;
let realtimeSubscription: (() => void) | null = null;
let realtimeSubscriptionInitPromise: Promise<void> | null = null;
let realtimeRefreshTimer: ReturnType<typeof setTimeout> | null = null;
const realtimeListeners = new Set<() => void>();

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim();
}

function readObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function readArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function hasPref(prefs: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(prefs, key);
}

function areCollectionsEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  const aIds = new Set(a.map(item => item?.id).filter(Boolean));
  const bIds = new Set(b.map(item => item?.id).filter(Boolean));
  if (aIds.size !== bIds.size) return false;
  for (const id of aIds) {
    if (!bIds.has(id)) return false;
  }
  return true;
}

function buildLibraryRealtimeChannels(databaseId: string): string[] {
  return [
    `databases.${databaseId}.tables.${APPWRITE_TABLE_IDS.playlists}.rows`,
    `databases.${databaseId}.tables.${APPWRITE_TABLE_IDS.playlistTracks}.rows`,
    `databases.${databaseId}.tables.${APPWRITE_TABLE_IDS.favorites}.rows`,
  ];
}

async function loadState(): Promise<OfflineState> {
  const prefs = await getGrovyPrefs();

  const prefPlaylists = hasPref(prefs, PREF_KEYS.playlists)
    ? readArray(prefs[PREF_KEYS.playlists])
    : [];
  const prefFavorites = hasPref(prefs, PREF_KEYS.favorites)
    ? readArray(prefs[PREF_KEYS.favorites])
    : [];

  memoryState = {
    songs: hasPref(prefs, PREF_KEYS.songs)
      ? readObject(prefs[PREF_KEYS.songs])
      : memoryState.songs,
    searches: hasPref(prefs, PREF_KEYS.searches)
      ? readObject(prefs[PREF_KEYS.searches])
      : memoryState.searches,
    // Keep old preference values as a one-time migration source if DB is empty.
    playlists: memoryState.playlists.length > 0 ? memoryState.playlists : prefPlaylists,
    favorites: memoryState.favorites.length > 0 ? memoryState.favorites : prefFavorites,
    history: hasPref(prefs, PREF_KEYS.history)
      ? readArray(prefs[PREF_KEYS.history])
      : memoryState.history,
  };

  return {
    songs: { ...memoryState.songs },
    searches: { ...memoryState.searches },
    playlists: [...memoryState.playlists],
    favorites: [...memoryState.favorites],
    history: [...memoryState.history],
  };
}

async function savePartialState(partial: Partial<OfflineState>): Promise<void> {
  memoryState = {
    songs: partial.songs ?? memoryState.songs,
    searches: partial.searches ?? memoryState.searches,
    playlists: partial.playlists ?? memoryState.playlists,
    favorites: partial.favorites ?? memoryState.favorites,
    history: partial.history ?? memoryState.history,
  };

  const patch: Record<string, unknown> = {};
  if (partial.songs !== undefined) patch[PREF_KEYS.songs] = memoryState.songs;
  if (partial.searches !== undefined) patch[PREF_KEYS.searches] = memoryState.searches;
  if (partial.history !== undefined) patch[PREF_KEYS.history] = memoryState.history;

  if (Object.keys(patch).length === 0) {
    return;
  }

  await patchGrovyPrefs(patch).catch(() => {
    // Ignore sync failures and keep memory fallback.
  });
}

async function syncLibraryToAppwrite(partial: {
  playlists?: any[];
  favorites?: any[];
}): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const payload: Record<string, unknown> = {};

  if (partial.playlists !== undefined) {
    payload.playlists = Array.isArray(partial.playlists) ? partial.playlists : [];
  }

  if (partial.favorites !== undefined) {
    payload.favorites = Array.isArray(partial.favorites) ? partial.favorites : [];
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  try {
    const res = await fetch(LIBRARY_ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[offlineCache] Library PUT failed: ${res.status} ${res.statusText}`);
      return;
    }

    const data = (await res.json()) as {
      playlists?: unknown;
      favorites?: unknown;
    };

    if (Array.isArray(data.playlists)) {
      memoryState.playlists = data.playlists;
    }

    if (Array.isArray(data.favorites)) {
      memoryState.favorites = data.favorites;
    }

    lastLibrarySyncAt = Date.now();
  } catch (err) {
    console.warn("[offlineCache] Library sync error:", err);
    // Keep in-memory values when server sync is unavailable.
  }
}

async function refreshLibraryFromAppwrite(force = false): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (!force && Date.now() - lastLibrarySyncAt < LIBRARY_SYNC_WINDOW_MS) {
    return;
  }

  if (librarySyncPromise) {
    await librarySyncPromise;
    return;
  }

  librarySyncPromise = (async () => {
    try {
      const res = await fetch(LIBRARY_ENDPOINT, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn(`[offlineCache] Library GET failed: ${res.status} ${res.statusText}`);
        return;
      }

      const data = (await res.json()) as {
        playlists?: unknown;
        favorites?: unknown;
      };

      const remotePlaylists = readArray(data.playlists);
      const remoteFavorites = readArray(data.favorites);

      const shouldSeedPlaylists =
        remotePlaylists.length === 0 && memoryState.playlists.length > 0;
      const shouldSeedFavorites =
        remoteFavorites.length === 0 && memoryState.favorites.length > 0;

      if (shouldSeedPlaylists || shouldSeedFavorites) {
        await syncLibraryToAppwrite({
          ...(shouldSeedPlaylists ? { playlists: memoryState.playlists } : {}),
          ...(shouldSeedFavorites ? { favorites: memoryState.favorites } : {}),
        });
        return;
      }

      memoryState.playlists = remotePlaylists;
      memoryState.favorites = remoteFavorites;
      lastLibrarySyncAt = Date.now();
    } catch (err) {
      console.warn("[offlineCache] Library refresh error:", err);
      // Keep in-memory fallback if DB fetch fails.
    } finally {
      librarySyncPromise = null;
    }
  })();

  await librarySyncPromise;
}

function scheduleRealtimeRefresh() {
  if (realtimeRefreshTimer) {
    clearTimeout(realtimeRefreshTimer);
  }

  realtimeRefreshTimer = setTimeout(() => {
    void refreshLibraryFromAppwrite(true).then(() => {
      realtimeListeners.forEach((listener) => {
        listener();
      });
    });
  }, LIBRARY_REALTIME_DEBOUNCE_MS);
}

async function fetchRealtimeJwt(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const res = await fetch("/api/auth/jwt", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as { jwt?: unknown };
    return typeof data.jwt === "string" && data.jwt ? data.jwt : null;
  } catch {
    return null;
  }
}

async function ensureRealtimeSubscription(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (realtimeSubscription || realtimeSubscriptionInitPromise) {
    await realtimeSubscriptionInitPromise;
    return;
  }

  realtimeSubscriptionInitPromise = (async () => {
    const jwt = await fetchRealtimeJwt();
    if (!jwt) {
      return;
    }

    try {
      const { endpoint, projectId, databaseId } = getPublicAppwriteConfig();
      realtimeClient = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setJWT(jwt);

      realtimeSubscription = realtimeClient.subscribe(
        buildLibraryRealtimeChannels(databaseId),
        () => {
          scheduleRealtimeRefresh();
        }
      );
    } catch {
      realtimeClient = null;
      realtimeSubscription = null;
    }
  })().finally(() => {
    realtimeSubscriptionInitPromise = null;
  });

  await realtimeSubscriptionInitPromise;
}

async function teardownRealtimeSubscription(): Promise<void> {
  if (realtimeRefreshTimer) {
    clearTimeout(realtimeRefreshTimer);
    realtimeRefreshTimer = null;
  }

  if (realtimeSubscription) {
    realtimeSubscription();
  }

  realtimeSubscription = null;
  realtimeClient = null;
}

/**
 * Subscribe to real-time library changes (playlists, favorites).
 * Calls `listener` whenever a remote change is detected.
 * Returns an unsubscribe function; tears down the subscription when all listeners are removed.
 */
export async function subscribeLibraryRealtime(
  listener: () => void
): Promise<() => void> {
  realtimeListeners.add(listener);
  await ensureRealtimeSubscription();

  return () => {
    realtimeListeners.delete(listener);

    if (realtimeListeners.size === 0) {
      void teardownRealtimeSubscription();
    }
  };
}

/** Cache a single song's metadata in Appwrite preferences. */
export async function cacheSong(song: SongRecord): Promise<void> {
  if (!song?.id) return;

  const state = await loadState();
  await savePartialState({
    songs: {
      ...state.songs,
      [song.id]: { ...song, _cachedAt: Date.now() },
    },
  });
}

/** Batch-cache multiple songs' metadata in Appwrite preferences. */
export async function cacheSongs(songs: SongRecord[]): Promise<void> {
  if (!Array.isArray(songs) || songs.length === 0) return;

  const state = await loadState();
  const nextSongs = { ...state.songs };

  songs.forEach((song) => {
    if (!song?.id) return;
    nextSongs[song.id] = { ...song, _cachedAt: Date.now() };
  });

  await savePartialState({ songs: nextSongs });
}

/** Retrieve a cached song by its ID, or null if not cached. */
export async function getCachedSong(id: string): Promise<any | null> {
  const state = await loadState();
  return state.songs[id] ?? null;
}

// Search results cache
/** Cache search results for a given query string. */
export async function cacheSearchResults(query: string, results: any[]): Promise<void> {
  const normalized = normalizeQuery(query);
  if (!normalized) return;

  const state = await loadState();
  await savePartialState({
    searches: {
      ...state.searches,
      [normalized]: {
        results: Array.isArray(results) ? results : [],
        timestamp: Date.now(),
      },
    },
  });
}

/** Return cached search results if not older than maxAge (default 5 minutes). */
export async function getCachedSearch(query: string, maxAge = 5 * 60 * 1000): Promise<any[] | null> {
  const normalized = normalizeQuery(query);
  if (!normalized) return null;

  const state = await loadState();
  const entry = state.searches[normalized];

  if (!entry) return null;
  if (Date.now() - (entry.timestamp || 0) > maxAge) return null;

  return Array.isArray(entry.results) ? entry.results : null;
}

// User playlists
/** Persist playlists to Appwrite-backed storage, skipping if unchanged. */
export async function savePlaylists(playlists: any[]): Promise<void> {
  const nextPlaylists = Array.isArray(playlists) ? [...playlists] : [];
  if (areCollectionsEqual(nextPlaylists, memoryState.playlists)) {
    return;
  }

  memoryState.playlists = nextPlaylists;
  await syncLibraryToAppwrite({ playlists: memoryState.playlists });
}

/** Fetch the current playlists, syncing with Appwrite if available. */
export async function getPlaylists(): Promise<any[]> {
  await loadState();
  await refreshLibraryFromAppwrite();
  return Array.isArray(memoryState.playlists) ? [...memoryState.playlists] : [];
}

// Favorites
/** Persist favorites to Appwrite-backed storage, skipping if unchanged. */
export async function saveFavorites(favoriteSongs: any[]): Promise<void> {
  const nextFavorites = Array.isArray(favoriteSongs) ? [...favoriteSongs] : [];
  if (areCollectionsEqual(nextFavorites, memoryState.favorites)) {
    return;
  }

  memoryState.favorites = nextFavorites;
  await syncLibraryToAppwrite({ favorites: memoryState.favorites });
}

/** Fetch the current favorites, syncing with Appwrite if available. */
export async function getFavorites(): Promise<any[]> {
  await loadState();
  await refreshLibraryFromAppwrite();
  return Array.isArray(memoryState.favorites) ? [...memoryState.favorites] : [];
}

// History
/** Add a song to the recently-played history (max 50 entries). */
export async function addToHistory(song: any): Promise<void> {
  if (!song?.id) return;

  const state = await loadState();
  const filtered = state.history.filter((entry) => entry?.id !== song.id);
  const updated = [{ ...song, timestamp: Date.now() }, ...filtered].slice(0, 50);

  await savePartialState({ history: updated });
}

/** Get recently played songs sorted by most recent first. */
export async function getHistory(): Promise<any[]> {
  const state = await loadState();
  return [...state.history].sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0));
}

/** Clear all recently played history. */
export async function clearHistory(): Promise<void> {
  await savePartialState({ history: [] });
}

// Cleanup
/** Clear all cached songs and search results. */
export async function clearOfflineCache(): Promise<void> {
  await savePartialState({ songs: {}, searches: {} });
}

/** Remove cached searches older than maxAge (default 1 hour). */
export async function evictStaleSearches(maxAge = 60 * 60 * 1000): Promise<void> {
  const state = await loadState();
  const cutoff = Date.now() - maxAge;
  const nextSearches: Record<string, SearchEntry> = {};

  Object.entries(state.searches).forEach(([key, value]) => {
    if ((value?.timestamp || 0) >= cutoff) {
      nextSearches[key] = value;
    }
  });

  await savePartialState({ searches: nextSearches });
}
