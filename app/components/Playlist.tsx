"use client";

import React from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion } from "framer-motion";
import { Music } from "lucide-react";

export const Playlist: React.FC = () => {
  const { songs, currentSongIndex, setCurrentSongIndex, isPlaying } =
    usePlayer();

  if (songs.length === 0) {
    return (
      <div className="text-center py-8">
        <Music size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400">No songs found</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 md:max-h-none md:h-full overflow-y-auto space-y-2 pr-1 custom-scrollbar">
      {songs.map((song, index) => (
        <motion.button
          key={song.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => setCurrentSongIndex(index)}
          className={`w-full px-4 py-3 rounded-lg text-left transition-all duration-200 ${
            index === currentSongIndex
              ? "bg-blue-500/20 dark:bg-blue-500/20 border-l-4 border-blue-500"
              : "hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-3">
            {index === currentSongIndex && isPlaying && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
            )}
            {index !== currentSongIndex && (
              <span className="text-sm text-gray-400 w-2 text-right">
                {index + 1}
              </span>
            )}
            <span
              className={`text-sm font-medium truncate ${
                index === currentSongIndex
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {song.title}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
};
