import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const quality = request.nextUrl.searchParams.get("quality") || "high"; // 'high', 'medium', 'low'
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  try {
    const controller = new AbortController();
    const metaTimeout = setTimeout(() => controller.abort(), 8000);
    const metaRes = await fetch(`https://ytapi.gauravramyadav.workers.dev/api/stream?id=${id}`, { signal: controller.signal });
    clearTimeout(metaTimeout);
    if (!metaRes.ok) return Response.json({ error: "Meta API Down" }, { status: 502 });

    const data = await metaRes.json();
    const sources = data.streamingUrls || data.streams || (data.url ? [data] : []);
    
    // Normalize all stream candidates — prefer directUrl (googlevideo CDN) over invidious proxy
    const allStreams = (Array.isArray(sources) ? sources : [sources]).map(s => ({
      url: s.directUrl || s.url || (typeof s === 'string' ? s : ""),
      mimeType: s.mimeType || s.type || "",
      bitrate: Number(s.bitrate || s.audioBitrate || 0),
      quality: s.quality || s.audioQuality || "",
    })).filter(s => s.url);

    // Prefer highest quality audio streams
    // Priority: audio/webm (opus) > audio/mp4 (aac) > audio/mpeg
    // Within each type, prefer highest bitrate
    const audioStreams = allStreams
      .filter(s => 
        s.mimeType.startsWith("audio/") || 
        s.url.includes("googlevideo") ||
        s.url.startsWith("/")
      )
      .sort((a, b) => {
        // Prefer opus/webm for better quality at same bitrate
        const aIsOpus = a.mimeType.includes("webm") || a.mimeType.includes("opus") ? 1 : 0;
        const bIsOpus = b.mimeType.includes("webm") || b.mimeType.includes("opus") ? 1 : 0;
        if (aIsOpus !== bIsOpus) return bIsOpus - aIsOpus;
        // Then sort by bitrate (highest first)
        return (b.bitrate || 0) - (a.bitrate || 0);
      });

    // Select quality tier
    let selectedStreams = audioStreams;
    if (quality === "low") {
      selectedStreams = audioStreams.reverse(); // Lowest bitrate first
    } else if (quality === "medium") {
      // Middle bitrate
      const mid = Math.floor(audioStreams.length / 2);
      selectedStreams = audioStreams.slice(mid);
    }
    
    // Build candidate URLs — accept googlevideo, invidious proxy, and path-based URLs
    const isValidStreamUrl = (u: string) => u && (
      u.includes('googlevideo') ||
      u.includes('videoplayback') ||
      u.includes('latest_version') ||
      u.startsWith('/') ||
      u.startsWith('http')
    );
    const candidates = selectedStreams
      .map(s => s.url)
      .filter(isValidStreamUrl)
      .map(u => u.startsWith('/') ? `https://ytapi.gauravramyadav.workers.dev/${u}` : u);

    // Fallback: if no audio-specific streams found, use all candidates
    if (candidates.length === 0) {
      const fallbackCandidates = allStreams
        .map(s => s.url)
        .filter(isValidStreamUrl)
        .map(u => u.startsWith('/') ? `https://ytapi.gauravramyadav.workers.dev/${u}` : u);
      candidates.push(...fallbackCandidates);
    }

    if (candidates.length === 0) return Response.json({ error: "No streams" }, { status: 404 });

    const rangeHeader = request.headers.get("Range") || "bytes=0-";

    // Attempt the top 3 candidates (increased from 2 for better reliability)
    for (const targetUrl of candidates.slice(0, 3)) {
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
