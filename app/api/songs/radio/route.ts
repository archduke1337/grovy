
import { NextRequest } from "next/server";
import { getHDThumbnail, getBestThumbnail } from "@/app/lib/thumbnail";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return Response.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    const url = `https://ytapi.gauravramyadav.workers.dev/api/radio?videoId=${videoId}`;
    const res = await fetch(url);
    const data = await res.json();
    
    const rawData = Array.isArray(data) ? data : (data.tracks || data.results || data.songs || []);
    const radioSongs = rawData.map((item: any) => ({
        id: `yt-${item.videoId || item.id}`,
        title: item.title,
        url: `/api/stream?id=${item.videoId || item.id}`,
        artist: item.artists?.[0]?.name || item.author || "YouTube Artist",
        cover: getBestThumbnail(item.thumbnails) || getHDThumbnail(item.thumbnails?.[0]?.url) || item.thumbnail,
        genre: "Radio",
        duration: item.duration || 0,
        source: "YouTube"
    }));

    return Response.json(radioSongs);
  } catch (error) {
    console.error("Radio API Error:", error);
    return Response.json([], { status: 200 });
  }
}
