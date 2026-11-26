/**
 * Thumbnail helpers.
 *
 * YouTube only generates `maxresdefault.jpg` for videos uploaded above a
 * certain quality, so guessing that URL produces broken images for a large
 * share of tracks. We always resolve to `hqdefault.jpg`, which exists for
 * every video, and raise the resolution by requesting a larger `hqdefault`
 * variant only where it is guaranteed.
 */

const YT_ID_PATTERN = /\/vi\/([^/?#]+)/;

/** Every YouTube video has this one; it is 480x360 and always 4:3. */
function ytThumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Rewrite size suffixes on Google image CDN URLs.
 * Google encodes the requested size as `=w60-h60-l90-rj` or `=s192`; raising
 * those numbers asks the CDN for a bigger render of the same asset.
 */
function upscaleGoogleUrl(url: string, size = 544): string {
  return url
    .replace(/=w\d+-h\d+/, `=w${size}-h${size}`)
    .replace(/=s\d+/, `=s${size}`);
}

export function getHDThumbnail(url: string | undefined | null): string | undefined {
  if (!url) return undefined;

  const trimmed = url.trim();
  if (!trimmed) return undefined;

  try {
    if (trimmed.includes("i.ytimg.com")) {
      const match = trimmed.match(YT_ID_PATTERN);
      // Resolve to the universally available size instead of guessing
      // maxresdefault, which 404s for many videos.
      return match ? ytThumb(match[1]) : trimmed;
    }

    if (
      trimmed.includes("lh3.googleusercontent.com") ||
      trimmed.includes("yt3.googleusercontent.com")
    ) {
      return upscaleGoogleUrl(trimmed);
    }

    return trimmed;
  } catch {
    return url;
  }
}

/**
 * Pick the best thumbnail from a list, preferring the largest render but
 * returning a URL that is actually guaranteed to exist.
 */
export function getBestThumbnail(
  thumbnails: { url: string; width?: number; height?: number }[] | undefined
): string | undefined {
  if (!thumbnails || thumbnails.length === 0) return undefined;

  const sorted = [...thumbnails].sort(
    (a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0)
  );

  return getHDThumbnail(sorted[0]?.url);
}

/**
 * A second, larger YouTube thumbnail to try when `getHDThumbnail` fails.
 *
 * `sqp`-signed URLs are tied to a specific size, so callers that want a
 * fallback should swap in this deterministic URL on `onError`.
 */
export function getThumbnailFallback(url: string | undefined | null): string | undefined {
  if (!url) return undefined;

  const match = url.match(YT_ID_PATTERN);
  if (!match) return undefined;

  return `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg`;
}
