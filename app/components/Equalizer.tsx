"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw } from "lucide-react";

interface Band {
  frequency: number;
  label: string;
  gain: number;
}

const DEFAULT_BANDS: Band[] = [
  { frequency: 60, label: "60", gain: 0 },
  { frequency: 230, label: "230", gain: 0 },
  { frequency: 910, label: "910", gain: 0 },
  { frequency: 4000, label: "4k", gain: 0 },
  { frequency: 14000, label: "14k", gain: 0 },
];

const PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0],
  "Bass Boost": [6, 4, 0, 0, 0],
  "Treble Boost": [0, 0, 0, 4, 6],
  Vocal: [-2, 0, 4, 3, 0],
  Rock: [4, 2, -1, 3, 4],
  Electronic: [4, 2, 0, 2, 5],
  Jazz: [3, 0, 2, 3, 1],
  Acoustic: [3, 1, 0, 2, 3],
};

interface EqualizerProps {
  isOpen: boolean;
  onClose: () => void;
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  filters: BiquadFilterNode[];
}

export const Equalizer: React.FC<EqualizerProps> = ({ isOpen, onClose, audioContext, sourceNode, filters }) => {
  const [bands, setBands] = useState<Band[]>(DEFAULT_BANDS.map(b => ({ ...b })));
  const [activePreset, setActivePreset] = useState("Flat");

  const handleGainChange = useCallback((index: number, gain: number) => {
    setBands(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], gain };
      return updated;
    });
    if (filters[index]) {
      filters[index].gain.value = gain;
    }
  }, [filters]);

  const applyPreset = useCallback((name: string) => {
    const gains = PRESETS[name];
    if (!gains) return;
    setActivePreset(name);
    gains.forEach((g, i) => handleGainChange(i, g));
  }, [handleGainChange]);

  const reset = () => applyPreset("Flat");

  // Save/restore EQ settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem("grovy-eq");
      if (saved) {
        const data = JSON.parse(saved) as { bands: number[]; preset: string };
        data.bands.forEach((g, i) => {
          if (filters[i]) filters[i].gain.value = g;
        });
        setBands(prev => prev.map((b, i) => ({ ...b, gain: data.bands[i] ?? 0 })));
        setActivePreset(data.preset || "Flat");
      }
    } catch {}
  }, [filters]);

  useEffect(() => {
    localStorage.setItem("grovy-eq", JSON.stringify({ bands: bands.map(b => b.gain), preset: activePreset }));
  }, [bands, activePreset]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white tracking-tight">Equalizer</h2>
              <div className="flex items-center gap-2">
                <button onClick={reset} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all" title="Reset">
                  <RotateCcw size={16} />
                </button>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(PRESETS).map((name) => (
                <button
                  key={name}
                  onClick={() => applyPreset(name)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activePreset === name
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Bands */}
            <div className="flex items-end justify-between gap-3 sm:gap-5 pt-4">
              {bands.map((band, i) => (
                <div key={band.frequency} className="flex flex-col items-center gap-3 flex-1">
                  <span className="text-[10px] font-bold text-white/30">{band.gain > 0 ? "+" : ""}{band.gain.toFixed(0)}dB</span>
                  <div className="relative h-32 sm:h-40 w-full flex items-center justify-center">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={band.gain}
                      onChange={(e) => handleGainChange(i, parseFloat(e.target.value))}
                      className="absolute h-full appearance-none bg-transparent cursor-pointer eq-slider"
                      style={{
                        writingMode: "vertical-lr" as any,
                        direction: "rtl",
                        width: "100%",
                      }}
                    />
                    <div className="absolute inset-x-0 top-1/2 h-px bg-white/10 pointer-events-none" />
                  </div>
                  <span className="text-[10px] font-bold text-white/50 uppercase">{band.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
