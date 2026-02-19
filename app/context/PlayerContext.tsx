"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

import { Song, Playlist } from "@/app/types/song";
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
  loadSongs: (query?: string, source?: string) => Promise<Song[]>;
  setQueue: (newSongs: Song[], index: number) => void;
  startRadio: (videoId: string) => Promise<void>;
  loadRelated: (videoId: string) => Promise<Song[]>;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  recentlyPlayed: Song[];
  clearHistory: () => void;
  playlists: Playlist[];
  createPlaylist: (name: string) => void;
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
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  eqFilters: BiquadFilterNode[];
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
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const songsRef = useRef<Song[]>([]);
  const currentSongIndexRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const [audioContextState, setAudioContextState] = useState<AudioContext | null>(null);
  const [sourceNodeState, setSourceNodeState] = useState<MediaElementAudioSourceNode | null>(null);
  const [eqFiltersState, setEqFiltersState] = useState<BiquadFilterNode[]>([]);

  // Initialize YouTube IFrame API and Hydrate History
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Hydrate history
    try {
      const saved = localStorage.getItem("grovy-history");
      if (saved) setRecentlyPlayed(JSON.parse(saved).slice(0, 20));
      
      const favs = localStorage.getItem("grovy-favorites");
      if (favs) setFavorites(JSON.parse(favs));

      const savedPlaylists = localStorage.getItem("grovy-playlists");
      if (savedPlaylists) setPlaylists(JSON.parse(savedPlaylists));

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
          onError: (e: any) => console.error("[YTPlayer] Error:", e.data)
        }
      });
    };
    
    return () => {
      // Destroy YT player on unmount to prevent leaks
      try { ytPlayerRef.current?.destroy?.(); } catch (e) {}
      ytPlayerRef.current = null;
    };
  }, []);

  // Keep songsRef and currentSongIndexRef in sync for use in Audio event handlers
  useEffect(() => { songsRef.current = songs; }, [songs]);
  useEffect(() => { currentSongIndexRef.current = currentSongIndex; }, [currentSongIndex]);

  // Sync Timer for both players
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSong = songs[currentSongIndex];
      if (!currentSong) return;

      if (currentSong.source === "YouTube" && ytPlayerRef.current?.getCurrentTime) {
        try {
          const ytTime = ytPlayerRef.current.getCurrentTime();
          const ytDur = ytPlayerRef.current.getDuration();
          if (ytTime !== currentTime) {
            setCurrentTime(ytTime);
            currentTimeRef.current = ytTime;
          }
          if (ytDur !== duration && ytDur > 0) setDuration(ytDur);
        } catch (e) {}
      } else if (audioRef.current) {
        // Audio element listener handles this via events, but we sync ref here just in case
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
        setCurrentTime(audio.currentTime);
        currentTimeRef.current = audio.currentTime;
      }
    };
    const updateDuration = () => {
      const song = songsRef.current[currentSongIndexRef.current];
      if (song?.source !== "YouTube") {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      const song = songsRef.current[currentSongIndexRef.current];
      if (song?.source !== "YouTube") {
        isLoopRef.current ? (audio.currentTime = 0, audio.play()) : nextTrackRef.current();
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
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

      // Chain: source → filter[0] → filter[1] → ... → destination
      source.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(ctx.destination);

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
      return;
    }
    setSleepTimerMinutesState(minutes);
    sleepTimerRef.current = setTimeout(() => {
      setIsPlaying(false);
      setSleepTimerMinutesState(null);
      sleepTimerRef.current = null;
    }, minutes * 60 * 1000);
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
  }, [songs, currentSongIndex]);

  const nextTrack = useCallback(() => {
    if (songs.length === 0) return;
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
    if (currentTimeRef.current > 3) {
       seek(0);
    } else {
       setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
    }
    setIsPlaying(true);
  }, [songs.length, seek]);

  const togglePlayPause = useCallback(() => {
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

  // Manage Source Change
  useEffect(() => {
    const currentSong = songs[currentSongIndex];
    if (!currentSong) return;

    const audio = audioRef.current;
    
     // Stop the "other" player
     if (currentSong.source === "YouTube") {
        if (audio) {
          audio.pause();
          audio.src = "";
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }
        }
        if (ytPlayerRef.current?.loadVideoById) {
           const videoId = currentSong.id.replace("yt-", "");
           console.log(`[PlayerContext] Switching to YT Player: ${videoId}`);
           // Use cueVideoById when not playing to prevent auto-play on page load
           if (isPlayingRef.current) {
             ytPlayerRef.current.loadVideoById(videoId);
           } else {
             ytPlayerRef.current.cueVideoById(videoId);
           }
        }
     } else {
       if (ytPlayerRef.current?.stopVideo) ytPlayerRef.current.stopVideo();
       
       if (audio) {
         const targetUrl = new URL(currentSong.url, window.location.origin).href;
         const isHLS = targetUrl.includes(".m3u8");

         if (audio.src !== targetUrl || isHLS) {
            console.log(`[PlayerContext] Switching to Audio Player: ${targetUrl}`);
            audio.pause();
            if (hlsRef.current) hlsRef.current.destroy();

             if (isHLS) {
                const hls = new Hls({
                  maxMaxBufferLength: 30, // Increase buffer for smoother playback
                  enableWorker: true,
                });
                hls.loadSource(targetUrl);
               hls.attachMedia(audio);
               hlsRef.current = hls;
               hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  if (isPlayingRef.current) audio.play();
               });
            } else {
               audio.removeAttribute('crossorigin');
               audio.src = targetUrl;
               audio.load();
               if (isPlayingRef.current) audio.play().catch(() => {});
            }
         }
       }
    }
  }, [currentSongIndex, songs]);

  // Update Recently Played
  useEffect(() => {
    const song = songs[currentSongIndex];
    if (!song) return;

    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((s) => s.id !== song.id);
      const updated = [song, ...filtered].slice(0, 20);
      localStorage.setItem("grovy-history", JSON.stringify(updated));
      return updated;
    });
  }, [currentSongIndex, songs]);

  // Sync Favorites to LocalStorage
  useEffect(() => {
    localStorage.setItem("grovy-favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Sync Playlists to LocalStorage
  useEffect(() => {
    localStorage.setItem("grovy-playlists", JSON.stringify(playlists));
  }, [playlists]);

  // Sync Play/Pause Global Action
  useEffect(() => {
    const currentSong = songs[currentSongIndex];
    if (!currentSong) return;

    if (currentSong.source === "YouTube") {
      if (isPlaying) ytPlayerRef.current?.playVideo?.();
      else ytPlayerRef.current?.pauseVideo?.();
    } else {
      if (isPlaying) audioRef.current?.play().catch(() => {});
      else audioRef.current?.pause();
    }
  }, [isPlaying, currentSongIndex, songs]);

  const loadSongs = useCallback(async (query?: string, source?: string): Promise<Song[]> => {
    try {
      const params = new URLSearchParams();
      if (source) params.append("source", source);
      if (query) params.append("query", query);
      const res = await fetch(`/api/songs?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      return await res.json();
    } catch (e) {
      console.error("loadSongs error:", e);
      return [];
    }
  }, []);

  const setQueue = useCallback((newSongs: Song[], index: number) => {
    setSongs(newSongs);
    setCurrentSongIndex(index);
    setIsPlaying(true);
  }, []);

  const startRadio = useCallback(async (id: string) => {
    try {
      const vId = id.startsWith("yt-") ? id.replace("yt-", "") : id;
      const res = await fetch(`/api/songs/radio?videoId=${vId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) setQueue(data, 0);
    } catch (e) {
      console.error("startRadio error:", e);
    }
  }, [setQueue]);

  const loadRelated = useCallback(async (id: string) => {
    try {
      const vId = id.startsWith("yt-") ? id.replace("yt-", "") : id;
      const res = await fetch(`/api/songs/related?videoId=${vId}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error("loadRelated error:", e);
      return [];
    }
  }, []);

  const createPlaylist = useCallback((name: string) => {
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      songs: [],
      createdAt: Date.now()
    };
    setPlaylists(prev => [...prev, newPlaylist]);
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
    const img = new Image();
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
        
        if (isMounted) {
          setColors({
            primary: rgbToHex(palette[0][0], palette[0][1], palette[0][2]),
            secondary: rgbToHex(palette[1][0], palette[1][1], palette[1][2]),
            accent: rgbToHex(palette[2][0], palette[2][1], palette[2][2]),
          });
        }
      } catch (e) {
        if (isMounted) setColors(DEFAULT_COLORS);
      }
    };
    img.onerror = () => {
      if (isMounted) setColors(DEFAULT_COLORS);
    };
    return () => { isMounted = false; };
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
             seek(Math.min(currentTime + 5, duration));
          }
          break;
        case "ArrowLeft":
          if (isCommandPaletteOpen) return;
          if (e.metaKey || e.ctrlKey) {
             previousTrack();
          } else {
             seek(Math.max(currentTime - 5, 0));
          }
          break;
        case "ArrowUp":
          if (isCommandPaletteOpen) return;
          e.preventDefault();
          changeVolume(volume + 0.1);
          break;
        case "ArrowDown":
          if (isCommandPaletteOpen) return;
          e.preventDefault();
          changeVolume(volume - 0.1);
          break;
        case "KeyM":
           changeVolume(volume === 0 ? 0.8 : 0);
           break;
        case "KeyL":
           toggleLoop();
           break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, volume, currentTime, duration, nextTrack, previousTrack, seek, togglePlayPause, toggleLoop, changeVolume, isCommandPaletteOpen]);

  const value: PlayerContextType = {
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
    toggleShuffle: () => setIsShuffle(p => !p),
    toggleFavorite: (id) => setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]),
    isFavorite: (id) => favorites.includes(id),
    loadSongs,
    setQueue,
    startRadio,
    loadRelated,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    recentlyPlayed,
    clearHistory: () => {
       setRecentlyPlayed([]);
       localStorage.removeItem("grovy-history");
    },
    playlists,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    isPlaylistModalOpen,
    playlistModalSong,
    openPlaylistModal,
    closePlaylistModal,
    // New features
    playbackSpeed,
    setPlaybackSpeed,
    sleepTimerMinutes,
    setSleepTimer,
    audioContext: audioContextState,
    sourceNode: sourceNodeState,
    eqFilters: eqFiltersState,
    moveSongInQueue,
    removeFromQueue,
  };

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
