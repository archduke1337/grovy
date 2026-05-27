import { NextRequest } from "next/server";
import { getHDThumbnail, getBestThumbnail } from "@/app/lib/thumbnail";
import { z } from "zod";
import { SongSchema } from "@/app/types/song";

// Helper: fetch with timeout to prevent hanging on slow external APIs
function fetchWithTimeout(url: string, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

function pickArtist(item: any): string {
  if (Array.isArray(item?.artists) && item.artists.length > 0) {
    return item.artists
      .map((a: any) => (typeof a === "string" ? a : a?.name || ""))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof item?.artist === "string" && item.artist.trim()) return item.artist;
  if (typeof item?.author === "string" && item.author.trim()) return item.author;
  if (item?.channel?.name) return String(item.channel.name);
  return "YouTube Artist";
}

function parseDuration(value: any): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const chunks = value.split(":").map((part) => Number(part));
  if (chunks.some((part) => Number.isNaN(part))) return 0;
  if (chunks.length === 2) return chunks[0] * 60 + chunks[1];
  if (chunks.length === 3) return chunks[0] * 3600 + chunks[1] * 60 + chunks[2];
  return 0;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return Response.json(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const type = searchParams.get("type") || "all"; // 'song', 'artist', 'album', 'playlist'

  if (!query) {
    return Response.json([], { headers: corsHeaders });
  }

  try {
    let saavnEndpoint = "";
    let ytFilter = "";
    
    switch (type) {
      case "artist":
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/artists?query=${encodeURIComponent(query)}&limit=10`;
        ytFilter = "artists";
        break;
      case "album":
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/albums?query=${encodeURIComponent(query)}&limit=10`;
        ytFilter = "albums";
        break;
      case "playlist":
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/playlists?query=${encodeURIComponent(query)}&limit=10`;
        ytFilter = "playlists";
        break;
      default:
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=10`;
        ytFilter = "songs";
    }

    const ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/search?q=${encodeURIComponent(query)}&filter=${ytFilter}`;

    const [saavnRes, ytRes] = await Promise.all([
      fetchWithTimeout(saavnEndpoint).then(res => res.json()).catch(() => ({ success: false })),
      fetchWithTimeout(ytEndpoint).then(res => res.json()).catch(() => [])
    ]);

    // Format Saavn results as Song objects for consistency with /api/songs endpoint
    const saavnFormatted = (saavnRes.success && saavnRes.data?.results) ? saavnRes.data.results.map((item: any) => {
      const cover = item.image?.[item.image.length - 1]?.url || (Array.isArray(item.image) ? item.image[0]?.url : item.image);
      const downloadUrl = item.downloadUrl?.[item.downloadUrl.length - 1]?.url || (Array.isArray(item.downloadUrl) ? item.downloadUrl[0]?.url : item.downloadUrl);
      const artist = item.artists?.primary?.map((a: any) => a.name).join(", ") || item.artist || "Unknown Artist";
      
      // Create streaming URL that proxies through our endpoint for CORS support
      let url = "";
      if (downloadUrl) {
        url = `/api/stream?saavnUrl=${encodeURIComponent(downloadUrl)}`;
      }

      return {
        id: `saavn-${item.id}`,
        title: item.name || item.title,
        url: url,
        artist: artist,
        cover: cover,
        genre: "Unknown",
        duration: item.duration,
        source: "Saavn"
      };
    }).filter((s: any) => s.url) : [];

    // Format YouTube results as Song objects for consistency
    const ytFormatted = (Array.isArray(ytRes) ? ytRes : (ytRes?.results || ytRes?.data || [])).map((item: any) => {
      const videoId = item.videoId || item.id || item.fallbackVideoId;
      if (!videoId) return null;

      const cover = getBestThumbnail(item.thumbnails) || getHDThumbnail(item.thumbnails?.[0]?.url) || item.image;
      const artist = pickArtist(item);

      return {
        id: `yt-${videoId}`,
        title: item.name || item.title || item.fallbackTitle || "Untitled",
        url: `/api/stream?id=${videoId}`,
        artist: artist,
        cover: cover,
        genre: "YouTube",
        duration:
          Number(item.duration_seconds) ||
          Number(item.duration) ||
          (item.duration_ms != null ? Number(item.duration_ms) / 1000 : 0) ||
          parseDuration(item.durationText || item.duration) ||
          180,
        source: "YouTube"
      };
    }).filter(Boolean);

    // Interleave results
    const combined = [];
    const maxLen = Math.max(saavnFormatted.length, ytFormatted.length);
    for (let i = 0; i < maxLen; i++) {
      if (saavnFormatted[i]) combined.push(saavnFormatted[i]);
      if (ytFormatted[i]) combined.push(ytFormatted[i]);
    }

    // Validate with Zod schema and return only valid songs
    const result = z.array(SongSchema).safeParse(combined);
    if (!result.success) {
      console.error("Search validation failed:", result.error.format());
      const validSongs = combined.filter(s => SongSchema.safeParse(s).success);
      return Response.json(validSongs, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
      });
    }

    return Response.json(result.data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });

  } catch (error) {
    console.error("Search API Error:", error);
    return Response.json([], { headers: corsHeaders });
  }
}
