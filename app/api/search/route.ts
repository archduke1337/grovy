import { NextRequest } from "next/server";
import { z } from "zod";

const ResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  image: z.union([
    z.string(),
    z.array(z.object({ quality: z.string(), url: z.string() })),
    z.boolean() // Handle rare 'false' case
  ]).optional(),
  type: z.string().optional(),
  url: z.string().optional(),
});

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
      fetch(saavnEndpoint).then(res => res.json()).catch(() => ({ success: false })),
      fetch(ytEndpoint).then(res => res.json()).catch(() => [])
    ]);

    const saavnFormatted = (saavnRes.success && saavnRes.data?.results) ? saavnRes.data.results.map((item: any) => {
      let imageUrl = "";
      if (Array.isArray(item.image) && item.image.length > 0) {
        imageUrl = item.image[item.image.length - 1].url;
      } else if (typeof item.image === "string") {
        imageUrl = item.image;
      }

      return {
        id: item.id,
        name: item.name || item.title,
        description: item.description || item.subtitle || item.artist || "",
        image: imageUrl,
        type: type === "all" ? item.type : type,
        url: item.url,
        source: "Saavn"
      };
    }) : [];

    const ytFormatted = (Array.isArray(ytRes) ? ytRes : (ytRes?.results || ytRes?.data || [])).map((item: any) => {
      const browseId = item.browseId || item.videoId || item.id;
      return {
        id: `yt-${browseId}`,
        name: item.name || item.title,
        description: item.artists?.map((a: any) => a.name).join(", ") || "YouTube",
        image: item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnails?.[0]?.url,
        type: type === "all" ? "song" : type,
        url: "",
        source: "YouTube"
      };
    });

    // Interleave results
    const combined = [];
    const maxLen = Math.max(saavnFormatted.length, ytFormatted.length);
    for (let i = 0; i < maxLen; i++) {
        if (saavnFormatted[i]) combined.push(saavnFormatted[i]);
        if (ytFormatted[i]) combined.push(ytFormatted[i]);
    }

    return Response.json(combined);

  } catch (error) {
    console.error("Search API Error:", error);
    return Response.json([]);
  }
}
