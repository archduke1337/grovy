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
  if (options?.signal) {
    if (options.signal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
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
    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Songs ───────────────────────────────────────────────
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
    // Cache results in background
    if (query && songs.length > 0) {
      cacheSongs(songs).catch(() => {});
      cacheSearchResults(`songs:${query}:${source || ""}`, songs).catch(() => {});
    }
    return songs;
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
export async function getTrendingSongs(signal?: AbortSignal): Promise<any[]> {
  return request<any[]>(`/api/trending`, { signal });
}

export async function getCharts(
  chartId: string = "songs",
  signal?: AbortSignal
): Promise<any[]> {
  return request<any[]>(`/api/charts?id=${chartId}`, { signal });
}
