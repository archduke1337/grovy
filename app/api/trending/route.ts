import { NextRequest } from "next/server";
import { getHDThumbnail, getBestThumbnail } from "@/app/lib/thumbnail";

function fetchWithTimeout(url: string, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function GET(request: NextRequest) {
  try {
    const saavnEndpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/trending/songs?limit=30";
    const ytEndpoint = "https://ytapi.gauravramyadav.workers.dev/api/search?q=trending%20music&filter=songs&limit=30";

    const [saavnRes, ytRes] = await Promise.all([
      fetchWithTimeout(saavnEndpoint).then(res => res.json()).catch(() => ({ success: false })),
      fetchWithTimeout(ytEndpoint).then(res => res.json()).catch(() => [])
    ]);

    const saavnTrending = (saavnRes.success && saavnRes.data?.results) 
      ? saavnRes.data.results.map((song: any) => {
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
            position: song.position || 0,
            explicit: song.explicit || false,
            rating: song.rating || 0
          };
        })
      : [];

    const ytTrending = (Array.isArray(ytRes) ? ytRes : (ytRes?.results || ytRes?.data || []))
      .map((song: any) => {
        const image = getBestThumbnail(song.thumbnails) || getHDThumbnail(song.thumbnails?.[0]?.url);
        return {
          id: `yt-${song.videoId || song.id}`,
          title: song.title || song.name,
          artist: song.artists?.map((a: any) => a.name).join(", ") || "YouTube",
          cover: image,
          duration: song.duration_seconds || song.duration || 0,
          url: song.url || "",
          source: "YouTube",
          position: 0,
          explicit: false,
          rating: 0
        };
      });

    // Interleave results for better variety
    const combined = [];
    const maxLen = Math.max(saavnTrending.length, ytTrending.length);
    for (let i = 0; i < maxLen; i++) {
      if (saavnTrending[i]) combined.push(saavnTrending[i]);
      if (ytTrending[i]) combined.push(ytTrending[i]);
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

