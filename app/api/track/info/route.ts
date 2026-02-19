
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");

  if (!title || !artist) {
    return Response.json({ error: "Missing title or artist" }, { status: 400 });
  }

  try {
    const url = `https://ytapi.gauravramyadav.workers.dev/api/track/info?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
    const res = await fetch(url);
    if (!res.ok) {
      return Response.json({ error: "Upstream track info API error" }, { status: res.status });
    }
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("Track Info API Error:", error);
    return Response.json({ error: "Failed to fetch track info" }, { status: 500 });
  }
}
