import { Song } from "@/app/types/song";

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
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    throw new ApiError(`Request failed: ${res.statusText}`, res.status);
  }
  return res.json();
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
  return request<Song[]>(`/api/songs?${params}`, { signal });
}

export async function getSongsByEntity(
  type: string,
  id: string,
  signal?: AbortSignal
): Promise<Song[]> {
  return request<Song[]>(`/api/songs?type=${type}&id=${id}`, { signal });
}

export async function getRadioSongs(
  videoId: string,
  signal?: AbortSignal
): Promise<Song[]> {
  const vId = videoId.startsWith("yt-") ? videoId.replace("yt-", "") : videoId;
  return request<Song[]>(`/api/songs/radio?videoId=${vId}`, { signal });
}

export async function getRelatedSongs(
  videoId: string,
  signal?: AbortSignal
): Promise<Song[]> {
  const vId = videoId.startsWith("yt-") ? videoId.replace("yt-", "") : videoId;
  return request<Song[]>(`/api/songs/related?videoId=${vId}`, { signal });
}

// ─── Search ──────────────────────────────────────────────
export async function search(
  query: string,
  type: string = "song",
  signal?: AbortSignal
): Promise<any[]> {
  return request<any[]>(
    `/api/search?type=${type}&query=${encodeURIComponent(query)}`,
    { signal }
  );
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
