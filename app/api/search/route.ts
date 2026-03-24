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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const type = searchParams.get("type") || "all"; // 'song', 'artist', 'album', 'playlist'

  if (!query) {
    return Response.json([]);
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
      const videoId = item.videoId || item.id;
      if (!videoId) return null;

      const cover = getBestThumbnail(item.thumbnails) || getHDThumbnail(item.thumbnails?.[0]?.url) || item.image;
      const artist = item.artists?.[0]?.name || item.artist || "YouTube Artist";

      return {
        id: `yt-${videoId}`,
        title: item.name || item.title,
        url: `/api/stream?id=${videoId}`,
        artist: artist,
        cover: cover,
        genre: "YouTube",
        duration: item.duration ?? (item.duration_ms != null ? item.duration_ms / 1000 : 180),
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
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
    });

  } catch (error) {
    console.error("Search API Error:", error);
    return Response.json([]);
  }
}
