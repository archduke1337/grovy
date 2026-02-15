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

let ColorThief: any;
if (typeof window !== "undefined") {
  ColorThief = require("colorthief").default || require("colorthief");
}

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
  analyser: AnalyserNode | null;
  favorites: string[];
  colors: Colors;
  eqEnabled: boolean;
  spatialEnabled: boolean;
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
  setQueue: (newSongs: z.infer<typeof SongSchema>[], index: number) => void;
  toggleEQ: () => void;
  toggleSpatial: () => void;
  setEqGain: (index: number, value: number) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  recentlyPlayed: Song[];
}

const DEFAULT_COLORS: Colors = {
  primary: "#3b82f6", // blue-500
  secondary: "#8b5cf6", // purple-500
  accent: "#3b82f6"
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const EQ_FREQUENCIES = [60, 300, 1000, 4000, 16000];

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);

  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isLoop, setIsLoop] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [colors, setColors] = useState<Colors>(DEFAULT_COLORS);
  const [eqEnabled, setEqEnabled] = useState(false);
  const [spatialEnabled, setSpatialEnabled] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const nextTrack = useCallback(() => {
    setCurrentSongIndex((prev) => (isShuffle ? Math.floor(Math.random() * songs.length) : (prev + 1) % songs.length));
  }, [songs.length, isShuffle]);

  const previousTrack = useCallback(() => {
    if (currentTime > 3) seek(0);
    else setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
  }, [currentTime, songs.length, seek]);

  // Sync Media Session
  useEffect(() => {
    if ("mediaSession" in navigator && songs.length > 0) {
      const song = songs[currentSongIndex];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist || "Grovy",
        album: "My Collection",
        artwork: [
          { src: song.cover || "/icons/icon.svg", sizes: "512x512", type: "image/png" }
        ]
      });

      navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", () => previousTrack());
      navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    }
  }, [songs, currentSongIndex, isPlaying, previousTrack, nextTrack, seek]);

  // Sync Document Title
  useEffect(() => {
    if (isPlaying && songs.length > 0) {
      const song = songs[currentSongIndex];
      document.title = `▶ ${song.title} - ${song.artist} | Grovy`;
    } else {
      document.title = "Grovy";
    }
  }, [isPlaying, songs, currentSongIndex]);

  // Load songs from API
  const loadSongs = useCallback(async (query?: string, source?: string): Promise<Song[]> => {
    try {
      let url = "/api/songs";
      if (source === "local") url = "/api/songs?source=local";
      else if (query) url = `/api/songs?query=${encodeURIComponent(query)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      const result = z.array(SongSchema).safeParse(data);
      if (result.success) {
        return result.data;
      } else {
        console.error("Context Validation Error:", result.error);
        return data as Song[];
      }
    } catch (error) {
      console.error("Failed to load songs:", error);
      return [];
    }
  }, []);

  const setQueue = useCallback((newSongs: Song[], index: number) => {
    setSongs(newSongs);
    setCurrentSongIndex(index);
    setIsPlaying(true);
  }, []);
  // Palette Sync Implementation
  useEffect(() => {
    const song = songs[currentSongIndex];
    if (!song?.cover) {
      setColors(DEFAULT_COLORS);
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = song.cover;
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 3);
        const rgbToHex = (r: number, g: number, b: number) => 
          "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        
        setColors({
          primary: rgbToHex(palette[0][0], palette[0][1], palette[0][2]),
          secondary: rgbToHex(palette[1][0], palette[1][1], palette[1][2]),
          accent: rgbToHex(palette[2][0], palette[2][1], palette[2][2]),
        });
      } catch (e) {
        setColors(DEFAULT_COLORS);
      }
    };
    img.onerror = () => setColors(DEFAULT_COLORS);
  }, [currentSongIndex, songs]);

  // Audio Graph initialization
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && audioRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const source = ctx.createMediaElementSource(audioRef.current);
      
      // EQ Chain
      const filters = EQ_FREQUENCIES.map(freq => {
        const filter = ctx.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });

      // Spatial Node
      const panner = ctx.createStereoPanner();
      panner.pan.value = 0;

      const ana = ctx.createAnalyser();
      ana.fftSize = 256;

      // Connect: Source -> filters -> panner -> analyser -> destination
      let lastNode: AudioNode = source;
      filters.forEach(f => {
        lastNode.connect(f);
        lastNode = f;
      });
      lastNode.connect(panner);
      panner.connect(ana);
      ana.connect(ctx.destination);
      
      audioContextRef.current = ctx;
      analyserRef.current = ana;
      sourceRef.current = source;
      eqNodesRef.current = filters;
      pannerNodeRef.current = panner;
      setAnalyser(ana);
    }
    
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const initialSongs = await loadSongs();
      if (initialSongs.length > 0) setSongs(initialSongs);
    };
    init();
    if (typeof window !== "undefined") {
      const savedFavs = localStorage.getItem("grovy-favorites");
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      
      const savedVol = localStorage.getItem("grovy-volume");
      if (savedVol) {
        const v = parseFloat(savedVol);
        setVolumeState(v);
        if (audioRef.current) audioRef.current.volume = v;
      }

      const savedSettings = localStorage.getItem("grovy-settings");
      if (savedSettings) {
        const { loop, shuffle } = JSON.parse(savedSettings);
        setIsLoop(loop);
        setIsShuffle(shuffle);
      }

      const savedHistory = localStorage.getItem("grovy-history");
      if (savedHistory) setRecentlyPlayed(JSON.parse(savedHistory));
    }
  }, [loadSongs]);

  // Update history when song changes
  useEffect(() => {
    if (songs.length > 0 && isPlaying) {
      const current = songs[currentSongIndex];
      setRecentlyPlayed(prev => {
        const filtered = prev.filter(s => s.id !== current.id);
        const next = [current, ...filtered].slice(0, 20);
        if (typeof window !== "undefined") {
          localStorage.setItem("grovy-history", JSON.stringify(next));
        }
        return next;
      });
    }
  }, [currentSongIndex, songs, isPlaying]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("grovy-favorites", JSON.stringify(favorites));
    }
  }, [favorites]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || songs.length === 0) return;
    const song = songs[currentSongIndex];
    if (!song) return;
    audio.src = song.url;
    if (isPlaying) audio.play().catch(() => {});
  }, [currentSongIndex, songs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      initAudioContext();
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, initAudioContext]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Apply Spatial Audio Logic
  useEffect(() => {
    if (pannerNodeRef.current) {
      // Subtle widening effect
      pannerNodeRef.current.pan.value = spatialEnabled ? 0.05 : 0;
    }
  }, [spatialEnabled]);

  const play = useCallback(() => {
    initAudioContext();
    setIsPlaying(true);
  }, [initAudioContext]);

  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlayPause = useCallback(() => {
    if (!isPlaying) initAudioContext();
    setIsPlaying((prev) => !prev);
  }, [isPlaying, initAudioContext]);



  const setVolume = useCallback((vol: number) => {
    const v = Math.max(0, Math.min(1, vol));
    setVolumeState(v);
    localStorage.setItem("grovy-volume", v.toString());
  }, []);

  const toggleLoop = useCallback(() => setIsLoop((prev) => {
    const next = !prev;
    const settings = JSON.parse(localStorage.getItem("grovy-settings") || '{"shuffle":false}');
    localStorage.setItem("grovy-settings", JSON.stringify({ ...settings, loop: next }));
    return next;
  }), []);

  const toggleShuffle = useCallback(() => setIsShuffle((prev) => {
    const next = !prev;
    const settings = JSON.parse(localStorage.getItem("grovy-settings") || '{"loop":false}');
    localStorage.setItem("grovy-settings", JSON.stringify({ ...settings, shuffle: next }));
    return next;
  }), []);
  const toggleFavorite = useCallback((id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]), []);
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleEQ = () => setEqEnabled(!eqEnabled);
  const toggleSpatial = () => setSpatialEnabled(!spatialEnabled);
  const setEqGain = (index: number, value: number) => {
    if (eqNodesRef.current[index]) {
      eqNodesRef.current[index].gain.value = value;
    }
  };

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.volume = 0.8;
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setPositionState({
          duration: audio.duration || 0,
          playbackRate: audio.playbackRate,
          position: audio.currentTime
        });
      }
    };
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => isLoop ? (audio.currentTime = 0, audio.play()) : nextTrack();

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isLoop, nextTrack]);

  const value: PlayerContextType = {
    songs,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoop,
    isShuffle,
    analyser,
    favorites,
    colors,
    eqEnabled,
    spatialEnabled,
    toggleFavorite,
    isFavorite,
    play,
    pause,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
    setCurrentSongIndex,
    setVolume,
    toggleLoop,
    toggleShuffle,
    loadSongs,
    setQueue,
    toggleEQ,
    toggleSpatial,
    setEqGain,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    recentlyPlayed,
  };

  return (
    <PlayerContext.Provider value={value}>
      <div 
        style={{ 
          display: 'contents',
          // @ts-ignore
          '--player-primary': colors.primary,
          '--player-secondary': colors.secondary,
          '--player-accent': colors.accent,
        }}
      >
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
