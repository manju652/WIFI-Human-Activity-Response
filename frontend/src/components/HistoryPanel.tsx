import { useEffect, useState } from "react";
import { Search, Download, History as HistoryIcon } from "lucide-react";
import { api } from "../api";
import type { ActivityEvent, Activity } from "../types";
import { ACTIVITY_LABELS, ACTIVITY_ICONS, ACTIVITY_THEMES } from "../types";
import { sound } from "../utils/sound";

export default function HistoryPanel() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [personFilter, setPersonFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.history({
        person_id: personFilter || undefined,
        activity: activityFilter || undefined,
        limit: 250,
      });
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const exportCSV = () => {
    sound.playClick();
    if (events.length === 0) return;
    const headers = ["ID", "Person ID", "Activity", "Confidence", "Timestamp", "Mode", "Model"];
    const rows = events.map((e) => [
      e.id,
      e.person_id,
      e.activity,
      (e.confidence * 100).toFixed(2),
      e.timestamp,
      e.is_demo ? "Demo" : "Live",
      e.model_used,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wifi_har_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="panel p-5 space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <HistoryIcon size={18} className="text-signal" />
          <h3 className="font-display text-sm font-semibold text-white tracking-wide">
            Activity Intelligence Audit Log ({events.length})
          </h3>
        </div>

        <button
          onClick={exportCSV}
          disabled={events.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-signal/40 text-xs font-mono text-text hover:text-signal transition-all disabled:opacity-30"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            placeholder="Search Subject ID (e.g. P001)..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-text-dim outline-none focus:border-signal/50"
          />
        </div>

        <select
          value={activityFilter}
          onChange={(e) => setActivityFilter(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-signal/50"
        >
          <option value="">All Activity Classes</option>
          {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <button
          onClick={() => { sound.playClick(); load(); }}
          className="px-4 py-2 rounded-xl bg-signal/15 text-signal border border-signal/30 hover:bg-signal/25 transition-all font-semibold"
        >
          {loading ? "Querying..." : "Apply Filter"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-black/40 text-text-dim border-b border-white/[0.08]">
            <tr>
              <th className="py-2.5 px-4 font-normal">SUBJECT</th>
              <th className="py-2.5 px-4 font-normal">ACTIVITY CLASSIFICATION</th>
              <th className="py-2.5 px-4 font-normal">CONFIDENCE</th>
              <th className="py-2.5 px-4 font-normal">TIMESTAMP</th>
              <th className="py-2.5 px-4 font-normal">DATA PROVENANCE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {events.map((e) => {
              const act = (e.activity in ACTIVITY_LABELS ? e.activity : "empty") as Activity;
              const theme = ACTIVITY_THEMES[act] || ACTIVITY_THEMES.empty;
              const isFall = act === "fall";

              return (
                <tr 
                  key={e.id} 
                  className={`hover:bg-white/[0.02] transition-colors ${
                    isFall ? "bg-rose-950/15" : ""
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.color }} />
                    {e.person_id}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${theme.badge}`}>
                      <span>{ACTIVITY_ICONS[act]}</span>
                      <span>{ACTIVITY_LABELS[act] || e.activity}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    {(e.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-text-muted">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      e.is_demo 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                        : "bg-signal/10 text-signal border border-signal/20"
                    }`}>
                      {e.is_demo ? "Demo Replay" : "Live Capture"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {events.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-text-dim">
                  No activity log entries found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
