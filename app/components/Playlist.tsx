"use client";

import React from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion } from "framer-motion";
import { Music } from "lucide-react";

export const Playlist: React.FC = () => {
  const { songs, currentSongIndex, setCurrentSongIndex, isPlaying, colors } = usePlayer();

  if (songs.length === 0) {
    return (
      <div className="text-center py-8">
        <Music size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Queue Empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {songs.slice(currentSongIndex, currentSongIndex + 8).map((song, i) => {
        const index = currentSongIndex + i;
        const isCurrent = index === currentSongIndex;
        return (
          <motion.button
            key={`${song.id}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setCurrentSongIndex(index)}
            className={`w-full group flex items-center gap-3 p-2 rounded-xl transition-all ${
              isCurrent 
                ? "bg-white/10 dark:bg-white/5 shadow-sm" 
                : "hover:bg-white/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100"
            }`}
          >
            {/* Cover Art or Number */}
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-800">
               {song.cover ? (
                 <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <Music size={14} className="text-gray-400" />
                 </div>
               )}
               {isCurrent && isPlaying && (
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex gap-0.5 items-end h-3">
                      {[...Array(3)].map((_, i) => (
                        <motion.div 
                          key={i}
                          animate={{ height: [4, 12, 4] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-1 bg-white rounded-full"
                        />
                      ))}
                    </div>
                 </div>
               )}
            </div>

            <div className="text-left min-w-0 flex-1">
              <h4 
                style={{ color: isCurrent ? colors.primary : undefined }}
                className={`text-xs font-bold truncate ${isCurrent ? "" : "text-gray-900 dark:text-white"}`}
              >
                {song.title}
              </h4>
              <p className="text-[10px] font-medium text-gray-500 truncate">{song.artist}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
