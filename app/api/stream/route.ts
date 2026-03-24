import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// CORS preflight handler
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const saavnUrl = request.nextUrl.searchParams.get("saavnUrl");
  const quality = request.nextUrl.searchParams.get("quality") || "high";
  
  if (!id && !saavnUrl) {
    return Response.json({ error: "Missing id or saavnUrl" }, { status: 400 });
  }

  // ═══ HANDLE SAAVN DIRECT DOWNLOAD ═══
  if (saavnUrl) {
    try {
      const decodedUrl = decodeURIComponent(saavnUrl);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch(decodedUrl, {
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
        return Response.json({ error: `Saavn return ${res.status}` }, { status: 502 });
      }

      const contentType = res.headers.get("Content-Type") || "audio/mpeg";
      const responseHeaders: Record<string, string> = {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Range, Content-Type",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      };

      const contentLength = res.headers.get("Content-Length");
      const contentRange = res.headers.get("Content-Range");
      if (contentLength) responseHeaders["Content-Length"] = contentLength;
      if (contentRange) responseHeaders["Content-Range"] = contentRange;

      console.log(`[StreamAPI] Saavn: ${contentType}, length: ${contentLength}`);
      return new Response(res.body, {
        status: res.status,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("[StreamAPI] Saavn proxy error:", error);
      return Response.json({ error: "Saavn streaming failed" }, { status: 502 });
    }
  }

  // ═══ HANDLE YOUTUBE VIDEO ═══
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const metaTimeout = setTimeout(() => controller.abort(), 8000);
    const metaRes = await fetch(`https://ytapi.gauravramyadav.workers.dev/api/stream?id=${id}`, { signal: controller.signal });
    clearTimeout(metaTimeout);
    if (!metaRes.ok) return Response.json({ error: "Meta API Down" }, { status: 502 });

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

    console.log(`[StreamAPI] ${id}: ${allStreams.length} total streams, types: ${[...new Set(allStreams.map(s => s.mimeType))].join(', ')}`);

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

    if (candidates.length === 0) return Response.json({ error: "No streams" }, { status: 404 });

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
          console.log(`[StreamAPI] Relaying ${id} (${contentType}, bitrate: best available)`);
          
          const responseHeaders: Record<string, string> = {
               "Content-Type": contentType.includes("audio") ? contentType : "audio/webm",
               "Access-Control-Allow-Origin": "*",
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
    console.log(`[StreamAPI] Falling back to remote proxy fetch for ${id}`);
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
          "Access-Control-Allow-Origin": "*",
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
    return Response.json({ error: "Playback unavailable" }, { status: 500 });

  } catch (error: any) {
    console.error(`[StreamAPI] Critical Error:`, error.message);
    return Response.json({ error: "Playback unavailable" }, { status: 500 });
  }
}
