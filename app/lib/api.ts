import { Song } from "@/app/types/song";
import { cacheSongs, cacheSearchResults, getCachedSearch } from "./offlineCache";

const API_BASE = "";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const CLIENT_TIMEOUT = 15000; // 15s max for any API call
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT);

  // If caller provides a signal, abort our controller when theirs fires
  let abortHandler: (() => void) | null = null;
  if (options?.signal) {
    if (options.signal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      abortHandler = () => controller.abort();
      options.signal.addEventListener('abort', abortHandler, { once: true });
    }
  }

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ApiError(`Request failed: ${res.statusText}`, res.status);
    }
    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new ApiError("Invalid JSON response", res.status);
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
    if (abortHandler && options?.signal) {
      options.signal.removeEventListener('abort', abortHandler);
    }
  }
}

// ─── Songs ───────────────────────────────────────────────
/**
 * Search every source the `/api/songs` route aggregates.
 *
 * Results are cached so a repeat search (or a reload with no connection)
 * still shows something instead of an empty grid.
 *
 * @param query - Search text; omit to get the default feed
 * @param signal - Optional AbortSignal to cancel the request
 */
export async function searchSongs(
  query?: string,
  signal?: AbortSignal
): Promise<Song[]> {
  const params = new URLSearchParams();
  if (query) params.append("query", query);

  const cacheKey = `songs:${query || ""}`;

  try {
    const songs = await request<Song[]>(
      `/api/songs?${params.toString()}`,
      { signal }
    );

    if (Array.isArray(songs) && songs.length > 0) {
      // Fire and forget: caching must never delay playback.
      cacheSongs(songs).catch(() => {});
      cacheSearchResults(cacheKey, songs).catch(() => {});
    }

    return Array.isArray(songs) ? songs : [];
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;

    if (typeof window !== "undefined") {
      const cached = await getCachedSearch(cacheKey).catch(() => null);
      if (cached) return cached as Song[];
    }

    throw error;
  }
}

/**
 * Fetch radio/autoplay songs seeded by a specific track.
 * Returns a list of similar songs for continuous playback.
 *
 * @param songId - ID of the seed song
 * @param opts - Optional metadata (title, artist) to improve radio relevance
 * @param signal - Optional AbortSignal to cancel the request
 * @returns List of Song objects for the radio queue
 */
export async function getRadioSongs(
  songId: string,
  opts?: { title?: string; artist?: string },
  signal?: AbortSignal
): Promise<Song[]> {
  const params = new URLSearchParams();
  params.append("songId", songId);
  if (songId.startsWith("yt-")) {
    params.append("videoId", songId.replace("yt-", ""));
  } else if (!songId.startsWith("saavn-")) {
    params.append("videoId", songId); // legacy raw YouTube ID
  }
  if (opts?.title) params.append("title", opts.title);
  if (opts?.artist) params.append("artist", opts.artist);
  return request<Song[]>(`/api/songs/radio?${params}`, { signal });
}

/**
 * Fetch songs related to a specific track for "up next" suggestions.
 *
 * @param songId - ID of the source song
 * @param opts - Optional metadata (title, artist) to improve relevance
 * @param signal - Optional AbortSignal to cancel the request
 * @returns List of related Song objects
 */
export async function getRelatedSongs(
  songId: string,
  opts?: { title?: string; artist?: string },
  signal?: AbortSignal
): Promise<Song[]> {
  const params = new URLSearchParams();
  params.append("songId", songId);
  if (songId.startsWith("yt-")) {
    params.append("videoId", songId.replace("yt-", ""));
  } else if (!songId.startsWith("saavn-")) {
    params.append("videoId", songId); // legacy raw YouTube ID
  }
  if (opts?.title) params.append("title", opts.title);
  if (opts?.artist) params.append("artist", opts.artist);
  return request<Song[]>(`/api/songs/related?${params}`, { signal });
}

// ─── Search ──────────────────────────────────────────────
/**
 * Generic search for songs, artists, or albums.
 * Falls back to cached results when offline.
 *
 * @param query - Search query string
 * @param type - Entity type to search for ("song", "artist", "album")
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Array of search result objects
 */
export async function search(
  query: string,
  type: string = "song",
  signal?: AbortSignal
): Promise<any[]> {
  try {
    const results = await request<any[]>(
      `/api/search?type=${type}&query=${encodeURIComponent(query)}`,
      { signal }
    );
    if (results.length > 0) {
      cacheSearchResults(`search:${type}:${query}`, results).catch(() => {});
    }
    return results;
  } catch (e) {
    if (typeof window !== "undefined") {
      const cached = await getCachedSearch(`search:${type}:${query}`).catch(() => null);
      if (cached) return cached;
    }
    throw e;
  }
}

/**
 * Fetch autocomplete suggestions for a partial search query.
 *
 * @param query - Partial search string
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Array of suggestion strings
 */
export async function getSearchSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<string[]> {
  return request<string[]>(
    `/api/search/suggestions?query=${encodeURIComponent(query)}`,
    { signal }
  );
}

// ─── Metadata ────────────────────────────────────────────
/**
 * Fetch synchronized lyrics for a song by title and artist.
 *
 * @param title - Song title
 * @param artist - Artist name
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Lyrics data with timed lines
 */
export async function getLyrics(
  title: string,
  artist: string,
  signal?: AbortSignal
): Promise<any> {
  return request(
    `/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
    { signal }
  );
}


/**
 * Fetch artist biography, stats, and tag information.
 *
 * @param artist - Artist name
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Artist info object with name, bio, stats, and tags
 */
export async function getArtistInfo(
  artist: string,
  signal?: AbortSignal
): Promise<any> {
  return request(
    `/api/artist/info?artist=${encodeURIComponent(artist)}`,
    { signal }
  );
}

