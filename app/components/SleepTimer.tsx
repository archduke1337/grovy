"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, X, Moon } from "lucide-react";

interface SleepTimerProps {
  isOpen: boolean;
  onClose: () => void;
  sleepMinutes: number | null;
  onSetTimer: (minutes: number | null) => void;
}

const PRESETS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
];

export const SleepTimerModal: React.FC<SleepTimerProps> = ({ isOpen, onClose, sleepMinutes, onSetTimer }) => {
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
            className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-sm p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon size={20} className="text-blue-400" />
                <h2 className="text-xl font-black text-white tracking-tight">Sleep Timer</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            {sleepMinutes && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                <p className="text-sm font-bold text-blue-400">Timer Active</p>
                <p className="text-xs text-blue-400/60 mt-1">Playback will pause in {sleepMinutes} min</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => { onSetTimer(value); onClose(); }}
                  className={`p-3 rounded-2xl text-sm font-bold transition-all ${
                    sleepMinutes === value
                      ? "bg-blue-500 text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {sleepMinutes && (
              <button
                onClick={() => { onSetTimer(null); onClose(); }}
                className="w-full p-3 rounded-2xl bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all"
              >
                Cancel Timer
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SleepTimerButton: React.FC<{
  sleepMinutes: number | null;
  onClick: () => void;
}> = ({ sleepMinutes, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`p-2 rounded-full transition-all relative ${
      sleepMinutes
        ? "text-blue-400 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
        : "text-white/40 hover:text-white"
    }`}
    title={sleepMinutes ? `Sleep in ${sleepMinutes}m` : "Sleep Timer"}
  >
    <Timer size={20} />
    {sleepMinutes && (
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
    )}
  </motion.button>
);
