
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");

  if (!title || !artist) {
    return Response.json({ error: "Missing title or artist" }, { status: 400 });
  }

  try {
    const url = `https://ytapi.gauravramyadav.workers.dev/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
    const res = await fetch(url);
    if (!res.ok) {
      return Response.json({ error: "Upstream lyrics API error" }, { status: res.status });
    }
    const data = await res.json();
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" }
    });
  } catch (error) {
    console.error("Lyrics API Error:", error);
    return Response.json({ error: "Failed to fetch lyrics" }, { status: 500 });
  }
}
