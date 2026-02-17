
"use client";

import React, { useEffect, useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import { Song } from "@/app/types/song";

export const RelatedTracks: React.FC = () => {
  const { currentSongIndex, songs, setQueue, loadRelated, colors } = usePlayer();
  const [related, setRelated] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentSong = songs[currentSongIndex];
    if (!currentSong) return;

    const fetchRelated = async () => {
      setIsLoading(true);
      const tracks = await loadRelated(currentSong.id);
      setRelated(tracks.slice(0, 7));
      setIsLoading(false);
    };

    fetchRelated();
  }, [currentSongIndex, songs, loadRelated]);

  if (related.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
        <Sparkles size={12} style={{ color: colors.primary }} />
        Discovery
        <div className="flex-1 h-px bg-white/5" />
      </h3>

      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 -mx-1 px-1">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[140px] animate-pulse">
              <div className="aspect-square bg-white/5 rounded-2xl mb-2" />
              <div className="h-3 bg-white/5 rounded w-3/4 mb-1" />
              <div className="h-2 bg-white/5 rounded w-1/2" />
            </div>
          ))
        ) : (
          related.map((song, i) => (
            <motion.button
              key={song.id}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setQueue([song, ...related.filter(s => s.id !== song.id)], 0)}
              className="min-w-[140px] text-left group"
            >
              <div className="aspect-square rounded-2xl overflow-hidden mb-3 relative bg-white/5 shadow-2xl">
                <img src={song.cover} alt={song.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <div className="p-3 rounded-full bg-white/20 backdrop-blur-md">
                      <Play size={16} fill="white" className="text-white" />
                   </div>
                </div>
              </div>
              <h4 className="text-xs font-black text-gray-900 dark:text-white truncate tracking-tight">{song.title}</h4>
              <p className="text-[10px] font-bold text-gray-500 truncate">{song.artist}</p>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};
