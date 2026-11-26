import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const SAAVN_ALLOWED_HOSTS = ["saavncdn.com", "jiosaavn.com"];

function parseSaavnUrl(rawUrl: string): URL | null {
  const candidates = [rawUrl];
  try {
    candidates.push(decodeURIComponent(rawUrl));
  } catch {
    // Ignore malformed encoded values; raw string may still be a valid URL.
  }

  for (const candidate of candidates) {
    try {
      return new URL(candidate);
    } catch {
      // Try next candidate.
    }
  }

  return null;
}

function isAllowedSaavnUrl(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  return SAAVN_ALLOWED_HOSTS.some((allowedHost) => {
    return host === allowedHost || host.endsWith(`.${allowedHost}`);
  });
}

/**
 * CORS headers for the stream route.
 *
 * The player is same-origin, so the only reason to send any
 * `Access-Control-Allow-Origin` at all is that the audio element is created
 * with `crossOrigin`, which makes it a CORS request. Echoing the calling
 * origin keeps that working without advertising the route as a public CDN to
 * every other site on the internet.
 */
function streamCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Content-Type",
    Vary: "Origin",
  };
}

/**
 * Error response for the stream route.
 *
 * Errors are never cacheable. Without an explicit `no-store` a rejection can be
 * held by a browser or edge cache and replayed for a request that would now
 * succeed — e.g. a bad `id` before a retry with a good one.
 */
function streamError(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: streamCorsHeaders(request) });
}

