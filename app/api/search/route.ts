import { NextRequest } from "next/server";
import { z } from "zod";
import { SongSchema } from "@/app/types/song";
import { fetchWithTimeout } from "@/app/lib/apiHelpers";
import { mapSongs, toSaavnSong, toYouTubeSong } from "@/app/lib/songMapper";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return Response.json(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const type = searchParams.get("type") || "all"; // 'song', 'artist', 'album', 'playlist'

  if (!query) {
    return Response.json([], { headers: corsHeaders });
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
      fetchWithTimeout(saavnEndpoint).then(res => res.json()).catch(() => ({ success: false })),
      fetchWithTimeout(ytEndpoint).then(res => res.json()).catch(() => [])
    ]);

    // Format upstream results with the shared mappers, so search, browse and
    // discovery cannot drift apart in duration fallbacks or cover handling.
    const saavnFormatted = saavnRes.success && saavnRes.data?.results
      ? mapSongs(saavnRes.data.results, (item: any) => toSaavnSong(item, "Unknown"))
      : [];

    // Format YouTube results as Song objects for consistency
    const ytFormatted = mapSongs(
      Array.isArray(ytRes) ? ytRes : (ytRes?.results || ytRes?.data || []),
      (item: any) => toYouTubeSong(item, "YouTube")
    );

    // Interleave results
    const combined = [];
    const maxLen = Math.max(saavnFormatted.length, ytFormatted.length);
    for (let i = 0; i < maxLen; i++) {
      if (saavnFormatted[i]) combined.push(saavnFormatted[i]);
      if (ytFormatted[i]) combined.push(ytFormatted[i]);
    }

    // Validate with Zod schema and return only valid songs
    const result = z.array(SongSchema).safeParse(combined);
    if (!result.success) {
      console.error("Search validation failed:", result.error.format());
      const validSongs = combined.filter(s => SongSchema.safeParse(s).success);
      return Response.json(validSongs, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
      });
    }

    return Response.json(result.data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });

  } catch (error) {
    console.error("Search API Error:", error);
    return Response.json([], { headers: corsHeaders });
  }
}
