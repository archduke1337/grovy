"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  BarChart3
} from "lucide-react";

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

/* Apple-like spring-based stagger */
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
    const handler = setTimeout(async () => {
      if (searchQuery.length > 2) {
         handleManualSearch();
      } else if (!searchQuery && searchType === "song" && !isLocal) {
         const results = await loadSongs("trending");
         setSearchResults(results);
      }
    }, 800);

    return () => clearTimeout(handler);
  }, [searchQuery, searchType, isLocal, handleManualSearch, loadSongs]);



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
      className="w-full max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16 py-8 space-y-14 pb-40 min-h-screen relative"
    >
      {/* ═══════════════════════════════════════════════
          SECTION 1 — Hero Header  
          Apple Music-style greeting with glassmorphic search
          ═══════════════════════════════════════════════ */}
      <header className="relative z-10 pt-4 md:pt-8">
        {/* Ambient haze behind header */}
        <div 
          className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[160px] opacity-[0.07] pointer-events-none transition-colors duration-[2s]"
          style={{ backgroundColor: colors.primary }}
        />

        <div className="relative space-y-8">
          {/* Greeting + Subtitle */}
          <div className="space-y-2">
            <motion.h1 
              variants={fadeUp}
              suppressHydrationWarning
              className="text-[clamp(2.5rem,8vw,5.5rem)] font-bold text-gray-900 dark:text-white leading-[0.95] tracking-[-0.025em]"
            >
              {greeting}
              <span className="text-white/20 dark:text-white/15">.</span>
            </motion.h1>
            <motion.p 
              variants={fadeUp}
              className="text-lg md:text-xl text-gray-400 dark:text-white/35 font-medium tracking-[-0.01em]"
            >
              {isLocal ? "Your local library" : "Discover something new today"}
            </motion.p>
          </div>

          {/* Search Bar — Floating Glass Capsule */}
          <motion.div variants={fadeUp} className="flex flex-col gap-4">
            <div className="relative max-w-2xl group/search">
              <div className="relative flex items-center bg-gray-100/80 dark:bg-white/[0.06] backdrop-blur-2xl border border-gray-200/60 dark:border-white/[0.08] rounded-2xl px-5 py-3.5 transition-all duration-300 hover:border-gray-300/80 dark:hover:border-white/[0.15] focus-within:border-gray-400 dark:focus-within:border-white/20 focus-within:bg-white dark:focus-within:bg-white/[0.1] focus-within:shadow-lg dark:focus-within:shadow-[0_8px_40px_-12px_rgba(255,255,255,0.06)]">
                <Search size={18} className="text-gray-400 dark:text-white/30 shrink-0" />
                <input 
                  type="text"
                  placeholder={isLocal ? "Search your library..." : "Search songs, artists, albums..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                  className="w-full bg-transparent border-none outline-none text-[15px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 px-3 font-medium tracking-[-0.01em]"
                />
                {isSearching && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="w-4 h-4 border-2 border-gray-200 dark:border-white/15 border-t-gray-600 dark:border-t-white/70 rounded-full shrink-0"
                  />
                )}
              </div>
            </div>

            {/* Search Type Pills */}
            {!isLocal && (
              <div className="flex items-center gap-2 flex-wrap">
                {(["song", "artist", "album", "playlist"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
                    className={`px-4 py-1.5 rounded-full text-[12px] font-semibold capitalize transition-all duration-200 ${
                      searchType === type 
                        ? "bg-gray-900 dark:bg-white text-white dark:text-black shadow-sm" 
                        : "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/[0.1] hover:text-gray-700 dark:hover:text-white/60"
                    }`}
                  >
                    {type === "song" ? "Songs" : type === "artist" ? "Artists" : type === "album" ? "Albums" : "Playlists"}
                  </button>
                ))}
                <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />
                <button
                  onClick={toggleLocal}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isLocal 
                      ? "bg-gray-900 dark:bg-white text-white dark:text-black shadow-sm" 
                      : "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/[0.1]"
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

      {/* ═══════════════════════════════════════════════
          SECTION 2 — Quick Filters (Region + Trending/Charts)
          ═══════════════════════════════════════════════ */}
      {!isLocal && (
        <motion.section variants={fadeUp} className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Region Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar w-full sm:w-auto">
              {TRENDING_REGIONS.map(r => (
                <button
                  key={r.code}
                  onClick={() => {
                    setSelectedRegion(r.code);
                    if (searchQuery === "trending") fetchTrending(r.code);
                    else if (searchQuery === "charts") fetchCharts(r.code);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ${
                    selectedRegion === r.code 
                      ? "bg-gray-900 dark:bg-white/[0.12] text-white dark:text-white shadow-sm ring-1 ring-gray-900/10 dark:ring-white/10" 
                      : "text-gray-500 dark:text-white/35 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-white/60"
                  }`}
                  suppressHydrationWarning
                >
                  {r.name}
                </button>
              ))}
            </div>

            {/* Action Pills */}
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => { setSearchQuery("trending"); fetchTrending(); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                  searchQuery === "trending" 
                    ? "bg-orange-500/10 text-orange-500 dark:text-orange-400 ring-1 ring-orange-500/20" 
                    : "text-gray-500 dark:text-white/35 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                <TrendingUp size={14} />
                Trending
              </button>
              <button 
                onClick={() => { setSearchQuery("charts"); fetchCharts(); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                  searchQuery === "charts" 
                    ? "bg-blue-500/10 text-blue-500 dark:text-blue-400 ring-1 ring-blue-500/20" 
                    : "text-gray-500 dark:text-white/35 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                <BarChart3 size={14} />
                Charts
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* ═══════════════════════════════════════════════
          MAIN CONTENT AREA (Animated)
          ═══════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedGenre || searchQuery || "default"} 
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -10 }}
          variants={containerVariants} 
          className="space-y-16 relative z-10"
        >
          
          {/* ═══════════════════════════════════════════════
              SECTION 3 — Results Grid
              ═══════════════════════════════════════════════ */}
          <section className="space-y-6">
            {/* Section Header with Back Nav */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedGenre && (
                  <button 
                    onClick={clearGenre}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors text-gray-600 dark:text-white/60"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-[-0.025em]">
                  {selectedGenre 
                    ? selectedGenre 
                    : searchQuery 
                      ? `"${searchQuery}"` 
                      : "For You"}
                </h2>
              </div>
              {searchResults.length > 0 && (
                <span className="text-xs font-medium text-gray-400 dark:text-white/25 tabular-nums">
                  {searchResults.length} results
                </span>
              )}
            </div>
            
            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
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
                      <div className="aspect-square relative rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-white/[0.04] shadow-sm group-hover:shadow-xl transition-shadow duration-500">
                        {item.cover ? (
                          <img src={item.cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music size={32} className="text-gray-300 dark:text-white/10" />
                          </div>
                        )}
                        {/* Hover Play Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                          <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            whileHover={{ scale: 1 }}
                            className="w-12 h-12 bg-white/90 dark:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl"
                          >
                            <Play size={18} fill="currentColor" className="text-black dark:text-white ml-0.5" />
                          </motion.div>
                        </div>
                        {/* Now Playing indicator */}
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
                        <h3 className={`font-semibold text-[14px] truncate tracking-[-0.01em] leading-tight ${
                          isCurrent ? "text-blue-500 dark:text-blue-400" : "text-gray-900 dark:text-white"
                        }`}>{item.title}</h3>
                        <p className="text-gray-500 dark:text-white/35 text-[12px] truncate font-medium">{item.artist || "Unknown"}</p>
                      </div>
                    </motion.div>
                  );
                }
                // Entity Card (Artist, Album, Playlist)
                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    className="group cursor-pointer"
                    onClick={() => handleEntityClick(item)}
                  >
                    <div className={`aspect-square relative overflow-hidden mb-3 bg-gray-100 dark:bg-white/[0.04] shadow-sm group-hover:shadow-xl transition-shadow duration-500 ${
                      item.type === 'artist' ? 'rounded-full' : 'rounded-2xl'
                    }`}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music size={32} className="text-gray-300 dark:text-white/10" />
                        </div>
                      )}
                    </div>
                    <div className={`space-y-0.5 ${item.type === 'artist' ? 'text-center' : ''} px-0.5`}>
                      <h3 className="font-semibold text-[14px] text-gray-900 dark:text-white truncate tracking-[-0.01em]">{item.name}</h3>
                      <p className="text-gray-400 dark:text-white/30 text-[11px] font-semibold uppercase tracking-wider">{item.type}</p>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="col-span-full py-24 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center">
                    <Music size={24} className="text-gray-300 dark:text-white/15" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-gray-500 dark:text-white/30 font-semibold text-[15px]">No results yet</p>
                    <p className="text-gray-400 dark:text-white/20 text-[13px]">Try searching or pick a genre below</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════
              SECTION 4 — Explore by Mood (Genre Grid)
              Only shown on default view with no active search/genre
              ═══════════════════════════════════════════════ */}
          {!isLocal && searchType === "song" && !selectedGenre && !searchQuery && (
            <motion.section variants={fadeUp} className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-[-0.025em]">
                Explore by Mood
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
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
                    className={`relative overflow-hidden rounded-2xl p-5 md:p-6 flex flex-col justify-end text-left group transition-all duration-300 border border-transparent hover:border-white/[0.08] ${
                      (i === 0 || i === 7) ? "sm:col-span-2 aspect-[2/1]" : "aspect-[4/3]"
                    }`}
                  >
                    {/* Gradient fill */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${conf.color} transition-opacity duration-500`} />
                    {/* Bottom fade for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    {/* Subtle noise texture */}
                    <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />

                    <div className="relative z-10 space-y-0.5">
                      <span className="text-lg md:text-xl font-bold text-white tracking-[-0.02em] leading-tight block drop-shadow-sm">{name}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50 block translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        Explore →
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 5 — Jump Back In (Recently Played)
              ═══════════════════════════════════════════════ */}
          {recentlyPlayed.length > 0 && searchType === "song" && (
            <motion.section variants={fadeUp} className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-[-0.025em]">
                  Jump Back In
                </h2>
                <button 
                  onClick={clearHistory} 
                  className="text-[12px] font-semibold text-gray-400 dark:text-white/25 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory -mx-5 px-5 md:mx-0 md:px-0">
                {recentlyPlayed.map((song) => (
                  <motion.div
                    key={`recent-${song.id}`}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setQueue([song, ...songs], 0)}
                    className="min-w-[140px] md:min-w-[160px] group cursor-pointer snap-start"
                  >
                    <div className="aspect-square relative rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-white/[0.04] shadow-sm group-hover:shadow-xl transition-shadow duration-500">
                      {song.cover ? (
                        <img src={song.cover} alt={song.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music size={24} className="text-gray-300 dark:text-white/10" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/90 dark:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl">
                          <Play size={14} fill="currentColor" className="text-black dark:text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="px-0.5">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate text-[13px] tracking-[-0.01em]">{song.title}</h4>
                      <p className="text-gray-500 dark:text-white/30 text-[11px] font-medium truncate mt-0.5">{song.artist}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 6 — Local Library Banner
              ═══════════════════════════════════════════════ */}
          {!isLocal && (
            <motion.section 
              variants={fadeUp}
              whileHover={{ scale: 1.005 }}
              className="relative rounded-3xl overflow-hidden cursor-pointer group" 
              onClick={toggleLocal}
            >
              {/* Background layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-white/[0.04] dark:to-white/[0.02]" />
              <div className="absolute inset-0 border border-gray-200/50 dark:border-white/[0.06] rounded-3xl" />

              <div className="relative z-10 p-8 md:p-12 lg:p-14 flex items-center justify-between gap-6">
                <div className="space-y-2 max-w-lg">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-[-0.025em]">
                    Your Local Library
                  </h2>
                  <p className="text-gray-500 dark:text-white/40 font-medium text-[14px] md:text-[15px] leading-relaxed">
                    Play your local audio files with the Grovy engine. High fidelity, zero latency.
                  </p>
                </div>
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-200/60 dark:bg-white/[0.06] rounded-2xl flex items-center justify-center group-hover:bg-gray-300/60 dark:group-hover:bg-white/[0.1] transition-colors shrink-0">
                  <Folder size={24} className="text-gray-500 dark:text-white/40 md:w-7 md:h-7" />
                </div>
              </div>
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════
              FOOTER
              ═══════════════════════════════════════════════ */}
          <footer className="pt-12 pb-8 border-t border-gray-100 dark:border-white/[0.04] flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5 text-gray-400 dark:text-white/20 hover:text-gray-600 dark:hover:text-white/40 transition-colors">
              <Github size={18} />
              <span className="text-[13px] font-semibold tracking-[-0.01em]">Grovy — Open Source Music Player</span>
            </div>
          </footer>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
