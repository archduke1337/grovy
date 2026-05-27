
import { NextRequest } from "next/server";
import { fetchWithTimeout as fetchWithTimeoutBase } from "@/app/lib/apiHelpers";

const fetchWithTimeout = (url: string, timeout = 5000) => fetchWithTimeoutBase(url, timeout);

function normalizeSuggestion(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function uniqueSuggestions(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = normalizeSuggestion(item);
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return Response.json([]);
  }

  try {
    const normalizedQuery = query.trim();
    const encoded = encodeURIComponent(normalizedQuery);

    const [ytSuggestResult, ytSearchResult, saavnSearchResult] = await Promise.allSettled([
      fetchWithTimeout(`https://ytapi.gauravramyadav.workers.dev/api/search/suggestions?q=${encoded}`).then((res) =>
        res.ok ? res.json() : null
      ),
      fetchWithTimeout(`https://ytapi.gauravramyadav.workers.dev/api/search?q=${encoded}&filter=songs`).then((res) =>
        res.ok ? res.json() : null
      ),
      fetchWithTimeout(`https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encoded}&limit=12`).then((res) =>
        res.ok ? res.json() : null
      ),
    ]);

    const ytSuggestData = ytSuggestResult.status === "fulfilled" ? ytSuggestResult.value : null;
    const ytSearchData = ytSearchResult.status === "fulfilled" ? ytSearchResult.value : null;
    const saavnData = saavnSearchResult.status === "fulfilled" ? saavnSearchResult.value : null;

    const ytRawSuggestions = Array.isArray(ytSuggestData)
      ? ytSuggestData
      : Array.isArray(ytSuggestData?.suggestions)
      ? ytSuggestData.suggestions
      : Array.isArray(ytSuggestData?.data?.suggestions)
      ? ytSuggestData.data.suggestions
      : [];

    const ytSuggestionTexts = ytRawSuggestions
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return String(item.text || item.query || item.title || "");
        }
        return "";
      })
      .filter(Boolean);

    const ytSearchItems = Array.isArray(ytSearchData)
      ? ytSearchData
      : Array.isArray(ytSearchData?.results)
      ? ytSearchData.results
      : Array.isArray(ytSearchData?.data)
      ? ytSearchData.data
      : Array.isArray(ytSearchData?.tracks)
      ? ytSearchData.tracks
      : [];

    const ytSongBasedSuggestions = ytSearchItems.flatMap((item: any) => {
      const title = normalizeSuggestion(String(item?.title || item?.name || item?.fallbackTitle || ""));
      const artist = normalizeSuggestion(
        String(item?.artist || item?.author || item?.channel?.name || item?.artists?.[0]?.name || "")
      );

      return [title, artist].filter(Boolean);
    });

    const saavnItems = Array.isArray(saavnData?.data?.results)
      ? saavnData.data.results
      : Array.isArray(saavnData?.data)
      ? saavnData.data
      : [];

    const saavnSongBasedSuggestions = saavnItems.flatMap((item: any) => {
      const title = normalizeSuggestion(String(item?.name || item?.title || ""));
      const artist = normalizeSuggestion(
        String(
          item?.artists?.primary?.map((artistObj: any) => artistObj?.name).filter(Boolean).join(", ") ||
            item?.artist ||
            ""
        )
      );

      return [title, artist].filter(Boolean);
    });

    const combined = uniqueSuggestions([
      normalizedQuery,
      ...ytSuggestionTexts,
      ...ytSongBasedSuggestions,
      ...saavnSongBasedSuggestions,
    ]);

    const lowerQuery = normalizedQuery.toLowerCase();
    const ranked = combined.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
      const bStarts = b.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.length - b.length;
    });

    const suggestions = ranked.slice(0, 24);

    return Response.json(suggestions, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" }
    });
  } catch (error) {
    console.error("Suggestions API Error:", error);
    return Response.json([]);
  }
}