/** A YouTube video id is exactly 11 URL-safe base64 characters. */
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const saavnUrl = request.nextUrl.searchParams.get("saavnUrl");
  const quality = request.nextUrl.searchParams.get("quality") || "high";
  
  if (!id && !saavnUrl) {
    return streamError("Missing id or saavnUrl", 400);
  }

  // Reject anything that is not a well-formed video id before doing any
  // upstream work. Without this the route relays whatever id it is handed,
  // which makes it usable as a generic proxy rather than a player endpoint.
  if (id && !YOUTUBE_ID_PATTERN.test(id)) {
    return streamError("Invalid video id", 400);
  }

  // Only same-origin callers need this route. Browsers always send
  // Sec-Fetch-Site on cross-origin requests; direct navigations send
  // "none". Anything else is an embedded third party using us as a CDN.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return streamError("Cross-origin streaming is not allowed", 403);
  }

  // ═══ HANDLE SAAVN DIRECT DOWNLOAD ═══
  if (saavnUrl) {
    try {
      const parsedSaavnUrl = parseSaavnUrl(saavnUrl);
      if (!parsedSaavnUrl || !isAllowedSaavnUrl(parsedSaavnUrl)) {
        return streamError("Invalid saavnUrl host", 400);
      }

      parsedSaavnUrl.username = "";
      parsedSaavnUrl.password = "";
      parsedSaavnUrl.hash = "";
      const targetSaavnUrl = parsedSaavnUrl.toString();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch(targetSaavnUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://www.jiosaavn.com/",
          "Range": request.headers.get("Range") || "bytes=0-",
        },
      });
      clearTimeout(timeout);

      if (!res.ok && res.status !== 206) {
        console.error(`[StreamAPI] Saavn fetch failed: ${res.status}`);
        return streamError(`Saavn return ${res.status}`, 502);
      }

      const contentType = res.headers.get("Content-Type") || "audio/mpeg";
      const responseHeaders: Record<string, string> = {
        "Content-Type": contentType,
        ...streamCorsHeaders(request),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      };

      const contentLength = res.headers.get("Content-Length");
      const contentRange = res.headers.get("Content-Range");
      if (contentLength) responseHeaders["Content-Length"] = contentLength;
      if (contentRange) responseHeaders["Content-Range"] = contentRange;

      console.debug(`[StreamAPI] Saavn: ${contentType}, length: ${contentLength}`);
      return new Response(res.body, {
        status: res.status,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("[StreamAPI] Saavn proxy error:", error);
      return streamError("Saavn streaming failed", 502);
    }
  }

  // ═══ HANDLE YOUTUBE VIDEO ═══
  if (!id) {
    return streamError("Missing id", 400);
  }

  try {
    const controller = new AbortController();
    const metaTimeout = setTimeout(() => controller.abort(), 8000);
    const metaRes = await fetch(`https://ytapi.gauravramyadav.workers.dev/api/stream?id=${encodeURIComponent(id)}`, { signal: controller.signal });
    clearTimeout(metaTimeout);
    if (!metaRes.ok) return streamError("Meta API Down", 502);

    const data = await metaRes.json();
    const sources = data.streamingUrls || data.streams || (data.url ? [data] : []);
    
    // Normalize all stream candidates — keep BOTH proxy URL and directUrl.
    // directUrl (googlevideo CDN) is IP-locked to the Invidious instance that generated it,
    // so it will 403 when fetched from a different server (Vercel/local dev).
    // The proxy URL (e.g. yt.omada.cafe/latest_version?id=...&itag=...) routes through
    // the Invidious instance itself and works from any IP.
    const allStreams = (Array.isArray(sources) ? sources : [sources]).map(s => ({
      proxyUrl: s.url || (typeof s === 'string' ? s : ""),
      directUrl: s.directUrl || "",
      mimeType: s.mimeType || s.type || "",
      bitrate: Number(s.bitrate || s.audioBitrate || 0),
      quality: s.quality || s.audioQuality || "",
    })).filter(s => s.proxyUrl || s.directUrl);

    console.debug(`[StreamAPI] ${id}: ${allStreams.length} total streams, types: ${[...new Set(allStreams.map(s => s.mimeType))].join(', ')}`);

    // Prefer highest quality audio streams
    const audioStreams = allStreams
      .filter(s => {
        // Exclude video-only streams (they have video mimeType but no audio)
        if (s.mimeType.startsWith("video/") && !s.mimeType.includes("audio")) return false;
        return (
          s.mimeType.startsWith("audio/") ||
          s.proxyUrl.includes("latest_version") ||
          // Only include googlevideo URLs that don't have video-only itags
          (s.directUrl.includes("googlevideo") && !s.mimeType.startsWith("video/")) ||
          s.proxyUrl.startsWith("/")
        );
      })
      .sort((a, b) => {
        // Prefer opus/webm for better quality at same bitrate
        const aIsOpus = a.mimeType.includes("webm") || a.mimeType.includes("opus") ? 1 : 0;
        const bIsOpus = b.mimeType.includes("webm") || b.mimeType.includes("opus") ? 1 : 0;
        if (aIsOpus !== bIsOpus) return bIsOpus - aIsOpus;
        return (b.bitrate || 0) - (a.bitrate || 0);
      });

    // Select quality tier
    let selectedStreams = audioStreams;
    if (quality === "low") {
      selectedStreams = [...audioStreams].reverse();
    } else if (quality === "medium") {
      const mid = Math.floor(audioStreams.length / 2);
      selectedStreams = audioStreams.slice(mid);
    }
    
    const resolveUrl = (u: string) => u.startsWith('/') ? `https://ytapi.gauravramyadav.workers.dev${u}` : u;
    const isValidStreamUrl = (u: string) => !!u && (
      u.includes('googlevideo') ||
      u.includes('videoplayback') ||
      u.includes('latest_version') ||
      u.startsWith('/') ||
      u.startsWith('http')
    );

    // Build candidate list: proxy URLs first (they work from any IP), then direct URLs as fallback
    const candidates: string[] = [];
    const streamsToUse = selectedStreams.length > 0 ? selectedStreams : allStreams;
    for (const s of streamsToUse) {
      if (s.proxyUrl && isValidStreamUrl(s.proxyUrl)) candidates.push(resolveUrl(s.proxyUrl));
    }
    for (const s of streamsToUse) {
      if (s.directUrl && isValidStreamUrl(s.directUrl)) candidates.push(resolveUrl(s.directUrl));
    }

    if (candidates.length === 0) return streamError("No streams", 404);

    const rangeHeader = request.headers.get("Range") || "bytes=0-";

    // Attempt the top 5 candidates (proxy URLs tried first, then direct)
    for (const targetUrl of candidates.slice(0, 5)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const relayRes = await fetch(targetUrl, { 
           headers: { 
             "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
             "Range": rangeHeader,
             "Referer": "https://www.youtube.com/",
           },
           signal: controller.signal
        });
        clearTimeout(timeoutId);

        const contentType = relayRes.headers.get("Content-Type") || "";
        if ((relayRes.ok || relayRes.status === 206) && (contentType.includes("audio") || contentType.includes("video") || contentType.includes("octet-stream"))) {
          console.debug(`[StreamAPI] Relaying ${id} (${contentType}, bitrate: best available)`);
          
          const responseHeaders: Record<string, string> = {
               "Content-Type": contentType.includes("audio") ? contentType : "audio/webm",
               ...streamCorsHeaders(request),
               "Accept-Ranges": "bytes",
               "Cache-Control": "public, max-age=3600"
          };
          const contentRange = relayRes.headers.get("Content-Range");
          const contentLength = relayRes.headers.get("Content-Length");
          if (contentRange) responseHeaders["Content-Range"] = contentRange;
          if (contentLength) responseHeaders["Content-Length"] = contentLength;

          return new Response(relayRes.body, {
             status: relayRes.status,
             headers: responseHeaders
          });
        }
        console.warn(`[StreamAPI] Candidate failed: status=${relayRes.status}, type=${contentType}`);
      } catch (e) {
        continue;
      }
    }

    // FINAL RESCUE: Proxy through ytapi instead of redirect (avoids CORS issues)
    const lastResort = `https://ytapi.gauravramyadav.workers.dev/api/proxy?url=${encodeURIComponent(candidates[0])}`;
    console.debug(`[StreamAPI] Falling back to remote proxy fetch for ${id}`);
    try {
      const proxyController = new AbortController();
      const proxyTimeout = setTimeout(() => proxyController.abort(), 10000);
      const proxyRes = await fetch(lastResort, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Range": rangeHeader,
          "Referer": "https://www.youtube.com/",
        },
        signal: proxyController.signal,
      });
      clearTimeout(proxyTimeout);
      if (proxyRes.ok || proxyRes.status === 206) {
        const proxyHeaders: Record<string, string> = {
          "Content-Type": proxyRes.headers.get("Content-Type") || "audio/webm",
          ...streamCorsHeaders(request),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        };
        const cr = proxyRes.headers.get("Content-Range");
        const cl = proxyRes.headers.get("Content-Length");
        if (cr) proxyHeaders["Content-Range"] = cr;
        if (cl) proxyHeaders["Content-Length"] = cl;
        return new Response(proxyRes.body, { status: proxyRes.status, headers: proxyHeaders });
      }
    } catch { /* proxy fallback also failed */ }
    return streamError("Playback unavailable", 500);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[StreamAPI] Critical Error:`, message);
    return streamError("Playback unavailable", 500);
  }
}
