
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return Response.json([]);
  }

  try {
    const url = `https://ytapi.gauravramyadav.workers.dev/api/search/suggestions?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("Suggestions API Error:", error);
    return Response.json([]);
  }
}
