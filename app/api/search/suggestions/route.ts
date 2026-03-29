
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

    const rawSuggestions = Array.isArray(data)
      ? data
      : Array.isArray(data?.suggestions)
      ? data.suggestions
      : Array.isArray(data?.data?.suggestions)
      ? data.data.suggestions
      : [];

    const suggestions = rawSuggestions
      .map((item: any) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          return String(item.text || item.query || item.title || "").trim();
        }
        return "";
      })
      .filter(Boolean)
      .slice(0, 12);

    return Response.json(suggestions, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" }
    });
  } catch (error) {
    console.error("Suggestions API Error:", error);
    return Response.json([]);
  }
}
