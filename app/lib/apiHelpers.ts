import { getHDThumbnail, getBestThumbnail } from "./thumbnail";

/**
 * Shared helpers for API route handlers.
 * Previously duplicated across songs, search, trending, charts, radio, and related routes.
 */

// ─── Fetch with Timeout ─────────────────────────────────────────
export function fetchWithTimeout(url: string, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

// ─── Artist Name Resolution ─────────────────────────────────────
export function pickArtist(item: any): string {
  // Saavn primary artists
  const primaryArtists = item?.artists?.primary;
  if (Array.isArray(primaryArtists) && primaryArtists.length > 0) {
    const names = primaryArtists.map((a: any) => a?.name).filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }

  // Generic artists array (Saavn or YouTube)
  if (Array.isArray(item?.artists) && item.artists.length > 0) {
    const names = item.artists
      .map((a: any) => (typeof a === "string" ? a : a?.name || ""))
      .filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }

  if (typeof item?.artist === "string" && item.artist.trim()) return item.artist;
  if (typeof item?.author === "string" && item.author.trim()) return item.author;
  if (typeof item?.primaryArtists === "string" && item.primaryArtists.trim()) return item.primaryArtists;
  if (item?.channel?.name) return String(item.channel.name);
  return "Unknown Artist";
}

// ─── Cover Art Resolution ───────────────────────────────────────
export function pickCover(item: any): string | undefined {
  // Saavn image array
  if (Array.isArray(item?.image) && item.image.length > 0) {
    return item.image[item.image.length - 1]?.url || item.image[0]?.url;
  }

  // YouTube thumbnails
  const bestThumb = getBestThumbnail(item?.thumbnails);
  if (bestThumb) return bestThumb;

  if (typeof item?.thumbnail === "string" && item.thumbnail) {
    return getHDThumbnail(item.thumbnail);
  }

  return getHDThumbnail(item?.thumbnails?.[0]?.url);
}

// ─── Saavn Download URL ─────────────────────────────────────────
export function pickSaavnDownloadUrl(item: any): string {
  const direct =
    item?.downloadUrl?.[item.downloadUrl.length - 1]?.url ||
    (Array.isArray(item?.downloadUrl) ? item.downloadUrl[0]?.url : item?.downloadUrl);
  return typeof direct === "string" ? direct : "";
}

// ─── Duration Parsing ───────────────────────────────────────────
export function parseDuration(value: any): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const chunks = value.split(":").map((part) => Number(part));
  if (chunks.some((part) => Number.isNaN(part))) return 0;
  if (chunks.length === 2) return chunks[0] * 60 + chunks[1];
  if (chunks.length === 3) return chunks[0] * 3600 + chunks[1] * 60 + chunks[2];
  return 0;
}

// ─── Genre List ─────────────────────────────────────────────────
export const GENRES = [
  "Bollywood",
  "Punjabi Pop",
  "Indipop",
  "Indian Hip-Hop",
  "Sufi / Ghazal",
  "Classical (Hindustani/Carnatic)",
  "Devotional",
  "Regional Folk (Rajasthani/Baul)",
  "Electronic / EDM",
  "Fusion",
  "Indie / Alternative",
  "Tollywood / Regional Film",
];

// ─── Valid Countries ────────────────────────────────────────────
export const VALID_COUNTRIES = ["IN", "US", "GB", "KR", "JP", "BR", "DE", "FR", "CA", "AU"] as const;
