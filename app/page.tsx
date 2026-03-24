"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
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
  Flame,
  Radio,
  Clock,
  Star,
} from "lucide-react";
import NextImage from "next/image";
import { getHDThumbnail } from "./lib/thumbnail";

// ─── ANIMATIONS ────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

// ─── COMPONENTS ────────────────────────────────────────

const SectionHeader = ({ 
  title, 
  subtitle, 
  icon: Icon,
  onSeeAll 
}: { 
  title: string; 
  subtitle?: string; 
  icon?: any;
  onSeeAll?: () => void 
}) => (
  <div className="flex items-end justify-between mb-6 sm:mb-8 px-0.5">
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {Icon && <Icon size={28} className="text-pink-500 dark:text-pink-400" />}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-white/40">
          {subtitle}
        </p>
      )}
    </div>
    {onSeeAll && (
      <button
        onClick={onSeeAll}
        className="group flex items-center gap-1.5 text-xs sm:text-sm font-bold text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 transition-colors"
      >
        See All
        <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
      </button>
    )}
  </div>
);

const ScrollRow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-4 pt-1 px-0 -ms-3 sm:-ms-4 md:-ms-5 pe-3 sm:pe-4 md:pe-5 custom-scrollbar snap-x snap-mandatory scroll-smooth ${className}`}>
    {children}
  </div>
);

const SongCard = ({ song, onClick, loading = false }: { song: any; onClick: () => void; loading?: boolean }) => (
  <motion.div
    whileHover={{ y: -6 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className="min-w-[150px] sm:min-w-[170px] md:min-w-[190px] lg:min-w-[210px] group cursor-pointer snap-start flex-shrink-0"
  >
    <div className="aspect-square relative rounded-[16px] overflow-hidden mb-3 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-white/[0.08] dark:to-white/[0.02] shadow-md group-hover:shadow-2xl transition-all duration-500">
      {song.cover ? (
        <NextImage
          src={getHDThumbnail(song.cover) || song.cover}
          alt={song.title}
          width={210}
          height={210}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 150px, (max-width: 1024px) 170px, (max-width: 1280px) 190px, 210px"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-600/10">
          <Music size={40} className="text-white/30" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-16 h-16 bg-pink-500 dark:bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-600 rounded-full flex items-center justify-center shadow-2xl transition-all"
        >
          <Play size={24} fill="white" className="text-white ml-1" />
        </motion.button>
      </div>
    </div>
    <div className="px-0 space-y-1.5">
      <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm sm:text-base leading-snug">
        {song.title}
      </h4>
      <p className="text-gray-500 dark:text-white/50 text-xs sm:text-sm font-medium truncate">
        {song.artist}
      </p>
    </div>
  </motion.div>
);

const HeroCard = ({ song, onClick }: { song: any; onClick: () => void }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-full rounded-[24px] md:rounded-[32px] overflow-hidden cursor-pointer group"
    >
      <div className="relative aspect-[4/3] sm:aspect-[16/10] md:aspect-[21/9] w-full bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.08]">
        {song.cover && (
          <NextImage
            src={getHDThumbnail(song.cover) || song.cover}
            alt={song.title}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, (max-width: 1280px) 90vw, 1240px"
            priority
            onLoad={() => setImageLoaded(true)}
          />
        )}
      </div>

      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-0 group-hover:bg-black/10 transition-all duration-300" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-10 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 sm:space-y-5 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 text-xs sm:text-sm font-bold text-white">
            <Sparkles size={14} className="text-yellow-300" />
            Featured Today
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-lg">
              {song.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80 font-medium drop-shadow">
              {song.artist}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-base sm:text-lg transition-all shadow-2xl hover:shadow-pink-500/50"
          >
            <Play size={20} fill="white" />
            Play
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

const HomeSkeleton = () => (
  <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-5 md:px-8 lg:px-12 py-6 sm:py-8 space-y-10 sm:space-y-14 animate-pulse">
    <div className="space-y-3">
      <div className="h-14 sm:h-20 w-72 bg-gray-200 dark:bg-white/[0.06] rounded-2xl" />
      <div className="h-5 w-56 bg-gray-100 dark:bg-white/[0.04] rounded-lg" />
    </div>
    <div className="h-64 sm:h-96 md:h-[450px] w-full bg-gray-200 dark:bg-white/[0.06] rounded-3xl" />
    <div className="space-y-6">
      <div className="h-8 w-52 bg-gray-200 dark:bg-white/[0.06] rounded-xl" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="min-w-[150px] space-y-3 flex-shrink-0">
            <div className="aspect-square bg-gray-200 dark:bg-white/[0.06] rounded-2xl" />
            <div className="h-4 w-32 bg-gray-100 dark:bg-white/[0.04] rounded-lg" />
            <div className="h-3 w-24 bg-gray-100 dark:bg-white/[0.04] rounded-lg" />
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
  const [timeOfDay, setTimeOfDay] = useState("evening");
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5) {
      setGreeting("Night Owl");
      setTimeOfDay("night");
    } else if (hour < 12) {
      setGreeting("Good Morning");
      setTimeOfDay("morning");
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
      setTimeOfDay("afternoon");
    } else {
      setGreeting("Good Evening");
      setTimeOfDay("evening");
    }
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
          setTrending(trendingData || []);
          setCharts(chartsData || []);
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

  // Fetch suggestions with debounce
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
        setSearchResults(results || []);
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
      className="w-full max-w-[1400px] mx-auto px-3 sm:px-5 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8 space-y-10 sm:space-y-14 md:space-y-16 pb-40 sm:pb-44 md:pb-48"
    >
      {/* ═══ HERO HEADER WITH SEARCH ═══ */}
      <motion.header variants={fadeUp} className="pt-2 sm:pt-4 md:pt-6 space-y-6 sm:space-y-8">
        {/* Greeting Section */}
        <div className="space-y-1 sm:space-y-2">
          <motion.h1
            variants={slideInLeft}
            suppressHydrationWarning
            className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight tracking-tight"
          >
            {greeting}
            <span className="text-pink-500/20 dark:text-pink-400/20">.</span>
          </motion.h1>
          <motion.p
            variants={slideInLeft}
            className="text-base sm:text-lg text-gray-600 dark:text-white/50 font-medium"
          >
            Discover your next favorite track
          </motion.p>
        </div>

        {/* Search Bar - Apple Music Style */}
        <motion.div variants={fadeUp} className="relative max-w-2xl">
          <div className="relative flex items-center bg-white/60 dark:bg-white/[0.08] backdrop-blur-3xl border border-gray-200/40 dark:border-white/[0.12] rounded-2xl px-4 sm:px-5 py-3 sm:py-4 transition-all duration-300 hover:bg-white/80 dark:hover:bg-white/[0.12] focus-within:border-pink-400/50 dark:focus-within:border-pink-400/30 focus-within:bg-white dark:focus-within:bg-white/[0.15] shadow-sm hover:shadow-lg">
            <Search size={20} className="text-gray-500 dark:text-white/40 shrink-0" />
            <input
              type="text"
              placeholder="Search songs, artists..."
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
              className="w-full bg-transparent border-none outline-none text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/30 px-4 font-medium"
            />
            {isSearching && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-gray-300 dark:border-white/20 border-t-pink-500 dark:border-t-pink-400 rounded-full shrink-0"
              />
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-3 z-50 bg-white dark:bg-gray-950 border border-gray-200/40 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
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
                    className="w-full flex items-center gap-3 px-5 py-3 text-left text-sm font-medium text-gray-800 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.08] transition-colors border-b border-gray-100/50 dark:border-white/[0.05] last:border-b-0"
                  >
                    <Search size={16} className="text-gray-400 dark:text-white/20 shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Quick Filter Buttons */}
        <motion.div variants={fadeUp} className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              setShowSuggestions(false);
            }}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-all shadow-sm"
          >
            <TrendingUp size={16} />
            Trending
          </button>
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              setShowSuggestions(false);
            }}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-all shadow-sm"
          >
            <BarChart3 size={16} />
            Charts
          </button>
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowSuggestions(false);
              }}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10 hover:bg-pink-100 dark:hover:bg-pink-500/20 transition-all shadow-sm"
            >
              Clear
            </motion.button>
          )}
        </motion.div>
      </motion.header>

      {/* ═══ SEARCH RESULTS ═══ */}
      <AnimatePresence mode="wait">
        {searchQuery && searchResults.length > 0 && (
          <motion.section
            key="search-results"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6 sm:space-y-8"
          >
            <SectionHeader
              title={`Results for "${searchQuery}"`}
              subtitle={`${searchResults.length} songs found`}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {searchResults.slice(0, 24).map((item) => (
                <SongCard
                  key={item.id}
                  song={item}
                  onClick={() => handleSongClick(item)}
                />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ═══ NO RESULTS STATE ═══ */}
      {searchQuery && searchResults.length === 0 && !isSearching && (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-12 sm:py-16"
        >
          <Music size={48} className="text-gray-300 dark:text-white/10 mb-4" />
          <p className="text-gray-500 dark:text-white/50 font-medium">No results found for "{searchQuery}"</p>
          <p className="text-gray-400 dark:text-white/30 text-sm mt-2">Try different keywords</p>
        </motion.div>
      )}

      {/* Only show these sections when not searching */}
      {!searchQuery && (
        <>
          {/* ═══ HERO FEATURED ═══ */}
          {trending.length > 0 && (
            <motion.section variants={fadeUp} className="w-full">
              <HeroCard
                song={trending[0]}
                onClick={() => handleSongClick(trending[0])}
              />
            </motion.section>
          )}

          {/* ═══ TRENDING NOW ═══ */}
          {trending.length > 1 && (
            <motion.section variants={fadeUp} className="space-y-5 sm:space-y-6">
              <SectionHeader
                icon={Flame}
                title="Trending Now"
                subtitle="Top picks this week"
              />
              <ScrollRow>
                {trending.slice(1, 13).map((song) => (
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
          {charts.length > 0 && (
            <motion.section variants={fadeUp} className="space-y-5 sm:space-y-6">
              <SectionHeader
                icon={BarChart3}
                title="Top Charts"
                subtitle="Most popular songs"
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

          {/* ═══ RADIO MIXES ═══ */}
          {trending.length > 12 && (
            <motion.section variants={fadeUp} className="space-y-5 sm:space-y-6">
              <SectionHeader
                icon={Radio}
                title="Listen Again"
                subtitle="Continue from trending"
              />
              <ScrollRow>
                {trending.slice(12, 24).map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onClick={() => handleSongClick(song)}
                  />
                ))}
              </ScrollRow>
            </motion.section>
          )}
        </>
      )}
    </motion.div>
  );
}

