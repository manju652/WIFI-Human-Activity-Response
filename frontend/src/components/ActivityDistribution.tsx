import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { PieChart as PieIcon, BarChart3 } from "lucide-react";
import type { Statistics, Activity } from "../types";
import { ACTIVITY_LABELS, ACTIVITY_ICONS } from "../types";

const COLORS: Record<string, string> = {
  empty: "#64748b",
  sit: "#8b5cf6",
  stand: "#f59e0b",
  walk: "#00f2fe",
  fall: "#f43f5e",
};

export default function ActivityDistribution({ stats }: { stats: Statistics | null }) {
  const data = Object.entries(stats?.activity_distribution ?? {}).map(([k, v]) => ({
    name: ACTIVITY_LABELS[k as Activity] ?? k,
    key: k,
    value: v,
    color: COLORS[k] ?? "#00f2fe",
  }));

  const totalEvents = stats?.total_events || data.reduce((acc, d) => acc + d.value, 0) || 1;

  if (data.length === 0) {
    return (
      <div className="panel p-12 text-center text-text-dim text-xs font-mono">
        No activity distribution telemetry buffered. Activate monitoring in Settings.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Activity Class Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {data.map((item) => {
          const act = item.key as Activity;
          const pct = ((item.value / totalEvents) * 100).toFixed(1);

          return (
            <div 
              key={item.key} 
              className="panel p-3.5 space-y-1.5 border-white/[0.08] hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-base">{ACTIVITY_ICONS[act]}</span>
                <span className="text-text-muted">{pct}%</span>
              </div>
              <div className="font-display font-semibold text-xs text-white truncate">
                {item.name}
              </div>
              <div className="font-mono text-sm font-bold" style={{ color: item.color }}>
                {item.value} <span className="text-[10px] text-text-dim font-normal">events</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut Chart with Center Metric */}
        <div className="panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
              <PieIcon size={16} className="text-signal" />
              Sensing Posture Share (Proportions)
            </h3>
            <span className="text-[10px] font-mono text-text-dim">
              OFDM ATTENUATION
            </span>
          </div>

          <div className="h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data} 
                  dataKey="value" 
                  nameKey="name" 
                  innerRadius={70} 
                  outerRadius={105} 
                  paddingAngle={3}
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={2}
                >
                  {data.map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: "rgba(10, 14, 25, 0.95)", 
                    border: "1px solid rgba(0, 242, 254, 0.3)", 
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace" 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono text-xl font-bold text-white">{totalEvents}</span>
              <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider">Events</span>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-violet" />
              Absolute Event Frequency by Activity
            </h3>
            <span className="text-[10px] font-mono text-text-dim">
              NEURAL INFERENCES
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip 
                  contentStyle={{ 
                    background: "rgba(10, 14, 25, 0.95)", 
                    border: "1px solid rgba(139, 92, 246, 0.3)", 
                    borderRadius: 10,
                    fontSize: 11,
                    fontFamily: "monospace" 
                  }} 
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
