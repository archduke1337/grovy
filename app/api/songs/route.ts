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
    if (source === "local" && !query) {
      // 1. Try Vercel Blob Storage first
      try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
           console.warn("BLOB_READ_WRITE_TOKEN is missing in .env");
           // throw new Error("Missing Blob Token"); // Optional: throw to catch below if you want stricter flow
        }

        // List files specifically in the 'songs/' folder as seen in your screenshot
        const { blobs } = await list({ prefix: 'songs/', limit: 50 });
        
        console.log(`Found ${blobs.length} blobs in songs/`); // Debug log

        const audioBlobs = blobs.filter(blob => 
          blob.pathname.endsWith('.mp3') || 
          blob.pathname.endsWith('.wav') ||
          blob.pathname.endsWith('.m4a') ||
          blob.pathname.endsWith('.ogg')
        );

        if (audioBlobs.length > 0) {
          const songs = audioBlobs.map((blob, index) => ({
            id: blob.url,
            title: blob.pathname.split('/').pop()?.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Unknown Title",
            url: blob.url,
            artist: "My Cloud Library",
            cover: undefined, 
            genre: "Personal",
            duration: 0
          }));
          return Response.json(songs);
        }
      } catch (error) {
        console.warn("Vercel Blob list failed (CHECK YOUR .env FILE for BLOB_READ_WRITE_TOKEN):", error);
        // Continue to filesystem fallback
      }

      // 2. Fallback to Local Filesystem (public/songs)
      try {
        const fs = require('fs');
        const path = require('path');
        const songsDir = path.join(process.cwd(), 'public', 'songs');

        if (!fs.existsSync(songsDir)) {
          return Response.json([]);
        }

        const files = fs.readdirSync(songsDir);
        const localSongs = files
          .filter((file: string) => file.toLowerCase().endsWith('.mp3'))
          .map((file: string, index: number) => {
             const title = file.replace(/\.mp3$/i, "").replace(/[-_]/g, " ");
             return {
               id: `local-${index}`,
               title: title,
               url: `/songs/${file}`,
               artist: "Local Track",
               cover: undefined, // Or a default local icon
               genre: "Local",
               duration: 0
             };
          });

        return Response.json(localSongs);
      } catch (e) {
        console.error("Local file read error:", e);
        return Response.json([]);
      }
    }

    // Remote Logic
    // Fallback to "Latest Indian Hits" if no query or "trending" is requested
    const effectiveQuery = (!query || query === "trending") ? "Latest Indian Hits" : query;
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
