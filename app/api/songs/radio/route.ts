
import { NextRequest } from "next/server";
import { getHDThumbnail, getBestThumbnail } from "@/app/lib/thumbnail";

function fetchWithTimeout(url: string, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get("videoId");
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");
  const songId = searchParams.get("songId");

  if (!videoId && !title) {
    return Response.json({ error: "Missing videoId or title" }, { status: 400 });
  }

  try {
    let radioSongs: any[] = [];

    // Strategy 1: YouTube radio endpoint (for YT songs)
    if (videoId) {
      try {
        const url = `https://ytapi.gauravramyadav.workers.dev/api/radio?videoId=${videoId}`;
        const res = await fetchWithTimeout(url);
        if (res.ok) {
          const data = await res.json();
          const rawData = Array.isArray(data) ? data : (data.tracks || data.results || data.songs || []);
          radioSongs = rawData.map((item: any) => ({
            id: `yt-${item.videoId || item.id}`,
            title: item.title,
            url: `/api/stream?id=${item.videoId || item.id}`,
            artist: item.artists?.[0]?.name || item.author || "YouTube Artist",
            cover: getBestThumbnail(item.thumbnails) || getHDThumbnail(item.thumbnails?.[0]?.url) || item.thumbnail,
            genre: "Radio",
            duration: item.duration || 0,
            source: "YouTube",
          }));
        }
      } catch (e) {
        console.warn("[Radio] YouTube radio failed, falling back");
      }
    }

    // Strategy 2: Saavn song suggestions (for Saavn songs)
    if (radioSongs.length === 0 && songId && songId.startsWith("saavn-")) {
      try {
        const saavnId = songId.replace("saavn-", "");
        const url = `https://jiosaavn-api.gauravramyadav.workers.dev/api/songs/${saavnId}/suggestions`;
        const res = await fetchWithTimeout(url);
        if (res.ok) {
          const data = await res.json();
          const suggestions = data.success && data.data ? (Array.isArray(data.data) ? data.data : []) : [];
          radioSongs = suggestions.filter((item: any) => item && item.id).map((item: any) => {
            const cover = item.image?.[item.image.length - 1]?.url || (Array.isArray(item.image) ? item.image[0]?.url : item.image);
            const downloadUrl = item.downloadUrl?.[item.downloadUrl.length - 1]?.url || (Array.isArray(item.downloadUrl) ? item.downloadUrl[0]?.url : item.downloadUrl);
            const art = item.artists?.primary?.map((a: any) => a.name).join(", ") || item.artist || "Unknown Artist";
            return {
              id: `saavn-${item.id}`,
              title: item.name || item.title,
              url: downloadUrl ? `/api/stream?saavnUrl=${encodeURIComponent(downloadUrl)}` : "",
              artist: art,
              cover,
              genre: "Radio",
              duration: item.duration,
              source: "Saavn",
            };
          }).filter((s: any) => s.url);
        }
      } catch (e) {
        console.warn("[Radio] Saavn suggestions failed, trying similar");
      }
    }

    // Strategy 3: Similar endpoint (works with title+artist for any source)
    if (radioSongs.length === 0 && title) {
      try {
        const params = new URLSearchParams({ title });
        if (artist) params.append("artist", artist);
        const url = `https://ytapi.gauravramyadav.workers.dev/api/similar?${params}`;
        const res = await fetchWithTimeout(url);
        if (res.ok) {
          const data = await res.json();
          const rawData = Array.isArray(data) ? data : (data.tracks || data.results || data.songs || []);
          radioSongs = rawData.map((item: any) => ({
            id: `yt-${item.videoId || item.id}`,
            title: item.title,
            url: `/api/stream?id=${item.videoId || item.id}`,
            artist: item.artists?.[0]?.name || item.author || "YouTube Artist",
            cover: getBestThumbnail(item.thumbnails) || getHDThumbnail(item.thumbnails?.[0]?.url) || item.thumbnail,
            genre: "Radio",
            duration: item.duration || 0,
            source: "YouTube",
          }));
        }
      } catch (e) {
        console.warn("[Radio] Similar endpoint also failed");
      }
    }

    return Response.json(radioSongs, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
    });
  } catch (error) {
    console.error("Radio API Error:", error);
    return Response.json([], { status: 200 });
  }
}
