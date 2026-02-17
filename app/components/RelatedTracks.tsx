
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
    <div className="space-y-5">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2 px-1">
        <Sparkles size={12} style={{ color: colors.primary }} />
        Discovery
        <div className="flex-1 h-px bg-white/5" />
      </h3>

      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-6 -mx-1 px-1">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="min-w-[150px] animate-pulse">
              <div className="aspect-square bg-white/5 rounded-2xl mb-3" />
              <div className="h-3 bg-white/5 rounded w-3/4 mb-2" />
              <div className="h-2 bg-white/5 rounded w-1/2" />
            </div>
          ))
        ) : (
          related.map((song, i) => (
            <motion.button
              key={song.id}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setQueue([song, ...related.filter(s => s.id !== song.id)], 0)}
              className="min-w-[150px] text-left group relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden mb-3 relative bg-zinc-900 shadow-xl group-hover:shadow-2xl transition-all duration-500">
                <img src={song.cover} alt={song.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                   <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg"
                        style={{ boxShadow: `0 0 20px ${colors.primary}40` }}>
                      <Play size={20} fill="white" className="text-white ml-1" />
                   </div>
                </div>
              </div>
              
              <div className="px-1 space-y-0.5">
                <h4 className="text-sm font-bold text-gray-200 truncate tracking-tight group-hover:text-white transition-colors">{song.title}</h4>
                <p className="text-xs font-medium text-gray-500 truncate group-hover:text-[var(--player-primary)] transition-colors"
                   style={{ '--player-primary': colors.primary } as any}>
                  {song.artist}
                </p>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};
