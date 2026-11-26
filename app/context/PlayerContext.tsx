"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";

import { Song, Playlist } from "@/app/types/song";
import { searchSongs, getRadioSongs, getRelatedSongs } from "@/app/lib/api";
import {
  savePlaylists,
  saveFavorites,
  addToHistory,
  getHistory,
  clearHistory as clearHistoryFromCache,
  subscribeLibraryRealtime,
} from "@/app/lib/offlineCache";
import { getGrovyPrefs, patchGrovyPrefs } from "@/app/lib/preferences";
import { readLibraryState, readQueue, writeQueue } from "@/app/lib/localStore";
import { moveIndex, nextIndex, previousIndex, removeIndex } from "@/app/lib/queue";
import { useMediaSession } from "@/app/hooks/useMediaSession";
import { useToast } from "@/app/components/Toast";
import Hls from "hls.js";

interface Colors {
  primary: string;
  secondary: string;
  accent: string;
}

interface PlayerContextType {
  songs: Song[];
  currentSongIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoop: boolean;
  isShuffle: boolean;
  favorites: Song[];
  colors: Colors;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (time: number) => void;
  setCurrentSongIndex: (index: number) => void;
  setVolume: (volume: number) => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  toggleFavorite: (idOrSong: string | Song) => void;
  isFavorite: (id: string) => boolean;
  loadSongs: (query?: string, signal?: AbortSignal) => Promise<Song[]>;
  setQueue: (newSongs: Song[], index: number) => void;
  startRadio: (songId: string, opts?: { title?: string; artist?: string }) => Promise<void>;
  loadRelated: (songId: string, opts?: { title?: string; artist?: string }, signal?: AbortSignal) => Promise<Song[]>;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  recentlyPlayed: Song[];
  clearHistory: () => void;
  playlists: Playlist[];
  createPlaylist: (name: string, initialSongs?: Song[]) => string;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  isPlaylistModalOpen: boolean;
  playlistModalSong: Song | null;
  openPlaylistModal: (song: Song) => void;
  closePlaylistModal: () => void;
  // New features
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  sleepTimerMinutes: number | null;
  setSleepTimer: (minutes: number | null) => void;
  sleepTimerEndTime: number | null;
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  eqFilters: BiquadFilterNode[];
  gainNode: GainNode | null;
  normalizationEnabled: boolean;
  setNormalizationEnabled: (enabled: boolean) => void;
  crossfadeEnabled: boolean;
  setCrossfadeEnabled: (enabled: boolean) => void;
  moveSongInQueue: (from: number, to: number) => void;
  removeFromQueue: (index: number) => void;
  videoMode: boolean;
  setVideoMode: (enabled: boolean) => void;
}

const DEFAULT_COLORS: Colors = {
  primary: "#3b82f6", 
  secondary: "#8b5cf6", 
  accent: "#3b82f6"
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

/**
 * Cheap content signatures used to decide whether a persist effect has real
 * work to do. Comparing ids only — not the whole song objects — keeps this
 * O(n) with no deep equality on every render, while still changing whenever an
 * add, remove or reorder happens.
 */
function songListSignature(songs: readonly Song[]): string {
  let signature = "";
  for (const song of songs) signature += `${song.id}\u0000`;
  return signature;
}

function playlistListSignature(playlists: readonly Playlist[]): string {
  let signature = "";
  for (const playlist of playlists) {
    signature += `${playlist.id}[`;
    for (const song of playlist.songs) signature += `${song.id},`;
    signature += `]${playlist.name}\u0000`;
  }
  return signature;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}


const YouTubeHiddenPlayer = React.memo(({ videoMode }: { videoMode: boolean }) => {
  if (videoMode) {
    return (
      <div
        id="yt-player-hidden"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(90vw, 480px)',
          aspectRatio: '16 / 9',
          zIndex: 60,
          borderRadius: '1rem',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
          pointerEvents: 'auto',
        }}
      />
    );
  }
  return <div id="yt-player-hidden" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />;
}, (prev, next) => prev.videoMode === next.videoMode);

