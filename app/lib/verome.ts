
import { getHDThumbnail, getBestThumbnail } from "./thumbnail";

const BASE_URL = "https://ytapi.gauravramyadav.workers.dev";

export interface VeromeTrack {
  videoId: string;
  title: string;
  artists: { name: string; browseId?: string }[];
  album?: { name: string; browseId: string };
  duration?: number;
  thumbnails: { url: string; width: number; height: number }[];
}

export async function searchYouTubeMusic(query: string) {
  try {
    const res = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}&filter=songs`);
    const data = await res.json();
    return data as VeromeTrack[];
  } catch (error) {
    console.error("Verome Search Error:", error);
    return [];
  }
}

export async function getStreamUrl(videoId: string) {
  try {
    const res = await fetch(`${BASE_URL}/api/stream?id=${videoId}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Verome Stream Error:", error);
    return null;
  }
}

export async function getLyrics(title: string, artist: string) {
  try {
    const res = await fetch(`${BASE_URL}/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Verome Lyrics Error:", error);
    return null;
  }
}

/**
 * Helper to get an HD cover URL from a VeromeTrack's thumbnails
 */
export function getTrackCover(track: VeromeTrack): string | undefined {
  return getBestThumbnail(track.thumbnails) || getHDThumbnail(track.thumbnails?.[0]?.url);
}
