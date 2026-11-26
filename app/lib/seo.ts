export const APP_NAME = "Grovy";
export const APP_DESCRIPTION =
  "Grovy is an open-source web music player with fast search, streaming, lyrics, and local-first playlists.";

/**
 * Canonical origin used when `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` is
 * unset — the documented default, since the README says no env vars are needed.
 *
 * Must match `package.json` `homepage` and the README link. Those three drifted
 * apart before (vercel.app, archduke1337.is-a.dev, archduke.is-a.dev). If the
 * deployment host changes, change it here and in `package.json` together —
 * `robots.ts` and `sitemap.ts` both derive from this, so they follow
 * automatically.
 */
const FALLBACK_SITE_URL = "https://grovy.archduke1337.is-a.dev";

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
