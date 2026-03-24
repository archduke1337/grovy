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

  try {
    let endpoint = "";
    
    switch (chartId) {
      case "songs":
        endpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/charts/songs?limit=30";
        break;
      case "albums":
        endpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/charts/albums?limit=20";
        break;
      case "artists":
        endpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/charts/artists?limit=20";
        break;
      case "playlists":
        endpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/charts/playlists?limit=20";
        break;
      default:
        endpoint = "https://jiosaavn-api.gauravramyadav.workers.dev/api/charts/songs?limit=30";
    }

    const response = await fetchWithTimeout(endpoint);
    const data = await response.json();

    if (!data.success || !data.data?.results) {
      return Response.json([], {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
      });
    }

    const formatted = data.data.results.map((item: any, index: number) => {
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
    });

    return Response.json(formatted, {
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

