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
  Clock
} from "lucide-react";
import { Song } from "./types/song";
import Link from "next/link";

const GENRE_CONFIG = {
  "Bollywood": { icon: <Music size={24} />, color: "from-pink-500/20 to-rose-500/20" },
  "Punjabi": { icon: <Zap size={24} />, color: "from-amber-500/20 to-orange-500/20" },
  "Indipop": { icon: <Sparkles size={24} />, color: "from-violet-500/20 to-purple-500/20" },
  "Devotional": { icon: <Moon size={24} />, color: "from-orange-600/20 to-yellow-600/20" }
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
    recentlyPlayed
  } = usePlayer();
  
  const [searchResults, setSearchResults] = useState<any[]>([]); // Can be Song[] or Entity[]
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isLocal, setIsLocal] = useState(false);
  const [greeting, setGreeting] = useState("Hello");
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<"song" | "artist" | "album" | "playlist">("song");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      className="w-full max-w-[1400px] mx-auto px-6 lg:px-16 py-12 space-y-24 pb-48"
    >
      {/* 1. Dynamic Tint Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 xl:gap-16 relative">
        <div 
          className="absolute -top-32 -left-20 w-[300px] h-[300px] md:w-[500px] md:h-[500px] blur-[120px] md:blur-[150px] rounded-full mix-blend-screen opacity-20 pointer-events-none transition-colors duration-1000" 
          style={{ backgroundColor: colors.primary }} 
        />
        
        <div className="space-y-6 relative z-10 text-center xl:text-left max-w-2xl">
          <div className="flex items-center justify-center xl:justify-start gap-3 font-black uppercase text-[10px] md:text-[11px] tracking-[0.3em] md:tracking-[0.5em]" style={{ color: colors.primary }}>
            <div className="w-8 h-[2px]" style={{ backgroundColor: colors.primary }} />
            <span>Your Daily Mix</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl xl:text-[120px] font-black text-gray-900 dark:text-white tracking-tighter leading-[0.9]">
              {greeting}
              <motion.span 
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ color: colors.secondary }}
              >
                .
              </motion.span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm md:text-lg max-w-lg mx-auto xl:mx-0 leading-relaxed">
              Music is more than just sound—it's a feeling. Dive into your favorite tracks or discover something entirely new today.
            </p>
          </div>
        </div>

        <div className="relative group w-full xl:w-[450px] shrink-0 space-y-4">
           {/* Search Type Tabs */}
           {!isLocal && mounted && (
             <div className="flex flex-wrap justify-center xl:justify-start gap-2 md:gap-0 bg-white/50 dark:bg-white/5 p-1 rounded-[2rem] backdrop-blur-md w-full md:w-fit mx-auto xl:mx-0">
               {(["song", "artist", "album", "playlist"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
                    style={{ 
                      backgroundColor: searchType === type ? colors.primary : "transparent",
                      color: searchType === type ? "white" : undefined,
                      boxShadow: searchType === type ? `0 10px 20px ${colors.primary}40` : "none"
                    }}
                    className={`px-3 py-2 md:px-4 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 md:flex-none ${
                      searchType !== type 
                        ? "text-gray-500 hover:text-gray-900 dark:hover:text-white" 
                        : ""
                    }`}
                  >
                    {type}
                  </button>
               ))}
             </div>
           )}

          <div className="relative w-full">
            <button 
              onClick={handleManualSearch}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 transition-colors z-10"
            >
              <Search size={20} />
            </button>
            <input 
              type="text"
              placeholder={isLocal ? "Search your local files..." : "What do you want to play?"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              style={{ 
                borderColor: "rgba(0,0,0,0.05)",
                // We'll handle focus via className or just leave it for now if complex
              }}
              className="w-full pl-14 pr-12 py-5 md:py-7 rounded-[2rem] bg-white/40 dark:bg-white/5 border border-gray-100 dark:border-white/10 focus:ring-2 focus:ring-offset-2 outline-none transition-all backdrop-blur-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] text-sm md:text-base"
            />
            {isSearching && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ borderTopColor: colors.primary }}
                  className="w-5 h-5 border-2 border-gray-200 rounded-full"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 4. Genre Selectors */}
      <section className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
           <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-gray-400 text-center md:text-left">Explore by Mood</h2>
            <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={toggleLocal}
               style={{ 
                 backgroundColor: isLocal ? colors.primary : undefined,
                 color: isLocal ? "white" : undefined,
                 boxShadow: isLocal ? `0 10px 20px ${colors.primary}40` : "none"
               }}
               className={`flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-full font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all ${
                 !isLocal 
                   ? "bg-white/50 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white" 
                   : ""
               }`}
            >
               <Folder size={14} />
               {isLocal ? "Close Local Files" : "Play from your machine"}
            </motion.button>
        </div>
        {!isLocal ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Object.entries(GENRE_CONFIG).map(([name, conf]) => (
              <motion.button
                key={name}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                   setSearchType("song");
                   setSelectedGenre(name);
                   loadSongs(`${name} hits`).then(setSearchResults);
                }}
                style={{ 
                  borderColor: selectedGenre === name ? colors.primary : "transparent",
                  boxShadow: selectedGenre === name ? `0 20px 40px ${colors.primary}20` : "none"
                }}
                className={`p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] relative overflow-hidden transition-all border-2 ${
                  selectedGenre !== name 
                    ? "bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10" 
                    : ""
                }`}
              >
                 <div className={`absolute inset-0 bg-gradient-to-br ${conf.color} opacity-40`} />
                 <div className="relative z-10 flex flex-col gap-3 md:gap-4 items-center md:items-start text-center md:text-left">
                    <div className="p-2.5 md:p-3 bg-white dark:bg-black/20 rounded-2xl w-fit shadow-sm">
                      {conf.icon}
                    </div>
                    <span className="text-lg md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white">{name}</span>
                 </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div 
            style={{ backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }}
            className="p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border flex flex-col items-center text-center gap-4"
          >
             <div 
                style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                className="p-4 rounded-full"
             >
               <Folder size={32} />
             </div>
             <div>
               <h3 className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white">Local Library Mode</h3>
               <p className="text-sm md:text-base text-gray-500 font-medium max-w-xs mx-auto">Accessing songs from your <code>public/songs</code> folder.</p>
             </div>
          </div>
        )}
      </section>

      <AnimatePresence mode="wait">
        <motion.div key={selectedGenre || "default"} variants={containerVariants} className="space-y-16 md:space-y-24">
          
          {/* Results Section */}
          <section className="space-y-6 md:space-y-10">
            <div className="flex items-end justify-between px-2">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                {selectedGenre ? selectedGenre : (searchQuery ? `Checking out "${searchQuery}"` : "Made for You")}
              </h2>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 md:gap-8">
              {searchResults.map((item, i) => {
                 // Render Logic based on searchType (or item.type if available)
                 
                 // 1. Song Card
                 if (searchType === "song") {
                   return (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className="group cursor-pointer space-y-3 md:space-y-5"
                      onClick={() => handlePlaySong(item.id)}
                    >
                      <div className="aspect-square relative rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-xl md:shadow-2xl transition-all duration-700 group-hover:shadow-blue-500/25">
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
                      <div className="px-1 md:px-3">
                        <h3 className="font-black text-gray-900 dark:text-white truncate text-sm md:text-lg tracking-tight leading-tight">{item.title}</h3>
                        <p className="text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate">{item.artist || "Artist"}</p>
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
                      className="group cursor-pointer space-y-2 md:space-y-4"
                      onClick={() => handleEntityClick(item)}
                    >
                      <div className={`aspect-square relative overflow-hidden shadow-lg md:shadow-xl transition-all ${
                          item.type === 'artist' ? 'rounded-full' : 'rounded-3xl'
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
                        <h3 className="font-bold text-gray-900 dark:text-white truncate text-xs md:text-base">{item.name}</h3>
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
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("grovy-history");
                          window.location.reload(); 
                        }
                      }}
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
                      className="min-w-[140px] md:min-w-[200px] group cursor-pointer snap-start"
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
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">{filteredSongs.length} Tracks</span>
               </div>
               
               <div className="bg-white/40 dark:bg-white/5 rounded-[2rem] md:rounded-[4rem] border border-gray-100 dark:border-white/10 overflow-hidden backdrop-blur-3xl shadow-xl">
                  {filteredSongs.map((song, i) => {
                    const isCurrent = songs[currentSongIndex]?.id === song.id;
                    const favorite = isFavorite(song.id);
                    
                    return (
                      <div
                        key={song.id}
                        onClick={() => handlePlaySong(song.id)}
                        style={{ 
                          backgroundColor: isCurrent ? `${colors.primary}20` : undefined,
                        }}
                        className={`group flex items-center gap-4 md:gap-8 px-4 py-4 md:px-10 md:py-6 cursor-pointer transition-all border-b border-gray-100 dark:border-white/5 last:border-0 ${
                          !isCurrent ? "hover:bg-white/60 dark:hover:bg-white/10" : ""
                        }`}
                      >
                         <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-[1.5rem] overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 shadow-lg">
                            {song.cover ? (
                              <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Music size={16} className="md:w-5 md:h-5" /></div>
                            )}
                         </div>
  
                          <div className="flex-1 min-w-0">
                             <div 
                               style={{ color: isCurrent ? colors.primary : undefined }}
                               className={`font-black truncate text-sm md:text-lg tracking-tight ${!isCurrent ? "text-gray-900 dark:text-white" : ""}`}
                             >
                               {song.title}
                             </div>
                            <div className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-0.5 md:mt-1">
                              {song.artist || "Unknown artist"}
                            </div>
                         </div>
  
                         <div className="flex items-center gap-2 md:gap-6">
                             {isCurrent && isPlaying && (
                               <div className="flex items-center gap-1 h-3 md:gap-1.5 md:h-4 mr-2 md:mr-6">
                                  {[...Array(3)].map((_, j) => (
                                    <motion.div 
                                      key={j}
                                      style={{ backgroundColor: colors.primary }}
                                      className="w-1 md:w-1.5 rounded-full"
                                      animate={{ height: [4, 12, 4] }}
                                      transition={{ repeat: Infinity, duration: 0.8, delay: j * 0.2 }}
                                    />
                                  ))}
                               </div>
                             )}
                            <button 
                               onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }}
                               className={`p-2 md:p-3 rounded-full transition-all ${favorite ? "text-red-500" : "text-gray-300 opacity-100 md:opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"}`}
                            >
                               <Heart size={18} fill={favorite ? "currentColor" : "none"} className="md:w-5 md:h-5" />
                            </button>
                         </div>
                      </div>
                    );
                  })}
               </div>
            </section>
          )}

          {/* Open Source Footer */}
          <footer className="py-20 border-t border-gray-100 dark:border-white/5 flex flex-col items-center gap-6">
             <div className="flex items-center gap-3">
                <Github size={24} className="text-gray-400" />
                <span className="text-xl font-black tracking-tighter text-gray-900 dark:text-white">Grovy</span>
             </div>
             <p className="text-gray-500 font-medium text-center">
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
