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
  const searchParams = request.nextUrl.searchParams;
  const chartId = searchParams.get("id") || "songs"; // songs, albums, artists, playlists
  const country = searchParams.get("country") || "IN";

  try {
    let saavnEndpoint = "";
    let ytEndpoint = "";

    const saavnQueryByType: Record<string, string> = {
      songs: "top songs",
      albums: "top albums",
      artists: "top artists",
      playlists: "top playlists",
    };

    // Use documented/search-based Saavn endpoints and YT endpoints that return stable shapes.
    switch (chartId) {
      case "songs":
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encodeURIComponent(saavnQueryByType.songs)}&limit=30`;
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/trending?country=${country}`;
        break;
      case "albums":
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/albums?query=${encodeURIComponent(saavnQueryByType.albums)}&limit=20`;
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/search?q=popular+albums&filter=albums&limit=20`;
        break;
      case "artists":
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/artists?query=${encodeURIComponent(saavnQueryByType.artists)}&limit=20`;
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/search?q=popular+artists&filter=artists&limit=20`;
        break;
      case "playlists":
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/playlists?query=${encodeURIComponent(saavnQueryByType.playlists)}&limit=20`;
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/search?q=popular+playlists&filter=playlists&limit=20`;
        break;
      default:
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encodeURIComponent(saavnQueryByType.songs)}&limit=30`;
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/trending?country=${country}`;
    }

    // Fetch from both sources in parallel
    const [saavnRes, ytRes] = await Promise.all([
      fetchWithTimeout(saavnEndpoint).then(res => res.json()).catch(() => ({ success: false })),
      fetchWithTimeout(ytEndpoint).then(res => res.json()).catch(() => [])
    ]);

    const saavnRaw = saavnRes.success && Array.isArray(saavnRes.data?.results)
      ? saavnRes.data.results
      : [];

    const saavnCharts = saavnRaw.map((item: any, index: number) => {
      const id = item?.id;
      if (!id) return null;

      if (chartId === "songs") {
        const downloadUrl = pickSaavnDownloadUrl(item);
        if (!downloadUrl) return null;

        return {
          id: `saavn-${id}`,
          title: item.name || item.title || "Untitled",
          artist: pickArtist(item),
          cover: pickCover(item),
          duration: Number(item.duration) || 0,
          url: `/api/stream?saavnUrl=${encodeURIComponent(downloadUrl)}`,
          source: "Saavn",
          position: index + 1,
          rank: index + 1,
        };
      }

      return {
        id: `saavn-${id}`,
        title: item.name || item.title || "Untitled",
        artist: pickArtist(item),
        cover: pickCover(item),
        duration: Number(item.duration) || 0,
        url: item.url || "",
        source: "Saavn",
        position: index + 1,
        rank: index + 1,
      };
    }).filter(Boolean);

    const ytData = chartId === "songs"
      ? (Array.isArray(ytRes) ? ytRes : (ytRes?.tracks || ytRes?.results || ytRes?.data || []))
      : (Array.isArray(ytRes) ? (ytRes?.[0]?.items ? ytRes.flatMap((section: any) => section?.items || []) : ytRes) : (ytRes?.results || ytRes?.data || []));

    const ytCharts = (Array.isArray(ytData) ? ytData : [])
      .slice(0, chartId === "songs" ? 40 : 30)
      .map((item: any, index: number) => {
        const id = item?.videoId || item?.id || item?.fallbackVideoId || item?.browseId;
        if (!id) return null;

        const title = item?.title || item?.name || item?.fallbackTitle || "Untitled";
        const songLikeUrl = chartId === "songs"
          ? `/api/stream?id=${encodeURIComponent(id)}`
          : (item?.url || "");

        return {
          id: `yt-${id}`,
          title,
          artist: pickArtist(item),
          cover: pickCover(item),
          duration:
            Number(item?.duration_seconds) ||
            Number(item?.duration) ||
            parseDuration(item?.durationText || item?.duration) ||
            0,
          url: songLikeUrl,
          source: "YouTube",
          position: index + 1,
          rank: index + 1,
        };
      })
      .filter(Boolean);

    // Interleave results: alternate between Saavn and YouTube for variety
    const combined: any[] = [];
    const seen = new Set<string>();
    const maxLen = Math.max(saavnCharts.length, ytCharts.length);
    
    for (let i = 0; i < maxLen; i++) {
      const ytItem = ytCharts[i];
      const saavnItem = saavnCharts[i];

      if (ytItem && !seen.has(ytItem.id)) {
        combined.push(ytItem);
        seen.add(ytItem.id);
      }
      if (saavnItem && !seen.has(saavnItem.id)) {
        combined.push(saavnItem);
        seen.add(saavnItem.id);
      }
    }

    return Response.json(combined.slice(0, chartId === "songs" ? 50 : 30), {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
    });

  } catch (error) {
    console.error("Charts API Error:", error);
    return Response.json([], { 
      status: 500,
      headers: { "Cache-Control": "public, s-maxage=60" }
    });
  }
}

