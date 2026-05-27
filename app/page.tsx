"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Music, Play, Search, X } from "lucide-react";
import { usePlayer } from "@/app/context/PlayerContext";
import { getSearchSuggestions, searchSongs } from "@/app/lib/api";
import { getHDThumbnail } from "./lib/thumbnail";
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

type TrackCardProps = {
  song: HomeSong;
  onPlay: () => void;
  onFavorite: (song: HomeSong) => void;
  isFav: boolean;
};

const TrackCard = ({ song, onPlay, onFavorite, isFav }: TrackCardProps) => {
  const coverSrc = song.cover ? getHDThumbnail(song.cover) || song.cover : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="group cursor-pointer relative"
      onClick={onPlay}
    >
      <div className="aspect-square relative rounded-2xl overflow-hidden mb-3 bg-linear-to-br from-slate-300 to-slate-400 dark:from-white/8 dark:to-white/2 shadow-md group-hover:shadow-2xl transition-all duration-300">
        {coverSrc ? (
          <NextImage
            src={coverSrc}
            alt={song.title}
            width={210}
            height={210}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, (max-width: 1280px) 18vw, 210px"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-sky-400/25 to-emerald-400/25 dark:from-sky-500/15 dark:to-emerald-500/15">
            <Music size={40} className="text-white/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={(event) => {
              event.stopPropagation();
              onPlay();
            }}
            className="w-14 h-14 bg-sky-500 hover:bg-sky-600 rounded-full flex items-center justify-center shadow-2xl transition-all"
          >
            <Play size={22} fill="white" className="text-white ml-0.5" />
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(event) => {
            event.stopPropagation();
            onFavorite(song);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/40 hover:bg-sky-500 transition-all backdrop-blur-sm z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          title={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={18} fill={isFav ? "currentColor" : "none"} className={isFav ? "text-sky-400" : "text-white"} />
        </motion.button>
      </div>

      <div className="space-y-1.5">
        <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm sm:text-base leading-snug">{song.title}</h4>
        <p className="text-gray-500 dark:text-white/50 text-xs sm:text-sm font-medium truncate">{song.artist}</p>
      </div>
    </motion.div>
  );
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<HomeSong[]>([]);
  const [searchError, setSearchError] = useState("");
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState("");

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchRunIdRef = useRef(0);
  const hasHandledSharedSongRef = useRef(false);
  const handledUrlSearchRef = useRef("");
  const songsRef = useRef(songs);
  const searchResultsRef = useRef(searchResults);

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
          const candidates = (await searchSongs(query, undefined, controller.signal)) as HomeSong[];
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
  }, [searchParams, setQueue]);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
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
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      controller.abort();
    };
  }, [searchQuery]);

  const runSearch = useCallback(
    async (rawQuery: string = searchQuery) => {
      const normalizedQuery = rawQuery.trim();
      const runId = ++searchRunIdRef.current;

      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }

      if (normalizedQuery.length < 2) {
        setSearchResults([]);
        setSearchError("");
        setIsSearching(false);
        return;
      }

      setLastSubmittedQuery(normalizedQuery);

      const controller = new AbortController();
      searchAbortRef.current = controller;

      setIsSearching(true);
      setSearchError("");

      try {
        const results = (await searchSongs(normalizedQuery, undefined, controller.signal)) as HomeSong[];
        if (controller.signal.aborted || runId !== searchRunIdRef.current) {
          return;
        }

        const safeResults = Array.isArray(results) ? results : [];
        setSearchResults(safeResults);

        if (safeResults.length === 0) {
          setSearchError("");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        if (runId !== searchRunIdRef.current) return;
        console.error("Search failed:", error);
        setSearchResults([]);
        setSearchError("Search hit a snag. Worth trying again.");
      } finally {
        if (runId === searchRunIdRef.current && !controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    },
    [searchQuery]
  );

  useEffect(() => {
    const paramQuery = (searchParams.get("q") || searchParams.get("query") || "").trim();
    if (!paramQuery || handledUrlSearchRef.current === paramQuery) return;

    handledUrlSearchRef.current = paramQuery;
    setSearchQuery(paramQuery);
    setShowSuggestions(false);
    void runSearch(paramQuery);
  }, [searchParams, runSearch]);

  const clearSearch = useCallback(() => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    searchRunIdRef.current += 1;
    setSearchQuery("");
    setSearchResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError("");
    setLastSubmittedQuery("");
    setIsLoadingSuggestions(false);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    return () => {
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
    };
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
      }
    };

    document.addEventListener("mousedown", handler);
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
      setSearchError("");
      void runSearch(suggestion);
    },
    [runSearch]
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
        className="relative rounded-3xl border border-gray-200/60 dark:border-white/12 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.2),transparent_46%),radial-gradient(circle_at_85%_5%,rgba(16,185,129,0.14),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(245,245,245,0.62))] dark:bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.16),transparent_45%),radial-gradient(circle_at_85%_5%,rgba(16,185,129,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] backdrop-blur-2xl p-5 sm:p-7 md:p-9 overflow-visible"
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
                  const nextQuery = event.target.value;
                  const nextNormalized = nextQuery.trim().toLowerCase();
                  const submittedNormalized = lastSubmittedQuery.trim().toLowerCase();

                  setSearchQuery(nextQuery);
                  setShowSuggestions(true);

                  if (!nextNormalized || nextNormalized !== submittedNormalized) {
                    setSearchResults([]);
                    setSearchError("");
                    setLastSubmittedQuery("");
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setShowSuggestions(false);
                    void runSearch();
                  }
                }}
                className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/35 px-3 font-medium"
              />

              {searchQuery ? (
                <button
                  onClick={clearSearch}
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
