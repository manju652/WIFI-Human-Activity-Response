import { useEffect, useState, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar,
} from "recharts";
import { Radio, Activity as ActivityIcon, Layers, Sliders } from "lucide-react";
import { api } from "../api";
import type { StatusInfo, CSISample, Activity } from "../types";
import { ACTIVITY_LABELS, ACTIVITY_ICONS } from "../types";

const SC_COLORS = [
  "#00f2fe", "#8b5cf6", "#10b981", "#f59e0b", 
  "#f43f5e", "#38bdf8", "#ec4899", "#a855f7"
];

export default function CSIVisualization({ status: _status }: { status: StatusInfo | null }) {
  const [sample, setSample] = useState<CSISample | null>(null);
  const [activity, setActivity] = useState<string>("walk");
  const [loading, setLoading] = useState(false);

  const load = async (act: string) => {
    setLoading(true);
    try {
      const s = await api.csiSample(act);
      setSample(s);
    } catch {
      setSample(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(activity); 
  }, [activity]);

  const traceData = sample
    ? Array.from({ length: sample.window_size }, (_, t) => {
        const row: Record<string, number> = { t };
        Object.entries(sample.traces).forEach(([k, v]) => { row[k] = +v[t]?.toFixed(2); });
        return row;
      })
    : [];

  const fftData = sample
    ? sample.fft_magnitude.map((mag, i) => ({ 
        freq: `${sample.fft_freq[i]?.toFixed(1)} Hz`, 
        mag: +mag.toFixed(2) 
      }))
    : [];

  return (
    <div className="space-y-5">
      {/* Top Banner: Real CSI Held-out Sample Provenance */}
      <div className="panel p-4 border-signal/30 flex items-center justify-between gap-4 flex-wrap bg-gradient-to-r from-signal/5 via-transparent to-violet-500/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-signal/10 border border-signal/30 flex items-center justify-center text-signal">
            <Radio size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-white">
                Channel State Information (CSI) Spectrogram
              </span>
              <span className="shimmer-badge px-2 py-0.5 rounded-full border border-signal/40 text-[9px] font-mono text-signal">
                {loading ? "Replaying Sample Fold..." : "Held-out Test Fold"}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Genuine 52-subcarrier OFDM amplitude & phase matrix from 802.11n Wi-Fi testbed.
            </p>
          </div>
        </div>

        {/* Activity Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 overflow-x-auto max-w-full">
          {(["walk", "stand", "sit", "fall", "empty"] as const).map((act) => {
            const isCurrent = activity === act;
            return (
              <button
                key={act}
                onClick={() => setActivity(act)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  isCurrent
                    ? "bg-signal/20 text-signal border border-signal/40 shadow-[0_0_12px_rgba(0,242,254,0.25)] font-semibold"
                    : "text-text-muted hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{ACTIVITY_ICONS[act]}</span>
                <span>{ACTIVITY_LABELS[act]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CSI Amplitude Subcarrier Traces */}
      <div className="panel p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div>
            <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
              <Layers size={15} className="text-signal" />
              Subcarrier Amplitude Traces (Time-Domain Modulation)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {sample 
                ? `Showing ${Object.keys(sample.traces).length} representative channels across ${sample.window_size} temporal CSI packets` 
                : "Awaiting sample stream..."}
            </p>
          </div>
          {sample && (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-text-muted">
                WINDOW: {sample.window_size} PKTS
              </span>
              <span className="px-2 py-0.5 rounded bg-signal/10 border border-signal/30 text-signal">
                TRUE: {ACTIVITY_LABELS[sample.true_label as Activity] || sample.true_label}
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        {sample && (
          <div className="flex items-center gap-3 mb-3 flex-wrap text-[10px] font-mono">
            {Object.keys(sample.traces).map((scKey, idx) => (
              <div key={scKey} className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-full" style={{ background: SC_COLORS[idx % SC_COLORS.length] }} />
                <span className="text-text-muted">{scKey}</span>
              </div>
            ))}
          </div>
        )}

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={traceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip 
                contentStyle={{ 
                  background: "rgba(10, 14, 25, 0.95)", 
                  border: "1px solid rgba(0, 242, 254, 0.3)", 
                  borderRadius: 10,
                  fontSize: 11,
                  fontFamily: "monospace",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.6)"
                }} 
              />
              {sample && Object.keys(sample.traces).map((k, i) => (
                <Line 
                  key={k} 
                  type="monotone" 
                  dataKey={k} 
                  stroke={SC_COLORS[i % SC_COLORS.length]} 
                  strokeWidth={1.8} 
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Waterfall & Doppler Spectrum Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Waterfall Spectrogram */}
        <div className="panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
                <Sliders size={15} className="text-violet" />
                CSI Waterfall Spectrogram (Time × Subcarrier)
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Subcarrier perturbation energy heatmap
              </p>
            </div>
            <span className="text-[10px] font-mono text-text-dim">
              TURBO COLOMAP
            </span>
          </div>

          {sample?.waterfall ? (
            <CanvasWaterfall data={sample.waterfall} />
          ) : (
            <div className="h-44 flex items-center justify-center text-text-dim text-xs font-mono">
              Loading waterfall matrix...
            </div>
          )}

          {/* Colorbar gradient */}
          <div className="flex items-center justify-between text-[9px] font-mono text-text-dim pt-1">
            <span>LOW RF ATTENUATION</span>
            <div className="h-1.5 w-40 rounded-full bg-gradient-to-r from-[#00f2fe] via-[#8b5cf6] to-[#f59e0b]" />
            <span>HIGH DOPPLER ENERGY</span>
          </div>
        </div>

        {/* Doppler Spectrum FFT */}
        <div className="panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
                <ActivityIcon size={15} className="text-matrix" />
                Micro-Doppler Frequency Spectrum (FFT)
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Velocity component distribution from body kinematics
              </p>
            </div>
            <span className="text-[10px] font-mono text-matrix">
              FFT PEAKS
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fftData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="freq" tick={{ fill: "#64748b", fontSize: 9 }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fill: "#64748b", fontSize: 9 }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip 
                  contentStyle={{ 
                    background: "rgba(10, 14, 25, 0.95)", 
                    border: "1px solid rgba(139, 92, 246, 0.3)", 
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace" 
                  }} 
                />
                <Bar dataKey="mag" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] font-mono text-text-dim flex items-center justify-between pt-1">
            <span>Fundamental Band: 0 - 25 Hz</span>
            <span>Reflects human torso & limb displacement velocity</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Ultra-smooth HTML5 Canvas Spectrogram using turbo-like thermal color grading
 */
function CanvasWaterfall({ data }: { data: number[][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rows = data.length;
    const cols = data[0].length;
    const flat = data.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);
    const range = max - min || 1;

    // Colormap interpolation: Cyan -> Violet -> Amber -> Red
    const getColor = (val: number): [number, number, number] => {
      const t = Math.max(0, Math.min(1, (val - min) / range));
      if (t < 0.33) {
        const u = t / 0.33;
        return [
          Math.round(0 + u * 139),
          Math.round(242 - u * 150),
          Math.round(254 - u * 8)
        ];
      } else if (t < 0.66) {
        const u = (t - 0.33) / 0.33;
        return [
          Math.round(139 + u * 106),
          Math.round(92 + u * 66),
          Math.round(246 - u * 235)
        ];
      } else {
        const u = (t - 0.66) / 0.34;
        return [
          Math.round(245 + u * -1),
          Math.round(158 - u * 95),
          Math.round(11 + u * 83)
        ];
      }
    };

    // Render on offscreen image data
    const imgData = ctx.createImageData(cols, rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = data[r][c];
        const [red, green, blue] = getColor(val);
        const idx = (r * cols + c) * 4;
        imgData.data[idx] = red;
        imgData.data[idx + 1] = green;
        imgData.data[idx + 2] = blue;
        imgData.data[idx + 3] = 255;
      }
    }

    // Draw scaled up to canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cols;
    tempCanvas.height = rows;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.putImageData(imgData, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    }
  }, [data]);

  return (
    <div className="w-full h-44 rounded-xl overflow-hidden border border-white/10 bg-black/40 p-1">
      <canvas 
        ref={canvasRef} 
        width={320} 
        height={160} 
        className="w-full h-full object-fill rounded-lg"
      />
    </div>
  );
}
