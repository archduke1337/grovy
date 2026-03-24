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
  getPlaylists, 
  savePlaylists, 
  getFavorites, 
  saveFavorites, 
  getHistory, 
  addToHistory 
} from "@/app/lib/offlineCache";
import { useMediaSession } from "@/app/hooks/useMediaSession";
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
  favorites: string[];
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
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  loadSongs: (query?: string, source?: string, signal?: AbortSignal) => Promise<Song[]>;
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
}

const DEFAULT_COLORS: Colors = {
  primary: "#3b82f6", 
  secondary: "#8b5cf6", 
  accent: "#3b82f6"
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}


const YouTubeHiddenPlayer = React.memo(() => {
  return <div id="yt-player-hidden" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />;
}, () => true);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const ytPlayerRef = useRef<any>(null);
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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [colors, setColors] = useState<Colors>(DEFAULT_COLORS);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
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

  // Initialize YouTube IFrame API and Hydrate History
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Hydrate from IndexedDB & LocalStorage
    (async () => {
      try {
        const hist = await getHistory();
        if (hist && hist.length > 0) setRecentlyPlayed(hist);
        else {
          const saved = localStorage.getItem("grovy-history");
          if (saved) setRecentlyPlayed(JSON.parse(saved).slice(0, 20));
        }
        
        const favs = await getFavorites();
        if (favs && favs.length > 0) setFavorites(favs);
        else {
          const savedFavs = localStorage.getItem("grovy-favorites");
          if (savedFavs) setFavorites(JSON.parse(savedFavs));
        }

        const savedPlaylists = await getPlaylists();
        if (savedPlaylists && savedPlaylists.length > 0) setPlaylists(savedPlaylists);
        else {
          const localPlaylists = localStorage.getItem("grovy-playlists");
          if (localPlaylists) setPlaylists(JSON.parse(localPlaylists));
        }

        // Restore persistent queue
        const savedQueue = localStorage.getItem("grovy-queue");
        if (savedQueue) {
          const { songs: savedSongs, index } = JSON.parse(savedQueue);
          if (Array.isArray(savedSongs) && savedSongs.length > 0) {
            setSongs(savedSongs);
            setCurrentSongIndex(Math.min(index || 0, savedSongs.length - 1));
          }
        }

        // Restore playback speed
        const savedSpeed = localStorage.getItem("grovy-speed");
        if (savedSpeed) setPlaybackSpeedState(parseFloat(savedSpeed) || 1);
      } catch (e) {}
    })();

    // Define the YT initialization function FIRST (before checking if API is loaded)
    window.onYouTubeIframeAPIReady = () => {
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
              event.target.setPlaybackQuality('hd1080');
            } catch (e) {}
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
            console.error("[YTPlayer] Error:", e.data);
            // Recover: try streaming via audio element fallback, or skip
            const song = songsRef.current[currentSongIndexRef.current];
            if (song?.source === "YouTube" && audioRef.current) {
              const videoId = song.id.replace("yt-", "");
              const streamUrl = new URL(`/api/stream?id=${videoId}`, window.location.origin).href;
              console.warn(`[YTPlayer] Falling back to audio stream proxy: ${streamUrl}`);
              const audio = audioRef.current;
              audio.src = streamUrl;
              audio.load();
              if (isPlayingRef.current) audio.play().catch(() => nextTrackRef.current());
            } else {
              nextTrackRef.current();
            }
          }
        }
      });
    };

    // Check if YT API is already loaded or script already injected
    if (window.YT?.Player) {
      // API already loaded, initialize player directly
      if (!ytPlayerRef.current) {
        window.onYouTubeIframeAPIReady();
      }
    } else if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
    
    return () => {
      // Destroy YT player on unmount to prevent leaks
      try { ytPlayerRef.current?.destroy?.(); } catch (e) {}
      ytPlayerRef.current = null;
    };
  }, []);

  // Keep songsRef and currentSongIndexRef in sync for use in Audio event handlers
  useEffect(() => { songsRef.current = songs; }, [songs]);
  useEffect(() => { currentSongIndexRef.current = currentSongIndex; }, [currentSongIndex]);

  // Sync Timer for both players (throttled to ~1Hz to reduce re-renders)
  useEffect(() => {
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
  }, [songs, currentSongIndex]);

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

      console.warn("[Audio] Playback stalled, attempting recovery...");
      if (stallRetryCountRef.current < 3 && audio.src) {
        stallRetryCountRef.current++;
        const pos = audio.currentTime;
        audio.load();
        audio.currentTime = pos;
        if (isPlayingRef.current) audio.play().catch(() => {});
      }
    };
    const handleError = () => {
      // Ignore audio element errors when current song plays via YT IFrame
      const song = songsRef.current[currentSongIndexRef.current];
      if (song?.source === "YouTube") return;

      console.error("[Audio] Playback error, retry:", stallRetryCountRef.current);
      if (stallRetryCountRef.current >= 3) {
        stallRetryCountRef.current = 0;
        nextTrackRef.current();
      } else {
        // Delay retry to avoid rapid-fire error cascade
        setTimeout(() => handleStalled(), 500);
      }
    };
    const handlePlaying = () => {
      stallRetryCountRef.current = 0;
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

      // Restore saved EQ — format is { bands: number[], preset: string }
      try {
        const savedEq = localStorage.getItem("grovy-eq");
        if (savedEq) {
          const parsed = JSON.parse(savedEq);
          const gains = parsed?.bands ?? (Array.isArray(parsed) ? parsed : null);
          if (Array.isArray(gains)) {
            gains.forEach((g: number, i: number) => {
              if (filters[i]) filters[i].gain.value = g;
            });
          }
        }
      } catch (e) {}

      setAudioContextState(ctx);
      setSourceNodeState(source);
      setEqFiltersState(filters);
      setGainNodeState(gainNode);

      // Restore normalization preference
      try {
        const savedNorm = localStorage.getItem("grovy-normalization");
        if (savedNorm === "true") {
          setNormalizationEnabledState(true);
          if (gainNode) gainNode.gain.value = 0.75;
        }
      } catch (e) {}

      // Restore crossfade preference
      try {
        const savedCf = localStorage.getItem("grovy-crossfade");
        if (savedCf === "true") {
          setCrossfadeEnabledState(true);
          crossfadeRef.current = true;
        }
      } catch (e) {}
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
    localStorage.setItem("grovy-normalization", String(enabled));
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = enabled ? 0.75 : 1.0;
    }
  }, []);

  // Crossfade toggle
  const setCrossfadeEnabled = useCallback((enabled: boolean) => {
    setCrossfadeEnabledState(enabled);
    crossfadeRef.current = enabled;
    localStorage.setItem("grovy-crossfade", String(enabled));
  }, []);

  // Playback speed
  const setPlaybackSpeed = useCallback((speed: number) => {
    const clamped = Math.max(0.25, Math.min(2, speed));
    setPlaybackSpeedState(clamped);
    if (audioRef.current) audioRef.current.playbackRate = clamped;
    if (ytPlayerRef.current?.setPlaybackRate) ytPlayerRef.current.setPlaybackRate(clamped);
    localStorage.setItem("grovy-speed", clamped.toString());
  }, []);

  // Sync playback speed when source changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
    if (ytPlayerRef.current?.setPlaybackRate) ytPlayerRef.current.setPlaybackRate(playbackSpeed);
  }, [songs, currentSongIndex, playbackSpeed]);

  // Persist queue to localStorage
  useEffect(() => {
    if (songs.length > 0) {
      localStorage.setItem("grovy-queue", JSON.stringify({ songs, index: currentSongIndex }));
    }
  }, [songs, currentSongIndex]);

  const seek = useCallback((time: number) => {
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
    setCurrentSongIndex((prev) => {
      if (isShuffle && songs.length > 1) {
        let next;
        do { next = Math.floor(Math.random() * songs.length); } while (next === prev);
        return next;
      }
      return (prev + 1) % songs.length;
    });
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
    if (currentTimeRef.current > 3) {
       seek(0);
    } else {
       setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
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
    localStorage.setItem("grovy-volume", newVol.toString());
  }, []);

  // Hydrate Volume
  useEffect(() => {
    const savedVol = localStorage.getItem("grovy-volume");
    if (savedVol) changeVolume(parseFloat(savedVol));
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
        if (audio) {
          audio.pause();
          // Don't set audio.src = "" — browsers resolve it to the page URL,
          // which fires error events that cascade into nextTrack() calls.
          // Just pause is enough since YT songs play via the IFrame player.
          if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        }
        if (ytPlayerRef.current?.loadVideoById) {
          const videoId = currentSong.id.replace("yt-", "");
          console.log(`[PlayerContext] Switching to YT Player: ${videoId}`);
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
            console.log(`[PlayerContext] Switching to Audio Player: ${targetUrl}`);
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
  }, [currentSongIndex, songs[currentSongIndex]?.id, songs[currentSongIndex]?.url]);

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
      console.log(`[PlayerContext] Pre-buffering next track: ${nextSong.title}`);
    } catch (e) {}
  }, [currentTime, duration, songs, currentSongIndex]);

  // Update Recently Played
  useEffect(() => {
    const song = songs[currentSongIndex];
    if (!song) return;

    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((s) => s.id !== song.id);
      const updated = [song, ...filtered].slice(0, 20);
      addToHistory(song); // IndexedDB
      localStorage.setItem("grovy-history", JSON.stringify(updated));
      return updated;
    });
  }, [currentSongIndex, songs]);

  // Sync Favorites to LocalStorage & IndexedDB
  useEffect(() => {
    localStorage.setItem("grovy-favorites", JSON.stringify(favorites));
    saveFavorites(favorites);
  }, [favorites]);

  // Sync Playlists to LocalStorage & IndexedDB
  useEffect(() => {
    localStorage.setItem("grovy-playlists", JSON.stringify(playlists));
    savePlaylists(playlists);
  }, [playlists]);

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
  }, [isPlaying, currentSongIndex, songs[currentSongIndex]?.id]);

  const loadSongs = useCallback(async (query?: string, source?: string, signal?: AbortSignal): Promise<Song[]> => {
    try {
      return await searchSongs(query, source, signal);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return [];
      console.error("loadSongs error:", e);
      return [];
    }
  }, []);

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
    }
  }, [setQueue]);

  const loadRelated = useCallback(async (id: string, opts?: { title?: string; artist?: string }, signal?: AbortSignal) => {
    try {
      return await getRelatedSongs(id, opts, signal);
    } catch (e) {
      console.error("loadRelated error:", e);
      return [];
    }
  }, []);

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
      // Adjust currentSongIndex to keep the currently playing song correct
      setCurrentSongIndex(prevIdx => {
        if (prevIdx === from) return to;
        if (from < prevIdx && to >= prevIdx) return prevIdx - 1;
        if (from > prevIdx && to <= prevIdx) return prevIdx + 1;
        return prevIdx;
      });
      return updated;
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setSongs(prev => {
      if (prev.length <= 1) return prev;
      const updated = prev.filter((_, i) => i !== index);
      setCurrentSongIndex(prevIdx => {
        if (index < prevIdx) return prevIdx - 1;
        if (index === prevIdx) return Math.min(prevIdx, updated.length - 1);
        return prevIdx;
      });
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
        // @ts-ignore
        const ColorThief = (await import("colorthief")).default;
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
  }, [isPlaying, nextTrack, previousTrack, seek, togglePlayPause, toggleLoop, changeVolume, isCommandPaletteOpen]);

  const toggleShuffle = useCallback(() => setIsShuffle(p => !p), []);
  const toggleFavorite = useCallback((id: string) => setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]), []);
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);
  const clearHistory = useCallback(() => {
    setRecentlyPlayed([]);
    localStorage.removeItem("grovy-history");
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
      <YouTubeHiddenPlayer />
      <div style={{ display: 'contents', 
          // @ts-ignore
          '--player-primary': colors.primary, 
          '--player-secondary': colors.secondary 
      }}>
        {children}
      </div>
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};
