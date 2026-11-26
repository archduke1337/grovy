import { NextRequest } from "next/server";
import { fetchWithTimeout, VALID_COUNTRIES } from "@/app/lib/apiHelpers";
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
  try {
    const rawCountry = request.nextUrl.searchParams.get("country") || "IN";
    const country = (VALID_COUNTRIES as readonly string[]).includes(rawCountry.toUpperCase()) ? rawCountry.toUpperCase() : "IN";

    // Use documented endpoints that consistently return playable track data.
    const saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encodeURIComponent("trending songs")}&limit=30`;
    const ytTrendingEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/trending?country=${encodeURIComponent(country)}`;

    const [saavnRes, ytRes] = await Promise.all([
      fetchWithTimeout(saavnEndpoint).then(res => res.json()).catch(() => ({ success: false })),
      fetchWithTimeout(ytTrendingEndpoint).then(res => res.json()).catch(() => ({ success: false, tracks: [] }))
    ]);

    const saavnTrending = saavnRes.success && Array.isArray(saavnRes.data?.results)
      ? mapSongs(saavnRes.data.results.slice(0, 30), (song: any) =>
          toSaavnSong(song, "Trending")
        )
      : [];

    const ytData = Array.isArray(ytRes)
      ? ytRes
      : (ytRes?.tracks || ytRes?.results || ytRes?.data || []);

    const ytTrending = mapSongs(
      (Array.isArray(ytData) ? ytData : []).slice(0, 30),
      (song: any) => toYouTubeSong(song, "YouTube")
    );

    const combined: any[] = [];
    const seen = new Set<string>();

    for (const song of [...saavnTrending.slice(0, 3), ...ytTrending.slice(0, 3)]) {
      if (!seen.has(song.id)) {
        combined.push(song);
        seen.add(song.id);
      }
    }

    const maxLen = Math.max(saavnTrending.length, ytTrending.length);
    for (let i = 3; i < maxLen; i++) {
      const saavnItem = saavnTrending[i];
      const ytItem = ytTrending[i];

      if (saavnItem && !seen.has(saavnItem.id)) {
        combined.push(saavnItem);
        seen.add(saavnItem.id);
      }
      if (ytItem && !seen.has(ytItem.id)) {
        combined.push(ytItem);
        seen.add(ytItem.id);
      }
    }

    return Response.json(combined.slice(0, 50), {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });

  } catch (error) {
    console.error("Trending API Error:", error);
    return Response.json([], {
      status: 500,
      headers: {
        "Cache-Control": "public, s-maxage=60",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }
}
