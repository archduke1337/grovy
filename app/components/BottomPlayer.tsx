"use client";

import React, { useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ChevronUp, Music, Minimize2 } from "lucide-react";
import { MusicPlayer } from "./MusicPlayer";
import MiniPlayer from "./MiniPlayer";
import NextImage from "next/image";

export const BottomPlayer = () => {
  const { currentSongIndex, songs, isPlaying, togglePlayPause, nextTrack, previousTrack, duration, currentTime, seek } = usePlayer();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);

  if (!songs || songs.length === 0) return null;

  const currentSong = songs[currentSongIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Integrated Player Bar (Desktop/LG) */}
      {!isMiniMode && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 lg:left-64 right-0 z-[50] bg-white/80 dark:bg-[#121212]/90 backdrop-blur-2xl border-t border-black/[0.05] dark:border-white/[0.05] hidden lg:block"
        >
          <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-8">
            {/* Song Info */}
            <div className="flex items-center gap-4 w-1/4 min-w-0 group cursor-pointer" onClick={() => setIsExpanded(true)}>
              <div className="w-14 h-14 rounded-lg overflow-hidden shadow-lg border border-black/5 dark:border-white/5 relative shrink-0">
                {currentSong?.cover ? (
                  <NextImage src={currentSong.cover} alt={currentSong.title} width={56} height={56} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/10">
                    <Music size={20} className="text-gray-400 dark:text-white/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ChevronUp size={20} className="text-white" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="font-bold text-[14px] text-gray-900 dark:text-white truncate">
                  {currentSong?.title}
                </h4>
                <p className="text-[12px] text-gray-500 dark:text-white/40 truncate font-medium">
                  {currentSong?.artist}
                </p>
              </div>
            </div>

            {/* Controls & Progress */}
            <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
              <div className="flex items-center gap-6">
                <button onClick={previousTrack} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <SkipBack size={20} fill="currentColor" strokeWidth={0} />
                </button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlayPause}
                  className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md hover:brightness-110"
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                </motion.button>
                <button onClick={nextTrack} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <SkipForward size={20} fill="currentColor" strokeWidth={0} />
                </button>
              </div>

              <div className="w-full flex items-center gap-3">
                <span className="text-[10px] tabular-nums text-gray-400 font-medium w-8 text-right">
                  {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                </span>
                <div 
                  className="flex-1 h-1 bg-black/[0.05] dark:bg-white/10 rounded-full cursor-pointer group relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    seek(((e.clientX - rect.left) / rect.width) * duration);
                  }}
                >
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 left-0 h-full bg-pink-500 dark:bg-pink-400 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-black/10 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `${progress}%`, marginLeft: '-6px' }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-gray-400 font-medium w-8">
                  {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Extra Controls */}
            <div className="flex items-center gap-4 w-1/4 justify-end">
              <button
                onClick={() => setIsMiniMode(true)}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
                title="Mini player"
              >
                <Minimize2 size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Floating Pill Player (Mobile/Tablet) */}
      {!isMiniMode && (
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 left-4 right-4 z-50 lg:hidden"
      >
        <div 
          className="rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 relative backdrop-blur-3xl bg-black/70"
        >
          {/* Progress Line - with generous touch target on mobile */}
          <div className="absolute top-0 left-0 right-0 z-20">
            <div className="relative -top-3 pt-3 pb-1 cursor-pointer group/progress"
                 onClick={(e) => {
                   const bar = e.currentTarget.querySelector("[data-progress-bar]") as HTMLElement;
                   if (!bar) return;
                   const rect = bar.getBoundingClientRect();
                   const x = e.clientX - rect.left;
                   if (rect.width > 0) {
                     seek((x / rect.width) * duration);
                   }
                 }}>
              <div data-progress-bar className="h-[2px] bg-white/10 group-hover/progress:h-1 group-active/progress:h-1 transition-all">
                <div 
                  className="h-full relative rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-[width] duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="px-2.5 sm:px-3 md:px-5 py-2 sm:py-2.5 md:py-3 flex items-center justify-between gap-2.5 sm:gap-3 md:gap-4 relative z-20">
            
            {/* Song Info */}
            <div 
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
              onClick={() => setIsExpanded(true)}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full overflow-hidden relative shadow-lg border border-white/10 shrink-0">
                <AnimatePresence mode="wait">
                {currentSong?.cover ? (
                  <motion.div
                    key={currentSong.cover}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <NextImage src={currentSong.cover} alt={currentSong.title} width={48} height={48} className="w-full h-full object-cover animate-[spin_8s_linear_infinite]" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                  </motion.div>
                ) : (
                  <motion.div key="no-cover" className="w-full h-full flex items-center justify-center bg-white/10">
                    <Music size={18} className="text-white" />
                  </motion.div>
                )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <ChevronUp size={18} className="text-white" />
                </div>
              </div>
              
              <div className="flex flex-col min-w-0 justify-center">
                <h4 className="font-bold text-white truncate text-[12px] sm:text-[13px] md:text-sm tracking-wide">
                  {currentSong?.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-white/40 truncate font-medium">
                  {currentSong?.artist}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 z-20">
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
                className="p-2 sm:p-2.5 md:p-3 rounded-full bg-white text-black shadow-lg flex items-center justify-center shrink-0 hover:brightness-110 transition-all"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </motion.button>

              <button 
                onClick={(e) => { e.stopPropagation(); nextTrack(); }}
                className="p-1.5 sm:p-2 text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95"
              >
                <SkipForward size={20} fill="currentColor" strokeWidth={0} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsMiniMode(true); }}
                className="p-1.5 text-white/30 hover:text-white transition-all hidden md:block"
                aria-label="Mini player"
                title="Mini player"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      )}
      <MiniPlayer visible={isMiniMode} onExpand={() => setIsMiniMode(false)} />

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
