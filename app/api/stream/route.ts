import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const quality = request.nextUrl.searchParams.get("quality") || "high"; // 'high', 'medium', 'low'
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  try {
    const metaRes = await fetch(`https://ytapi.gauravramyadav.workers.dev/api/stream?id=${id}`);
    if (!metaRes.ok) return Response.json({ error: "Meta API Down" }, { status: 502 });

    const data = await metaRes.json();
    const sources = data.streamingUrls || data.streams || (data.url ? [data] : []);
    
    // Normalize all stream candidates
    const allStreams = (Array.isArray(sources) ? sources : [sources]).map(s => ({
      url: s.url || s.directUrl || (typeof s === 'string' ? s : ""),
      mimeType: s.mimeType || s.type || "",
      bitrate: s.bitrate || s.audioBitrate || 0,
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
    
    // Build candidate URLs
    const candidates = selectedStreams
      .map(s => s.url)
      .filter(u => u && (u.includes('googlevideo') || u.startsWith('/')))
      .map(u => u.startsWith('/') ? `https://verome-api.deno.dev${u}` : u);

    // Fallback: if no audio-specific streams found, use all candidates
    if (candidates.length === 0) {
      const fallbackCandidates = allStreams
        .map(s => s.url)
        .filter(u => u && (u.includes('googlevideo') || u.startsWith('/')))
        .map(u => u.startsWith('/') ? `https://verome-api.deno.dev${u}` : u);
      candidates.push(...fallbackCandidates);
    }

    if (candidates.length === 0) return Response.json({ error: "No streams" }, { status: 404 });

    const rangeHeader = request.headers.get("Range") || "bytes=0-";

    // Attempt the top 3 candidates (increased from 2 for better reliability)
    for (const targetUrl of candidates.slice(0, 3)) {
      try {
        const relayRes = await fetch(targetUrl, { 
           headers: { 
             "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
             "Range": rangeHeader,
             "Referer": "https://www.youtube.com/",
           },
           signal: (AbortSignal as any).timeout(8000) // Increased timeout for better reliability
        });

        const contentType = relayRes.headers.get("Content-Type") || "";
        if ((relayRes.ok || relayRes.status === 206) && (contentType.includes("audio") || contentType.includes("video") || contentType.includes("octet-stream"))) {
          console.log(`[StreamAPI] Relaying ${id} (${contentType}, bitrate: best available)`);
          
          return new Response(relayRes.body, {
             status: relayRes.status,
             headers: {
               "Content-Type": contentType.includes("audio") ? contentType : "audio/webm",
               "Access-Control-Allow-Origin": "*",
               "Accept-Ranges": "bytes",
               "Content-Range": relayRes.headers.get("Content-Range") || "",
               "Content-Length": relayRes.headers.get("Content-Length") || "",
               "Cache-Control": "public, max-age=3600"
             }
          });
        }
        console.warn(`[StreamAPI] Candidate failed: status=${relayRes.status}, type=${contentType}`);
      } catch (e) {
        continue;
      }
    }

    // FINAL RESCUE: Use the Verome Proxy directly via Redirect
    const lastResort = `https://ytapi.gauravramyadav.workers.dev/api/proxy?url=${encodeURIComponent(candidates[0])}`;
    console.log(`[StreamAPI] Falling back to remote proxy redirect for ${id}`);
    return Response.redirect(lastResort);

  } catch (error: any) {
    console.error(`[StreamAPI] Critical Error:`, error.message);
    return Response.json({ error: "Playback unavailable" }, { status: 500 });
  }
}
