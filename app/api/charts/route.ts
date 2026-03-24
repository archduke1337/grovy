import { NextRequest } from "next/server";
import { getHDThumbnail, getBestThumbnail } from "@/app/lib/thumbnail";

function fetchWithTimeout(url: string, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chartId = searchParams.get("id") || "songs"; // songs, albums, artists, playlists
  const region = searchParams.get("region") || "US";

  try {
    let saavnEndpoint = "";
    let ytEndpoint = "";
    
    // Determine JioSaavn endpoint
    switch (chartId) {
      case "songs":
        saavnEndpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/charts/songs?limit=30";
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/charts?region=${region}`;
        break;
      case "albums":
        saavnEndpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/charts/albums?limit=20";
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/search?q=popular+albums&filter=albums&limit=20`;
        break;
      case "artists":
        saavnEndpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/charts/artists?limit=20";
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/search?q=popular+artists&filter=artists&limit=20`;
        break;
      case "playlists":
        saavnEndpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/charts/playlists?limit=20";
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/search?q=popular+playlists&filter=playlists&limit=20`;
        break;
      default:
        saavnEndpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/charts/songs?limit=30";
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/charts?region=${region}`;
    }

    // Fetch from both sources in parallel
    const [saavnRes, ytRes] = await Promise.all([
      fetchWithTimeout(saavnEndpoint).then(res => res.json()).catch(() => ({ success: false })),
      fetchWithTimeout(ytEndpoint).then(res => res.json()).catch(() => [])
    ]);

    // Format JioSaavn charts
    const saavnCharts = (saavnRes.success && saavnRes.data?.results) 
      ? saavnRes.data.results.map((item: any, index: number) => {
          let imageUrl = "";
          if (Array.isArray(item.image) && item.image.length > 0) {
            imageUrl = item.image[item.image.length - 1].url;
          } else if (typeof item.image === "string") {
            imageUrl = item.image;
          }

          return {
            id: `saavn-${item.id}`,
            title: item.title || item.name,
            artist: item.artists?.[0]?.name || item.artist || "Unknown",
            cover: imageUrl,
            duration: item.duration || 0,
            url: item.url || "",
            source: "JioSaavn",
            position: index + 1,
            rank: index + 1,
            explicit: item.explicit || false,
            rating: item.rating || 0
          };
        })
      : [];

    // Format YouTube Music charts
    const ytCharts = (Array.isArray(ytRes) ? ytRes : (ytRes?.results || ytRes?.data || []))
      .slice(0, 30)
      .map((item: any, index: number) => {
        const videoId = item.videoId || item.id || item.browseId;
        if (!videoId) return null;

        const image = getBestThumbnail(item.thumbnails) || getHDThumbnail(item.thumbnails?.[0]?.url);
        const artist = Array.isArray(item.artists)
          ? item.artists.map((a: any) => a.name || a).join(", ")
          : (item.artist || item.artists || "YouTube Music");

        return {
          id: `yt-${videoId}`,
          title: item.title || item.name,
          artist: artist,
          cover: image,
          duration: item.duration_seconds || item.duration || 0,
          url: item.url || "",
          source: "YouTube Music",
          position: index + 1,
          rank: index + 1,
          explicit: false,
          rating: item.rating || 0
        };
      })
      .filter(Boolean);

    // Interleave results: alternate between Saavn and YouTube for variety
    let combined = [];
    const maxLen = Math.max(saavnCharts.length, ytCharts.length);
    
    for (let i = 0; i < maxLen; i++) {
      // Prioritize YouTube Music charts (they're the official charts)
      if (i < ytCharts.length) combined.push(ytCharts[i]);
      if (i < saavnCharts.length) combined.push(saavnCharts[i]);
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

