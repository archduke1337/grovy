import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  try {
    const metaRes = await fetch(`https://ytapi.gauravramyadav.workers.dev/api/stream?id=${id}`);
    if (!metaRes.ok) return Response.json({ error: "Meta API Down" }, { status: 502 });

    const data = await metaRes.json();
    const sources = data.streamingUrls || data.streams || (data.url ? [data] : []);
    
    // Normalize and filter candidates
    const candidates = (Array.isArray(sources) ? sources : [sources])
      .map(s => s.url || s.directUrl || (typeof s === 'string' ? s : ""))
      .filter(u => u && (u.includes('googlevideo') || u.startsWith('/')))
      .map(u => u.startsWith('/') ? `https://verome-api.deno.dev${u}` : u);

    if (candidates.length === 0) return Response.json({ error: "No streams" }, { status: 404 });

    const rangeHeader = request.headers.get("Range") || "bytes=0-";

    // Attempt the top 2 candidates
    for (const targetUrl of candidates.slice(0, 2)) {
      try {
        const relayRes = await fetch(targetUrl, { 
           headers: { 
             "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
             "Range": rangeHeader,
             "Referer": "https://www.youtube.com/",
           },
           // Don't wait too long for a dead candidate
           signal: (AbortSignal as any).timeout(5000)
        });

        // CRITICAL: Ensure we actually got a stream, not an error page
        const contentType = relayRes.headers.get("Content-Type") || "";
        if ((relayRes.ok || relayRes.status === 206) && contentType.includes("audio")) {
          console.log(`[StreamAPI] Relaying ${id} (${contentType})`);
          
          return new Response(relayRes.body, {
             status: relayRes.status,
             headers: {
               "Content-Type": contentType,
               "Access-Control-Allow-Origin": "*",
               "Accept-Ranges": "bytes",
               "Content-Range": relayRes.headers.get("Content-Range") || "",
               "Content-Length": relayRes.headers.get("Content-Length") || "",
               "Cache-Control": "public, max-age=3600"
             }
          });
        }
        console.warn(`[StreamAPI] Candidate failed with status ${relayRes.status} or type ${contentType}`);
      } catch (e) {
        continue;
      }
    }

    // FINAL RESCUE: If Relay fails, use the Verome Proxy directly via Redirect
    // This is the most compatible fallback as their server is optimized for these CDNs.
    const lastResort = `https://ytapi.gauravramyadav.workers.dev/api/proxy?url=${encodeURIComponent(candidates[0])}`;
    console.log(`[StreamAPI] Falling back to remote proxy redirect for ${id}`);
    return Response.redirect(lastResort);

  } catch (error: any) {
    console.error(`[StreamAPI] Critical Error:`, error.message);
    return Response.json({ error: "Playback unavailable" }, { status: 500 });
  }
}
