
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return Response.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    const url = `https://ytapi.gauravramyadav.workers.dev/api/related/${videoId}`;
    const res = await fetch(url);
    const data = await res.json();
    
    const rawData = Array.isArray(data) ? data : (data.tracks || data.results || data.songs || []);
    const relatedSongs = rawData.map((item: any) => ({
        id: `yt-${item.videoId || item.id}`,
        title: item.title,
        url: `/api/stream?id=${item.videoId || item.id}`,
        artist: item.artists?.[0]?.name || item.author || "YouTube Artist",
        cover: item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnails?.[0]?.url || item.thumbnail,
        genre: "Related",
        duration: item.duration || 0,
        source: "YouTube"
    }));

    return Response.json(relatedSongs);
  } catch (error) {
    console.error("Related API Error:", error);
    return Response.json([], { status: 200 });
  }
}
