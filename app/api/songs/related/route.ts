import { NextRequest } from "next/server";

import { discoverSongs, validateSongs } from "@/app/lib/discovery";

export const runtime = "nodejs";

/**
 * Tracks related to a given song.
 *
 * Shares one implementation with `/api/songs/radio`; only the preferred
 * upstream strategy differs.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const videoId = params.get("videoId");
  const title = params.get("title");

  if (!videoId && !title) {
    return Response.json({ error: "Missing videoId or title" }, { status: 400 });
  }

  try {
    const songs = await discoverSongs("related", {
      videoId,
      songId: params.get("songId"),
      title,
      artist: params.get("artist"),
    });

    return Response.json(validateSongs(songs));
  } catch (error) {
    console.error("Related discovery failed:", error);
    return Response.json({ error: "Failed to fetch related songs" }, { status: 502 });
  }
}
