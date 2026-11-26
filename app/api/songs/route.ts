import { z } from "zod";
import { SongSchema } from "@/app/types/song";
import { NextRequest } from "next/server";
import { fetchWithTimeout, GENRES, VALID_COUNTRIES } from "@/app/lib/apiHelpers";
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
  const type = searchParams.get("type"); // 'album', 'playlist', 'artist'
  const id = searchParams.get("id");

  try {
    // 1. Fetch by ID (Album/Playlist/Artist details)
    if (id && type && ["album", "playlist", "artist"].includes(type)) {
      const isYT = id.startsWith("yt-");
      const realId = isYT ? id.replace(/^yt-/, "") : id.replace(/^saavn-/, "");

      let endpoint = "";
      if (isYT) {
        if (type === "album") endpoint = `https://ytapi.gauravramyadav.workers.dev/api/albums/${encodeURIComponent(realId)}`;
        if (type === "playlist") endpoint = `https://ytapi.gauravramyadav.workers.dev/api/playlists/${encodeURIComponent(realId)}`;
        if (type === "artist") endpoint = `https://ytapi.gauravramyadav.workers.dev/api/artists/${encodeURIComponent(realId)}`;
      } else {
        if (type === "album") endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/albums?id=${encodeURIComponent(realId)}`;
        if (type === "playlist") endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/playlists?id=${encodeURIComponent(realId)}`;
        if (type === "artist") endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/artists?id=${encodeURIComponent(realId)}&song_count=20`;
      }

      if (!endpoint) return Response.json([], { status: 400 });

      const response = await fetchWithTimeout(endpoint);
      if (!response.ok) {
        return Response.json([], { status: 502 });
      }
      const data = await response.json();

      let songsList: any[] = [];
      
      if (isYT) {
         // YouTube API returns different structures depending on the endpoint
         songsList = data.tracks || data.songs || data.videos || data.results || (Array.isArray(data) ? data : []);
         // For YT artists, songs may be nested under a property
         if (songsList.length === 0 && data.songs?.results) {
           songsList = data.songs.results;
         }
         if (songsList.length === 0 && Array.isArray(data.topSongs)) {
           songsList = data.topSongs;
         }
      } else if (data.success && data.data) {
        if (type === "artist") {
           songsList = data.data.topSongs || data.data.songs || [];
           // Saavn artist endpoint sometimes nests songs differently
           if (songsList.length === 0 && Array.isArray(data.data.singles)) {
             songsList = data.data.singles;
           }
        } else {
           songsList = data.data.songs || data.data.list || [];
        }
      } else if (Array.isArray(data)) {
        // Some endpoints return a flat array
        songsList = data;
      }

      const mappedSongs = mapSongs(
        songsList.filter(
          (item: any) => item && (item.videoId || item.id || item.fallbackVideoId)
        ),
        (item: any) => (isYT ? toYouTubeSong(item, "YouTube") : toSaavnSong(item, "Unknown"))
      );

      // Validate the id-branch payload the same way the search branch does.
      // Returning only entries that pass keeps one bad track from failing an
      // entire album.
      const validSongs = mappedSongs.filter((s) => SongSchema.safeParse(s).success);
      return Response.json(validSongs, { headers: corsHeaders });
    }
    // Remote Logic
    if (!query) {
      return Response.json([], { headers: corsHeaders });
    }

    const rawCountry = searchParams.get("country") || "IN";
    const country = (VALID_COUNTRIES as readonly string[]).includes(rawCountry) ? rawCountry : "IN";
    
    // Parallel fetch from both sources
    const saavnUrl = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=15`;
    
    let ytUrl = "";
    if (query === "trending") {
      ytUrl = `https://ytapi.gauravramyadav.workers.dev/api/trending?country=${country}`;
    } else if (query === "charts") {
      ytUrl = `https://ytapi.gauravramyadav.workers.dev/api/trending?country=${country}`;
    } else {
      ytUrl = `https://ytapi.gauravramyadav.workers.dev/api/search?q=${encodeURIComponent(query)}&filter=songs`;
    }

    const [saavnRes, ytRes] = await Promise.all([
      fetchWithTimeout(saavnUrl).then(res => res.json()).catch(() => ({ success: false })),
      fetchWithTimeout(ytUrl).then(res => res.json()).catch(() => [])
    ]);

    // Robust Saavn Parsing
    const saavnRaw = saavnRes.data?.results || saavnRes.data || (Array.isArray(saavnRes) ? saavnRes : []);
    const saavnSongs = mapSongs(saavnRaw, (item: any, index) =>
      toSaavnSong(item, GENRES[index % GENRES.length])
    );

    // Robust YouTube Parsing — with HD thumbnail upgrade
    const ytRaw = Array.isArray(ytRes)
      ? ytRes
      : (ytRes?.tracks || ytRes?.results || ytRes?.data || ytRes?.songs || []);
    const ytSongs = mapSongs(ytRaw, (item: any) => toYouTubeSong(item, "YouTube"));

    // Interleave and filter invalid entries
    const interleaved = [];
    const maxLen = Math.max(saavnSongs.length, ytSongs.length);
    for (let i = 0; i < maxLen; i++) {
      if (saavnSongs[i]) interleaved.push(saavnSongs[i]);
      if (ytSongs[i]) interleaved.push(ytSongs[i]);
    }

    const cleanSongs = interleaved.filter(s => s && s.id && s.url);
    const result = z.array(SongSchema).safeParse(cleanSongs);
    
    if (!result.success) {
      console.error("Zod Validation Failed:", result.error.format());
      // Return the items that individually pass validation. These headers must
      // match the success path: dropping CORS headers here made a partially
      // valid album look like a network failure to cross-origin callers.
      const validSongs = cleanSongs.filter(s => SongSchema.safeParse(s).success);
      return Response.json(validSongs, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          ...corsHeaders,
        },
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
    console.error("Error fetching songs:", error);
    return Response.json([], { status: 500, headers: corsHeaders });
  }
}
