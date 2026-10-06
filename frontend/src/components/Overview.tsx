import { Users, Activity as ActivityIcon, AlertTriangle, Server, Wifi, Cpu, ShieldCheck } from "lucide-react";
import type { StatusInfo, Statistics, Activity } from "../types";
import { ACTIVITY_LABELS, ACTIVITY_ICONS, ACTIVITY_THEMES } from "../types";

export default function Overview({
  status, stats,
}: { status: StatusInfo | null; stats: Statistics | null }) {
  const isAlertActive = (status?.total_alerts ?? 0) > 0;

  const cards = [
    {
      label: "PEOPLE IN SENSING FIELD",
      value: status?.people_tracked ?? 0,
      sub: "Active subjects detected",
      icon: Users,
      color: "text-signal",
      glow: "border-signal/30 bg-signal/[0.04]",
    },
    {
      label: "TOTAL CSI EVENTS",
      value: status?.total_events ?? 0,
      sub: "Neural inferences processed",
      icon: ActivityIcon,
      color: "text-violet",
      glow: "border-violet/30 bg-violet/[0.04]",
    },
    {
      label: "SAFETY PROTOCOL",
      value: isAlertActive ? `${status?.total_alerts} INCIDENTS` : "SECURE",
      sub: isAlertActive ? "Fall event requires attention" : "Zero fall hazards detected",
      icon: isAlertActive ? AlertTriangle : ShieldCheck,
      color: isAlertActive ? "text-danger" : "text-matrix",
      glow: isAlertActive ? "border-danger/50 bg-danger/[0.06] animate-alert-pulse" : "border-matrix/30 bg-matrix/[0.04]",
    },
    {
      label: "ENGINE TELEMETRY",
      value: status?.monitoring_active ? "RUNNING" : "STANDBY",
      sub: status?.mode === "demo" ? "Replaying real CSI samples" : "Live hardware stream",
      icon: Server,
      color: status?.monitoring_active ? "text-signal" : "text-text-dim",
      glow: status?.monitoring_active ? "border-signal/30 bg-signal/[0.04]" : "border-white/10",
    },
  ];

  const totalEvents = stats?.total_events || 1;

  return (
    <div className="space-y-6">
      {/* 4 Primary Futuristic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`panel p-5 relative overflow-hidden transition-all duration-300 ${c.glow}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono tracking-widest text-text-muted">{c.label}</span>
              <c.icon size={18} className={c.color} />
            </div>
            <div className="font-mono text-2xl font-bold tracking-tight text-white mb-1">
              {c.value}
            </div>
            <div className="text-xs text-text-dim font-sans">
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Architecture Info & Activity Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Platform Topology & Inference Info */}
        <div className="lg:col-span-6 panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu size={18} className="text-signal" />
              <h3 className="font-display text-sm font-bold text-white tracking-wide">
                Neural Inference Topology
              </h3>
            </div>
            <span className="shimmer-badge px-2 py-0.5 rounded-full border border-signal/40 text-[9px] font-mono text-signal">
              Production Stack
            </span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <Row label="Inference Engine" value={status?.model_in_use ?? "CNN-1D Residual Network"} highlight />
            <Row label="Signal Processing" value="Savitzky-Golay + Wavelet Filter" />
            <Row label="OFDM Subcarriers" value="52 Active Channels (20 MHz Band)" />
            <Row label="Input Window Size" value="100 Time Packets (1.0s window)" />
            <Row label="WebSocket Uplink" value={`${status?.connected_clients ?? 0} Client Dashboard(s)`} />
            <Row label="Replay Environment" value="Held-out Test Fold (Zero Synthetics)" />
          </div>
        </div>

        {/* Right Column: Real Activity Distribution Bar Breakdown */}
        <div className="lg:col-span-6 panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <Wifi size={18} className="text-matrix" />
              <h3 className="font-display text-sm font-bold text-white tracking-wide">
                Real Dataset Activity Breakdown
              </h3>
            </div>
            <span className="text-[10px] font-mono text-text-dim">
              {stats?.total_events ?? 0} EVENTS
            </span>
          </div>

          {stats && Object.entries(stats.activity_distribution).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.activity_distribution).map(([actKey, count]) => {
                const act = actKey as Activity;
                const theme = ACTIVITY_THEMES[act] || ACTIVITY_THEMES.empty;
                const percent = ((count / totalEvents) * 100).toFixed(1);

                return (
                  <div key={actKey} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="flex items-center gap-2 text-text">
                        <span>{ACTIVITY_ICONS[act]}</span>
                        <span className="font-medium">{ACTIVITY_LABELS[act] || actKey}</span>
                      </span>
                      <span className="text-text-muted">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, background: theme.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-text-dim text-xs font-mono">
              No activity logs recorded yet. Start stream in Settings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-text-muted">{label}</span>
      <span className={highlight ? "text-signal font-semibold" : "text-white"}>{value}</span>
    </div>
  );
}
