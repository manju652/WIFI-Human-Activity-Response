import { useState, useEffect } from "react";
import { Volume2, VolumeX, Menu, Radio, ShieldAlert } from "lucide-react";
import Waveform from "./Waveform";
import type { StatusInfo } from "../types";
import { sound } from "../utils/sound";

export default function Header({
  status, 
  wsConnected, 
  title,
  onOpenMobileMenu,
  activeAlertCount = 0,
}: { 
  status: StatusInfo | null; 
  wsConnected: boolean; 
  title: string;
  onOpenMobileMenu?: () => void;
  activeAlertCount?: number;
}) {
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
    if (next) sound.playClick();
  };

  return (
    <header className="border-b border-white/[0.08] bg-[#090d18]/60 backdrop-blur-xl shrink-0">
      <div className="px-4 sm:px-6 pt-3.5 pb-2 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu + Title + Mandatory Demo Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-white"
            aria-label="Open Navigation"
          >
            <Menu size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
                {title}
              </h1>

              {/* MANDATORY PROMINENT DEMO MODE LABEL */}
              <div className="shimmer-badge px-2.5 py-0.5 rounded-full border border-signal/40 text-[10px] font-mono font-medium text-signal flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,242,254,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-signal pulse-dot" />
                <span>Demo Mode – Real CSI Sample Replay</span>
              </div>
            </div>

            <p className="text-[11px] text-text-muted mt-0.5 font-sans flex items-center gap-2">
              <span>Real held-out CSI subcarrier replay</span>
              <span className="text-white/20">·</span>
              <span className="text-text-dim">No live CSI hardware attached</span>
            </p>
          </div>
        </div>

        {/* Right Section: Telemetry Indicators & Quick Actions */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
          {/* Active Alert Counter Badge if falls detected */}
          {activeAlertCount > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-400 animate-alert-pulse">
              <ShieldAlert size={14} />
              <span className="text-[11px] font-semibold">{activeAlertCount} CRITICAL ALERT</span>
            </div>
          )}

          {/* WebSocket Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-white/[0.08]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-signal pulse-dot" : "bg-text-dim"}`}
            />
            <span className={wsConnected ? "text-signal" : "text-text-dim"}>
              {wsConnected ? "WS ONLINE" : "WS OFFLINE"}
            </span>
          </div>

          {/* Monitoring Status */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-white/[0.08]">
            <Radio size={12} className={status?.monitoring_active ? "text-matrix animate-pulse" : "text-text-dim"} />
            <span className={status?.monitoring_active ? "text-matrix font-semibold" : "text-text-dim"}>
              {status?.monitoring_active ? "STREAM ACTIVE" : "IDLE"}
            </span>
          </div>

          {/* Clock */}
          <div className="hidden xl:block text-[11px] text-text-dim px-2 py-1 rounded bg-black/20 border border-white/5">
            {time}
          </div>

          {/* Sound Mute/Unmute Button */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? "Mute alert audio" : "Enable alert audio"}
            className={`p-1.5 rounded-lg border transition-all ${
              soundEnabled 
                ? "bg-signal/10 border-signal/30 text-signal hover:bg-signal/20 shadow-[0_0_10px_rgba(0,242,254,0.2)]" 
                : "bg-white/5 border-white/10 text-text-dim hover:text-white"
            }`}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* Futuristic Oscilloscope Waveform Bar */}
      <div className="px-4 sm:px-6 pb-2 pt-1 opacity-80">
        <Waveform 
          height={38} 
          channels={4} 
          active={!!status?.monitoring_active} 
          color="#00f2fe" 
          seedActivity="walk" 
        />
      </div>
    </header>
  );
}
