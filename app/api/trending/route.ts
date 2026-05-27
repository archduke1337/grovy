import { NextRequest } from "next/server";
import { getHDThumbnail, getBestThumbnail } from "@/app/lib/thumbnail";

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
  if (typeof item?.primaryArtists === "string" && item.primaryArtists.trim()) return item.primaryArtists;
  if (item?.channel?.name) return String(item.channel.name);
  return "Unknown Artist";
}

function pickCover(item: any): string | undefined {
  if (Array.isArray(item?.image) && item.image.length > 0) {
    return item.image[item.image.length - 1]?.url || item.image[0]?.url;
  }

  const bestThumb = getBestThumbnail(item?.thumbnails);
  if (bestThumb) return bestThumb;

  if (typeof item?.thumbnail === "string" && item.thumbnail) {
    return getHDThumbnail(item.thumbnail);
  }

  return getHDThumbnail(item?.thumbnails?.[0]?.url);
}

function pickSaavnDownloadUrl(item: any): string {
  const direct =
    item?.downloadUrl?.[item.downloadUrl.length - 1]?.url ||
    (Array.isArray(item?.downloadUrl) ? item.downloadUrl[0]?.url : item?.downloadUrl);
  return typeof direct === "string" ? direct : "";
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

export async function GET(request: NextRequest) {
  try {
    const VALID_COUNTRIES = ["IN", "US", "GB", "CA", "AU", "DE", "FR", "JP", "BR", "KR"];
    const rawCountry = request.nextUrl.searchParams.get("country") || "IN";
    const country = VALID_COUNTRIES.includes(rawCountry.toUpperCase()) ? rawCountry.toUpperCase() : "IN";

    // Use documented endpoints that consistently return playable track data.
    const saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encodeURIComponent("trending songs")}&limit=30`;
    const ytTrendingEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/trending?country=${encodeURIComponent(country)}`;

    const [saavnRes, ytRes] = await Promise.all([
      fetchWithTimeout(saavnEndpoint).then(res => res.json()).catch(() => ({ success: false })),
      fetchWithTimeout(ytTrendingEndpoint).then(res => res.json()).catch(() => ({ success: false, tracks: [] }))
    ]);

    const saavnTrending = (saavnRes.success && Array.isArray(saavnRes.data?.results))
      ? saavnRes.data.results
      .slice(0, 30)
      .map((song: any) => {
        const downloadUrl = pickSaavnDownloadUrl(song);
        if (!song?.id || !downloadUrl) return null;

        return {
          id: `saavn-${song.id}`,
          title: song.name || song.title || "Untitled",
          artist: pickArtist(song),
          cover: pickCover(song),
          duration: Number(song.duration) || 0,
          url: `/api/stream?saavnUrl=${encodeURIComponent(downloadUrl)}`,
          source: "Saavn",
        };
      })
      .filter(Boolean)
      : [];

    const ytData = Array.isArray(ytRes)
      ? ytRes
      : (ytRes?.tracks || ytRes?.results || ytRes?.data || []);

    const ytTrending = (Array.isArray(ytData) ? ytData : [])
      .slice(0, 30)
      .map((song: any) => {
        const videoId = song?.videoId || song?.id || song?.fallbackVideoId;
        if (!videoId) return null;

        return {
          id: `yt-${videoId}`,
          title: song?.title || song?.name || song?.fallbackTitle || "Untitled",
          artist: pickArtist(song),
          cover: pickCover(song),
          duration: Number(song?.duration_seconds) || Number(song?.duration) || parseDuration(song?.durationText || song?.duration) || 0,
          url: `/api/stream?id=${encodeURIComponent(videoId)}`,
          source: "YouTube",
        };
      })
      .filter(Boolean);

    const combined: any[] = [];
    const seen = new Set<string>();

    for (const song of [...saavnTrending.slice(0, 3), ...ytTrending.slice(0, 3)]) {
      if (!seen.has(song.id)) {
        combined.push(song);
        seen.add(song.id);
      }
    }

    const maxLen = Math.max(saavnTrending.length, ytTrending.length);
    for (let i = 3; i < maxLen; i++) {
      const saavnItem = saavnTrending[i];
      const ytItem = ytTrending[i];

      if (saavnItem && !seen.has(saavnItem.id)) {
        combined.push(saavnItem);
        seen.add(saavnItem.id);
      }
      if (ytItem && !seen.has(ytItem.id)) {
        combined.push(ytItem);
        seen.add(ytItem.id);
      }
    }

    return Response.json(combined.slice(0, 50), {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
    });

  } catch (error) {
    console.error("Trending API Error:", error);
    return Response.json([], { 
      status: 500,
      headers: { "Cache-Control": "public, s-maxage=60" }
    });
  }
}
