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
    if (hour < 5) setGreeting("Late Night Vibes");
    else if (hour < 12) setGreeting("Rise & Shine");
    else if (hour < 17) setGreeting("Keep the Vibe");
    else setGreeting("Evening Flow");
  }, []);

  // ... (existing code)

  return (
    <motion.div 
      // ...
    >
      {/* 1. Dynamic Tint Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-16 relative">
        {/* ... */}
        
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-3 font-black uppercase text-[11px] tracking-[0.5em]" style={{ color: colors.primary }}>
            <div className="w-8 h-[2px]" style={{ backgroundColor: colors.primary }} />
            <span>Handpicked for You</span>
          </div>
          <h1 className="text-7xl md:text-[120px] font-black text-gray-900 dark:text-white tracking-tighter leading-[0.85]">
            {greeting}
{/* ... */}
        <div className="relative group w-full md:w-[450px] shrink-0 space-y-4">
           {/* ... tabs ... */}

          <div className="relative">
            <button 
              onClick={handleManualSearch}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors z-10"
            >
              <Search size={22} />
            </button>
            <input 
              type="text"
              placeholder={isLocal ? "Digging through local files..." : "Find your rhythm..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              className="w-full pl-16 pr-12 py-7 rounded-[2rem] bg-white/40 dark:bg-white/5 border border-gray-100 dark:border-white/10 focus:border-blue-500 outline-none transition-all backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] focus:shadow-blue-500/10"
            />
            {/* ... spinner ... */}
          </div>
        </div>
      </header>

      {/* 4. Genre Selectors */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Pick Your Vibe</h2>
           <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleLocal}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${
                isLocal 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "bg-white/50 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
           >
              <Folder size={14} />
              {isLocal ? "Local Mode On" : "Switch to Local"}
           </motion.button>
        </div>
        {!isLocal ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(GENRE_CONFIG).map(([name, conf]) => (
              <motion.button
                // ... props
              >
                 {/* ... content ... */}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-[3.5rem] bg-blue-600/5 border border-blue-500/20 flex flex-col items-center text-center gap-4">
             <div className="p-4 bg-blue-600/10 rounded-full text-blue-500">
               <Folder size={32} />
             </div>
             <div>
               <h3 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">Your Offline Stash</h3>
               <p className="text-gray-500 font-medium">Jamming to tracks from <code>public/songs</code>.</p>
             </div>
          </div>
        )}
      </section>

      <AnimatePresence mode="wait">
        <motion.div key={selectedGenre || "default"} variants={containerVariants} className="space-y-24">
          
          {/* Results Section */}
          <section className="space-y-10">
            <div className="flex items-end justify-between px-2">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                {selectedGenre ? selectedGenre : (searchQuery ? `Found these for "${searchQuery}"` : "Everyone's Jamming To")}
              </h2>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-8">
              {searchResults.map((item, i) => {
                 // Render Logic based on searchType (or item.type if available)
                 
                 // 1. Song Card
                 if (searchType === "song") {
                   return (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className="group cursor-pointer space-y-5"
                      onClick={() => handlePlaySong(item.id)}
                    >
                      <div className="aspect-square relative rounded-[3.5rem] overflow-hidden shadow-2xl transition-all duration-700 group-hover:shadow-blue-500/25">
                         {item.cover ? (
                          <img src={item.cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                            <Music className="text-gray-400 w-16 h-16" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                           <PlayCircle size={64} className="text-white fill-white/10 backdrop-blur-md rounded-full" />
                        </div>
                      </div>
                      <div className="px-3">
                        <h3 className="font-black text-gray-900 dark:text-white truncate text-lg tracking-tight leading-tight">{item.title}</h3>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{item.artist || "Artist"}</p>
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
                      className="group cursor-pointer space-y-4"
                      onClick={() => handleEntityClick(item)}
                    >
                      <div className={`aspect-square relative overflow-hidden shadow-xl transition-all ${
                          item.type === 'artist' ? 'rounded-full' : 'rounded-3xl'
                      }`}>
                         {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <Library className="text-gray-500 w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <div className="text-center px-2">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate text-base">{item.name}</h3>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wider">{item.type}</p>
                      </div>
                    </motion.div>
                 );
              })}
            </div>
          </section>

          {/* Recently Played */}
          {recentlyPlayed.length > 0 && searchType === "song" && (
            <section className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <History size={24} className="text-blue-500" />
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Recently Played</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Your History</span>
                    <button 
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("grovy-history");
                          window.location.reload(); 
                        }
                      }}
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
               </div>
               
               <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar scroll-smooth snap-x">
                  {recentlyPlayed.map((song, i) => (
                    <motion.div
                      key={`recent-${song.id}`}
                      whileHover={{ y: -5 }}
                      onClick={() => setQueue([song, ...songs], 0)}
                      className="min-w-[200px] md:min-w-[240px] group cursor-pointer snap-start"
                    >
                       <div className="aspect-square relative rounded-3xl overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-all">
                          {song.cover ? (
                            <img src={song.cover} alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center"><Music /></div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                             <Play size={32} className="text-white fill-white" />
                          </div>
                       </div>
                       <h4 className="font-bold text-gray-900 dark:text-white truncate px-1">{song.title}</h4>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 mt-1">{song.artist}</p>
                    </motion.div>
                  ))}
               </div>
            </section>
          )}

          {/* Library List (Only visible if search type is SONG or after clicking an entity) */}
          {searchType === "song" && (
            <section className="space-y-10">
               <div className="flex items-center justify-between px-2">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Your Library</h2>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">{filteredSongs.length} Tracks</span>
               </div>
               
               <div className="bg-white/40 dark:bg-white/5 rounded-[4rem] border border-gray-100 dark:border-white/10 overflow-hidden backdrop-blur-3xl shadow-xl">
                  {filteredSongs.map((song, i) => {
                    const isCurrent = songs[currentSongIndex]?.id === song.id;
                    const favorite = isFavorite(song.id);
                    
                    return (
                      <div
                        key={song.id}
                        onClick={() => handlePlaySong(song.id)}
                        className={`group flex items-center gap-8 px-10 py-6 cursor-pointer transition-all border-b border-gray-100 dark:border-white/5 last:border-0 ${
                          isCurrent ? "bg-blue-600/10 dark:bg-blue-500/10" : "hover:bg-white/60 dark:hover:bg-white/10"
                        }`}
                      >
                         <div className="w-14 h-14 rounded-[1.5rem] overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 shadow-lg">
                            {song.cover ? (
                              <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Music size={20} /></div>
                            )}
                         </div>
  
                         <div className="flex-1 min-w-0">
                            <div className={`font-black truncate text-lg tracking-tight ${isCurrent ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>{song.title}</div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                              {song.artist || "Unknown artist"}
                            </div>
                         </div>
  
                         <div className="flex items-center gap-6">
                            {isCurrent && isPlaying && (
                              <div className="flex items-center gap-1.5 h-4 mr-6">
                                 {[...Array(3)].map((_, j) => (
                                   <motion.div 
                                     key={j}
                                     className="w-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                                     animate={{ height: [4, 16, 4] }}
                                     transition={{ repeat: Infinity, duration: 0.8, delay: j * 0.2 }}
                                   />
                                 ))}
                              </div>
                            )}
                            <button 
                               onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }}
                               className={`p-3 rounded-full transition-all ${favorite ? "text-red-500" : "text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"}`}
                            >
                               <Heart size={22} fill={favorite ? "currentColor" : "none"} />
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
                className="px-8 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl dark:shadow-white/10"
             >
                Star on GitHub
             </Link>
          </footer>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
