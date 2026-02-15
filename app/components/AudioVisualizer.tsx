"use client";

import React, { useRef, useEffect } from "react";
import { usePlayer } from "@/app/context/PlayerContext";

export const AudioVisualizer: React.FC = () => {
  const { analyser, isPlaying, colors } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);

  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      if (parent) {
        // Sync internal resolution with display size
        canvas.width = parent.clientWidth;
        canvas.height = 100;
        
        // Re-initialize particles for new width
        const particles = [];
        for (let i = 0; i < 50; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: Math.random() * 0.5 - 0.25,
            speedY: Math.random() * 0.5 - 0.25,
            opacity: Math.random() * 0.5 + 0.2,
          });
        }
        particlesRef.current = particles;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw "Fluid" Waves
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = colors.primary;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const sliceWidth = width / 20;
      let x = 0;

      for (let i = 0; i < 20; i++) {
        const v = dataArray[i * 4] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) ctx.moveTo(x, height - y);
        else ctx.quadraticCurveTo(x - sliceWidth / 2, height - y, x, height - y);

        x += sliceWidth;
      }
      ctx.stroke();

      // 2. Animate Particles
      particlesRef.current.forEach((p, idx) => {
        const intensity = dataArray[idx % 10] / 255;
        
        // React to audio
        p.speedY = isPlaying ? (intensity * -2) : (Math.random() * 0.5 - 0.25);
        p.x += p.speedX;
        p.y += p.speedY;

        // Reset if out of bounds
        if (p.y < 0) p.y = height;
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + intensity), 0, Math.PI * 2);
        const opacityHex = Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = `${colors.secondary}${opacityHex}`;
        ctx.fill();
      });
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyser, isPlaying, colors]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-24 pointer-events-none"
      width={400}
      height={100}
    />
  );
};
