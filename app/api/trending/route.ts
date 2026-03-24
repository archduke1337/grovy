import { NextRequest } from "next/server";
import { getHDThumbnail, getBestThumbnail } from "@/app/lib/thumbnail";

function fetchWithTimeout(url: string, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function GET(request: NextRequest) {
  try {
    // Fetch from both JioSaavn and YouTube Music for comprehensive trending data
    const saavnEndpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/trending/songs?limit=30";
    
    // YouTube Music Charts - fetch top songs from various sources
    const ytChartEndpoint = "https://ytapi.gauravramyadav.workers.dev/api/charts?region=US";
    const ytSearchEndpoint = "https://ytapi.gauravramyadav.workers.dev/api/search?q=top%20charts%20now&filter=songs&limit=30";

    const [saavnRes, ytChartRes, ytSearchRes] = await Promise.all([
      fetchWithTimeout(saavnEndpoint).then(res => res.json()).catch(() => ({ success: false })),
      fetchWithTimeout(ytChartEndpoint).then(res => res.json()).catch(() => []),
      fetchWithTimeout(ytSearchEndpoint).then(res => res.json()).catch(() => [])
    ]);

    const saavnTrending = (saavnRes.success && saavnRes.data?.results) 
      ? saavnRes.data.results.map((song: any, idx: number) => {
          let imageUrl = "";
          if (Array.isArray(song.image) && song.image.length > 0) {
            imageUrl = song.image[song.image.length - 1].url;
          } else if (typeof song.image === "string") {
            imageUrl = song.image;
          }

          return {
            id: `saavn-${song.id}`,
            title: song.title || song.name,
            artist: song.artists?.[0]?.name || song.artist || "Unknown",
            cover: imageUrl,
            duration: song.duration || 0,
            url: song.url || "",
            source: "JioSaavn",
            position: idx + 1,
            explicit: song.explicit || false,
            rating: song.rating || 0
          };
        })
      : [];

    // Use YouTube chart data if available, otherwise use search results
    const ytData = Array.isArray(ytChartRes) && ytChartRes.length > 0 ? ytChartRes : 
                   (Array.isArray(ytSearchRes) ? ytSearchRes : (ytSearchRes?.results || ytSearchRes?.data || []));

    const ytTrending = ytData
      .slice(0, 30)
      .map((song: any, idx: number) => {
        const videoId = song.videoId || song.id;
        if (!videoId) return null;

        const image = getBestThumbnail(song.thumbnails) || getHDThumbnail(song.thumbnails?.[0]?.url);
        const artist = Array.isArray(song.artists) 
          ? song.artists.map((a: any) => a.name || a).join(", ")
          : (song.artist || song.artists || "YouTube Music");

        return {
          id: `yt-${videoId}`,
          title: song.title || song.name,
          artist: artist,
          cover: image,
          duration: song.duration_seconds || song.duration || 0,
          url: song.url || "",
          source: "YouTube Music",
          position: idx + 1,
          explicit: false,
          rating: song.rating || 0
        };
      })
      .filter(Boolean);

    // Interleave results - prioritize based on source variety
    // First few from each source for better variety
    const combined = [];
    
    // Add top 3 from each source first
    combined.push(...saavnTrending.slice(0, 3));
    combined.push(...ytTrending.slice(0, 3));
    
    // Then interleave the rest
    const maxLen = Math.max(saavnTrending.length, ytTrending.length);
    for (let i = 3; i < maxLen; i++) {
      if (i < saavnTrending.length) combined.push(saavnTrending[i]);
      if (i < ytTrending.length) combined.push(ytTrending[i]);
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
