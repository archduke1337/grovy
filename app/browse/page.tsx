"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Music2, Play, TrendingUp, BarChart3 } from "lucide-react";
import Image from "next/image";
import { usePlayer } from "@/app/context/PlayerContext";

export default function BrowsePage() {
  const { loadSongs, setQueue } = usePlayer();
  const [trending, setTrending] = useState<any[]>([]);
  const [charts, setCharts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [t, c] = await Promise.all([
          loadSongs("trending", "youtube&country=IN"),
          loadSongs("charts", "youtube&country=IN")
        ]);
        setTrending(t.slice(0, 12));
        setCharts(c.slice(0, 12));
      } catch (e) {}
      setIsLoading(false);
    })();
  }, [loadSongs]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-12 pb-32 space-y-16">
      <header className="space-y-4">
         <div className="flex items-center gap-2 font-bold uppercase text-[11px] tracking-[0.2em] text-purple-500">
           <Music2 size={14} />
           <span>Discover</span>
         </div>
         <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-[-0.03em]">
           Browse<span className="text-purple-500/20">.</span>
         </h1>
      </header>

      {/* Trending Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-orange-500" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Now</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {isLoading ? [...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-square bg-gray-200 dark:bg-white/5 rounded-2xl" />
              <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/2" />
            </div>
          )) : trending.map((song, i) => (
            <motion.div
              key={song.id}
              whileHover={{ y: -5 }}
              onClick={() => setQueue(trending, i)}
              className="group cursor-pointer"
            >
              <div className="aspect-square relative rounded-2xl overflow-hidden mb-3 bg-gray-100 dark:bg-white/[0.03] apple-shadow">
                {song.cover && <Image src={song.cover} alt={song.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                   <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <Play size={18} fill="currentColor" className="text-black dark:text-white ml-1" />
                   </div>
                </div>
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{song.title}</h3>
              <p className="text-xs text-gray-500 dark:text-white/40 truncate font-medium">{song.artist}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Charts Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-blue-500" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top Charts</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-2">
          {isLoading ? [...Array(9)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-2 animate-pulse">
               <div className="w-12 h-12 bg-gray-200 dark:bg-white/5 rounded-lg" />
               <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/2" />
               </div>
            </div>
          )) : charts.map((song, i) => (
            <div 
              key={song.id}
              onClick={() => setQueue(charts, i)}
              className="flex items-center gap-4 p-2 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors cursor-pointer group"
            >
               <span className="text-sm font-bold text-gray-400 w-4 text-center">{i + 1}</span>
               <div className="w-12 h-12 relative rounded-lg overflow-hidden shrink-0 border border-black/5 dark:border-white/5">
                  {song.cover && <Image src={song.cover} alt={song.title} fill className="object-cover" />}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={14} fill="currentColor" className="text-white" />
                  </div>
               </div>
               <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{song.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-white/40 truncate font-medium">{song.artist}</p>
               </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
