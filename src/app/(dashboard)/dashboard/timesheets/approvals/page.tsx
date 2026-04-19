"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, Clock, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApprovalCard } from "@/components/timesheets/ApprovalCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Timesheet } from "@/hooks/use-timesheets";
import { useTimesheetApprovals } from "@/hooks/use-timesheets";
import { formatDuration } from "@/lib/utils";

// ─── Animation variants ────────────────────────────────────────────────────────

const pageVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const groupVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const collapseVariants = {
  open: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface WeekGroup {
  key: string;
  label: string;
  dateRange: string;
  timesheets: Timesheet[];
  totalMinutes: number;
  billableMinutes: number;
}

/** Parses a period string and returns the week start date (Monday) as a Date. */
function getWeekStart(period: string): Date {
  const weekMatch = period.match(/^(\d{4})-W(\d{2})$/);
  if (weekMatch) {
    const year = parseInt(weekMatch[1]);
    const week = parseInt(weekMatch[2]);
    // ISO 8601: week 1 is the week containing the first Thursday of the year
    const jan4 = new Date(year, 0, 4);
    const jan4DayOfWeek = jan4.getDay() === 0 ? 7 : jan4.getDay();
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - (jan4DayOfWeek - 1) + (week - 1) * 7);
    return monday;
  }
  // For monthly periods, use first day of the month
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    return new Date(parseInt(monthMatch[1]), parseInt(monthMatch[2]) - 1, 1);
  }
  return new Date();
}

function formatWeekLabel(period: string): string {
  const weekMatch = period.match(/^(\d{4})-W(\d{2})$/);
  if (weekMatch) {
    const weekNum = parseInt(weekMatch[2]);
    return `Semana ${weekNum}`;
  }
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return months[parseInt(monthMatch[2]) - 1] ?? period;
  }
  return period;
}

function formatDateRange(period: string): string {
  const weekMatch = period.match(/^(\d{4})-W(\d{2})$/);
  if (weekMatch) {
    const monday = getWeekStart(period);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date): string =>
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    return `${fmt(monday)} – ${fmt(sunday)} de ${monday.getFullYear()}`;
  }
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const d = new Date(parseInt(monthMatch[1]), parseInt(monthMatch[2]) - 1, 1);
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }
  return period;
}

