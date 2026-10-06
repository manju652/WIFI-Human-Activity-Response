import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity as ActivityIcon, ShieldAlert, Wifi, Clock, Target, Gauge } from "lucide-react";
import type { Person, Activity } from "../types";
import { ACTIVITY_LABELS, ACTIVITY_ICONS, ACTIVITY_THEMES } from "../types";
import Humanoid from "./Humanoid";
import InstantTrigger from "./InstantTrigger";
import Waveform from "./Waveform";

export default function LiveMonitoring({ people }: { people: Person[] }) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Default to first person or fallback
  const activePerson = people.find((p) => p.person_id === selectedPersonId) || people[0] || null;

  useEffect(() => {
    if (people.length > 0 && !people.some((p) => p.person_id === selectedPersonId)) {
      setSelectedPersonId(people[0].person_id);
    }
  }, [people, selectedPersonId]);

  const activeLabelKey = (activePerson?.current_activity in ACTIVITY_LABELS 
    ? activePerson?.current_activity 
    : "empty") as Activity;

  const currentTheme = ACTIVITY_THEMES[activeLabelKey] || ACTIVITY_THEMES.empty;
  const isFall = activeLabelKey === "fall";

  return (
    <div className="space-y-5">
      {/* Top Banner: Fall Emergency Strobe if any active person is in fall state */}
      {isFall && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.35)] flex items-center justify-between gap-4 animate-alert-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/30 text-rose-300">
              <ShieldAlert size={24} className="animate-bounce" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-rose-300 tracking-wide uppercase">
                EMERGENCY FALL DETECTED · SUBJECT {activePerson?.person_id}
              </div>
              <div className="text-xs text-rose-200/80 font-mono mt-0.5">
                Neural network classified rapid downward RF phase collapse · {(activePerson?.confidence ?? 0 * 100).toFixed(1)}% confidence
              </div>
            </div>
          </div>
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-rose-500/30 text-rose-200 border border-rose-400/40">
            SAFETY PROTOCOL ACTIVE
          </div>
        </motion.div>
      )}

      {/* Hero Live Monitoring HUD */}
      {activePerson && (
        <div className={`panel p-6 relative overflow-hidden transition-all duration-500 ${
          isFall ? "glow-danger border-rose-500/50" : "glow-signal border-white/[0.12]"
        }`}>
          {/* Ambient Radial Backlight */}
          <div 
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
            style={{ background: currentTheme.color }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Column: Humanoid Vector & Activity Pose */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/[0.06] relative">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center relative mb-4 transition-all duration-500"
                style={{ 
                  background: currentTheme.bgGlow,
                  boxShadow: `0 0 40px -5px ${currentTheme.color}55`,
                  border: `1px solid ${currentTheme.borderGlow}`
                }}
              >
                <Humanoid 
                  activity={activeLabelKey} 
                  size={68} 
                  color={currentTheme.color} 
                  glow={true} 
                />

                {/* Rotating targeting reticle */}
                <div 
                  className="absolute inset-0 rounded-full border border-dashed opacity-40 animate-spin"
                  style={{ 
                    borderColor: currentTheme.color,
                    animationDuration: "14s" 
                  }}
                />
              </div>

              <div className="text-center">
                <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${currentTheme.badge}`}>
                  {ACTIVITY_LABELS[activeLabelKey]}
                </span>
                <p className="text-xs text-text-muted mt-2 font-mono">
                  {currentTheme.desc}
                </p>
              </div>
            </div>

            {/* Middle Column: Core Inference & Confidence Gauge */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-text-dim uppercase">Subject Tracked:</span>
                    <span className="text-sm font-mono font-bold text-signal">{activePerson.person_id}</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-dim">
                    LIVE RF EXTRACTION
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  <span>{ACTIVITY_LABELS[activeLabelKey]}</span>
                  <span className="text-2xl">{ACTIVITY_ICONS[activeLabelKey]}</span>
                </h3>
              </div>

              {/* Confidence Radial / Linear Progress Bar */}
              <div className="p-4 rounded-xl bg-black/30 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Gauge size={14} className="text-signal" />
                    MODEL CONFIDENCE
                  </span>
                  <span className="font-bold text-white text-sm">
                    {(activePerson.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
                  <motion.div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, Math.max(5, activePerson.confidence * 100))}%`,
                      background: isFall 
                        ? "linear-gradient(90deg, #f43f5e, #fb7185)" 
                        : "linear-gradient(90deg, #00f2fe, #8b5cf6)",
                      boxShadow: `0 0 10px ${currentTheme.color}`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-text-dim pt-0.5">
                  <span>THRESHOLD: 65.0%</span>
                  <span>PREDICTION: HIGH CERTAINTY</span>
                </div>
              </div>

              {/* Oscilloscope Stream for Active Target */}
              <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                <div className="flex items-center justify-between text-[10px] font-mono text-text-dim mb-1">
                  <span>SUBCARRIER PERTURBATION WAVE</span>
                  <span className="text-signal">LIVE INFERENCE</span>
                </div>
                <Waveform 
                  height={42} 
                  channels={3} 
                  color={currentTheme.color} 
                  seedActivity={activeLabelKey} 
                />
              </div>
            </div>

            {/* Right Column: Spatial Coordinates & Signal Telemetry */}
            <div className="lg:col-span-3 space-y-2.5">
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] space-y-1">
                <div className="text-[10px] font-mono text-text-dim uppercase flex items-center gap-1.5">
                  <Target size={12} className="text-signal" />
                  RF FIELD POSITION
                </div>
                <div className="font-mono text-sm text-white font-semibold">
                  X: {activePerson.position_x.toFixed(1)}% · Y: {activePerson.position_y.toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-text-dim">
                  Distance: ~{(Math.hypot(activePerson.position_x - 50, activePerson.position_y - 50) * 0.05 + 1.2).toFixed(2)}m from AP
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] space-y-1">
                <div className="text-[10px] font-mono text-text-dim uppercase flex items-center gap-1.5">
                  <Wifi size={12} className="text-matrix" />
                  SIGNAL METRICS
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-muted">Est. SNR:</span>
                  <span className="text-matrix font-semibold">28.4 dB</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-muted">Subcarriers:</span>
                  <span className="text-text">52 / 56 active</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] space-y-1">
                <div className="text-[10px] font-mono text-text-dim uppercase flex items-center gap-1.5">
                  <Clock size={12} className="text-warn" />
                  TELEMETRY REPLAY
                </div>
                <div className="text-xs font-mono text-text-muted">
                  Last event: {new Date(activePerson.last_seen).toLocaleTimeString()}
                </div>
                <div className="text-[10px] font-mono text-text-dim">
                  Mode: Real CSI replay
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Person Tracked Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ActivityIcon size={16} className="text-signal" />
            <h3 className="font-display text-sm font-semibold text-white tracking-wide">
              Tracked Subjects in RF Zone ({people.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-text-dim">
            Select subject to focus HUD
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <AnimatePresence>
            {people.map((p) => {
              const act = (p.current_activity in ACTIVITY_LABELS ? p.current_activity : "empty") as Activity;
              const theme = ACTIVITY_THEMES[act] || ACTIVITY_THEMES.empty;
              const isSelected = p.person_id === activePerson?.person_id;
              const subjectFall = act === "fall";

              return (
                <motion.div
                  key={p.person_id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setSelectedPersonId(p.person_id)}
                  style={{
                    borderColor: isSelected 
                      ? theme.color 
                      : subjectFall 
                        ? "rgba(244, 63, 94, 0.4)" 
                        : "rgba(255, 255, 255, 0.08)",
                  }}
                  className={`panel p-4.5 cursor-pointer relative group transition-all duration-200 ${
                    isSelected ? "bg-white/[0.04] shadow-[0_0_20px_rgba(0,242,254,0.15)]" : "hover:bg-white/[0.02]"
                  } ${subjectFall ? "glow-danger" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: theme.color }} />
                      <span className="font-mono text-sm font-bold text-white">{p.person_id}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${theme.badge}`}>
                      {(p.confidence * 100).toFixed(0)}% CONF
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: theme.bgGlow, border: `1px solid ${theme.borderGlow}` }}
                    >
                      {ACTIVITY_ICONS[act]}
                    </div>
                    <div>
                      <div className="font-display font-semibold text-sm text-white">
                        {ACTIVITY_LABELS[act]}
                      </div>
                      <div className="text-[11px] font-mono text-text-dim">
                        Pos: ({p.position_x.toFixed(0)}%, {p.position_y.toFixed(0)}%)
                      </div>
                    </div>
                  </div>

                  {/* Confidence mini bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${p.confidence * 100}%`, 
                        background: theme.color 
                      }} 
                    />
                  </div>

                  <div className="text-[10px] text-text-dim mt-2.5 font-mono flex items-center justify-between">
                    <span>Updated: {new Date(p.last_seen).toLocaleTimeString()}</span>
                    <span className="group-hover:text-signal transition-colors">Focus →</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {people.length === 0 && (
            <div className="col-span-3 panel p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-text-dim">
                <Wifi size={24} />
              </div>
              <div>
                <h4 className="font-display text-sm font-semibold text-white">No active subjects in RF sensing zone</h4>
                <p className="text-xs text-text-dim max-w-md mx-auto mt-1">
                  Start the monitoring engine in Settings or use the Instant Trigger below to simulate real held-out CSI activity events.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Instant Action Trigger */}
      <InstantTrigger people={people} onFired={() => {}} />
    </div>
  );
}
