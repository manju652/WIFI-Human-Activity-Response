import { useState } from "react";
import { Zap, CheckCircle2, AlertOctagon } from "lucide-react";
import { api } from "../api";
import { ACTIVITY_LABELS, ACTIVITY_ICONS, type Activity, type Person } from "../types";
import { sound } from "../utils/sound";

const TRIGGERABLE: Activity[] = ["walk", "stand", "sit", "fall"];

export default function InstantTrigger({
  people, onFired,
}: { people: Person[]; onFired: () => void }) {
  const [personId, setPersonId] = useState<string>(people[0]?.person_id ?? "P001");
  const [busy, setBusy] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    requested: string;
    predicted: string;
    confidence: number;
    match: boolean;
  } | null>(null);

  const fire = async (activity: Activity) => {
    setBusy(activity);
    try {
      sound.playClick();
      const res = await api.trigger(personId, activity);
      const matched = res.activity === activity;
      
      setLastResult({
        requested: activity,
        predicted: res.activity,
        confidence: res.confidence,
        match: matched,
      });

      if (res.activity === "fall") {
        sound.playFallAlert();
      } else {
        sound.playActivityChime();
      }

      onFired();
    } catch {
      setLastResult(null);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="panel p-4 relative overflow-hidden border-signal/20">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-signal/10 border border-signal/30 flex items-center justify-center text-signal">
            <Zap size={13} />
          </div>
          <h3 className="font-display text-sm font-semibold tracking-wide">Instant Action Trigger</h3>
          <span className="text-[10px] text-dim font-mono hidden sm:inline">
            Held-out Real CSI → Live Neural Inference
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted uppercase">Target ID:</span>
          <select
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-signal outline-none focus:border-signal/50"
          >
            {(people.length ? people.map((p) => p.person_id) : ["P001", "P002", "P003"]).map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {TRIGGERABLE.map((act) => {
          const isBusy = busy === act;
          const isFall = act === "fall";

          return (
            <button
              key={act}
              onClick={() => fire(act)}
              disabled={busy !== null}
              style={{
                borderColor: isFall ? "rgba(244, 63, 94, 0.4)" : "rgba(255, 255, 255, 0.08)",
              }}
              className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-mono transition-all duration-200 disabled:opacity-40
                ${isFall 
                  ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]" 
                  : "bg-white/[0.03] hover:bg-white/[0.08] text-text hover:border-signal/40 hover:shadow-[0_0_16px_rgba(0,242,254,0.2)]"
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{ACTIVITY_ICONS[act]}</span>
                <span className="font-medium">{ACTIVITY_LABELS[act]}</span>
              </div>
              <span className={`text-[10px] font-mono opacity-60 group-hover:opacity-100 ${isBusy ? "animate-spin" : ""}`}>
                {isBusy ? "●" : "→"}
              </span>
            </button>
          );
        })}
      </div>

      {lastResult && (
        <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {lastResult.match ? (
              <CheckCircle2 size={13} className="text-matrix" />
            ) : (
              <AlertOctagon size={13} className="text-warn" />
            )}
            <span className="text-muted">
              Triggered <span className="text-text font-semibold">{ACTIVITY_LABELS[lastResult.requested as Activity] || lastResult.requested}</span>
            </span>
            <span className="text-dim">→</span>
            <span className="text-muted">
              Predicted: <span className="text-signal font-semibold">{ACTIVITY_LABELS[lastResult.predicted as Activity] || lastResult.predicted}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-text-muted">
              {(lastResult.confidence * 100).toFixed(0)}% conf
            </span>
          </div>
          {!lastResult.match && (
            <span className="text-[10px] text-warn font-sans">
              (Unforced model inference from real RF sample)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
