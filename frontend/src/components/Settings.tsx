import { useState, useEffect } from "react";
import { 
  Play, Square, Volume2, Radio, 
  Terminal, Check, Info 
} from "lucide-react";
import { api } from "../api";
import type { StatusInfo } from "../types";
import { sound } from "../utils/sound";

export default function Settings({
  status, onRefresh,
}: { status: StatusInfo | null; onRefresh: () => void }) {
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [interval, setInterval_] = useState(1.5);
  const [soundOn, setSoundOn] = useState(sound.isEnabled());
  const [volume, setVolume] = useState(0.3);
  const [busy, setBusy] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>("checking...");

  useEffect(() => {
    api.health().then((h) => setHealthStatus(h.status)).catch(() => setHealthStatus("unreachable"));
  }, []);

  const start = async () => {
    sound.playClick();
    setBusy(true);
    try {
      await api.startMonitoring(mode, interval);
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    sound.playClick();
    setBusy(true);
    try {
      await api.stopMonitoring();
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleSoundToggle = (val: boolean) => {
    setSoundOn(val);
    sound.setEnabled(val);
    if (val) sound.playClick();
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    sound.setVolume(v);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Engine Control Section */}
      <div className="panel p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <Radio size={18} className="text-signal" />
            <h3 className="font-display text-sm font-bold text-white tracking-wide">
              CSI Sensing Engine Configuration
            </h3>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            status?.monitoring_active 
              ? "bg-matrix/15 text-matrix border border-matrix/30 animate-pulse" 
              : "bg-white/5 text-text-dim border border-white/10"
          }`}>
            {status?.monitoring_active ? "ENGINE ACTIVE" : "ENGINE STANDBY"}
          </span>
        </div>

        <div className="space-y-4">
          {/* Operating Mode */}
          <div>
            <label className="block text-xs font-mono text-text-muted mb-2">OPERATING MODE</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setMode("demo")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === "demo"
                    ? "bg-signal/10 border-signal/40 text-signal shadow-[0_0_15px_rgba(0,242,254,0.15)]"
                    : "bg-black/20 border-white/[0.08] text-text-muted hover:border-white/20"
                }`}
              >
                <div className="font-mono text-xs font-bold text-white mb-1 flex items-center justify-between">
                  <span>Demo Mode (Real CSI Replay)</span>
                  {mode === "demo" && <Check size={14} className="text-signal" />}
                </div>
                <div className="text-[11px] text-text-dim">
                  Replays genuine held-out CSI samples from the trained dataset fold through the live CNN model.
                </div>
              </button>

              <button
                onClick={() => setMode("live")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === "live"
                    ? "bg-warn/10 border-warn/40 text-warn shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "bg-black/20 border-white/[0.08] text-text-muted hover:border-white/20"
                }`}
              >
                <div className="font-mono text-xs font-bold text-white mb-1 flex items-center justify-between">
                  <span>Live Capture (Hardware Feed)</span>
                  {mode === "live" && <Check size={14} className="text-warn" />}
                </div>
                <div className="text-[11px] text-text-dim">
                  Awaits external CSI capture hardware (ESP32-S3, Intel 5300, Nexmon) streaming to /api/predict.
                </div>
              </button>
            </div>

            {mode === "live" && (
              <div className="mt-3 p-3 rounded-xl bg-warn/10 border border-warn/30 text-xs font-mono text-warn flex items-center gap-2">
                <Info size={16} className="shrink-0" />
                <span>Notice: Live mode requires connected CSI capture hardware streaming raw packets.</span>
              </div>
            )}
          </div>

          {/* Update Interval Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-text-muted">REPLAY UPDATE INTERVAL</span>
              <span className="text-signal font-bold text-sm">{interval.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={5.0}
              step={0.1}
              value={interval}
              onChange={(e) => setInterval_(parseFloat(e.target.value))}
              className="w-full accent-[#00f2fe] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-text-dim mt-1.5">
              <span>0.3s (Rapid burst)</span>
              <span>1.5s (Standard nominal)</span>
              <span>5.0s (Relaxed stream)</span>
            </div>
          </div>

          {/* Start / Stop Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={start}
              disabled={busy || !!status?.monitoring_active}
              className="flex-1 py-3 rounded-xl font-mono text-xs font-bold bg-signal/15 text-signal border border-signal/40 hover:bg-signal/25 hover:shadow-[0_0_20px_rgba(0,242,254,0.25)] disabled:opacity-30 transition-all flex items-center justify-center gap-2"
            >
              <Play size={15} />
              <span>Start Monitoring Engine</span>
            </button>
            <button
              onClick={stop}
              disabled={busy || !status?.monitoring_active}
              className="flex-1 py-3 rounded-xl font-mono text-xs font-bold bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)] disabled:opacity-30 transition-all flex items-center justify-center gap-2"
            >
              <Square size={15} />
              <span>Halt Engine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audio & Feedback Matrix */}
      <div className="panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <Volume2 size={18} className="text-violet" />
            <h3 className="font-display text-sm font-bold text-white tracking-wide">
              Auditory Alerts & Synthetic Feedback
            </h3>
          </div>
          <span className="text-[10px] font-mono text-text-dim">
            WEB AUDIO API
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/20 border border-white/[0.06]">
            <div>
              <div className="text-xs font-mono font-semibold text-white">Alert Siren Audio</div>
              <div className="text-[11px] text-text-dim">Synthesize emergency audio tone on fall</div>
            </div>
            <button
              onClick={() => handleSoundToggle(!soundOn)}
              className={`w-12 h-6 rounded-full relative transition-colors ${
                soundOn ? "bg-signal/40" : "bg-white/10"
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                soundOn ? "translate-x-6 left-0.5" : "left-0.5"
              }`} />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-black/20 border border-white/[0.06] space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-text-muted">Master Volume</span>
              <span className="text-signal">{(volume * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-[#8b5cf6] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => sound.playFallAlert()}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-danger/40 text-xs font-mono text-text-muted hover:text-danger transition-all"
          >
            Test Emergency Fall Siren
          </button>
          <button
            onClick={() => sound.playActivityChime()}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-signal/40 text-xs font-mono text-text-muted hover:text-signal transition-all"
          >
            Test Activity Chime
          </button>
        </div>
      </div>

      {/* Hardware Integration Guide */}
      <div className="panel p-6 space-y-3">
        <div className="flex items-center gap-2 text-white font-display text-sm font-semibold">
          <Terminal size={16} className="text-signal" />
          <span>Live Hardware Integration Protocol</span>
        </div>
        <p className="text-xs text-text-muted">
          To transition from Demo Mode to real-world live CSI sensing, flash an ESP32-S3 or Intel 5300 NIC with CSI capture firmware and stream 52-subcarrier vectors to the prediction endpoint:
        </p>

        <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.08] text-[11px] font-mono text-signal overflow-x-auto">
          <code>
            {`# Stream raw subcarrier matrix to FastAPI
curl -X POST http://localhost:8000/api/predict \\
  -H "Content-Type: application/json" \\
  -d '{"person_id": "P001", "csi_data": [[... 52 subcarriers ...]]}'`}
          </code>
        </div>
      </div>

      {/* System Diagnostics */}
      <div className="panel p-6 space-y-3">
        <h3 className="font-display text-sm font-bold text-white tracking-wide">
          Platform Diagnostics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
            <span className="text-[10px] text-text-dim">BACKEND HEALTH</span>
            <div className="text-matrix font-bold capitalize mt-0.5">{healthStatus}</div>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
            <span className="text-[10px] text-text-dim">ACTIVE MODEL</span>
            <div className="text-signal font-bold mt-0.5">{status?.model_in_use || "CNN-1D"}</div>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
            <span className="text-[10px] text-text-dim">WEBSOCKET CLIENTS</span>
            <div className="text-white font-bold mt-0.5">{status?.connected_clients ?? 0} active</div>
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
            <span className="text-[10px] text-text-dim">DATASET REPLAY</span>
            <div className="text-warn font-bold mt-0.5">Held-out Fold</div>
          </div>
        </div>
      </div>
    </div>
  );
}
