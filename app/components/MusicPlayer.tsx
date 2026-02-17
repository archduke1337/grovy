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
        {/* Center: Cinematic Art & Main Controls */}
        <div className="w-full lg:w-5/12 flex flex-col items-center justify-center gap-12">
           <motion.div
            layoutId={`art-${currentSongIndex}`}
            style={{ willChange: "transform" }}
            className="w-72 h-72 md:w-96 md:h-96 lg:w-[450px] lg:h-[450px] relative group perspective-[1000px]"
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
              
              {/* Main Artwork Container - Super Rounded */}
              <motion.div 
                whileHover={{ scale: 1.02, rotateX: 5, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative w-full h-full rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border border-white/10 bg-[#1a1a1a]"
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
                     <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-40 pointer-events-none" />
                   </>
                 ) : (
                   <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                     <Music className="w-32 h-32 text-white/5" />
                   </div>
                 )}
              </motion.div>
           </motion.div>

           {/* Song Info & Progress */}
           <div className="w-full max-w-lg space-y-8 text-center">
              <div className="space-y-3">
                 <motion.h2 
                    key={currentSong?.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-black text-white tracking-tighter truncate leading-[1.1]"
                  >
                    {currentSong?.title || "Choose a Vibe"}
                  </motion.h2>
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }} 
                    className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm"
                  >
                    <p 
                      className="text-lg md:text-xl font-bold tracking-wide"
                      style={{ color: colors.primary }}
                    >
                      {currentSong?.artist || "Grovy Music"}
                    </p>
                  </motion.div>
              </div>

              {/* Progress Bar - Soft & Organic */}
              <div className="space-y-2 group/progress px-4">
                <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden cursor-pointer transition-all duration-300 group-hover/progress:h-4 group-hover/progress:bg-white/15">
                  <div className="absolute inset-0 opacity-0 group-hover/progress:opacity-20 transition-opacity bg-white/20" />
                  <motion.div 
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                      background: `linear-gradient(90deg, var(--player-primary), var(--player-secondary))`,
                      boxShadow: `0 0 20px -2px var(--player-primary)`
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
                <div className="flex justify-between text-xs font-bold text-gray-400 tracking-wider px-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                 <PlayerControls />
              </div>

              <div className="flex items-center justify-center gap-6 pt-4">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => currentSong && toggleFavorite(currentSong.id)} 
                    className={`p-4 rounded-full transition-all duration-300 ${favorite ? "bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}
                  >
                    <Heart size={22} fill={favorite ? "currentColor" : "none"} />
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsLyricsOpen(true)} 
                    className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                     <Music size={22} />
                  </motion.button>
                  
                  <div className="scale-110">
                    <ArtistInfo />
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => currentSong && openPlaylistModal(currentSong)} 
                    className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                     <ListPlus size={22} />
                  </motion.button>
              </div>
           </div>
        </div>

        {/* Right: Playlist & Discovery (Visible!) - Organic Glass Container */}
        <div 
          className="w-full lg:w-5/12 h-[600px] lg:h-[700px] flex flex-col gap-6 rounded-[3rem] p-8 backdrop-blur-3xl transition-colors duration-1000"
          style={{ 
            background: `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
            border: `1px solid rgba(255,255,255,0.05)`,
            boxShadow: `inset 0 0 50px rgba(0,0,0,0.2)`
          }}
        >
           {/* Dynamic Top Border Accent */}
           <div className="h-1 w-20 rounded-full mx-auto opacity-30" style={{ background: colors.primary }} />

           {/* Tab-like generic header */}
           <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/80 flex items-center gap-2">
                <ListPlus size={16} style={{ color: colors.primary }} />
                Up Next
              </h3>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-bold text-gray-400">
                {songs.length} Tracks
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
              <Playlist />
           </div>

           <div className="pt-6 border-t border-white/5">
              <RelatedTracks />
           </div>
        </div>
      </motion.div>

      <LyricsView isOpen={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
    </div>
  );
};
