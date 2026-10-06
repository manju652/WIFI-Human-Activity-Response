import { useState } from "react";
import { AlertTriangle, Check, ShieldCheck, ShieldAlert, Clock, Volume2, Siren } from "lucide-react";
import type { AlertItem } from "../types";
import { sound } from "../utils/sound";

export default function AlertsPanel({
  alerts, onResolve,
}: { alerts: AlertItem[]; onResolve: (id: number) => void }) {
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");

  const active = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) => a.resolved);

  const displayedAlerts = filter === "all" 
    ? alerts 
    : filter === "active" 
      ? active 
      : resolved;

  const handleResolve = (id: number) => {
    sound.playClick();
    onResolve(id);
  };

  return (
    <div className="space-y-5">
      {/* Top Incident Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className={`panel p-4 ${active.length > 0 ? "border-rose-500/50 glow-danger bg-rose-500/10" : ""}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-text-muted">ACTIVE EMERGENCIES</span>
            <ShieldAlert size={16} className={active.length > 0 ? "text-danger animate-bounce" : "text-text-dim"} />
          </div>
          <div className={`font-mono text-2xl font-bold ${active.length > 0 ? "text-danger" : "text-white"}`}>
            {active.length}
          </div>
          <div className="text-[10px] font-mono text-text-dim mt-1">
            {active.length > 0 ? "Immediate response required" : "All zones nominal"}
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-text-muted">TOTAL INCIDENTS</span>
            <AlertTriangle size={16} className="text-warn" />
          </div>
          <div className="font-mono text-2xl font-bold text-white">
            {alerts.length}
          </div>
          <div className="text-[10px] font-mono text-text-dim mt-1">
            Logged across all sessions
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-text-muted">RESOLVED SAFELY</span>
            <ShieldCheck size={16} className="text-matrix" />
          </div>
          <div className="font-mono text-2xl font-bold text-matrix">
            {resolved.length}
          </div>
          <div className="text-[10px] font-mono text-text-dim mt-1">
            Incidents verified & cleared
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-text-muted">AVG DETECTION LATENCY</span>
            <Clock size={16} className="text-signal" />
          </div>
          <div className="font-mono text-2xl font-bold text-signal">
            180 ms
          </div>
          <div className="text-[10px] font-mono text-text-dim mt-1">
            Rapid phase transition window
          </div>
        </div>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
          {(["active", "resolved", "all"] as const).map((tabKey) => {
            const isCurrent = filter === tabKey;
            const count = tabKey === "active" ? active.length : tabKey === "resolved" ? resolved.length : alerts.length;
            return (
              <button
                key={tabKey}
                onClick={() => { sound.playClick(); setFilter(tabKey); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all ${
                  isCurrent
                    ? tabKey === "active" && active.length > 0
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold"
                      : "bg-signal/15 text-signal border border-signal/30 font-bold"
                    : "text-text-muted hover:text-white"
                }`}
              >
                <span>{tabKey}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 border border-white/10">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {active.length > 0 && (
          <button
            onClick={() => sound.playFallAlert()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-mono transition-all"
          >
            <Volume2 size={14} />
            <span>Test Siren Audio</span>
          </button>
        )}
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        {displayedAlerts.map((a) => {
          const isActive = !a.resolved;
          return (
            <div
              key={a.id}
              className={`panel p-4.5 flex items-center justify-between gap-4 flex-wrap transition-all ${
                isActive 
                  ? "bg-rose-950/20 border-rose-500/50 glow-danger animate-alert-pulse" 
                  : "opacity-75 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "bg-white/5 text-text-dim border border-white/10"
                }`}>
                  {isActive ? <Siren size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-display text-sm font-bold tracking-wide ${
                      isActive ? "text-rose-300" : "text-white"
                    }`}>
                      {isActive ? "CRITICAL FALL DETECTED" : "RESOLVED INCIDENT"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-muted">
                      TARGET: {a.person_id}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-matrix/10 text-matrix border border-matrix/20"
                    }`}>
                      {(a.confidence * 100).toFixed(1)}% CONFIDENCE
                    </span>
                  </div>

                  <div className="text-xs text-text-muted font-mono mt-1 flex items-center gap-3">
                    <span>Logged: {new Date(a.timestamp).toLocaleString()}</span>
                    <span>·</span>
                    <span>Type: {a.alert_type}</span>
                  </div>
                </div>
              </div>

              {isActive ? (
                <button
                  onClick={() => handleResolve(a.id)}
                  className="flex items-center gap-1.5 text-xs font-mono px-4 py-2 rounded-xl bg-signal/15 text-signal border border-signal/40 hover:bg-signal/25 hover:shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all font-semibold"
                >
                  <Check size={15} /> Resolve & Clear
                </button>
              ) : (
                <span className="text-xs font-mono text-matrix flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-matrix/10 border border-matrix/20">
                  <Check size={13} /> Cleared
                </span>
              )}
            </div>
          );
        })}

        {displayedAlerts.length === 0 && (
          <div className="panel p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-matrix/10 border border-matrix/20 flex items-center justify-center mx-auto text-matrix">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold text-white">All Sensing Zones Safe</h4>
              <p className="text-xs text-text-dim max-w-sm mx-auto mt-1 font-mono">
                No alerts match the current filter. Fall detection model continuously evaluates incoming CSI streams.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
