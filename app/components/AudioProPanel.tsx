"use client";

import React, { useState } from "react";
import { usePlayer } from "@/app/context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sliders, X, Radio } from "lucide-react";

export const AudioProPanel: React.FC = () => {
  const { eqEnabled, toggleEQ, spatialEnabled, toggleSpatial, setEqGain, colors } = usePlayer();
  const [isOpen, setIsOpen] = useState(false);

  const bands = ["Bass", "Low-Mid", "Mid", "High-Mid", "Treble"];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          backgroundColor: isOpen ? colors.primary : undefined, 
          color: isOpen ? "white" : undefined,
          boxShadow: isOpen ? `0 10px 20px -5px ${colors.primary}60` : undefined
        }}
        className={`p-3 rounded-full transition-all ${isOpen ? "" : "text-gray-400 hover:bg-white/10"}`}
        aria-label="Audio Pro Settings"
      >
        <Sliders size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-full right-0 mb-4 w-72 p-6 glass-effect dark:glass-effect-dark rounded-3xl border border-white/20 shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Audio Pro</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Spatial Audio Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Radio size={18} style={{ color: spatialEnabled ? colors.primary : "gray" }} />
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">Spatializer</div>
                    <div className="text-[10px] text-gray-500 font-medium">3D Soundstage</div>
                  </div>
                </div>
                <button
                  onClick={toggleSpatial}
                  style={{ backgroundColor: spatialEnabled ? colors.primary : undefined }}
                  className={`w-10 h-5 rounded-full transition-all relative ${spatialEnabled ? "" : "bg-gray-400/20"}`}
                >
                  <motion.div 
                    animate={{ x: spatialEnabled ? 20 : 2 }}
                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              {/* EQ Sliders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Equalizer</span>
                  <button 
                    onClick={toggleEQ}
                    style={{ color: eqEnabled ? colors.primary : undefined }}
                    className={`text-[10px] font-black uppercase tracking-widest ${eqEnabled ? "" : "text-gray-500"}`}
                  >
                    {eqEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
                
                <div className="flex justify-between items-end h-32 gap-3 px-2">
                  {bands.map((band, i) => (
                    <div key={band} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="flex-1 w-1.5 bg-gray-100 dark:bg-white/5 rounded-full relative overflow-hidden">
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="0.1"
                          defaultValue="0"
                          disabled={!eqEnabled}
                          onChange={(e) => setEqGain(i, parseFloat(e.target.value))}
                          className="absolute inset-0 w-32 h-1.5 origin-bottom-left -rotate-90 translate-y-[124px] opacity-0 cursor-pointer z-10"
                        />
                        <motion.div 
                          className={`absolute bottom-0 left-0 right-0 rounded-full ${eqEnabled ? "shadow-sm" : "bg-gray-400/20"}`}
                          style={{ 
                            height: '50%',
                            backgroundColor: eqEnabled ? colors.primary : undefined,
                            boxShadow: eqEnabled ? `0 0 10px ${colors.primary}80` : undefined
                          }}
                        />
                      </div>
                      <span className="text-[8px] font-black uppercase text-gray-400 group-hover:text-white transition-colors">{band}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Ambient Background Gradient for the panel */}
            <div 
              className="absolute -bottom-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20"
              style={{ backgroundColor: colors.primary }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
