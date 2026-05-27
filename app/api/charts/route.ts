import { NextRequest } from "next/server";
import { fetchWithTimeout, pickArtist, pickCover, pickSaavnDownloadUrl, parseDuration, VALID_COUNTRIES } from "@/app/lib/apiHelpers";

const VALID_COUNTRIES_SET = new Set(VALID_COUNTRIES);

function resolveCountry(request: NextRequest): string {
  const queryCountry = (request.nextUrl.searchParams.get("country") || "").toUpperCase();
  if (VALID_COUNTRIES_SET.has(queryCountry as any)) return queryCountry;

  const edgeCountry = (request.headers.get("x-vercel-ip-country") || "").toUpperCase();
  if (VALID_COUNTRIES_SET.has(edgeCountry as any)) return edgeCountry;

  const acceptLanguage = request.headers.get("accept-language") || "";
  const langMatch = acceptLanguage.match(/-([A-Za-z]{2})(?:,|;|$)/);
  const langCountry = (langMatch?.[1] || "").toUpperCase();
  if (VALID_COUNTRIES_SET.has(langCountry as any)) return langCountry;

  return "IN";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return Response.json(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chartId = searchParams.get("id") || "songs"; // songs, albums, artists, playlists
  const country = resolveCountry(request);

  try {
    let saavnEndpoint = "";
    let ytEndpoint = "";

    const saavnQueryByType: Record<string, string> = {
      songs: "top songs",
      albums: "top albums",
      artists: "top artists",
      playlists: "top playlists",
    };

    // Use documented/search-based Saavn endpoints and YT endpoints that return stable shapes.
    switch (chartId) {
      case "songs":
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encodeURIComponent(saavnQueryByType.songs)}&limit=30`;
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/top/tracks?country=${country}`;
        break;
      case "albums":
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/albums?query=${encodeURIComponent(saavnQueryByType.albums)}&limit=20`;
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/search?q=popular+albums&filter=albums&limit=20`;
        break;
      case "artists":
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/artists?query=${encodeURIComponent(saavnQueryByType.artists)}&limit=20`;
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/top/artists?country=${country}`;
        break;
      case "playlists":
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/playlists?query=${encodeURIComponent(saavnQueryByType.playlists)}&limit=20`;
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/search?q=popular+playlists&filter=playlists&limit=20`;
        break;
      default:
        saavnEndpoint = `https://jiosaavn-api.gauravramyadav.workers.dev/api/search/songs?query=${encodeURIComponent(saavnQueryByType.songs)}&limit=30`;
        ytEndpoint = `https://ytapi.gauravramyadav.workers.dev/api/top/tracks?country=${country}`;
    }

    // Fetch from both sources in parallel
    const [saavnRes, ytRes] = await Promise.all([
      fetchWithTimeout(saavnEndpoint).then(res => res.json()).catch(() => ({ success: false })),
      fetchWithTimeout(ytEndpoint).then(res => res.json()).catch(() => [])
    ]);

    const saavnRaw = saavnRes.success && Array.isArray(saavnRes.data?.results)
      ? saavnRes.data.results
      : [];

    const saavnCharts = saavnRaw.map((item: any, index: number) => {
      const id = item?.id;
      if (!id) return null;

      if (chartId === "songs") {
        const downloadUrl = pickSaavnDownloadUrl(item);
        if (!downloadUrl) return null;

        return {
          id: `saavn-${id}`,
          title: item.name || item.title || "Untitled",
          artist: pickArtist(item),
          cover: pickCover(item),
          duration: Number(item.duration) || 0,
          url: `/api/stream?saavnUrl=${encodeURIComponent(downloadUrl)}`,
          source: "Saavn",
          position: index + 1,
          rank: index + 1,
        };
      }

      return {
        id: `saavn-${id}`,
        title: item.name || item.title || "Untitled",
        artist: pickArtist(item),
        cover: pickCover(item),
        duration: Number(item.duration) || 0,
        url: item.url || "",
        source: "Saavn",
        position: index + 1,
        rank: index + 1,
      };
    }).filter(Boolean);

    const ytData = chartId === "songs"
      ? (Array.isArray(ytRes) ? ytRes : (ytRes?.tracks || ytRes?.results || ytRes?.data || []))
      : chartId === "artists"
      ? (Array.isArray(ytRes) ? ytRes : (ytRes?.artists || ytRes?.results || ytRes?.data || []))
      : (Array.isArray(ytRes) ? (ytRes?.[0]?.items ? ytRes.flatMap((section: any) => section?.items || []) : ytRes) : (ytRes?.results || ytRes?.data || []));

    const ytCharts = (Array.isArray(ytData) ? ytData : [])
      .slice(0, chartId === "songs" ? 40 : 30)
      .map((item: any, index: number) => {
        const id = item?.videoId || item?.id || item?.fallbackVideoId || item?.browseId;
        if (!id) return null;

        const title = item?.title || item?.name || item?.fallbackTitle || "Untitled";
        const songLikeUrl = chartId === "songs"
          ? `/api/stream?id=${encodeURIComponent(id)}`
          : (item?.url || "");

        return {
          id: `yt-${id}`,
          title,
          artist: pickArtist(item),
          cover: pickCover(item),
          duration:
            Number(item?.duration_seconds) ||
            Number(item?.duration) ||
            parseDuration(item?.durationText || item?.duration) ||
            0,
          url: songLikeUrl,
          source: "YouTube",
          position: index + 1,
          rank: index + 1,
        };
      })
      .filter(Boolean);

    const combined: any[] = [];
    const seen = new Set<string>();

    // For songs, prioritize true chart feed first; use Saavn only as gap-filler fallback.
    if (chartId === "songs") {
      for (const song of ytCharts) {
        if (song && !seen.has(song.id)) {
          combined.push(song);
          seen.add(song.id);
        }
      }

      if (combined.length < 20) {
        for (const song of saavnCharts) {
          if (song && !seen.has(song.id)) {
            combined.push(song);
            seen.add(song.id);
          }
          if (combined.length >= 50) break;
        }
      }
    } else {
      const maxLen = Math.max(saavnCharts.length, ytCharts.length);
      for (let i = 0; i < maxLen; i++) {
        const ytItem = ytCharts[i];
        const saavnItem = saavnCharts[i];

        if (ytItem && !seen.has(ytItem.id)) {
          combined.push(ytItem);
          seen.add(ytItem.id);
        }
        if (saavnItem && !seen.has(saavnItem.id)) {
          combined.push(saavnItem);
          seen.add(saavnItem.id);
        }
      }
    }

    return Response.json(combined.slice(0, chartId === "songs" ? 50 : 30), {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });

  } catch (error) {
    console.error("Charts API Error:", error);
    return Response.json([], {
      status: 500,
      headers: {
        "Cache-Control": "public, s-maxage=60",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }
}

