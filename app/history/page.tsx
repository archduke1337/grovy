"use client";

import React from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Play, Music, Trash2, RotateCcw } from "lucide-react";
import Image from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";

export default function HistoryPage() {
  const { recentlyPlayed, setQueue, clearHistory } = usePlayer();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-12 pb-40 space-y-12 sm:space-y-16"
    >
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pt-4 sm:pt-8">
        <div className="space-y-4">
           <div className="flex items-center gap-3 font-black uppercase text-[11px] sm:text-[12px] tracking-[0.25em] text-blue-500">
             <Clock size={16} />
             <span>Playback History</span>
           </div>
           <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-gray-900 dark:text-white tracking-[-0.04em] leading-none">
             Recent<span className="text-blue-500/20">.</span>
           </h1>
        </div>
        
        {recentlyPlayed.length > 0 && (
          <button
            onClick={clearHistory}
            className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-white/30 font-black hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"
          >
            <Trash2 size={18} className="transition-transform group-hover:rotate-12" />
            Clear All
          </button>
        )}
      </header>

      {recentlyPlayed.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
          <AnimatePresence>
            {recentlyPlayed.map((song, i) => (
              <motion.div
                key={`${song.id}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.02 }}
                whileHover={{ y: -8 }}
                onClick={() => setQueue(recentlyPlayed, i)}
                className="group cursor-pointer space-y-3"
              >
                <div className="aspect-square relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-100 dark:bg-white/[0.03] shadow-lg group-hover:shadow-2xl transition-all duration-500">
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-32 text-center space-y-8">
           <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gray-100 dark:bg-white/[0.03] flex items-center justify-center text-gray-300 dark:text-white/10 shadow-inner">
              <Clock size={48} />
           </div>
           <div className="space-y-3">
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Your history is empty</p>
              <p className="text-gray-400 dark:text-white/30 font-bold max-w-sm mx-auto">Songs you listen to will appear here for quick access. Let's start the music!</p>
           </div>
           <button 
             onClick={() => window.location.href = "/"}
             className="flex items-center gap-2.5 mx-auto px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-[14px] hover:scale-105 active:scale-95 transition-all shadow-xl"
           >
             <RotateCcw size={18} />
             Start Listening
           </button>
        </div>
      )}
    </motion.div>
  );
}
