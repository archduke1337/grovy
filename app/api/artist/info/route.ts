
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artist = searchParams.get("artist");

  if (!artist) {
    return Response.json({ error: "Missing artist name" }, { status: 400 });
  }

  try {
    const url = `https://ytapi.gauravramyadav.workers.dev/api/artist/info?artist=${encodeURIComponent(artist)}`;
    const res = await fetch(url);
    if (!res.ok) {
      return Response.json({ error: "Upstream artist info API error" }, { status: res.status });
    }
    const data = await res.json();
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" }
    });
  } catch (error) {
    console.error("Artist Info API Error:", error);
    return Response.json({ error: "Failed to fetch artist info" }, { status: 500 });
  }
}
