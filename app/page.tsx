"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePlayer } from "@/app/context/PlayerContext";
import { getTrendingSongs, getCharts, search as apiSearch, getSearchSuggestions } from "@/app/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Music,
  Search,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Heart,
  Sparkles,
} from "lucide-react";
import NextImage from "next/image";
import { getHDThumbnail } from "./lib/thumbnail";

// ─── ANIMATIONS ────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 200, damping: 28 }
  }
};

// ─── COMPONENTS ────────────────────────────────────────

const SectionHeader = ({ title, subtitle, onSeeAll }: { title: string; subtitle?: string; onSeeAll?: () => void }) => (
  <div className="flex items-end justify-between mb-6 sm:mb-8 px-1">
    <div className="space-y-1">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs sm:text-sm font-medium text-gray-400 dark:text-white/30 uppercase tracking-widest">
          {subtitle}
        </p>
      )}
    </div>
    {onSeeAll && (
      <button
        onClick={onSeeAll}
        className="group flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
      >
        See All
        <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    )}
  </div>
);

const ScrollRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto pb-6 pt-2 px-1 -mx-1 custom-scrollbar snap-x snap-mandatory">
    {children}
  </div>
);

const SongCard = ({ song, onClick }: { song: any; onClick: () => void }) => (
  <motion.div
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] group cursor-pointer snap-start"
  >
    <div className="aspect-square relative rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-white/[0.03] shadow-sm group-hover:shadow-2xl transition-all duration-500">
      {song.cover ? (
        <NextImage
          src={getHDThumbnail(song.cover) || song.cover}
          alt={song.title}
          width={200}
          height={200}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          sizes="(max-width: 640px) 140px, (max-width: 1024px) 160px, (max-width: 1280px) 180px, 200px"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 dark:from-white/10 dark:to-white/5">
          <Music size={32} className="text-white/30" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
        <div className="w-12 h-12 bg-white/95 dark:bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl scale-90 group-hover:scale-100">
          <Play size={18} fill="currentColor" className="text-black dark:text-white ml-0.5" />
        </div>
      </div>
    </div>
    <div className="px-0.5 space-y-0.5">
      <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm sm:text-base">
        {song.title}
      </h4>
      <p className="text-gray-400 dark:text-white/30 text-xs sm:text-sm font-medium truncate">
        {song.artist}
      </p>
    </div>
  </motion.div>
);

const HeroCard = ({ song, onClick }: { song: any; onClick: () => void }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl sm:rounded-[2rem] overflow-hidden cursor-pointer group shadow-2xl"
  >
    <div className="absolute inset-0 bg-gray-200 dark:bg-white/[0.03]">
      {song.cover && (
        <NextImage
          src={getHDThumbnail(song.cover) || song.cover}
          alt={song.title}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 1400px) 85vw, 1200px"
          priority
        />
      )}
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

    <div className="absolute bottom-0 left-0 p-5 sm:p-8 md:p-12 space-y-2 sm:space-y-4 max-w-2xl">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-widest">
        <Sparkles size={12} className="text-yellow-400" />
        Featured
      </div>
      <div className="space-y-1 sm:space-y-2">
        <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-2xl">
          {song.title}
        </h3>
        <p className="text-sm sm:text-lg md:text-xl text-white/70 font-medium">
          {song.artist}
        </p>
      </div>
      <div className="pt-2">
        <button className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-white text-black font-bold text-sm sm:text-base hover:bg-white/90 transition-all shadow-xl hover:shadow-2xl active:scale-95">
          <Play size={18} fill="currentColor" />
          Listen Now
        </button>
      </div>
    </div>
  </motion.div>
);

