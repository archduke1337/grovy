/**
 * Upgrades a YouTube/Google thumbnail URL to the highest available resolution.
 * 
 * YouTube Music API returns very small thumbnails (60x60 from lh3.googleusercontent.com).
 * This function rewrites the URL to request much larger images.
 * 
 * For ytimg.com (standard YouTube), replaces quality suffixes with maxresdefault.
 * For lh3.googleusercontent.com (YouTube Music), replaces size params to request 544x544.
 */
export function getHDThumbnail(url: string | undefined | null): string | undefined {
  if (!url) return undefined;

  try {
    // YouTube standard thumbnails (ytimg.com)
    // e.g. https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg?sqp=...
    if (url.includes("i.ytimg.com")) {
      // Extract video ID from URL
      const match = url.match(/\/vi\/([^/]+)\//);
      if (match) {
        // Use maxresdefault (1280x720) - highest standard YouTube thumbnail
        // Falls back gracefully in the browser if not available
        return `https://i.ytimg.com/vi/${match[1]}/maxresdefault.jpg`;
      }
    }

    // YouTube Music thumbnails (lh3.googleusercontent.com)
    // e.g. https://lh3.googleusercontent.com/...=w60-h60-l90-rj
    if (url.includes("lh3.googleusercontent.com")) {
      // Replace the size parameters at the end
      // =w60-h60-l90-rj  →  =w544-h544-l90-rj
      // =s192             →  =s544
      return url
        .replace(/=w\d+-h\d+/, "=w544-h544")
        .replace(/=s\d+/, "=s544");
    }

    // YouTube playlist thumbnails (yt3.googleusercontent.com)
    if (url.includes("yt3.googleusercontent.com")) {
      return url
        .replace(/=w\d+-c?-?h\d+/, "=w544-h544")
        .replace(/=s\d+/, "=s544");
    }

    // YouTube playlist studio thumbnails
    if (url.includes("studio_square_thumbnail")) {
      return url; // These don't scale well, keep as-is
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Gets the best available thumbnail from a thumbnails array.
 * Prefers the largest thumbnail and then upgrades it to HD.
 */
export function getBestThumbnail(
  thumbnails: { url: string; width?: number; height?: number }[] | undefined
): string | undefined {
  if (!thumbnails || thumbnails.length === 0) return undefined;

  // Sort by resolution (largest first)
  const sorted = [...thumbnails].sort((a, b) => {
    const aSize = (a.width || 0) * (a.height || 0);
    const bSize = (b.width || 0) * (b.height || 0);
    return bSize - aSize;
  });

  // Take the largest and upgrade it
  return getHDThumbnail(sorted[0].url);
}
