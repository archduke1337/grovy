"use client";

import React from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Play, Music, Trash2, Shuffle } from "lucide-react";
import Image from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";

export default function FavoritesPage() {
  const { favorites, setQueue, toggleFavorite } = usePlayer();

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      setQueue(favorites, 0);
    }
  };

  const handleShufflePlay = () => {
    if (favorites.length > 0) {
      const shuffled = [...favorites].sort(() => Math.random() - 0.5);
      setQueue(shuffled, 0);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-350 mx-auto px-6 md:px-10 pt-12 pb-40 space-y-12 sm:space-y-16"
    >
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pt-4 sm:pt-8">
        <div className="space-y-4">
           <div className="flex items-center gap-3 font-black uppercase text-[11px] sm:text-[12px] tracking-[0.25em] text-pink-500">
             <Heart size={16} fill="currentColor" />
             <span>Your Collection</span>
           </div>
           <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-gray-900 dark:text-white tracking-[-0.04em] leading-none">
             Favorites<span className="text-pink-500/20">.</span>
           </h1>
        </div>
        
        {favorites.length > 0 && (
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-pink-500 text-white font-black shadow-xl shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              <Play size={20} fill="currentColor" />
              Play
            </button>
            <button
              onClick={handleShufflePlay}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-black hover:bg-gray-200 dark:hover:bg-white/8 active:scale-95 transition-all"
            >
              <Shuffle size={20} />
              Shuffle
            </button>
          </div>
        )}
      </header>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
          <AnimatePresence>
            {favorites.map((song, i) => (
              <motion.div
                key={song.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                <div 
                  onClick={() => setQueue(favorites, i)}
                  className="aspect-square relative rounded-2xl sm:rounded-3xl overflow-hidden mb-3 bg-gray-100 dark:bg-white/3 shadow-lg group-hover:shadow-2xl transition-all duration-500 cursor-pointer"
                >
                  {song.cover ? (
                    <Image src={getHDThumbnail(song.cover) || ""} alt={song.title} fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music size={40} className="text-gray-300 dark:text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/95 dark:bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl scale-90 group-hover:scale-100">
                      <Play size={18} fill="currentColor" className="text-black dark:text-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="px-1 space-y-0.5">
                  <h3 className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white truncate tracking-tight">{song.title}</h3>
                  <p className="text-[12px] sm:text-[13px] text-gray-400 dark:text-white/30 font-semibold truncate">{song.artist}</p>
                </div>

                {/* Remove from favorites button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(song.id); }}
                  className="absolute top-2 right-2 p-2 rounded-xl bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-32 text-center space-y-8">
           <div className="w-24 h-24 mx-auto rounded-4xl bg-gray-100 dark:bg-white/3 flex items-center justify-center text-gray-300 dark:text-white/10 shadow-inner">
              <Heart size={48} />
           </div>
           <div className="space-y-3">
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">No favorites yet</p>
              <p className="text-gray-400 dark:text-white/30 font-bold max-w-sm mx-auto">Songs you love will appear here. Start exploring and mark some tracks!</p>
           </div>
           <button 
             onClick={() => window.location.href = "/browse"}
             className="px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-[14px] hover:scale-105 active:scale-95 transition-all shadow-xl"
           >
             Start Browsing
           </button>
        </div>
      )}
    </motion.div>
  );
}
