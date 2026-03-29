export const APP_NAME = "Grovy";
export const APP_DESCRIPTION =
  "Grovy is an open-source web music player with fast search, streaming, lyrics, and local-first playlists.";
export const APP_TAGLINE = "Open-source web music player";

const FALLBACK_SITE_URL = "https://grovy.vercel.app";

function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function getSiteUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    FALLBACK_SITE_URL;

  return normalizeUrl(envUrl);
}

export function absoluteUrl(pathname: string = "/"): string {
  const baseUrl = getSiteUrl();
  if (!pathname || pathname === "/") return baseUrl;
  return `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
