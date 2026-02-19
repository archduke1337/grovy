"use client";

import React from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion } from "framer-motion";
import { Music, History, Play } from "lucide-react";
import Image from "next/image";
import { getHDThumbnail } from "@/app/lib/thumbnail";

export const QueueHistory: React.FC = () => {
  const { recentlyPlayed, songs, currentSongIndex, setQueue, colors } = usePlayer();

  // Filter out songs already in the current queue
  const currentIds = new Set(songs.map((s) => s.id));
  const currentSong = songs[currentSongIndex];
  const history = recentlyPlayed.filter(
    (s) => !currentIds.has(s.id) && s.id !== currentSong?.id
  ).slice(0, 8);

  if (history.length === 0) return null;

  return (
    <div className="space-y-3 pt-4 border-t border-white/5">
      <div className="flex items-center gap-2">
        <History size={14} style={{ color: colors.primary }} />
        <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">
          Previously Played
        </h4>
      </div>

      <div className="space-y-1">
        {history.map((song) => (
          <motion.button
            key={`history-${song.id}`}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setQueue([song, ...songs], 0)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group text-left"
          >
            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative bg-white/5">
              {song.cover ? (
                <Image
                  src={getHDThumbnail(song.cover) || ""}
                  alt={song.title}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music size={12} className="text-white/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play size={10} fill="white" className="text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white/50 group-hover:text-white/80 truncate transition-colors">
                {song.title}
              </p>
              <p className="text-[10px] text-white/25 truncate">{song.artist}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
