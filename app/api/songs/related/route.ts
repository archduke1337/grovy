
import { NextRequest } from "next/server";
import { getHDThumbnail, getBestThumbnail } from "@/app/lib/thumbnail";

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

function pickCover(item: any): string | undefined {
  return (
    getBestThumbnail(item?.thumbnails) ||
    getHDThumbnail(item?.thumbnails?.[0]?.url) ||
    (typeof item?.thumbnail === "string" ? getHDThumbnail(item.thumbnail) : undefined) ||
    (typeof item?.image === "string" ? item.image : undefined)
  );
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
  const videoId = searchParams.get("videoId");
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");
  const songId = searchParams.get("songId"); // Full song ID for Saavn suggestions

  if (!videoId && !title) {
    return Response.json({ error: "Missing videoId or title" }, { status: 400 });
  }

  try {
    let relatedSongs: any[] = [];

    // Strategy 1: YouTube related endpoint (for YT songs)
    if (videoId) {
      try {
        const url = `https://ytapi.gauravramyadav.workers.dev/api/related/${videoId}`;
        const res = await fetchWithTimeout(url);
        if (res.ok) {
          const data = await res.json();
          const rawData = Array.isArray(data)
            ? data
            : (data.data || data.tracks || data.results || data.songs || []);
          relatedSongs = rawData
            .map((item: any) => {
              const id = item.videoId || item.id || item.fallbackVideoId;
              if (!id) return null;

              return {
                id: `yt-${id}`,
                title: item.title || item.name || item.fallbackTitle || "Untitled",
                url: `/api/stream?id=${id}`,
                artist: pickArtist(item),
                cover: pickCover(item),
                genre: "Related",
                duration: Number(item.duration) || parseDuration(item.durationText || item.duration) || 0,
                source: "YouTube",
              };
            })
            .filter(Boolean);
        }
      } catch (e) {
        console.warn("[Related] YouTube related failed, falling back");
      }
    }

    // Strategy 2: Saavn song suggestions (for Saavn songs)
    if (relatedSongs.length === 0 && songId && songId.startsWith("saavn-")) {
      try {
        const saavnId = songId.replace("saavn-", "");
        const url = `https://jiosaavn-api.gauravramyadav.workers.dev/api/songs/${saavnId}/suggestions`;
        const res = await fetchWithTimeout(url);
        if (res.ok) {
          const data = await res.json();
          const suggestions = data.success && data.data ? (Array.isArray(data.data) ? data.data : []) : [];
          relatedSongs = suggestions.filter((item: any) => item && item.id).map((item: any) => {
            const cover = item.image?.[item.image.length - 1]?.url || (Array.isArray(item.image) ? item.image[0]?.url : item.image);
            const downloadUrl = item.downloadUrl?.[item.downloadUrl.length - 1]?.url || (Array.isArray(item.downloadUrl) ? item.downloadUrl[0]?.url : item.downloadUrl);
            const art = item.artists?.primary?.map((a: any) => a.name).join(", ") || item.artist || "Unknown Artist";
            return {
              id: `saavn-${item.id}`,
              title: item.name || item.title,
              url: downloadUrl ? `/api/stream?saavnUrl=${encodeURIComponent(downloadUrl)}` : "",
              artist: art,
              cover,
              genre: "Related",
              duration: item.duration,
              source: "Saavn",
            };
          }).filter((s: any) => s.url);
        }
      } catch (e) {
        console.warn("[Related] Saavn suggestions failed, trying similar");
      }
    }

    // Strategy 3: Similar endpoint (works with title+artist for any source)
    if (relatedSongs.length === 0 && title) {
      try {
        const params = new URLSearchParams({ title });
        if (artist) params.append("artist", artist);
        const url = `https://ytapi.gauravramyadav.workers.dev/api/similar?${params}`;
        const res = await fetchWithTimeout(url);
        if (res.ok) {
          const data = await res.json();
          const rawData = Array.isArray(data)
            ? data
            : (data.data || data.tracks || data.results || data.songs || []);
          relatedSongs = rawData
            .map((item: any) => {
              const id = item.videoId || item.id || item.fallbackVideoId;
              if (!id) return null;

              return {
                id: `yt-${id}`,
                title: item.title || item.name || item.fallbackTitle || "Untitled",
                url: `/api/stream?id=${id}`,
                artist: pickArtist(item),
                cover: pickCover(item),
                genre: "Related",
                duration: Number(item.duration) || parseDuration(item.durationText || item.duration) || 0,
                source: "YouTube",
              };
            })
            .filter(Boolean);
        }
      } catch (e) {
        console.warn("[Related] Similar endpoint also failed");
      }
    }

    return Response.json(relatedSongs, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
    });
  } catch (error) {
    console.error("Related API Error:", error);
    return Response.json([], { status: 200 });
  }
}
