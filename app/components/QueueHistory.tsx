"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { History, Music, Play } from "lucide-react";
import { Button } from "@heroui/react";

import { usePlayer } from "@/app/context/PlayerContext";
import { getHDThumbnail } from "@/app/lib/thumbnail";

/**
 * Tracks played earlier that are not already in the queue.
 *
 * Rows are real buttons (not divs) so they are reachable by keyboard, and the
 * cover hides the play affordance from assistive tech since the label already
 * says what happens.
 */
export const QueueHistory: React.FC = () => {
  const { recentlyPlayed, songs, currentSongIndex, setQueue, colors } = usePlayer();

  const currentIds = useMemo(() => new Set(songs.map((song) => song.id)), [songs]);
  const currentSong = songs[currentSongIndex];

  const history = recentlyPlayed
    .filter((song) => !currentIds.has(song.id) && song.id !== currentSong?.id)
    .slice(0, 8);

  if (history.length === 0) return null;

  return (
    <section className="space-y-3 border-t border-white/5 pt-4">
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
        <History size={14} style={{ color: colors.primary }} aria-hidden="true" />
        Previously played
      </h4>

      <div className="space-y-1">
        {history.map((song) => (
          <Button
            key={`history-${song.id}`}
            variant="ghost"
            fullWidth
            onPress={() => setQueue([song, ...songs], 0)}
            aria-label={`Play ${song.title} by ${song.artist || "unknown artist"}`}
            className="group h-auto justify-start gap-3 rounded-xl p-2 text-left font-normal text-white/70 hover:bg-white/5 hover:text-white"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5">
              {song.cover ? (
                <Image
                  src={getHDThumbnail(song.cover) || song.cover}
                  alt=""
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Music size={12} className="text-white/20" aria-hidden="true" />
              )}
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Play size={10} fill="white" className="text-white" />
              </span>
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-white/60 group-hover:text-white/90">
                {song.title}
              </span>
              <span className="block truncate text-[10px] text-white/30">
                {song.artist}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
};
