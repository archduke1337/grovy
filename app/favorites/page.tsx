"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Play, Music, Trash2, Shuffle, Search } from "lucide-react";
import Image from "next/image";
import { Button, EmptyState } from "@heroui/react";
import { getHDThumbnail } from "@/app/lib/thumbnail";

export default function FavoritesPage() {
  const router = useRouter();
  const { favorites, setQueue, toggleFavorite } = usePlayer();

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      setQueue(favorites, 0);
    }
  };

  const handleShufflePlay = () => {
    if (favorites.length > 0) {
      const shuffled = [...favorites];
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setQueue(shuffled, 0);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-350 mx-auto px-3 sm:px-5 md:px-8 lg:px-10 pt-8 sm:pt-10 md:pt-12 pb-36 sm:pb-40 space-y-10 sm:space-y-14"
    >
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 sm:gap-8 pt-4 sm:pt-8">
        <div className="space-y-4">
           <div className="flex items-center gap-3 font-black uppercase text-[11px] sm:text-[12px] tracking-[0.25em] text-pink-500">
             <Heart size={16} fill="currentColor" />
             <span>Your Collection</span>
           </div>
           <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-[-0.04em] leading-none">
             Favorites<span className="text-pink-500/20">.</span>
           </h1>
        </div>
        
        {favorites.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 w-full md:w-auto">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2.5 px-5 sm:px-8 py-3 sm:py-4 rounded-2xl bg-pink-500 text-white text-sm sm:text-base font-black shadow-xl shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              <Play size={20} fill="currentColor" />
              Play
            </button>
            <button
              onClick={handleShufflePlay}
              className="flex items-center gap-2.5 px-5 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white text-sm sm:text-base font-black hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all"
            >
              <Shuffle size={20} />
              Shuffle
            </button>
          </div>
        )}
      </header>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 100px' }}>
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
                <button
                  type="button"
                  onClick={() => setQueue(favorites, i)}
                  aria-label={`Play ${song.title}${song.artist ? ` by ${song.artist}` : ""}`}
                  className="block w-full aspect-square relative rounded-2xl sm:rounded-3xl overflow-hidden mb-3 bg-gray-100 dark:bg-white/5 shadow-lg group-hover:shadow-2xl transition-all duration-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                >
                  {song.cover ? (
                    <Image src={getHDThumbnail(song.cover) || ""} alt="" fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music size={40} className="text-gray-300 dark:text-white/10" aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500 flex items-center justify-center" aria-hidden="true">
                    <div className="w-12 h-12 bg-white/95 dark:bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl scale-90 group-hover:scale-100">
                      <Play size={18} fill="currentColor" className="text-black dark:text-white ml-0.5" />
                    </div>
                  </div>
                </button>

                <div className="px-1 space-y-0.5">
                  <h3 className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white truncate tracking-tight">{song.title}</h3>
                  <p className="text-[12px] sm:text-[13px] text-gray-400 dark:text-white/30 font-semibold truncate">{song.artist}</p>
                </div>

                {/* Remove from favorites button */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(song.id)}
                  aria-label={`Remove ${song.title} from favorites`}
                  className="absolute top-2 right-2 p-2 rounded-xl bg-black/40 backdrop-blur-md text-white opacity-100 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition-all hover:bg-red-500"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState className="flex flex-col items-center gap-6 py-20 sm:py-32 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-default/40 text-muted">
            <Heart size={44} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              No favorites yet
            </h2>
            <p className="mx-auto max-w-sm text-sm text-muted">
              Search for music, tap the heart on any song, and build your personal collection.
            </p>
          </div>
          <Button variant="primary" onPress={() => router.push("/")}>
            <Search size={18} />
            Discover music
          </Button>
        </EmptyState>
      )}
    </motion.div>
  );
}
