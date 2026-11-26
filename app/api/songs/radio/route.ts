import { NextRequest } from "next/server";

import { discoverSongs, validateSongs } from "@/app/lib/discovery";

export const runtime = "nodejs";

/**
 * Radio queue seeded by a track.
 *
 * Thin wrapper: the parsing and fallback chain lives in `discoverSongs` so
 * `/api/songs/radio` and `/api/songs/related` cannot drift apart.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const videoId = params.get("videoId");
  const title = params.get("title");

  if (!videoId && !title) {
    return Response.json({ error: "Missing videoId or title" }, { status: 400 });
  }

  try {
    const songs = await discoverSongs("radio", {
      videoId,
      songId: params.get("songId"),
      title,
      artist: params.get("artist"),
    });

    return Response.json(validateSongs(songs));
  } catch (error) {
    console.error("Radio discovery failed:", error);
    return Response.json({ error: "Failed to fetch radio songs" }, { status: 502 });
  }
}
