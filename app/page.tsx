"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { usePlayer } from "@/app/context/PlayerContext";
import { search as apiSearch, getSongsByEntity, getSearchSuggestions } from "@/app/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Music, 
  Search, 
  Github,
  Folder,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Heart,
  ExternalLink,
  Sparkles,
  Zap
} from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import { getHDThumbnail } from "./lib/thumbnail";

// ─── HELPER COMPONENTS ───────────────────────────────────

const SectionHeader = ({ title, subtitle, onSeeAll }: { title: string; subtitle?: string; onSeeAll?: () => void }) => (
  <div className="flex items-end justify-between mb-4 sm:mb-6 px-1">
    <div className="space-y-1">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-400 dark:text-white/30 uppercase tracking-widest">
          {subtitle}
        </p>
      )}
    </div>
    {onSeeAll && (
      <button 
        onClick={onSeeAll}
        className="group flex items-center gap-1 text-[11px] sm:text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
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

const HeroCard = ({ item, onClick }: { item: any; onClick: () => void }) => (
  <motion.div 
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl sm:rounded-[2rem] overflow-hidden cursor-pointer group shadow-2xl shadow-black/20"
  >
    <div className="absolute inset-0 bg-gray-200 dark:bg-white/[0.03]">
      {item.cover && (
        <NextImage 
          src={getHDThumbnail(item.cover) || ""} 
          alt={item.title} 
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
        />
      )}
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
    
    <div className="absolute bottom-0 left-0 p-5 sm:p-8 md:p-12 space-y-2 sm:space-y-4 max-w-2xl">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-widest">
        <Sparkles size={12} className="text-yellow-400" />
        Featured Selection
      </div>
      <div className="space-y-1 sm:space-y-2">
        <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl">
          {item.title}
        </h3>
        <p className="text-sm sm:text-lg md:text-xl text-white/70 font-medium tracking-tight">
          {item.artist}
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

const HeroCarousel = ({ items, onPlay }: { items: any[]; onPlay: (item: any) => void }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="relative w-full group overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-gray-100 dark:bg-white/[0.03]">
      <AnimatePresence mode="wait">
        <motion.div
          key={items[index].id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="w-full"
        >
          <HeroCard item={items[index]} onClick={() => onPlay(items[index])} />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 sm:bottom-8 right-6 sm:right-12 flex gap-2 sm:gap-3 z-20">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${
              i === index ? "w-6 sm:w-10 bg-white" : "w-1.5 sm:w-2 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => setIndex((prev) => (prev - 1 + items.length) % items.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/40"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => setIndex((prev) => (prev + 1) % items.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/40"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

const GENRE_CONFIG: Record<string, { color: string; accent: string }> = {
  "Bollywood":  { color: "from-rose-500/40 to-pink-600/30",    accent: "#f43f5e" },
  "Punjabi":    { color: "from-amber-400/40 to-orange-500/30",  accent: "#f59e0b" },
  "Indipop":    { color: "from-violet-500/40 to-purple-600/30", accent: "#8b5cf6" },
  "Devotional": { color: "from-orange-500/40 to-amber-600/30",  accent: "#f97316" },
  "Pop":        { color: "from-sky-400/40 to-blue-500/30",      accent: "#0ea5e9" },
  "Hip Hop":    { color: "from-red-500/40 to-rose-600/30",      accent: "#ef4444" },
  "Rock":       { color: "from-zinc-500/40 to-stone-600/30",    accent: "#71717a" },
  "Jazz":       { color: "from-yellow-400/40 to-amber-500/30",  accent: "#eab308" },
  "Electronic": { color: "from-emerald-400/40 to-teal-500/30",  accent: "#10b981" },
  "Classical":  { color: "from-indigo-400/40 to-blue-500/30",   accent: "#6366f1" },
  "Chill":      { color: "from-cyan-400/40 to-teal-400/30",     accent: "#06b6d4" },
  "Party":      { color: "from-fuchsia-500/40 to-pink-500/30",  accent: "#d946ef" },
};

/** Convert ARGB integer (from YT Music API) to hex color */
function argbToHex(argb: number): string {
  const r = (argb >> 16) & 0xff;
  const g = (argb >> 8) & 0xff;
  const b = argb & 0xff;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.04, delayChildren: 0.1 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 24 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 200, damping: 28 }
  }
};

const HomeSkeleton = () => (
  <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-10 lg:px-16 py-8 space-y-12 sm:space-y-16 animate-pulse">
    <div className="space-y-4">
      <div className="h-16 sm:h-24 w-64 bg-gray-200 dark:bg-white/[0.05] rounded-2xl" />
      <div className="h-6 w-48 bg-gray-100 dark:bg-white/[0.03] rounded-xl" />
    </div>
    <div className="h-[300px] sm:h-[450px] w-full bg-gray-200 dark:bg-white/[0.05] rounded-[2rem] sm:rounded-[3rem]" />
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 dark:bg-white/[0.05] rounded-xl" />
      <div className="flex gap-6 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="min-w-[180px] space-y-3">
            <div className="aspect-square bg-gray-200 dark:bg-white/[0.05] rounded-2xl" />
            <div className="h-4 w-3/4 bg-gray-100 dark:bg-white/[0.03] rounded-lg" />
            <div className="h-3 w-1/2 bg-gray-100 dark:bg-white/[0.02] rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { 
    songs, 
    currentSongIndex, 
    isPlaying,
    colors,
    loadSongs,
    setQueue,
    recentlyPlayed,
    clearHistory
  } = usePlayer();
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isLocal, setIsLocal] = useState(false);
  const [greeting, setGreeting] = useState("Hello");
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<"song" | "artist" | "album" | "playlist">("song");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const skipNextAutoSearchRef = useRef(false);
  const [entityError, setEntityError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [topArtists, setTopArtists] = useState<{ name: string; browseId: string; thumbnail: string }[]>([]);
  const [dynamicMoods, setDynamicMoods] = useState<{ title: string; color: number }[]>([]);
  const [featuredSongs, setFeaturedSongs] = useState<any[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [chartsSongs, setChartsSongs] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Hydrate search history
  useEffect(() => {
    try {
      const saved = localStorage.getItem("grovy-search-history");
      if (saved) setSearchHistory(JSON.parse(saved).slice(0, 8));
    } catch (e) {}
  }, []);

  // Fetch search suggestions with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2 || isLocal) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await getSearchSuggestions(searchQuery, controller.signal);
        if (!controller.signal.aborted) {
          const items = Array.isArray(data) ? data.slice(0, 6) : [];
          setSuggestions(items.map((s: any) => (typeof s === "string" ? s : s.term || s.query || String(s))));
        }
      } catch {
        // ignore
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery, isLocal]);

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

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, searchType, selectedGenre]);

  // Handle shared song URL (?play=songId&title=...&artist=...)
  useEffect(() => {
    const playId = searchParams.get("play");
    if (!playId) return;
    const title = searchParams.get("title") || "";
    const artist = searchParams.get("artist") || "";
    // Search for the song and auto-play it
    loadSongs(title || playId).then((results) => {
      const match = results.find((s: any) => s.id === playId) || results[0];
      if (match) {
        setQueue([match, ...results.filter((s: any) => s.id !== match.id)], 0);
      }
    });
    // Clean URL
    window.history.replaceState({}, "", "/");
  }, [searchParams, loadSongs, setQueue]);

  const addToSearchHistory = useCallback((query: string) => {
    if (!query || query.length < 2) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q !== query);
      const updated = [query, ...filtered].slice(0, 8);
      localStorage.setItem("grovy-search-history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const fetchTrending = useCallback(async () => {
    setIsSearching(true);
    const data = await loadSongs("trending", "youtube&country=IN");
    setSearchResults(data);
    setSearchType("song");
    setIsSearching(false);
  }, [loadSongs]);

  const fetchCharts = useCallback(async () => {
    setIsSearching(true);
    const data = await loadSongs("charts", "youtube&country=IN");
    setSearchResults(data);
    setSearchType("song");
    setIsSearching(false);
  }, [loadSongs]);

  const handleManualSearch = useCallback(async (overrideQuery?: string) => {
    const query = overrideQuery ?? searchQuery;
    setIsSearching(true);
    setEntityError(null);
    addToSearchHistory(query);
    skipNextAutoSearchRef.current = true; // Prevent debounce from overwriting
    
    try {
      if (searchType === "song") {
         const results = await loadSongs(query || "trending", isLocal ? "local" : undefined);
         setSearchResults(results);
      } else {
         const data = await apiSearch(query, searchType);
         setSearchResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, isLocal, loadSongs, searchType, addToSearchHistory]);

  const handleEntityClick = useCallback(async (entity: any) => {
    setIsSearching(true);
    setEntityError(null);
    try {
       const fetchedSongs = await getSongsByEntity(entity.type, entity.id);
       
       if (fetchedSongs.length > 0) {
         // Guard: prevent the debounced auto-search from overwriting these results
         skipNextAutoSearchRef.current = true;
         setSearchResults(fetchedSongs);
         setSearchType("song");
         setSelectedGenre(`${entity.type}: ${entity.name}`);
       } else {
         setEntityError(`No songs found for this ${entity.type}`);
       }
    } catch (e) {
       console.error(e);
       setEntityError(`Failed to load ${entity.type}`);
    } finally {
       setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Fetch initial data
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setIsInitialLoading(true);
      try {
        const [artistsRes, moodsRes, trendingRes, chartsRes] = await Promise.all([
          fetch("https://ytapi.gauravramyadav.workers.dev/api/top/artists?country=IN", { signal: controller.signal }).then(r => r.json()).catch(() => null),
          fetch("https://ytapi.gauravramyadav.workers.dev/api/moods", { signal: controller.signal }).then(r => r.json()).catch(() => null),
          loadSongs("trending", "youtube&country=IN", controller.signal).catch(() => []),
          loadSongs("charts", "youtube&country=IN", controller.signal).catch(() => []),
        ]);

        if (controller.signal.aborted) return;

        if (artistsRes?.artists) setTopArtists(artistsRes.artists.slice(0, 15));
        if (Array.isArray(moodsRes)) setDynamicMoods(moodsRes[0]?.items || []);
        if (trendingRes.length > 0) {
          setTrendingSongs(trendingRes);
          setFeaturedSongs(trendingRes.slice(0, 5));
          // If no search, use trending as default search results to show something
          if (!searchQuery && !selectedGenre) setSearchResults(trendingRes);
        }
        if (chartsRes.length > 0) setChartsSongs(chartsRes);

      } catch (e) {
        console.error("Failed to fetch initial home data", e);
      } finally {
        if (!controller.signal.aborted) setIsInitialLoading(false);
      }
    })();
    return () => controller.abort();
  }, [loadSongs]); // Removed searchQuery and selectedGenre from deps to only run once

  // Debounced Auto-Search
  // Only re-fires when the actual searchQuery text changes (not when searchType changes,
  // since type-pill clicks trigger an immediate manual search instead).
  useEffect(() => {
    // Skip if a manual action (entity click, genre click) just set results
    if (skipNextAutoSearchRef.current) {
      skipNextAutoSearchRef.current = false;
      return;
    }

    const controller = new AbortController();

    const handler = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        setEntityError(null);
        try {
          if (searchType === "song") {
            const results = await loadSongs(searchQuery, isLocal ? "local" : undefined, controller.signal);
            if (!controller.signal.aborted) setSearchResults(results);
          } else {
            const data = await apiSearch(searchQuery, searchType, controller.signal);
            if (!controller.signal.aborted) setSearchResults(data);
          }
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          console.error(e);
        } finally {
          if (!controller.signal.aborted) setIsSearching(false);
        }
      } else if (!searchQuery && !selectedGenre && searchType === "song" && !isLocal) {
        const results = await loadSongs("trending", undefined, controller.signal);
        if (!controller.signal.aborted) setSearchResults(results);
      }
    }, 600);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [searchQuery, isLocal, loadSongs]); // Intentionally excludes searchType — type switches use handleManualSearch

  const toggleLocal = () => {
     setIsLocal(!isLocal);
     setSelectedGenre(null);
     setSearchQuery("");
     setSearchType("song");
  };

  const handlePlaySong = useCallback((songId: string) => {
    const index = searchResults.findIndex(s => s.id === songId);
    if (index !== -1) {
      setQueue(searchResults, index);
    }
  }, [searchResults, setQueue]);

  const clearGenre = () => {
    setSelectedGenre(null);
    setSearchQuery("");
    setEntityError(null);
  };

  if (isInitialLoading) return <HomeSkeleton />;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-[1400px] mx-auto px-3 sm:px-5 md:px-10 lg:px-16 py-4 sm:py-6 md:py-8 space-y-8 sm:space-y-10 md:space-y-14 pb-36 sm:pb-40 min-h-dvh relative"
    >
      {/* ═══ HERO HEADER ═══ */}
      <header className="relative z-10 pt-2 sm:pt-4 md:pt-8">
        <div 
          className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[600px] rounded-full blur-[160px] opacity-[0.07] pointer-events-none transition-colors duration-[2s]"
          style={{ backgroundColor: colors.primary }}
        />

        <div className="relative space-y-6 sm:space-y-8">
          <div className="space-y-2">
            <motion.h1 
              variants={fadeUp}
              suppressHydrationWarning
              className="text-[clamp(1.75rem,6vw,5rem)] font-bold text-gray-900 dark:text-white leading-[0.95] tracking-[-0.03em]"
            >
              {greeting}
              <span className="text-black/10 dark:text-white/10">.</span>
            </motion.h1>
            <motion.p 
              variants={fadeUp}
              className="text-base sm:text-lg md:text-xl text-gray-400 dark:text-white/30 font-medium"
            >
              {isLocal ? "Your local library" : "Discover something new today"}
            </motion.p>
          </div>

          {/* Search Bar */}
          <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:gap-4">
            <div className="relative max-w-2xl">
              <div className="relative flex items-center bg-gray-100/80 dark:bg-white/[0.05] backdrop-blur-2xl border border-gray-200/60 dark:border-white/[0.06] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 transition-all duration-300 focus-within:border-gray-400 dark:focus-within:border-white/15 focus-within:bg-white dark:focus-within:bg-white/[0.08] focus-within:shadow-lg">
                <Search size={16} className="text-gray-400 dark:text-white/25 shrink-0 sm:w-[18px] sm:h-[18px]" />
                <input 
                  type="text"
                  placeholder={isLocal ? "Search your library..." : "Search songs, artists, albums..."}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { setShowSuggestions(false); handleManualSearch(); } }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-transparent border-none outline-none text-[14px] sm:text-[15px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 px-3 font-medium"
                />
                {isSearching && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="w-4 h-4 border-2 border-gray-200 dark:border-white/10 border-t-gray-600 dark:border-t-white/70 rounded-full shrink-0"
                  />
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-[#1a1a1a] border border-gray-200/60 dark:border-white/[0.08] rounded-xl shadow-xl overflow-hidden"
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s}-${i}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSearchQuery(s);
                          setShowSuggestions(false);
                          skipNextAutoSearchRef.current = true;
                          handleManualSearch(s);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-gray-700 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                      >
                        <Search size={13} className="text-gray-300 dark:text-white/20 shrink-0" />
                        <span className="truncate">{s}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search History Chips */}
            {searchHistory.length > 0 && !searchQuery && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold text-gray-400 dark:text-white/20 uppercase tracking-wider mr-1">Recent:</span>
                {searchHistory.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setSearchQuery(q); }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors truncate max-w-[120px]"
                  >
                    {q}
                  </button>
                ))}
                <button
                  onClick={() => { setSearchHistory([]); localStorage.removeItem("grovy-search-history"); }}
                  className="text-[10px] text-gray-400 dark:text-white/15 hover:text-red-400 transition-colors ml-1"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Search Type Pills */}
            {!isLocal && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {(["song", "artist", "album", "playlist"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSearchType(type);
                      setEntityError(null);
                      // Immediately search with this type if there is a query
                      if (searchQuery.length > 2) {
                        setIsSearching(true);
                        skipNextAutoSearchRef.current = true;
                        (type === "song"
                          ? loadSongs(searchQuery)
                          : apiSearch(searchQuery, type)
                        ).then(data => {
                          setSearchResults(data);
                        }).catch(console.error).finally(() => setIsSearching(false));
                      }
                    }}
                    className={`px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-full text-[11px] sm:text-[12px] font-semibold capitalize transition-all duration-200 ${
                      searchType === type 
                        ? "bg-gray-900 dark:bg-white text-white dark:text-black shadow-sm" 
                        : "bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-white/35 hover:bg-gray-200 dark:hover:bg-white/[0.08]"
                    }`}
                  >
                    {type === "song" ? "Songs" : type === "artist" ? "Artists" : type === "album" ? "Albums" : "Playlists"}
                  </button>
                ))}
                <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-0.5 hidden sm:block" />
                <button
                  onClick={toggleLocal}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-full text-[11px] sm:text-[12px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isLocal 
                      ? "bg-gray-900 dark:bg-white text-white dark:text-black shadow-sm" 
                      : "bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-white/35 hover:bg-gray-200 dark:hover:bg-white/[0.08]"
                  }`}
                >
                  <Folder size={12} />
                  Local
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </header>

      {/* ═══ QUICK FILTERS ═══ */}
      {!isLocal && (
        <motion.section variants={fadeUp} className="relative z-10">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={() => { skipNextAutoSearchRef.current = true; setSearchQuery("trending"); fetchTrending(); }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-[12px] font-semibold transition-all ${
                searchQuery === "trending" 
                  ? "bg-orange-500/10 text-orange-500 dark:text-orange-400 ring-1 ring-orange-500/20" 
                  : "text-gray-500 dark:text-white/30 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              }`}
            >
              <TrendingUp size={14} />
              Trending
            </button>
            <button 
              onClick={() => { skipNextAutoSearchRef.current = true; setSearchQuery("charts"); fetchCharts(); }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-[12px] font-semibold transition-all ${
                searchQuery === "charts" 
                  ? "bg-blue-500/10 text-blue-500 dark:text-blue-400 ring-1 ring-blue-500/20" 
                  : "text-gray-500 dark:text-white/30 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
              }`}
            >
              <BarChart3 size={14} />
              Charts
            </button>
          </div>
        </motion.section>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedGenre || searchQuery || "default"} 
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -10 }}
          variants={containerVariants} 
          className="space-y-12 sm:space-y-16 md:space-y-24 relative z-10"
        >
          {/* Featured Hero Carousel */}
          {!searchQuery && !selectedGenre && featuredSongs.length > 0 && (
            <motion.section variants={fadeUp} className="w-full">
              <HeroCarousel 
                items={featuredSongs} 
                onPlay={(item) => setQueue([item, ...trendingSongs.filter(s => s.id !== item.id)], 0)} 
              />
            </motion.section>
          )}

          {/* Recently Played */}
          {recentlyPlayed.length > 0 && !searchQuery && !selectedGenre && (
            <motion.section variants={fadeUp} className="space-y-0">
              <SectionHeader 
                title="Recently Played" 
                onSeeAll={recentlyPlayed.length > 6 ? () => {} : undefined} 
              />
              <ScrollRow>
                {recentlyPlayed.map((song) => (
                  <motion.div
                    key={`recent-${song.id}`}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setQueue([song, ...songs.filter(s => s.id !== song.id)], 0)}
                    className="min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] group cursor-pointer snap-start"
                  >
                    <div className="aspect-square relative rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-white/[0.03] shadow-sm group-hover:shadow-2xl transition-all duration-500">
                      {song.cover ? (
                        <NextImage src={song.cover} alt={song.title} width={200} height={200} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music size={24} className="text-gray-300 dark:text-white/10" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/90 dark:bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl scale-90 group-hover:scale-100">
                          <Play size={14} fill="currentColor" className="text-black dark:text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="px-0.5 space-y-0.5">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate text-[13px] sm:text-[14px] tracking-tight">{song.title}</h4>
                      <p className="text-gray-400 dark:text-white/30 text-[11px] sm:text-[12px] font-medium truncate">{song.artist}</p>
                    </div>
                  </motion.div>
                ))}
              </ScrollRow>
            </motion.section>
          )}

          {/* Trending Songs */}
          {!searchQuery && !selectedGenre && trendingSongs.length > 0 && (
            <motion.section variants={fadeUp} className="space-y-0">
              <SectionHeader 
                title="Trending" 
                subtitle="Top tracks right now"
                onSeeAll={() => { setSearchQuery("trending"); fetchTrending(); }}
              />
              <ScrollRow>
                {trendingSongs.slice(0, 15).map((song) => (
                  <motion.div
                    key={`trending-${song.id}`}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setQueue(trendingSongs, trendingSongs.indexOf(song))}
                    className="min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] group cursor-pointer snap-start"
                  >
                    <div className="aspect-square relative rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-white/[0.03] shadow-sm group-hover:shadow-2xl transition-all duration-500">
                      <NextImage 
                        src={getHDThumbnail(song.cover) || ""} 
                        alt={song.title} 
                        width={200} 
                        height={200} 
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" 
                        loading="lazy" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/90 dark:bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl scale-90 group-hover:scale-100">
                          <Play size={14} fill="currentColor" className="text-black dark:text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="px-0.5 space-y-0.5">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate text-[13px] sm:text-[14px] tracking-tight">{song.title}</h4>
                      <p className="text-gray-400 dark:text-white/30 text-[11px] sm:text-[12px] font-medium truncate">{song.artist}</p>
                    </div>
                  </motion.div>
                ))}
              </ScrollRow>
            </motion.section>
          )}

          {/* Results Grid (Search or Genre) */}
          {(searchQuery || selectedGenre) && (
            <section className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4">
                  {(selectedGenre || searchQuery) && (
                    <button 
                      onClick={clearGenre}
                      className="p-2 sm:p-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors text-gray-600 dark:text-white/60"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                    {selectedGenre 
                      ? selectedGenre 
                      : searchQuery 
                        ? `"${searchQuery}"` 
                        : "Listen Now"}
                  </h2>
                </div>
                {searchResults.length > 0 && (
                  <span className="text-[11px] sm:text-xs font-bold text-gray-400 dark:text-white/20 uppercase tracking-widest tabular-nums bg-gray-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-full">
                    {searchResults.length} results
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
                {searchResults.length > 0 ? searchResults.slice(0, visibleCount).map((item, i) => {
                  if (searchType === "song") {
                    const isCurrent = songs[currentSongIndex]?.id === item.id;
                    return (
                      <motion.div
                        key={item.id}
                        variants={itemVariants}
                        whileHover={{ y: -6 }}
                        whileTap={{ scale: 0.96 }}
                        className="group cursor-pointer"
                        onClick={() => handlePlaySong(item.id)}
                      >
                        <div className="aspect-square relative rounded-2xl sm:rounded-[2rem] overflow-hidden mb-3 sm:mb-4 bg-gray-100 dark:bg-white/[0.03] shadow-sm group-hover:shadow-2xl transition-all duration-500">
                          {item.cover ? (
                            <NextImage 
                              src={getHDThumbnail(item.cover) || ""} 
                              alt={item.title} 
                              width={300}
                              height={300}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" 
                              loading="lazy" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={32} className="text-gray-300 dark:text-white/10" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/95 dark:bg-white/15 backdrop-blur-2xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl scale-90 group-hover:scale-100">
                              <Play size={18} fill="currentColor" className="text-black dark:text-white ml-0.5" />
                            </div>
                          </div>
                          {isCurrent && isPlaying && (
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10">
                              {[...Array(3)].map((_, j) => (
                                <motion.div 
                                  key={j}
                                  className="w-1 rounded-full bg-white"
                                  animate={{ height: [4, 14, 4] }}
                                  transition={{ repeat: Infinity, duration: 0.8, delay: j * 0.15 }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 px-1">
                          <h3 className={`font-bold text-[14px] sm:text-[15px] truncate tracking-tight leading-snug ${
                            isCurrent ? "text-blue-500 dark:text-blue-400" : "text-gray-900 dark:text-white"
                          }`}>{item.title}</h3>
                          <p className="text-gray-400 dark:text-white/30 text-[12px] sm:text-[13px] truncate font-semibold">{item.artist || "Unknown"}</p>
                        </div>
                      </motion.div>
                    );
                  }
                  return (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      whileHover={{ y: -6 }}
                      whileTap={{ scale: 0.96 }}
                      className="group cursor-pointer"
                      onClick={() => handleEntityClick(item)}
                    >
                      <div className={`aspect-square relative overflow-hidden mb-3 sm:mb-4 bg-gray-100 dark:bg-white/[0.03] shadow-sm group-hover:shadow-2xl transition-all duration-500 ${
                        item.type === 'artist' ? 'rounded-full' : 'rounded-2xl sm:rounded-[2rem]'
                      }`}>
                        {item.image ? (
                          <NextImage src={item.image} alt={item.name} width={300} height={300} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music size={32} className="text-gray-300 dark:text-white/10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                      </div>
                      <div className={`space-y-1 ${item.type === 'artist' ? 'text-center' : ''} px-1`}>
                        <h3 className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white truncate tracking-tight">{item.name}</h3>
                        <p className="text-gray-400 dark:text-white/20 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em]">{item.type}</p>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="col-span-full py-24 sm:py-32 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-white/[0.03] flex items-center justify-center border border-gray-200/50 dark:border-white/[0.05]">
                      <Music size={32} className="text-gray-300 dark:text-white/10" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">
                        {entityError || "No results yet"}
                      </p>
                      <p className="text-gray-400 dark:text-white/30 text-sm font-medium">
                        {entityError ? "Try a different search" : "Try searching or pick a genre below"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Load More */}
              {searchResults.length > visibleCount && (
                <div className="flex justify-center pt-8">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-[13px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                  >
                    Show More Results ({searchResults.length - visibleCount})
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Top Charts */}
          {!searchQuery && !selectedGenre && chartsSongs.length > 0 && (
            <motion.section variants={fadeUp} className="space-y-0">
              <SectionHeader 
                title="Top Charts" 
                subtitle="Global hits"
                onSeeAll={() => { setSearchQuery("charts"); fetchCharts(); }}
              />
              <ScrollRow>
                {chartsSongs.slice(0, 15).map((song) => (
                  <motion.div
                    key={`chart-${song.id}`}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setQueue(chartsSongs, chartsSongs.indexOf(song))}
                    className="min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] group cursor-pointer snap-start"
                  >
                    <div className="aspect-square relative rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-white/[0.03] shadow-sm group-hover:shadow-2xl transition-all duration-500">
                      <NextImage 
                        src={getHDThumbnail(song.cover) || ""} 
                        alt={song.title} 
                        width={200} 
                        height={200} 
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" 
                        loading="lazy" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/90 dark:bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl scale-90 group-hover:scale-100">
                          <Play size={14} fill="currentColor" className="text-black dark:text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="px-0.5 space-y-0.5">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate text-[13px] sm:text-[14px] tracking-tight">{song.title}</h4>
                      <p className="text-gray-400 dark:text-white/30 text-[11px] sm:text-[12px] font-medium truncate">{song.artist}</p>
                    </div>
                  </motion.div>
                ))}
              </ScrollRow>
            </motion.section>
          )}

          {/* Moods (Genre Grid) */}
          {!isLocal && searchType === "song" && !selectedGenre && !searchQuery && (
            <motion.section variants={fadeUp} className="space-y-6">
              <SectionHeader title="Moods & Genres" subtitle="Music for every moment" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                {Object.entries(GENRE_CONFIG).map(([name, conf], i) => (
                  <motion.button
                    key={name}
                    variants={itemVariants}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setSearchType("song");
                      setSelectedGenre(name);
                      skipNextAutoSearchRef.current = true;
                      loadSongs(`${name} hits`).then(setSearchResults);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 flex flex-col justify-end text-left group transition-all duration-500 border border-transparent hover:border-white/[0.06] ${
                      (i === 0 || i === 7) ? "sm:col-span-2 aspect-[2.2/1] sm:aspect-[2.1/1]" : "aspect-[4/3] sm:aspect-square"
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${conf.color} transition-opacity duration-500`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="relative z-10 space-y-1">
                      <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-none block drop-shadow-md">{name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 block translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        Browse →
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )}

          {/* Dynamic Moods from YouTube Music */}
          {!isLocal && searchType === "song" && !selectedGenre && !searchQuery && dynamicMoods.length > 0 && (
            <motion.section variants={fadeUp} className="space-y-0">
              <SectionHeader title="Vibes" subtitle="Explore more moods" />
              <ScrollRow>
                {dynamicMoods.map((mood) => {
                  const hex = argbToHex(mood.color);
                  return (
                    <motion.button
                      key={mood.title}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setSearchType("song");
                        setSelectedGenre(mood.title);
                        skipNextAutoSearchRef.current = true;
                        loadSongs(`${mood.title} music`).then(setSearchResults);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="relative shrink-0 rounded-2xl sm:rounded-3xl px-8 sm:px-10 py-5 sm:py-6 snap-start border border-white/[0.04] overflow-hidden group shadow-lg"
                    >
                      <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity" style={{ backgroundColor: hex }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <span className="relative z-10 text-[15px] sm:text-[16px] font-black text-white whitespace-nowrap drop-shadow-lg tracking-tight">{mood.title}</span>
                    </motion.button>
                  );
                })}
              </ScrollRow>
            </motion.section>
          )}

          {/* Top Artists */}
          {!isLocal && searchType === "song" && !selectedGenre && !searchQuery && topArtists.length > 0 && (
            <motion.section variants={fadeUp} className="space-y-0">
              <SectionHeader title="Top Artists" subtitle="Most popular performers" />
              <ScrollRow>
                {topArtists.map((artist) => (
                  <motion.button
                    key={artist.browseId}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      handleEntityClick({ type: "artist", id: `yt-${artist.browseId}`, name: artist.name });
                    }}
                    className="min-w-[120px] sm:min-w-[140px] md:min-w-[160px] group cursor-pointer snap-start flex flex-col items-center gap-4"
                  >
                    <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] relative rounded-full overflow-hidden bg-gray-100 dark:bg-white/[0.03] shadow-lg group-hover:shadow-2xl transition-all duration-700 ring-4 ring-transparent group-hover:ring-white/10">
                      {artist.thumbnail ? (
                        <NextImage src={artist.thumbnail} alt={artist.name} width={140} height={140} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music size={32} className="text-gray-300 dark:text-white/10" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                    </div>
                    <span className="text-[13px] sm:text-[14px] font-bold text-gray-700 dark:text-white/40 group-hover:text-gray-900 dark:group-hover:text-white/80 transition-colors truncate max-w-[120px] sm:max-w-[140px] text-center tracking-tight">
                      {artist.name}
                    </span>
                  </motion.button>
                ))}
              </ScrollRow>
            </motion.section>
          )}

          {/* Local Library Banner */}
          {!isLocal && !searchQuery && !selectedGenre && (
            <motion.section 
              variants={fadeUp}
              whileHover={{ scale: 1.005 }}
              className="relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden cursor-pointer group shadow-2xl shadow-black/5" 
              onClick={toggleLocal}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-white/[0.04] dark:to-white/[0.02]" />
              <div className="absolute inset-0 border border-gray-200/50 dark:border-white/[0.05] rounded-[2rem] sm:rounded-[3rem]" />

              <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="space-y-3 text-center sm:text-left">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                    Your Library.
                  </h2>
                  <p className="text-gray-500 dark:text-white/30 font-bold text-base sm:text-lg md:text-xl leading-relaxed max-w-md">
                    Play your local audio files with the premium Grovy engine.
                  </p>
                </div>
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200/50 dark:bg-white/[0.05] backdrop-blur-3xl rounded-3xl flex items-center justify-center group-hover:bg-gray-300/50 dark:group-hover:bg-white/[0.1] transition-all duration-500 shrink-0 group-hover:rotate-6 shadow-xl">
                  <Folder size={32} className="text-gray-500 dark:text-white/40" />
                </div>
              </div>
            </motion.section>
          )}

          {/* ═══ FOOTER ═══ */}
          <footer className="pt-10 sm:pt-16 border-t border-gray-100 dark:border-white/[0.04]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-6 pb-8 sm:pb-12">
              {/* Brand Column */}
              <div className="col-span-2 sm:col-span-1 space-y-3">
                <div className="flex items-center gap-2">
                  <NextImage src="/icons/logo.png" alt="Grovy" width={28} height={28} className="w-7 h-7" />
                  <span className="font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Silkscreen', cursive" }}>Grovy</span>
                </div>
                <p className="text-[12px] sm:text-[13px] text-gray-400 dark:text-white/25 leading-relaxed max-w-[240px]">
                  A premium open-source music player built for the modern web.
                </p>
              </div>

              {/* Links */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">Product</h4>
                <div className="space-y-2">
                  <Link href="/" className="block text-[13px] text-gray-500 dark:text-white/35 hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
                  <Link href="/playlists" className="block text-[13px] text-gray-500 dark:text-white/35 hover:text-gray-900 dark:hover:text-white transition-colors">Playlists</Link>
                  <Link href="/opensource" className="block text-[13px] text-gray-500 dark:text-white/35 hover:text-gray-900 dark:hover:text-white transition-colors">Open Source</Link>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">Legal</h4>
                <div className="space-y-2">
                  <Link href="/tos" className="block text-[13px] text-gray-500 dark:text-white/35 hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</Link>
                  <Link href="https://archduke.is-a.dev/about" className="block text-[13px] text-gray-500 dark:text-white/35 hover:text-gray-900 dark:hover:text-white transition-colors">About</Link>
                  <Link href="https://archduke.is-a.dev/contact" className="block text-[13px] text-gray-500 dark:text-white/35 hover:text-gray-900 dark:hover:text-white transition-colors">Contact</Link>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-white/20">Community</h4>
                <div className="space-y-2">
                  <a href="https://github.com/archduke1337/grovy" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-white/35 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <Github size={13} />
                    GitHub
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6 border-t border-gray-100 dark:border-white/[0.03]">
              <p className="text-[11px] sm:text-[12px] text-gray-400 dark:text-white/15 font-medium">
                © {new Date().getFullYear()} Grovy. Open source under MIT License.
              </p>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-white/15">
                <span>Built with</span>
                <Heart size={10} className="text-red-400 fill-red-400" />
                <span>by</span>
                <a href="https://archduke.is-a.dev" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-gray-600 dark:hover:text-white/40 transition-colors">Archduke</a>
              </div>
            </div>
          </footer>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
