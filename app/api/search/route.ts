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
    let endpoint = "";
    switch (type) {
      case "artist":
        endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/artists?query=${encodeURIComponent(query)}&limit=10`;
        break;
      case "album":
        endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/albums?query=${encodeURIComponent(query)}&limit=10`;
        break;
      case "playlist":
        endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/playlists?query=${encodeURIComponent(query)}&limit=10`;
        break;
      default:
        // Default to songs, though handled by /api/songs usually. 
        // This file mainly handles structured entity search.
        endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=10`;
    }

    const response = await fetch(endpoint);
    const data = await response.json();

    if (!data.success || !data.data?.results) {
      return Response.json([]);
    }

    const rawResults = data.data.results.map((item: any) => {
      // Normalize image
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
        url: item.url
      };
    });

    return Response.json(rawResults);

  } catch (error) {
    console.error("Search API Error:", error);
    return Response.json([]);
  }
}
