const DEFAULT_DATABASE_ID = "grovy_main";

export const APPWRITE_TABLE_IDS = {
  playlists: "playlists",
  playlistTracks: "playlist_tracks",
  favorites: "favorites",
  playHistory: "play_history",
  queueSnapshots: "queue_snapshots",
  searchCache: "search_cache",
} as const;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPublicAppwriteConfig() {
  const endpoint = getRequiredEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT");
  const projectId = getRequiredEnv("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  const databaseId = (
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim() || DEFAULT_DATABASE_ID
  );

  return {
    endpoint,
    projectId,
    databaseId,
    tables: APPWRITE_TABLE_IDS,
  };
}

export function getServerAppwriteConfig() {
  const base = getPublicAppwriteConfig();
  const apiKey = getRequiredEnv("APPWRITE_API_KEY");

  return {
    ...base,
    apiKey,
  };
}

export function getAppwriteSessionCookieName(projectId?: string): string {
  const resolvedProjectId =
    projectId?.trim() || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim();

  if (!resolvedProjectId) {
    throw new Error(
      "Cannot resolve Appwrite session cookie name without project ID"
    );
  }

  return `a_session_${resolvedProjectId}`;
}
