"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Play, Radio as RadioIcon, Sparkles } from "lucide-react";
import Image from "next/image";
import { usePlayer } from "@/app/context/PlayerContext";

export default function RadioPage() {
  const { recentlyPlayed, startRadio } = usePlayer();

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-12 pb-32 space-y-16">
      <header className="space-y-4">
         <div className="flex items-center gap-2 font-bold uppercase text-[11px] tracking-[0.2em] text-red-500">
           <RadioIcon size={14} />
           <span>Live & Personalized</span>
         </div>
         <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-[-0.03em]">
           Radio<span className="text-red-500/20">.</span>
         </h1>
      </header>

      {/* Personalized Stations */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="text-yellow-500" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Based on Your History</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentlyPlayed.slice(0, 6).map((song) => (
            <motion.div
              key={`radio-${song.id}`}
              whileHover={{ scale: 1.02 }}
              onClick={() => startRadio(song.id, { title: song.title, artist: song.artist })}
              className="relative aspect-[2/1] rounded-3xl overflow-hidden cursor-pointer group apple-shadow"
            >
               {song.cover && <Image src={song.cover} alt={song.title} fill className="object-cover blur-sm opacity-40 transition-transform duration-700 group-hover:scale-110" />}
               <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/20" />
               <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                     <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                        <RadioIcon size={20} className="text-white" />
                     </div>
                     <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={24} fill="currentColor" className="text-white ml-1" />
                     </div>
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-white leading-tight">{song.artist} Radio</h3>
                     <p className="text-sm text-white/60 font-medium">Personalized station</p>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Search for any artist to start radio */}
      <div className="max-w-2xl mx-auto py-10 text-center space-y-6">
         <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-100 dark:bg-white/[0.03] flex items-center justify-center text-red-500">
            <Search size={40} />
         </div>
         <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Start a Station</h2>
            <p className="text-gray-500 dark:text-white/40">Search for any artist or song on the Home page and select "Start Radio" to discover similar music.</p>
         </div>
      </div>
    </div>
  );
}
