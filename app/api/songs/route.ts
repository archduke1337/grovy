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
  
  try {
    if (source === "local" && !query) {
      // Fetch songs from Vercel Blob storage
      const { blobs } = await list({ prefix: 'songs/', limit: 50 });
      
      const rawSongs = blobs
        .filter(blob => blob.pathname.endsWith('.mp3'))
        .map((blob, index) => {
          // Extract title from pathname (e.g., "songs/My Song.mp3" -> "My Song")
          const fileName = blob.pathname.split('/').pop() || "";
          const title = fileName.replace(".mp3", "").replace(/[-_]/g, " ");
          
          return {
            id: `blob-${index}`,
            title: decodeURIComponent(title),
            url: blob.url,
            artist: "Grovy Collection",
            genre: GENRES[index % GENRES.length],
            duration: 0
          };
        });

      const result = z.array(SongSchema).safeParse(rawSongs);
      return Response.json(result.success ? result.data : []);
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
