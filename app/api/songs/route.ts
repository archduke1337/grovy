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

function pickArtist(item: any): string {
  const primaryArtists = item?.artists?.primary;
  if (Array.isArray(primaryArtists) && primaryArtists.length > 0) {
    const names = primaryArtists.map((a: any) => a?.name).filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }

  if (Array.isArray(item?.artists) && item.artists.length > 0) {
    const names = item.artists
      .map((a: any) => (typeof a === "string" ? a : a?.name || ""))
      .filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }

  if (typeof item?.artist === "string" && item.artist.trim()) return item.artist;
  if (typeof item?.author === "string" && item.author.trim()) return item.author;
  if (typeof item?.primaryArtists === "string" && item.primaryArtists.trim()) return item.primaryArtists;
  if (item?.channel?.name) return String(item.channel.name);
  return "Unknown Artist";
}

function pickCover(item: any): string | undefined {
  if (Array.isArray(item?.image) && item.image.length > 0) {
    return item.image[item.image.length - 1]?.url || item.image[0]?.url;
  }

  const bestThumb = getBestThumbnail(item?.thumbnails);
  if (bestThumb) return bestThumb;

  if (typeof item?.thumbnail === "string" && item.thumbnail) {
    return getHDThumbnail(item.thumbnail);
  }

  return getHDThumbnail(item?.thumbnails?.[0]?.url);
}

function pickSaavnDownloadUrl(item: any): string {
  const direct =
    item?.downloadUrl?.[item.downloadUrl.length - 1]?.url ||
    (Array.isArray(item?.downloadUrl) ? item.downloadUrl[0]?.url : item?.downloadUrl);
  return typeof direct === "string" ? direct : "";
}

function parseDuration(value: any): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;

  const chunks = value.split(":").map((part) => Number(part));
  if (chunks.some((part) => Number.isNaN(part))) return 0;
  if (chunks.length === 2) return chunks[0] * 60 + chunks[1];
  if (chunks.length === 3) return chunks[0] * 3600 + chunks[1] * 60 + chunks[2];
  return 0;
}

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

      const rawSongs = songsList.filter((item: any) => item && (item.videoId || item.id || item.fallbackVideoId)).map((item: any) => {
          if (isYT) {
           const vid = item.videoId || item.id || item.fallbackVideoId;
           if (!vid) return null;
             return {
                id: `yt-${vid}`,
             title: item.title || item.name || item.fallbackTitle || "Untitled",
                url: `/api/stream?id=${vid}`,
             artist: pickArtist(item),
             cover: pickCover(item),
                genre: "YouTube",
             duration: Number(item.duration) || parseDuration(item.durationText || item.duration) || 0,
                source: "YouTube",
             };
          }

         const cover = pickCover(item);
         const downloadUrl = pickSaavnDownloadUrl(item);
         const artist = pickArtist(item);
          
          // Proxy Saavn URLs through stream endpoint for CORS support
          const streamUrl = downloadUrl 
            ? `/api/stream?saavnUrl=${encodeURIComponent(downloadUrl)}`
            : "";
          
          return {
            id: `saavn-${item.id}`,
            title: item.name || item.title || "Untitled",
            url: streamUrl,
            artist: artist,
            cover: cover,
            genre: "Unknown", 
            duration: Number(item.duration) || 0,
            source: "Saavn",
          };
      }).filter((s: any) => s && s.url);

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
    const saavnSongs = saavnRaw.map((item: any, index: number) => {
      const cover = pickCover(item);
      const downloadUrl = pickSaavnDownloadUrl(item);
      const artist = pickArtist(item);
      
      // Create streaming URL that proxies through our endpoint for CORS support
      let streamUrl = "";
      if (downloadUrl) {
        // URL encode the download URL properly for query parameter
        streamUrl = `/api/stream?saavnUrl=${encodeURIComponent(downloadUrl)}`;
      }
      
      return {
        id: `saavn-${item.id}`,
        title: item.name || item.title || "Untitled",
        url: streamUrl,
        artist: artist,
        cover: cover,
        genre: GENRES[index % GENRES.length],
        duration: Number(item.duration) || 0,
        source: "Saavn"
      };
    }).filter((s: any) => s.url && s.id); // Filter out songs without URLs

    // Robust YouTube Parsing — with HD thumbnail upgrade
    const ytRaw = Array.isArray(ytRes)
      ? ytRes
      : (ytRes?.tracks || ytRes?.results || ytRes?.data || ytRes?.songs || []);
    const ytSongs = ytRaw.map((item: any) => {
      const id = item.videoId || item.id || item.fallbackVideoId;
      if (!id) return null;

      // Get HD thumbnail — upgrade from 60x60 to 544x544
      const cover = pickCover(item);

      return {
        id: `yt-${id}`,
        title: item.title || item.name || item.fallbackTitle || "Untitled",
        url: `/api/stream?id=${id}`, 
        artist: pickArtist(item),
        cover,
        genre: "YouTube",
        duration:
          Number(item.duration_seconds) ||
          Number(item.duration) ||
          (item.duration_ms != null ? Number(item.duration_ms) / 1000 : 0) ||
          parseDuration(item.durationText || item.duration) ||
          180,
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
    return Response.json([], { status: 500 });
  }
}
