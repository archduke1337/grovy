/**
 * Upstream item → `Song` mapping.
 *
 * The same three shapes (YouTube track, Saavn track, Saavn download payload)
 * were parsed in four places — `/api/songs`, `/api/search`, `/api/trending` and
 * `discovery.ts` — with subtly different duration fallbacks and different
 * rules about which items were dropped. Anything that only worked in one of
 * those copies (HD cover upgrade, `duration_ms` handling) was invisible
 * everywhere else. This module is the single definition.
 *
 * Both mappers return `null` when an item cannot produce a playable song. A
 * `Song` with an empty `url` is rejected by `SongSchema` anyway, and a card
 * that plays nothing is worse than a missing card.
 */

import { parseDuration, pickArtist, pickCover, pickSaavnDownloadUrl } from "./apiHelpers";
import type { Song } from "@/app/types/song";

type RawRecord = Record<string, unknown>;

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

/**
 * Duration in seconds from whichever field the upstream happened to send.
 *
 * Ordered most-to-least precise: `duration_seconds` is already seconds,
 * `duration_ms` needs dividing, and `durationText` ("3:45") needs parsing.
 * Returns 0 when nothing usable is present — the real length is read from the
 * audio element during playback, so 0 here only means "unknown", not "zero".
 */
export function resolveDuration(item: RawRecord): number {
  const seconds = Number(item.duration_seconds);
  if (Number.isFinite(seconds) && seconds > 0) return Math.round(seconds);

  const millis = Number(item.duration_ms);
  if (Number.isFinite(millis) && millis > 0) return Math.round(millis / 1000);

  const duration = Number(item.duration);
  if (Number.isFinite(duration) && duration > 0) return Math.round(duration);

  return parseDuration(item.durationText);
}

export function toYouTubeSong(item: RawRecord, genre: string): Song | null {
  const videoId = nonEmptyString(item.videoId) ?? nonEmptyString(item.id) ?? nonEmptyString(item.fallbackVideoId);
  if (!videoId) return null;

  const title = nonEmptyString(item.title) ?? nonEmptyString(item.name) ?? nonEmptyString(item.fallbackTitle);

  return {
    id: `yt-${videoId}`,
    title: title ?? "Untitled",
    url: `/api/stream?id=${encodeURIComponent(videoId)}`,
    artist: pickArtist(item),
    cover: pickCover(item),
    genre,
    duration: resolveDuration(item),
    source: "YouTube",
  };
}

export function toSaavnSong(item: RawRecord, genre: string): Song | null {
  const id = nonEmptyString(item.id);
  if (!id) return null;

  // Proxied through the stream route: the CDN does not send CORS headers, so
  // the browser cannot fetch it directly.
  const downloadUrl = pickSaavnDownloadUrl(item);
  if (!downloadUrl) return null;

  const title = nonEmptyString(item.name) ?? nonEmptyString(item.title);

  return {
    id: `saavn-${id}`,
    title: title ?? "Untitled",
    url: `/api/stream?saavnUrl=${encodeURIComponent(downloadUrl)}`,
    artist: pickArtist(item),
    cover: pickCover(item),
    genre,
    duration: resolveDuration(item),
    source: "Saavn",
  };
}

/** Map a list, dropping items that cannot produce a playable song. */
export function mapSongs<T extends RawRecord>(
  items: T[],
  mapper: (item: T, index: number) => Song | null
): Song[] {
  const songs: Song[] = [];
  for (let index = 0; index < items.length; index++) {
    const song = mapper(items[index], index);
    if (song) songs.push(song);
  }
  return songs;
}
