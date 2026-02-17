"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

import { Song, SongSchema } from "@/app/types/song";
import { z } from "zod";
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

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const currentTimeRef = useRef(0);
  const lastStateRef = useRef<number>(-1);

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

  // Initialize YouTube IFrame API and Hydrate History
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Hydrate history
    try {
      const saved = localStorage.getItem("grovy-history");
      if (saved) setRecentlyPlayed(JSON.parse(saved).slice(0, 20));
      
      const favs = localStorage.getItem("grovy-favorites");
      if (favs) setFavorites(JSON.parse(favs));
    } catch (e) {}

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
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
          'enablejsapi': 1
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume * 100);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              if (isLoop) {
                event.target.playVideo();
              } else {
                nextTrack();
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
    
    // Attempt to set high quality when possible
    const qualityInterval = setInterval(() => {
       if (ytPlayerRef.current?.setPlaybackQuality) {
          ytPlayerRef.current.setPlaybackQuality("hd1080");
       }
    }, 5000);
    
    return () => clearInterval(qualityInterval);
  }, []);

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
  }, [songs, currentSongIndex, duration, currentTime]);

  // 1. Initialize Audio Element (Saavn/Gaana)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const updateTime = () => {
      const currentSong = songs[currentSongIndex];
      if (currentSong?.source !== "YouTube") {
        setCurrentTime(audio.currentTime);
        currentTimeRef.current = audio.currentTime;
      }
    };
    const updateDuration = () => {
      const currentSong = songs[currentSongIndex];
      if (currentSong?.source !== "YouTube") {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      const currentSong = songs[currentSongIndex];
      if (currentSong?.source !== "YouTube") {
        isLoop ? (audio.currentTime = 0, audio.play()) : nextTrack();
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
  }, [songs, currentSongIndex, isLoop]);

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
    setCurrentSongIndex((prev) => (isShuffle ? Math.floor(Math.random() * songs.length) : (prev + 1) % songs.length));
    setIsPlaying(true);
  }, [songs.length, isShuffle]);

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

  const play = useCallback(() => setIsPlaying(true), []);
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
           ytPlayerRef.current.loadVideoById(videoId);
           // We'll let the onStateChange or the next useEffect handle play/pause
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
                  if (isPlaying) audio.play();
               });
            } else {
               audio.removeAttribute('crossorigin');
               audio.src = targetUrl;
               audio.load();
               if (isPlaying) audio.play().catch(() => {});
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
      return await res.json();
    } catch (e) {
      return [];
    }
  }, []);

  const setQueue = useCallback((newSongs: Song[], index: number) => {
    setSongs(newSongs);
    setCurrentSongIndex(index);
    setIsPlaying(true);
  }, []);

  const startRadio = useCallback(async (id: string) => {
    const vId = id.startsWith("yt-") ? id.replace("yt-", "") : id;
    const res = await fetch(`/api/songs/radio?videoId=${vId}`);
    const data = await res.json();
    if (data.length > 0) setQueue(data, 0);
  }, [setQueue]);

  const loadRelated = useCallback(async (id: string) => {
    const vId = id.startsWith("yt-") ? id.replace("yt-", "") : id;
    const res = await fetch(`/api/songs/related?videoId=${vId}`);
    return await res.json();
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
    }
  };

  return (
    <PlayerContext.Provider value={value}>
      <div id="yt-player-hidden" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />
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