const HomeSkeleton = () => (
  <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-10 lg:px-16 py-8 space-y-12 sm:space-y-16 animate-pulse">
    <div className="space-y-4">
      <div className="h-16 sm:h-24 w-64 bg-gray-200 dark:bg-white/[0.05] rounded-2xl" />
      <div className="h-6 w-48 bg-gray-100 dark:bg-white/[0.03] rounded-xl" />
    </div>
    <div className="h-[300px] sm:h-[450px] w-full bg-gray-200 dark:bg-white/[0.05] rounded-[2rem]" />
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 dark:bg-white/[0.05] rounded-xl" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="min-w-[140px] space-y-3">
            <div className="aspect-square bg-gray-200 dark:bg-white/[0.05] rounded-2xl" />
            <div className="h-4 w-3/4 bg-gray-100 dark:bg-white/[0.03] rounded-lg" />
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
  const { setQueue, songs } = usePlayer();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [trending, setTrending] = useState<any[]>([]);
  const [charts, setCharts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [greeting, setGreeting] = useState("Hello");
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Fetch trending and charts on mount
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const [trendingData, chartsData] = await Promise.all([
          getTrendingSongs(controller.signal),
          getCharts("songs", controller.signal),
        ]);
        
        if (!controller.signal.aborted) {
          setTrending(trendingData);
          setCharts(chartsData);
        }
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, []);

  // Fetch suggestions
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
          setSuggestions(Array.isArray(data) ? data.slice(0, 6) : []);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      controller.abort();
    };
  }, [searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = useCallback(
    async (query: string = searchQuery) => {
      if (!query || query.length < 2) return;
      
      setIsSearching(true);
      try {
        const results = await apiSearch(query, "song");
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery]
  );

  const handleSongClick = useCallback(
    (song: any) => {
      const queue = searchQuery ? searchResults : trending;
      const index = queue.findIndex((s) => s.id === song.id);
      if (index !== -1) {
        setQueue(queue, index);
      }
    },
    [searchQuery, searchResults, trending, setQueue]
  );

  if (isLoading) return <HomeSkeleton />;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-[1400px] mx-auto px-3 sm:px-5 md:px-10 lg:px-16 py-4 sm:py-6 md:py-8 space-y-8 sm:space-y-12 pb-36 sm:pb-40"
    >
      {/* ═══ HERO HEADER ═══ */}
      <header className="pt-2 sm:pt-4 md:pt-8 space-y-6 sm:space-y-8">
        <div className="space-y-2">
          <motion.h1
            variants={fadeUp}
            suppressHydrationWarning
            className="text-[clamp(1.75rem,6vw,4rem)] font-black text-gray-900 dark:text-white leading-tight tracking-tight"
          >
            {greeting}<span className="text-black/5 dark:text-white/5">.</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg text-gray-400 dark:text-white/40 font-medium"
          >
            Discover music that moves you
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div variants={fadeUp} className="relative max-w-2xl">
          <div className="relative flex items-center bg-gray-100/50 dark:bg-white/[0.04] backdrop-blur-2xl border border-gray-200/60 dark:border-white/[0.06] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 transition-all duration-300 focus-within:border-gray-400 dark:focus-within:border-white/15 focus-within:bg-white dark:focus-within:bg-white/[0.08]">
            <Search size={18} className="text-gray-400 dark:text-white/25 shrink-0" />
            <input
              type="text"
              placeholder="Search songs, artists, albums..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setShowSuggestions(false);
                  handleSearch();
                }
              }}
              className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 px-3 font-medium"
            />
            {isSearching && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="w-4 h-4 border-2 border-gray-200 dark:border-white/10 border-t-gray-600 dark:border-t-white/70 rounded-full shrink-0"
              />
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#1a1a1a] border border-gray-200/60 dark:border-white/[0.08] rounded-xl shadow-xl overflow-hidden"
              >
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                      handleSearch(suggestion);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <Search size={14} className="text-gray-300 dark:text-white/20 shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp} className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              setShowSuggestions(false);
            }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-white/60 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all"
          >
            <TrendingUp size={14} />
            Trending
          </button>
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              setShowSuggestions(false);
            }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-white/60 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all"
          >
            <BarChart3 size={14} />
            Charts
          </button>
        </motion.div>
      </header>

      {/* ═══ SEARCH RESULTS ═══ */}
      {searchQuery && searchResults.length > 0 && (
        <motion.section variants={fadeUp} className="space-y-6">
          <SectionHeader title={`Results for "${searchQuery}"`} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {searchResults.slice(0, 20).map((item) => (
              <SongCard
                key={item.id}
                song={item}
                onClick={() => handleSongClick(item)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ═══ HERO FEATURED ═══ */}
      {!searchQuery && trending.length > 0 && (
        <motion.section variants={fadeUp} className="w-full">
          <HeroCard
            song={trending[0]}
            onClick={() => handleSongClick(trending[0])}
          />
        </motion.section>
      )}

      {/* ═══ TRENDING SONGS ═══ */}
      {!searchQuery && trending.length > 0 && (
        <motion.section variants={fadeUp} className="space-y-0">
          <SectionHeader
            title="Trending Now"
            subtitle="Top tracks this week"
            onSeeAll={() => {}}
          />
          <ScrollRow>
            {trending.slice(0, 12).map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onClick={() => handleSongClick(song)}
              />
            ))}
          </ScrollRow>
        </motion.section>
      )}

      {/* ═══ TOP CHARTS ═══ */}
      {!searchQuery && charts.length > 0 && (
        <motion.section variants={fadeUp} className="space-y-0">
          <SectionHeader
            title="Top Charts"
            subtitle="Most popular songs"
            onSeeAll={() => {}}
          />
          <ScrollRow>
            {charts.slice(0, 12).map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onClick={() => {
                  const index = charts.findIndex((s) => s.id === song.id);
                  if (index !== -1) {
                    setQueue(charts, index);
                  }
                }}
              />
            ))}
          </ScrollRow>
        </motion.section>
      )}
    </motion.div>
  );
}

