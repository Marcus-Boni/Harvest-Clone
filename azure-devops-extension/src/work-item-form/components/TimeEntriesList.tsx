import type { TimeEntry } from "../../shared/types";

interface Props {
  entries: TimeEntry[];
  onRefresh: () => void;
}

export function TimeEntriesList({ entries, onRefresh }: Props) {
  if (entries.length === 0) {
    return (
      <div style={s.empty}>
        <span>Nenhum lançamento ainda.</span>
        <button type="button" style={s.refreshBtn} onClick={onRefresh}>
          ↺ Recarregar
        </button>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.topRow}>
        <span style={s.count}>{entries.length} lançamento(s)</span>
        <button type="button" style={s.refreshBtn} onClick={onRefresh}>
          ↺
        </button>
      </div>

      <div style={s.list}>
        {entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function EntryRow({ entry }: { entry: TimeEntry }) {
  const hours = Math.floor(entry.duration / 60);
  const mins = entry.duration % 60;
  const durationLabel = mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;

  return (
    <div style={entry.isOwn ? { ...s.row, ...s.ownRow } : s.row}>
      <div style={s.dot} data-color={entry.project.color} />
      <div style={s.rowBody}>
        <div style={s.rowTitle}>{entry.description}</div>
        <div style={s.rowMeta}>
          <span style={{ color: entry.project.color }}>
            {entry.project.name}
          </span>
          {" · "}
          <span>{entry.date}</span>
          {" · "}
          <span>{entry.user.name}</span>
        </div>
      </div>
      <div
        style={{
          ...s.duration,
          color: entry.isOwn ? "var(--brand)" : "var(--muted)",
        }}
      >
        {durationLabel}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: 8 },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: { fontSize: 11, color: "var(--muted)" },
  refreshBtn: {
    background: "none",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: 13,
    padding: "2px 6px",
  },
  list: { display: "flex", flexDirection: "column", gap: 4 },
  row: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "8px 10px",
    borderRadius: "var(--radius)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
  },
  ownRow: {
    borderColor: "rgba(99,102,241,0.25)",
    background: "rgba(99,102,241,0.05)",
  },
  dot: {
    flexShrink: 0,
    width: 6,
    height: 6,
    borderRadius: "50%",
    marginTop: 5,
    background: "currentColor",
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  rowMeta: { fontSize: 11, color: "var(--muted)", marginTop: 2 },
  duration: { fontSize: 12, fontWeight: 700, flexShrink: 0 },
  empty: {
    textAlign: "center",
    color: "var(--muted)",
    fontSize: 12,
    padding: "20px 0",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "center",
  },
};
