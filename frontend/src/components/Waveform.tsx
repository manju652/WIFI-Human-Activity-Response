import { useEffect, useRef } from "react";

interface WaveformProps {
  height?: number;
  channels?: number;
  color?: string;
  active?: boolean;
  seedActivity?: string;
}

/**
 * High-tech oscilloscope multi-channel CSI wave canvas.
 * Renders simulated RF subcarrier phase and amplitude modulation
 * matching human body interference kinetic energy.
 */
export default function Waveform({
  height = 54,
  channels = 5,
  color = "#00f2fe",
  active = true,
  seedActivity = "walk",
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let destroyed = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      canvas.width = rect.width * dpr;
      canvas.height = (height || rect.height) * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const energy: Record<string, number> = { 
      empty: 0.08, 
      sit: 0.22, 
      stand: 0.18, 
      walk: 0.72, 
      fall: 1.25 
    };
    const freq: Record<string, number> = { 
      empty: 0.4, 
      sit: 0.75, 
      stand: 0.6, 
      walk: 1.85, 
      fall: 3.4 
    };

    const amp = energy[seedActivity] ?? 0.35;
    const fr = freq[seedActivity] ?? 1.0;

    const draw = () => {
      if (destroyed) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = height;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Draw faint center guide grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      for (let c = 0; c < channels; c++) {
        const laneH = h / channels;
        const midY = laneH * c + laneH / 2;
        const phase = c * 0.85;
        const localAmp = (laneH / 2) * 0.8 * amp * (0.65 + 0.35 * Math.sin(c));

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.globalAlpha = active ? Math.max(0.2, 0.9 - c * 0.12) : 0.2;
        ctx.lineWidth = c === 0 ? 2 : 1.2;

        if (active && c === 0) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = color;
        } else {
          ctx.shadowBlur = 0;
        }

        for (let x = 0; x <= w; x += 3) {
          const t = tRef.current * 0.024 * fr + x * 0.038 + phase;
          const noise = Math.sin(t * 2.8) * 0.3 + Math.sin(t * 5.3) * 0.16;
          const y = midY + Math.sin(t) * localAmp + noise * localAmp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.restore();

      if (active) tRef.current += 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [channels, color, active, seedActivity, height]);

  return <canvas ref={canvasRef} style={{ width: "100%", height, display: "block" }} />;
}
