"use client";

import React from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Trash2, X, Music, Heart } from "lucide-react";
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
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400 p-6 text-center">
        <Music size={48} className="opacity-20" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Playlist Not Found</h2>
        <button onClick={() => router.back()} className="text-[12px] font-black uppercase tracking-widest px-6 py-2 rounded-full bg-gray-100 dark:bg-white/5">
           Go Back
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

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-10 md:py-16 space-y-8 sm:space-y-12">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 md:gap-10">
         <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl relative group bg-gray-100 dark:bg-gray-800 flex-shrink-0 border border-gray-100 dark:border-white/5"
         >
            {playlist.songs.length > 0 && playlist.songs[0].cover ? (
               <Image 
                 src={getHDThumbnail(playlist.songs[0].cover) || ""} 
                 alt={playlist.name} 
                 width={300}
                 height={300}
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
               />
            ) : (
               <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-zinc-900">
                 <Music size={64} className="text-gray-400 dark:text-gray-700" />
               </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
               <button onClick={handlePlay} className="text-white hover:scale-110 transition-transform"><Play size={48} fill="white" /></button>
            </div>
         </motion.div>

         <div className="flex-1 space-y-3 sm:space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 font-black uppercase text-[10px] tracking-[0.3em] text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span>Library Playlist</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.95]">
              {playlist.name}
            </h1>
            <p className="text-gray-500 dark:text-white/40 font-medium text-xs sm:text-sm md:text-base">
              Created by You • {playlist.songs.length} tracks • {new Date(playlist.createdAt).toLocaleDateString()}
            </p>
            
            <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 pt-2 sm:pt-4">
               <button
                 onClick={handlePlay}
                 className="flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-white font-black uppercase text-[10px] sm:text-xs tracking-widest shadow-xl hover:opacity-90 transition-all active:scale-95"
                 style={{ backgroundColor: colors.primary }}
               >
                 <Play size={14} fill="white" />
                 Play All
               </button>
               <button
                 onClick={handleDelete}
                 className="p-2.5 sm:p-3 rounded-full border border-gray-200 dark:border-white/10 text-gray-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all active:scale-95 bg-white/5 backdrop-blur-sm"
                 title="Delete Playlist"
               >
                 <Trash2 size={18} className="sm:w-5 sm:h-5" />
               </button>
            </div>
         </div>
      </header>

      {/* Tracks Container */}
      <div className="bg-white/50 dark:bg-white/[0.03] rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] border border-gray-100 dark:border-white/10 overflow-hidden backdrop-blur-2xl shadow-xl min-h-[300px]">
         {playlist.songs.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-gray-400 space-y-4 text-center">
              <Music size={48} className="opacity-20" />
              <p className="font-bold text-gray-500">This playlist is looking a bit empty.</p>
              <button onClick={() => router.push("/")} className="px-6 py-2 rounded-full border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all">Discover Music</button>
           </div>
         ) : (
           <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
             {playlist.songs.map((song, i) => {
                const isCurrent = songs[currentSongIndex]?.id === song.id;
                const favorite = isFavorite(song.id);
               
                return (
                  <div
                    key={`${song.id}-${i}`}
                    onClick={() => setQueue(playlist.songs, i)}
                    className={`group flex items-center gap-3 sm:gap-5 px-3 py-2.5 sm:px-6 sm:py-4 cursor-pointer transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.04] relative ${
                      isCurrent ? "bg-black/[0.02] dark:bg-white/[0.02]" : "" 
                    }`}
                  >
                     {/* Play Indicator */}
                     {isCurrent && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1" 
                          style={{ backgroundColor: colors.primary }}
                        />
                     )}

                     {/* Track Number / Play Icon */}
                     <div className="w-5 sm:w-8 text-center flex-shrink-0 text-gray-400 font-bold text-[10px] sm:text-xs">
                       {isCurrent && isPlaying ? (
                          <div className="flex items-center justify-center gap-0.5 h-3">
                            {[...Array(3)].map((_, j) => (
                              <motion.div 
                                key={j}
                                style={{ backgroundColor: colors.primary }}
                                className="w-0.5 rounded-full"
                                animate={{ height: [4, 12, 4] }}
                                transition={{ repeat: Infinity, duration: 0.8, delay: j * 0.2 }}
                              />
                            ))}
                          </div>
                       ) : (
                         <span className="group-hover:hidden">{i + 1}</span>
                       )}
                       <Play size={12} className={`hidden group-hover:block mx-auto ${isCurrent ? "text-blue-500" : "text-gray-900 dark:text-white"}`} fill="currentColor" />
                     </div>

                     <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-gray-200 dark:bg-zinc-800 shrink-0 shadow-sm relative transition-all group-hover:shadow-md">
                        {song.cover ? (
                          <Image 
                            src={getHDThumbnail(song.cover) || ""} 
                            alt={song.title} 
                            width={48}
                            height={48}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Music size={16} className="text-gray-400" /></div>
                        )}
                     </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                         <div 
                           style={{ color: isCurrent ? colors.primary : undefined }}
                           className={`font-bold truncate text-[13px] sm:text-base tracking-tight leading-tight ${!isCurrent ? "text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors" : ""}`}
                         >
                           {song.title}
                         </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-white/40 font-medium truncate max-w-[120px] sm:max-w-none">{song.artist || "Unknown artist"}</span>
                        </div>
                     </div>

                     <div className="flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity px-1">
                        <button 
                           onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }}
                           className={`p-2 rounded-full transition-all hover:bg-gray-100 dark:hover:bg-white/10 ${favorite ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
                        >
                           <Heart size={16} fill={favorite ? "currentColor" : "none"} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeFromPlaylist(playlist.id, song.id); }}
                          className="p-2 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          title="Remove from Playlist"
                        >
                          <X size={16} />
                        </button>
                     </div>
                  </div>
                );
             })}
           </div>
         )}
      </div>
    </div>
  );
}
