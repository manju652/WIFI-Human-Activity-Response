import { useEffect, useState } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { api } from "../api";
import type { Statistics, ActivityEvent } from "../types";

export default function Analytics({ stats }: { stats: Statistics | null }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    api.history({ limit: 200 }).then(setEvents).catch(() => {});
  }, []);

  const confidenceTrend = [...events]
    .reverse()
    .map((e, i) => ({ 
      idx: `#${i + 1}`, 
      confidence: +(e.confidence * 100).toFixed(1),
      person: e.person_id,
      activity: e.activity
    }));

  const fallCount = stats?.total_falls ?? 0;
  const totalEvents = stats?.total_events ?? 0;
  const fallRate = totalEvents > 0 ? ((fallCount / totalEvents) * 100).toFixed(1) : "0.0";
  const avgConf = ((stats?.avg_confidence ?? 0) * 100).toFixed(1);

  // Group events by person from real event data
  const perPersonMap = events.reduce((acc, ev) => {
    acc[ev.person_id] = (acc[ev.person_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* 4 Analytics Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="TOTAL INFERENCE EVENTS" 
          value={String(totalEvents)} 
          sub="Processed by CNN-1D pipeline"
          accent="text-white"
          glow="border-white/10"
        />
        <MetricCard 
          label="FALLS DETECTED" 
          value={String(fallCount)} 
          sub="Critical safety incidents"
          accent="text-danger"
          glow={fallCount > 0 ? "border-danger/40 bg-danger/5 glow-danger" : "border-white/10"}
        />
        <MetricCard 
          label="FALL EVENT RATIO" 
          value={`${fallRate}%`} 
          sub="Percentage of total samples"
          accent="text-warn"
          glow="border-warn/30"
        />
        <MetricCard 
          label="AVERAGE CERTAINTY" 
          value={`${avgConf}%`} 
          sub="Model Softmax confidence score"
          accent="text-signal"
          glow="border-signal/30"
        />
      </div>

      {/* Confidence Trend Stream */}
      <div className="panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-signal" />
              Temporal Model Confidence Stability (Recent 200 Replay Inferences)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Fluctuations correspond to dynamic human body movement perturbations across 52 subcarriers.
            </p>
          </div>
          <span className="shimmer-badge px-2 py-0.5 rounded-full border border-signal/40 text-[9px] font-mono text-signal">
            Real Inference Scores
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={confidenceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="idx" tick={{ fill: "#64748b", fontSize: 9 }} stroke="rgba(255,255,255,0.1)" />
              <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip 
                contentStyle={{ 
                  background: "rgba(10, 14, 25, 0.95)", 
                  border: "1px solid rgba(0, 242, 254, 0.3)", 
                  borderRadius: 10,
                  fontSize: 11,
                  fontFamily: "monospace" 
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="confidence" 
                stroke="#00f2fe" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#confGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown by Tracked Person */}
      <div className="panel p-5 space-y-3">
        <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
          <BarChart3 size={16} className="text-violet" />
          Event Distribution by Subject ID
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(perPersonMap).map(([pid, count]) => (
            <div key={pid} className="p-3 rounded-xl bg-black/30 border border-white/[0.06] space-y-1">
              <span className="text-[10px] font-mono text-text-dim">SUBJECT</span>
              <div className="font-mono text-lg font-bold text-signal">{pid}</div>
              <div className="text-xs font-mono text-text-muted">{count} events recorded</div>
            </div>
          ))}
          {Object.keys(perPersonMap).length === 0 && (
            <div className="col-span-4 text-xs font-mono text-text-dim py-4">
              Awaiting events to compile per-subject analytics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, accent, glow }: { 
  label: string; 
  value: string; 
  sub: string; 
  accent: string; 
  glow: string;
}) {
  return (
    <div className={`panel p-4.5 ${glow}`}>
      <div className="text-[10px] font-mono text-text-muted tracking-wider mb-1">{label}</div>
      <div className={`font-mono text-2xl font-bold tracking-tight mb-1 ${accent}`}>{value}</div>
      <div className="text-xs text-text-dim font-sans">{sub}</div>
    </div>
  );
}
