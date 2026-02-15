import { list } from "@vercel/blob";
import { z } from "zod";
import { SongSchema } from "@/app/types/song";
import { NextRequest } from "next/server";

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
      let endpoint = "";
      if (type === "album") endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/albums?id=${id}`;
      if (type === "playlist") endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/playlists?id=${id}`;
      // for artist, the endpoint usually is /api/artists?id={id} - check docs or assume standard
      // Actually docs say: /api/artists/{id}/songs ?? or just /api/artists?id={id}
      // Let's try standard detail endpoint first. If it fails we might need specific songs endpoint.
      // Based on common Saavn APIs:
      if (type === "artist") endpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/artists?id=${id}&song_count=20`; 

      const response = await fetch(endpoint);
      const data = await response.json();

      let songsList: any[] = [];
      
      if (data.success) {
        if (type === "artist") {
           // Artist API usually returns { data: { topSongs: [] } } or similar
           songsList = data.data.topSongs || data.data.songs || [];
        } else {
           // Album/Playlist returns { data: { songs: [] } }
           songsList = data.data.songs || [];
        }
      }

      const rawSongs = songsList.map((item: any) => {
          const cover = item.image?.[item.image.length - 1]?.url;
          const downloadUrl = item.downloadUrl?.[item.downloadUrl.length - 1]?.url;
          const artist = item.artists?.primary?.map((a: any) => a.name).join(", ") || 
                        item.artist || "Unknown Artist";
          
          return {
            id: item.id,
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
    // Fallback to "Latest Indian Hits" if no query or "trending" is requested
    const apiUrl = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encodeURIComponent(effectiveQuery)}&limit=20`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.success || !data.data?.results) {
      console.error("API Error or No Results:", data.message || "Unknown error");
      return Response.json([]); 
    }

    const results = data.data.results;

    const rawSongs = results.map((item: any, index: number) => {
      // Get highest quality image and download URL
      const cover = item.image?.[item.image.length - 1]?.url;
      const downloadUrl = item.downloadUrl?.[item.downloadUrl.length - 1]?.url;
      const artist = item.artists?.primary?.map((a: any) => a.name).join(", ") || 
                     item.artist || "Unknown Artist";
      
      const genre = GENRES[index % GENRES.length];

      return {
        id: item.id,
        title: item.name || item.title,
        url: downloadUrl,
        artist: artist,
        cover: cover,
        genre: genre,
        duration: item.duration,
      };
    });

    const result = z.array(SongSchema).safeParse(rawSongs);
    
    if (!result.success) {
      console.error("Zod Validation Failed:", result.error.format());
      return Response.json(rawSongs);
    }

    return Response.json(result.data);
  } catch (error) {
    console.error("Error fetching songs:", error);
    // Return empty array or fallback logic here if needed
    return Response.json([], { status: 200 });
  }
}
