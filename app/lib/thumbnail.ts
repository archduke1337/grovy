/**
 * Thumbnail helpers.
 *
 * YouTube only generates `maxresdefault.jpg` for videos uploaded above a
 * certain quality, so guessing that URL produces broken images for a large
 * share of tracks. We always resolve to `hqdefault.jpg` (480x360), which
 * exists for every video.
 *
 * `sddefault.jpg` (640x480) is a tempting upgrade, but it is *not* generated
 * for all videos — requesting it would reintroduce the broken-image problem
 * this module exists to avoid. If you need a bigger render, supply one from
 * the API response (see `getBestThumbnail`) rather than guessing a size.
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
