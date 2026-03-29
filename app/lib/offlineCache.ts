/**
 * Appwrite-backed metadata cache and user collections.
 * Songs/search/history are stored in preferences.
 * Playlists/favorites are synced through Appwrite Databases.
 * Falls back to in-memory state when sync is unavailable.
 */

import { getGrovyPrefs, patchGrovyPrefs } from "@/app/lib/appwrite/prefsClient";

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

let memoryState: OfflineState = {
  songs: {},
  searches: {},
  playlists: [],
  favorites: [],
  history: [],
};

let librarySyncPromise: Promise<void> | null = null;
let lastLibrarySyncAt = 0;

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
  } catch {
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
    } catch {
      // Keep in-memory fallback if DB fetch fails.
    } finally {
      librarySyncPromise = null;
    }
  })();

  await librarySyncPromise;
}

// Song metadata cache
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

export async function getCachedSong(id: string): Promise<any | null> {
  const state = await loadState();
  return state.songs[id] ?? null;
}

// Search results cache
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
export async function savePlaylists(playlists: any[]): Promise<void> {
  memoryState.playlists = Array.isArray(playlists) ? [...playlists] : [];
  await syncLibraryToAppwrite({ playlists: memoryState.playlists });
}

export async function getPlaylists(): Promise<any[]> {
  await loadState();
  await refreshLibraryFromAppwrite();
  return Array.isArray(memoryState.playlists) ? [...memoryState.playlists] : [];
}

// Favorites
export async function saveFavorites(favoriteSongs: any[]): Promise<void> {
  memoryState.favorites = Array.isArray(favoriteSongs) ? [...favoriteSongs] : [];
  await syncLibraryToAppwrite({ favorites: memoryState.favorites });
}

export async function getFavorites(): Promise<any[]> {
  await loadState();
  await refreshLibraryFromAppwrite();
  return Array.isArray(memoryState.favorites) ? [...memoryState.favorites] : [];
}

// History
export async function addToHistory(song: any): Promise<void> {
  if (!song?.id) return;

  const state = await loadState();
  const filtered = state.history.filter((entry) => entry?.id !== song.id);
  const updated = [{ ...song, timestamp: Date.now() }, ...filtered].slice(0, 50);

  await savePartialState({ history: updated });
}

export async function getHistory(): Promise<any[]> {
  const state = await loadState();
  return [...state.history].sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0));
}

export async function clearHistory(): Promise<void> {
  await savePartialState({ history: [] });
}

// Cleanup
export async function clearOfflineCache(): Promise<void> {
  await savePartialState({ songs: {}, searches: {} });
}

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
