"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Flame, Heart, Music, Play, Search, X } from "lucide-react";
import { usePlayer } from "@/app/context/PlayerContext";
import { getCharts, getSearchSuggestions, getTrendingSongs, searchSongs } from "@/app/lib/api";
import { getHDThumbnail } from "./lib/thumbnail";
import type { Song } from "@/app/types/song";

type HomeSong = Song & Record<string, unknown>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

function resolveGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Night Owl";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const SectionHeading = ({ title, subtitle, icon: Icon }: SectionHeadingProps) => (
  <div className="space-y-2 px-0.5">
    <div className="flex items-center gap-3">
      <Icon size={24} className="text-sky-500 dark:text-sky-400" />
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
        {title}
      </h2>
    </div>
    {subtitle ? (
      <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-white/40">{subtitle}</p>
    ) : null}
  </div>
);

const HorizontalRail = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-4 pt-1 px-0 -ms-3 sm:-ms-4 md:-ms-5 pe-3 sm:pe-4 md:pe-5 custom-scrollbar snap-x snap-mandatory scroll-smooth">
    {children}
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
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      className="min-w-37.5 sm:min-w-42.5 md:min-w-47.5 lg:min-w-52.5 group cursor-pointer snap-start shrink-0 relative"
      onClick={onPlay}
    >
      <div className="aspect-square relative rounded-2xl overflow-hidden mb-3 bg-linear-to-br from-slate-300 to-slate-400 dark:from-white/8 dark:to-white/2 shadow-md group-hover:shadow-2xl transition-all duration-500">
        {coverSrc ? (
          <NextImage
            src={coverSrc}
            alt={song.title}
            width={210}
            height={210}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 150px, (max-width: 1024px) 170px, (max-width: 1280px) 190px, 210px"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-sky-400/25 to-emerald-400/25 dark:from-sky-500/15 dark:to-emerald-500/15">
            <Music size={40} className="text-white/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-300" />

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
          className="absolute top-2 right-2 p-2 rounded-full bg-black/40 hover:bg-sky-500 transition-all backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100"
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

type SpotlightProps = {
  song: HomeSong;
  onPlay: () => void;
};

const SpotlightCard = ({ song, onPlay }: SpotlightProps) => {
  const coverSrc = song.cover ? getHDThumbnail(song.cover) || song.cover : null;

  return (
    <motion.section variants={fadeUp} className="relative overflow-hidden rounded-3xl border border-gray-200/50 dark:border-white/12 bg-white/65 dark:bg-white/6 backdrop-blur-2xl">
      <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
        <div className="p-5 sm:p-7 md:p-9 flex flex-col justify-center gap-4 sm:gap-5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-500">Featured Track</p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-[1.05] tracking-tight">
            {song.title}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-white/55 font-medium truncate">{song.artist}</p>
          <div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPlay}
              className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-xl shadow-sky-500/30"
            >
              <Play size={18} fill="white" className="ml-0.5" />
              Play Now
            </motion.button>
          </div>
        </div>

        <div className="relative min-h-64 sm:min-h-80 md:min-h-full bg-linear-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-white/6 dark:via-white/4 dark:to-white/6">
          {coverSrc ? (
            <NextImage
              src={coverSrc}
              alt={song.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 42vw"
            />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-black/35 via-black/5 to-transparent" />
        </div>
      </div>
    </motion.section>
  );
};

type HeaderPreviewProps = {
  song: HomeSong;
  onPlay: () => void;
};

const HeaderPreview = ({ song, onPlay }: HeaderPreviewProps) => {
  const coverSrc = song.cover ? getHDThumbnail(song.cover) || song.cover : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/12 bg-white/70 dark:bg-white/8 backdrop-blur-xl p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-slate-200 dark:bg-white/10 shrink-0">
          {coverSrc ? (
            <NextImage
              src={coverSrc}
              alt={song.title}
              fill
              className="object-cover"
              sizes="96px"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music size={26} className="text-gray-500 dark:text-white/45" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-500 mb-1">Now Around</p>
          <h3 className="font-black text-base sm:text-lg text-gray-900 dark:text-white truncate">{song.title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-white/55 truncate">{song.artist}</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlay}
          className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-lg"
          title="Play featured"
        >
          <Play size={16} fill="white" className="ml-0.5" />
        </motion.button>
      </div>
    </div>
  );
};

const HomeSkeleton = () => (
  <div className="w-full max-w-350 mx-auto px-3 sm:px-5 md:px-8 lg:px-12 py-6 sm:py-8 space-y-8 sm:space-y-10 animate-pulse">
    <div className="h-70 sm:h-80 md:h-88 rounded-3xl bg-gray-200 dark:bg-white/7" />
    <div className="h-72 sm:h-96 rounded-3xl bg-gray-200 dark:bg-white/7" />
    <div className="space-y-4">
      <div className="h-8 w-52 bg-gray-200 dark:bg-white/7 rounded-xl" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="min-w-37.5 space-y-3 shrink-0">
            <div className="aspect-square bg-gray-200 dark:bg-white/7 rounded-2xl" />
            <div className="h-4 w-30 bg-gray-100 dark:bg-white/5 rounded-lg" />
            <div className="h-3 w-22 bg-gray-100 dark:bg-white/5 rounded-lg" />
          </div>
        ))}
      </div>
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
  const [isLoading, setIsLoading] = useState(true);

  const [trending, setTrending] = useState<HomeSong[]>([]);
  const [charts, setCharts] = useState<HomeSong[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<HomeSong[]>([]);
  const [searchError, setSearchError] = useState("");

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHandledSharedSongRef = useRef(false);
  const handledUrlSearchRef = useRef("");

  useEffect(() => {
    setGreeting(resolveGreeting());
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const [trendingData, chartsData] = await Promise.all([
          getTrendingSongs(controller.signal),
          getCharts("songs", controller.signal),
        ]);

        if (!controller.signal.aborted) {
          setTrending(Array.isArray(trendingData) ? (trendingData as HomeSong[]) : []);
          setCharts(Array.isArray(chartsData) ? (chartsData as HomeSong[]) : []);
        }
      } catch (error) {
        console.error("Failed to fetch homepage data:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, []);

  const queueSongFromList = useCallback(
    (list: HomeSong[], song: HomeSong) => {
      const index = list.findIndex((item) => item.id === song.id);
      if (index >= 0) {
        setQueue(list, index);
        return;
      }
      setQueue([song], 0);
    },
    [setQueue]
  );

  useEffect(() => {
    const playId = searchParams.get("play");
    if (!playId || hasHandledSharedSongRef.current) return;

    hasHandledSharedSongRef.current = true;
    const sharedTitle = (searchParams.get("title") || "").trim();
    const sharedArtist = (searchParams.get("artist") || "").trim();

    const inMemoryMatch = [...songs, ...trending, ...charts, ...searchResults].find(
      (song) => song?.id === playId
    ) as HomeSong | undefined;

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
              const artistMatches =
                !normalizedArtist || (song.artist || "").toLowerCase().includes(normalizedArtist);
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
                title: sharedTitle || "Shared Track",
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
          setSearchError("Shared track could not be resolved.");
        }
      } catch {
        if (!controller.signal.aborted) {
          setSearchError("Failed to load shared track.");
        }
      }
    })();

    return () => controller.abort();
  }, [searchParams, songs, trending, charts, searchResults, setQueue]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await getSearchSuggestions(searchQuery, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runSearch = useCallback(
    async (rawQuery: string = searchQuery) => {
      const normalizedQuery = rawQuery.trim();

      if (normalizedQuery.length < 2) {
        setSearchResults([]);
        setSearchError("");
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setSearchError("");

      try {
        const results = (await searchSongs(normalizedQuery)) as HomeSong[];
        setSearchResults(Array.isArray(results) ? results : []);

        if (!results || results.length === 0) {
          setSearchError(`No results found for "${normalizedQuery}"`);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Search failed:", error);
        setSearchResults([]);
        setSearchError("Search failed. Try again.");
      } finally {
        setIsSearching(false);
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
    setSearchQuery("");
    setSearchResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError("");
  }, []);

  const visibleSearchResults = useMemo(() => searchResults.slice(0, 24), [searchResults]);

  if (isLoading) return <HomeSkeleton />;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-350 mx-auto px-3 sm:px-5 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8 space-y-8 sm:space-y-10 md:space-y-12 pb-40 sm:pb-44 md:pb-48"
    >
      <motion.header
        variants={fadeUp}
        className="relative overflow-hidden rounded-3xl border border-gray-200/60 dark:border-white/12 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.22),transparent_48%),radial-gradient(circle_at_85%_5%,rgba(16,185,129,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(245,245,245,0.62))] dark:bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.2),transparent_45%),radial-gradient(circle_at_85%_5%,rgba(16,185,129,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] backdrop-blur-2xl p-5 sm:p-7 md:p-9"
      >
        <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute -top-16 -right-10 w-44 h-44 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-end">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] sm:text-[12px] font-extrabold uppercase tracking-[0.24em] text-sky-500">
                {greeting}
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-[1.02] tracking-tight">
                Rebuilt Home,
                <br />
                Ready to Play.
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-white/60 font-medium max-w-2xl">
                Search a track, hit play, and move through trending and current charts without noise.
              </p>
            </div>

            <div className="relative max-w-2xl">
              <div className="relative flex items-center bg-white/85 dark:bg-black/35 border border-white/70 dark:border-white/12 rounded-2xl px-4 sm:px-5 py-3.5 shadow-sm">
                <Search size={20} className="text-gray-500 dark:text-white/45 shrink-0" />
                <input
                  type="text"
                  placeholder="Search songs, artists..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setShowSuggestions(false);
                      void runSearch();
                    }
                  }}
                  className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/35 px-4 font-medium"
                />
                {isSearching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                    className="w-4 h-4 border-2 border-gray-300 dark:border-white/20 border-t-sky-500 dark:border-t-sky-400 rounded-full shrink-0"
                  />
                ) : null}
              </div>

              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 ? (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-3 z-50 bg-white dark:bg-gray-950 border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion}-${index}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setShowSuggestions(false);
                          void runSearch(suggestion);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left text-sm font-medium text-gray-800 dark:text-white/75 hover:bg-gray-50 dark:hover:bg-white/7 transition-colors border-b border-gray-100/70 dark:border-white/5 last:border-b-0"
                      >
                        <Search size={15} className="text-gray-400 dark:text-white/25 shrink-0" />
                        <span className="truncate">{suggestion}</span>
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <button
                onClick={() => {
                  clearSearch();
                  if (trending.length > 0) {
                    setQueue(trending, 0);
                  }
                }}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold text-gray-900 dark:text-white bg-white/85 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 transition-all"
              >
                <Flame size={16} />
                Play Trending
              </button>

              <button
                onClick={() => {
                  clearSearch();
                  if (charts.length > 0) {
                    setQueue(charts, 0);
                  }
                }}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold text-gray-900 dark:text-white bg-white/85 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 transition-all"
              >
                <BarChart3 size={16} />
                Play Charts
              </button>

              {searchQuery ? (
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 transition-all"
                >
                  <X size={16} />
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {trending.length > 0 ? (
            <motion.div variants={fadeUp}>
              <HeaderPreview
                song={trending[0]}
                onPlay={() => queueSongFromList(trending, trending[0])}
              />
            </motion.div>
          ) : null}
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {searchQuery && visibleSearchResults.length > 0 ? (
          <motion.section
            key="search-results"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6 sm:space-y-7"
          >
            <SectionHeading
              icon={Search}
              title={`Results for "${searchQuery}"`}
              subtitle={`${visibleSearchResults.length} tracks ready`}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {visibleSearchResults.map((song) => (
                <TrackCard
                  key={song.id}
                  song={song}
                  onPlay={() => queueSongFromList(searchResults, song)}
                  onFavorite={toggleFavorite}
                  isFav={isFavorite(song.id)}
                />
              ))}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {searchQuery && visibleSearchResults.length === 0 && !isSearching ? (
        <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
          <Music size={48} className="text-gray-300 dark:text-white/12 mb-4" />
          {searchError ? (
            <>
              <p className="text-gray-700 dark:text-white/70 font-medium max-w-md">{searchError}</p>
              <p className="text-gray-400 dark:text-white/30 text-sm mt-2">Try another artist or track name.</p>
            </>
          ) : (
            <>
              <p className="text-gray-500 dark:text-white/50 font-medium">No results found for "{searchQuery}"</p>
              <p className="text-gray-400 dark:text-white/30 text-sm mt-2">Try a different keyword.</p>
            </>
          )}
        </motion.div>
      ) : null}

      {!searchQuery ? (
        <>
          {trending.length > 0 ? (
            <SpotlightCard
              song={trending[0]}
              onPlay={() => queueSongFromList(trending, trending[0])}
            />
          ) : null}

          {trending.length > 1 ? (
            <motion.section variants={fadeUp} className="space-y-5 sm:space-y-6">
              <SectionHeading
                icon={Flame}
                title="Trending Now"
                subtitle="Fast-moving tracks people are looping right now"
              />

              <HorizontalRail>
                {trending.slice(1, 13).map((song) => (
                  <TrackCard
                    key={song.id}
                    song={song}
                    onPlay={() => queueSongFromList(trending, song)}
                    onFavorite={toggleFavorite}
                    isFav={isFavorite(song.id)}
                  />
                ))}
              </HorizontalRail>
            </motion.section>
          ) : null}

          {charts.length > 0 ? (
            <motion.section variants={fadeUp} className="space-y-5 sm:space-y-6">
              <SectionHeading
                icon={BarChart3}
                title="Top Charts"
                subtitle="Current chart leaders, refreshed by region"
              />

              <HorizontalRail>
                {charts.slice(0, 12).map((song) => (
                  <TrackCard
                    key={song.id}
                    song={song}
                    onPlay={() => queueSongFromList(charts, song)}
                    onFavorite={toggleFavorite}
                    isFav={isFavorite(song.id)}
                  />
                ))}
              </HorizontalRail>
            </motion.section>
          ) : null}
        </>
      ) : null}
    </motion.div>
  );
}
