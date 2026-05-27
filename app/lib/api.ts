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

/**
 * Search for songs across all configured sources (YouTube, Saavn, etc.).
 * Deduplicates results and falls back to cached results when offline.
 *
 * @param query - Search query string (optional; omit for trending)
 * @param source - Preferred source name (e.g. "youtube", "saavn")
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Deduplicated list of Song objects
 */
export async function searchSongs(
  query?: string,
  source?: string,
  signal?: AbortSignal
): Promise<Song[]> {
  const params = new URLSearchParams();
  if (source) params.append("source", source);
  if (query) params.append("query", query);

  try {
    const songs = await request<Song[]>(`/api/songs?${params}`, { signal });

    let mergedSongs = Array.isArray(songs) ? songs : [];

    // When primary source is thin, enrich with dedicated search endpoint results.
    if (query && mergedSongs.length < 12) {
      try {
        const fallbackResults = await request<Song[]>(
          `/api/search?type=song&query=${encodeURIComponent(query)}`,
          { signal }
        );

        if (Array.isArray(fallbackResults) && fallbackResults.length > 0) {
          const deduped = new Map<string, Song>();
          [...mergedSongs, ...fallbackResults].forEach((song) => {
            if (!song?.id || !song?.title || !song?.url) return;
            if (!deduped.has(song.id)) {
              deduped.set(song.id, song);
            }
          });
          mergedSongs = Array.from(deduped.values());
        }
      } catch {
        // Keep primary results if fallback fails.
      }
    }

    // Cache results in background
    if (query && mergedSongs.length > 0) {
      cacheSongs(mergedSongs).catch(() => {});
      cacheSearchResults(`songs:${query}:${source || ""}`, mergedSongs).catch(() => {});
    }
    return mergedSongs;
  } catch (e) {
    // Attempt offline fallback
    if (query && typeof window !== "undefined") {
      const cached = await getCachedSearch(`songs:${query}:${source || ""}`).catch(() => null);
      if (cached) return cached as Song[];
    }
    throw e;
  }
}

export async function getSongsByEntity(
  type: string,
  id: string,
  signal?: AbortSignal
): Promise<Song[]> {
  return request<Song[]>(`/api/songs?type=${type}&id=${id}`, { signal });
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
 * Fetch track metadata (album, duration, etc.) by title and artist.
 *
 * @param title - Song title
 * @param artist - Artist name
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Track metadata object
 */
export async function getTrackInfo(
  title: string,
  artist: string,
  signal?: AbortSignal
): Promise<any> {
  return request(
    `/api/track/info?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
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

// ─── Trending & Charts ────────────────────────────────────────────
/**
 * Fetch trending songs across all sources.
 *
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Array of trending Song objects
 */
export async function getTrendingSongs(signal?: AbortSignal): Promise<any[]> {
  return request<any[]>(`/api/trending`, { signal });
}

/**
 * Fetch chart/playlist data by chart ID.
 *
 * @param chartId - Chart identifier (default: "songs")
 * @param signal - Optional AbortSignal to cancel the request
 * @returns Array of Song objects in the chart
 */
export async function getCharts(
  chartId: string = "songs",
  signal?: AbortSignal
): Promise<any[]> {
  return request<any[]>(`/api/charts?id=${chartId}`, { signal });
}
