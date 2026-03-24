"use client";

import React from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Trash2, X, Music, Heart, Clock, Calendar, Shuffle } from "lucide-react";
import Image from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    playlists, 
    deletePlaylist, 
    removeFromPlaylist, 
    setQueue, 
    toggleFavorite, 
    isFavorite, 
    colors,
    currentSongIndex,
    isPlaying,
    songs
  } = usePlayer();

  const playlist = playlists.find((p) => p.id === (Array.isArray(id) ? id[0] : id));

  if (!playlist) {
    return (
      <div className="w-full min-h-[80vh] flex flex-col items-center justify-center gap-6 text-gray-400 p-6 text-center">
        <div className="w-24 h-24 rounded-[2.5rem] bg-gray-100 dark:bg-white/[0.03] flex items-center justify-center">
          <Music size={48} className="opacity-20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Playlist Not Found</h2>
          <p className="text-gray-500 dark:text-white/20 font-bold uppercase tracking-widest text-[10px]">It may have been deleted</p>
        </div>
        <button 
          onClick={() => router.push("/playlists")} 
          className="text-[13px] font-black uppercase tracking-widest px-8 py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-105 transition-all shadow-xl"
        >
           Back to Playlists
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      deletePlaylist(playlist.id);
      router.push("/playlists");
    }
  };

  const handlePlay = () => {
    if (playlist.songs.length > 0) {
      setQueue(playlist.songs, 0);
    }
  };

  const handleShuffle = () => {
    if (playlist.songs.length > 0) {
      const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
      setQueue(shuffled, 0);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-12 pb-40 space-y-12 sm:space-y-20"
    >
      {/* Header Section */}
      <header className="flex flex-col md:flex-row items-center md:items-end gap-10 md:gap-12">
         <motion.div 
           initial={{ opacity: 0, scale: 0.9, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] relative group flex-shrink-0 bg-gray-100 dark:bg-white/[0.03]"
         >
            {playlist.songs.length > 0 && playlist.songs[0].cover ? (
               <Image 
                 src={getHDThumbnail(playlist.songs[0].cover) || ""} 
                 alt={playlist.name} 
                 fill
                 className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
               />
            ) : (
               <div className="w-full h-full flex items-center justify-center">
                 <Music size={80} className="text-gray-300 dark:text-white/10" />
               </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-sm">
               <button onClick={handlePlay} className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-2xl">
                 <Play size={32} fill="currentColor" className="ml-1" />
               </button>
            </div>
         </motion.div>

         <div className="flex-1 space-y-6 text-center md:text-left pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-3 font-black uppercase text-[11px] sm:text-[12px] tracking-[0.3em] text-blue-500">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                <span>Playlist Collection</span>
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.9] drop-shadow-sm">
                {playlist.name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3">
              <div className="flex items-center gap-2 text-gray-500 dark:text-white/30 font-bold text-sm">
                <Music size={16} />
                <span>{playlist.songs.length} Tracks</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-white/30 font-bold text-sm">
                <Calendar size={16} />
                <span>Updated {new Date(playlist.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-4 pt-4">
               <button
                 onClick={handlePlay}
                 className="flex items-center gap-2.5 px-10 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase text-xs tracking-[0.15em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
               >
                 <Play size={18} fill="currentColor" />
                 Play All
               </button>
               <button
                 onClick={handleShuffle}
                 className="p-4 rounded-2xl bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/[0.08] active:scale-95 transition-all"
                 title="Shuffle"
               >
                 <Shuffle size={20} />
               </button>
               <button
                 onClick={handleDelete}
                 className="p-4 rounded-2xl bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"
                 title="Delete Playlist"
               >
                 <Trash2 size={20} />
               </button>
            </div>
         </div>
      </header>

      {/* Tracks Container */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Tracks</h2>
            <span className="text-[11px] font-black text-gray-400 dark:text-white/20 uppercase tracking-widest">{playlist.songs.length} Total</span>
         </div>

         <div className="bg-white/50 dark:bg-white/[0.02] rounded-[2.5rem] border border-gray-100 dark:border-white/[0.05] overflow-hidden backdrop-blur-3xl shadow-2xl">
            {playlist.songs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 px-6 text-gray-400 space-y-6 text-center">
                 <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-white/[0.03] flex items-center justify-center">
                    <Music size={40} className="opacity-20" />
                 </div>
                 <div className="space-y-2">
                    <p className="font-black text-xl text-gray-900 dark:text-white tracking-tight">Empty Playlist</p>
                    <p className="text-sm font-bold text-gray-500 dark:text-white/20 uppercase tracking-widest">Discover some music to add here</p>
                 </div>
                 <button 
                   onClick={() => router.push("/")} 
                   className="px-8 py-3 rounded-2xl bg-blue-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all"
                 >
                   Explore Music
                 </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/[0.03]">
                {playlist.songs.map((song, i) => {
                   const isCurrent = songs[currentSongIndex]?.id === song.id;
                   const favorite = isFavorite(song.id);
                  
                   return (
                     <motion.div
                       key={`${song.id}-${i}`}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: i * 0.02 }}
                       onClick={() => setQueue(playlist.songs, i)}
                       className={`group flex items-center gap-4 sm:gap-6 px-4 py-3 sm:px-8 sm:py-5 cursor-pointer transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.04] relative ${
                         isCurrent ? "bg-black/[0.02] dark:bg-white/[0.03]" : "" 
                       }`}
                     >
                        {/* Play Indicator */}
                        {isCurrent && (
                           <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        )}

                        {/* Track Number / Play Icon */}
                        <div className="w-6 sm:w-10 text-center flex-shrink-0 text-gray-400 font-black text-[11px] sm:text-sm tabular-nums">
                          {isCurrent && isPlaying ? (
                             <div className="flex items-center justify-center gap-1 h-4">
                               {[...Array(3)].map((_, j) => (
                                 <motion.div 
                                   key={j}
                                   className="w-1 rounded-full bg-blue-500"
                                   animate={{ height: [4, 16, 4] }}
                                   transition={{ repeat: Infinity, duration: 0.8, delay: j * 0.2 }}
                                 />
                               ))}
                             </div>
                          ) : (
                            <span className="group-hover:hidden transition-opacity">{i + 1}</span>
                          )}
                          <Play size={14} className="hidden group-hover:block mx-auto text-gray-900 dark:text-white" fill="currentColor" />
                        </div>

                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-200 dark:bg-white/[0.05] shrink-0 shadow-md relative transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl">
                           {song.cover ? (
                             <Image 
                               src={getHDThumbnail(song.cover) || ""} 
                               alt={song.title} 
                               fill
                               className="object-cover" 
                             />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center"><Music size={20} className="text-gray-400" /></div>
                           )}
                        </div>

                         <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
                            <div className={`font-black truncate text-[14px] sm:text-lg tracking-tight leading-tight transition-colors ${isCurrent ? "text-blue-500" : "text-gray-900 dark:text-white group-hover:text-blue-500"}`}>
                              {song.title}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] sm:text-[13px] text-gray-400 dark:text-white/25 font-bold truncate">{song.artist || "Unknown Artist"}</span>
                            </div>
                         </div>

                         <div className="flex items-center gap-2 sm:gap-4 px-2">
                            <button 
                               onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }}
                               className={`p-3 rounded-2xl transition-all hover:bg-gray-100 dark:hover:bg-white/10 ${favorite ? "text-red-500" : "text-gray-300 dark:text-white/10 hover:text-red-400"}`}
                            >
                               <Heart size={18} fill={favorite ? "currentColor" : "none"} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeFromPlaylist(playlist.id, song.id); }}
                              className="p-3 rounded-2xl text-gray-300 dark:text-white/10 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Remove"
                            >
                              <X size={18} />
                            </button>
                         </div>
                     </motion.div>
                   );
                })}
              </div>
            )}
         </div>
      </div>
    </motion.div>
  );
}
