/**
 * Shared implementation for the radio and related-track endpoints.
 *
 * The two routes differ only in which discovery strategy they prefer, so the
 * parsing and fallback chain lives here instead of being duplicated.
 */

import { pickArtist, pickCover, parseDuration } from "./apiHelpers";
import { fetchWithTimeout } from "./apiHelpers";
import { SongSchema } from "@/app/types/song";
import type { Song } from "@/app/types/song";

const YT_API = "https://ytapi.gauravramyadav.workers.dev";
const SAAVN_API = "https://jiosaavn-api.gauravramyadav.workers.dev";

type RawRecord = Record<string, unknown>;

function firstArray(data: unknown): RawRecord[] {
  if (Array.isArray(data)) return data as RawRecord[];
  if (!data || typeof data !== "object") return [];

  const record = data as RawRecord;
  for (const key of ["data", "tracks", "results", "songs"] as const) {
    if (Array.isArray(record[key])) return record[key] as RawRecord[];
  }
  return [];
}

function toYouTubeSong(item: RawRecord, genre: string): Song | null {
  const id = item.videoId ?? item.id ?? item.fallbackVideoId;
  if (typeof id !== "string" || !id) return null;

  return {
    id: `yt-${id}`,
    title: String(item.title ?? item.name ?? item.fallbackTitle ?? "Untitled"),
    url: `/api/stream?id=${encodeURIComponent(id)}`,
    artist: pickArtist(item),
    cover: pickCover(item),
    genre,
    duration:
      Number(item.duration) ||
      parseDuration(item.durationText ?? item.duration) ||
      0,
    source: "YouTube",
  };
}

function toSaavnSong(item: RawRecord, genre: string): Song | null {
  const id = item.id;
  if (typeof id !== "string" || !id) return null;

  const downloadUrl = pickSaavnDownloadUrl(item);
  if (!downloadUrl) return null;

  return {
    id: `saavn-${id}`,
    title: String(item.name ?? item.title ?? "Untitled"),
    url: `/api/stream?saavnUrl=${encodeURIComponent(downloadUrl)}`,
    artist: pickArtist(item),
    cover: pickCover(item),
    genre,
    duration: Number(item.duration) || 0,
    source: "Saavn",
  };
}

function pickSaavnDownloadUrl(item: RawRecord): string {
  const list = item.downloadUrl;

  if (Array.isArray(list)) {
    const last = list[list.length - 1] as RawRecord | undefined;
    if (last && typeof last.url === "string") return last.url;
    const first = list[0] as RawRecord | undefined;
    if (first && typeof first.url === "string") return first.url;
  }

  return typeof list === "string" ? list : "";
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;

  try {
    return await res.json();
  } catch {
    return null;
  }
}

export type DiscoveryParams = {
  videoId: string | null;
  songId: string | null;
  title: string | null;
  artist: string | null;
};

export type DiscoveryKind = "radio" | "related";

function youtubeEndpoint(kind: DiscoveryKind, videoId: string): string {
  return kind === "radio"
    ? `${YT_API}/api/radio?videoId=${encodeURIComponent(videoId)}`
    : `${YT_API}/api/related/${encodeURIComponent(videoId)}`;
}

/**
 * Resolve a list of discovery songs, trying three sources in order:
 * YouTube (radio/related), Saavn suggestions, then a title/artist match.
 * Returns an empty list rather than throwing when everything fails.
 */
export async function discoverSongs(
  kind: DiscoveryKind,
  params: DiscoveryParams
): Promise<Song[]> {
  const genre = kind === "radio" ? "Radio" : "Related";
  const { videoId, songId, title, artist } = params;

  if (videoId) {
    const data = await fetchJson(youtubeEndpoint(kind, videoId)).catch(() => null);
    const songs = firstArray(data)
      .map((item) => toYouTubeSong(item, genre))
      .filter((song): song is Song => song !== null);

    if (songs.length > 0) return songs;
  }

  if (songId?.startsWith("saavn-")) {
    const saavnId = songId.replace("saavn-", "");
    const data = await fetchJson(
      `${SAAVN_API}/api/songs/${encodeURIComponent(saavnId)}/suggestions`
    ).catch(() => null);

    const payload = data as { success?: boolean; data?: unknown } | null;
    const songs = (payload?.success ? firstArray(payload.data) : [])
      .map((item) => toSaavnSong(item, genre))
      .filter((song): song is Song => song !== null);

    if (songs.length > 0) return songs;
  }

  if (title) {
    const query = new URLSearchParams({ title });
    if (artist) query.append("artist", artist);

    const data = await fetchJson(`${YT_API}/api/similar?${query}`).catch(() => null);
    const songs = firstArray(data)
      .map((item) => toYouTubeSong(item, genre))
      .filter((song): song is Song => song !== null);

    if (songs.length > 0) return songs;
  }

  return [];
}

/** Validate the final list so a malformed upstream item cannot reach the UI. */
export function validateSongs(songs: Song[]): Song[] {
  return songs.filter((song) => SongSchema.safeParse(song).success);
}
