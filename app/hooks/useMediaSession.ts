"use client";

import { useEffect } from "react";

interface MediaSessionOptions {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
}

/**
 * Integrates with the browser Media Session API to display Now Playing info
 * on lock screens, media HUDs, and handle hardware media key events.
 */
export function useMediaSession(options: MediaSessionOptions) {
  const {
    title,
    artist,
    artwork,
    isPlaying,
    onPlay,
    onPause,
    onNextTrack,
    onPreviousTrack,
    onSeekForward,
    onSeekBackward,
  } = options;

  // Update metadata
  useEffect(() => {
    if (!("mediaSession" in navigator) || !title) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || "Unknown",
      artist: artist || "Unknown Artist",
      album: "Grovy",
      artwork: artwork
        ? [
            { src: artwork, sizes: "96x96", type: "image/jpeg" },
            { src: artwork, sizes: "128x128", type: "image/jpeg" },
            { src: artwork, sizes: "192x192", type: "image/jpeg" },
            { src: artwork, sizes: "256x256", type: "image/jpeg" },
            { src: artwork, sizes: "512x512", type: "image/jpeg" },
          ]
        : [],
    });
  }, [title, artist, artwork]);

  // Update playback state
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Register action handlers
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const handlers: [MediaSessionAction, (() => void) | undefined][] = [
      ["play", onPlay],
      ["pause", onPause],
      ["nexttrack", onNextTrack],
      ["previoustrack", onPreviousTrack],
      ["seekforward", onSeekForward],
      ["seekbackward", onSeekBackward],
    ];

    for (const [action, handler] of handlers) {
      try {
        if (handler) {
          navigator.mediaSession.setActionHandler(action, handler);
        }
      } catch {
        // Not all actions are supported on all browsers
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      }
    };
  }, [onPlay, onPause, onNextTrack, onPreviousTrack, onSeekForward, onSeekBackward]);
}
