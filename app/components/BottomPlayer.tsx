"use client";

import React, { useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ChevronUp, Music, Volume2, VolumeX } from "lucide-react";
import { MusicPlayer } from "./MusicPlayer";
import { AmbientBackground } from "./AmbientBackground";

export const BottomPlayer = () => {
  const { currentSongIndex, songs, isPlaying, togglePlayPause, nextTrack, previousTrack, duration, currentTime, seek, volume, setVolume, colors } = usePlayer();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

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
        className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-4xl z-40"
      >
        <div 
          className="glass-effect dark:glass-effect-dark rounded-[2rem] overflow-hidden shadow-[0_20px_40px_-5px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10 backdrop-blur-2xl relative"
        >
          {/* Animated Border Gradient */}
          <motion.div 
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-[2rem] border-2 border-white/10 pointer-events-none z-10"
            style={{ borderColor: `${colors.primary}20` }}
          />

          <AmbientBackground className="absolute opacity-30 dark:opacity-20 mix-blend-soft-light" />
          
          {/* Progress Bar Layer - Slim & Interactive */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5 cursor-pointer group/progress z-20 hover:h-1 transition-all"
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.clientX - rect.left;
                 if (rect.width > 0) {
                   seek((x / rect.width) * duration);
                 }
               }}>
            <motion.div 
              className="h-full relative"
              style={{ 
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              }}
            >
              <div 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] rounded-full opacity-0 group-hover/progress:opacity-100 transition-all scale-50 group-hover/progress:scale-100"
              />
            </motion.div>
          </div>

          <div className="px-3 py-2 md:px-5 md:py-3 flex items-center justify-between gap-4 relative z-20">
            
            {/* Left: Song Info */}
            <div 
              className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer group"
              onClick={() => setIsExpanded(true)}
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gray-200 dark:bg-gray-800 flex-shrink-0 overflow-hidden relative shadow-lg group-hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.2)] transition-all border border-white/10">
                {currentSong?.cover ? (
                  <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <Music size={18} style={{ color: colors.primary }} />
                  </div>
                )}
                {/* Expand Hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <ChevronUp size={20} className="text-white drop-shadow-md" />
                </div>
              </div>
              
              <div className="flex flex-col min-w-0 justify-center">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate text-xs md:text-sm tracking-tight mb-0.5">
                  {currentSong?.title}
                </h4>
                <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate font-semibold" style={{ color: colors.primary }}>
                  {currentSong?.artist}
                </p>
              </div>
            </div>

            {/* Center: Controls */}
            <div className="flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-4 z-20">
              <button 
                onClick={(e) => { e.stopPropagation(); previousTrack(); }}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hidden md:block"
              >
                <SkipBack size={20} fill="currentColor" />
              </button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                className="p-3 rounded-full text-white shadow-lg flex items-center justify-center shrink-0 relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                }}
              >
                <div className="absolute inset-0 bg-white/20 hover:bg-white/30 transition-colors" />
                {isPlaying ? <Pause size={20} fill="currentColor" className="relative z-10" /> : <Play size={20} fill="currentColor" className="ml-0.5 relative z-10" />}
              </motion.button>

              <button 
                onClick={(e) => { e.stopPropagation(); nextTrack(); }}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
              >
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>

            {/* Right: Actions */}
            <div className="hidden md:flex items-center gap-4 relative">
               <div className="flex items-center gap-2 group/volume hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-white/5">
                 <button 
                   onClick={() => setVolume(volume === 0 ? 1 : 0)}
                   className="text-gray-400 group-hover/volume:text-white transition-colors"
                 >
                    {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                 </button>
                 <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer relative">
                    <div 
                      className="absolute inset-0 bg-white/30"
                    />
                    <motion.div 
                      layout
                      className="h-full rounded-full"
                      style={{ 
                        width: `${volume * 100}%`,
                        backgroundColor: colors.primary
                      }}
                    />
                    <input 
                       type="range"
                       min="0"
                       max="1"
                       step="0.01"
                       value={volume}
                       onChange={(e) => setVolume(parseFloat(e.target.value))}
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                 </div>
               </div>

               <button 
                 onClick={() => setIsExpanded(true)}
                 className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all border border-white/5"
               >
                 <ChevronUp size={16} />
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
            className="fixed inset-0 z-[100] bg-bg/95 dark:bg-bg-dark/95 backdrop-blur-3xl flex flex-col items-center overflow-y-auto"
          >
            {/* Grab Handle */}
            <div className="sticky top-0 left-0 right-0 h-10 flex items-center justify-center cursor-pointer z-10" onClick={() => setIsExpanded(false)}>
               <div className="w-16 h-1.5 bg-gray-300/50 dark:bg-white/20 rounded-full mb-2" />
            </div>
            
            <button 
              onClick={() => setIsExpanded(false)}
              className="absolute top-8 right-8 p-3 rounded-full glass-effect dark:glass-effect-dark text-gray-500 hover:text-blue-600 transition-all z-20"
            >
              <ChevronUp size={24} className="rotate-180" />
            </button>

            {/* Embedded Full Player Component with padding for mobile */}
            <div className="w-full max-w-7xl px-4 py-8 md:py-16">
              <MusicPlayer />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
