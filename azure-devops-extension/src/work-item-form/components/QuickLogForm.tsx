import { useState } from "react";
import type { CreateTimeEntryPayload } from "../../shared/api";
import type { Project } from "../../shared/types";

interface Props {
  projects: Project[];
  workItemId: number | null;
  workItemTitle: string;
  onCreated: () => void;
  onCreateEntry: (payload: CreateTimeEntryPayload) => Promise<unknown>;
}

export function QuickLogForm({
  projects,
  workItemId,
  workItemTitle,
  onCreated,
  onCreateEntry,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [billable, setBillable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const totalMinutes = h * 60 + m;

    if (!projectId) {
      setError("Selecione um projeto.");
      return;
    }
    if (!description.trim()) {
      setError("Descrição é obrigatória.");
      return;
    }
    if (totalMinutes < 1) {
      setError("Informe a duração (horas e/ou minutos).");
      return;
    }
    if (totalMinutes > 1440) {
      setError("Duração máxima é 24 horas.");
      return;
    }

    setLoading(true);
    try {
      await onCreateEntry({
        projectId,
        description: description.trim(),
        date,
        duration: totalMinutes,
        billable,
        azureWorkItemId: workItemId ?? undefined,
        azureWorkItemTitle: workItemTitle || undefined,
      });
      setSuccess(true);
      setDescription("");
      setHours("");
      setMinutes("");
      setTimeout(() => {
        setSuccess(false);
        onCreated();
      }, 800);
    } catch (err) {
      console.error(err);
      setError("Erro ao registrar. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={s.form}>
      {/* Project */}
      <div style={s.row}>
        <label style={s.label}>Projeto</label>
        <select
          style={s.select}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={loading}
          required
        >
          {projects.length === 0 && (
            <option value="">Nenhum projeto disponível</option>
          )}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div style={s.row}>
        <label style={s.label}>Descrição</label>
        <input
          style={s.input}
          type="text"
          placeholder="O que você fez?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          maxLength={500}
          required
        />
      </div>

      {/* Date + Duration row */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ ...s.row, flex: 1 }}>
          <label style={s.label}>Data</label>
          <input
            style={s.input}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div style={{ ...s.row, flex: 1 }}>
          <label style={s.label}>Duração</label>
          <div style={{ display: "flex", gap: 4 }}>
            <input
              style={{ ...s.input, width: "100%" }}
              type="number"
              placeholder="h"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              disabled={loading}
            />
            <input
              style={{ ...s.input, width: "100%" }}
              type="number"
              placeholder="min"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Billable toggle */}
      <label style={s.checkRow}>
        <input
          type="checkbox"
          checked={billable}
          onChange={(e) => setBillable(e.target.checked)}
          disabled={loading}
        />
        <span style={s.checkLabel}>Faturável</span>
      </label>

      {/* Work item badge */}
      {workItemId && (
        <div style={s.wiBadge}>
          Vinculado ao work item <strong>#{workItemId}</strong>
        </div>
      )}

      {error && <div style={s.error}>{error}</div>}
      {success && <div style={s.successMsg}>✓ Registrado com sucesso!</div>}

      <button
        type="submit"
        style={loading ? { ...s.btn, opacity: 0.5 } : s.btn}
        disabled={loading || projects.length === 0}
      >
        {loading ? "Salvando…" : "Salvar Lançamento"}
      </button>
    </form>
  );
}

const s: Record<string, React.CSSProperties> = {
  form: { display: "flex", flexDirection: "column", gap: 10 },
  row: { display: "flex", flexDirection: "column", gap: 3 },
  label: {
    fontSize: 10,
    color: "var(--muted)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  select: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "7px 10px",
    color: "var(--text)",
    fontSize: 13,
    width: "100%",
  },
  input: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "7px 10px",
    color: "var(--text)",
    fontSize: 13,
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  },
  checkLabel: { fontSize: 12, color: "var(--muted)" },
  wiBadge: {
    fontSize: 11,
    color: "var(--muted)",
    background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "var(--radius)",
    padding: "5px 10px",
  },
  error: { fontSize: 12, color: "var(--red)" },
  successMsg: { fontSize: 12, color: "var(--green)", fontWeight: 600 },
  btn: {
    background: "var(--brand)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    padding: "9px 14px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    width: "100%",
  },
};
