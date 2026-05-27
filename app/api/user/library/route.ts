import { createHash } from "crypto";

import { ID, Query, type Models } from "node-appwrite";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { APPWRITE_TABLE_IDS, getPublicAppwriteConfig } from "@/app/lib/appwrite/config";
import { appwriteErrorResponse } from "@/app/lib/appwrite/response";
import {
  clearSessionCookie,
  readSessionSecretFromRequest,
} from "@/app/lib/appwrite/sessionCookie";
import { createSessionAppwriteClients } from "@/app/lib/appwrite/server";
import { SongSchema, type Playlist, type Song } from "@/app/types/song";

export const runtime = "nodejs";

const PAGE_SIZE = 100;

const playlistSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  songs: z.array(SongSchema).default([]),
  createdAt: z.number().optional(),
  cover: z.string().optional(),
});

type PlaylistPayload = z.infer<typeof playlistSchema>;

const updateLibrarySchema = z
  .object({
    playlists: z.array(playlistSchema).max(100).optional(),
    favorites: z.array(SongSchema).max(500).optional(),
  })
  .refine(
    (payload) =>
      payload.playlists !== undefined || payload.favorites !== undefined,
    {
      message: "At least one library collection must be provided",
    }
  );

type SessionContext = {
  userId: string;
  tables: ReturnType<typeof createSessionAppwriteClients>["tables"];
  databaseId: string;
};

type NormalizedSong = {
  songId: string;
  title: string;
  artist: string;
  url: string;
  cover?: string;
  genre?: string;
  duration?: number;
  source: string;
};

type NormalizedPlaylist = {
  rowId: string;
  name: string;
  cover?: string;
  songs: NormalizedSong[];
};

async function getSessionContext(
  req: NextRequest
): Promise<SessionContext | NextResponse> {
  const sessionSecret = readSessionSecretFromRequest(req);

  if (!sessionSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userAgent = req.headers.get("user-agent") || undefined;
    const { account, tables } = createSessionAppwriteClients(
      sessionSecret,
      userAgent
    );
    const session = await account.getSession({ sessionId: "current" });

    if (session.provider === "anonymous") {
      const response = NextResponse.json(
        { error: "Sign in to sync library" },
        { status: 401 }
      );
      clearSessionCookie(response);
      return response;
    }

    const user = await account.get();
    const { databaseId } = getPublicAppwriteConfig();

    return {
      userId: user.$id,
      tables,
      databaseId,
    };
  } catch (error: any) {
    console.warn("[getSessionContext] Error:", error.message || error);
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }
}

function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

function normalizeString(
  value: unknown,
  fallback = "",
  maxLength?: number
): string {
  const raw = typeof value === "string" ? value.trim() : "";
  const withFallback = raw || fallback;

  if (!maxLength || withFallback.length <= maxLength) {
    return withFallback;
  }

  return withFallback.slice(0, maxLength);
}

