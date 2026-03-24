"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Music2, 
  Play, 
  TrendingUp, 
  BarChart3, 
  Sparkles, 
  Zap,
  ChevronRight,
  Disc,
  Mic2,
  Radio as RadioIcon
} from "lucide-react";
import Image from "next/image";
import { usePlayer } from "@/app/context/PlayerContext";
import { getHDThumbnail } from "@/app/lib/thumbnail";

const SectionHeader = ({ title, subtitle, onSeeAll, icon: Icon, iconColor }: any) => (
  <div className="flex items-end justify-between mb-8 px-1">
    <div className="space-y-1.5">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={24} className={iconColor} />}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="text-xs sm:text-sm font-bold text-gray-400 dark:text-white/20 uppercase tracking-[0.15em]">
          {subtitle}
        </p>
      )}
    </div>
    {onSeeAll && (
      <button 
        onClick={onSeeAll}
        className="group flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
      >
        See All
        <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
      </button>
    )}
  </div>
);

const BrowseCard = ({ item, onClick, priority }: any) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="group cursor-pointer space-y-3"
  >
    <div className="aspect-square relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-100 dark:bg-white/[0.03] shadow-lg group-hover:shadow-2xl transition-all duration-500">
      <Image 
        src={getHDThumbnail(item.cover) || ""} 
        alt={item.title} 
        fill 
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
        loading={priority ? "eager" : "lazy"}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500 flex items-center justify-center">
        <div className="w-12 h-12 bg-white/95 dark:bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl scale-90 group-hover:scale-100">
          <Play size={18} fill="currentColor" className="text-black dark:text-white ml-0.5" />
        </div>
      </div>
    </div>
    <div className="px-1 space-y-0.5">
      <h3 className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white truncate tracking-tight">{item.title}</h3>
      <p className="text-[12px] sm:text-[13px] text-gray-400 dark:text-white/30 font-semibold truncate">{item.artist}</p>
    </div>
  </motion.div>
);

const BrowseSkeleton = () => (
  <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 py-12 space-y-16 animate-pulse">
    <div className="space-y-4">
      <div className="h-4 w-32 bg-gray-200 dark:bg-white/[0.05] rounded-full" />
      <div className="h-16 w-64 bg-gray-200 dark:bg-white/[0.05] rounded-2xl" />
    </div>
    <div className="space-y-8">
      <div className="h-10 w-48 bg-gray-200 dark:bg-white/[0.05] rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square bg-gray-200 dark:bg-white/[0.05] rounded-3xl" />
            <div className="h-4 w-3/4 bg-gray-100 dark:bg-white/[0.03] rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function BrowsePage() {
  const { loadSongs, setQueue } = usePlayer();
  const [trending, setTrending] = useState<any[]>([]);
  const [charts, setCharts] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [t, c, n] = await Promise.all([
          loadSongs("trending", "youtube&country=IN"),
          loadSongs("charts", "youtube&country=IN"),
          loadSongs("new releases", "youtube&country=IN")
        ]);
        setTrending(t.slice(0, 12));
        setCharts(c.slice(0, 12));
        setNewReleases(n.slice(0, 12));
      } catch (e) {}
      setIsLoading(false);
    })();
  }, [loadSongs]);

  if (isLoading) return <BrowseSkeleton />;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-[1400px] mx-auto px-6 md:px-10 pt-12 pb-40 space-y-20 sm:space-y-28"
    >
      <header className="relative space-y-4 pt-4 sm:pt-8">
        <div className="flex items-center gap-3 font-black uppercase text-[11px] sm:text-[12px] tracking-[0.25em] text-blue-500">
          <Zap size={16} fill="currentColor" />
          <span>New Explorations</span>
        </div>
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-gray-900 dark:text-white tracking-[-0.04em] leading-none">
          Browse<span className="text-blue-500/20">.</span>
        </h1>
      </header>

      {/* Featured Grid */}
      <section className="space-y-10">
        <SectionHeader 
          title="Hot Tracks" 
          subtitle="Trending worldwide" 
          icon={TrendingUp} 
          iconColor="text-orange-500"
          onSeeAll={() => {}}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8">
          {trending.map((song, i) => (
            <BrowseCard key={song.id} item={song} onClick={() => setQueue(trending, i)} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* New Releases Row */}
      <section className="space-y-10">
        <SectionHeader 
          title="New Releases" 
          subtitle="Fresh off the press" 
          icon={Sparkles} 
          iconColor="text-yellow-500"
          onSeeAll={() => {}}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8">
          {newReleases.map((song, i) => (
            <BrowseCard key={song.id} item={song} onClick={() => setQueue(newReleases, i)} />
          ))}
        </div>
      </section>

      {/* Top Charts Section */}
      <section className="space-y-10">
        <SectionHeader 
          title="Global Charts" 
          subtitle="The most played music" 
          icon={BarChart3} 
          iconColor="text-blue-500"
          onSeeAll={() => {}}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-4">
          {charts.map((song, i) => (
            <motion.div 
              key={song.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setQueue(charts, i)}
              className="group flex items-center gap-5 p-3 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all cursor-pointer relative"
            >
              <span className="text-lg font-black text-gray-300 dark:text-white/10 w-6 text-center tabular-nums group-hover:text-blue-500 transition-colors">{i + 1}</span>
              <div className="w-14 h-14 relative rounded-xl overflow-hidden shrink-0 shadow-md group-hover:shadow-xl transition-all duration-500 group-hover:scale-105">
                {song.cover && <Image src={song.cover} alt={song.title} fill className="object-cover" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play size={16} fill="currentColor" className="text-white ml-0.5" />
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <h4 className="font-bold text-[15px] text-gray-900 dark:text-white truncate tracking-tight">{song.title}</h4>
                <p className="text-xs text-gray-400 dark:text-white/30 truncate font-bold uppercase tracking-wider">{song.artist}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories Banner */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10">
        <div className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] aspect-[21/9] sm:aspect-auto sm:h-64 flex flex-col justify-center p-10 bg-gradient-to-br from-purple-600 to-indigo-700 shadow-2xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
             <Mic2 size={120} />
          </div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-3xl font-black text-white tracking-tight">Artist Stations</h3>
            <p className="text-white/70 font-bold max-w-xs">Curated radio stations based on your favorite artists.</p>
          </div>
        </div>
        <div className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] aspect-[21/9] sm:aspect-auto sm:h-64 flex flex-col justify-center p-10 bg-gradient-to-br from-rose-500 to-pink-600 shadow-2xl shadow-rose-500/20">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
             <RadioIcon size={120} />
          </div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-3xl font-black text-white tracking-tight">Live Radio</h3>
            <p className="text-white/70 font-bold max-w-xs">Listen to live streams and worldwide broadcasts.</p>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
