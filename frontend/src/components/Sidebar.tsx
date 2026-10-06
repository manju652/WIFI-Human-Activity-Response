import {
  LayoutGrid, Activity, PieChart, ListTree, Radio, MapPin,
  AlertTriangle, History, BarChart3, Settings as SettingsIcon,
  X, Cpu, Wifi
} from "lucide-react";
import { sound } from "../utils/sound";

export type Tab =
  | "overview" | "live" | "distribution" | "timeline" | "csi"
  | "tracking" | "alerts" | "history" | "analytics" | "settings";

interface NavItem {
  id: Tab;
  label: string;
  icon: any;
  badge?: string;
  category?: string;
}

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid, category: "Core" },
  { id: "live", label: "Live Monitoring", icon: Activity, badge: "REALTIME", category: "Core" },
  { id: "tracking", label: "Spatial Radar", icon: MapPin, category: "Core" },
  { id: "csi", label: "CSI Spectrogram", icon: Radio, category: "Signal Intel" },
  { id: "distribution", label: "Activity Share", icon: PieChart, category: "Signal Intel" },
  { id: "timeline", label: "Live Event Stream", icon: ListTree, category: "Intelligence" },
  { id: "alerts", label: "Fall Safety Alerts", icon: AlertTriangle, category: "Intelligence" },
  { id: "history", label: "Activity Logs", icon: History, category: "Intelligence" },
  { id: "analytics", label: "Model Metrics", icon: BarChart3, category: "System" },
  { id: "settings", label: "Calibration & Settings", icon: SettingsIcon, category: "System" },
];

export default function Sidebar({
  tab, setTab, alertCount, isOpen = false, onClose,
}: { 
  tab: Tab; 
  setTab: (t: Tab) => void; 
  alertCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const handleSelect = (id: Tab) => {
    sound.playClick();
    setTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-50
        w-64 shrink-0 
        bg-[#090d18]/95 lg:bg-[#090d18]/70 backdrop-blur-xl
        border-r border-white/[0.08] 
        flex flex-col 
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Brand / Logo */}
        <div className="px-5 py-4.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-signal/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.25)]">
              <Wifi size={18} className="text-signal animate-pulse" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-matrix shadow-[0_0_8px_#10b981]" />
            </div>
            <div>
              <div className="font-display font-bold text-sm tracking-wider text-text flex items-center gap-1.5">
                AETHER <span className="text-signal text-[11px] font-mono px-1 py-0.2 rounded bg-signal/10 border border-signal/30">HAR</span>
              </div>
              <div className="text-[9px] text-text-dim font-mono tracking-widest uppercase">
                Wi-Fi Signal Intelligence
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button 
            onClick={onClose}
            className="lg:hidden text-text-muted hover:text-white p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV.map(({ id, label, icon: Icon, badge }) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono transition-all duration-200 relative
                  ${isActive
                    ? "bg-gradient-to-r from-signal/15 to-violet-500/10 text-signal border border-signal/30 shadow-[0_0_20px_rgba(0,242,254,0.15)] font-semibold"
                    : "text-text-muted hover:bg-white/[0.04] hover:text-text border border-transparent"}`}
              >
                <Icon size={16} className={`shrink-0 transition-colors ${isActive ? "text-signal" : "text-text-dim group-hover:text-text-muted"}`} />
                <span className="flex-1 text-left truncate">{label}</span>

                {badge && (
                  <span className="text-[9px] font-mono tracking-wider bg-signal/10 text-signal border border-signal/30 px-1.5 py-0.5 rounded-md">
                    {badge}
                  </span>
                )}

                {id === "alerts" && alertCount > 0 && (
                  <span className="text-[10px] font-mono bg-danger/20 text-danger border border-danger/40 px-1.5 py-0.2 rounded-full animate-alert-pulse">
                    {alertCount}
                  </span>
                )}

                {isActive && (
                  <div className="absolute right-0 top-2 bottom-2 w-1 rounded-l-full bg-signal shadow-[0_0_8px_#00f2fe]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* System telemetry footer */}
        <div className="p-3.5 border-t border-white/[0.08] bg-black/20 text-[10px] font-mono space-y-2">
          <div className="flex items-center justify-between text-text-dim">
            <span className="flex items-center gap-1.5">
              <Cpu size={12} className="text-signal" />
              INFERENCE CORE
            </span>
            <span className="text-text-muted">CNN-1D (98.4%)</span>
          </div>
          <div className="flex items-center justify-between text-text-dim">
            <span>RF CHANNEL</span>
            <span className="text-signal font-semibold">5.18 GHz · 52 SC</span>
          </div>
          <div className="pt-1.5 border-t border-white/[0.05] flex items-center justify-between text-[9px] text-text-dim">
            <span className="flex items-center gap-1 text-matrix">
              <span className="w-1.5 h-1.5 rounded-full bg-matrix pulse-dot" />
              ENGINE NOMINAL
            </span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
