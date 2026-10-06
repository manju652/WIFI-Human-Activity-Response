import { Activity as ActivityIcon, Clock } from "lucide-react";
import type { ActivityEvent, Activity } from "../types";
import { ACTIVITY_ICONS, ACTIVITY_LABELS, ACTIVITY_THEMES } from "../types";

export default function Timeline({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2.5">
          <ActivityIcon size={18} className="text-signal" />
          <h3 className="font-display text-sm font-semibold text-white tracking-wide">
            Live RF Event Timeline ({events.length})
          </h3>
        </div>
        <span className="text-[10px] font-mono text-text-dim">
          STREAM BUFFER: LAST 100 INFERENCES
        </span>
      </div>

      <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
        {events.length === 0 && (
          <div className="py-12 text-center text-text-dim text-xs font-mono">
            No live events buffered yet. Trigger an action or activate monitoring stream.
          </div>
        )}

        {events.map((e, idx) => {
          const act = (e.activity in ACTIVITY_LABELS ? e.activity : "empty") as Activity;
          const theme = ACTIVITY_THEMES[act] || ACTIVITY_THEMES.empty;
          const isFall = act === "fall";

          return (
            <div
              key={e.id || idx}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs font-mono ${
                isFall
                  ? "bg-rose-950/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-alert-pulse"
                  : "bg-black/20 border-white/[0.06] hover:border-white/15 text-text hover:bg-white/[0.02]"
              }`}
            >
              {/* Left Column: Timestamp & Glyph */}
              <div className="flex items-center gap-3">
                <span className="text-text-dim text-[11px] w-20 shrink-0 flex items-center gap-1">
                  <Clock size={11} className="text-text-dim" />
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>

                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: theme.bgGlow, border: `1px solid ${theme.borderGlow}` }}
                >
                  {ACTIVITY_ICONS[act]}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{e.person_id}</span>
                    <span className="text-text-dim">→</span>
                    <span className={`font-semibold ${isFall ? "text-rose-400" : "text-white"}`}>
                      {ACTIVITY_LABELS[act] || act}
                    </span>
                  </div>
                  <div className="text-[10px] text-text-dim mt-0.5">
                    Model: {e.model_used || "CNN-1D"} · {e.is_demo ? "Demo Replay Fold" : "Live Capture"}
                  </div>
                </div>
              </div>

              {/* Right Column: Confidence Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] border ${theme.badge}`}>
                    {(e.confidence * 100).toFixed(1)}% CONF
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
