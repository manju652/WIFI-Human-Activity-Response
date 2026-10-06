import { useCallback, useState } from "react";
import { Compass, Crosshair } from "lucide-react";
import type { Person, Activity } from "../types";
import { ACTIVITY_LABELS, ACTIVITY_THEMES } from "../types";
import Humanoid from "./Humanoid";
import InstantTrigger from "./InstantTrigger";

export default function PersonTracking({
  people, onRefresh,
}: { people: Person[]; onRefresh: () => void }) {
  const [hoveredPerson, setHoveredPerson] = useState<Person | null>(null);

  const refresh = useCallback(() => {
    setTimeout(onRefresh, 400);
  }, [onRefresh]);

  return (
    <div className="space-y-5">
      {/* Tactical Radar HUD Header */}
      <div className="panel p-4 border-signal/20 flex items-center justify-between gap-4 flex-wrap bg-gradient-to-r from-signal/5 via-transparent to-violet-500/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-signal/10 border border-signal/30 flex items-center justify-center text-signal">
            <Compass size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold text-white">
                Tactical RF Sensing Field (Spatial Radar)
              </h3>
              <span className="shimmer-badge px-2 py-0.5 rounded-full border border-signal/40 text-[9px] font-mono text-signal">
                CSI Angle & Attenuation
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Approximate subject position derived from subcarrier path loss and multi-antenna phase difference.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-matrix">
            <span className="w-1.5 h-1.5 rounded-full bg-matrix pulse-dot" />
            <span>RADAR ACTIVE</span>
          </div>
          <div className="text-text-dim text-[11px]">
            FIELD: 6.0m × 4.5m
          </div>
        </div>
      </div>

      {/* Main Radar Screen Container */}
      <div className="panel p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-xs font-mono text-text-dim">
          <div className="flex items-center gap-2">
            <Crosshair size={13} className="text-signal" />
            <span>AP NODE: 5.18 GHz MIMO TRANSCEIVER (50%, 4%)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-matrix/80" /> Rx SENSOR (50%, 96%)
            </span>
            <span className="text-text-muted">SWEEP RATE: 13.3 RPM</span>
          </div>
        </div>

        {/* The 2D Tactical Grid */}
        <div className="relative w-full aspect-[16/9] max-h-[520px] rounded-2xl border border-signal/30 bg-[#04060b] scanline-bg overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]">
          {/* Subtle Cyber Grid */}
          <div className="absolute inset-0 cyber-grid opacity-60" />

          {/* Radar Circles and Crosshairs */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Concentric Distance Range Rings */}
            {[18, 32, 46].map((r, i) => (
              <g key={r}>
                <ellipse 
                  cx="50" 
                  cy="50" 
                  rx={r} 
                  ry={r * 0.56} 
                  fill="none" 
                  stroke="#00f2fe" 
                  strokeOpacity={0.16} 
                  strokeWidth={0.35} 
                  strokeDasharray="2 2"
                />
                <text 
                  x={50 + r + 0.8} 
                  y="51.5" 
                  fill="#00f2fe" 
                  fillOpacity={0.4} 
                  fontSize="2.2" 
                  fontFamily="monospace"
                >
                  {(i + 1) * 1.2}m
                </text>
              </g>
            ))}

            {/* Crosshairs */}
            <line x1="50" y1="2" x2="50" y2="98" stroke="#00f2fe" strokeOpacity={0.12} strokeWidth={0.3} />
            <line x1="2" y1="50" x2="98" y2="50" stroke="#00f2fe" strokeOpacity={0.12} strokeWidth={0.3} />
            <line x1="12" y1="20" x2="88" y2="80" stroke="#00f2fe" strokeOpacity={0.06} strokeWidth={0.2} strokeDasharray="1 3" />
            <line x1="12" y1="80" x2="88" y2="20" stroke="#00f2fe" strokeOpacity={0.06} strokeWidth={0.2} strokeDasharray="1 3" />

            {/* Room Zone Demarcation */}
            <rect x="5" y="8" width="42" height="38" fill="none" stroke="#8b5cf6" strokeOpacity={0.12} strokeWidth={0.3} strokeDasharray="2 2" />
            <rect x="53" y="8" width="42" height="38" fill="none" stroke="#f59e0b" strokeOpacity={0.12} strokeWidth={0.3} strokeDasharray="2 2" />
            <rect x="5" y="54" width="90" height="38" fill="none" stroke="#10b981" strokeOpacity={0.12} strokeWidth={0.3} strokeDasharray="2 2" />

            <text x="7" y="13" fill="#8b5cf6" fillOpacity={0.5} fontSize="2.2" fontFamily="monospace">ZONE A: ENTRYWAY</text>
            <text x="55" y="13" fill="#f59e0b" fillOpacity={0.5} fontSize="2.2" fontFamily="monospace">ZONE B: LIVING / LOUNGE</text>
            <text x="7" y="59" fill="#10b981" fillOpacity={0.5} fontSize="2.2" fontFamily="monospace">ZONE C: REST / SLEEP</text>
          </svg>

          {/* Wi-Fi AP Transmitter Node */}
          <div className="absolute top-[3%] left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-signal shadow-[0_0_12px_#00f2fe]" />
              <span className="absolute w-6 h-6 rounded-full border border-signal/40 animate-ping" />
            </div>
            <span className="mt-1 text-[8px] font-mono text-signal bg-black/60 px-1 rounded border border-signal/30">
              Wi-Fi AP (Tx)
            </span>
          </div>

          {/* Wi-Fi Rx Receiver Node */}
          <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-matrix shadow-[0_0_10px_#10b981]" />
            <span className="mt-1 text-[8px] font-mono text-matrix bg-black/60 px-1 rounded border border-matrix/30">
              CSI Sensor (Rx)
            </span>
          </div>

          {/* Animated Sweeping Radar Beam */}
          <div className="absolute inset-0 origin-center radar-sweep pointer-events-none">
            <div
              className="absolute top-1/2 left-1/2 w-1/2 h-[350px] -translate-y-1/2 origin-left pointer-events-none"
              style={{
                background: "conic-gradient(from 0deg, rgba(0,242,254,0.3) 0deg, rgba(0,242,254,0.06) 40deg, transparent 75deg)",
              }}
            />
          </div>

          {/* Tracked Subjects Blips & Humanoid Markers */}
          {people.map((p) => {
            const act = (p.current_activity in ACTIVITY_LABELS ? p.current_activity : "empty") as Activity;
            const theme = ACTIVITY_THEMES[act] || ACTIVITY_THEMES.empty;
            const isFall = act === "fall";
            const isHovered = hoveredPerson?.person_id === p.person_id;

            return (
              <div
                key={p.person_id}
                onMouseEnter={() => setHoveredPerson(p)}
                onMouseLeave={() => setHoveredPerson(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all duration-700 ease-out z-20 group"
                style={{ left: `${p.position_x}%`, top: `${p.position_y}%` }}
              >
                {/* Outer Pulse Rings */}
                <div className="relative flex items-center justify-center">
                  <span
                    className={`absolute rounded-full transition-all duration-300 ${
                      isFall 
                        ? "w-14 h-14 bg-rose-500/30 border border-rose-500 animate-ping" 
                        : "w-10 h-10 bg-cyan-500/10 border border-cyan-400/30 group-hover:scale-125"
                    }`}
                  />

                  {/* Main Blip Container */}
                  <div
                    className={`rounded-xl p-1.5 transition-all duration-300 flex items-center justify-center ${
                      isFall ? "pulse-dot bg-rose-500/30 border border-rose-400" : "bg-black/80 border"
                    }`}
                    style={{
                      borderColor: theme.color,
                      boxShadow: `0 0 20px ${theme.color}88`,
                    }}
                  >
                    <Humanoid activity={act} size={28} color={theme.color} glow={true} />
                  </div>
                </div>

                {/* Subject Badge */}
                <div 
                  className={`mt-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-mono whitespace-nowrap transition-all ${
                    isFall
                      ? "bg-rose-950/90 border-rose-500 text-rose-300 font-bold shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                      : "bg-[#090d18]/90 border-white/10 text-white group-hover:border-signal/50"
                  }`}
                >
                  <span className="font-bold">{p.person_id}</span> · {ACTIVITY_LABELS[act]} ({(p.confidence * 100).toFixed(0)}%)
                </div>

                {/* Hover Tooltip Popup */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 w-48 p-2.5 rounded-xl bg-black/95 border border-signal/50 shadow-[0_0_25px_rgba(0,0,0,0.8)] text-[10px] font-mono space-y-1 pointer-events-none z-30">
                    <div className="flex justify-between border-b border-white/10 pb-1 font-bold text-signal">
                      <span>SUBJECT {p.person_id}</span>
                      <span>{(p.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>Field Position:</span>
                      <span className="text-white">({p.position_x.toFixed(1)}%, {p.position_y.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>Pose State:</span>
                      <span className="text-white">{ACTIVITY_LABELS[act]}</span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>Updated:</span>
                      <span className="text-text-dim">{new Date(p.last_seen).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {people.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-dim text-xs font-mono space-y-2 pointer-events-none">
              <Crosshair size={28} className="text-signal/40 animate-pulse" />
              <span>RADAR SCANNING: NO ACTIVE TARGETS DETECTED IN ZONE</span>
              <span className="text-[10px] text-text-dim">Trigger an action below to populate targets</span>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Action Trigger for testing radar movements */}
      <InstantTrigger people={people} onFired={refresh} />
    </div>
  );
}