function normalizeUrl(value: unknown, origin: string): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;

  try {
    const normalized = new URL(raw, origin);
    if (normalized.protocol === "http:" || normalized.protocol === "https:") {
      return normalized.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function toRowId(value: string, prefix: string): string {
  const trimmed = value.trim();

  if (
    /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(trimmed) &&
    trimmed.length <= 36
  ) {
    return trimmed;
  }

  const hash = createHash("sha1").update(trimmed || `${prefix}-${Date.now()}`).digest("hex");
  return `${prefix}_${hash.slice(0, 33)}`;
}

function normalizeSongForStorage(
  song: Song,
  origin: string
): NormalizedSong | null {
  const url = normalizeUrl(song.url, origin);
  if (!url) return null;

  const songId = normalizeString(song.id, "", 128);
  const title = normalizeString(song.title, "Untitled", 512);
  if (!songId || !title) return null;

  const cover = normalizeUrl(song.cover, origin) || undefined;
  const duration = Number.isFinite(song.duration) ? Math.max(0, Math.round(Number(song.duration))) : undefined;

  return {
    songId,
    title,
    artist: normalizeString(song.artist, "Unknown Artist", 512),
    url,
    cover,
    genre: normalizeString(song.genre, "", 128) || undefined,
    duration,
    source: normalizeString(song.source, "unknown", 64),
  };
}

function normalizePlaylistForStorage(
  playlist: PlaylistPayload,
  origin: string
): NormalizedPlaylist {
  const dedupedSongs: NormalizedSong[] = [];
  const seenSongIds = new Set<string>();

  for (const song of playlist.songs || []) {
    const normalized = normalizeSongForStorage(song, origin);
    if (!normalized || seenSongIds.has(normalized.songId)) {
      continue;
    }

    seenSongIds.add(normalized.songId);
    dedupedSongs.push(normalized);
  }

  return {
    rowId: toRowId(playlist.id, "pl"),
    name: normalizeString(playlist.name, "Untitled Playlist", 256),
    cover: normalizeUrl(playlist.cover, origin) || dedupedSongs[0]?.cover,
    songs: dedupedSongs,
  };
}

async function listAllRows(
  tables: SessionContext["tables"],
  databaseId: string,
  tableId: string,
  baseQueries: string[] = []
): Promise<Models.Row[]> {
  const rows: Models.Row[] = [];
  let cursor: string | null = null;

  while (true) {
    const queries = [...baseQueries, Query.limit(PAGE_SIZE)];
    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const page = await tables.listRows({
      databaseId,
      tableId,
      queries,
      total: false,
    });

    if (!page.rows.length) {
      break;
    }

    rows.push(...page.rows);

    if (page.rows.length < PAGE_SIZE) {
      break;
    }

    cursor = page.rows[page.rows.length - 1].$id;
  }

  return rows;
}

function mapFavoriteRowsToSongs(rows: Models.Row[]): Song[] {
  const songs: Song[] = [];

  for (const row of rows) {
    const rowData = row as Record<string, unknown>;
    const songId = normalizeString(rowData.songId, "", 128);
    const title = normalizeString(rowData.title, "", 512);
    const url = normalizeString(rowData.url);

    if (!songId || !title || !url) {
      continue;
    }

    const durationValue = rowData.duration;
    const duration =
      typeof durationValue === "number" && Number.isFinite(durationValue)
        ? durationValue
        : undefined;
    const cover = normalizeString(rowData.cover) || undefined;

    songs.push({
      id: songId,
      title,
      url,
      artist: normalizeString(rowData.artist, "Unknown Artist", 512),
      genre: normalizeString(rowData.genre, "Unknown", 128),
      ...(cover ? { cover } : {}),
      ...(duration !== undefined ? { duration } : {}),
      source: normalizeString(rowData.source, "unknown", 64),
    });
  }

  return songs;
}

function mapPlaylistRowsToPlaylists(
  playlistRows: Models.Row[],
  trackRows: Models.Row[]
): Playlist[] {
  const songsByPlaylist = new Map<string, Song[]>();

  for (const row of trackRows) {
    const rowData = row as Record<string, unknown>;
    const playlistId = normalizeString(rowData.playlistId);
    const songId = normalizeString(rowData.songId, "", 128);
    const title = normalizeString(rowData.title, "", 512);
    const url = normalizeString(rowData.url);

    if (!playlistId || !songId || !title || !url) {
      continue;
    }

    const durationValue = rowData.duration;
    const duration =
      typeof durationValue === "number" && Number.isFinite(durationValue)
        ? durationValue
        : undefined;

    const song: Song = {
      id: songId,
      title,
      url,
      artist: normalizeString(rowData.artist, "Unknown Artist", 512),
      cover: normalizeString(rowData.cover) || undefined,
      genre: normalizeString(rowData.genre, "Unknown", 128),
      duration,
      source: normalizeString(rowData.source, "unknown", 64),
    };

    const existing = songsByPlaylist.get(playlistId);
    if (existing) {
      existing.push(song);
    } else {
      songsByPlaylist.set(playlistId, [song]);
    }
  }

  return playlistRows.map((row) => {
    const rowData = row as Record<string, unknown>;
    const updatedAt = normalizeString(rowData.updatedAt) || row.$updatedAt || row.$createdAt;
    const createdAt = Date.parse(updatedAt || row.$createdAt || "") || Date.now();

    return {
      id: row.$id,
      name: normalizeString(rowData.name, "Untitled Playlist", 256),
      songs: songsByPlaylist.get(row.$id) || [],
      createdAt,
      cover: normalizeString(rowData.cover) || undefined,
    } satisfies Playlist;
  });
}

async function readLibraryState(
  context: SessionContext
): Promise<{ playlists: Playlist[]; favorites: Song[] }> {
  const { userId, tables, databaseId } = context;

  const [playlistRows, trackRows, favoriteRows] = await Promise.all([
    listAllRows(tables, databaseId, APPWRITE_TABLE_IDS.playlists, [
      Query.equal("userId", userId),
      Query.orderAsc("updatedAt"),
    ]),
    listAllRows(tables, databaseId, APPWRITE_TABLE_IDS.playlistTracks, [
      Query.equal("userId", userId),
      Query.orderAsc("position"),
    ]),
    listAllRows(tables, databaseId, APPWRITE_TABLE_IDS.favorites, [
      Query.equal("userId", userId),
      Query.orderAsc("addedAt"),
    ]),
  ]);

  return {
    playlists: mapPlaylistRowsToPlaylists(playlistRows, trackRows),
    favorites: mapFavoriteRowsToSongs(favoriteRows),
  };
}

async function persistPlaylists(
  context: SessionContext,
  playlists: PlaylistPayload[],
  origin: string
) {
  const { userId, tables, databaseId } = context;

  const normalizedPlaylists = playlists.map((playlist) =>
    normalizePlaylistForStorage(playlist, origin)
  );

  const desiredPlaylistIds = new Set(normalizedPlaylists.map((playlist) => playlist.rowId));

  const existingPlaylistRows = await listAllRows(
    tables,
    databaseId,
    APPWRITE_TABLE_IDS.playlists,
    [Query.equal("userId", userId)]
  );

  for (const row of existingPlaylistRows) {
    if (desiredPlaylistIds.has(row.$id)) {
      continue;
    }

    await tables.deleteRows({
      databaseId,
      tableId: APPWRITE_TABLE_IDS.playlistTracks,
      queries: [Query.equal("userId", userId), Query.equal("playlistId", row.$id)],
    });

    await tables.deleteRow({
      databaseId,
      tableId: APPWRITE_TABLE_IDS.playlists,
      rowId: row.$id,
    });
  }

  for (const playlist of normalizedPlaylists) {
    await tables.upsertRow({
      databaseId,
      tableId: APPWRITE_TABLE_IDS.playlists,
      rowId: playlist.rowId,
      data: {
        userId,
        name: playlist.name,
        cover: playlist.cover,
        description: "",
        songCount: playlist.songs.length,
        isPinned: false,
        updatedAt: new Date().toISOString(),
      },
    });

    const existingTrackRows = await listAllRows(
      tables,
      databaseId,
      APPWRITE_TABLE_IDS.playlistTracks,
      [Query.equal("userId", userId), Query.equal("playlistId", playlist.rowId)]
    );

    const desiredSongIds = new Set(playlist.songs.map((s) => s.songId));

    const existingSongIds = new Set<string>();
    for (const row of existingTrackRows) {
      const rowData = row as Record<string, unknown>;
      const songId = normalizeString(rowData.songId, "", 128);
      if (songId && !desiredSongIds.has(songId)) {
        await tables.deleteRow({
          databaseId,
          tableId: APPWRITE_TABLE_IDS.playlistTracks,
          rowId: row.$id,
        });
      } else if (songId) {
        existingSongIds.add(songId);
      }
    }

    for (let index = 0; index < playlist.songs.length; index += 1) {
      const song = playlist.songs[index];
      if (existingSongIds.has(song.songId)) continue;

      await tables.createRow({
        databaseId,
        tableId: APPWRITE_TABLE_IDS.playlistTracks,
        rowId: ID.unique(),
        data: {
          userId,
          playlistId: playlist.rowId,
          songId: song.songId,
          title: song.title,
          artist: song.artist,
          url: song.url,
          cover: song.cover,
          genre: song.genre,
          duration: song.duration,
          source: song.source,
          position: index,
          addedAt: new Date().toISOString(),
        },
      });
    }
  }
}

async function persistFavorites(
  context: SessionContext,
  favorites: Song[],
  origin: string
) {
  const { userId, tables, databaseId } = context;

  const normalizedFavorites: NormalizedSong[] = [];
  const seenSongIds = new Set<string>();

  for (const song of favorites) {
    const normalized = normalizeSongForStorage(song, origin);
    if (!normalized || seenSongIds.has(normalized.songId)) {
      continue;
    }

    seenSongIds.add(normalized.songId);
    normalizedFavorites.push(normalized);
  }

  const existingFavoriteRows = await listAllRows(
    tables,
    databaseId,
    APPWRITE_TABLE_IDS.favorites,
    [Query.equal("userId", userId)]
  );

  const desiredSongIds = new Set(normalizedFavorites.map((s) => s.songId));

  for (const row of existingFavoriteRows) {
    const rowData = row as Record<string, unknown>;
    const songId = normalizeString(rowData.songId, "", 128);
    if (songId && !desiredSongIds.has(songId)) {
      await tables.deleteRow({
        databaseId,
        tableId: APPWRITE_TABLE_IDS.favorites,
        rowId: row.$id,
      });
    }
  }

  const existingSongIds = new Set<string>();
  for (const row of existingFavoriteRows) {
    const rowData = row as Record<string, unknown>;
    const songId = normalizeString(rowData.songId, "", 128);
    if (songId) existingSongIds.add(songId);
  }

  const baseTimestamp = Date.now();
  for (let index = 0; index < normalizedFavorites.length; index += 1) {
    const song = normalizedFavorites[index];
    if (existingSongIds.has(song.songId)) continue;

    await tables.createRow({
      databaseId,
      tableId: APPWRITE_TABLE_IDS.favorites,
      rowId: ID.unique(),
      data: {
        userId,
        songId: song.songId,
        title: song.title,
        artist: song.artist,
        url: song.url,
        cover: song.cover,
        genre: song.genre,
        duration: song.duration,
        source: song.source,
        addedAt: new Date(baseTimestamp + index).toISOString(),
      },
    });
  }
}

export async function GET(req: NextRequest) {
  const context = await getSessionContext(req);
  if (isNextResponse(context)) {
    return context;
  }

  try {
    const library = await readLibraryState(context);
    return NextResponse.json(library);
  } catch (error) {
    return appwriteErrorResponse(error, "Failed to load user library", 400);
  }
}

export async function PUT(req: NextRequest) {
  const context = await getSessionContext(req);
  if (isNextResponse(context)) {
    return context;
  }

  try {
    const payload = updateLibrarySchema.parse(await req.json());
    const origin = req.nextUrl.origin;

    if (payload.playlists) {
      await persistPlaylists(context, payload.playlists, origin);
    }

    if (payload.favorites) {
      await persistFavorites(context, payload.favorites, origin);
    }

    const library = await readLibraryState(context);
    return NextResponse.json(library);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid library payload", issues: error.flatten() },
        { status: 422 }
      );
    }

    return appwriteErrorResponse(error, "Failed to update user library", 400);
  }
}
