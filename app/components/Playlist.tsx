"use client";

import React, { useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Music, X, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";

export const Playlist: React.FC = () => {
  const { songs, currentSongIndex, setCurrentSongIndex, isPlaying, colors, removeFromQueue, moveSongInQueue } = usePlayer();
  const [showAll, setShowAll] = useState(false);

  if (songs.length === 0) {
    return (
      <div className="text-center py-8">
        <Music size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Queue Empty</p>
      </div>
    );
  }

  const displaySongs = showAll ? songs : songs.slice(currentSongIndex, currentSongIndex + 12);
  const startIndex = showAll ? 0 : currentSongIndex;

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
      {displaySongs.map((song, i) => {
        const index = startIndex + i;
        const isCurrent = index === currentSongIndex;
        return (
          <motion.div
            key={`${song.id}-${index}`}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10, height: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`group flex items-center gap-3 p-2.5 rounded-[1.25rem] transition-all duration-300 border border-transparent ${
              isCurrent 
                ? "bg-white/10 shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] border-white/5" 
                : "hover:bg-white/5 opacity-60 hover:opacity-100"
            }`}
          >
            {/* Cover Art */}
            <button
              onClick={() => setCurrentSongIndex(index)}
              className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-lg cursor-pointer"
            >
               {song.cover ? (
                 <Image 
                   src={getHDThumbnail(song.cover) || ""} 
                   alt={song.title} 
                   width={44} 
                   height={44} 
                   className="w-full h-full object-cover" 
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <Music size={14} className="text-gray-400" />
                 </div>
               )}
               {isCurrent && isPlaying && (
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex gap-0.5 items-end h-3.5 pb-0.5">
                      {[...Array(3)].map((_, j) => (
                        <motion.div 
                          key={j}
                          animate={{ height: [3, 14, 3] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: j * 0.1 }}
                          className="w-0.5 bg-white rounded-full"
                          style={{ backgroundColor: colors.primary }}
                        />
                      ))}
                    </div>
                 </div>
               )}
            </button>

            {/* Song info */}
            <button
              onClick={() => setCurrentSongIndex(index)}
              className="text-left min-w-0 flex-1 cursor-pointer"
            >
              <h4 
                style={{ color: isCurrent ? "white" : undefined }}
                className={`text-[13px] font-bold truncate ${isCurrent ? "" : "text-white"}`}
              >
                {song.title}
              </h4>
              <p 
                className="text-[11px] font-medium truncate transition-colors mt-0.5"
                style={{ color: isCurrent ? colors.primary : "rgba(255,255,255,0.5)" }}
              >
                {song.artist}
              </p>
            </button>

            {/* Queue management controls - visible on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {index > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); moveSongInQueue(index, index - 1); }}
                  className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
                  title="Move up"
                >
                  <ChevronUp size={14} />
                </button>
              )}
              {index < songs.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); moveSongInQueue(index, index + 1); }}
                  className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
                  title="Move down"
                >
                  <ChevronDown size={14} />
                </button>
              )}
              {!isCurrent && songs.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromQueue(index); }}
                  className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Remove from queue"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
      </AnimatePresence>

      {/* Show more/less toggle */}
      {songs.length > 12 && (
        <button
          onClick={() => setShowAll(prev => !prev)}
          className="w-full py-2 text-[11px] font-semibold text-white/30 hover:text-white/60 transition-colors text-center"
        >
          {showAll ? `Show less` : `Show all ${songs.length} tracks`}
        </button>
      )}
    </div>
  );
};
