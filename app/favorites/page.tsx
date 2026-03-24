"use client";

import React from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion } from "framer-motion";
import { Heart, Play, Music } from "lucide-react";
import Image from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";

export default function FavoritesPage() {
  const { favorites, recentlyPlayed, setQueue, isPlaying, currentSongIndex, songs: queueSongs } = usePlayer();

  // In this app, favorites is a list of IDs. We need to find the song objects.
  // Since we don't have a global "all songs" database, we'll use history or search cache as a proxy, 
  // or just show a message if we can't find them.
  // Actually, a better way is to store the full song object in IndexedDB favorites.
  // But for now, let's filter from recently played.
  
  const favoriteSongs = recentlyPlayed.filter(s => favorites.includes(s.id));

  const handlePlayAll = () => {
    if (favoriteSongs.length > 0) {
      setQueue(favoriteSongs, 0);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-12 pb-32 space-y-10">
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="space-y-4">
           <div className="flex items-center gap-2 font-bold uppercase text-[11px] tracking-[0.2em] text-pink-500">
             <Heart size={14} fill="currentColor" />
             <span>Your Library</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-[-0.03em]">
             Favorite Songs<span className="text-pink-500/20">.</span>
           </h1>
        </div>
        
        {favoriteSongs.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-pink-500 text-white font-bold shadow-lg shadow-pink-500/25 hover:scale-105 transition-transform"
          >
            <Play size={18} fill="currentColor" />
            Play All
          </button>
        )}
      </header>

      {favoriteSongs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {favoriteSongs.map((song, i) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5 }}
              onClick={() => setQueue(favoriteSongs, i)}
              className="group cursor-pointer"
            >
              <div className="aspect-square relative rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-white/[0.03] apple-shadow">
                {song.cover ? (
                  <Image src={getHDThumbnail(song.cover) || ""} alt={song.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={32} className="text-gray-300 dark:text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                   <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                      <Play size={20} fill="currentColor" className="text-black dark:text-white ml-1" />
                   </div>
                </div>
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{song.title}</h3>
              <p className="text-xs text-gray-500 dark:text-white/40 truncate font-medium">{song.artist}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
           <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-100 dark:bg-white/[0.03] flex items-center justify-center text-gray-300 dark:text-white/10">
              <Heart size={40} />
           </div>
           <div className="space-y-1">
              <p className="text-xl font-bold text-gray-900 dark:text-white">No favorites yet</p>
              <p className="text-gray-500 dark:text-white/40">Songs you love will appear here.</p>
           </div>
        </div>
      )}
    </div>
  );
}
