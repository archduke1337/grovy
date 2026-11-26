import { describe, expect, it } from "vitest";

import { moveIndex, nextIndex, previousIndex, removeIndex } from "../app/lib/queue";

describe("nextIndex", () => {
  it("advances through a multi-track queue", () => {
    expect(nextIndex(0, 3)).toEqual({ index: 1, exhausted: false });
    expect(nextIndex(2, 3)).toEqual({ index: 0, exhausted: false });
  });

  it("reports a single-track queue as exhausted instead of wrapping onto itself", () => {
    // Regression: wrapping to the same index left every source effect keyed on
    // song identity untouched, so audio never reloaded while the UI said
    // "playing".
    const result = nextIndex(0, 1);
    expect(result.exhausted).toBe(true);
    expect(result.index).toBe(0);
  });

  it("reports an empty queue as exhausted", () => {
    expect(nextIndex(0, 0).exhausted).toBe(true);
  });

  it("never returns the current index when shuffling a multi-track queue", () => {
    for (const random of [0, 0.25, 0.5, 0.99]) {
      const result = nextIndex(1, 4, { shuffle: true, random: () => random });
      expect(result.index).not.toBe(1);
      expect(result.index).toBeGreaterThanOrEqual(0);
      expect(result.index).toBeLessThan(4);
    }
  });

  it("falls back to a linear step when the random source never moves", () => {
    const result = nextIndex(1, 4, { shuffle: true, random: () => 0.25 });
    expect(result).toEqual({ index: 2, exhausted: false });
  });

  it("does not hang when shuffle is requested for a single track", () => {
    expect(nextIndex(0, 1, { shuffle: true }).exhausted).toBe(true);
  });
});

describe("previousIndex", () => {
  it("restarts the current track when past the threshold", () => {
    expect(previousIndex(2, 4, 10)).toEqual({ index: 2, exhausted: false });
  });

  it("moves back inside the threshold", () => {
    expect(previousIndex(2, 4, 0)).toEqual({ index: 1, exhausted: false });
    expect(previousIndex(0, 4, 0)).toEqual({ index: 3, exhausted: false });
  });

  it("restarts rather than wrapping for a single track", () => {
    const result = previousIndex(0, 1, 0);
    expect(result.index).toBe(0);
    expect(result.exhausted).toBe(false);
  });

  it("reports an empty queue", () => {
    expect(previousIndex(0, 0, 0).exhausted).toBe(true);
  });
});

describe("moveIndex", () => {
  it("follows the moved song when it was playing", () => {
    expect(moveIndex(1, 1, 3, 4)).toBe(3);
  });

  it("shifts down when an earlier song moves past the current one", () => {
    expect(moveIndex(2, 0, 3, 4)).toBe(1);
  });

  it("shifts up when a later song moves in front of the current one", () => {
    expect(moveIndex(1, 3, 0, 4)).toBe(2);
  });

  it("ignores a no-op or invalid move", () => {
    expect(moveIndex(1, 1, 1, 4)).toBe(1);
    expect(moveIndex(1, 9, 0, 4)).toBe(1);
  });
});

describe("removeIndex", () => {
  it("keeps the same slot when the playing track is removed", () => {
    expect(removeIndex(1, 1, 4).index).toBe(1);
  });

  it("moves back one when the last playing track is removed", () => {
    expect(removeIndex(3, 3, 4).index).toBe(2);
  });

  it("shifts down when an earlier track is removed", () => {
    expect(removeIndex(2, 0, 4).index).toBe(1);
  });

  it("leaves the index alone when a later track is removed", () => {
    expect(removeIndex(1, 3, 4).index).toBe(1);
  });

  it("resets for the last remaining track", () => {
    expect(removeIndex(0, 0, 1)).toEqual({ index: 0, length: 0 });
  });
});
