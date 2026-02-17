"use client";

import React, { useEffect } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { PlayerControls } from "./PlayerControls";
import { Playlist } from "./Playlist";
import { motion } from "framer-motion";
import { Music, Heart, Sparkles, Share2, Zap } from "lucide-react";
import { LyricsView } from "./LyricsView";
import { RelatedTracks } from "./RelatedTracks";
import { ArtistInfo } from "./ArtistInfo";
import { AmbientBackground } from "./AmbientBackground";
import { useState } from "react";

const formatTime = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const MusicPlayer: React.FC = () => {
  const {
    songs,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    seek,
    loadSongs,
    toggleFavorite,
    isFavorite,
    startRadio,
    colors
  } = usePlayer();

  const [isLyricsOpen, setIsLyricsOpen] = useState(false);



  const currentSong = songs[currentSongIndex];
  const favorite = currentSong ? isFavorite(currentSong.id) : false;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-bg dark:bg-bg-dark">
      
      {/* 1. Immersive Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black">
         {/* Base Dark Overlay */}
         <div className="absolute inset-0 bg-black/40 z-[1]" />
         
         {/* Dynamic Color Blobs */}
         <AmbientBackground className="absolute" />

         {currentSong?.cover && (
           <motion.div 
             key={currentSong.cover}
             initial={{ opacity: 0, scale: 1.1 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1.5 }}
             className="absolute inset-0 blur-[80px] scale-110 opacity-40 mix-blend-overlay"
             style={{ 
               backgroundImage: `url(${currentSong.cover})`, 
               backgroundPosition: "center", 
               backgroundSize: "cover" 
             }}
           />
         )}
         
         {/* Vignette & Gradient */}
         <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 z-[2]" />
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-[2]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        style={{ willChange: "transform, opacity" }}
        className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-8 lg:gap-24 z-10 px-4 py-8 lg:px-6 lg:py-12 relative"
      >
        {/* Left: Cinematic Art */}
        <div className="w-full lg:w-1/2 flex flex-col items-center gap-8 lg:gap-12">
           <motion.div
            layoutId={`art-${currentSongIndex}`}
            style={{ willChange: "transform" }}
            className="w-64 h-64 md:w-[500px] md:h-[500px] relative group"
           >
              {/* Art Glow */}
              <motion.div 
                animate={{ boxShadow: isPlaying ? `0 0 100px -20px ${colors.primary}50` : 'none' }}
                className="absolute inset-8 bg-black/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" 
              />
              
              <div className="relative w-full h-full rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] border border-white/10 isolate">
                 {currentSong?.cover ? (
                   <motion.img
                     key={currentSong.cover}
                     src={currentSong.cover}
                     alt={currentSong?.title}
                     className="w-full h-full object-cover"
                     initial={{ scale: 1.1, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     transition={{ duration: 0.8 }}
                   />
                 ) : (
                   <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                     <Music className="w-20 h-20 md:w-32 md:h-32 text-gray-400/20" />
                   </div>
                 )}
              </div>
           </motion.div>
        </div>

        {/* Right: Controls & Info */}
        <div className="w-full lg:w-1/2 space-y-8 lg:space-y-12">
           <div className="space-y-6 lg:space-y-8">
              <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 text-center lg:text-left">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: colors.primary }}>
                    <Sparkles size={12} />
                    <span>Now Playing</span>
                  </div>
                  <motion.h2 
                    key={currentSong?.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter truncate leading-tight px-4 lg:px-0"
                  >
                    {currentSong?.title || "Grovy Music"}
                  </motion.h2>
                  <motion.p 
                    key={currentSong?.artist}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg md:text-2xl text-gray-500 font-bold tracking-tight"
                  >
                    {currentSong?.artist || "Start the vibe"}
                  </motion.p>
                </div>
                
                <div className="flex flex-row lg:flex-col items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => currentSong && toggleFavorite(currentSong.id)}
                    className={`p-4 lg:p-5 rounded-full shadow-lg transition-all ${favorite ? "text-red-500 bg-red-50 dark:bg-red-500/10" : "text-gray-400 bg-white/5 dark:bg-white/5 hover:text-white"}`}
                  >
                    <Heart size={24} className="lg:w-7 lg:h-7" fill={favorite ? "currentColor" : "none"} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => currentSong && startRadio(currentSong.id)}
                    title="Start Radio"
                    className="p-4 lg:p-5 rounded-full shadow-lg transition-all text-gray-400 bg-white/5 dark:bg-white/5 hover:text-amber-500 hover:bg-amber-500/10"
                  >
                    <Zap size={20} className="lg:w-6 lg:h-6" />
                  </motion.button>

                   <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (navigator.share && currentSong) {
                        navigator.share({
                          title: currentSong.title,
                          text: `Check out this track: ${currentSong.title} by ${currentSong.artist} on Grovy!`,
                          url: window.location.href,
                        }).catch(() => {});
                      }
                    }}
                    className="p-4 lg:p-5 rounded-full shadow-lg transition-all text-gray-400 bg-white/5 dark:bg-white/5 hover:text-[var(--player-primary)] hover:bg-[var(--player-primary)]/10"
                  >
                    <Share2 size={20} className="lg:w-6 lg:h-6" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsLyricsOpen(true)}
                    title="Lyrics"
                    className="p-4 lg:p-5 rounded-full shadow-lg transition-all text-gray-400 bg-white/5 dark:bg-white/5 hover:text-green-500 hover:bg-green-500/10"
                  >
                    <Music size={20} className="lg:w-6 lg:h-6" />
                  </motion.button>
                  
                  <ArtistInfo />
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-4">
                <div className="relative h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden group cursor-pointer">
                  <motion.div 
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                      background: `linear-gradient(to right, var(--player-primary), var(--player-secondary))`,
                      transition: "width 0.1s linear, background 2s ease"
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-xs font-black text-gray-400 tracking-widest uppercase">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <PlayerControls />
           </div>

           {/* Playlist Integration */}
           <div className="space-y-6 pt-12 border-t border-white/5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                Up Next <div className="flex-1 h-px bg-white/5" />
              </h3>
               <div className="max-h-[220px] overflow-y-auto custom-scrollbar pr-4">
                 <Playlist />
              </div>
           </div>

           {/* Related / Discovery Section */}
           <div className="pt-12">
              <RelatedTracks />
           </div>
        </div>
      </motion.div>

      <LyricsView isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
    </div>
  );
};