/** Groups timesheets by their period, sorted newest first. */
function groupByWeek(timesheets: Timesheet[]): WeekGroup[] {
  const map = new Map<string, Timesheet[]>();

  for (const ts of timesheets) {
    const group = map.get(ts.period) ?? [];
    group.push(ts);
    map.set(ts.period, group);
  }

  const groups: WeekGroup[] = Array.from(map.entries()).map(
    ([period, sheets]) => ({
      key: period,
      label: formatWeekLabel(period),
      dateRange: formatDateRange(period),
      timesheets: sheets,
      totalMinutes: sheets.reduce((acc, ts) => acc + ts.totalMinutes, 0),
      billableMinutes: sheets.reduce((acc, ts) => acc + ts.billableMinutes, 0),
    }),
  );

  // Sort newest period first
  groups.sort((a, b) => {
    const da = getWeekStart(a.key).getTime();
    const db = getWeekStart(b.key).getTime();
    return db - da;
  });

  return groups;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface WeekGroupSectionProps {
  group: WeekGroup;
  isOpen: boolean;
  onToggle: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

function WeekGroupSection({
  group,
  isOpen,
  onToggle,
  onApprove,
  onReject,
}: WeekGroupSectionProps) {
  return (
    <motion.div variants={fadeUp} className="overflow-hidden">
      {/* Week header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? "Recolher" : "Expandir"} grupo ${group.label}`}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-card/60 px-5 py-4 text-left backdrop-blur-sm transition-colors hover:border-border/70 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CalendarDays
          className="h-4 w-4 flex-shrink-0 text-orange-400"
          aria-hidden="true"
        />

        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">
              {group.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {group.dateRange}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {group.timesheets.length}{" "}
              {group.timesheets.length === 1 ? "pessoa" : "pessoas"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-mono">
              {formatDuration(group.totalMinutes)}
            </span>
          </div>
          <Badge
            variant="secondary"
            className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[11px]"
          >
            {group.timesheets.length} pendente
            {group.timesheets.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Mobile badge */}
        <Badge
          variant="secondary"
          className="sm:hidden bg-orange-500/10 text-orange-400 border-orange-500/20 text-[11px]"
        >
          {group.timesheets.length}
        </Badge>

        <motion.div
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-muted-foreground"
          aria-hidden="true"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Cards */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="cards"
            initial="closed"
            animate="open"
            exit="closed"
            variants={collapseVariants}
            className="overflow-hidden"
          >
            <motion.div
              variants={groupVariants}
              initial="hidden"
              animate="visible"
              className="mt-2 space-y-2 pl-2"
            >
              {group.timesheets.map((ts) => (
                <motion.div key={ts.id} variants={cardVariants}>
                  <ApprovalCard
                    timesheet={ts}
                    onApprove={onApprove}
                    onReject={onReject}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TimesheetApprovalsPage() {
  const {
    timesheets: approvals,
    loading,
    approveTimesheet,
    rejectTimesheet,
  } = useTimesheetApprovals();

  const pending = useMemo(
    () => approvals.filter((ts) => ts.status === "submitted"),
    [approvals],
  );

  const weekGroups = useMemo(() => groupByWeek(pending), [pending]);

  const totalMinutes = useMemo(
    () => pending.reduce((acc, ts) => acc + ts.totalMinutes, 0),
    [pending],
  );

  // Track collapsed state per group key; default all open
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleApprove = useCallback(
    async (id: string): Promise<void> => {
      try {
        await approveTimesheet(id);
        toast.success("Timesheet aprovado com sucesso.");
      } catch (error: unknown) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível aprovar o timesheet.",
        );
        throw error;
      }
    },
    [approveTimesheet],
  );

  const handleReject = useCallback(
    async (id: string, reason: string): Promise<void> => {
      try {
        await rejectTimesheet(id, reason);
        toast.success("Timesheet rejeitado com sucesso.");
      } catch (error: unknown) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível rejeitar o timesheet.",
        );
        throw error;
      }
    },
    [rejectTimesheet],
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Aprovação de Timesheets
        </h1>
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Carregando…"
            : `${pending.length} timesheet${pending.length !== 1 ? "s" : ""} aguardando aprovação${weekGroups.length > 0 ? `, distribuídos em ${weekGroups.length} semana${weekGroups.length !== 1 ? "s" : ""}` : "."}`}
        </p>
      </motion.div>

      {/* ── Summary stats ── */}
      {!loading && pending.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          <div className="rounded-xl border border-border/40 bg-card/50 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Pendentes
            </p>
            <p className="mt-1 font-mono text-xl font-semibold text-foreground">
              {pending.length}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/50 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Total de Horas
            </p>
            <p className="mt-1 font-mono text-xl font-semibold text-foreground">
              {formatDuration(totalMinutes)}
            </p>
          </div>
          <div className="col-span-2 rounded-xl border border-border/40 bg-card/50 px-4 py-3 sm:col-span-1">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Semanas
            </p>
            <p className="mt-1 font-mono text-xl font-semibold text-foreground">
              {weekGroups.length}
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div
          className="space-y-4"
          aria-label="Carregando aprovações"
          role="status"
        >
          {Array.from({ length: 2 }).map((_, gi) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <div key={gi} className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              {Array.from({ length: 2 }).map((_, ci) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                <Skeleton key={ci} className="ml-2 h-20 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      ) : pending.length === 0 ? (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-dashed border-border py-20 text-center"
        >
          <CalendarDays
            className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-muted-foreground">
            Nenhum timesheet aguardando aprovação.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Quando colaboradores submeterem seus timesheets, eles aparecerão
            aqui.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {weekGroups.map((group) => (
            <WeekGroupSection
              key={group.key}
              group={group}
              isOpen={!collapsedGroups.has(group.key)}
              onToggle={() => toggleGroup(group.key)}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
