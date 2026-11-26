"use client";

import NextImage from "next/image";
import { motion } from "framer-motion";
import { Heart, Music, Play } from "lucide-react";

import { getHDThumbnail } from "@/app/lib/thumbnail";
import type { Song } from "@/app/types/song";

/**
 * Artwork card for a track.
 *
 * Deliberately *not* a clickable div: one real `<button>` covers the artwork and
 * carries the accessible name, and the favourite control is a sibling button.
 * Nested interactive elements are invalid HTML, and a div with `role="button"`
 * inside one is unreachable by keyboard on most screen readers.
 */
export function TrackCard({
  song,
  onPlay,
  onFavorite,
  isFav,
}: {
  song: Song;
  onPlay: () => void;
  onFavorite: (song: Song) => void;
  isFav: boolean;
}) {
  const coverSrc = song.cover ? getHDThumbnail(song.cover) || song.cover : null;

  return (
    <motion.div whileHover={{ y: -4 }} className="group relative">
      <div className="aspect-square relative rounded-2xl overflow-hidden mb-3 bg-linear-to-br from-slate-300 to-slate-400 dark:from-white/8 dark:to-white/2 shadow-md group-hover:shadow-2xl transition-shadow duration-300">
        {coverSrc ? (
          <NextImage
            src={coverSrc}
            alt=""
            width={210}
            height={210}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, (max-width: 1280px) 18vw, 210px"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-sky-400/25 to-emerald-400/25 dark:from-sky-500/15 dark:to-emerald-500/15">
            <Music size={40} className="text-white/30" aria-hidden="true" />
          </div>
        )}

        <button
          type="button"
          onClick={onPlay}
          aria-label={`Play ${song.title}${song.artist ? ` by ${song.artist}` : ""}`}
          className="absolute inset-0 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
        >
          <span
            className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300"
            aria-hidden="true"
          />
          <span
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-hidden="true"
          >
            <span className="w-14 h-14 bg-sky-500 group-hover:bg-sky-600 rounded-full flex items-center justify-center shadow-2xl transition-colors">
              <Play size={22} fill="white" className="text-white ml-0.5" />
            </span>
          </span>
        </button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onFavorite(song)}
          aria-label={isFav ? `Remove ${song.title} from favorites` : `Add ${song.title} to favorites`}
          aria-pressed={isFav}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/40 hover:bg-sky-500 transition-colors transition-opacity backdrop-blur-sm z-10 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          title={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={18}
            fill={isFav ? "currentColor" : "none"}
            className={isFav ? "text-sky-400" : "text-white"}
            aria-hidden="true"
          />
        </motion.button>
      </div>

      <div className="space-y-1.5">
        <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm sm:text-base leading-snug">
          {song.title}
        </h4>
        <p className="text-gray-500 dark:text-white/50 text-xs sm:text-sm font-medium truncate">
          {song.artist}
        </p>
      </div>
    </motion.div>
  );
}
