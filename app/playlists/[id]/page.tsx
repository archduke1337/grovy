"use client";

import React, { useEffect, useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Trash2, X, Music, Heart } from "lucide-react";

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
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
        <Music size={48} />
        <h2 className="text-xl font-bold">Playlist Not Found</h2>
        <button onClick={() => router.back()} className="text-[var(--color-primary)] font-bold uppercase tracking-widest text-xs">
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
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-32 pb-40 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-end gap-8 mb-12">
         <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-2xl relative group bg-gray-100 dark:bg-gray-800 flex-shrink-0"
         >
            {playlist.songs.length > 0 && playlist.songs[0].cover ? (
               <img src={playlist.songs[0].cover} alt={playlist.name} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                 <Music size={64} className="text-gray-400" />
               </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <button onClick={handlePlay} className="text-white hover:scale-110 transition-transform"><Play size={48} fill="white" /></button>
            </div>
         </motion.div>

         <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-[0.3em] text-gray-500">
              <span>Public Playlist</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
              {playlist.name}
            </h1>
            <p className="text-gray-500 font-medium text-sm md:text-base">
              Created by You • {playlist.songs.length} tracks • {new Date(playlist.createdAt).toLocaleDateString()}
            </p>
            
            <div className="flex items-center gap-4 pt-4">
               <button
                 onClick={handlePlay}
                 className="flex items-center gap-2 px-8 py-3 rounded-full text-white font-black uppercase text-xs tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95"
                 style={{ backgroundColor: colors.primary }}
               >
                 <Play size={16} fill="white" />
                 Play All
               </button>
               <button
                 onClick={handleDelete}
                 className="p-3 rounded-full border border-gray-200 dark:border-white/10 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all active:scale-95"
                 title="Delete Playlist"
               >
                 <Trash2 size={20} />
               </button>
            </div>
         </div>
      </div>

      {/* Song List */}
      <div className="bg-white/40 dark:bg-white/5 rounded-[2rem] md:rounded-[4rem] border border-gray-100 dark:border-white/10 overflow-hidden backdrop-blur-3xl shadow-xl min-h-[400px]">
         {playlist.songs.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400 space-y-4">
              <Music size={48} />
              <p className="font-bold">No tracks yet.</p>
              <button onClick={() => router.push("/")} className="text-[var(--color-primary)] text-xs font-black uppercase tracking-widest">Discover Music</button>
           </div>
         ) : (
           playlist.songs.map((song, i) => {
              const isCurrent = songs[currentSongIndex]?.id === song.id;
              const favorite = isFavorite(song.id);
             
              return (
                <div
                  key={`${song.id}-${i}`}
                  onClick={() => setQueue(playlist.songs, i)}
                  style={{ 
                    backgroundColor: isCurrent ? `${colors.primary}10` : undefined,
                    borderColor: isCurrent ? `${colors.primary}20` : undefined
                  }}
                  className={`group flex items-center gap-3 md:gap-5 px-4 py-3 md:px-6 md:py-4 cursor-pointer transition-all border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 ${
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
                      </div>
                   </div>

                   <div className="flex items-center gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }}
                         className={`p-2 rounded-full transition-all hover:bg-gray-100 dark:hover:bg-white/10 ${favorite ? "text-red-500" : "text-gray-300 hover:text-red-500"}`}
                      >
                         <Heart size={16} fill={favorite ? "currentColor" : "none"} className="md:w-5 md:h-5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFromPlaylist(playlist.id, song.id); }}
                        className="p-2 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        title="Remove from Playlist"
                      >
                        <X size={16} />
                      </button>
                   </div>
                </div>
              );
           })
         )}
      </div>
    </div>
  );
}
