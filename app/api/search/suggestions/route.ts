
import { NextRequest } from "next/server";

function fetchWithTimeout(url: string, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return Response.json([]);
  }

  try {
    const url = `https://ytapi.gauravramyadav.workers.dev/api/search/suggestions?q=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      return Response.json([]);
    }
    const data = await res.json();
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" }
    });
  } catch (error) {
    console.error("Suggestions API Error:", error);
    return Response.json([]);
  }
}
