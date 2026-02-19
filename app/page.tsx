"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Music, 
  Search, 
  Github,
  Folder,
  ChevronLeft,
  TrendingUp,
  BarChart3,
  Heart,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import { getHDThumbnail } from "./lib/thumbnail";
import { Song } from "./types/song";

const TRENDING_REGIONS = [
  { code: "IN", name: "India" },
  { code: "US", name: "USA" },
  { code: "GB", name: "UK" },
  { code: "KR", name: "Korea" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
];

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

export default function Home() {
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
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("IN");
  const [isLocal, setIsLocal] = useState(false);
  const [greeting, setGreeting] = useState("Hello");
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<"song" | "artist" | "album" | "playlist">("song");

  const fetchTrending = useCallback(async (region = selectedRegion) => {
    setIsSearching(true);
    const data = await loadSongs("trending", `youtube&country=${region}`);
    setSearchResults(data);
    setSearchType("song");
    setIsSearching(false);
  }, [loadSongs, selectedRegion]);

  const fetchCharts = useCallback(async (region = selectedRegion) => {
    setIsSearching(true);
    const data = await loadSongs("charts", `youtube&country=${region}`);
    setSearchResults(data);
    setSearchType("song");
    setIsSearching(false);
  }, [loadSongs, selectedRegion]);

  const handleManualSearch = useCallback(async () => {
    setIsSearching(true);
    
    try {
      if (searchType === "song") {
         const results = await loadSongs(searchQuery || "trending", isLocal ? "local" : undefined);
         setSearchResults(results);
      } else {
         const res = await fetch(`/api/search?type=${searchType}&query=${encodeURIComponent(searchQuery)}`);
         const data = await res.json();
         setSearchResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, isLocal, loadSongs, searchType]);

  const handleEntityClick = async (entity: any) => {
    setIsSearching(true);
    try {
       const res = await fetch(`/api/songs?type=${entity.type}&id=${entity.id}`);
       const songs = await res.json();
       
       if (songs.length > 0) {
         setSearchResults(songs);
         setSearchType("song");
         setSelectedGenre(`${entity.type}: ${entity.name}`); 
       }
    } catch (e) {
       console.error(e);
    } finally {
       setIsSearching(false);
    }
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Debounced Auto-Search
  useEffect(() => {
    const controller = new AbortController();

    const handler = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          if (searchType === "song") {
            const results = await loadSongs(searchQuery, isLocal ? "local" : undefined);
            if (!controller.signal.aborted) setSearchResults(results);
          } else {
            const res = await fetch(`/api/search?type=${searchType}&query=${encodeURIComponent(searchQuery)}`, { signal: controller.signal });
            const data = await res.json();
            if (!controller.signal.aborted) setSearchResults(data);
          }
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          console.error(e);
        } finally {
          if (!controller.signal.aborted) setIsSearching(false);
        }
      } else if (!searchQuery && searchType === "song" && !isLocal) {
        const results = await loadSongs("trending");
        if (!controller.signal.aborted) setSearchResults(results);
      }
    }, 800);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [searchQuery, searchType, isLocal, loadSongs]);

  const toggleLocal = () => {
     setIsLocal(!isLocal);
     setSelectedGenre(null);
     setSearchQuery("");
     setSearchType("song");
  };

  const handlePlaySong = (songId: string) => {
    const index = searchResults.findIndex(s => s.id === songId);
    if (index !== -1) {
      setQueue(searchResults, index);
    }
  };

  const clearGenre = () => {
    setSelectedGenre(null);
    setSearchQuery("");
  };

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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
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
            </div>

            {/* Search Type Pills */}
            {!isLocal && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {(["song", "artist", "album", "playlist"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 custom-scrollbar w-full sm:w-auto">
              {TRENDING_REGIONS.map(r => (
                <button
                  key={r.code}
                  onClick={() => {
                    setSelectedRegion(r.code);
                    if (searchQuery === "trending") fetchTrending(r.code);
                    else if (searchQuery === "charts") fetchCharts(r.code);
                  }}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-[12px] font-semibold transition-all whitespace-nowrap ${
                    selectedRegion === r.code 
                      ? "bg-gray-900 dark:bg-white/[0.1] text-white dark:text-white shadow-sm" 
                      : "text-gray-500 dark:text-white/30 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 sm:gap-2 shrink-0">
              <button 
                onClick={() => { setSearchQuery("trending"); fetchTrending(); }}
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
                onClick={() => { setSearchQuery("charts"); fetchCharts(); }}
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
          className="space-y-12 sm:space-y-16 relative z-10"
        >
          {/* Results Grid */}
          <section className="space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                {selectedGenre && (
                  <button 
                    onClick={clearGenre}
                    className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors text-gray-600 dark:text-white/60"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-[-0.025em]">
                  {selectedGenre 
                    ? selectedGenre 
                    : searchQuery 
                      ? `"${searchQuery}"` 
                      : "For You"}
                </h2>
              </div>
              {searchResults.length > 0 && (
                <span className="text-[11px] sm:text-xs font-medium text-gray-400 dark:text-white/20 tabular-nums">
                  {searchResults.length} results
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {searchResults.length > 0 ? searchResults.map((item, i) => {
                if (searchType === "song") {
                  const isCurrent = songs[currentSongIndex]?.id === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="group cursor-pointer"
                      onClick={() => handlePlaySong(item.id)}
                    >
                      <div className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden mb-2.5 sm:mb-3 bg-gray-100 dark:bg-white/[0.03] shadow-sm group-hover:shadow-xl transition-shadow duration-500">
                        {item.cover ? (
                          <NextImage 
                            src={getHDThumbnail(item.cover) || ""} 
                            alt={item.title} 
                            width={200}
                            height={200}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" 
                            loading="lazy" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music size={28} className="text-gray-300 dark:text-white/10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                          <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/90 dark:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl">
                            <Play size={16} fill="currentColor" className="text-black dark:text-white ml-0.5" />
                          </div>
                        </div>
                        {isCurrent && isPlaying && (
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg">
                            {[...Array(3)].map((_, j) => (
                              <motion.div 
                                key={j}
                                className="w-0.5 rounded-full bg-white"
                                animate={{ height: [3, 10, 3] }}
                                transition={{ repeat: Infinity, duration: 0.8, delay: j * 0.15 }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5 px-0.5">
                        <h3 className={`font-semibold text-[13px] sm:text-[14px] truncate tracking-[-0.01em] leading-tight ${
                          isCurrent ? "text-blue-500 dark:text-blue-400" : "text-gray-900 dark:text-white"
                        }`}>{item.title}</h3>
                        <p className="text-gray-500 dark:text-white/30 text-[11px] sm:text-[12px] truncate font-medium">{item.artist || "Unknown"}</p>
                      </div>
                    </motion.div>
                  );
                }
                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    className="group cursor-pointer"
                    onClick={() => handleEntityClick(item)}
                  >
                    <div className={`aspect-square relative overflow-hidden mb-2.5 sm:mb-3 bg-gray-100 dark:bg-white/[0.03] shadow-sm group-hover:shadow-xl transition-shadow duration-500 ${
                      item.type === 'artist' ? 'rounded-full' : 'rounded-xl sm:rounded-2xl'
                    }`}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music size={28} className="text-gray-300 dark:text-white/10" />
                        </div>
                      )}
                    </div>
                    <div className={`space-y-0.5 ${item.type === 'artist' ? 'text-center' : ''} px-0.5`}>
                      <h3 className="font-semibold text-[13px] sm:text-[14px] text-gray-900 dark:text-white truncate">{item.name}</h3>
                      <p className="text-gray-400 dark:text-white/25 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">{item.type}</p>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="col-span-full py-16 sm:py-24 flex flex-col items-center gap-4">
                  <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.03] flex items-center justify-center">
                    <Music size={22} className="text-gray-300 dark:text-white/10" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-gray-500 dark:text-white/25 font-semibold text-[14px] sm:text-[15px]">No results yet</p>
                    <p className="text-gray-400 dark:text-white/15 text-[12px] sm:text-[13px]">Try searching or pick a genre below</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Genre Grid */}
          {!isLocal && searchType === "song" && !selectedGenre && !searchQuery && (
            <motion.section variants={fadeUp} className="space-y-5 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-[-0.025em]">
                Explore by Mood
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
                {Object.entries(GENRE_CONFIG).map(([name, conf], i) => (
                  <motion.button
                    key={name}
                    variants={itemVariants}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setSearchType("song");
                      setSelectedGenre(name);
                      loadSongs(`${name} hits`).then(setSearchResults);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col justify-end text-left group transition-all duration-300 border border-transparent hover:border-white/[0.06] ${
                      (i === 0 || i === 7) ? "sm:col-span-2 aspect-[2.2/1] sm:aspect-[2/1]" : "aspect-[4/3]"
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${conf.color} transition-opacity duration-500`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
                    <div className="relative z-10 space-y-0.5">
                      <span className="text-base sm:text-lg md:text-xl font-bold text-white tracking-[-0.02em] leading-tight block drop-shadow-sm">{name}</span>
                      <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-white/40 block translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        Explore →
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )}

          {/* Recently Played */}
          {recentlyPlayed.length > 0 && searchType === "song" && (
            <motion.section variants={fadeUp} className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-[-0.025em]">
                  Jump Back In
                </h2>
                <button 
                  onClick={clearHistory} 
                  className="text-[11px] sm:text-[12px] font-semibold text-gray-400 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <div className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
                {recentlyPlayed.map((song) => (
                  <motion.div
                    key={`recent-${song.id}`}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setQueue([song, ...songs], 0)}
                    className="min-w-[120px] sm:min-w-[140px] md:min-w-[160px] group cursor-pointer snap-start"
                  >
                    <div className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden mb-2.5 sm:mb-3 bg-gray-100 dark:bg-white/[0.03] shadow-sm group-hover:shadow-xl transition-shadow duration-500">
                      {song.cover ? (
                        <img src={song.cover} alt={song.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music size={22} className="text-gray-300 dark:text-white/10" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <div className="w-9 sm:w-10 h-9 sm:h-10 bg-white/90 dark:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl">
                          <Play size={13} fill="currentColor" className="text-black dark:text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="px-0.5">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate text-[12px] sm:text-[13px]">{song.title}</h4>
                      <p className="text-gray-500 dark:text-white/25 text-[10px] sm:text-[11px] font-medium truncate mt-0.5">{song.artist}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Local Library Banner */}
          {!isLocal && (
            <motion.section 
              variants={fadeUp}
              whileHover={{ scale: 1.003 }}
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer group" 
              onClick={toggleLocal}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-white/[0.03] dark:to-white/[0.01]" />
              <div className="absolute inset-0 border border-gray-200/50 dark:border-white/[0.04] rounded-2xl sm:rounded-3xl" />

              <div className="relative z-10 p-6 sm:p-8 md:p-12 flex items-center justify-between gap-4 sm:gap-6">
                <div className="space-y-1.5 sm:space-y-2 max-w-lg">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-[-0.025em]">
                    Your Local Library
                  </h2>
                  <p className="text-gray-500 dark:text-white/30 font-medium text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed">
                    Play your local audio files with the Grovy engine.
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gray-200/60 dark:bg-white/[0.04] rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-gray-300/60 dark:group-hover:bg-white/[0.08] transition-colors shrink-0">
                  <Folder size={22} className="text-gray-500 dark:text-white/30 sm:w-6 sm:h-6" />
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
                  <img src="/icons/logo.png" alt="Grovy" className="w-7 h-7" />
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
                <a href="https://archduke.is-a.dev" target="_blank" rel="noopener" className="font-semibold hover:text-gray-600 dark:hover:text-white/40 transition-colors">Archduke</a>
              </div>
            </div>
          </footer>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
