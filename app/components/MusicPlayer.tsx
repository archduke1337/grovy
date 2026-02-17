"use client";

import React, { useEffect } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { PlayerControls } from "./PlayerControls";
import { Playlist } from "./Playlist";
import { motion } from "framer-motion";
import { Music, Heart, Sparkles, Share2, Zap, ListPlus } from "lucide-react";
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
    colors,
    openPlaylistModal
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
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ willChange: "transform, opacity" }}
        className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-12 lg:gap-32 z-10 px-6 py-12 lg:px-12 relative"
      >
        {/* Left: Cinematic Art */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
           <motion.div
            layoutId={`art-${currentSongIndex}`}
            style={{ willChange: "transform" }}
            className="w-72 h-72 md:w-[450px] md:h-[450px] lg:w-[550px] lg:h-[550px] relative group perspective-[1000px]"
           >
              {/* Dynamic Glow Layers */}
              <motion.div 
                animate={{ 
                  opacity: isPlaying ? 0.6 : 0.3,
                  scale: isPlaying ? 1.1 : 1
                }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
                className="absolute inset-0 bg-gradient-to-tr from-[var(--player-primary)] to-[var(--player-secondary)] blur-[80px] rounded-full opacity-40" 
              />
              <motion.div 
                animate={{ 
                   opacity: isPlaying ? 0.4 : 0.2,
                   rotate: isPlaying ? 10 : 0
                }}
                transition={{ duration: 7, repeat: Infinity, repeatType: "mirror" }}
                className="absolute -inset-10 bg-[var(--player-secondary)] blur-[120px] rounded-full opacity-30 mix-blend-screen" 
              />
              
              {/* Main Artwork Container */}
              <motion.div 
                whileHover={{ scale: 1.02, rotateX: 5, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative w-full h-full rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5)] border border-white/10 bg-[#1a1a1a]"
              >
                 {currentSong?.cover ? (
                   <>
                     <motion.img
                       key={currentSong.cover}
                       src={currentSong.cover}
                       alt={currentSong?.title}
                       className="w-full h-full object-cover"
                       initial={{ scale: 1.1, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       transition={{ duration: 0.8 }}
                     />
                     {/* Glass Reflection */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
                   </>
                 ) : (
                   <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                     <Music className="w-32 h-32 text-white/5" />
                   </div>
                 )}
              </motion.div>
           </motion.div>
        </div>

        {/* Right: Controls & Info */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center space-y-10 lg:space-y-14">
           <div className="space-y-8">
              <div className="flex flex-col lg:flex-row items-end justify-between gap-8">
                <div className="space-y-3 flex-1 min-w-0 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-md mx-auto lg:mx-0">
                    <Sparkles size={12} style={{ color: colors.primary }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Now Vibrating</span>
                  </div>
                  
                  <div className="space-y-1">
                    <motion.h2 
                      key={currentSong?.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter truncate leading-[0.9]"
                    >
                      {currentSong?.title || "Choose a Vibe"}
                    </motion.h2>
                    <motion.p 
                      key={currentSong?.artist}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-xl md:text-2xl font-medium tracking-tight opacity-60 mix-blend-plus-lighter"
                      style={{ color: colors.primary }}
                    >
                      {currentSong?.artist || "Grovy Music"}
                    </motion.p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => currentSong && toggleFavorite(currentSong.id)}
                    className={`p-4 rounded-2xl border transition-all ${favorite ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/5 text-gray-400 hover:text-white"}`}
                  >
                    <Heart size={24} fill={favorite ? "currentColor" : "none"} />
                  </motion.button>
                  
                  <div className="flex bg-white/5 border border-white/5 rounded-2xl p-1">
                     <motion.button onClick={() => setIsLyricsOpen(true)} className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"><Music size={20} /></motion.button>
                     <motion.button onClick={() => currentSong && openPlaylistModal(currentSong)} className="p-3 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"><ListPlus size={20} /></motion.button>
                     <ArtistInfo />
                  </div>
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="space-y-3 group/progress">
                <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer transition-all duration-300 group-hover/progress:h-4">
                  <div 
                    className="absolute inset-0 opacity-0 group-hover/progress:opacity-20 transition-opacity bg-white/20" 
                  />
                  <motion.div 
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                      background: `linear-gradient(90deg, var(--player-primary), var(--player-secondary))`,
                      boxShadow: `0 0 20px -5px var(--player-primary)`
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
                <div className="flex justify-between text-xs font-bold text-gray-500 tracking-wider">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="pt-2">
                 <PlayerControls />
              </div>
           </div>

           {/* Footer Areas */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
              <div>
                 <RelatedTracks />
              </div>
              <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Up Next</h3>
                 <div className="max-h-[160px] overflow-y-auto custom-scrollbar -mr-2 pr-2">
                   <Playlist />
                 </div>
              </div>
           </div>
        </div>
      </motion.div>

      <LyricsView isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
    </div>
  );
};