YouTubeHiddenPlayer.displayName = "YouTubeHiddenPlayer";

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytScriptRequestedRef = useRef(false);
  const ensureYouTubeApiRef = useRef<() => void>(() => {});
  const currentTimeRef = useRef(0);
  const lastStateRef = useRef<number>(-1);
  const isLoopRef = useRef(false);
  const nextTrackRef = useRef<() => void>(() => {});
  const volumeRef = useRef(0.8);
  const isPlayingRef = useRef(false);
  const lastTimeStateUpdateRef = useRef(0);
  const durationRef = useRef(0);

  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isLoop, setIsLoop] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [colors, setColors] = useState<Colors>(DEFAULT_COLORS);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  // Flips only *after* stored state has been applied to React state, so the
  // persist effects below can never write the pre-hydration empty arrays.
  const [isLibraryHydrated, setIsLibraryHydrated] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistModalSong, setPlaylistModalSong] = useState<Song | null>(null);

  // New feature state
  const [playbackSpeed, setPlaybackSpeedState] = useState(1);
  const [sleepTimerMinutes, setSleepTimerMinutesState] = useState<number | null>(null);
  const [sleepTimerEndTime, setSleepTimerEndTime] = useState<number | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stallRetryCountRef = useRef(0);
  const songsRef = useRef<Song[]>([]);
  const currentSongIndexRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [audioContextState, setAudioContextState] = useState<AudioContext | null>(null);
  const [sourceNodeState, setSourceNodeState] = useState<MediaElementAudioSourceNode | null>(null);
  const [eqFiltersState, setEqFiltersState] = useState<BiquadFilterNode[]>([]);
  const [gainNodeState, setGainNodeState] = useState<GainNode | null>(null);
  const [normalizationEnabled, setNormalizationEnabledState] = useState(false);
  const [crossfadeEnabled, setCrossfadeEnabledState] = useState(false);
  const crossfadeRef = useRef(false);
  const [videoMode, setVideoModeState] = useState(false);
  const videoModeRef = useRef(false);

  // Initialize YouTube IFrame API and Hydrate History
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Hydrate persisted playback state from local storage. Library data
    // (playlists, favorites, history) is loaded by its own effect below.
    (async () => {
      try {
        const prefs = await getGrovyPrefs();

        // Queue lives in its own storage key now. Fall back to the old
        // `preferences.queue` location once, so an upgrade does not silently
        // drop the queue of an existing user.
        const persistedQueue = readQueue();
        const legacyQueue = prefs.queue as { songs?: Song[]; index?: number } | undefined;
        const restoredQueue =
          persistedQueue ??
          (legacyQueue && Array.isArray(legacyQueue.songs) && legacyQueue.songs.length > 0
            ? { songs: legacyQueue.songs, index: legacyQueue.index ?? 0 }
            : null);

        if (restoredQueue && restoredQueue.songs.length > 0) {
          setSongs(restoredQueue.songs);
          setCurrentSongIndex(
            Math.min(restoredQueue.index || 0, restoredQueue.songs.length - 1)
          );
          // Complete the migration: write to the new key and remove the old
          // value so `preferences` stops carrying the queue.
          if (!persistedQueue) {
            writeQueue({ songs: restoredQueue.songs, index: restoredQueue.index || 0 });
            void patchGrovyPrefs({ queue: null });
          }
        }

        const savedSpeed = Number(prefs.playbackSpeed);
        if (!Number.isNaN(savedSpeed) && savedSpeed > 0) {
          setPlaybackSpeedState(Math.max(0.25, Math.min(2, savedSpeed)));
        }

        if (prefs.videoMode === true) {
          setVideoModeState(true);
          videoModeRef.current = true;
        }
      } catch (e) {
        console.warn("[PlayerContext] Could not restore saved playback state:", e);
      }
    })();

    // Define the YT initialization function, but delay loading until needed.
    const initializeYouTubePlayer = () => {
      if (ytPlayerRef.current) return; // Already initialized
      
      ytPlayerRef.current = new window.YT.Player('yt-player-hidden', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
          'autoplay': 0,
          'controls': 0,
          'disablekb': 1,
          'fs': 0,
          'rel': 0,
          'showinfo': 0,
          'iv_load_policy': 3,
          'origin': window.location.origin,
          'playsinline': 1,
          'enablejsapi': 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volumeRef.current * 100);
            // Request highest available quality for best audio
            try {
              event.target.setPlaybackQuality("hd1080");
            } catch {
              // Quality hint is best-effort; some videos ignore it.
            }
          },
          onStateChange: (event: any) => {
            // Only process YT state changes when the current song is a YouTube song.
            // stopVideo() can fire PAUSED/ENDED events that would incorrectly
            // pause or skip non-YouTube songs (the "playlist loop" bug).
            const currentSong = songsRef.current[currentSongIndexRef.current];
            if (!currentSong || currentSong.source !== "YouTube") {
              lastStateRef.current = event.data;
              return;
            }

            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              if (isLoopRef.current) {
                event.target.playVideo();
              } else {
                nextTrackRef.current();
              }
            }
            // YT.PlayerState.PLAYING = 1
            if (event.data === 1) setIsPlaying(true);
            // YT.PlayerState.PAUSED = 2
            if (event.data === 2) setIsPlaying(false);
            
            lastStateRef.current = event.data;
          },
          onError: (e: any) => {
            // YouTube player error codes:
            // 2 = Invalid parameter
            // 5 = HTML5 player error
            // 100 = Video not found (user deleted, made private, or not available)
            // 101 = Video owner doesn't allow playback
            // 150 = Same as 101
            const errorCode = e.data;
            const errorMessages: Record<number, string> = {
              2: "Invalid parameter",
              5: "HTML5 player error",
              100: "Video not found or unavailable",
              101: "Video owner doesn't allow playback",
              150: "Video owner doesn't allow playback"
            };
            const errorMsg = errorMessages[errorCode] || `Error code ${errorCode}`;
            console.error(`[YTPlayer] Error (${errorCode}): ${errorMsg}`);
            
            // Recover: try streaming via audio element fallback, or skip
            const song = songsRef.current[currentSongIndexRef.current];
            if (song?.source === "YouTube" && audioRef.current) {
              const videoId = song.id.replace("yt-", "");
              const streamUrl = new URL(`/api/stream?id=${videoId}`, window.location.origin).href;
              console.warn(`[YTPlayer] Attempting fallback to audio stream: ${streamUrl}`);
              const audio = audioRef.current;
              audio.src = streamUrl;
              audio.load();
              if (isPlayingRef.current) {
                audio.play().catch((playError) => {
                  console.error("[YTPlayer] Fallback failed:", playError);
                  nextTrackRef.current();
                });
              }
            } else {
              console.debug("[YTPlayer] Skipping to next track");
              nextTrackRef.current();
            }
          }
        }
      });
    };
    window.onYouTubeIframeAPIReady = initializeYouTubePlayer;

    const ensureYouTubeApi = () => {
      if (window.YT?.Player) {
        initializeYouTubePlayer();
        return;
      }

      if (ytScriptRequestedRef.current) return;

      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        document.head.appendChild(tag);
      }

      ytScriptRequestedRef.current = true;
    };

    ensureYouTubeApiRef.current = ensureYouTubeApi;
    
    return () => {
      // Destroy YT player on unmount to prevent leaks
      try { ytPlayerRef.current?.destroy?.(); } catch (e) {}
      ytPlayerRef.current = null;
      ensureYouTubeApiRef.current = () => {};
    };
  }, []);

  // Keep songsRef and currentSongIndexRef in sync for use in Audio event handlers
  useEffect(() => { songsRef.current = songs; }, [songs]);
  useEffect(() => { currentSongIndexRef.current = currentSongIndex; }, [currentSongIndex]);

  // Sync Timer for both players (throttled to ~1Hz to reduce re-renders)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const currentSong = songs[currentSongIndex];
      if (!currentSong) return;

      if (currentSong.source === "YouTube" && ytPlayerRef.current?.getCurrentTime) {
        try {
          const ytTime = ytPlayerRef.current.getCurrentTime();
          const ytDur = ytPlayerRef.current.getDuration();
          currentTimeRef.current = ytTime;
          // Throttle state updates to ~1Hz to prevent excessive re-renders
          const now = Date.now();
          if (now - lastTimeStateUpdateRef.current >= 1000) {
            lastTimeStateUpdateRef.current = now;
            setCurrentTime(ytTime);
          }
          if (ytDur > 0 && Math.abs(ytDur - durationRef.current) > 0.5) {
            durationRef.current = ytDur;
            setDuration(ytDur);
          }
        } catch (e) {}
      } else if (audioRef.current) {
        currentTimeRef.current = audioRef.current.currentTime;
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, songs, currentSongIndex]);

  // 1. Initialize Audio Element ONCE (Saavn/Gaana)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const audio = new Audio();
    audio.volume = volumeRef.current;
    audioRef.current = audio;

    // Use refs inside handlers so they always read the latest state
    const updateTime = () => {
      const song = songsRef.current[currentSongIndexRef.current];
      if (song?.source !== "YouTube") {
        currentTimeRef.current = audio.currentTime;
        // Throttle state updates to ~1Hz to prevent excessive re-renders
        const now = Date.now();
        if (now - lastTimeStateUpdateRef.current >= 1000) {
          lastTimeStateUpdateRef.current = now;
          setCurrentTime(audio.currentTime);
        }
      }
    };
    const updateDuration = () => {
      const song = songsRef.current[currentSongIndexRef.current];
      if (song?.source !== "YouTube") {
        durationRef.current = audio.duration;
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      const song = songsRef.current[currentSongIndexRef.current];
      if (song?.source !== "YouTube") {
        isLoopRef.current ? (audio.currentTime = 0, audio.play()) : nextTrackRef.current();
      }
    };

    // Error recovery: retry playback on stall/error
    const handleStalled = () => {
      // Ignore audio element errors when current song plays via YT IFrame
      const song = songsRef.current[currentSongIndexRef.current];
      if (song?.source === "YouTube") return;

      console.warn(`[Audio] Playback stalled for: ${song?.title}, attempt ${stallRetryCountRef.current + 1}/3`);
      if (stallRetryCountRef.current < 3 && audio.src) {
        stallRetryCountRef.current++;
        const pos = audio.currentTime;
        audio.load();
        audio.currentTime = Math.max(0, pos - 1); // Rewind 1 second to help recovery
        if (isPlayingRef.current) {
          audio.play().catch((err) => {
            console.error("[Audio] Playback retry failed:", err);
          });
        }
      } else if (stallRetryCountRef.current >= 3) {
        console.error("[Audio] Max retries exceeded, skipping to next track");
        stallRetryCountRef.current = 0;
        nextTrackRef.current();
      }
    };
    const handleError = () => {
      // Ignore audio element errors when current song plays via YT IFrame
      const song = songsRef.current[currentSongIndexRef.current];
      if (song?.source === "YouTube") return;

      const errorCode = audio.error?.code;
      const errorName = audio.error?.code === 1 ? "MEDIA_ERR_ABORTED" 
                      : audio.error?.code === 2 ? "MEDIA_ERR_NETWORK"
                      : audio.error?.code === 3 ? "MEDIA_ERR_DECODE"
                      : audio.error?.code === 4 ? "MEDIA_ERR_SRC_NOT_SUPPORTED"
                      : "UNKNOWN_ERROR";
      
      console.error(`[Audio] Error (${errorCode}): ${errorName} - ${song?.title}`);
      
      if (stallRetryCountRef.current >= 3) {
        stallRetryCountRef.current = 0;
        console.debug("[Audio] Skipping song due to repeated errors");
        nextTrackRef.current();
      } else {
        // Delay retry to avoid rapid-fire error cascade
        setTimeout(() => handleStalled(), 500);
      }
    };
    const handlePlaying = () => {
      stallRetryCountRef.current = 0; // Reset on successful playback
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("error", handleError);
    audio.addEventListener("playing", handlePlaying);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("playing", handlePlaying);
      audio.pause();
    };
  }, []); // Empty deps — Audio element is created once and reused

  // Web Audio API setup (Equalizer) — runs once after Audio element is created
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Wait for audio element to exist, retry on next tick if needed
    const audio = audioRef.current;
    if (!audio) return;
    // Only create once
    if (audioContextRef.current) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaElementSource(audio);
      audioContextRef.current = ctx;
      sourceNodeRef.current = source;

      // Create 5-band EQ filters
      const frequencies = [60, 230, 910, 4000, 14000];
      const filters = frequencies.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? "lowshelf" : i === frequencies.length - 1 ? "highshelf" : "peaking";
        filter.frequency.value = freq;
        filter.gain.value = 0;
        filter.Q.value = 1;
        return filter;
      });

      // Chain: source → filter[0] → filter[1] → ... → gainNode → destination
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0;
      gainNodeRef.current = gainNode;

      source.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(gainNode);
      gainNode.connect(ctx.destination);

      eqFiltersRef.current = filters;

      setAudioContextState(ctx);
      setSourceNodeState(source);
      setEqFiltersState(filters);
      setGainNodeState(gainNode);

      void (async () => {
        try {
          const prefs = await getGrovyPrefs();

          const savedEq = prefs.equalizer as { bands?: number[] } | undefined;
          if (savedEq && Array.isArray(savedEq.bands)) {
            savedEq.bands.forEach((g, i) => {
              if (filters[i]) filters[i].gain.value = Number(g) || 0;
            });
          }

          if (prefs.normalizationEnabled === true) {
            setNormalizationEnabledState(true);
            if (gainNode) gainNode.gain.value = 0.75;
          }

          if (prefs.crossfadeEnabled === true) {
            setCrossfadeEnabledState(true);
            crossfadeRef.current = true;
          }
        } catch {
          // Ignore preference hydration failures.
        }
      })();
    } catch (e) {
      console.warn("[PlayerContext] Web Audio API not available:", e);
    }
  }, []); // Empty deps — same Audio element for the entire session

  // Sleep Timer logic
  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, []);

  const setSleepTimer = useCallback((minutes: number | null) => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    if (minutes === null) {
      setSleepTimerMinutesState(null);
      setSleepTimerEndTime(null);
      return;
    }
    setSleepTimerMinutesState(minutes);
    setSleepTimerEndTime(Date.now() + minutes * 60 * 1000);
    sleepTimerRef.current = setTimeout(() => {
      // Directly pause audio to avoid delay via React render cycle
      if (audioRef.current) audioRef.current.pause();
      if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
      setIsPlaying(false);
      setSleepTimerMinutesState(null);
      setSleepTimerEndTime(null);
      sleepTimerRef.current = null;
    }, minutes * 60 * 1000);
  }, []);

  // Audio normalization toggle
  const setNormalizationEnabled = useCallback((enabled: boolean) => {
    setNormalizationEnabledState(enabled);
    void patchGrovyPrefs({ normalizationEnabled: enabled });
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = enabled ? 0.75 : 1.0;
    }
  }, []);

  // Crossfade toggle
  const setCrossfadeEnabled = useCallback((enabled: boolean) => {
    setCrossfadeEnabledState(enabled);
    crossfadeRef.current = enabled;
    void patchGrovyPrefs({ crossfadeEnabled: enabled });
  }, []);

  // Video mode toggle
  const setVideoMode = useCallback((enabled: boolean) => {
    setVideoModeState(enabled);
    videoModeRef.current = enabled;
    void patchGrovyPrefs({ videoMode: enabled });
  }, []);

  // Playback speed
  const setPlaybackSpeed = useCallback((speed: number) => {
    const clamped = Math.max(0.25, Math.min(2, speed));
    setPlaybackSpeedState(clamped);
    if (audioRef.current) audioRef.current.playbackRate = clamped;
    if (ytPlayerRef.current?.setPlaybackRate) ytPlayerRef.current.setPlaybackRate(clamped);
    void patchGrovyPrefs({ playbackSpeed: clamped });
  }, []);

  // Sync playback speed when source changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
    if (ytPlayerRef.current?.setPlaybackRate) ytPlayerRef.current.setPlaybackRate(playbackSpeed);
  }, [songs, currentSongIndex, playbackSpeed]);

  // Persist the queue to its own key.
  //
  // Only rewrite when the song list actually changes: the index moves on every
  // track transition, and serialising the whole queue each time was pure write
  // amplification. The index is saved alongside the list, and again when the
  // page is hidden, so resuming lands on the right track without a write per
  // skip.
  useEffect(() => {
    if (songs.length === 0) return;
    writeQueue({ songs, index: currentSongIndex });
    // `currentSongIndex` is deliberately read but not depended on; see above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs]);

  // Capture the current index when the page is hidden, so resuming lands on
  // the track the user was actually on without writing on every skip.
  useEffect(() => {
    const persistIndex = () => {
      if (songsRef.current.length === 0) return;
      writeQueue({ songs: songsRef.current, index: currentSongIndexRef.current });
    };
    window.addEventListener("pagehide", persistIndex);
    document.addEventListener("visibilitychange", persistIndex);
    return () => {
      window.removeEventListener("pagehide", persistIndex);
      document.removeEventListener("visibilitychange", persistIndex);
    };
  }, []);

  const seek = useCallback((time: number) => {
    if (!songs[currentSongIndex]) return;
    const currentSong = songs[currentSongIndex];
    if (currentSong?.source === "YouTube" && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(time, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
    currentTimeRef.current = time;
    lastTimeStateUpdateRef.current = 0; // Reset throttle so next update is immediate
  }, [songs, currentSongIndex]);

  const nextTrack = useCallback(() => {
    if (songs.length === 0) return;
    if (audioContextRef.current?.state === "suspended") audioContextRef.current.resume();

    // A single-track queue has nowhere to advance to. Wrapping onto the same
    // index leaves source effects keyed on song identity untouched, so the
    // audio element is never reloaded — and setPlaying(true) below would then
    // report playback that is not happening. Stop instead.
    const skip = nextIndex(currentSongIndexRef.current, songs.length, { shuffle: isShuffle });
    if (skip.exhausted || skip.index === null) {
      setIsPlaying(false);
      return;
    }

    setCurrentSongIndex(skip.index);
    setIsPlaying(true);
  }, [songs.length, isShuffle]);

  // Keep refs in sync with state so event callbacks always read current values
  useEffect(() => { isLoopRef.current = isLoop; }, [isLoop]);
  useEffect(() => { nextTrackRef.current = nextTrack; }, [nextTrack]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const previousTrack = useCallback(() => {
    if (songs.length === 0) return;
    if (audioContextRef.current?.state === "suspended") audioContextRef.current.resume();

    const prev = previousIndex(
      currentSongIndexRef.current,
      songs.length,
      currentTimeRef.current
    );
    if (prev.index === null) return;

    // A "previous" inside the first few seconds of the same track means
    // restart; anything else is a real track change.
    if (prev.index === currentSongIndexRef.current) {
      seek(0);
    } else {
      setCurrentSongIndex(prev.index);
    }
    setIsPlaying(true);
  }, [songs.length, seek]);

  const togglePlayPause = useCallback(() => {
    // Resume AudioContext on user interaction (browser autoplay policy)
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
    setIsPlaying((prev) => !prev);
  }, []);

  const play = useCallback(() => {
    // Resume AudioContext if suspended (browser autoplay policy)
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
    setIsPlaying(true);
  }, []);
  const pause = useCallback(() => setIsPlaying(false), []);


  const toggleLoop = useCallback(() => {
    setIsLoop((prev) => !prev);
  }, []);

  const changeVolume = useCallback((v: number) => {
    const newVol = Math.max(0, Math.min(1, v));
    setVolumeState(newVol);
    if (audioRef.current) audioRef.current.volume = newVol;
    if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(newVol * 100);
    void patchGrovyPrefs({ volume: newVol });
  }, []);

  // Hydrate Volume
  useEffect(() => {
    let isActive = true;

    void (async () => {
      const prefs = await getGrovyPrefs();
      if (!isActive) return;

      const savedVol = Number(prefs.volume);
      if (!Number.isNaN(savedVol) && savedVol >= 0 && savedVol <= 1) {
        changeVolume(savedVol);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [changeVolume]);

  // Manage Source Change (with crossfade support)
  useEffect(() => {
    const currentSong = songs[currentSongIndex];
    if (!currentSong) return;

    const audio = audioRef.current;
    const gain = gainNodeRef.current;
    const ctx = audioContextRef.current;
    const doCrossfade = crossfadeRef.current && gain && ctx && isPlayingRef.current;

    const loadNewSource = () => {
      // Restore gain after crossfade
      if (gain) {
        gain.gain.cancelScheduledValues(ctx!.currentTime);
        gain.gain.value = normalizationEnabled ? 0.75 : 1.0;
      }

      // Reset stall retry count on every source change
      stallRetryCountRef.current = 0;

      if (currentSong.source === "YouTube") {
        // Load iframe API only when a YouTube track is actually selected.
        ensureYouTubeApiRef.current();
        if (audio) {
          audio.pause();
          // Don't set audio.src = "" — browsers resolve it to the page URL,
          // which fires error events that cascade into nextTrack() calls.
          // Just pause is enough since YT songs play via the IFrame player.
          if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        }
        if (ytPlayerRef.current?.loadVideoById) {
          const videoId = currentSong.id.replace("yt-", "");
          console.debug(`[PlayerContext] Switching to YT Player: ${videoId}`);
          if (isPlayingRef.current) ytPlayerRef.current.loadVideoById(videoId);
          else ytPlayerRef.current.cueVideoById(videoId);
        } else if (audio && currentSong.url) {
          // Fallback: YT IFrame player not ready — use stream proxy via audio element
          const streamUrl = currentSong.url.startsWith("http") 
            ? currentSong.url 
            : new URL(currentSong.url, window.location.origin).href;
          console.warn(`[PlayerContext] YT IFrame unavailable, falling back to audio element: ${streamUrl}`);
          audio.crossOrigin = "anonymous";
          audio.src = streamUrl;
          audio.load();
          if (isPlayingRef.current) audio.play().catch(() => {});
        }
      } else {
        // Only stop YT player if it was actually playing/cued (avoid spurious state events)
        if (ytPlayerRef.current?.stopVideo && lastStateRef.current !== -1 && lastStateRef.current !== 5) {
          ytPlayerRef.current.stopVideo();
        }
        if (audio) {
          const targetUrl = new URL(currentSong.url, window.location.origin).href;
          const isHLS = targetUrl.includes(".m3u8");
          if (audio.src !== targetUrl || isHLS) {
            console.debug(`[PlayerContext] Switching to Audio Player: ${targetUrl}`);
            audio.pause();
            if (hlsRef.current) hlsRef.current.destroy();
            if (isHLS) {
              const hls = new Hls({ maxMaxBufferLength: 30, enableWorker: true });
              hls.loadSource(targetUrl);
              hls.attachMedia(audio);
              hlsRef.current = hls;
              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (isPlayingRef.current) audio.play().catch(() => {});
              });
            } else {
              // Only set crossOrigin for same-origin URLs (e.g. /api/stream).
              // External CDN URLs (Saavn) may not support CORS — setting crossOrigin
              // would block playback entirely. The Web Audio EQ still processes
              // the audio but the node output is silenced for cross-origin sources.
              const isSameOrigin = targetUrl.startsWith(window.location.origin) || targetUrl.startsWith('/');
              audio.crossOrigin = isSameOrigin ? "anonymous" : "";
              audio.src = targetUrl;
              audio.load();
              if (isPlayingRef.current) audio.play().catch(() => {});
            }
          }
        }
      }

      // Fade in if crossfade was active
      if (doCrossfade && gain && ctx) {
        const baseGain = normalizationEnabled ? 0.75 : 1.0;
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(baseGain, ctx.currentTime + 1.5);
      }
    };

    if (doCrossfade && gain && ctx) {
      // Crossfade: fade out current audio over 1.5s then switch
      const baseGain = normalizationEnabled ? 0.75 : 1.0;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(baseGain, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      const fadeTimer = setTimeout(loadNewSource, 1500);
      return () => clearTimeout(fadeTimer);
    } else {
      loadNewSource();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSongIndex, songs[currentSongIndex]?.id, songs[currentSongIndex]?.url, normalizationEnabled]);

  // Gapless pre-buffer: prefetch next track's stream URL when near end
  const prefetchedUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (songs.length < 2 || duration <= 0) return;
    // Prefetch when within last 15 seconds
    if (duration - currentTime > 15 || currentTime === 0) return;
    
    const nextIdx = (currentSongIndex + 1) % songs.length;
    const nextSong = songs[nextIdx];
    if (!nextSong || nextSong.source === "YouTube") return;
    
    const nextUrl = nextSong.url;
    if (prefetchedUrlRef.current === nextUrl) return; // Already prefetched
    prefetchedUrlRef.current = nextUrl;

    // Warm the browser cache by making a range request for the first chunk
    try {
      const fullUrl = new URL(nextUrl, window.location.origin).href;
      fetch(fullUrl, { 
        headers: { Range: "bytes=0-65535" }, 
        // Don't await — fire-and-forget prefetch
      }).catch(() => {});
      console.debug(`[PlayerContext] Pre-buffering next track: ${nextSong.title}`);
    } catch (e) {}
  }, [currentTime, duration, songs, currentSongIndex]);

  // Update Recently Played
  useEffect(() => {
    const song = songs[currentSongIndex];
    if (!song) return;

    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((s) => s.id !== song.id);
      // Match the 50-entry cap used for persistence so a restored history is
      // not immediately halved the first time a track plays.
      const updated = [song, ...filtered].slice(0, 50);
      return updated;
    });
    addToHistory(song);
  }, [currentSongIndex, songs]);

  // Hydrate the library from local storage, then keep open tabs in sync.
  // Writes are gated on `isLibraryHydrated` so the empty initial state can
  // never overwrite stored playlists or favorites before hydration finishes.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const refreshLibraryState = () => {
      if (!isMounted) return;

      const library = readLibraryState();
      setFavorites(Array.isArray(library.favorites) ? library.favorites : []);
      setPlaylists(Array.isArray(library.playlists) ? library.playlists : []);

      // Restore listening history. `addToHistory` persists a timestamped copy;
      // the player only needs the Song fields, so drop the timestamp on the way
      // in. Without this, history is written on every track change and never
      // read, so "Recently Played" is empty after every reload.
      const history = Array.isArray(library.history) ? library.history : [];
      const restored = [...history]
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .map(({ timestamp: _timestamp, ...song }) => song);
      setRecentlyPlayed(restored);
    };

    refreshLibraryState();
    setIsLibraryHydrated(true);

    void subscribeLibraryRealtime(() => {
      refreshLibraryState();
    }).then((off) => {
      if (isMounted) unsubscribe = off;
      else off();
    });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  // Persist favorites once the library has hydrated.
  //
  // Skip the write when the content is unchanged. A library change in another
  // tab arrives here as a *new array reference* holding the same data, so
  // without this every cross-tab edit would be written straight back.
  const lastSavedFavoritesRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isLibraryHydrated) return;
    const signature = songListSignature(favorites);
    if (signature === lastSavedFavoritesRef.current) return;
    lastSavedFavoritesRef.current = signature;
    void saveFavorites(favorites);
  }, [isLibraryHydrated, favorites]);

  // Persist playlists once the library has hydrated. Full-playlist writes mean
  // adding, removing or reordering songs inside a playlist is always stored.
  const lastSavedPlaylistsRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isLibraryHydrated) return;
    const signature = playlistListSignature(playlists);
    if (signature === lastSavedPlaylistsRef.current) return;
    lastSavedPlaylistsRef.current = signature;
    void savePlaylists(playlists);
  }, [isLibraryHydrated, playlists]);

  // Sync Play/Pause Global Action
  useEffect(() => {
    const currentSong = songs[currentSongIndex];
    if (!currentSong) return;

    // Ensure AudioContext is running whenever playback starts
    if (isPlaying && audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }

    if (currentSong.source === "YouTube") {
      if (isPlaying) ytPlayerRef.current?.playVideo?.();
      else ytPlayerRef.current?.pauseVideo?.();
    } else {
      if (isPlaying) audioRef.current?.play().catch(() => {});
      else audioRef.current?.pause();
    }
  }, [isPlaying, songs, currentSongIndex]);

  const loadSongs = useCallback(async (query?: string, signal?: AbortSignal): Promise<Song[]> => {
    try {
      return await searchSongs(query, signal);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return [];
      console.error("loadSongs error:", e);
      toast("Search failed", {
        type: "error",
        action: {
          label: "Retry",
          onClick: () => { void loadSongs(query); },
        },
      });
      return [];
    }
  }, [toast]);

  const setQueue = useCallback((newSongs: Song[], index: number) => {
    // Resume AudioContext on user interaction (browser autoplay policy)
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
    setSongs(newSongs);
    setCurrentSongIndex(index);
    setIsPlaying(true);
  }, []);

  const startRadio = useCallback(async (id: string, opts?: { title?: string; artist?: string }) => {
    try {
      const data = await getRadioSongs(id, opts);
      if (Array.isArray(data) && data.length > 0) setQueue(data, 0);
    } catch (e) {
      console.error("startRadio error:", e);
      toast("Failed to start radio", {
        type: "error",
        action: {
          label: "Retry",
          onClick: () => { void startRadio(id, opts); },
        },
      });
    }
  }, [setQueue, toast]);

  const loadRelated = useCallback(async (id: string, opts?: { title?: string; artist?: string }, signal?: AbortSignal) => {
    try {
      return await getRelatedSongs(id, opts, signal);
    } catch (e) {
      console.error("loadRelated error:", e);
      toast("Failed to load related songs", {
        type: "error",
        action: {
          label: "Retry",
          onClick: () => { void loadRelated(id, opts); },
        },
      });
      return [];
    }
  }, [toast]);

  const createPlaylist = useCallback((name: string, initialSongs?: Song[]): string => {
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      songs: initialSongs || [],
      createdAt: Date.now()
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist.id;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
  }, []);

  const addToPlaylist = useCallback((playlistId: string, song: Song) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (p.songs.some(s => s.id === song.id)) return p;
        return { ...p, songs: [...p.songs, song] };
      }
      return p;
    }));
  }, []);

  const removeFromPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, songs: p.songs.filter(s => s.id !== songId) };
      }
      return p;
    }));
  }, []);

  const openPlaylistModal = useCallback((song: Song) => {
    setPlaylistModalSong(song);
    setIsPlaylistModalOpen(true);
  }, []);

  const closePlaylistModal = useCallback(() => {
    setIsPlaylistModalOpen(false);
    setPlaylistModalSong(null);
  }, []);

  // Queue management
  const moveSongInQueue = useCallback((from: number, to: number) => {
    setSongs(prev => {
      if (from < 0 || from >= prev.length || to < 0 || to >= prev.length || from === to) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      // Keep the currently playing song correct (see lib/queue.ts).
      setCurrentSongIndex(prevIdx => moveIndex(prevIdx, from, to, prev.length));
      return updated;
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setSongs(prev => {
      if (prev.length <= 1) return prev;
      const updated = prev.filter((_, i) => i !== index);
      setCurrentSongIndex(prevIdx => removeIndex(prevIdx, index, prev.length).index);
      return updated;
    });
  }, []);

  // Palette Sync
  useEffect(() => {
    const song = songs[currentSongIndex];
    if (!song?.cover) {
      setColors(DEFAULT_COLORS);
      return;
    }

    let isMounted = true;
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = song.cover;
    img.onload = async () => {
      if (!isMounted) return;
      try {
        type ColorThiefLike = {
          getPalette: (image: HTMLImageElement, colorCount?: number) => [number, number, number][];
        };
        type ColorThiefCtor = new () => ColorThiefLike;

        const colorThiefModule = await import("colorthief");
        const ColorThief = (colorThiefModule.default || colorThiefModule) as unknown as ColorThiefCtor;
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 3);
        const rgbToHex = (r: number, g: number, b: number) => 
          "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        
        if (isMounted && palette && palette.length >= 3) {
          setColors({
            primary: rgbToHex(palette[0][0], palette[0][1], palette[0][2]),
            secondary: rgbToHex(palette[1][0], palette[1][1], palette[1][2]),
            accent: rgbToHex(palette[2][0], palette[2][1], palette[2][2]),
          });
        } else if (isMounted && palette && palette.length >= 1) {
          const hex = rgbToHex(palette[0][0], palette[0][1], palette[0][2]);
          setColors({ primary: hex, secondary: hex, accent: hex });
        } else if (isMounted) {
          setColors(DEFAULT_COLORS);
        }
      } catch (e) {
        if (isMounted) setColors(DEFAULT_COLORS);
      }
    };
    img.onerror = () => {
      if (isMounted) setColors(DEFAULT_COLORS);
    };
    return () => { isMounted = false; img.src = ""; };
  }, [currentSongIndex, songs]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if ((e.target as HTMLElement).isContentEditable) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowRight":
          // If Command Palette is open, let it handle arrows
          if (isCommandPaletteOpen) return;
          if (e.metaKey || e.ctrlKey) {
             nextTrack();
          } else {
             seek(Math.min(currentTimeRef.current + 5, durationRef.current));
          }
          break;
        case "ArrowLeft":
          if (isCommandPaletteOpen) return;
          if (e.metaKey || e.ctrlKey) {
             previousTrack();
          } else {
             seek(Math.max(currentTimeRef.current - 5, 0));
          }
          break;
        case "ArrowUp":
          if (isCommandPaletteOpen) return;
          e.preventDefault();
          changeVolume(volumeRef.current + 0.1);
          break;
        case "ArrowDown":
          if (isCommandPaletteOpen) return;
          e.preventDefault();
          changeVolume(volumeRef.current - 0.1);
          break;
        case "KeyM":
           changeVolume(volumeRef.current === 0 ? 0.8 : 0);
           break;
        case "KeyL":
           toggleLoop();
           break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextTrack, previousTrack, seek, togglePlayPause, toggleLoop, changeVolume, isCommandPaletteOpen]);

  const toggleShuffle = useCallback(() => setIsShuffle(p => !p), []);
  const toggleFavorite = useCallback((idOrSong: string | Song) => {
    const id = typeof idOrSong === 'string' ? idOrSong : idOrSong.id;
    setFavorites(prev => {
      // If already favorited, remove it
      if (prev.some(s => s.id === id)) return prev.filter(s => s.id !== id);
      
      // Try to find the full song object
      let song = songsRef.current.find(s => s.id === id);
      if (!song) song = recentlyPlayed.find(s => s.id === id);
      
      // If we have a Song object passed in, use it
      if (typeof idOrSong === 'object' && idOrSong.id === id) {
        song = idOrSong;
      }
      
      // Add to favorites if we have the song
      if (song) return [...prev, song];
      
      // Fallback: create minimal song object from what we have
      // This shouldn't happen but prevents data loss
      return prev;
    });
  }, [recentlyPlayed]);
  const isFavorite = useCallback((id: string) => favorites.some(s => s.id === id), [favorites]);
  const clearHistory = useCallback(() => {
    setRecentlyPlayed([]);
    clearHistoryFromCache().catch(() => {});
  }, []);

  const value: PlayerContextType = useMemo(() => ({
    songs,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoop,
    isShuffle,
    favorites,
    colors,
    play,
    pause,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
    setCurrentSongIndex,
    setVolume: changeVolume,
    toggleLoop,
    toggleShuffle,
    toggleFavorite,
    isFavorite,
    loadSongs,
    setQueue,
    startRadio,
    loadRelated,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    recentlyPlayed,
    clearHistory,
    playlists,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    isPlaylistModalOpen,
    playlistModalSong,
    openPlaylistModal,
    closePlaylistModal,
    playbackSpeed,
    setPlaybackSpeed,
    sleepTimerMinutes,
    setSleepTimer,
    sleepTimerEndTime,
    audioContext: audioContextState,
    sourceNode: sourceNodeState,
    eqFilters: eqFiltersState,
    gainNode: gainNodeState,
    normalizationEnabled,
    setNormalizationEnabled,
    crossfadeEnabled,
    setCrossfadeEnabled,
    moveSongInQueue,
    removeFromQueue,
    videoMode,
    setVideoMode,
  }), [
    songs, currentSongIndex, isPlaying, currentTime, duration, volume,
    isLoop, isShuffle, favorites, colors, play, pause, togglePlayPause,
    nextTrack, previousTrack, seek, changeVolume, toggleLoop, toggleShuffle,
    toggleFavorite, isFavorite, loadSongs, setQueue, startRadio, loadRelated,
    isCommandPaletteOpen, recentlyPlayed, clearHistory,
    playlists, createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist,
    isPlaylistModalOpen, playlistModalSong, openPlaylistModal, closePlaylistModal,
    playbackSpeed, setPlaybackSpeed, sleepTimerMinutes, setSleepTimer, sleepTimerEndTime,
    audioContextState, sourceNodeState, eqFiltersState,
    gainNodeState, normalizationEnabled, setNormalizationEnabled,
    crossfadeEnabled, setCrossfadeEnabled,
    moveSongInQueue, removeFromQueue,
    videoMode, setVideoMode,
  ]);

  // Browser Media Session integration (lock screen, media keys)
  const currentSongForSession = songs[currentSongIndex];
  useMediaSession({
    title: currentSongForSession?.title,
    artist: currentSongForSession?.artist,
    artwork: currentSongForSession?.cover,
    isPlaying,
    onPlay: play,
    onPause: pause,
    onNextTrack: nextTrack,
    onPreviousTrack: previousTrack,
    onSeekForward: () => seek(Math.min(currentTimeRef.current + 10, durationRef.current)),
    onSeekBackward: () => seek(Math.max(currentTimeRef.current - 10, 0)),
  });

  return (
    <PlayerContext.Provider value={value}>
      <YouTubeHiddenPlayer videoMode={videoMode} />
      <div
        style={
          {
            display: "contents",
            "--player-primary": colors.primary,
            "--player-secondary": colors.secondary,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </PlayerContext.Provider>
  );
};

/**
 * Access the player context from any component within PlayerProvider.
 * Provides playback controls, queue management, favorites, playlists,
 * equalizer state, and crossfade/normalization settings.
 *
 * @returns The full PlayerContextType object
 * @throws If used outside of a PlayerProvider
 */
export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};
