"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Music, 
  Heart, 
  Search, 
  Sparkles, 
  PlayCircle,
  Coffee,
  Zap,
  Moon,
  Library,
  Github,
  Folder,
  History,
  Clock,
  Activity,
  Mic2
} from "lucide-react";
import { Song } from "./types/song";
import Link from "next/link";

const TRENDING_REGIONS = [
  { code: "IN", name: "India" },
  { code: "US", name: "USA" },
  { code: "GB", name: "UK" },
  { code: "KR", name: "Korea" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
];

const GENRE_CONFIG: Record<string, { color: string }> = {
  "Bollywood": { color: "from-pink-500/20 to-rose-500/20" },
  "Punjabi": { color: "from-amber-500/20 to-orange-500/20" },
  "Indipop": { color: "from-violet-500/20 to-purple-500/20" },
  "Devotional": { color: "from-orange-600/20 to-yellow-600/20" },
  "Pop": { color: "from-blue-400/20 to-cyan-400/20" },
  "Hip Hop": { color: "from-red-500/20 to-pink-600/20" },
  "Rock": { color: "from-gray-600/20 to-slate-600/20" },
  "Jazz": { color: "from-yellow-500/20 to-amber-600/20" },
  "Electronic": { color: "from-green-400/20 to-emerald-500/20" },
  "Classical": { color: "from-indigo-400/20 to-blue-500/20" },
  "Chill": { color: "from-teal-400/20 to-cyan-500/20" },
  "Party": { color: "from-fuchsia-500/20 to-purple-600/20" }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  const { 
    songs, 
    currentSongIndex, 
    isPlaying,
    toggleFavorite, 
    isFavorite,
    colors,
    loadSongs,
    setQueue,
    recentlyPlayed,
    clearHistory
  } = usePlayer();
  
  const [searchResults, setSearchResults] = useState<any[]>([]); // Can be Song[] or Entity[]
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("IN");
  const [isLocal, setIsLocal] = useState(false);
  const [greeting, setGreeting] = useState("Hello");
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<"song" | "artist" | "album" | "playlist">("song");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Manual Trigger for Search Button
  const handleManualSearch = useCallback(async () => {
    setIsSearching(true);
    
    try {
      if (searchType === "song") {
         const results = await loadSongs(searchQuery || "trending", isLocal ? "local" : undefined);
         setSearchResults(results);
      } else {
         // Search for entities
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
    // When an album/artist/playlist is clicked, load its songs
    setIsSearching(true);
    try {
       const res = await fetch(`/api/songs?type=${entity.type}&id=${entity.id}`);
       const songs = await res.json();
       
       if (songs.length > 0) {
         setSearchResults(songs);
         // Reset type to song to render tracklist view
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

  // Debounced Auto-Search (Only for songs or if query is typed)
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.length > 2) {
         handleManualSearch();
      } else if (!searchQuery && searchType === "song" && !isLocal) {
         // Load default trending songs if empty
         const results = await loadSongs("trending");
         setSearchResults(results);
      }
    }, 800);

    return () => clearTimeout(handler);
  }, [searchQuery, searchType, isLocal, handleManualSearch]); // Removed loadSongs dependency to avoid loop

  const filteredSongs = searchResults;

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

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-10 pb-36"
    >
      {/* 1. Dynamic Tint Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 relative">
        <div 
          className="absolute -top-40 -left-20 w-[300px] h-[300px] blur-[120px] rounded-full mix-blend-screen opacity-30 pointer-events-none transition-colors duration-1000" 
          style={{ backgroundColor: colors.primary }} 
        />
        
        <div className="space-y-4 relative z-10 text-center xl:text-left max-w-2xl">
          <div className="flex items-center justify-center xl:justify-start gap-2 font-black uppercase text-[10px] tracking-[0.3em]" style={{ color: colors.primary }}>
             <span>Daily Mix</span>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl xl:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
              {greeting}
              <span style={{ color: colors.primary }}>.</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm md:text-base max-w-md mx-auto xl:mx-0 leading-relaxed opacity-80">
              Listen to the moments that matter.
            </p>
          </div>
        </div>

        <div className="relative group w-full xl:w-[480px] shrink-0 space-y-6">
           {/* Search Type Tabs */}
           {!isLocal && mounted && (
             <div className="flex flex-wrap justify-center xl:justify-end gap-2">
               {(["song", "artist", "album", "playlist"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      searchType === type 
                        ? "text-white shadow-lg scale-105" 
                        : "text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white/5 hover:bg-white/10"
                    }`}
                    style={{ 
                      backgroundColor: searchType === type ? colors.primary : undefined,
                    }}
                  >
                    {type}
                  </button>
               ))}
             </div>
           )}

          <div className="relative w-full group/search">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/search:opacity-100 transition-opacity blur-xl rounded-full" style={{ background: `linear-gradient(to right, transparent, ${colors.primary}40, transparent)` }} />
            <button 
              onClick={handleManualSearch}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-[var(--color-primary)] transition-colors z-20"
            >
              <Search size={20} />
            </button>
            <input 
              type="text"
              placeholder={isLocal ? "Search local files..." : "What do you want to play?"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              className="w-full pl-12 pr-12 py-4 rounded-full bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/5 focus:border-[var(--color-primary)]/50 focus:bg-white dark:focus:bg-black/40 outline-none transition-all backdrop-blur-3xl shadow-xl text-sm font-medium placeholder:text-gray-400 relative z-10"
            />
            {isSearching && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2 z-20">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ borderTopColor: colors.primary }}
                  className="w-4 h-4 border-2 border-gray-200 rounded-full"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Discovery Section */}
      {!isLocal && (
          <section className="space-y-6 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-1">
               <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight hidden md:block">Discovery Hub</h2>
                 
                 <div className="flex items-center gap-2 overflow-x-scroll md:overflow-visible pb-2 md:pb-0 w-full md:w-auto custom-scrollbar">
                    {TRENDING_REGIONS.map(r => (
                      <button
                        key={r.code}
                        onClick={() => {
                          setSelectedRegion(r.code);
                          if (searchQuery === "trending") fetchTrending(r.code);
                          else if (searchQuery === "charts") fetchCharts(r.code);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                          selectedRegion === r.code 
                            ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-lg scale-105" 
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        }`}
                      >
                        {r.name}
                      </button>
                    ))}
                 </div>
               </div>
               
               {/* Quick Filters */}
               <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end">
                 <button 
                  onClick={() => {setSearchQuery("trending"); fetchTrending();}}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all ${
                    searchQuery === "trending" 
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" 
                      : "text-gray-500 bg-white/5 hover:bg-amber-500/10 hover:text-amber-500"
                  }`}
                 >
                   Trends
                 </button>
                 <button 
                  onClick={() => {setSearchQuery("charts"); fetchCharts();}}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all ${
                    searchQuery === "charts" 
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
                      : "text-gray-500 bg-white/5 hover:bg-blue-500/10 hover:text-blue-500"
                  }`}
                 >
                   Charts
                 </button>
               </div>
            </div>
          </section>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={selectedGenre || "default"} variants={containerVariants} className="space-y-16 md:space-y-24">
          
          {/* Results Section */}
          <section className="space-y-6 md:space-y-10">
            <div className="flex items-end justify-between px-2">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                {selectedGenre ? selectedGenre : (searchQuery ? `Checking out "${searchQuery}"` : "Made for You")}
              </h2>
            </div>
            
            {/* Horizontal Scroll for results instead of grid */}
            <div className="flex overflow-x-auto gap-3 md:gap-5 pb-4 custom-scrollbar snap-x px-1 -mx-2 md:mx-0">
              {searchResults.map((item, i) => {
                 // Render Logic based on searchType (or item.type if available)
                 
                 // 1. Song Card
                 if (searchType === "song") {
                   return (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="group cursor-pointer space-y-2 min-w-[130px] md:min-w-[160px] snap-start"
                      onClick={() => handlePlaySong(item.id)}
                    >
                      <div className="aspect-square relative rounded-2xl md:rounded-3xl overflow-hidden shadow-md transition-all duration-500 group-hover:shadow-xl">
                         {item.cover ? (
                          <img src={item.cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                            <Music className="text-gray-400 w-12 h-12 md:w-16 md:h-16" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                           <PlayCircle size={48} className="text-white fill-white/10 backdrop-blur-md rounded-full md:w-16 md:h-16" />
                        </div>
                      </div>
                      <div className="px-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate text-xs md:text-sm tracking-tight">{item.title}</h3>
                        <p className="text-gray-500 text-[10px] truncate">{item.artist || "Artist"}</p>
                      </div>
                    </motion.div>
                   );
                 }

                 // 2. Entity Card (Album, Artist, Playlist)
                 return (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="group cursor-pointer space-y-2 md:space-y-4 min-w-[150px] md:min-w-[200px] snap-start"
                      onClick={() => handleEntityClick(item)}
                    >
                      <div className={`aspect-square relative overflow-hidden shadow-lg md:shadow-xl transition-all ${
                          item.type === 'artist' ? 'rounded-full' : 'rounded-[2rem]'
                      }`}>
                         {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <Library className="text-gray-500 w-10 h-10 md:w-12 md:h-12" />
                          </div>
                        )}
                      </div>
                      <div className="text-center px-1 md:px-2">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate text-xs md:text-sm">{item.name}</h3>
                        <p className="text-gray-400 text-[8px] md:text-[10px] uppercase tracking-wider">{item.type}</p>
                      </div>
                    </motion.div>
                 );
              })}
            </div>
          </section>

          {/* Recently Played */}
          {recentlyPlayed.length > 0 && searchType === "song" && (
            <section className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <History size={20} style={{ color: colors.primary }} className="md:w-6 md:h-6" />
                    <h2 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Jump Back In</h2>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 hidden md:inline">Where you left off</span>
                    <button 
                      onClick={clearHistory}
                      className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
               </div>
               
               <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-8 custom-scrollbar scroll-smooth snap-x">
                  {recentlyPlayed.map((song, i) => (
                    <motion.div
                      key={`recent-${song.id}`}
                      whileHover={{ y: -5 }}
                      onClick={() => setQueue([song, ...songs], 0)}
                      className="min-w-[130px] md:min-w-[160px] group cursor-pointer snap-start"
                    >
                       <div className="aspect-square relative rounded-2xl md:rounded-3xl overflow-hidden mb-3 md:mb-4 shadow-lg group-hover:shadow-xl transition-all">
                          {song.cover ? (
                            <img src={song.cover} alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center"><Music /></div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                             <Play size={24} className="text-white fill-white md:w-8 md:h-8" />
                          </div>
                       </div>
                       <h4 className="font-bold text-gray-900 dark:text-white truncate px-1 text-sm md:text-base">{song.title}</h4>
                       <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 mt-0.5 md:mt-1">{song.artist}</p>
                    </motion.div>
                  ))}
               </div>
            </section>
          )}

          {/* Library List (Only visible if search type is SONG or after clicking an entity) */}
          {searchType === "song" && (
            <section className="space-y-6 md:space-y-10">
               <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Your Collection</h2>
                  <div className="flex items-center gap-3">
                     <button
                       onClick={() => {
                         if (filteredSongs.length > 0) {
                           handlePlaySong(filteredSongs[0].id);
                         }
                       }}
                       className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300"
                     >
                       <Play size={10} fill="currentColor" />
                       Play All
                     </button>
                     <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 opacity-60">{filteredSongs.length} Tracks</span>
                  </div>
               </div>
               
               <div className="bg-white/40 dark:bg-white/5 rounded-[2rem] md:rounded-[4rem] border border-gray-100 dark:border-white/10 overflow-hidden backdrop-blur-3xl shadow-xl">
                  {filteredSongs.slice(0, 7).map((song, i) => {
                    const isCurrent = songs[currentSongIndex]?.id === song.id;
                    const favorite = isFavorite(song.id);
                    
                      return (
                        <div
                          key={song.id}
                          onClick={() => handlePlaySong(song.id)}
                          style={{ 
                            backgroundColor: isCurrent ? `${colors.primary}10` : undefined,
                            borderColor: isCurrent ? `${colors.primary}20` : undefined
                          }}
                          className={`group flex items-center gap-3 md:gap-5 px-3 py-2 md:px-5 md:py-3 cursor-pointer transition-all border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 ${
                            isCurrent ? "border-l-4" : "border-l-4 border-l-transparent" 
                          }`}
                        >
                           {/* Number / Play Icon */}
                           <div className="w-6 md:w-8 text-center flex-shrink-0 text-gray-400 font-bold text-[10px] md:text-xs">
                             {isCurrent && isPlaying ? (
                                <div className="flex items-center justify-center gap-0.5 h-3">
                                  {[...Array(3)].map((_, j) => (
                                    <motion.div 
                                      key={j}
                                      style={{ backgroundColor: colors.primary }}
                                      className="w-0.5 md:w-1 rounded-full"
                                      animate={{ height: [4, 12, 4] }}
                                      transition={{ repeat: Infinity, duration: 0.8, delay: j * 0.2 }}
                                    />
                                  ))}
                                </div>
                             ) : (
                               <span className="group-hover:hidden">{i + 1}</span>
                             )}
                             <Play size={12} className={`hidden group-hover:block mx-auto ${isCurrent ? "text-[var(--color-primary)]" : "text-gray-900 dark:text-white"}`} fill="currentColor" />
                           </div>

                           <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 shadow-sm relative group-hover:shadow-md transition-shadow">
                              {song.cover ? (
                                <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Music size={16} className="md:w-5 md:h-5 text-gray-400" /></div>
                              )}
                              {/* Overlay Play Button on Cover */}
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play size={16} className="text-white fill-white" />
                              </div>
                           </div>
    
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                               <div 
                                 style={{ color: isCurrent ? colors.primary : undefined }}
                                 className={`font-bold truncate text-sm md:text-base tracking-tight leading-tight ${!isCurrent ? "text-gray-900 dark:text-white group-hover:text-[var(--color-primary)] transition-colors" : ""}`}
                               >
                                 {song.title}
                               </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] md:text-xs text-gray-500 font-medium truncate max-w-[150px]">{song.artist || "Unknown artist"}</span>
                                {song.source && (
                                  <span className={`px-1 py-px rounded text-[8px] border opacity-60 ${
                                    song.source === "YouTube" 
                                      ? "border-red-500/30 text-red-500 bg-red-500/5" 
                                      : "border-blue-500/30 text-blue-500 bg-blue-500/5"
                                  }`}>
                                    {song.source}
                                  </span>
                                )}
                              </div>
                           </div>
    
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] text-gray-400 font-medium hidden md:block">
                                {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : "--:--"}
                              </span>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }}
                                 className={`p-2 rounded-full transition-all hover:bg-gray-100 dark:hover:bg-white/10 ${favorite ? "text-red-500" : "text-gray-300 hover:text-red-500"}`}
                              >
                                 <Heart size={16} fill={favorite ? "currentColor" : "none"} className="md:w-5 md:h-5" />
                              </button>
                           </div>
                        </div>
                    );
                  })}
               </div>
            </section>
          )}

          {/* Search Type Specific Sections */}
          {searchType === "song" && (
            <section className="space-y-6 md:space-y-10">
               {/* 4. Genre Selectors - MOVED HERE */}
               <section className="space-y-6 md:space-y-8 pt-10 border-t border-gray-100 dark:border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                   <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-gray-400 text-center md:text-left">Explore by Mood</h2>
                    
                   {!isLocal && (
                     <motion.button
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={toggleLocal}
                       className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black uppercase text-[9px] tracking-widest bg-white/50 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all backdrop-blur-md"
                     >
                       <Folder size={14} />
                       Play Local
                     </motion.button>
                   )}
                </div>

                {!isLocal ? (
                  <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x px-1">
                    {Object.entries(GENRE_CONFIG).map(([name, conf]) => (
                      <motion.button
                        key={name}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                           setSearchType("song");
                           setSelectedGenre(name);
                           loadSongs(`${name} hits`).then(setSearchResults);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`flex-shrink-0 w-[160px] md:w-[200px] p-4 md:p-5 rounded-2xl md:rounded-3xl relative overflow-hidden transition-all snap-start ${
                          selectedGenre === name 
                            ? "ring-2 ring-offset-1 ring-offset-transparent ring-[var(--color-primary)] shadow-lg" 
                            : "bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10"
                        }`}
                      >
                         <div className={`absolute inset-0 bg-gradient-to-br ${conf.color} opacity-40`} />
                         <div className="relative z-10 flex flex-col justify-end h-full text-left">
                            <div>
                               <span className="text-lg md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white block leading-none mb-1">{name}</span>
                               <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 opacity-60">Top Hits</span>
                            </div>
                         </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div 
                    style={{ backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }}
                    className="p-8 md:p-12 rounded-[2.5rem] border flex flex-col items-center text-center gap-4 w-full"
                  >
                     <div className="flex items-center gap-4">
                         <div 
                            style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                            className="p-4 rounded-full"
                         >
                           <Folder size={32} />
                         </div>
                         <div className="text-left">
                            <h3 className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white">Local Library</h3>
                            <button 
                              onClick={toggleLocal}
                              className="text-xs font-bold text-red-500/80 hover:text-red-500 uppercase tracking-widest mt-1"
                            >
                              Exit Local Mode
                            </button>
                         </div>
                     </div>
                  </div>
                )}
              </section>
            </section>
          )}

          {/* Open Source Footer */}
          <footer className="py-20 border-t border-gray-100 dark:border-white/5 flex flex-col items-center gap-6">
             <div className="flex items-center gap-3">
                <Github size={24} className="text-gray-400" />
                <span className="text-xl font-black tracking-tighter text-gray-900 dark:text-white">Grovy</span>
             </div>
             <p className="text-gray-500 font-medium text-center text-sm md:text-base">
                Grovy is an open-source web music player.<br />
                Crafted for premium audio experiences.
             </p>
              <Link 
                 href="https://github.com/archduke1337/grovy" 
                 target="_blank"
                 style={{ 
                   backgroundColor: colors.primary,
                   boxShadow: `0 20px 40px ${colors.primary}40`
                 }}
                 className="px-8 py-3 rounded-full text-white font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
              >
                 Star on GitHub
              </Link>
          </footer>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
