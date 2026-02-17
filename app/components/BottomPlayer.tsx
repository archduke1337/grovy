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
        className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-5xl z-40"
      >
        <div 
          className="glass-effect dark:glass-effect-dark rounded-full overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] border border-white/20 dark:border-white/5 backdrop-blur-3xl relative"
        >
          {/* Animated Border Gradient */}
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 rounded-full border border-white/10 pointer-events-none z-10"
            style={{ borderColor: `${colors.primary}30` }}
          />

          <AmbientBackground className="absolute opacity-50 dark:opacity-30 mix-blend-soft-light" />
          
          {/* Progress Bar Layer - Slim & Premium */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-200/20 dark:bg-white/5 cursor-pointer group/progress z-20"
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
                background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
              }}
            >
              <div 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white shadow-lg rounded-full opacity-0 group-hover/progress:opacity-100 transition-all scale-50 group-hover/progress:scale-100"
                style={{ boxShadow: `0 0 10px ${colors.primary}60` }}
              />
            </motion.div>
          </div>

          <div className="px-3 py-2 md:px-6 md:py-3 flex items-center justify-between gap-4 relative z-20">
            
            {/* Left: Song Info */}
            <div 
              className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 cursor-pointer group"
              onClick={() => setIsExpanded(true)}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0 overflow-hidden relative shadow-md group-hover:scale-105 transition-transform border border-white/10 animate-[spin_10s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
                {currentSong?.cover ? (
                  <img src={currentSong.cover} alt={currentSong.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/10">
                    <Music size={18} style={{ color: colors.primary }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ChevronUp size={16} className="text-white" />
                </div>
              </div>
              
              <div className="flex flex-col min-w-0 justify-center">
                <h4 className="font-bold text-gray-900 dark:text-white truncate text-xs md:text-sm tracking-tight leading-none mb-1">
                  {currentSong?.title}
                </h4>
                <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate font-semibold opacity-70">
                  {currentSong?.artist || "Unknown artist"}
                </p>
              </div>
            </div>

            {/* Center: Controls (Desktop Absolute, Mobile Flex) */}
            <div className="flex md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 items-center gap-3 md:gap-5 z-20 bg-transparent">
              <button 
                onClick={(e) => { e.stopPropagation(); previousTrack(); }}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:scale-110 active:scale-95 hidden md:block"
              >
                <SkipBack size={20} fill="currentColor" className="opacity-80" />
              </button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                className="group relative p-3 rounded-full text-white transition-all shadow-lg flex items-center justify-center shrink-0"
                style={{ 
                  backgroundColor: colors.primary,
                  boxShadow: `0 4px 20px ${colors.primary}40`
                }}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </motion.button>

              <button 
                onClick={(e) => { e.stopPropagation(); nextTrack(); }}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
              >
                <SkipForward size={20} fill="currentColor" className="opacity-80" />
              </button>
            </div>

            {/* Right: Actions / Volume */}
            <div className="hidden md:flex items-center gap-4 relative">
               {/* Volume Slider - Always visible but sleek */}
               <div className="flex items-center gap-2 group/volume">
                 <button 
                   onClick={() => setVolume(volume === 0 ? 1 : 0)}
                   className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                 >
                    {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                 </button>
                 <div className="w-20 h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden cursor-pointer relative group-hover/volume:h-1.5 transition-all">
                    <div 
                      className="absolute top-0 left-0 bottom-0 bg-gray-400 dark:bg-white/50 rounded-full"
                      style={{ width: `${volume * 100}%` }}
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
               
               <div className="h-4 w-px bg-white/10" />

               <button 
                 onClick={() => setIsExpanded(true)}
                 className="p-2 text-gray-400 hover:bg-white dark:hover:bg-white/10 rounded-full transition-all"
               >
                 <ChevronUp size={18} />
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
