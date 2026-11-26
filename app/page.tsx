"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Clock, Trash2, Music } from "lucide-react";
import { usePlayer } from "@/app/context/PlayerContext";
import { getSearchSuggestions, searchSongs } from "@/app/lib/api";
import {
  addSearchHistoryEntry,
  clearSearchHistory as clearStoredSearchHistory,
  readSearchHistory,
  removeSearchHistoryEntry,
} from "@/app/lib/localStore";
import { TrackCard } from "./components/TrackCard";
import { useSearchRequest } from "@/app/hooks/useSearchRequest";
import type { Song } from "@/app/types/song";

type HomeSong = Song & Record<string, unknown>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

function resolveTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return "Still up?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function composeGreeting(timeGreeting: string, locationLabel: string): string {
  if (!locationLabel.trim()) return timeGreeting;
  if (timeGreeting.endsWith("?")) return `${timeGreeting} ${locationLabel}`;
  return `${timeGreeting}, ${locationLabel}`;
}

function resolveLocationLabelFallback(): string {
  try {
    const locale = typeof navigator !== "undefined" ? navigator.language : "";
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

    let city = "";
    if (timeZone.includes("/")) {
      city = timeZone
        .split("/")
        .pop()
        ?.replace(/_/g, " ")
        .trim() || "";
    }

    const regionMatch = locale.match(/[-_]([A-Za-z]{2})$/);
    const regionCode = regionMatch?.[1]?.toUpperCase() || "";

    let country = "";
    if (regionCode && typeof Intl.DisplayNames !== "undefined") {
      const regionNames = new Intl.DisplayNames([locale || "en"], { type: "region" });
      country = regionNames.of(regionCode) || "";
    }

    if (city) return city;
    if (country) return country;
  } catch {
    // Fall through to default when locale APIs are unavailable.
  }

  return "your area";
}

async function resolveLocationLabelFromIp(signal?: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch("/api/location", {
      method: "GET",
      signal,
      cache: "no-store",
    });

    if (!response.ok) return null;
    const data = await response.json();

    const label = typeof data?.label === "string" ? data.label.trim() : "";
    return label || null;
  } catch {
    return null;
  }
}

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const SectionHeading = ({ title, subtitle, icon: Icon }: SectionHeadingProps) => (
  <div className="space-y-2 px-0.5">
    <div className="flex items-center gap-3">
      <Icon size={22} className="text-sky-500 dark:text-sky-400" />
      <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h2>
    </div>
    {subtitle ? (
      <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-white/40">{subtitle}</p>
    ) : null}
  </div>
);

