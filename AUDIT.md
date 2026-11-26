# Grovy — Adversarial Architecture, Security, Performance and UX Audit

**Mode:** adversarial review. Findings are attacked, not praised.
**Repo:** `archduke1337/grovy`, branch `feat/local-first` @ `26eb78d` (clean tree). `origin/master` @ `859d7fc`.
**Date:** 2026-11-27

**Nothing was changed.** No source, config or dependency was modified.

---

## Executive summary

Grovy is a genuinely pretty, genuinely functional hobby music player with a small number of serious defects and a larger number of unfinished seams. The UI craft is above average; the behavioural discipline is not.

**The five things that matter most:**

1. **`/api/stream` is an unmetered, CORS-open byte relay (F-01, P0).** Anyone can loop it and spend the deployer's bandwidth. It cannot be made private, but it can be made narrow: validate the id shape, require same-origin, cap bandwidth at the edge.
2. **A global `Space` handler hijacks every focused control (F-02, P0).** Six lines, cannot break audio, and it currently makes destructive confirmations unreachable by keyboard.
3. **Every cache header the app sets is overridden by its own config (F-03, P1).** The `Cache-Control` strategy does not exist on the wire. Four lines to fix; it is the whole performance story.
4. **History is persisted and never read (F-04, P1).** "Recently Played" is empty on every reload, for every user, forever — while the app writes a 50-entry ring buffer nobody opens. Same shape of bug as F-21, where the ToS promises a backup the export button does not produce.
5. **One 1,326-line context (F-11, P2) holds the playback engine, the library, device settings and global input handling, with zero tests (F-23).** This is why small bugs (F-05's one-track queue dead state) become archaeology, and why none of the other fixes is safe to make quickly.

**What is genuinely good and should not be touched:** `lib/discovery.ts`, the confirm/toast/reduced-motion work, the `remotePatterns` allowlist, the host-suffix check in `isAllowedSaavnUrl`, the error boundaries, and the decision to have no accounts at all.

**Overall verdict:** the architecture's seams exist and its types are real, so this is a maintainable codebase with unfinished wiring, not a codebase that needs rewriting. Three P0/P1 items are hours of work. The expensive item (splitting the context) should not be started until the queue arithmetic is extracted and tested.

**Caveat that governs everything below:** `npm install` has never run in this workspace and there is no build. I did not compile, lint, type-check, test, or play audio. Every finding is a claim about source semantics or documented framework behaviour, and all of them are conditional on the app building.

---

## 1. Scope and coverage

**Read end-to-end:** all 68 hand-written TS/TSX files under `app/` (10,341 lines) — 7 pages, 21 components, 4 hooks, 10 route handlers, all of `app/lib/*`; all 4 test files (39 cases); `public/sw.js`, `offline.html`, `robots.txt`, `songs.json`, `browserconfig.xml`, `icons/logo.png`; `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.mjs`, `postcss.config.js`, `next-env.d.ts`, `.gitignore`, `.gitattributes`, `renovate.json`, `skills-lock.json`, `scripts/generate-manifest.js`, `.github/workflows/ci.yml`, `README.md`, `LICENSE`; `package.json` and resolved versions in `package-lock.json`.

**Not read:** `node_modules` (absent — `npm install` never ran here), `.next` (no build), `tsconfig.tsbuildinfo` (gitignored), `.agents/**` (297 unrelated skill files), `grovy-local-first.patch` (spot-sampled).

**I did not run the app, build, lint, type-check or tests.** Therefore **no claim here asserts Grovy compiles, lints, tests green, or plays audio.** Every claim is about source semantics I could read, or documented framework behaviour cited where it matters.

**Honest limit:** 100% of hand-written source read; not 100% of runtime behaviour.

**Corrections to earlier working notes** (recorded so the record is clean):

- *Dependency drift vs `origin/master`*: **false**. `package.json` dependencies are identical. The `next ^16.4.6` / `colorthief ^3.0.0` variants exist only on unmerged `dependabot/*` and `snyk-*` branches. Retracted.
- *`tsconfig.tsbuildinfo` tracked*: **false**. Gitignored, untracked.
- *`grovy-local-first.patch` untracked*: **false**. Tracked in `HEAD` and `origin/master`. See F-18.

---

## 2. Evidence rules

1. **Source over docs.** Where README / ToS / comments disagreed with code, code wins, and the disagreement is reported.
2. **Call-site proof for "dead".** Dead = exact-text grep over `app/` + `__tests__/` returned only the declaration and its own test.
3. **No model of intent.** If the README claims X and no code implements X, that is a product-truth finding, not a wish-list item.
4. **Confidence is about evidence, not opinion.** CONFIRMED = code says it, line cited. HIGH-CONFIDENCE = code + one authoritative external fact. LIKELY = strong inference, runtime-unverified. POSSIBLE = plausible, untested.
5. **Framework behaviour was checked, not assumed.** The `headers()` tie-break in F-03 was verified against Next's docs ("the last header key will override the first"), not inferred.

---

## 3. Product and stack, as-built

**Product:** open-source browser music player. Searches JioSaavn + YouTube via two Cloudflare Workers, streams through its own `/api/stream` relay, keeps playlists/favourites/history in `localStorage`. No accounts, no DB, no server-side user state.

**Stack from `package-lock.json` (not `package.json` ranges):** Next 16.2.1, React 19.2.4, TS 5.9.3 strict, Tailwind 4.1.18 + HeroUI 3.2.8, Zod 4.3.6, framer-motion 11.18.2, hls.js 1.6.15, lenis 1.3.17, ColourThief 2.7.0, lucide-react 0.263.1, Vitest 4.0.18 + jsdom 28.1.0, ESLint 9.39.4.

**Shape:** 7 routes, 10 API handlers, 21 components, 4 hooks, 4 test files. Zero `middleware.ts`, zero `proxy.ts`, zero `not-found.tsx`.

**Load-bearing fact:** `app/context/PlayerContext.tsx` is **1,326 lines, 26 `useState`, 24 `useRef`, 23 `useEffect`**. It owns the audio element, HLS instance, YouTube IFrame player, Web Audio graph (5 biquads + gain), crossfade, "normalization", sleep timer, palette extraction, global keyboard shortcuts, queue, playlists, favourites, history, radio/related fetching, command-palette open state, video mode, and the playlist modal. That is not a context. It is the application.

---

## 4. Architecture as it stands

A real layering attempt exists and is partly successful:

- `app/lib/localStore.ts` — the only module touching `localStorage` (plus two cache keys in `offlineCache.ts`).
- `app/lib/discovery.ts` — **the one genuinely good abstraction**: `radio` and `related` are ~30-line wrappers over a shared `discoverSongs()` with a documented three-source fallback. This is what the rest of the API layer should look like.
- `app/lib/apiHelpers.ts` — shared upstream-shape adapters (`pickArtist`, `pickCover`, `parseDuration`). Also good, used inconsistently (F-12).

Against that: three route handlers re-implement the same Saavn→Song and YouTube→Song mapping with slightly different field precedence, and **only two of ten** boundaries run Zod. The persistence layer has a clean interface and is then bypassed by an unvalidated import path. The state layer is one 1,326-line file.

**Verdict:** the seams exist; the discipline does not. Fixable, and much cheaper than an absent design.

---

## 5. Findings — P0 / P1 (plus F-10, P2, kept here because it is a security claim)

### F-01 — `/api/stream` is an unauthenticated, unthrottled, CORS-open media relay

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/api/stream/route.ts:45-52` accepts `?id=` or `?saavnUrl=` with no auth. `:36-39` sets `Access-Control-Allow-Origin: *`. `:111-131` fetches upstream for **any** `id` string. `:195` loops up to five candidates. `:236-261` adds a third-party proxy fallback that streams their bytes through this deployment. `app/lib/rateLimit.ts` is documented and has **zero production callers** (grep-verified).
- **WHAT IS HAPPENING:** any anonymous client anywhere can loop `GET /api/stream?id=<any id>` and have the deployment fetch and relay bytes on its behalf.
- **WHY IT MATTERS:** the only route whose cost scales with bytes, and it is unmetered. On a metered host the bill is the attacker's; on a free tier the quota is the attacker's. Neither the app nor the upstream worker is the victim — the deployer is.
- **HOW IT COULD FAIL:** 50 concurrent connections exhausts a bandwidth allowance in hours, taking the site down for real users and potentially billing. Secondary: the deployment becomes a free proxy, which is how an origin gets deplatformed.
- **COUNTERARGUMENT:** it is a public player; the route must be browser-callable, so any client-visible endpoint is abusable, and the upstream worker is equally public. Rate limiting is theatre on serverless (per-instance counters), which is why `rateLimit.ts` is unused.
- **DOES THE COUNTERARGUMENT HOLD?:** partially. The "limiter is theatre" point is correct *for counter-based limiting*. But three things survive: (a) a same-origin `Origin`/`Referer` check plus a short-lived signed token removes drive-by embedding; (b) rejecting ids that are not 11-char YouTube ids or Saavn URLs already issued by `/api/songs` removes arbitrary-id relaying; (c) bandwidth caps belong at the edge/WAF, not in-process — a *different* fix than the one the repo wrote and never wired. The counterargument weakens the *proposed* mitigation, not the finding.
- **RECOMMENDED ACTION:** three cheap layers, in order: validate `id` against `^[A-Za-z0-9_-]{11}$`; require `Sec-Fetch-Site: same-origin` (or allowlisted `Origin`) and drop `ACAO: *` on this route; put per-IP bandwidth rules at the edge, not in `rateLimit.ts`. Keep it public — it must be — but make it *narrow*.
- **ALTERNATIVE:** proxy only Saavn (it already has a host allowlist) and let YouTube play direct via the IFrame, removing the YT relay path. Cheaper to secure; loses the audio-element YT fallback.
- **RISK OF CHANGE:** medium-low. Id tightening breaks nothing legitimate (all ids come from upstream search). Removing `ACAO: *` could break a third-party embed — none exists.
- **PRIORITY:** P0
- **CONFIDENCE:** CONFIRMED (code); financial impact is deployer-dependent, stated conditionally.

---

### F-02 — A global `Space` handler makes every focused button, slider and dialog unoperable from the keyboard

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/context/PlayerContext.tsx:1129-1131` guards only `INPUT`, `TEXTAREA`, `isContentEditable`. `:1133-1136` then does `case "Space": e.preventDefault(); togglePlayPause();` on a `window` listener. The only other guard in the switch is `isCommandPaletteOpen` for arrows (`:1139`, `:1145`).
- **WHAT IS HAPPENING:** the handler fires for every keydown not inside a text field — including keydowns targeted at `<button>`, `[role="button"]`, `<input type="range">`, HeroUI `AlertDialog`/`Modal` internals, and the `?` overlay.
- **WHY IT MATTERS:** `Space` is the canonical activation key for buttons and the step key for range inputs. `preventDefault()` cancels native activation, so a keyboard user who tabs to "Delete playlist" and presses Space **starts playback instead of deleting**. Tabbing to the volume slider and pressing Arrow Up both steps the native input *and* calls `changeVolume` (double step). This is a WCAG 2.1.1 (Keyboard) failure.
- **HOW IT COULD FAIL:** a keyboard-only user cannot delete a playlist, toggle a favourite, open the sleep timer, or operate the EQ (Space/arrows both fire), and cannot dismiss a confirm dialog with the expected key. Most likely report: "pressing space on the delete button starts the music".
- **COUNTERARGUMENT:** every media app binds Space globally; users press Enter on buttons anyway. `TrackCard` already handles `Enter` explicitly, which suggests the author knew.
- **DOES THE COUNTERARGUMENT HOLD?:** no. YouTube binds Space only when focus is on the body or player. Binding on `window` with no `closest('button, [role=button], input, select, [aria-modal]')` check is the difference between a shortcut and a hijack. And `TrackCard`'s explicit `Enter` handler is evidence *against* the counterargument — it was added because Space stopped working.
- **RECOMMENDED ACTION:** at the top of the handler: `const t = e.target as HTMLElement; if (t.closest('input, textarea, select, button, a, [role="button"], [role="slider"], [role="dialog"], [aria-modal="true"]') || t.isContentEditable) return;`. Then delete `TrackCard`'s manual `Enter` handler, because native activation works again.
- **ALTERNATIVE:** scope the shortcut to a "player surface" region, requiring focus outside `[data-interactive]`. More precise, more code, same outcome.
- **RISK OF CHANGE:** low, but it *will* feel different to the author: Space stops working when a button holds focus after a click. That is correct; the perceived regression is real but wrong.
- **PRIORITY:** P0 (accessibility correctness; silently breaks destructive confirmations)
- **CONFIDENCE:** CONFIRMED

---

### F-03 — The CDN caching strategy is dead: two `headers()` rules set `Cache-Control` and the broader one is last

- **CLASSIFICATION:** CONFIRMED (code + documented framework behaviour)
- **EVIDENCE:** `next.config.ts:44` returns, in order: `/:path*` (security), `/_next/static/:path*` (immutable), `/api/stream` → `public, max-age=3600` (`:73-74`), then `/api/:path*` → `no-store, must-revalidate` (`:78-79`). `/api/stream` matches both. Next documents the rule: "If two headers match the same path and set the same header key, the last header key will override the first." `no-store` is last.
- **WHAT IS HAPPENING:** every `/api/*` response, including `/api/stream`, ships `no-store`. The per-route `Cache-Control: public, s-maxage=…` in `songs`, `search`, `trending`, `lyrics`, `artist/info`, `search/suggestions` is overridden at the config layer. The comment at `:70-72` ("Media proxies are cached briefly so seeking within a track hits the browser/edge cache") describes behaviour the config prevents.
- **WHY IT MATTERS:** the app's whole repeat-work performance story does not exist. Every range seek and every repeat search is a cold upstream fetch through the relay. Highest-leverage non-security fix in the repo, and it is four lines.
- **HOW IT COULD FAIL:** under load, upstreams see full volume instead of edge-deduplicated volume; `/api/stream` refetches on every seek because the browser is told not to store the bytes. It will not *break*; it will be slow and expensive — a failure nobody files a bug for.
- **COUNTERARGUMENT:** route handlers may set their own response headers that supersede config headers, so the route's `s-maxage` could still win at runtime.
- **DOES THE COUNTERARGUMENT HOLD?:** not reliably — and that is the point. Two rules claim the same key on the same path, one says `no-store`, and the documented tie-break gives it to `no-store`. Even if the route header won on some deployment, the config is still wrong and will silently change behaviour on a Next upgrade. Resolve it in config, not by header precedence.
- **RECOMMENDED ACTION:** delete the `/api/:path*` block (Next already sends `no-store` for dynamic route handlers), keep only `/api/stream`. If per-route tuning is wanted, express it with `has`/`missing` so no two rules claim one key for one path.
- **ALTERNATIVE:** one rule only; set cache policy per route from inside each handler. Fewer moving parts, less static clarity.
- **RISK OF CHANGE:** medium-low. Removing the blanket `no-store` changes `/api/location` and `/api/search/suggestions` cacheability; both already send their own `Cache-Control` (`private, max-age=300`, `public, s-maxage=120`), so intent is preserved — but this needs a `curl -I` per route, which I could not run.
- **PRIORITY:** P1
- **CONFIDENCE:** CONFIRMED for the conflict; HIGH-CONFIDENCE for wire behaviour (documented rule, not observed).

---

### F-04 — Playback history is written to `localStorage` and never read back, so it resets on every reload

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/context/PlayerContext.tsx:864-876` writes history via `addToHistory(song)` → `app/lib/offlineCache.ts:192-202` → `grovy:library.history`. The **only** reader, `getHistory()` at `app/lib/offlineCache.ts:206-208`, has no production caller (grep-verified: `offlineCache.ts` + its test only). `recentlyPlayed` (`:163`) is a separate `useState` hydrated from nothing (mount effect `:197-232` restores queue, speed, video mode only), and `app/history/page.tsx:13` renders `recentlyPlayed`.
- **WHAT IS HAPPENING:** `localStorage` accumulates a correct, capped, de-duplicated 50-entry history. The History page shows an in-memory list that starts empty on every load. The persisted copy is written on every track change and read by nobody, forever.
- **WHY IT MATTERS:** "Recently Played" is a headline feature (sidebar `:19`, ToS). It is empty on reload for every user, always. The app pays the write cost — a full deep-clone of the library on every track change (F-14) — for data it discards.
- **HOW IT COULD FAIL:** it already fails, silently and universally. A user who closes the tab loses history and concludes the app has none. No error, no warning, nothing to report.
- **COUNTERARGUMENT:** `recentlyPlayed` is deliberately session-scoped — "what I played this sitting" — and persisted history was intentionally dropped with accounts.
- **DOES THE COUNTERARGUMENT HOLD?:** no. The History page's own copy says "Songs you listen to will appear here for quick access" (`history/page.tsx:76`), its icon is `Clock`, and `addToHistory` still runs on every track with a 50-entry cap and timestamp. You do not write a timestamped ring buffer for session state. Persistence is intentional; the read is missing.
- **RECOMMENDED ACTION:** in the library-hydration effect (`:879-910`), seed `recentlyPlayed` from `readLibraryState().history`, mapping `HistoryRecord` → `Song` (drop or keep `timestamp`). One effect, ~6 lines, no schema change.
- **ALTERNATIVE:** delete `addToHistory`, `getHistory` and the `history` field; rename the page "This Session". Cheaper and honest; loses a feature users expect from a History tab.
- **RISK OF CHANGE:** low. `recentlyPlayed` outlives the session, which is the point; the `slice(0, 20)` at `:870` will trim a restored 50-entry list on first play — raise that cap or restore lazily.
- **PRIORITY:** P1
- **CONFIDENCE:** CONFIRMED

---

### F-05 — With a one-track queue and loop off, the song ends and the app silently stops responding

- **CLASSIFICATION:** CONFIRMED (logic trace)
- **EVIDENCE:** `PlayerContext.tsx:418-422` — `handleEnded` for non-YouTube: `isLoopRef.current ? (restart) : nextTrackRef.current()`. `:653-667` — `nextTrack` computes `(prev + 1) % songs.length`, which for length 1 returns the same index. `:735-739` — the source effect is keyed on `[currentSongIndex, songs[idx]?.id, songs[idx]?.url, …]`; all unchanged, so it never runs, so `audio.src` is never re-set and `load()`/`play()` never called. `:665` — `setIsPlaying(true)` runs regardless.
- **WHAT IS HAPPENING:** `setCurrentSongIndex(0)` on an index already `0` is a React no-op. `setIsPlaying(true)` flips the UI to "playing" while the audio element sits at `ended`. Nothing restarts.
- **WHY IT MATTERS:** state machine and UI disagree permanently. Play/pause shows Pause, the `Playlist` equaliser bars animate, `mediaSession.playbackState` reports `"playing"` on the lock screen, and no audio plays. Pressing pause then play restarts it, so it is recoverable — but the first impression is "the app froze".
- **HOW IT COULD FAIL:** search → tap one song → listen (extremely common) and at track end the app appears to play forever in silence. Same for a one-song playlist.
- **COUNTERARGUMENT:** auto-advancing a one-item queue is arguably wrong; stopping is semantically correct and the user gets a silent, harmless end-of-track.
- **DOES THE COUNTERARGUMENT HOLD?:** the semantic point is fine; the *implementation* is not. Stopping correctly means `setIsPlaying(false)` and leaving `currentTime` at `duration`. The code sets `isPlaying(true)` — the opposite of stopping. The counterargument defends behaviour the code does not have.
- **RECOMMENDED ACTION:** in `handleEnded` and `nextTrack`, split "advance" from "resume": if `songs.length === 1 && !isLoop`, `setIsPlaying(false)` and return before `setCurrentSongIndex`. Then change the unconditional `setIsPlaying(true)` to resume only when `isPlayingRef.current` was already true.
- **ALTERNATIVE:** keep `setIsPlaying(true)` but add a monotonic `playToken` to the source effect's deps that `nextTrack` increments, forcing a reload at the same index. Fixes the symptom, keeps the wrong `isPlaying` semantics.
- **RISK OF CHANGE:** low, but `setIsPlaying(true)` on skip is load-bearing for YT (`loadVideoById` is called only when `isPlayingRef.current`). Fix the audio path first and test YT separately.
- **PRIORITY:** P1
- **CONFIDENCE:** CONFIRMED by trace; not observed.

---

### F-06 — `localStorage` is parsed and cast with zero validation, so persisted or imported data reaches React unvalidated

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/lib/localStore.ts:82-90` — `readJson()` does `JSON.parse(raw)` and returns `parsed as T`. `:99-110` — `readLibrary()` does `Array.isArray(raw?.playlists) ? (raw.playlists as PlaylistRecord[]) : []`, i.e. array-shape check only, no element validation. `:113-131` — preferences and search history follow the same pattern (`typeof storedPrefs === "object"`). `SongSchema` (`app/types/song.ts:3-11`) exists and is applied in exactly two places: `app/api/songs/route.ts:205` and `app/api/search/route.ts` and `app/lib/discovery.ts`. It is never applied to a `localStorage` read, nor to the import path (`app/playlists/page.tsx:57-59`, which passes `pl.songs` straight into `createPlaylist`).
- **WHAT IS HAPPENING:** every persisted song, playlist and favourite is trusted by shape of container only. A `playlists` array containing `[null]` or `[{ name: 1 }]` or a song missing `url` loads successfully and is rendered.
- **WHY IT MATTERS:** this is the one place where untrusted input can enter React state without a schema check. Two realistic vectors: (a) a hand-edited or malformed import file; (b) any same-origin script (an XSS, or a browser extension) writing `grovy:library`. Downstream, `getHDThumbnail(song.cover)` with a non-string `cover` returns `undefined` (safe), but `playlist.songs.map(song => song.id)` with a `null` element throws during render, and `songs[currentSongIndex].url` feeds `new URL(undefined, origin)` which throws inside a `useEffect` and is swallowed into a broken audio state.
- **HOW IT COULD FAIL:** a user imports an old export that a previous version wrote with a different song shape; the Library page renders "Playlist Not Found" or a blank grid instead of a clear "this file is incompatible" message, and the corrupted array is now persisted. Or a single bad entry in `favorites` crashes the Favourites page on every visit with no way to recover except clearing site data.
- **COUNTERARGUMENT:** the data is yours; there is no multi-user threat model, and a user who corrupts their own storage can clear it. Validating on every read costs CPU on the hydration path, and Zod parsing 50–200 songs on every page load is not free.
- **DOES THE COUNTERARGUMENT HOLD?:** partly on threat model, not on cost. The cheap version is not "validate every read" — it is validate **at the two write boundaries that accept external input** (the import handler) and **once at hydration** (`readLibrary`), then trust the in-memory copy (which is already the design — `memoryLibrary` is the source of truth after hydration). That is two `safeParse` calls per page load, not 200. And a user cannot clear data they cannot reach: if `favorites` crashes the app, the only route back is devtools → Application → Clear, which most users will never find.
- **RECOMMENDED ACTION:** add `PlaylistSchema` and `HistoryRecordSchema` next to `SongSchema`. In `readLibrary()`, run `z.array(SongSchema).safeParse` on `favorites` and `z.array(PlaylistSchema).safeParse` on `playlists`, dropping invalid entries rather than failing the whole read (partial recovery beats a blank page). In `handleImport`, validate each playlist before `createPlaylist`.
- **ALTERNATIVE:** validate only in `handleImport` and leave hydration permissive. Cheaper, but leaves the XSS/extension vector and the self-corruption vector open.
- **RISK OF CHANGE:** low. Dropping invalid entries changes "page crashes" into "some songs missing", which is strictly better, but a schema that is too strict (e.g. requiring `duration`) will silently drop legitimate old entries. Use `.passthrough()`/optional fields to match `SongSchema`'s existing leniency.
- **PRIORITY:** P1
- **CONFIDENCE:** CONFIRMED

---

### F-07 — The queue is persisted into the same JSON blob as theme, volume and EQ, unbounded, on every index change

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `PlayerContext.tsx:634-638` — `useEffect(() => { if (songs.length > 0) void patchGrovyPrefs({ queue: { songs, index: currentSongIndex } }) }, [songs, currentSongIndex])`. `app/lib/localStore.ts:181-190` — `patchPreferences` spreads the whole preference object and rewrites the entire `grovy:preferences` key. `PlayerContext.tsx:202-207` reads it back on mount.
- **WHAT IS HAPPENING:** the full `Song[]` (each with `id`, `title`, `url`, `artist`, `cover`, `genre`, `duration`, `source`) is serialised into `grovy:preferences` alongside `theme`, `volume`, `equalizer`, `playbackSpeed`, `videoMode`, `crossfadeEnabled`, `normalizationEnabled`. `songs` is unbounded: `setQueue` is called with search results (up to 24), a whole playlist (unbounded), or a radio queue. There is no cap and no eviction.
- **WHY IT MATTERS:** `localStorage` is a shared ~5 MB origin quota across **all** keys — `grovy:preferences`, `grovy:library`, `grovy:cache-songs`, `grovy:cache-searches`, plus anything else on the origin. A 500-song playlist with long Saavn CDN URLs (each `downloadUrl` is 200–400 chars, percent-encoded inside the stream URL, so realistically 400–700 chars per song after `encodeURIComponent`) is roughly 250–350 KB. Add history (50 entries), favourites, and the two caches, and a heavy user approaches the ceiling. When the quota trips, `writeJson` (`localStore.ts:92-99`) **silently swallows** the error — so the *most recently written* preference (which is the queue, because it writes on every track change) fails first, while theme/volume succeeded earlier. The failure is invisible and non-deterministic.
- **HOW IT COULD FAIL:** a user with a large playlist finds their theme choice and volume resetting randomly after a while — because the queue write blew the quota and took the rest with it, or because a later `patchPreferences` spread a stale object. There is no error surfaced, so this is unreportable.
- **COUNTERARGUMENT:** persisting the queue is a genuine feature — "reopen the tab and your queue is there" — and it is the reason the app feels stateful. Moving it to its own key is cosmetic.
- **DOES THE COUNTERARGUMENT HOLD?:** the feature is real; the storage design is not defensible. Three concrete defects sit on top of the quota risk: (1) **write amplification** — every skip rewrites the entire preference blob, including the entire queue; (2) **coupling** — a queue write failure corrupts theme/volume persistence because they share one `setItem`; (3) **unbounded growth** — no cap, so the blob size is a function of playlist length. Separating `grovy:queue` into its own key fixes all three and keeps the feature.
- **RECOMMENDED ACTION:** move the queue to `grovy:queue` (own key, own `writeJson`), cap it at a sane size (e.g. 200 songs, storing only `id`/`title`/`artist`/`cover`/`url`/`source`/`duration`), and drop the persist effect's dependency on every index change — persist on `songs` change and on `pagehide`/`visibilitychange` rather than on every skip.
- **ALTERNATIVE:** store only queue *ids* and rehydrate metadata from `grovy:cache-songs`. Smallest blob; breaks if the cache evicted an entry.
- **RISK OF CHANGE:** medium. A schema change means existing users lose their saved queue once (acceptable — it is transient state) unless a migration reads the old `preferences.queue` on first load. Do that migration, it is 5 lines.
- **PRIORITY:** P1
- **CONFIDENCE:** CONFIRMED for the code paths; the quota arithmetic is an estimate, clearly labelled.

---

### F-08 — `TrackCard` nests a real `<button>` inside a `role="button"` container, producing an invalid accessibility tree

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/page.tsx:128-137` — `<motion.div role="button" tabIndex={0} onClick={onPlay} onKeyDown={…}>`. Inside it, `:159-171` renders `<motion.button aria-label="Play">` and `:173-186` renders `<motion.button aria-label="Add to favorites">`. Nesting interactive content inside `role="button"` is invalid per ARIA: a `button` role's descendants are presentational by definition, so assistive tech is entitled to ignore the two nested buttons entirely.
- **WHAT IS HAPPENING:** the card is a focusable fake button containing two real buttons. Screen readers may announce one button ("…, button") and hide the Play and Favourite affordances; or they may announce three overlapping buttons with no hierarchy. Either way the card has no accessible *name* — the `role="button"` div has no `aria-label` and its text content is the title + artist, which is announced as the button's name, so the user hears "Song Title Artist, button" with no indication that activating it plays the song.
- **WHY IT MATTERS:** the home grid is the primary interaction surface of the app. Every card in it is mis-announced. This is the single most-repeated a11y defect in the codebase (it is the same pattern as the history/favourites cards, except those use `onClick` on a plain `div` with no `role` at all — which is *less* wrong only because it is not focusable, meaning keyboard users cannot reach them at all).
- **HOW IT COULD FAIL:** a screen-reader user cannot tell play from favourite, cannot reliably activate the card, and hears a confusing double/triple button. A keyboard user tabs to the card, presses Space (see F-02 — which now does the *wrong* thing), and gets no clear result.
- **COUNTERARGUMENT:** the nested buttons `stopPropagation`, so mouse behaviour is correct, and most users are mouse/touch. The div's `role`/`tabIndex` was added specifically to make the card keyboard-reachable, which is better than a bare `div`.
- **DOES THE COUNTERARGUMENT HOLD?:** the "better than a bare div" part is true and worth acknowledging. It does not survive ARIA's descendants-presentational rule, which is normative, not stylistic. The correct pattern is one of: (a) the card is a plain `div` with a single `<button>` covering the artwork that carries an `aria-label` with title+artist, plus separate favourite button; or (b) keep the `role="button"` div but make it the *only* interactive element and move Play/Favourite into a context menu.
- **RECOMMENDED ACTION:** option (a). Replace the `motion.div role="button" tabIndex={0} onKeyDown` with a plain `motion.div`, and make the play overlay a real `<button>` with `aria-label={\`Play ${song.title} by ${song.artist}\`}` that spans the artwork. Apply the same to `app/history/page.tsx:52-56` and `app/favorites/page.tsx:80-83`, which are `onClick` divs with no keyboard path at all.
- **ALTERNATIVE:** keep the card focusable and add `aria-hidden="true"` + `tabIndex={-1}` to the nested buttons, exposing only the card. Simpler, but loses discrete favourite control.
- **RISK OF CHANGE:** low. Visual output is unchanged; hover/tap CSS selectors that depend on `group` keep working. The main risk is `whileTap`/`whileHover` on the outer `motion.div` combined with a button inside, which needs a quick visual check.
- **PRIORITY:** P1
- **CONFIDENCE:** CONFIRMED (ARIA rule is normative)

---

### F-09 — `nextTrack` resumes playback unconditionally, including when the user had deliberately paused

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `PlayerContext.tsx:653-667` — `nextTrack` ends with `setIsPlaying(true)` outside any condition. `previousTrack` (`:674-684`) does the same. Both are reachable from: the prev/next buttons (`PlayerControls.tsx:64,92`), the media session handlers (`:1288-1290`), the keyboard handler (`F-02`), and `handleEnded`.
- **WHAT IS HAPPENING:** a paused player that receives a Next command starts playing. There is no "paused, advance, stay paused" path.
- **WHY IT MATTERS:** queue *browsing* is a real activity. A user pauses, then uses Next to look at what is coming up (skip forward a few tracks to see titles in the player), and each press starts audio. On the lock screen, pressing Next while paused starts playback in a pocket. This is the difference between a player that respects a pause and one that does not — and it directly contradicts the `pause()` API (`:700`) which exists precisely to express "stay paused".
- **HOW IT COULD FAIL:** paused → Next → music blares. Users learn not to touch Next while paused, which is an invisible tax on the whole queue UI.
- **COUNTERARGUMENT:** most players *do* resume on Next — Spotify and YouTube both start playing when you skip while paused — because "next track" is overwhelmingly a playback intent, not a browsing intent.
- **DOES THE COUNTERARGUMENT HOLD?:** **yes, largely.** This is the weakest P1 finding in the document and I am flagging that honestly. Spotify does resume on skip. So the *unconditional* `setIsPlaying(true)` on `nextTrack` is defensible product behaviour. What is **not** defensible is the same line firing when the advance is a **no-op** (F-05): there is no new track, so "resume" has nothing to resume, and it produces the false-playing state. So this finding collapses into F-05 and should be **demoated**: keep `setIsPlaying(true)` on a real skip, guard it against the same-index case.
- **RECOMMENDED ACTION:** do not change skip-while-paused semantics. Only fix the same-index case (F-05). Treat the "resume on skip" behaviour as correct and document it.
- **ALTERNATIVE:** n/a.
- **RISK OF CHANGE:** changing this *would* be a regression against user expectation.
- **PRIORITY:** **P3 — downgraded, effectively withdrawn as an independent finding.** Recorded because the adversarial brief requires me to state where my own criticism fails.
- **CONFIDENCE:** CONFIRMED behaviour; the "it is a problem" judgement is **rejected**.

---

### F-10 — The CSP is present, production-shaped, and provides no XSS mitigation for the app's own inline scripts

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `next.config.ts:16` — `script-src 'self' 'unsafe-inline' …` with `'unsafe-eval'` only in dev (correct). `app/layout.tsx:215`, `:233`, `:239`, `:246`, `:253` — four `dangerouslySetInnerHTML` scripts: a theme-color observer, three JSON-LD blobs, and a service-worker registration block. With `'unsafe-inline'` in `script-src`, an injected inline `<script>` executes. There is no `nonce`, no `strict-dynamic`, no `middleware.ts` to mint one (confirmed absent), and no `proxy.ts` (confirmed absent).
- **WHAT IS HAPPENING:** the app ships a strict-looking CSP (`object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, no `unsafe-eval` in prod) whose single most important directive — `script-src` — is effectively disabled for the injection case. The policy blocks nothing that matters.
- **WHY IT MATTERS:** CSP is the last line of defence against XSS. With `'unsafe-inline'`, the last line is absent. The app's actual XSS surface is small (no `innerHTML` with user data anywhere — I checked; React escapes everything, and the only `dangerouslySetInnerHTML` payloads are static or `JSON.stringify` of static objects), so this is **defence-in-depth being claimed but not delivered**, not an open hole. That distinction matters and I am not going to inflate it.
- **HOW IT COULD FAIL:** if a future change interpolates upstream data into the JSON-LD blobs (they currently use only `APP_NAME`/`APP_URL`, but `webApplicationSchema` already includes `softwareVersion: "latest"` and could easily grow a user-influenced field), `JSON.stringify` does **not** escape `</script>`, and `'unsafe-inline'` guarantees execution. Today: no live vector found.
- **COUNTERARGUMENT:** the JSON-LD payloads are static, the theme script is static, and the SW registration is static — so `'unsafe-inline'` is required for legitimate functionality and removing it would break all four. A nonce requires middleware, which the app deliberately does not have (fully static-friendly, no server state).
- **DOES THE COUNTERARGUMENT HOLD?:** substantially. This is a real constraint, and the app's choice of "no middleware, static-friendly" is a legitimate architectural decision. But the *mitigation* is available and cheap: `JSON.stringify(x).replace(/</g, '\\u003c')` on the JSON-LD blobs removes the only realistic injection path, and the three static scripts could move to a nonce-less-but-hashed approach or simply be accepted. So the recommendation is not "rewrite the CSP" — it is "stop shipping a CSP that reads as protection and isn't, and harden the one interpolation point that will eventually grow."
- **RECOMMENDED ACTION:** (1) escape `<` in all `JSON.stringify` payloads passed to `dangerouslySetInnerHTML`; (2) add a code comment at `next.config.ts:16` stating plainly that `'unsafe-inline'` is required by the four static inline scripts and that `script-src` therefore does not mitigate injection — so nobody later mistakes the policy for a control; (3) consider a build-time script hash (`'sha256-…'`) for the three static blocks, which needs no middleware and would let `'unsafe-inline'` go.
- **ALTERNATIVE:** adopt `middleware.ts` with a per-request nonce. Correct, but reverses the no-server-state design for marginal gain.
- **RISK OF CHANGE:** low. Escaping `<` is behaviour-preserving for JSON-LD.
- **PRIORITY:** P2
- **CONFIDENCE:** CONFIRMED for the policy; **no live XSS vector found**, stated explicitly.

---

## 6. Findings — P2

### F-11 — `PlayerContext` is a 1,326-line single context with 26 state atoms; every consumer re-renders on `currentTime`

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `PlayerContext.tsx` — 1,326 lines, 26 `useState` (`:155-193`), 24 `useRef`, 23 `useEffect`. `currentTime` is state (`:158`) updated ~1 Hz for audio (`:402-406`) and polled at 2 Hz for YouTube (`:361-390`). `value` is a `useMemo` (`:1219-1278`) over a dependency array containing `currentTime`, `duration`, `volume`, `colors`, `songs`, `favorites`, `playlists`. `usePlayer()` is called by 17 components including `Navbar` (`:22`), `BottomPlayer`, `Playlist`, `LyricsView`, `AmbientBackground`.
- **WHAT IS HAPPENING:** a context whose value changes once per second is consumed by the fixed navbar, the sidebar, the ambient background (whose `AnimatePresence` blobs re-key on `colors`), and the full-screen player. React context has no selector: every consumer re-renders on every `currentTime` tick. `AmbientBackground` destructures `{ colors, isPlaying }` — so it re-renders once a second to produce identical output.
- **WHY IT MATTERS:** the app has a 2 Hz render floor across the entire component tree whenever audio plays, plus a 1 Hz floor from the YT poll. On a mid-range Android this competes with the framer-motion blob animations and the equaliser bars for main-thread time. It is not a crash; it is a permanent battery and scroll-jank tax that no profiling session will attribute correctly because each individual component "looks fine".
- **HOW IT COULD FAIL:** scroll on the history grid (200+ framer-motion `layout` nodes) stutters while playing and is smooth when paused — a symptom users report as "the app gets laggy with music on" and which is nearly impossible to bisect from that description.
- **COUNTERARGUMENT:** the `useMemo` prevents *provider* re-renders; consumers are mostly small; React 19's compiler and batching may absorb much of it; splitting the context is a large, risky refactor that touches every one of the 17 consumers.
- **DOES THE COUNTERARGUMENT HOLD?:** the "risky refactor" point is true — that is exactly why this is P2 and not P1. But the *cheap* half of the fix is not a refactor at all: move `currentTime` and `duration` out of context into a dedicated subscription (`useSyncExternalStore` over the audio element, or a separate `PlaybackTimeContext` consumed only by `MusicPlayer`, `PlayerControls` and `LyricsView`). That single change removes the 2 Hz floor from twelve of the seventeen consumers without touching their APIs. `volume`/`colors`/`playlists` can stay.
- **RECOMMENDED ACTION:** phase 1 (cheap): split `currentTime` + `duration` into their own context. Phase 2 (later): split library (favourites/playlists/history) from playback (queue/transport) from device settings (EQ/crossfade/sleep timer). Never attempt big-bang.
- **ALTERNATIVE:** adopt a store library (`zustand` — ~1 KB, selector-based). Correct long-term, adds a dependency the project has deliberately avoided.
- **RISK OF CHANGE:** medium for phase 1 (touches the render loop), high for phase 2. Do it after F-04 and F-05 are fixed, so you are not debugging a refactor against live bugs.
- **PRIORITY:** P2
- **CONFIDENCE:** CONFIRMED for the structure; the magnitude of jank is LIKELY (not measured).

---

### F-12 — Song mapping is implemented three times with three different field precedences

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/api/songs/route.ts:88-118` (id-branch mapping), `:160-206` (search mapping), `app/api/search/route.ts:62-110`, `app/lib/discovery.ts:53-78`. All four map Saavn items → `Song` and YouTube items → `Song`. Divergences I can name from the source:
  - Saavn `genre`: `"Unknown"` in `songs/route.ts:104`, `GENRES[index % GENRES.length]` in `:172`, `"YouTube"` for YT items in `:186`, `"Unknown"` in `search/route.ts`. So the same Saavn track gets a different genre depending on which endpoint returned it.
  - Saavn `duration`: `Number(item.duration)` everywhere except `discovery.ts:70`, which is the same — but `search/route.ts:92` passes `duration: item.duration` **uncoerced**, so a string duration survives into a field typed `number` (see F-19).
  - Saavn `cover`: `pickCover(item)` in three files; `search/route.ts:63-64` re-implements it inline with subtly different array handling.
  - YouTube `title`: `item.title || item.name || item.fallbackTitle || "Untitled"` in `songs/route.ts:184`; `item.name || item.title || …` (reversed) in `search/route.ts:101`; `item.title ?? item.name ?? …` in `discovery.ts:33`.
  - YouTube `duration` default: `180` fallback in `songs/route.ts:191` and `search/route.ts:113`; `0` in `discovery.ts:39` and `trending/route.ts`.
- **WHAT IS HAPPENING:** four copies of one mapping, already diverged on five fields.
- **WHY IT MATTERS:** `genre` is not rendered anywhere in the UI (grep-verified: zero `.genre` reads in `*.tsx`), so the genre divergence is currently *cosmetic dead weight* — which is itself evidence the field is speculative. The `duration` divergence is **not** cosmetic: `PlayerContext` uses `duration` for the seek bar and for the "prefetch when within 15 s of the end" heuristic (`:855-878`). A string `duration` from `/api/search` produces `NaN` comparisons, so the prefetch never fires on those tracks. And the reversed title precedence means the same video can display a different title depending on whether it arrived via `/api/songs` or `/api/search`.
- **HOW IT COULD FAIL:** a track opened from the command palette (which goes through `/api/songs`) shows a different title than the same track from a search result page; its prefetch silently never runs, so it stutters at the end while others are gapless — and the two symptoms are never connected because they are 600 lines apart.
- **COUNTERARGUMENT:** the routes genuinely differ — `songs` interleaves two sources, `search` filters by entity type, `discovery` has a fallback chain — so a single mapper would need flags and would be harder to read than four concrete ones.
- **DOES THE COUNTERARGUMENT HOLD?:** the routing differences are real; the *field mapping* differences are not required by them. `pickArtist`/`pickCover`/`parseDuration` already live in `apiHelpers.ts` and prove a shared mapper can coexist with divergent orchestration. `discovery.ts` is the model: shared `toSaavnSong`/`toYouTubeSong`, route-specific fallback logic on top. The counterargument also fails on its own terms because `pickCover` *is* already shared and still re-implemented inline in `search/route.ts:63` — the divergence is drift, not design.
- **RECOMMENDED ACTION:** move `toSaavnSong`/`toYouTubeSong` from `discovery.ts` into `apiHelpers.ts` (or a new `songMapper.ts`), export them, and delete the three inline copies. Pick one title precedence (`title ?? name ?? fallbackTitle`), one duration coercion (`Number(x) || 0`), and decide whether `genre` exists — if it is never rendered, remove it from `SongSchema` and stop computing it.
- **ALTERNATIVE:** leave the duplication, add a shared test asserting all four routes produce identical output for a fixture item. Catches drift, does not prevent it.
- **RISK OF CHANGE:** low-medium. Title precedence changes are user-visible, so pick the one that matches current majority behaviour (`title`-first: `songs/route.ts` and `discovery.ts` agree on `title ?? name`).
- **PRIORITY:** P2
- **CONFIDENCE:** CONFIRMED

---

### F-13 — `/api/songs` returns `rawSongs` and then shadows the name with a second, differently-shaped `rawSongs`

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/api/songs/route.ts:111` — `return Response.json(rawSongs, { headers: corsHeaders })` (id-branch result, unvalidated, `corsHeaders` only). `:145` — `const saavnRaw = …`. `:198` — `const rawSongs = []` — a **second declaration of `rawSongs` in the same function scope** as the `:111` reference. `:205-213` — two different return shapes for the two branches: `validSongs` (no headers) when Zod fails, `result.data` with `Cache-Control` when it passes.
- **WHAT IS HAPPENING:** two code paths in one handler return structurally different responses. The id-branch (`?id=…&type=album|playlist|artist`) validates **nothing** and returns objects whose `duration` comes from `Number(item.duration) || parseDuration(...)` with no schema check, and returns `corsHeaders` but **no** `Cache-Control`. The search branch validates with Zod and returns `Cache-Control` but, on validation failure, returns **neither** `Cache-Control` nor `corsHeaders`.
- **WHY IT MATTERS:** three separate defects. (a) The id-branch is the *only* `/api/songs` path without validation, and it is the path that fetches arbitrary album/playlist/artist payloads — the largest upstream surface. (b) The Zod-failure path drops CORS headers, so a client fetching a partially-invalid album from a cross-origin context gets an opaque failure instead of a partial result — and the app's own `apiHelpers` consumers will see a network error, not partial data. (c) The `rawSongs` shadowing means a reader (or a future refactor) can easily assume `:111` and `:198` are the same variable.
- **HOW IT COULD FAIL:** an album page for a playlist with one malformed track returns partial data *without* CORS headers; the app's fetch fails wholesale and shows "couldn't load", even though 19 of 20 tracks were valid. Or: the id-branch's unvalidated payload includes a `null` title, which reaches `SongSchema`-typed state and renders "Untitled" or crashes a `.toLowerCase()` downstream.
- **COUNTERARGUMENT:** the id-branch predates the search branch and is rarely exercised (only album/playlist/artist drill-down); the shadowing is legal JavaScript `let`/`const` shadowing if the scopes nest, so it is not a bug.
- **DOES THE COUNTERARGUMENT HOLD?:** the shadowing being legal is true but irrelevant — it is a readability defect I am reporting as such, not as a crash. The validation gap is the real finding, and "rarely exercised" does not hold: `app/lib/api.ts:160` exposes `search(query, type)` which hits `/api/search`, but the *id* branch is reachable from any client calling `/api/songs?id=…&type=album`, unauthenticated, with an arbitrary upstream payload. Rare in the UI ≠ rare on the wire.
- **RECOMMENDED ACTION:** run `z.array(SongSchema).safeParse` on the id-branch result too, return valid-subset + full CORS headers on failure, and rename the second `rawSongs` to `interleaved` (it is an interleaved merge of `saavnSongs`/`ytSongs`).
- **ALTERNATIVE:** extract the whole handler into `albumId()`, `searchQuery()` and `trendingQuery()` functions, each returning one shape. Larger change, permanently prevents the divergence.
- **RISK OF CHANGE:** low. Renaming is mechanical; adding validation can only remove invalid songs, and the existing Zod-failure path already demonstrates the intended fallback.
- **PRIORITY:** P2
- **CONFIDENCE:** CONFIRMED

---

### F-14 — Cross-tab library sync triggers a write-back loop: another tab's change is saved straight back to storage

- **CLASSIFICATION:** CONFIRMED (code trace)
- **EVIDENCE:** `localStore.ts:243-259` — `subscribeLibrary` sets `hydrated = false` and calls `onChange()` on a `storage` event. `PlayerContext.tsx:898-905` — `subscribeLibraryRealtime(() => refreshLibraryState())`, and `refreshLibraryState` (`:886-892`) calls `setFavorites(...)` / `setPlaylists(...)` with **new array references** from `readLibraryState()` (which returns `clone(memoryLibrary)`, `localStore.ts:139-142`). `PlayerContext.tsx:912-922` — two effects gated on `isLibraryHydrated` that call `saveFavorites(favorites)` / `savePlaylists(playlists)` whenever those arrays change identity. `offlineCache.ts:172-175, 182-185` → `writeLibrarySection` → `writeLibraryState` → `storage.setItem` (`localStore.ts:148-170`).
- **WHAT IS HAPPENING:** Tab A writes → browser fires `storage` in Tab B → Tab B re-reads (fresh references) → Tab B's save effects see new references → Tab B calls `setItem` with the identical logical content → browser fires `storage` in Tab A → Tab A re-reads → Tab A saves → … The comment at `localStore.ts:145-147` correctly notes that in-tab writers do not re-enter their *own* listener, and that is true — but it does not address the **two-tab ping-pong**, because Tab B's write is a *different tab's* write from Tab A's perspective.
- **WHY IT MATTERS:** the loop does not run forever, because `storage` events only fire when the stored value **changes** (browsers suppress no-op writes to identical strings). `writeLibraryState` does `JSON.stringify(memoryLibrary)` — key order is insertion-stable from `readLibrary`, so the strings will be byte-identical and the browser will suppress the second hop. So this terminates after one extra round-trip. **I am therefore not claiming an infinite loop.** What it *does* do, reliably: every cross-tab change causes a full library deep-clone + `JSON.stringify` + `setItem` in the other tab, on every change. On a large library (playlists with hundreds of songs), that is a 200–400 KB serialise per change per open tab — and it fires on *every* favourite toggle.
- **HOW IT COULD FAIL:** a user with the app open in two tabs and a large playlist toggles a favourite 10 times — 10 × 2 tabs × full-library serialise. On a slow disk/phone this produces visible input lag on the heart button, and the pre-existing quota risk (F-07) becomes more likely to trip because two tabs are writing the same blob.
- **COUNTERARGUMENT:** the `hydrated` reset and the `clone` are deliberate, the comments show the author reasoned about the self-write case, and one extra round-trip is negligible.
- **DOES THE COUNTERARGUMENT HOLD?:** mostly, on correctness — and I am downgrading severity accordingly. It does not survive on cost: the fix is an equality guard, which is three lines and removes the amplification entirely. The absence of the guard is a real omission, not a style choice, because the surrounding comments demonstrate the author *tried* to solve exactly this class of problem.
- **RECOMMENDED ACTION:** in the two save effects, skip the write if the incoming array is deep-equal to `readLibraryState().favorites` / `.playlists`. Cheapest correct form: compare a cheap signature (length + concatenated ids) before calling `saveFavorites`/`savePlaylists`. Optionally add a `lastWrittenSignature` ref in `localStore` to make `writeLibrarySection` a no-op on identical content.
- **ALTERNATIVE:** have `subscribeLibrary` pass the parsed new value to `onChange`, so the consumer sets state that is *derived from* the event and marks it as remote (skip next save via a ref). More invasive, fully correct.
- **RISK OF CHANGE:** low, but a naive deep-equal on 500 songs per keystroke would be worse than the problem — use the signature approach.
- **PRIORITY:** P2
- **CONFIDENCE:** CONFIRMED for the code paths and the amplification; **explicitly not claiming an infinite loop** (browsers suppress identical-value `storage` writes, and the serialisation is stable).

---

### F-15 — `/api/location` makes an unauthenticated third-party call on every cold request, trusting spoofable headers

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/api/location/route.ts:43-70` — `getClientIp` prefers `cf-connecting-ip` / `x-real-ip`, falls back to the first `x-forwarded-for` entry, with a comment asserting platform headers "cannot be spoofed by clients". `:117-165` — `GET` tries geo headers first; if none produce a label, `await lookupByIp(getClientIp(request))`. `:79-112` — `lookupByIp` calls `ipapi.co` (per the `connect-src` comment in `next.config.ts:17`). No cache, no rate limit, no allowlist of caller origins. Called from `app/page.tsx:86` on every home-page load.
- **WHAT IS HAPPENING:** on any non-Vercel/non-Cloudflare deployment (including `next start` on a VPS, or a Docker host behind a generic proxy), none of `x-vercel-ip-*`/`cf-*` are set, and `x-forwarded-for` is client-controlled unless the proxy strips it. So a caller can send `X-Forwarded-For: <arbitrary>` and the route forwards that IP to `ipapi.co`.
- **WHY IT MATTERS:** two independent issues. (a) **Correctness/trust:** the comment's claim that `x-forwarded-for` is "less trusted and only used as fallback" is honest, but the fallback is unconditional — there is no deployment check, so on a self-hosted deploy it *is* the primary path and it *is* spoofable. (b) **Amplification:** an anonymous caller can make the deployment issue one `ipapi.co` request per hit, with an attacker-chosen IP, unmetered. `ipapi.co` free tier is rate-limited **per originating IP**, so the deployment's shared egress IP gets throttled by *anyone* doing this — degrading the greeting for every real user, not just the attacker.
- **HOW IT COULD FAIL:** a script hits `/api/location` with random `X-Forwarded-For` values; `ipapi.co` starts returning 429 to the deployment's egress IP; every real user's home page falls back to `"your area"` permanently until the window resets. Nobody sees an error; the greeting just stops working.
- **COUNTERARGUMENT:** the greeting is decorative — `app/page.tsx:249-256` falls back to a locale-derived label and then to `"your area"` — so nothing breaks when the lookup fails. And `Cache-Control: private, max-age=300` (`:143`) means a *browser* only asks 12 times an hour.
- **DOES THE COUNTERARGUMENT HOLD?:** the "decorative, degrades gracefully" point is fully correct and substantially reduces severity — this is why it is P2 and not P1. But "browser caches it" protects legitimate users, not the endpoint: the attacker does not send `Cache-Control`. And the third-party rate limit is keyed to the *deployment's* IP, which is the shared resource. So the counterargument reduces blast radius without removing the amplification.
- **RECOMMENDED ACTION:** gate `lookupByIp` behind a positive deployment check (only call it when `process.env.VERCEL` is set, or when an explicit `ALLOW_IP_LOOKUP` env var is present); otherwise return the header-derived label or the `fallback` payload. Additionally validate that the IP is a well-formed public address (the file already has `isPrivateOrLocalIp` at `:68`) **before** calling out.
- **ALTERNATIVE:** drop the IP lookup entirely and rely on `Intl` locale + geo headers. The greeting degrades to "your area" on self-hosted deploys, which is acceptable for a decorative label.
- **RISK OF CHANGE:** low. On Vercel nothing changes; on self-hosted the greeting becomes less specific.
- **PRIORITY:** P2
- **CONFIDENCE:** CONFIRMED for code; the 429 outcome is LIKELY (depends on `ipapi.co`'s current policy, which I did not query).

---

### F-16 — Service worker caches `.mp3` under a stale-while-revalidate policy but never honours the app's own cache-busting

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `public/sw.js:44-47` — `isRuntimeAsset` returns true for `/\.(?:png|jpg|jpeg|svg|webp|ico|woff|woff2|mp3)$/i`. `:49-78` — `staleWhileRevalidate` returns the cached response immediately and updates in the background. `:71-75` — `if (request.method !== "GET") return; if (request.headers.has("range")) return;`.
- **WHAT IS HAPPENING:** all same-origin `.mp3` requests are served cache-first. Range requests are excluded, which is correct for seeking — but a *non*-range `.mp3` request (the initial load of a local file) is cached with no expiry and no version key tied to the file's content.
- **WHY IT MATTERS:** currently **inert**, because `public/songs.json` is `[]` and there are no `.mp3` files in `public/`. So this is a *latent* defect, not an active one — and I am classifying it as such. The reason to fix it anyway: the README advertises local-file playback (`public/songs`), so the first user who replaces a file with a same-named one gets the old audio forever, with no UI indication and no cache-clear affordance (the Equalizer/Settings UI has no "clear cache" button; `clearOfflineCache()` exists in `offlineCache.ts:157-164` and is **dead code** — no caller).
- **HOW IT COULD FAIL:** a user drops `song.mp3`, plays it, replaces it with a better rip of the same filename, reloads, and hears the old file — indefinitely. They conclude the player is broken.
- **COUNTERARGUMENT:** there are no mp3s in the repo, `generate-manifest.js` produces an empty manifest, and range requests bypass the cache anyway so streaming is unaffected.
- **DOES THE COUNTERARGUMENT HOLD?:** on current state, yes — this changes nothing today. It does not hold against the README's advertised feature, and it does not hold once anyone adds a file. The correct verdict is "latent, cheap to fix, currently inert", which is what I am recording.
- **RECOMMENDED ACTION:** drop `mp3` from `isRuntimeAsset`. Audio files are large and user-managed; caching them in a service worker with no invalidation is strictly worse than the HTTP cache. If local-file offline support is wanted later, cache by a content hash written by `generate-manifest.js` rather than by filename.
- **ALTERNATIVE:** keep mp3 caching but key the cache on `?v=<mtime>` injected by the manifest generator.
- **RISK OF CHANGE:** very low; currently affects zero requests.
- **PRIORITY:** P2 (latent)
- **CONFIDENCE:** CONFIRMED for the code; **inert today**, stated explicitly.

---

## 7. Findings — P3, dead code, and product-truth gaps

### F-17 — Four different canonical domains; SEO metadata, sitemap and package.json disagree

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/lib/seo.ts:6` — `FALLBACK_SITE_URL = "https://grovy.vercel.app"`. `package.json` — `homepage: "https://grovy.archduke1337.is-a.dev"`. `public/robots.txt:22` — `Sitemap: https://grovy.vercel.app/sitemap.xml`. `app/layout.tsx:51,171` — author URL `https://archduke.is-a.dev`. `app/layout.tsx:23` — `APP_URL = getSiteUrl()`, which is `NEXT_PUBLIC_SITE_URL || NEXT_PUBLIC_APP_URL || FALLBACK`. There is no `.env*` file in the repo (gitignored, and none present) and README says "No environment variables … are required."
- **WHAT IS HAPPENING:** with no env var set — the documented default — every canonical URL, OG image URL, JSON-LD `url`, and the sitemap resolves to `grovy.vercel.app`, while `package.json` and README advertise `grovy.archduke1337.is-a.dev`, and `robots.txt` hardcodes `grovy.vercel.app` independently of `seo.ts`.
- **WHY IT MATTERS:** duplicate-canonical confusion for search engines, and OG cards pointing at a domain that may not be the deployment. `robots.txt` is a static file, so it cannot follow `NEXT_PUBLIC_SITE_URL` — meaning even a correctly-configured deployment advertises the wrong sitemap URL.
- **HOW IT COULD FAIL:** deploy to the `is-a.dev` domain, set `NEXT_PUBLIC_SITE_URL`, and `robots.txt` still points crawlers at `grovy.vercel.app/sitemap.xml`. Google indexes whichever host it reaches; the two hosts are treated as duplicates.
- **COUNTERARGUMENT:** `grovy.vercel.app` may be the live production deployment and `is-a.dev` may be aspirational or a redirect. `robots.txt` is static by necessity, so some duplication is unavoidable.
- **DOES THE COUNTERARGUMENT HOLD?:** the static-file constraint is real, so the *fix* differs from the *finding*. But the finding stands: four URLs in four places with no single source of truth, and no comment marking which is authoritative. If `vercel.app` is production, `package.json` and README are wrong; if `is-a.dev` is production, `seo.ts` and `robots.txt` are wrong. Either way two of four are wrong.
- **RECOMMENDED ACTION:** pick the canonical host. If it is env-driven, generate `robots.txt` from `app/robots.ts` (a route handler, like `sitemap.ts` already does) so it reads `getSiteUrl()`; then a single env var controls everything. Correct `package.json`/README to match.
- **ALTERNATIVE:** hardcode one host in `seo.ts`, delete the env indirection. Simplest, loses preview-deploy correctness.
- **RISK OF CHANGE:** very low.
- **PRIORITY:** P3
- **CONFIDENCE:** CONFIRMED

---

### F-18 — An 872 KB generated patch file is committed to the repository

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `git ls-tree -r --name-only HEAD` includes `grovy-local-first.patch`; `git cat-file -s` reports **871,972 bytes**. It is present in `origin/master` too. Its content is a diff of the local-first rework (156 matches for auth/password/secret-shaped strings — all of them *deletions* of the removed Appwrite auth code, i.e. no live secrets, which I verified by sampling the matched lines).
- **WHAT IS HAPPENING:** a build artefact of a migration was committed as if it were source.
- **WHY IT MATTERS:** every clone pays 872 KB; `git log`/blame tooling shows a giant blob; and it contains the *full text* of every deleted auth route (password-recovery, reset-password), which is confusing for contributors and a mild information-disclosure surface for anyone who later assumes auth exists. No credentials found, so this is hygiene, not a leak.
- **HOW IT COULD FAIL:** a contributor greps for "password" and finds 40 hits in a `.patch` file, concludes there is auth code to maintain, and wastes time. Or a security scanner flags it every run, training the team to ignore scanner output.
- **COUNTERARGUMENT:** it documents the migration and someone may want it.
- **DOES THE COUNTERARGUMENT HOLD?:** git history already documents it — the commit is the artefact. Keeping a diff of a commit inside the repo is duplication.
- **RECOMMENDED ACTION:** `git rm grovy-local-first.patch` in a normal commit. Add `*.patch` to `.gitignore`.
- **ALTERNATIVE:** keep it under `docs/` with a one-line README pointer. Still 872 KB; not worth it.
- **RISK OF CHANGE:** none.
- **PRIORITY:** P3
- **CONFIDENCE:** CONFIRMED

---

### F-19 — `SongSchema` types `duration` as optional `number` but at least one route passes a raw string through

- **CLASSIFICATION:** LIKELY
- **EVIDENCE:** `app/types/song.ts:9` — `duration: z.number().optional()`. `app/api/search/route.ts:92` — `duration: item.duration` with **no coercion** (every other site does `Number(item.duration) || 0`). `SongSchema.safeParse` at `:120` would *fail* an entry with a string duration, and the failure path (`:122-126`) filters it out — so the practical effect is **the track is silently dropped from search results**, not a type violation at runtime.
- **WHAT IS HAPPENING:** the schema is doing its job; the mapping is throwing tracks away. Any upstream item whose `duration` is a string (JioSaavn returns `duration` as a string of seconds in some response shapes — I did not verify against the live API) is dropped from `/api/search` results but kept by `/api/songs` (which coerces). So the same query returns different *counts* depending on endpoint.
- **WHY IT MATTERS:** this is a concrete, silent data-loss mechanism caused by F-12's duplication. It also means `search()` (`app/lib/api.ts:160`) — which is **dead code, no production caller** (grep-verified; only `__tests__/api.test.ts:64` calls it) — is the *only* consumer of `/api/search`, so this defect currently harms nobody. Recorded because the route and the schema are both live code that will be reused.
- **HOW IT COULD FAIL:** someone wires `search()` into the UI for artist/album tabs; those tabs mysteriously return fewer results than the songs tab for the same query, with no error.
- **COUNTERARGUMENT:** `/api/search` and `search()` are both currently dead, so nothing is broken.
- **DOES THE COUNTERARGUMENT HOLD?:** for user impact, yes — which is why this is P3 and marked LIKELY rather than CONFIRMED. It does not hold as a "the code is fine" claim.
- **RECOMMENDED ACTION:** if `/api/search` and `search()` are kept, coerce with `Number(item.duration) || 0` (matching the other sites). If they are not going to be wired up, delete both — see F-20.
- **ALTERNATIVE:** make `SongSchema.duration` accept `z.coerce.number()`. Fixes every call site at once, at the cost of hiding future coercion bugs.
- **RISK OF CHANGE:** low.
- **PRIORITY:** P3
- **CONFIDENCE:** LIKELY (string-duration upstream shape unverified against the live API)

---

### F-20 — Substantial dead code across lib, hooks and routes; two hooks are test-only

- **CLASSIFICATION:** CONFIRMED (grep-verified call sites)
- **EVIDENCE:**
  - `app/hooks/usePreferenceState.ts` — zero production consumers; only `__tests__/hooks.test.ts`.
  - `app/hooks/useDebounceSearch.ts` — zero production consumers; only `__tests__/hooks.test.ts`. `app/page.tsx:364` hand-rolls a `setTimeout` debounce instead.
  - `app/lib/auth/redirect.ts` — `sanitizeNextPath` used only by `__tests__/authRedirect.test.ts`; its `FALLBACK_PATH = "/account"` points at a route that no longer exists.
  - `app/lib/rateLimit.ts` — `checkRateLimit`/`getClientKey` have zero callers.
  - `app/lib/offlineCache.ts` — `cacheSong`, `getCachedSong`, `evictStaleSearches`, `clearOfflineCache`, `replaceLibrary`, `getPlaylists`, `getFavorites`, `getHistory` used only by tests.
  - `app/lib/preferences.ts` — `patchGrovyPrefsSync` zero callers; `app/lib/seo.ts` — `APP_TAGLINE` zero callers.
  - `app/lib/thumbnail.ts` — `getThumbnailFallback` zero callers (so the "swap on `onError`" strategy its own doc comment describes is not implemented anywhere).
  - `app/api/trending/route.ts` — 118 lines, zero client callers; `app/page.tsx` never queries trending.
  - `app/lib/api.ts:160` `search()` — zero production callers.
- **WHAT IS HAPPENING:** roughly 350–450 lines of production code has no producer or consumer.
- **WHY IT MATTERS:** the cost is not bytes. It is that `lib/` looks like a coherent toolkit, so a contributor (or an AI agent) will reach for `useDebounceSearch` when adding a search box and produce a *second* debounce idiom — which is exactly what already happened at `page.tsx:364`. Dead code that is *tested* is worse than untested dead code, because the green checkmark implies the feature is live.
- **HOW IT COULD FAIL:** a new contributor adds a favourites-export button using `replaceLibrary()` (which exists, is tested, and writes all three sections) — unaware that the import path deliberately does not use it and that favourites/history are not exported at all (F-21). The result is an export that restores data the UI cannot export.
- **COUNTERARGUMENT:** some are plausibly public API surface for a library (MIT, `private: false`), and `getHistory` is the reader F-04 says should be wired up. Deleting them now means re-adding later.
- **DOES THE COUNTERARGUMENT HOLD?:** for `getHistory` (F-04) and `clearOfflineCache` (F-16) it holds — those are *missing wiring*, not dead code, and should be connected. For the two hooks, `rateLimit.ts`, `getThumbnailFallback`, `patchGrovyPrefsSync`, `APP_TAGLINE` and `/api/trending` it does not: nothing in the product or README implies them, and `AUDIT`-style "someone might want it" is how a codebase acquires permanent dead weight.
- **RECOMMENDED ACTION:** **wire** `getHistory` (F-04) and `clearOfflineCache` (F-16). **Delete** `usePreferenceState`, `useDebounceSearch` (+ their tests), `rateLimit.ts`, `patchGrovyPrefsSync`, `APP_TAGLINE`, `getThumbnailFallback`, and `/api/trending/route.ts`. **Decide** on `search()`/`/api/search`: wire it or delete it — do not leave it half-alive. Delete `auth/redirect.ts` and fix `page.tsx` to use the shared debounce hook if you keep that hook.
- **ALTERNATIVE:** keep everything, add `/** @internal — not yet wired */` markers. Honest, but accumulates.
- **RISK OF CHANGE:** low — deleting test-only code removes tests, which lowers the (already low) test count. That is the correct trade; testing dead code is negative value.
- **PRIORITY:** P3
- **CONFIDENCE:** CONFIRMED for call sites. `useDebounceSearch` itself is *correct* code — the bug is that `page.tsx` does not use it.

---

### F-21 — The ToS and README promise a library backup that does not exist, and the import path bypasses validation

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/tos/page.tsx:97` — "Clearing your browser data removes them, so export a backup from the Library page if you want to keep them." `README.md` — "Clearing site data removes your library. Use the export button on the Library page to keep a backup." Actual implementation: `app/playlists/page.tsx:27-36` exports **only** `{ version, playlists, exportedAt }`; `:38-69` imports only playlists. `favorites`, `history`, `preferences` (theme, volume, EQ) are **not** exported or imported. `replaceLibrary()` exists in `offlineCache.ts:216-224`, accepts all three sections, and is **unused**.
- **WHAT IS HAPPENING:** the legal page and README make a data-portability promise the code does not keep. A user following the instruction loses favourites, history and settings on a device move.
- **WHY IT MATTERS:** this is the highest-severity *product-truth* defect in the repo, because it is an instruction a user acts on and is then harmed by. It is also, in spirit, a GDPR Art. 20 (data portability) concern for EU users — the data is local, so technically the user already "has" it, but the product explicitly tells them the backup covers "them" (the library) and it does not. On top of that, `handleImport` at `:57-59` passes `pl.songs` straight to `createPlaylist` with **no element validation** (F-06), so the one import that does exist is also the one unvalidated write boundary.
- **HOW IT COULD FAIL:** user reads ToS → exports → clears browser → imports on new machine → favourites page is empty, history empty, theme reset, EQ reset. They have followed instructions and lost data. The ToS sentence is the proximate cause.
- **COUNTERARGUMENT:** "export a backup from the Library page" is not a claim about *scope*; a reasonable reader checks what is in the file. And `replaceLibrary` exists, so the capability is half-built.
- **DOES THE COUNTERARGUMENT HOLD?:** no. The ToS sentence sits in the *privacy/data* section immediately after "your playlists, favorites, listening history and playback preferences", enumerating exactly the four things the export does not cover. A reader cannot reasonably infer "playlists only" from that. And "half-built" is the finding, not the defence.
- **RECOMMENDED ACTION:** either (a) extend export/import to `{ version: 2, playlists, favorites, history, preferences }` using the existing `replaceLibrary()`, with per-section `safeParse` (F-06); or (b) narrow the ToS/README to "export your playlists from the Library page" and state plainly that favourites and history are not included. (a) is ~40 lines and honours the promise; do (a), keep `version: 1` readable for backward-compat.
- **ALTERNATIVE:** one-click full-library JSON download from a settings surface.
- **RISK OF CHANGE:** low. Bump the export `version`; accept v1 files on import by treating missing sections as empty.
- **PRIORITY:** P2 (raised from P3 because it is an instruction that causes data loss)
- **CONFIDENCE:** CONFIRMED

---

### F-22 — `getHDThumbnail` silently rewrites YouTube thumbnails to 480×360 4:3 and calls it "HD"

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/lib/thumbnail.ts:14-16` — `ytThumb()` returns `hqdefault.jpg` (480×360, 4:3) with the comment "Every YouTube video has this one". `:34-47` — `getHDThumbnail` matches `/vi/<id>/` and returns that URL regardless of the requested size. `:7-11` — the module docstring says it avoids `maxresdefault` because it 404s for many videos. Call sites request it everywhere: `page.tsx:125,264`, `playlists/page.tsx:162`, `favorites`, `history`, `MusicPlayer`, `PlayerControls`, `LyricsView`, `AddToPlaylistModal`, `Playlist`.
- **WHAT IS HAPPENING:** every YouTube cover is rendered from a 480×360 4:3 source into a **square, often 300–400 px** container via `object-cover`, so ~25% of the vertical content is cropped and the effective resolution is ~360 px on a 400 px box. The function name promises an upgrade; the implementation is a deliberate downgrade chosen for availability.
- **WHY IT MATTERS:** the app's central visual — the album grid — is noticeably soft for every YouTube-sourced track, which is roughly half the catalogue (search interleaves both sources). The decision to avoid 404s is *correct*; the missing half is that `maxresdefault` availability is knowable (`hqdefault` always exists, `maxresdefault` can be probed, and `sddefault`/`mqdefault` are guaranteed) and the code already contains `getThumbnailFallback` (`:80-89`) which returns `mqdefault` on error — a function nobody calls.
- **HOW IT COULD FAIL:** it does not fail; it just looks mediocre next to the JioSaavn covers, and the visual inconsistency between sources is blamed on "YouTube thumbnails are bad" rather than on this function.
- **COUNTERARGUMENT:** correctness over prettiness — a guaranteed-present 480×360 beats a sometimes-404 1280×720, and `Next.js` `Image` will not upscale beyond source resolution anyway so a larger source is the only fix.
- **DOES THE COUNTERARGUMENT HOLD?:** the availability argument holds completely and the function is *right* to prefer it. But the naming (`getHDThumbnail`) and the docstring ("raise the resolution") claim an outcome that is not delivered, and the already-written `getThumbnailFallback` + `onError` pattern is the standard fix that was left unwired. So: keep the default, rename it, and wire the fallback.
- **RECOMMENDED ACTION:** rename to `getSafeThumbnail` (or keep the name and fix the docstring to say it deliberately caps at 480×360). Then use `getThumbnailFallback` in a `NextImage` `onError` — but note `next/image` does not fire `onError` on the inner `<img>` reliably in all versions, so prefer a small `<CoverImage>` wrapper that owns the retry. Lowest-effort real improvement: request `sddefault.jpg` (640×480, also near-universal) instead of `hqdefault`.
- **ALTERNATIVE:** probe `maxresdefault` once per video id and cache the result in `grovy:cache-songs`.
- **RISK OF CHANGE:** low. `sddefault` is safe; `maxresdefault` is not (hence the fallback wrapper).
- **PRIORITY:** P3
- **CONFIDENCE:** CONFIRMED for the code; the "looks soft" judgement is LIKELY (not measured pixel-to-pixel).

---

### F-23 — Test suite covers only pure helpers; the two riskiest modules have no tests

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** 39 tests across 4 files: `offlineCache.test.ts` (23), `hooks.test.ts` (9), `api.test.ts` (5), `authRedirect.test.ts` (2). `vitest.config.ts` — `environment: "jsdom"`, `include: ["__tests__/**/*.test.{ts,tsx}"]`, `setupFiles: []`. There is **no** `@testing-library/react` render test anywhere despite it being installed as a devDependency; no route-handler test; no `PlayerContext` test; no component test; no Playwright/Cypress. `.github/workflows/ci.yml` runs `npm test` on PRs to `master` only.
- **WHAT IS HAPPENING:** the best-covered module is `offlineCache` (store semantics). The two files that contain every P0/P1 bug in this audit — `PlayerContext.tsx` (1,326 lines) and `app/api/stream/route.ts` — have **zero** tests. Both hooks in `hooks.test.ts` are dead code (F-20), so 9 of 39 tests (23%) test production-unused code.
- **WHY IT MATTERS:** F-05 (one-track queue dead state) is a 4-line logic bug that a single test — "queue of 1, call `nextTrack`, assert `isPlaying` reflects reality" — would have caught. F-13's missing validation on the id-branch is one `safeParse` assertion. The suite is not *bad*; it is aimed at the parts of the system least likely to break, because those are the parts that are pure functions.
- **HOW IT COULD FAIL:** every future change to `PlayerContext` is unguarded. Given the file is 1,326 lines with 23 effects, that is the definition of a module you cannot safely refactor — which blocks F-11 and F-05's fix.
- **COUNTERARGUMENT:** testing an audio player needs a real `<audio>` element, autoplay, Web Audio, and an IFrame player; jsdom provides none of it, so a `PlayerContext` test would be 90% mocking and assert the mocks, not the behaviour. Playwright with a real browser is the honest option and it is a large investment for a hobby project.
- **DOES THE COUNTERARGUMENT HOLD?:** substantially — and it is the strongest counterargument in this document. Full `PlayerContext` coverage is not worth it. But the counterargument does not cover the *extractable* logic: the queue-index arithmetic in `nextTrack`/`previousTrack`/`moveSongInQueue`/`removeFromQueue` is pure and can be tested with zero audio. Extracting those four functions into `app/lib/queue.ts` and testing them is a 60-line change that makes F-05 permanently regressible-proof and is a prerequisite for safely touching F-11.
- **RECOMMENDED ACTION:** extract queue arithmetic into a pure module and test it (target: 12–15 cases covering length-1, wraparound, shuffle-with-1, remove-last, remove-before-current). Add one route-handler test for `/api/stream`'s `saavn` host allowlist (`isAllowedSaavnUrl` — including the `evil-saavncdn.com` and `saavncdn.com.evil.com` suffix-attack cases). Delete the dead-hook tests with the hooks.
- **ALTERNATIVE:** add Playwright for a single smoke path (load, search, play, next). High value per line, but only if the project wants browser CI.
- **RISK OF CHANGE:** none (additive).
- **PRIORITY:** P2
- **CONFIDENCE:** CONFIRMED

---

### F-24 — `npm ci --legacy-peer-deps` in CI suppresses the peer conflict the dependency set creates

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `.github/workflows/ci.yml` — all three jobs run `npm ci --legacy-peer-deps`. `package.json` lists `@heroui/react ^3.2.8` plus direct `react-aria ^3.53.1`, `@react-aria/ssr ^3.10.1`, `@react-aria/utils ^3.34.1`, `@internationalized/date ^3.12.4`. Grep over `app/` for `from "react-aria"`, `from "@react-aria`, `from "@internationalized` returns **zero** hits — all four are unused direct dependencies that exist only to satisfy or override HeroUI's peer graph. Also `typescript`, `postcss`, `@tailwindcss/postcss` sit in `dependencies` rather than `devDependencies`.
- **WHAT IS HAPPENING:** four phantom runtime dependencies are installed into the production bundle's dependency tree (they are tree-shaken at build, so not shipped to browsers, but they are in `node_modules` and in the lockfile and in every `npm audit`), and CI works around a peer conflict with `--legacy-peer-deps` rather than resolving it.
- **WHY IT MATTERS:** `--legacy-peer-deps` means `npm ci` installs a graph npm has declared inconsistent. A contributor running plain `npm install` (as the README instructs, with no flag) gets a different resolution or an `ERESOLVE` failure. That is a documented onboarding path (`README.md` step 2: `npm install`) that does not match the working one. Separately, `renovate.json` sets `"automerge": true` for patch updates — auto-merging into a graph whose peer resolution is already being suppressed.
- **HOW IT COULD FAIL:** a new contributor follows the README, hits `ERESOLVE unable to resolve dependency tree`, and either gives up or adds `--legacy-peer-deps` by guesswork. Or a Renovate patch bump automerges and silently changes which React version HeroUI's peer graph resolves to, breaking styling in a way that only shows at runtime.
- **COUNTERARGUMENT:** HeroUI 3 + React 19 has a genuinely messy peer graph upstream; `--legacy-peer-deps` is the pragmatic, widely-used workaround; the lockfile pins the resolution so it is deterministic in CI.
- **DOES THE COUNTERARGUMENT HOLD?:** the pragmatism is real and the lockfile does make CI deterministic. It does not hold for the README mismatch (a fixable documentation bug) nor for the four unused direct deps — those are not workarounds, they are clutter that makes the peer situation look worse than it is, and removing them may make `--legacy-peer-deps` unnecessary. Test that hypothesis before believing it.
- **RECOMMENDED ACTION:** (1) fix `README.md` to say `npm install --legacy-peer-deps` (or ship an `.npmrc` with `legacy-peer-deps=true` so no flag is needed anywhere); (2) delete the four unused `react-aria`/`@react-aria`/`@internationalized/date` direct deps and re-run install without the flag; if it resolves, drop the flag from CI; (3) move `typescript`, `postcss`, `@tailwindcss/postcss` to `devDependencies`; (4) restrict Renovate automerge to `devDependencies` only.
- **ALTERNATIVE:** add an `overrides` block pinning the React version HeroUI expects. More explicit, more brittle.
- **RISK OF CHANGE:** medium for (2) — deleting deps can surface a real peer error that was being masked. Do it on a branch with a full build.
- **PRIORITY:** P2
- **CONFIDENCE:** CONFIRMED for the flags and the unused deps; whether removing them eliminates the conflict is UNVERIFIED (cannot run install).

---

### F-25 — `app/page.tsx` is 793 lines and owns state that belongs in the queue/library layers

- **CLASSIFICATION:** CONFIRMED
- **EVIDENCE:** `app/page.tsx` — 793 lines, 12 `useState` (`:225-236`), 5 `useRef` (`:238-242`), and it implements: greeting derivation from `Intl` + `/api/location` (`:38-104`), share-link resolution (`:275-345`), a hand-rolled 220 ms suggestion debounce (`:347-390`), a hand-rolled search with abort + run-id (`:391-461`), search history CRUD (`:391-...`), suggestion ranking/merging (`:549-...`), and the `TrackCard` component (`:120-195`).
- **WHAT IS HAPPENING:** the home page is simultaneously a view, a search controller, a geolocation consumer, a share-link router, and a component library.
- **WHY IT MATTERS:** the search logic here duplicates `useDebounceSearch` (dead, F-20) and is subtly different from `CommandPalette`'s search (`CommandPalette.tsx:130-150` uses a 400 ms `setTimeout` + `loadSongs`, no run-id), so the two search surfaces have different debounce timings, different abort handling, and different error semantics. A user typing in the palette vs the hero box gets different behaviour for the same intent.
- **HOW IT COULD FAIL:** a race where the hero box and palette disagree about in-flight state; or a fix applied to one search and not the other, so a bug "comes back" depending on which surface the reporter used.
- **COUNTERARGUMENT:** co-locating search with the page that owns the search box is normal React; extracting it into a hook for one consumer is premature abstraction, and `CommandPalette` is a genuinely different UX (a modal, keyboard-driven) that deserves its own timing.
- **DOES THE COUNTERARGUMENT HOLD?:** for *timing* differences, yes — 220 ms for suggestion-as-you-type and 400 ms for a modal query is defensible. For *abort and error semantics*, no: both should handle `AbortError` identically and both should ignore stale responses, and the palette lacks the run-id guard the hero box has. So the abstraction is not "one search hook for both" — it is "one `useSearchRequest` primitive that each surface parameterises".
- **RECOMMENDED ACTION:** extract `useSearchRequest({ debounceMs, minLength })` returning `{ query, setQuery, results, isSearching, error, submit, clear }` with the run-id + abort logic from `page.tsx:391-461`. Use it in both `page.tsx` and `CommandPalette.tsx` with different `debounceMs`. Move `TrackCard` to `app/components/TrackCard.tsx` (it is already a standalone component, just not extracted) — this also makes F-08's fix land in one place.
- **ALTERNATIVE:** leave `page.tsx` alone, fix only the palette to match the hero's run-id guard. Cheaper; leaves the 793-line file.
- **RISK OF CHANGE:** medium. Search is the app's most-used surface; do it after F-02 (keyboard) so you are not debugging both at once.
- **PRIORITY:** P3
- **CONFIDENCE:** CONFIRMED

---

## 8. Things I looked at and did *not* find a problem with

Recorded because an adversarial audit that only lists faults is not calibrated.

- **`app/lib/discovery.ts`** — the shared `radio`/`related` implementation with a labelled three-source fallback and `validateSongs()` at the boundary. This is the correct pattern; F-12 asks the rest of the API layer to copy it.
- **`app/lib/localStore.ts`'s in-tab write-suppression reasoning** (`:243-259` comment) — the self-write re-entry analysis is correct and the code matches it. F-14 is about the *cross-tab* case it does not cover.
- **`ConfirmDialog.tsx`** — a real `AlertDialog` replacing `window.confirm`, with focus trap and escape handling. Genuinely better than the platform primitive and correctly motivated in its docstring.
- **`AddToPlaylistModal.tsx`** — real HeroUI `Modal` for focus trapping, `isDisabled` on already-added playlists, `aria-label` on the text input. No findings.
- **`Toast.tsx`** — `aria-live="polite"` + `role="status"` (`:73`), dismiss `aria-label`. Correct.
- **`app/error.tsx` / `app/global-error.tsx`** — both exist, both offer reset, `global-error` is correctly self-contained with inline styles (no dependency on the CSS that failed). Above average.
- **`AmbientBackground.tsx`** — `prefers-reduced-motion` respected, `hardwareConcurrency` + viewport heuristics for lite mode, blob count reduced to 1. Thoughtful. (Its re-render cadence is F-11's problem, not its own.)
- **`SmoothScroll.tsx`** — bails out entirely on `prefers-reduced-motion` rather than reducing the effect. Correct.
- **`next.config.ts` `remotePatterns`** — a tight allowlist (4 patterns), not `**`. Good.
- **`public/sw.js` navigation strategy** — network-first with `offline.html` fallback, `/api/` and `Range` excluded, `/_next/` never served stale. The right shape (F-16 is about the `.mp3` extension only).
- **`.gitignore`** — genuinely thorough (build output, env variants, editor dirs, tsbuildinfo). F-18 is the one file that slipped through.
- **No `innerHTML`, no `eval`, no `document.write`, no dynamic `new Function`** anywhere in `app/`. Verified by grep. The React rendering path is clean.
- **`app/api/stream/route.ts:26-33` `isAllowedSaavnUrl`** — uses `host === allowedHost || host.endsWith('.' + allowedHost)`, which correctly rejects `evil-saavncdn.com` and `saavncdn.com.evil.com`. This is the *right* way to do a host suffix check and many codebases get it wrong.
- **`useMediaSession.ts`** — metadata, `playbackState`, and per-action `try/catch` with handler cleanup. Correct, including the cleanup.

---

## 9. Answers to the twenty adversarial questions

**1. What is the single worst decision in this codebase?**
Putting the entire playback engine, the user library, device settings, global input handling and palette state into one 1,326-line context. Every other finding is either caused by it (F-11, F-25) or made unfixable by it (F-23's testing gap, F-05's risk). It is the decision that turns small bugs into archaeology.

**2. Which finding would I fix first, and why not the highest-severity one?**
F-02 (the Space handler). It is P0, it is ~6 lines, it cannot break audio, and it unblocks F-08's fix. F-01 (the relay) is also P0 but its fix needs a deployment decision (edge vs in-process) that no code change can make for you — so it is P0 by severity and second by sequence.

**3. What is the most likely bug a real user hits tomorrow?**
F-04. History is empty on reload, for everyone, always. It is not a corner case; it is the default experience of a feature that is advertised in the sidebar.

**4. Which finding is most likely to be wrong?**
F-19. I inferred that upstream sometimes returns `duration` as a string from the fact that every call site coerces except one — the pattern is a strong hint, but I did not query the live API, and if `duration` is always numeric then `/api/search` drops nothing. Hence LIKELY, not CONFIRMED.

**5. Where did I overstate severity?**
F-09 (skip-while-paused). Spotify does resume on skip; the behaviour is defensible product design. I downgraded it to P3 and folded the real defect into F-05. I also had to walk back F-14 from "infinite loop" to "one extra full-library serialise per change" once I checked that browsers suppress identical-value `storage` writes — the amplification is real, the loop is not.

**6. Which finding is most expensive to fix?**
F-11 phase 2 (splitting the context into playback / library / settings). Phase 1 (moving `currentTime` out) is cheap; phase 2 touches 17 consumers and every effect in a 1,326-line file with no test coverage. It should not be attempted before F-23's queue extraction.

**7. Is the security posture acceptable for what this app is?**
Mostly yes, with one exception. No auth, no database and no server-side user data means the classic web-app attack surface (IDOR, session fixation, privilege escalation, SQL injection) does not exist. The one thing that is genuinely bad is F-01: an unmetered byte relay whose cost lands on the deployer. The CSP (F-10) is cosmetically strict and functionally weak, but I found no live injection vector, so it is defence-in-depth debt rather than a hole.

**8. Is the "local-first, no accounts" architecture sound?**
Yes — and it is the strongest product decision in the repo, because it eliminates an entire category of security and compliance work. But it is only sound if the export path is complete, and it is not (F-21). Local-first with a broken backup is *worse* than server-first, because the user's data has exactly one copy and the product told them they had a backup.

**9. What would break first at 1,000 concurrent users?**
`/api/stream`. Not because of the limiter (there is none) but because F-03 means nothing is cached: every seek and every repeat request is a cold upstream fetch through the relay, and the deployment absorbs all of it. `ipapi.co` (F-15) would break second, and quieter.

**10. Which of my own recommendations should be dropped?**
**F-10's CSP rewrite.** The `middleware.ts`-plus-nonce path contradicts the app's deliberate no-server-state design for a threat that does not currently exist (no live XSS vector). Keep only the one-line `JSON.stringify` `<`-escaping and the honesty comment; drop the nonce proposal entirely. Runner-up: **F-09**, which I already withdrew.

**11. What is genuinely fine as-is and should not be touched?**
`app/lib/discovery.ts`, `ConfirmDialog.tsx`, `Toast.tsx`, `SmoothScroll.tsx`, the `remotePatterns` allowlist, the `sw.js` navigation strategy, `isAllowedSaavnUrl`'s host-suffix logic, the error boundaries, and the `localStore.ts` in-tab write-suppression reasoning. Also: the decision to have no accounts. Do not "improve" any of these.

**12. Is the type safety real or decorative?**
Real, and above average — `strict: true`, no `any` in the type definitions, `SongSchema` as the single source of `Song`. It is undermined in three specific places, not globally: the `as T` casts in `localStore.ts:85,108` (F-06), the `any` in every upstream adapter (`apiHelpers.ts` uses `any` throughout — defensible, since upstream shape is genuinely unknown, but it means the boundary is typed at the *output* only), and `ytPlayerRef = useRef<any>` in `PlayerContext.tsx:135`, which hides the entire YouTube IFrame surface. That last one is where a real bug will hide.

**13. Does the abstraction level match the problem?**
In `lib/`, mostly yes. In `context/`, no — a context is a transport mechanism, not an architecture, and 26 state atoms behind one provider is using React's simplest tool for the hardest job. The file needs to become three or four modules with explicit interfaces.

**14. Is the performance work real or cargo-culted?**
Mixed, and better than average. Real: `optimizePackageImports`, `content-visibility: auto` on grids, `dynamic()` for the palette/player/ambient background, `next/image` with `sizes`, 1 Hz throttle on time state, `will-change` on the blobs, range-request prefetch for the next track, `prefers-reduced-motion` gating. Cargo-culted: the entire `Cache-Control` story (F-03, defeated by config), and the `dns-prefetch`/`preconnect` hints for the two Workers (`layout.tsx:192-200`) which are server-side-proxied and therefore never contacted by the browser — those two `preconnect`s cost a DNS+TLS handshake for nothing.

**15. Is the UX coherent, or a pile of features?**
Coherent in visual language (one glass/rounded system, consistent typography scale, consistent motion timing) and incoherent in interaction. There are three different search surfaces with three different debounce timings, a history page that does not persist, a one-track queue that fakes playback, a Space key that fights every button, and a favourites grid that cannot be keyboard-navigated. The craft is in the CSS; the discipline is missing from the behaviour.

**16. What is the biggest gap between README/ToS and reality?**
F-21 — "export a backup from the Library page" exports playlists only. Second: README advertises "Spatial Audio (3D Soundstage)" and "Real-time Audio Visualizer"; grep for `AnalyserNode`/`createPanner`/`HRTF` returns **nothing**. The audio graph is 5 biquads + a gain node. The equaliser is real; spatial audio and the visualiser do not exist. (Stated with care: the visualiser may have been removed deliberately, but the README still claims it.)

**17. Is the error handling honest?**
Mostly. `request()` in `api.ts` distinguishes timeout-abort from network failure and returns a typed `ApiError` with a status. `searchSongs` rethrows `AbortError` by name. `loadSongs` catches and toasts with a retry action. The dishonesty is in the *storage* layer: `writeJson` swallows quota errors silently (F-07), and `PlayerContext`'s many `catch {}` blocks (e.g. `:390`, `:301`) mean a broken audio pipeline degrades with no signal at all. Silent failure is the codebase's default posture, and it is why F-04 and F-05 went unnoticed.

**18. Would I ship this?**
As a personal open-source project, yes — with F-01 mitigated at the edge, F-02 fixed (it is the cheapest P0 in the repo), and F-21's ToS sentence corrected or the export completed. As anything with a paying user or an SLA, no: the unmetered relay, the absent cache layer, and a 1,326-line untested playback engine are three independent reasons.

**19. What is the one thing that, if done now, would most improve the next six months?**
Extract the queue arithmetic into a tested pure module (F-23's recommendation). It is ~60 lines, it makes F-05's class of bug impossible to reintroduce, and it is the precondition for ever safely touching `PlayerContext`.

**20. What would make me distrust this audit?**
If `npm ci && npm run build && npm test` fails on `master`, several findings change character — a non-building app makes F-20 (dead code) and F-24 (dependency graph) much more urgent than I have ranked them, and makes everything else moot. **I did not run it.** Treat every finding here as conditional on the app building.

---

## 10. Refactoring roadmap

Sequenced by *unblocking*, not by severity. Severity tells you what hurts; sequence tells you what you can actually do next without creating new bugs.

### Wave 0 — hours, near-zero risk

| # | Action | Finding |
|---|---|---|
| 1 | Add the `closest(...)` focus guard to the global keydown handler | F-02 |
| 2 | Escape `<` in `JSON.stringify` JSON-LD payloads; add an honesty comment at `next.config.ts:16` | F-10 |
| 3 | Delete the `/api/:path*` `headers()` block, keep `/api/stream` | F-03 |
| 4 | Drop `mp3` from `sw.js`'s `isRuntimeAsset` | F-16 |
| 5 | `git rm grovy-local-first.patch`; add `*.patch` to `.gitignore` | F-18 |
| 6 | Fix README install command (or add `.npmrc` with `legacy-peer-deps=true`) | F-24 |
| 7 | Rename `getHDThumbnail` or correct its docstring | F-22 |

All of these are behaviour-preserving or create a visible improvement. None requires reading `PlayerContext` end to end.

### Wave 1 — the functional gaps, still small

| # | Action | Finding |
|---|---|---|
| 8 | Seed `recentlyPlayed` from persisted history | F-04 |
| 9 | Split "advance" from "resume" in `handleEnded`/`nextTrack`; fix the one-track case | F-05 |
| 10 | Validate the `/api/songs` id-branch; full CORS headers on the Zod-failure path; rename the shadowed `rawSongs` | F-13 |
| 11 | Add `PlaylistSchema`/`HistoryRecordSchema`; validate at import + hydration | F-06 |
| 12 | Extend export/import to favourites + history + preferences via the existing `replaceLibrary()`, **or** narrow the ToS sentence | F-21 |

Item 12 is the only one with a product decision in it. Decide before writing code: complete the promise (preferred) or correct the promise.

### Wave 2 — structural, do in this order

| # | Action | Finding |
|---|---|---|
| 13 | Extract queue arithmetic (`nextTrack`, `previousTrack`, `moveSongInQueue`, `removeFromQueue`, shuffle) into `app/lib/queue.ts`; test it | F-23 |
| 14 | Move `currentTime`/`duration` into their own context | F-11 phase 1 |
| 15 | Unify the four song mappers into `songMapper.ts` | F-12 |
| 16 | Move the queue to its own `grovy:queue` key with a cap and a migration | F-07 |
| 17 | Extract `useSearchRequest`; move `TrackCard` out of `page.tsx`; use it in `CommandPalette` too | F-25 |
| 18 | Delete the dead code (F-20), after wiring `getHistory` and `clearOfflineCache` | F-20 |

Step 13 must precede 14. Extracting testable logic *before* refactoring a 1,326-line file is the difference between a refactor and a rewrite.

### Wave 3 — decided, not scheduled

| # | Action | Finding |
|---|---|---|
| 19 | Narrow `/api/stream`: id regex + same-origin + edge bandwidth cap | F-01 |
| 20 | Gate the `ipapi.co` lookup behind a deployment check | F-15 |
| 21 | Add the cross-tab write-back equality guard | F-14 |
| 22 | One canonical domain; convert `robots.txt` to `app/robots.ts` | F-17 |
| 23 | Split the context into playback / library / settings | F-11 phase 2 |

Wave 3's item 19 is P0 by severity but sits last here because it needs an infrastructure decision (edge WAF vs in-process) that code alone cannot make. Items 20–22 are independent and can be pulled forward by anyone who has an hour.

### Explicitly rejected

- **F-09** — skip-while-paused resume. Withdrawn; matches Spotify.
- **F-10's nonce/middleware proposal** — contradicts the app's no-server-state design for a threat that does not exist today.
- **A serverless-safe in-process rate limiter** — `rateLimit.ts` already demonstrates why this does not work on a per-instance platform. Don't wire it; use the edge.

---

## 11. Final engineering assessment

Scores are 1–10, where 5 is "average for a hobby Next.js project", 7 is "solid professional", 9 is "exemplary, nothing to fix today". They are calibrated against *this* app's ambition, not against Spotify.

| Dimension | Score | One-line justification |
|---|---|---|
| **Architecture** | **5** | Real seams in `lib/` with one exemplary module (`discovery.ts`), undermined by a 1,326-line context that owns the application and three duplicated mappers. |
| **Code Quality** | **6** | Strict TS, clear naming, good comments where they matter; offset by dead code, a shadowed variable, and silent `catch {}` as a house style. |
| **Maintainability** | **4** | Every change to playback is unguarded by tests, and the file that needs the most work is the least safe to touch. The score would be 3 without `discovery.ts`. |
| **Security** | **6** | No auth means no classic app attack surface, and the host-suffix check is correct; marked down for the open relay (F-01) and a CSP that reads stricter than it is. |
| **Performance** | **5** | Real optimisations (dynamic imports, throttled time state, `content-visibility`, image `sizes`) sit next to a completely defeated cache layer and a 2 Hz tree-wide render floor. |
| **Scalability** | **3** | Nothing in the request path is cached, deduplicated, or bounded. Two concurrent users are fine; two thousand would take the deployment's upstream quota with them. |
| **Reliability** | **5** | Error boundaries, abort handling, and stall-retry-with-rewind are genuinely good; contradicted by an `isPlaying` state that can lie and storage writes that fail silently. |
| **Testing** | **3** | 39 tests, 23% of them covering dead code, zero coverage of the two modules containing every P0/P1 finding. |
| **Type Safety** | **7** | `strict: true`, Zen-validated `Song` as single source of truth, no `any` in domain types; loses points for `as T` casts at the storage boundary and `useRef<any>` over the YouTube API. |
| **UX Engineering** | **5** | One coherent visual language and thoughtful motion/lite-mode work, against three search surfaces with three timings, a fake-playing state, and keyboard hijacking. |
| **Accessibility** | **3** | Real `aria-live`, real `AlertDialog` focus trapping, `prefers-reduced-motion` respected — then `role="button"` with nested buttons, unreachable `onClick` cards, and a global Space handler (WCAG 2.1.1 failure). |
| **Developer Experience** | **6** | Small, readable tree; good `lib/` ergonomics; free hosting and no env vars needed. Offset by a README that does not match `npm ci`'s flags and a lint/type/test CI that only runs on PRs to `master`. |
| **Production Readiness** | **4** | The two features users will notice first (history persistence, one-track queues) are broken, and the cost-bearing endpoint is unprotected. It will run; it is not ready to be relied on. |

**Aggregate (unweighted mean): 5.0 / 10.** That number is misleading on its own — the distribution is bimodal. The *craft* (typing, styling, motion, error boundaries) is a 7; the *wiring* (persistence reads, cache headers, queue edge cases, test coverage) is a 3. Almost every point available is in connecting things that already exist, not in building new things.

**The single sentence version:** a well-typed, well-dressed app whose best engineering is in the parts users see least, and whose worst bugs are in the parts they touch every session.

---

## 12. Caveat and re-verification checklist

Nothing below was executed. Before acting on this document, run:

1. `npm install` (or `npm ci --legacy-peer-deps`) — does it resolve without the flag? (F-24)
2. `npm run type-check` and `npm run lint` — clean? If not, F-20 and F-24 jump in priority.
3. `npm test` — 39 passing as claimed?
4. `npm run build` — builds? If not, everything else is moot (question 20).
5. `curl -I` each of `/api/stream`, `/api/songs`, `/api/location`, `/api/search/suggestions` — what `Cache-Control` actually reaches the wire? (F-03)
6. Play a one-track queue to the end — does the UI claim to be playing? (F-05)
7. Reload after playing a few tracks — is History empty? (F-04)
8. Keyboard-only pass: tab to a delete button, press Space. (F-02)

If 1–4 fail, re-read question 20 before trusting any ranking in section 10.


