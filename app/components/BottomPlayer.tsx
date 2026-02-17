"use client";

import React, { useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ChevronUp, Music } from "lucide-react";
import { MusicPlayer } from "./MusicPlayer";

export const BottomPlayer = () => {
  const { currentSongIndex, songs, isPlaying, togglePlayPause, nextTrack, previousTrack, duration, currentTime, seek, colors } = usePlayer();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!songs || songs.length === 0) return null;

  const currentSong = songs[currentSongIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Mini Player Bar */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ willChange: "transform" }}
        className="fixed bottom-3 sm:bottom-6 left-3 right-3 sm:left-4 sm:right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-[680px] z-50 safe-bottom"
      >
        <div 
          className="rounded-2xl sm:rounded-[3rem] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 relative backdrop-blur-3xl bg-black/70"
        >
          {/* Progress Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 cursor-pointer group/progress z-20 hover:h-1 transition-all"
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 if (rect.width > 0) {
                   seek((x / rect.width) * duration);
                 }
               }}>
            <motion.div 
              className="h-full relative rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="px-3 sm:px-4 py-2.5 sm:py-3 md:px-5 md:py-3 flex items-center justify-between gap-3 sm:gap-4 relative z-20">
            
            {/* Song Info */}
            <div 
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
              onClick={() => setIsExpanded(true)}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden relative shadow-lg border border-white/10 shrink-0">
                {currentSong?.cover ? (
                  <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover animate-[spin_8s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/10">
                    <Music size={18} className="text-white" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <ChevronUp size={18} className="text-white" />
                </div>
              </div>
              
              <div className="flex flex-col min-w-0 justify-center">
                <h4 className="font-bold text-white truncate text-[13px] sm:text-sm tracking-wide">
                  {currentSong?.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-white/40 truncate font-medium">
                  {currentSong?.artist}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 z-20">
              <button 
                onClick={(e) => { e.stopPropagation(); previousTrack(); }}
                className="p-1.5 sm:p-2 text-white/40 hover:text-white transition-all hidden sm:block hover:scale-110 active:scale-95"
              >
                <SkipBack size={20} fill="currentColor" strokeWidth={0} />
              </button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                className="p-2.5 sm:p-3 rounded-full bg-white text-black shadow-lg flex items-center justify-center shrink-0 hover:brightness-110 transition-all"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </motion.button>

              <button 
                onClick={(e) => { e.stopPropagation(); nextTrack(); }}
                className="p-1.5 sm:p-2 text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95"
              >
                <SkipForward size={20} fill="currentColor" strokeWidth={0} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expanded Player Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center cursor-pointer z-50 pointer-events-none">
               <div className="w-12 sm:w-16 h-1 sm:h-1.5 bg-white/20 rounded-full mt-2 pointer-events-auto transition-colors hover:bg-white/40" onClick={() => setIsExpanded(false)} />
            </div>
            
            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2.5 sm:p-3 rounded-full bg-black/20 text-white/40 hover:text-white hover:bg-white/10 transition-all z-50 backdrop-blur-md"
            >
              <ChevronUp size={20} className="rotate-180" />
            </button>

            <div className="w-full min-h-full flex-1">
              <MusicPlayer />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
