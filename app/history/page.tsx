"use client";

import React from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion } from "framer-motion";
import { Clock, Play, Music, Trash2 } from "lucide-react";
import Image from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";

export default function HistoryPage() {
  const { recentlyPlayed, setQueue, clearHistory } = usePlayer();

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-12 pb-32 space-y-10">
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="space-y-4">
           <div className="flex items-center gap-2 font-bold uppercase text-[11px] tracking-[0.2em] text-blue-500">
             <Clock size={14} />
             <span>Your Library</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-[-0.03em]">
             Recently Played<span className="text-blue-500/20">.</span>
           </h1>
        </div>
        
        {recentlyPlayed.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60 font-bold hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
            Clear History
          </button>
        )}
      </header>

      {recentlyPlayed.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {recentlyPlayed.map((song, i) => (
            <motion.div
              key={`${song.id}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -5 }}
              onClick={() => setQueue(recentlyPlayed, i)}
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
              <Clock size={40} />
           </div>
           <div className="space-y-1">
              <p className="text-xl font-bold text-gray-900 dark:text-white">Nothing played yet</p>
              <p className="text-gray-500 dark:text-white/40">Your listening history will appear here.</p>
           </div>
        </div>
      )}
    </div>
  );
}
