
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
    <div className="space-y-6">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2 px-1">
        <Sparkles size={14} style={{ color: colors.primary }} />
        For You
      </h3>

      <div className="flex gap-5 overflow-x-auto custom-scrollbar pb-8 -mx-2 px-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="min-w-[160px] animate-pulse">
              <div className="aspect-square bg-white/5 rounded-3xl mb-3" />
              <div className="h-4 bg-white/5 rounded-full w-3/4 mb-2" />
              <div className="h-3 bg-white/5 rounded-full w-1/2" />
            </div>
          ))
        ) : (
          related.map((song, i) => (
            <motion.button
              key={song.id}
              whileHover={{ y: -12 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setQueue([song, ...related.filter(s => s.id !== song.id)], 0)}
              className="min-w-[160px] text-left group relative"
            >
              <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 relative bg-zinc-900 shadow-xl group-hover:shadow-2xl transition-all duration-500 border border-white/5">
                <img src={song.cover} alt={song.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                
                {/* Overlay Gradient */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                  style={{ background: `linear-gradient(to top, ${colors.primary}80, transparent)` }}
                />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                   <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                      <Play size={24} fill="white" className="text-white ml-1" />
                   </div>
                </div>
              </div>
              
              <div className="px-1 space-y-1">
                <h4 className="text-base font-bold text-gray-200 truncate tracking-tight group-hover:text-white transition-colors">{song.title}</h4>
                <p className="text-xs font-medium text-white/50 truncate group-hover:text-white/80 transition-colors">
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
