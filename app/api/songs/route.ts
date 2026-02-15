import { readdirSync, existsSync } from "fs";
import { join } from "path";
import { z } from "zod";
import { SongSchema } from "@/app/types/song";
import { NextRequest } from "next/server";

const GENRES = ["Bollywood", "Punjabi", "Indipop", "Devotional"];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get("source");
  const query = searchParams.get("query");
  
  try {
    if (source === "local" && !query) {
      const songsDir = join(process.cwd(), "public", "songs");
      
      if (!existsSync(songsDir)) {
        return Response.json([]);
      }

      const files = readdirSync(songsDir).filter((file) =>
        file.toLowerCase().endsWith(".mp3")
      );

      const rawSongs = files.map((file, index) => {
        const title = file.replace(".mp3", "").replace(/[-_]/g, " ");
        
        return {
          id: `local-${index}`,
          title,
          url: `/songs/${file}`,
          artist: "Local Artist",
          genre: GENRES[index % GENRES.length],
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
