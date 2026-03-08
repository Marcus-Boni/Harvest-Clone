import { useCallback, useEffect, useState } from "react";
import {
  createTimeEntry,
  getProjects,
  getTimer,
  getWorkItemTimeEntries,
  startTimer,
  stopTimer,
} from "../../shared/api";
import { clearCredentials } from "../../shared/auth";
import type {
  ActiveTimer,
  Project,
  WorkItemTimeData,
} from "../../shared/types";
import { QuickLogForm } from "./QuickLogForm";
import { TimeEntriesList } from "./TimeEntriesList";
import { TimerControl } from "./TimerControl";

interface Props {
  workItemId: number | null;
  workItemTitle: string;
  onLogout: () => void;
}

type Tab = "log" | "history";

export function Dashboard({ workItemId, workItemTitle, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("log");
  const [data, setData] = useState<WorkItemTimeData | null>(null);
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [timerData, projectList] = await Promise.all([
        getTimer(),
        getProjects(),
      ]);
      setTimer(timerData);
      setProjects(projectList);

      if (workItemId) {
        const wiData = await getWorkItemTimeEntries(workItemId);
        setData(wiData);
      }
      setError(null);
    } catch (err) {
      console.error("[OptSolv] refresh error:", err);
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [workItemId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function handleLogout() {
    clearCredentials();
    onLogout();
  }

  if (loading) {
    return (
      <div style={s.center}>
        <div style={s.spinner} />
      </div>
    );
  }

  const totalHours = data ? minutesToHours(data.totalMinutes) : "--";
  const myHours = data ? minutesToHours(data.myMinutes) : "--";

  return (
    <div style={s.container}>
      {/* Header row */}
      <div style={s.header}>
        <div style={s.brandRow}>
          <ClockIcon />
          <span style={s.brandName}>Time Tracker</span>
        </div>
        <button
          style={s.logoutBtn}
          type="button"
          onClick={handleLogout}
          title="Desconectar"
        >
          ✕
        </button>
      </div>

      {/* Work item title */}
      {workItemTitle && (
        <div style={s.wiTitle} title={workItemTitle}>
          {workItemTitle}
        </div>
      )}

      {error && <div style={s.errorBox}>{error}</div>}

      {/* Stats */}
      <div style={s.statsRow}>
        <Stat label="Total (item)" value={totalHours} />
        <Stat label="Minhas horas" value={myHours} />
        <Stat
          label="Timer"
          value={timer ? elapsedLabel(timer) : "--"}
          highlight={!!timer}
        />
      </div>

      {/* Timer control */}
      <TimerControl
        timer={timer}
        projects={projects}
        workItemId={workItemId}
        workItemTitle={workItemTitle}
        onStart={async (payload) => {
          await startTimer(payload);
          await refresh();
        }}
        onStop={async () => {
          await stopTimer();
          await refresh();
        }}
      />

      {/* Tabs */}
      <div style={s.tabs}>
        <button
          style={tab === "log" ? { ...s.tab, ...s.tabActive } : s.tab}
          type="button"
          onClick={() => setTab("log")}
        >
          Registrar
        </button>
        <button
          style={tab === "history" ? { ...s.tab, ...s.tabActive } : s.tab}
          type="button"
          onClick={() => setTab("history")}
        >
          Histórico {data ? `(${data.entries.length})` : ""}
        </button>
      </div>

      {tab === "log" && (
        <QuickLogForm
          projects={projects}
          workItemId={workItemId}
          workItemTitle={workItemTitle}
          onCreated={async () => {
            await refresh();
            setTab("history");
          }}
          onCreateEntry={createTimeEntry}
        />
      )}

      {tab === "history" && (
        <TimeEntriesList entries={data?.entries ?? []} onRefresh={refresh} />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={s.statCard}>
      <div style={s.statLabel}>{label}</div>
      <div
        style={{
          ...s.statValue,
          color: highlight ? "var(--brand)" : "var(--text)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6366f1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function elapsedLabel(timer: ActiveTimer): string {
  const now = Date.now();
  const start = new Date(timer.startedAt).getTime();
  const totalMs = timer.accumulatedMs + (timer.pausedAt ? 0 : now - start);
  const mins = Math.floor(totalMs / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

const s: Record<string, React.CSSProperties> = {
  container: { padding: 14, display: "flex", flexDirection: "column", gap: 12 },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 120,
  },
  spinner: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "2px solid rgba(99,102,241,0.2)",
    borderTopColor: "#6366f1",
    animation: "spin 0.8s linear infinite",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 6 },
  brandName: { fontWeight: 700, fontSize: 13, color: "var(--text)" },
  logoutBtn: {
    background: "none",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: 13,
    padding: "2px 4px",
  },
  wiTitle: {
    fontSize: 12,
    color: "var(--muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  errorBox: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "var(--radius)",
    padding: "8px 10px",
    color: "var(--red)",
    fontSize: 12,
  },
  statsRow: { display: "flex", gap: 8 },
  statCard: {
    flex: 1,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "8px 10px",
  },
  statLabel: {
    fontSize: 10,
    color: "var(--muted)",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statValue: { fontSize: 14, fontWeight: 700 },
  tabs: {
    display: "flex",
    gap: 4,
    borderBottom: "1px solid var(--border)",
    paddingBottom: 8,
  },
  tab: {
    background: "none",
    border: "none",
    padding: "4px 10px",
    borderRadius: 4,
    fontSize: 12,
    cursor: "pointer",
    color: "var(--muted)",
    fontWeight: 500,
  },
  tabActive: {
    background: "rgba(99,102,241,0.15)",
    color: "var(--brand)",
    fontWeight: 600,
  },
};
