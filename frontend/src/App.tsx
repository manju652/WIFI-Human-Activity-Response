import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import Sidebar, { type Tab } from "./components/Sidebar";
import Header from "./components/Header";
import Overview from "./components/Overview";
import LiveMonitoring from "./components/LiveMonitoring";
import ActivityDistribution from "./components/ActivityDistribution";
import Timeline from "./components/Timeline";
import CSIVisualization from "./components/CSIVisualization";
import PersonTracking from "./components/PersonTracking";
import AlertsPanel from "./components/AlertsPanel";
import HistoryPanel from "./components/HistoryPanel";
import Analytics from "./components/Analytics";
import Settings from "./components/Settings";
import { api } from "./api";
import { useActivityStream } from "./hooks/useActivityStream";
import { sound } from "./utils/sound";
import type { Person, ActivityEvent, AlertItem, StatusInfo, Statistics, WSMessage } from "./types";

const TITLES: Record<Tab, string> = {
  overview: "System Overview",
  live: "Live Activity Monitoring",
  distribution: "Activity Share & Proportions",
  timeline: "Live Activity Timeline",
  csi: "CSI Spectrogram & Doppler",
  tracking: "Tactical Person Radar",
  alerts: "Fall Detection & Safety Alerts",
  history: "Activity Audit Logs",
  analytics: "Neural Model Analytics",
  settings: "Engine Settings & Calibration",
};

export default function App() {
  const [tab, setTab] = useState<Tab>("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [s, st, p, a] = await Promise.all([
        api.status(), api.statistics(), api.people(), api.alerts(),
      ]);
      setStatus(s); setStats(st); setPeople(p); setAlerts(a);
    } catch {
      // Backend unreachable: dashboard maintains empty states gracefully
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const handleWS = useCallback((msg: WSMessage) => {
    setPeople((prev) => {
      const next = prev.filter((p) => p.person_id !== msg.person_id);
      next.push({
        person_id: msg.person_id,
        current_activity: msg.activity,
        confidence: msg.confidence,
        position_x: msg.position.x,
        position_y: msg.position.y,
        last_seen: msg.timestamp,
      });
      return next.sort((a, b) => a.person_id.localeCompare(b.person_id));
    });

    setEvents((prev) => [
      {
        id: Date.now() + Math.random(),
        person_id: msg.person_id,
        activity: msg.activity,
        confidence: msg.confidence,
        model_used: msg.model_used,
        is_demo: msg.is_demo,
        timestamp: msg.timestamp,
      },
      ...prev,
    ].slice(0, 100));

    if (msg.activity === "fall" || msg.alert) {
      sound.playFallAlert();
    }

    if (msg.alert) {
      setAlerts((prev) => [msg.alert as AlertItem, ...prev]);
    }
  }, []);

  const { connected } = useActivityStream(handleWS);

  const resolveAlert = async (id: number) => {
    await api.resolveAlert(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
  };

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const activeAlertCount = activeAlerts.length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#06080f] text-white">
      {/* Sidebar with mobile drawer support */}
      <Sidebar 
        tab={tab} 
        setTab={setTab} 
        alertCount={activeAlertCount} 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header 
          status={status} 
          wsConnected={connected} 
          title={TITLES[tab]} 
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          activeAlertCount={activeAlertCount}
        />

        {/* Global Fall Alert Banner if active falls */}
        <AnimatePresence>
          {activeAlertCount > 0 && tab !== "alerts" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-rose-600/20 border-b border-rose-500/50 px-4 sm:px-6 py-2 flex items-center justify-between gap-4 text-xs font-mono overflow-hidden"
            >
              <div className="flex items-center gap-2 text-rose-300">
                <ShieldAlert size={16} className="text-rose-400 animate-bounce" />
                <span className="font-bold">
                  {activeAlertCount} UNRESOLVED FALL INCIDENT(S) IN PROGRESS
                </span>
                <span className="hidden md:inline text-rose-200/70">
                  · Check alerts center immediately
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTab("alerts")}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/30 text-rose-200 hover:bg-rose-500/50 border border-rose-400/40 transition-colors font-bold"
                >
                  View Alerts →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {tab === "overview" && <Overview status={status} stats={stats} />}
              {tab === "live" && <LiveMonitoring people={people} />}
              {tab === "distribution" && <ActivityDistribution stats={stats} />}
              {tab === "timeline" && <Timeline events={events} />}
              {tab === "csi" && <CSIVisualization status={status} />}
              {tab === "tracking" && <PersonTracking people={people} onRefresh={refresh} />}
              {tab === "alerts" && <AlertsPanel alerts={alerts} onResolve={resolveAlert} />}
              {tab === "history" && <HistoryPanel />}
              {tab === "analytics" && <Analytics stats={stats} />}
              {tab === "settings" && <Settings status={status} onRefresh={refresh} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
