"use client";

import React from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import Image from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";

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
    <div className="space-y-3">
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
            className={`w-full group flex items-center gap-4 p-3 rounded-[1.5rem] transition-all duration-300 border border-transparent ${
              isCurrent 
                ? "bg-white/10 shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] border-white/5" 
                : "hover:bg-white/5 opacity-60 hover:opacity-100 hover:scale-[1.02]"
            }`}
          >
            {/* Cover Art or Number */}
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-lg">
               {song.cover ? (
                 <Image 
                   src={getHDThumbnail(song.cover) || ""} 
                   alt={song.title} 
                   width={48} 
                   height={48} 
                   className="w-full h-full object-cover" 
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <Music size={16} className="text-gray-400" />
                 </div>
               )}
               {isCurrent && isPlaying && (
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex gap-0.5 items-end h-4 pb-1">
                      {[...Array(3)].map((_, i) => (
                        <motion.div 
                          key={i}
                          animate={{ height: [4, 16, 4] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-1 bg-white rounded-full"
                          style={{ backgroundColor: colors.primary }}
                        />
                      ))}
                    </div>
                 </div>
               )}
            </div>

            <div className="text-left min-w-0 flex-1">
              <h4 
                style={{ color: isCurrent ? "white" : undefined }}
                className={`text-sm font-bold truncate ${isCurrent ? "" : "text-white"}`}
              >
                {song.title}
              </h4>
              <p 
                className="text-xs font-medium truncate transition-colors mt-0.5"
                style={{ color: isCurrent ? colors.primary : "rgba(255,255,255,0.5)" }}
              >
                {song.artist}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