const HomeSkeleton = () => (
  <div className="w-full max-w-350 mx-auto px-3 sm:px-5 md:px-8 lg:px-12 py-6 sm:py-8 space-y-8 sm:space-y-10 animate-pulse">
    <div className="h-56 sm:h-64 rounded-3xl bg-gray-200 dark:bg-white/7" />
    <div className="h-8 w-48 bg-gray-200 dark:bg-white/7 rounded-xl" />
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <div className="aspect-square bg-gray-200 dark:bg-white/7 rounded-2xl" />
          <div className="h-4 w-30 bg-gray-100 dark:bg-white/5 rounded-lg" />
          <div className="h-3 w-22 bg-gray-100 dark:bg-white/5 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export default function Home() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const { setQueue, songs, toggleFavorite, isFavorite } = usePlayer();

  const [greeting, setGreeting] = useState("Hello");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const hasHandledSharedSongRef = useRef(false);
  const handledUrlSearchRef = useRef("");
  const songsRef = useRef(songs);
  const searchResultsRef = useRef<HomeSong[]>([]);

  // Search history is part of the local store, so it hydrates synchronously
  // and survives a reload without a separate storage key or parse step.
  const addToSearchHistory = useCallback((query: string) => {
    setSearchHistory(addSearchHistoryEntry(query));
  }, []);

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isSearching,
    error: searchError,
    submittedQuery: lastSubmittedQuery,
    setError: setSearchError,
    submit: runSearch,
    clear: clearSearch,
  } = useSearchRequest<HomeSong>({
    fetcher: (query, signal) => searchSongs(query, signal) as Promise<HomeSong[]>,
    minLength: 2,
    onResults: (query, found) => {
      // Record the query once per successful search, but only when it actually
      // produced results — a typo that returns nothing should not clutter the
      // history dropdown.
      if (found.length > 0) addToSearchHistory(query);
    },
  });

  // Clearing the box should also drop the stale suggestion list, which the
  // hook does not own.
  const clearSearchAndSuggestions = useCallback(() => {
    clearSearch();
    setSuggestions([]);
    setIsLoadingSuggestions(false);
  }, [clearSearch]);

  useEffect(() => {
    const timeGreeting = resolveTimeGreeting();
    const fallbackLabel = resolveLocationLabelFallback();
    setGreeting(composeGreeting(timeGreeting, fallbackLabel));

    const controller = new AbortController();

    (async () => {
      const ipLocationLabel = await resolveLocationLabelFromIp(controller.signal);
      if (!controller.signal.aborted && ipLocationLabel) {
        setGreeting(composeGreeting(timeGreeting, ipLocationLabel));
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  useEffect(() => {
    searchResultsRef.current = searchResults;
  }, [searchResults]);

  useEffect(() => {
    setSearchHistory(readSearchHistory());
  }, []);

  useEffect(() => {
    const playId = searchParams.get("play");
    if (!playId || hasHandledSharedSongRef.current) return;

    hasHandledSharedSongRef.current = true;
    const sharedTitle = (searchParams.get("title") || "").trim();
    const sharedArtist = (searchParams.get("artist") || "").trim();

    const inMemoryMatch = [...songsRef.current, ...searchResultsRef.current].find((song) => song?.id === playId) as HomeSong | undefined;

    if (inMemoryMatch) {
      setQueue([inMemoryMatch], 0);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const query = [sharedTitle, sharedArtist].filter(Boolean).join(" ").trim();
        if (query) {
          const candidates = (await searchSongs(query, controller.signal)) as HomeSong[];
          const normalizedTitle = sharedTitle.toLowerCase();
          const normalizedArtist = sharedArtist.toLowerCase();

          const bestMatch =
            candidates.find((song) => song.id === playId) ||
            candidates.find((song) => {
              const titleMatches = normalizedTitle ? song.title.toLowerCase() === normalizedTitle : false;
              const artistMatches = !normalizedArtist || (song.artist || "").toLowerCase().includes(normalizedArtist);
              return titleMatches && artistMatches;
            }) ||
            candidates[0];

          if (!controller.signal.aborted && bestMatch) {
            setQueue([bestMatch], 0);
            return;
          }
        }

        if (!controller.signal.aborted && playId.startsWith("yt-")) {
          const ytId = playId.slice(3);
          if (!ytId) return;

          setQueue(
            [
              {
                id: playId,
                title: sharedTitle || "Shared Song",
                url: `/api/stream?id=${encodeURIComponent(ytId)}`,
                artist: sharedArtist || "Unknown Artist",
                cover: undefined,
                genre: "YouTube",
                duration: 0,
                source: "YouTube",
              },
            ],
            0
          );
          return;
        }

        if (!controller.signal.aborted) {
          setSearchError("Couldn't find that shared song. It may have been removed.");
        }
      } catch {
        if (!controller.signal.aborted) {
          setSearchError("Ran into a problem loading the shared song. Give it another try.");
        }
      }
    })();

    return () => controller.abort();
  }, [searchParams, setQueue, setSearchError]);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const data = await getSearchSuggestions(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          const normalized = Array.from(
            new Set(
              (Array.isArray(data) ? data : [])
                .map((item) => String(item || "").trim())
                .filter(Boolean)
            )
          );
          setSuggestions(normalized.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()));
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const removeFromSearchHistory = useCallback((query: string) => {
    setSearchHistory(removeSearchHistoryEntry(query));
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory(clearStoredSearchHistory());
  }, []);

  const visibleSearchResults = useMemo(() => searchResults.slice(0, 24), [searchResults]);
  const normalizedQuery = useMemo(
    () => (lastSubmittedQuery || searchQuery).trim(),
    [lastSubmittedQuery, searchQuery]
  );
  const hasSubmittedSearchForActiveQuery = useMemo(() => {
    const activeQuery = searchQuery.trim().toLowerCase();
    const submittedQuery = lastSubmittedQuery.trim().toLowerCase();
    return activeQuery.length > 0 && submittedQuery.length > 0 && activeQuery === submittedQuery;
  }, [searchQuery, lastSubmittedQuery]);
  const hasResultsForActiveQuery = useMemo(() => {
    const activeQuery = searchQuery.trim().toLowerCase();
    const submittedQuery = lastSubmittedQuery.trim().toLowerCase();
    return activeQuery.length > 0 && activeQuery === submittedQuery && visibleSearchResults.length > 0;
  }, [searchQuery, lastSubmittedQuery, visibleSearchResults.length]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowSearchHistory(false);
      }
    };

    document.addEventListener("mousedown", handler, { passive: true });
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePlayFromResults = useCallback(
    (song: HomeSong) => {
      const index = searchResults.findIndex((s) => s.id === song.id);
      if (index !== -1) {
        setQueue(searchResults, index);
      }
      setShowSuggestions(false);
    },
    [setQueue, searchResults]
  );

  const resultSuggestions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return [];

    const fromResults = searchResults.flatMap((song) => {
      const title = String(song?.title || "").trim();
      const artist = String(song?.artist || "").trim();
      return [title, artist].filter(Boolean);
    });

    const seen = new Set<string>();
    const combined = [...suggestions, ...fromResults];
    const ranked = combined
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .filter((item) => item.toLowerCase() !== normalizedQuery)
      .filter((item) => {
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.length - b.length;
      });

    return ranked.slice(0, 10);
  }, [searchQuery, searchResults, suggestions]);

  const applySuggestionSelection = useCallback(
    (rawSuggestion: string) => {
      const suggestion = rawSuggestion.replace(/\s+/g, " ").trim();
      if (!suggestion) return;

      setSearchQuery(suggestion);
      setShowSuggestions(false);
      setShowSearchHistory(false);
      setSearchError("");
      void runSearch(suggestion);
    },
    [runSearch, setSearchQuery, setSearchError]
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-350 mx-auto px-3 sm:px-5 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8 space-y-8 sm:space-y-10 pb-40 sm:pb-44 md:pb-48"
    >
      <motion.header
        variants={fadeUp}
        className="relative rounded-3xl border border-gray-200/60 dark:border-white/12 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.2),transparent_46%),radial-gradient(circle_at_85%_5%,rgba(16,185,129,0.14),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(245,245,245,0.62))] dark:bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.16),transparent_45%),radial-gradient(circle_at_85%_5%,rgba(16,185,129,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] backdrop-blur-2xl p-5 sm:p-7 md:p-9 overflow-hidden"
      >
        <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-sky-300/25 blur-3xl pointer-events-none" />
        <div className="absolute -top-16 -right-10 w-44 h-44 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none" />

        <div className="relative space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] sm:text-[12px] font-extrabold uppercase tracking-[0.18em] text-sky-500">{greeting}</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-[1.04] tracking-tight">
              What&apos;s on your mind?
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-white/60 font-medium max-w-2xl">
              A song, an artist, a lyric you half-remember, just type it in.
            </p>
          </div>

          <div ref={searchBoxRef} className="relative max-w-2xl">
            <div className="relative flex items-center bg-white/85 dark:bg-black/35 border border-white/70 dark:border-white/12 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">
              <Search size={20} className="text-gray-500 dark:text-white/45 shrink-0" />
              <input
                type="text"
                placeholder="Song, artist, album, mood..."
                value={searchQuery}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => {
                  // The hook clears results itself when the query drops below
                  // the minimum length or changes away from the submitted one.
                  setSearchQuery(event.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => { setShowSuggestions(true); setShowSearchHistory(true); }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setShowSuggestions(false);
                    setShowSearchHistory(false);
                    void runSearch();
                  }
                }}
                className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/35 px-3 font-medium"
              />

              {searchQuery ? (
                <button
                  onClick={clearSearchAndSuggestions}
                  className="p-1.5 rounded-full text-gray-500 hover:text-gray-800 dark:text-white/40 dark:hover:text-white transition-colors shrink-0"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              ) : null}

              {isSearching ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                  className="ms-2 w-4 h-4 border-2 border-gray-300 dark:border-white/20 border-t-sky-500 dark:border-t-sky-400 rounded-full shrink-0"
                />
              ) : null}
            </div>

            <AnimatePresence>
              {showSuggestions && searchQuery.trim().length >= 2 ? (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  className="mt-3 w-full bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-white/10 rounded-2xl shadow-2xl overflow-y-auto custom-scrollbar max-h-80"
                >
                  {isLoadingSuggestions ? (
                    <div className="px-5 py-4 text-sm font-medium text-gray-500 dark:text-white/45">Hang on...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion}-${index}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applySuggestionSelection(suggestion)}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left text-sm font-medium text-gray-800 dark:text-white/75 hover:bg-gray-50 dark:hover:bg-white/7 transition-colors border-b border-gray-100/70 dark:border-white/5 last:border-b-0"
                      >
                        <Search size={15} className="text-gray-400 dark:text-white/25 shrink-0" />
                        <span className="truncate">{suggestion}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-5 py-4 text-sm font-medium text-gray-500 dark:text-white/45">No ideas — keep typing.</div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {showSearchHistory && !searchQuery.trim() && searchHistory.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  className="mt-3 w-full bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100/70 dark:border-white/5">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">Recent Searches</span>
                    <button
                      onClick={clearSearchHistory}
                      className="text-xs font-bold text-gray-400 hover:text-red-500 dark:text-white/30 dark:hover:text-red-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {searchHistory.map((query, index) => (
                      <div
                        key={`${query}-${index}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/7 transition-colors group"
                      >
                        <Clock size={15} className="text-gray-400 dark:text-white/25 shrink-0" />
                        <button
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applySuggestionSelection(query)}
                          className="flex-1 text-left text-sm font-medium text-gray-800 dark:text-white/75 truncate"
                        >
                          {query}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromSearchHistory(query); }}
                          className="p-1 rounded-full text-gray-400 hover:text-red-500 dark:text-white/25 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          aria-label="Remove from history"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {hasResultsForActiveQuery ? (
          <motion.section
            key="search-results"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6 sm:space-y-7"
            aria-live="polite"
          >
            <SectionHeading icon={Search} title="Here's what we found" subtitle={`${visibleSearchResults.length} results`} />

            {resultSuggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resultSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => applySuggestionSelection(suggestion)}
                    className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-gray-100 dark:bg-white/8 text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/14 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {visibleSearchResults.map((song) => (
                <TrackCard
                  key={song.id}
                  song={song}
                  onPlay={() => handlePlayFromResults(song)}
                  onFavorite={toggleFavorite}
                  isFav={isFavorite(song.id)}
                />
              ))}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {hasSubmittedSearchForActiveQuery && visibleSearchResults.length === 0 && !isSearching ? (
        <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
          <Music size={48} className="text-gray-300 dark:text-white/12 mb-4" />
          {searchError ? (
            <p className="text-gray-700 dark:text-white/70 font-medium max-w-md">{searchError}</p>
          ) : (
            <>
              <p className="text-gray-500 dark:text-white/50 font-medium">Nothing came up for &quot;{normalizedQuery}&quot;</p>
              <p className="text-gray-400 dark:text-white/30 text-sm mt-2">Maybe try a different spelling?</p>
            </>
          )}
        </motion.div>
      ) : null}

      {!searchQuery ? (
        <motion.section variants={fadeUp} className="py-12 sm:py-16 text-center space-y-2">
          <p className="text-sm sm:text-base text-gray-500 dark:text-white/45 font-medium">
            Your queue is empty — go find something good.
          </p>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-white/30 font-medium">
            Search up top to get started.
          </p>
        </motion.section>
      ) : null}
    </motion.div>
  );
}
