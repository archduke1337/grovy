/**
 * Queue index arithmetic, kept pure so it can be tested without an audio
 * element, a browser or React.
 *
 * Every function here is total: given any song count and any index it returns
 * a valid index (or `null` when there is nothing to do). The component layer
 * decides what "play", "stop" and "reload" mean.
 */

/** Result of a skip request. `null` index means "no move possible". */
export interface SkipResult {
  index: number | null;
  /** True when the queue cannot advance, so the caller should stop. */
  exhausted: boolean;
}

/**
 * Next index for a forward skip.
 *
 * A single-track queue reports `exhausted` rather than wrapping onto the same
 * index: wrapping leaves the index unchanged, which means source effects keyed
 * on song identity never re-run and playback silently stops while the UI still
 * reports "playing".
 */
export function nextIndex(
  currentIndex: number,
  length: number,
  options: { shuffle?: boolean; random?: () => number } = {}
): SkipResult {
  if (length <= 0) return { index: null, exhausted: true };
  if (length === 1) return { index: currentIndex, exhausted: true };

  if (options.shuffle) {
    const random = options.random ?? Math.random;
    let next = currentIndex;
    // Bounded so a pathological random source cannot loop forever.
    for (let attempt = 0; attempt < length * 2 && next === currentIndex; attempt++) {
      next = Math.floor(random() * length);
    }
    if (next === currentIndex) next = (currentIndex + 1) % length;
    return { index: next, exhausted: false };
  }

  return { index: (currentIndex + 1) % length, exhausted: false };
}

/**
 * Index for a backward skip.
 *
 * When playback is more than a few seconds in, "previous" restarts the track
 * instead of changing it — the behaviour every music player has. A one-track
 * queue restarts rather than wrapping onto itself.
 */
export function previousIndex(
  currentIndex: number,
  length: number,
  currentTime: number,
  thresholdSeconds = 3
): SkipResult {
  if (length <= 0) return { index: null, exhausted: true };
  if (currentTime > thresholdSeconds) return { index: currentIndex, exhausted: false };
  if (length === 1) return { index: currentIndex, exhausted: false };
  return { index: (currentIndex - 1 + length) % length, exhausted: false };
}

/**
 * Move a song inside the queue and report where the *currently playing* song
 * ended up. Returns the original index when the move is a no-op or invalid.
 */
export function moveIndex(
  currentIndex: number,
  from: number,
  to: number,
  length: number
): number {
  if (length <= 0) return currentIndex;
  if (from < 0 || from >= length || to < 0 || to >= length || from === to) {
    return currentIndex;
  }
  if (currentIndex === from) return to;
  if (from < currentIndex && to >= currentIndex) return currentIndex - 1;
  if (from > currentIndex && to <= currentIndex) return currentIndex + 1;
  return currentIndex;
}

/**
 * Remove a song and report which index should play next.
 *
 * Removing the playing track keeps the same slot (the following song slides
 * into it). Removing anything before it shifts the index down. Removing the
 * last track when it was playing moves back one.
 */
export function removeIndex(
  currentIndex: number,
  removeAt: number,
  length: number
): { index: number; length: number } {
  if (length <= 0) return { index: 0, length: 0 };
  if (removeAt < 0 || removeAt >= length) return { index: currentIndex, length };

  const nextLength = length - 1;
  if (nextLength === 0) return { index: 0, length: 0 };

  let index = currentIndex;
  if (removeAt < currentIndex) index = currentIndex - 1;
  else if (removeAt === currentIndex) index = Math.min(currentIndex, nextLength - 1);

  return { index: Math.max(0, Math.min(index, nextLength - 1)), length: nextLength };
}
