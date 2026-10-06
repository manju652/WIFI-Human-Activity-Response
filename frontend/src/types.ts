export type Activity = "empty" | "sit" | "stand" | "walk" | "fall";

export const ACTIVITY_LABELS: Record<Activity, string> = {
  empty: "No Person",
  sit: "Sitting",
  stand: "Standing",
  walk: "Walking",
  fall: "Fall Detected",
};

export const ACTIVITY_ICONS: Record<Activity, string> = {
  empty: "○",
  sit: "🪑",
  stand: "🧍",
  walk: "🚶",
  fall: "🚨",
};

export const ACTIVITY_THEMES: Record<Activity, {
  color: string;
  bgGlow: string;
  borderGlow: string;
  accent: string;
  badge: string;
  desc: string;
}> = {
  empty: {
    color: "#64748b",
    bgGlow: "rgba(100, 116, 139, 0.12)",
    borderGlow: "rgba(100, 116, 139, 0.3)",
    accent: "text-slate-400",
    badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    desc: "RF field undisturbed · Ambient baseline",
  },
  sit: {
    color: "#8b5cf6",
    bgGlow: "rgba(139, 92, 246, 0.15)",
    borderGlow: "rgba(139, 92, 246, 0.4)",
    accent: "text-violet-400",
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/25",
    desc: "Stationary seated profile · Low kinetic variance",
  },
  stand: {
    color: "#f59e0b",
    bgGlow: "rgba(245, 158, 11, 0.15)",
    borderGlow: "rgba(245, 158, 11, 0.4)",
    accent: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    desc: "Upright stationary posture · Micro-respiratory modulation",
  },
  walk: {
    color: "#00f2fe",
    bgGlow: "rgba(0, 242, 254, 0.15)",
    borderGlow: "rgba(0, 242, 254, 0.4)",
    accent: "text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
    desc: "Kinetic displacement · Periodic Doppler phase shifts",
  },
  fall: {
    color: "#f43f5e",
    bgGlow: "rgba(244, 63, 94, 0.22)",
    borderGlow: "rgba(244, 63, 94, 0.6)",
    accent: "text-rose-400",
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse",
    desc: "CRITICAL: Rapid downward RF amplitude transient collapse",
  },
};

export interface Person {
  person_id: string;
  current_activity: string;
  confidence: number;
  position_x: number;
  position_y: number;
  last_seen: string;
}

export interface ActivityEvent {
  id: number;
  person_id: string;
  activity: string;
  confidence: number;
  model_used: string;
  is_demo: boolean;
  timestamp: string;
}

export interface AlertItem {
  id: number;
  person_id: string;
  alert_type: string;
  confidence: number;
  timestamp: string;
  resolved: boolean;
}

export interface StatusInfo {
  monitoring_active: boolean;
  mode: string;
  connected_clients: number;
  model_in_use: string;
  people_tracked: number;
  total_events: number;
  total_alerts: number;
}

export interface Statistics {
  activity_distribution: Record<string, number>;
  total_events: number;
  total_falls: number;
  avg_confidence: number;
  people_count: number;
}

export interface WSMessage {
  type: "activity_update" | "alert";
  person_id: string;
  activity: string;
  confidence: number;
  model_used: string;
  position: { x: number; y: number };
  timestamp: string;
  is_demo: boolean;
  alert?: AlertItem;
  triggered_as?: string;
}

export interface CSISample {
  true_label: string;
  window_size: number;
  n_subcarriers: number;
  traces: Record<string, number[]>;
  fft_magnitude: number[];
  fft_freq: number[];
  waterfall: number[][];
}
