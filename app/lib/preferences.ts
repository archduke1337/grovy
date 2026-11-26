"use client";

import {
  patchPreferences,
  readPreferences,
  type Preferences,
} from "./localStore";

/**
 * Read the persisted preference bag.
 * Values are available synchronously from `localStorage`, so there is no
 * loading state or network round-trip.
 */
export async function getGrovyPrefs(): Promise<Preferences> {
  return readPreferences();
}

/**
 * Merge `patch` into stored preferences and return the merged result.
 * Returns synchronously-computed state so callers can use it in effects
 * without awaiting.
 */
export async function patchGrovyPrefs(patch: Preferences): Promise<Preferences> {
  return patchPreferences(patch);
}

/** Non-async variant for hot paths such as volume sliders. */
export function patchGrovyPrefsSync(patch: Preferences): Preferences {
  return patchPreferences(patch);
}
