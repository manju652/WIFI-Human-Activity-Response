import type { Person, ActivityEvent, AlertItem, StatusInfo, Statistics, CSISample } from "./types";

const BASE = (import.meta as any).env?.VITE_API_URL || "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  health: () => get<{ status: string }>("/api/health"),
  status: () => get<StatusInfo>("/api/status"),
  people: () => get<Person[]>("/api/people"),
  activities: () => get<Person[]>("/api/activities"),
  history: (params?: { person_id?: string; activity?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.person_id) q.set("person_id", params.person_id);
    if (params?.activity) q.set("activity", params.activity);
    if (params?.limit) q.set("limit", String(params.limit));
    return get<ActivityEvent[]>(`/api/activity-history?${q.toString()}`);
  },
  statistics: () => get<Statistics>("/api/statistics"),
  alerts: (resolved?: boolean) =>
    get<AlertItem[]>(`/api/alerts${resolved !== undefined ? `?resolved=${resolved}` : ""}`),
  resolveAlert: (id: number) => post<AlertItem>(`/api/alerts/${id}/resolve`),
  startMonitoring: (mode: string, interval_seconds: number) =>
    post("/api/monitoring/start", { mode, interval_seconds }),
  stopMonitoring: () => post("/api/monitoring/stop"),
  triggerActivities: () => get<{ activities: string[] }>("/api/trigger/activities"),
  trigger: (person_id: string, activity: string) =>
    post<any>("/api/trigger", { person_id, activity }),
  csiSample: (activity?: string) =>
    get<CSISample>(`/api/csi-sample${activity ? `?activity=${activity}` : ""}`),
};

export function wsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const base = BASE ? BASE.replace(/^https?/, proto) : `${proto}://${window.location.host}`;
  return `${base}/ws/activity`;
}
