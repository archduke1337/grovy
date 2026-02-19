import { list } from "@vercel/blob";
import { z } from "zod";
import { SongSchema } from "@/app/types/song";
import { NextRequest } from "next/server";
import { getHDThumbnail, getBestThumbnail } from "@/app/lib/thumbnail";

// Helper: fetch with timeout to prevent hanging on slow external APIs
function fetchWithTimeout(url: string, timeout = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

const GENRES = [
  "Bollywood",
  "Punjabi Pop",
  "Indipop",
  "Indian Hip-Hop",
  "Sufi / Ghazal",
  "Classical (Hindustani/Carnatic)",
  "Devotional",
  "Regional Folk (Rajasthani/Baul)",
  "Electronic / EDM",
  "Fusion",
  "Indie / Alternative",
  "Tollywood / Regional Film"
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get("source");
  const query = searchParams.get("query");
  const type = searchParams.get("type"); // 'album', 'playlist', 'artist'
  const id = searchParams.get("id");

  try {
    // 1. Fetch by ID (Album/Playlist/Artist details)
    if (id && type && ["album", "playlist", "artist"].includes(type)) {
      const isYT = id.startsWith("yt-");
      const realId = isYT ? id.replace("yt-", "") : id;

      let endpoint = "";
      if (isYT) {
        if (type === "album") endpoint = `https://ytapi.gauravramyadav.workers.dev/api/albums/${realId}`;
        if (type === "playlist") endpoint = `https://ytapi.gauravramyadav.workers.dev/api/playlists/${realId}`;
        if (type === "artist") endpoint = `https://ytapi.gauravramyadav.workers.dev/api/artists/${realId}`;
      } else {
        if (type === "album") endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/albums?id=${id}`;
        if (type === "playlist") endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/playlists?id=${id}`;
        if (type === "artist") endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/artists?id=${id}&song_count=20`; 
      }

      const response = await fetchWithTimeout(endpoint);
      if (!response.ok) {
        return Response.json([], { status: 200 });
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

      const rawSongs = songsList.filter((item: any) => item && (item.videoId || item.id)).map((item: any) => {
          if (isYT) {
             return {
                id: `yt-${item.videoId}`,
                title: item.title,
                url: `/api/stream?id=${item.videoId}`,
                artist: item.artists?.[0]?.name || "YT Artist",
                cover: getBestThumbnail(item.thumbnails) || getHDThumbnail(item.thumbnails?.[0]?.url),
                genre: "YouTube",
                duration: item.duration || 0,
                source: "YouTube",
             };
          }

          const cover = item.image?.[item.image.length - 1]?.url;
          const downloadUrl = item.downloadUrl?.[item.downloadUrl.length - 1]?.url;
          const artist = item.artists?.primary?.map((a: any) => a.name).join(", ") || 
                        item.artist || "Unknown Artist";
          
          return {
            id: `saavn-${item.id}`,
            title: item.name || item.title,
            url: downloadUrl,
            artist: artist,
            cover: cover,
            genre: "Unknown", 
            duration: item.duration,
          };
      });

      return Response.json(rawSongs);
    }
    if (source === "local") {
      const fs = require('fs');
      const path = require('path');
      let localSongs: any[] = [];

      // 1. Try Local Manifest (Production-safe, works with LFS/Git)
      try {
        const manifestPath = path.join(process.cwd(), 'public', 'songs.json');
        if (fs.existsSync(manifestPath)) {
          console.log("Reading local songs from manifest...");
          const content = fs.readFileSync(manifestPath, 'utf-8');
          localSongs = JSON.parse(content);
        }
      } catch (e) {
        console.warn("Manifest read failed (skipping):", e);
      }

      // 2. Try Vercel Blob Storage if manifest empty or not found
      if (localSongs.length === 0) {
        try {
          if (process.env.BLOB_READ_WRITE_TOKEN) {
            const { blobs } = await list({ prefix: 'songs/', limit: 200 });
            const audioBlobs = blobs.filter(blob => 
              /\.(mp3|wav|m4a|ogg)$/i.test(blob.pathname)
            );

            if (audioBlobs.length > 0) {
              localSongs = audioBlobs.map((blob, index) => ({
                id: blob.url,
                title: blob.pathname.split('/').pop()?.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Unknown Title",
                url: blob.url,
                artist: "My Cloud Library",
                cover: undefined, 
                genre: "Personal",
                duration: 0
              }));
            }
          }
        } catch (error) {
          console.warn("Vercel Blob list failed:", error);
        }
      }

      // 3. Last Resort: Direct FS
      if (localSongs.length === 0) {
        try {
          const songsDir = path.join(process.cwd(), 'public', 'songs');
          if (fs.existsSync(songsDir)) {
            const files = fs.readdirSync(songsDir);
            localSongs = files
              .filter((file: string) => /\.(mp3|wav|ogg|m4a)$/i.test(file))
              .map((file: string, index: number) => ({
                 id: `local-${index}`,
                 title: file.replace(/\.(mp3|wav|ogg|m4a)$/i, "").replace(/[-_]/g, " "),
                 url: `/songs/${file}`,
                 artist: "Local Track",
                 cover: undefined,
                 genre: "Local",
                 duration: 0
              }));
          }
        } catch (e) {
          console.error("Local file read error:", e);
        }
      }

      // Filter by query if provided
      if (query && query.toLowerCase() !== "trending") {
        const q = query.toLowerCase();
        localSongs = localSongs.filter(s => 
          s.title.toLowerCase().includes(q) || 
          s.artist.toLowerCase().includes(q)
        );
      }

      return Response.json(localSongs);
    }

    // Remote Logic
    if (!query) {
      return Response.json([]);
    }

    const VALID_COUNTRIES = ["IN", "US", "GB", "KR", "JP", "BR", "DE", "FR", "CA", "AU"];
    const rawCountry = searchParams.get("country") || "IN";
    const country = VALID_COUNTRIES.includes(rawCountry) ? rawCountry : "IN";
    
    // Parallel fetch from both sources
    const saavnUrl = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=15`;
    
    let ytUrl = "";
    if (query === "trending") {
      ytUrl = `https://ytapi.gauravramyadav.workers.dev/api/trending?region=${country}`;
    } else if (query === "charts") {
      ytUrl = `https://ytapi.gauravramyadav.workers.dev/api/charts?region=${country}`;
    } else {
      ytUrl = `https://ytapi.gauravramyadav.workers.dev/api/search?q=${encodeURIComponent(query)}`;
    }

    const [saavnRes, ytRes] = await Promise.all([
      fetchWithTimeout(saavnUrl).then(res => res.json()).catch(() => ({ success: false })),
      fetchWithTimeout(ytUrl).then(res => res.json()).catch(() => [])
    ]);

    // Robust Saavn Parsing
    const saavnRaw = saavnRes.data?.results || saavnRes.data || (Array.isArray(saavnRes) ? saavnRes : []);
    const saavnSongs = saavnRaw.map((item: any, index: number) => {
      const cover = item.image?.[item.image.length - 1]?.url || (Array.isArray(item.image) ? item.image[0]?.url : item.image);
      const downloadUrl = item.downloadUrl?.[item.downloadUrl.length - 1]?.url || (Array.isArray(item.downloadUrl) ? item.downloadUrl[0]?.url : item.downloadUrl);
      const artist = item.artists?.primary?.map((a: any) => a.name).join(", ") || 
                     item.artist || "Unknown Artist";
      
      return {
        id: `saavn-${item.id}`,
        title: item.name || item.title,
        url: downloadUrl,
        artist: artist,
        cover: cover,
        genre: GENRES[index % GENRES.length],
        duration: item.duration,
        source: "Saavn"
      };
    });

    // Robust YouTube Parsing — with HD thumbnail upgrade
    const ytRaw = Array.isArray(ytRes) ? ytRes : (ytRes?.results || ytRes?.data || ytRes?.songs || []);
    const ytSongs = ytRaw.map((item: any) => {
      const id = item.videoId || item.id;
      if (!id) return null;

      // Get HD thumbnail — upgrade from 60x60 to 544x544
      const cover = getBestThumbnail(item.thumbnails) || getHDThumbnail(item.thumbnails?.[0]?.url) || item.image;

      return {
        id: `yt-${id}`,
        title: item.title || item.name,
        url: `/api/stream?id=${id}`, 
        artist: item.artists?.[0]?.name || item.artist || "YouTube Artist",
        cover,
        genre: "YouTube",
        duration: item.duration ?? (item.duration_ms != null ? item.duration_ms / 1000 : 180),
        source: "YouTube"
      };
    }).filter(Boolean);

    // Interleave and filter invalid entries
    const rawSongs = [];
    const maxLen = Math.max(saavnSongs.length, ytSongs.length);
    for (let i = 0; i < maxLen; i++) {
      if (saavnSongs[i]) rawSongs.push(saavnSongs[i]);
      if (ytSongs[i]) rawSongs.push(ytSongs[i]);
    }

    const cleanSongs = rawSongs.filter(s => s && s.id && s.url);
    const result = z.array(SongSchema).safeParse(cleanSongs);
    
    if (!result.success) {
      console.error("Zod Validation Failed:", result.error.format());
      // Return only the items that individually pass validation
      const validSongs = cleanSongs.filter(s => SongSchema.safeParse(s).success);
      return Response.json(validSongs);
    }

    return Response.json(result.data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" }
    });
  } catch (error) {
    console.error("Error fetching songs:", error);
    return Response.json([], { status: 200 });
  }
}
