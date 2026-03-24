"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Play, Radio as RadioIcon, Sparkles, Zap, Mic2, Music2 } from "lucide-react";
import Image from "next/image";
import { usePlayer } from "@/app/context/PlayerContext";
import { getHDThumbnail } from "@/app/lib/thumbnail";

export default function RadioPage() {
  const { recentlyPlayed, startRadio } = usePlayer();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-12 pb-40 space-y-20 sm:space-y-28"
    >
      <header className="relative space-y-4 pt-4 sm:pt-8">
        <div className="flex items-center gap-3 font-black uppercase text-[11px] sm:text-[12px] tracking-[0.25em] text-red-500">
          <RadioIcon size={16} />
          <span>Infinite Discovery</span>
        </div>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-gray-900 dark:text-white tracking-[-0.04em] leading-none">
          Radio<span className="text-red-500/20">.</span>
        </h1>
      </header>

      {/* Personalized Stations */}
      {recentlyPlayed.length > 0 && (
        <section className="space-y-12">
          <div className="flex items-end justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <Sparkles className="text-yellow-500" size={24} />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                  Made For You
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-400 dark:text-white/20 uppercase tracking-[0.15em]">
                Based on your recent listening
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentlyPlayed.slice(0, 9).map((song, i) => (
              <motion.div
                key={`radio-${song.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startRadio(song.id, { title: song.title, artist: song.artist })}
                className="relative aspect-[16/9] rounded-[2rem] overflow-hidden cursor-pointer group shadow-xl hover:shadow-2xl transition-all duration-500"
              >
                 {song.cover && (
                   <Image 
                     src={getHDThumbnail(song.cover) || ""} 
                     alt={song.title} 
                     fill 
                     className="object-cover blur-[2px] scale-110 opacity-50 group-hover:opacity-70 group-hover:scale-100 transition-all duration-1000" 
                   />
                 )}
                 <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-black/20" />
                 <div className="absolute inset-0 p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                       <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                          <RadioIcon size={24} className="text-white" />
                       </div>
                       <div className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                          <Play size={24} fill="currentColor" className="ml-1" />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black text-white leading-tight tracking-tight">{song.artist} Radio</h3>
                       <p className="text-sm text-white/50 font-bold uppercase tracking-widest">Station curated for you</p>
                    </div>
                 </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Global Stations */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
        <div className="relative group cursor-pointer overflow-hidden rounded-[3rem] h-64 sm:h-80 flex flex-col justify-end p-10 bg-gradient-to-br from-orange-500 to-red-600 shadow-2xl shadow-orange-500/20">
          <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:scale-110 transition-transform duration-700">
             <Zap size={160} />
          </div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">Hits Radio</h3>
            <p className="text-white/70 font-bold text-lg max-w-xs">The biggest songs in the world right now, 24/7.</p>
          </div>
        </div>
        <div className="relative group cursor-pointer overflow-hidden rounded-[3rem] h-64 sm:h-80 flex flex-col justify-end p-10 bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-500/20">
          <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:scale-110 transition-transform duration-700">
             <Mic2 size={160} />
          </div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">Chill Station</h3>
            <p className="text-white/70 font-bold text-lg max-w-xs">Relax with a curated selection of lo-fi and acoustic vibes.</p>
          </div>
        </div>
      </section>

      {/* Search for any artist to start radio */}
      <div className="max-w-3xl mx-auto py-20 text-center space-y-8">
         <div className="w-24 h-24 mx-auto rounded-[2.5rem] bg-gray-100 dark:bg-white/[0.03] flex items-center justify-center text-red-500 shadow-inner">
            <Music2 size={48} />
         </div>
         <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Create your own station.</h2>
            <p className="text-gray-400 dark:text-white/30 font-bold text-lg leading-relaxed">Search for any artist or song and start a radio station to discover an endless stream of similar music tailored to your taste.</p>
         </div>
         <button 
           onClick={() => window.location.href = "/"}
           className="px-10 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-[15px] hover:scale-105 active:scale-95 transition-all shadow-xl"
         >
           Take me Home
         </button>
      </div>
    </motion.div>
  );
}
