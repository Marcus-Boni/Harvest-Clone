# Time Page Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the time registration page to remove the summary card, default to week view with drag & drop, add week submission, standardize buttons, and persist user preferences.

**Architecture:** Remove the summary card section from TimePage, restructure the header with static title + tabs + single button. Add @dnd-kit drag & drop to WeekView's inline entry elements with a context menu for move/duplicate. Add "Submit Week" button in WeekView header using the existing timesheet API. Persist preferences in localStorage via a utility module.

**Tech Stack:** Next.js 16, React 19, TypeScript, @dnd-kit/core, date-fns, Zustand, Radix UI, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-23-time-page-refactor-design.md`

---

### Task 1: Create time-preferences utility module

**Files:**
- Create: `src/lib/time-preferences.ts`

- [ ] **Step 1: Create the preferences utility**

```typescript
// src/lib/time-preferences.ts

export type TimeView = "day" | "week" | "month";
export type SubmitMode = "close" | "continue";

export interface TimePreferences {
  defaultView: TimeView;
  lastProjectId: string | null;
  defaultBillable: boolean;
  defaultDuration: number;
  submitMode: SubmitMode;
}

const STORAGE_KEY = "harvest:time-preferences";

const DEFAULTS: TimePreferences = {
  defaultView: "week",
  lastProjectId: null,
  defaultBillable: true,
  defaultDuration: 60,
  submitMode: "close",
};

export function getTimePreferences(): TimePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveTimePreference<K extends keyof TimePreferences>(
  key: K,
  value: TimePreferences[K],
): void {
  try {
    const current = getTimePreferences();
    current[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // localStorage unavailable — silently ignore
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/time-preferences.ts
git commit -m "feat: add time-preferences localStorage utility"
```

---

### Task 2: Refactor TimePage — remove summary card, restructure header, default to week

**Files:**
- Modify: `src/app/(dashboard)/dashboard/time/page.tsx`

This is the largest single task. It removes the summary card (badges, capacity bars, redundant buttons), restructures the header, and wires up preferences.

- [ ] **Step 1: Update imports**

Remove unused imports and add new ones. In `src/app/(dashboard)/dashboard/time/page.tsx`:

Remove these imports:
- `ClipboardPlus, Copy` from lucide-react (line 13)
- `DailyCapacityBar` (line 15)
- `WeeklyCapacityBar` (line 21)
- `Badge` (line 23)
- `useCapacity` (line 26)
- `formatDuration` (line 33)
- `isToday` (line 7)

Add new imports:
```typescript
import { Plus } from "lucide-react";
import { getISOWeek, getISOWeekYear } from "date-fns";
import { getTimePreferences, saveTimePreference } from "@/lib/time-preferences";
import { useTimesheets } from "@/hooks/use-timesheets";
```

Keep existing imports: `endOfISOWeek, endOfMonth, format, startOfISOWeek, startOfMonth` from date-fns, `ptBR`, `motion`, React hooks, `DayView`, `MonthView`, `TimeEntryForm`, `TimerWidget`, `TimeViewTabs`, `WeekView`, `Button`, `Skeleton`, `useTimeEntries`, `useSession`, `useUIStore`, `getEventDurationMinutes`, `OutlookEvent`.

- [ ] **Step 2: Remove getViewSummary function**

Delete the entire function at lines 63-86.

- [ ] **Step 3: Update state initialization to use preferences**

Replace line 97:
```typescript
// OLD:
const [activeView, setActiveView] = useState<TimeView>("day");

// NEW:
const [activeView, setActiveView] = useState<TimeView>(() => {
  if (typeof window === "undefined") return "week";
  return getTimePreferences().defaultView;
});
```

- [ ] **Step 4: Add view preference persistence**

Add a `handleViewChange` callback and use it instead of `setActiveView` in the JSX:
```typescript
const handleViewChange = useCallback((view: TimeView) => {
  setActiveView(view);
  saveTimePreference("defaultView", view);
}, []);
```

- [ ] **Step 5: Remove capacity hook and related state**

Remove the entire `useCapacity` block (lines 129-136) and the `capacityLoading`/`capacity` variables. Remove `refetchCapacity` calls from `handleUpdate` and `handleDelete`. Remove `dailyTargetMinutes` calculation (line 176), `selectedDayMinutes` calculation (lines 170-173), `selectedDayEntries` (lines 166-169), `latestEntry` (line 174), and `viewSummary` (line 175).

Keep `latestEntry` but simplify to: `const latestEntry = entries[0];` (used by `openCreate` for default project).

Keep `dailyTargetMinutes` but move it to: `const dailyTargetMinutes = Math.round((weeklyCapacityHours * 60) / 5);` (still needed by WeekView/MonthView).

- [ ] **Step 6: Add timesheet state for week submission**

Add after the `useTimeEntries` hook:
```typescript
const { getOrCreateTimesheet, submitTimesheet } = useTimesheets();
const [weekTimesheet, setWeekTimesheet] = useState<{
  id: string;
  status: string;
  totalMinutes: number;
} | null>(null);

// Fetch timesheet for current week when in week view
useEffect(() => {
  if (activeView !== "week") {
    setWeekTimesheet(null);
    return;
  }
  const ws = startOfISOWeek(selectedDate);
  const period = `${getISOWeekYear(ws)}-W${getISOWeek(ws).toString().padStart(2, "0")}`;

  getOrCreateTimesheet(period, "weekly")
    .then((ts) => setWeekTimesheet({ id: ts.id, status: ts.status, totalMinutes: ts.totalMinutes }))
    .catch(() => setWeekTimesheet(null));
}, [activeView, selectedDate, getOrCreateTimesheet]);
```

- [ ] **Step 7: Add move/duplicate handlers for drag & drop**

```typescript
const handleMoveEntry = useCallback(
  async (entryId: string, newDate: string) => {
    await updateEntry(entryId, { date: newDate });
  },
  [updateEntry],
);

const handleDuplicateEntry = useCallback(
  async (entryId: string, newDate: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    const res = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: entry.projectId,
        description: entry.description,
        date: newDate,
        duration: entry.duration,
        billable: entry.billable,
        azureWorkItemId: entry.azureWorkItemId,
        azureWorkItemTitle: entry.azureWorkItemTitle,
      }),
    });
    if (!res.ok) throw new Error("Failed to duplicate");
    dispatchTimeEntriesUpdated();
  },
  [entries],
);

const handleSubmitWeek = useCallback(async () => {
  if (!weekTimesheet) return;
  await submitTimesheet(weekTimesheet.id);
  // Refresh timesheet status
  const ws = startOfISOWeek(selectedDate);
  const period = `${getISOWeekYear(ws)}-W${getISOWeek(ws).toString().padStart(2, "0")}`;
  const ts = await getOrCreateTimesheet(period, "weekly");
  setWeekTimesheet({ id: ts.id, status: ts.status, totalMinutes: ts.totalMinutes });
}, [weekTimesheet, submitTimesheet, selectedDate, getOrCreateTimesheet]);
```

Add import for `dispatchTimeEntriesUpdated`:
```typescript
import { dispatchTimeEntriesUpdated } from "@/lib/time-events";
```

- [ ] **Step 8: Rewrite the JSX — replace summary card with clean header**

Replace the entire first `<motion.section>` block (lines 279-371 approximately) with:

```tsx
<motion.section variants={itemVariants}>
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Registro de Tempo
      </h1>
    </div>
    <Button
      className="rounded-full bg-brand-500 text-white hover:bg-brand-600"
      onClick={() => openCreate()}
    >
      <Plus className="mr-2 h-4 w-4" />
      Novo registro
    </Button>
  </div>
  <div className="mt-3">
    <TimeViewTabs activeView={activeView} onViewChange={handleViewChange} />
  </div>
</motion.section>
```

- [ ] **Step 9: Update WeekView props in the JSX**

Replace the WeekView render block with:
```tsx
<WeekView
  entries={entries}
  referenceDate={selectedDate}
  onReferenceDateChange={setSelectedDate}
  dailyTargetMinutes={dailyTargetMinutes}
  onDayClick={handleDayClick}
  onOpenCreate={() => openCreate()}
  onOpenCreateForDate={(date) =>
    openCreate({ date: format(date, "yyyy-MM-dd") })
  }
  onMoveEntry={handleMoveEntry}
  onDuplicateEntry={handleDuplicateEntry}
  onSubmitWeek={handleSubmitWeek}
  weekTimesheetStatus={weekTimesheet?.status ?? null}
  weekEntryCount={entries.filter((e) => {
    const ws = format(startOfISOWeek(selectedDate), "yyyy-MM-dd");
    const we = format(endOfISOWeek(selectedDate), "yyyy-MM-dd");
    return e.date >= ws && e.date <= we;
  }).length}
  weekTotalMinutes={weekTimesheet?.totalMinutes ?? undefined}
/>
```

- [ ] **Step 10: Remove TimerWidget refetchCapacity dependency**

In the TimerWidget `onEntrySaved` callback, remove `refetchCapacity()`:
```tsx
<TimerWidget
  projects={projects}
  onEntrySaved={() => {
    refetch();
  }}
/>
```

- [ ] **Step 11: Commit**

```bash
git add src/app/(dashboard)/dashboard/time/page.tsx
git commit -m "feat: refactor TimePage — remove summary card, restructure header, default to week view"
```

---

### Task 3: Install @dnd-kit dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install @dnd-kit/core @dnd-kit/utilities
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit/core and @dnd-kit/utilities"
```

---

### Task 4: Create DragDropContextMenu component

**Files:**
- Create: `src/components/time/DragDropContextMenu.tsx`

- [ ] **Step 1: Create the context menu component**

```tsx
// src/components/time/DragDropContextMenu.tsx
"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, Copy } from "lucide-react";
import { useEffect, useRef } from "react";

interface DragDropContextMenuProps {
  targetDate: Date;
  position: { x: number; y: number };
  onMove: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

export function DragDropContextMenu({
  targetDate,
  position,
  onMove,
  onDuplicate,
  onClose,
}: DragDropContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const dayLabel = format(targetDate, "EEEE", { locale: ptBR });

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg"
      style={{ left: position.x, top: position.y }}
    >
      <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {dayLabel}
      </div>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition hover:bg-accent"
        onClick={() => { onMove(); onClose(); }}
      >
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        Mover para {dayLabel}
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition hover:bg-accent"
        onClick={() => { onDuplicate(); onClose(); }}
      >
        <Copy className="h-4 w-4 text-muted-foreground" />
        Duplicar em {dayLabel}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/time/DragDropContextMenu.tsx
git commit -m "feat: add DragDropContextMenu component for drag & drop actions"
```

---

### Task 5: Add drag & drop and submit week to WeekView

**Files:**
- Modify: `src/components/time/WeekView.tsx`

This is the most complex task. Adds DndContext, draggable entries, droppable columns, DragOverlay, context menu, and the submit week button.

- [ ] **Step 1: Update imports and props interface**

Replace imports section:
```typescript
"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  addWeeks,
  eachDayOfInterval,
  endOfISOWeek,
  format,
  isToday,
  startOfISOWeek,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Plus, Send } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DragDropContextMenu } from "@/components/time/DragDropContextMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TimeEntry } from "@/hooks/use-time-entries";
import { cn, formatDuration } from "@/lib/utils";
```

Update the props interface:
```typescript
interface WeekViewProps {
  entries: TimeEntry[];
  referenceDate: Date;
  onReferenceDateChange: (date: Date) => void;
  dailyTargetMinutes: number;
  onDayClick: (date: Date) => void;
  onOpenCreate: () => void;
  onOpenCreateForDate?: (date: Date) => void;
  onMoveEntry?: (entryId: string, newDate: string) => Promise<void>;
  onDuplicateEntry?: (entryId: string, newDate: string) => Promise<void>;
  onSubmitWeek?: () => Promise<void>;
  weekTimesheetStatus?: string | null;
  weekEntryCount?: number;
  weekTotalMinutes?: number;
}
```

- [ ] **Step 2: Add drag & drop state and sensors inside the component**

After prop destructuring, add:
```typescript
const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
const [contextMenu, setContextMenu] = useState<{
  entryId: string;
  targetDate: Date;
  position: { x: number; y: number };
} | null>(null);
const [confirmSubmit, setConfirmSubmit] = useState(false);
const [submitting, setSubmitting] = useState(false);

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  useSensor(KeyboardSensor),
);

const isEntryDraggable = useCallback((entry: TimeEntry) => {
  const status = entry.timesheet?.status;
  return !status || status === "open" || status === "rejected";
}, []);

const handleDragStart = useCallback(
  (event: DragStartEvent) => {
    const entryId = event.active.id as string;
    const entry = entries.find((e) => e.id === entryId);
    if (entry) setActiveEntry(entry);
  },
  [entries],
);

const handleDragEnd = useCallback(
  (event: DragEndEvent) => {
    setActiveEntry(null);
    const { active, over } = event;
    if (!over) return;

    const entryId = active.id as string;
    const targetDateStr = over.id as string;
    const entry = entries.find((e) => e.id === entryId);
    if (!entry || entry.date === targetDateStr) return;

    // Find the drop position for the context menu
    const targetDay = days.find(
      (d) => format(d, "yyyy-MM-dd") === targetDateStr,
    );
    if (!targetDay) return;

    // Get the droppable element's position
    const el = document.querySelector(`[data-droppable-id="${targetDateStr}"]`);
    const rect = el?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 - 90 : event.activatorEvent instanceof MouseEvent ? event.activatorEvent.clientX : 0;
    const y = rect ? rect.top + 40 : event.activatorEvent instanceof MouseEvent ? event.activatorEvent.clientY : 0;

    setContextMenu({
      entryId,
      targetDate: targetDay,
      position: { x, y },
    });
  },
  [entries, days],
);

const handleMove = useCallback(async () => {
  if (!contextMenu || !onMoveEntry) return;
  try {
    await onMoveEntry(contextMenu.entryId, format(contextMenu.targetDate, "yyyy-MM-dd"));
    toast.success("Registro movido com sucesso");
  } catch {
    toast.error("Erro ao mover registro");
  }
}, [contextMenu, onMoveEntry]);

const handleDuplicate = useCallback(async () => {
  if (!contextMenu || !onDuplicateEntry) return;
  try {
    await onDuplicateEntry(contextMenu.entryId, format(contextMenu.targetDate, "yyyy-MM-dd"));
    toast.success("Registro duplicado com sucesso");
  } catch {
    toast.error("Erro ao duplicar registro");
  }
}, [contextMenu, onDuplicateEntry]);

const handleSubmitWeekClick = useCallback(async () => {
  if (!onSubmitWeek) return;
  setSubmitting(true);
  try {
    await onSubmitWeek();
    toast.success("Semana submetida com sucesso!");
    setConfirmSubmit(false);
  } catch {
    toast.error("Erro ao submeter semana");
  } finally {
    setSubmitting(false);
  }
}, [onSubmitWeek]);
```

- [ ] **Step 3: Replace the JSX return with DndContext wrapper and droppable columns**

The full return block becomes:

```tsx
return (
  <section className="overflow-hidden rounded-[28px] border border-border/60 bg-card/90 shadow-sm">
    {/* Header */}
    <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => onReferenceDateChange(subWeeks(referenceDate, 1))}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => onReferenceDateChange(addWeeks(referenceDate, 1))}
            aria-label="Próxima semana"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => onReferenceDateChange(new Date())}
          >
            Semana atual
          </Button>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            {format(weekStart, "d MMM", { locale: ptBR })} -{" "}
            {format(weekEnd, "d MMM yyyy", { locale: ptBR })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Arraste registros entre dias para mover ou duplicar.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Badge className="rounded-full bg-brand-500/10 px-3 py-1.5 text-brand-500">
          {formatDuration(weekTotalMinutes)} na semana
        </Badge>

        {/* Submit Week Button / Status Badge */}
        {weekTimesheetStatus === "submitted" ? (
          <Badge variant="outline" className="rounded-full px-3 py-1.5 text-amber-600 border-amber-300">
            Submetida
          </Badge>
        ) : weekTimesheetStatus === "approved" ? (
          <Badge variant="outline" className="rounded-full px-3 py-1.5 text-emerald-600 border-emerald-300">
            Aprovada
          </Badge>
        ) : onSubmitWeek ? (
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setConfirmSubmit(true)}
            disabled={!weekEntryCount || weekEntryCount === 0}
            title={!weekEntryCount || weekEntryCount === 0 ? "Sem registros" : undefined}
          >
            <Send className="mr-2 h-4 w-4" />
            Submeter semana
          </Button>
        ) : null}

        <Button
          className="rounded-full bg-brand-500 text-white hover:bg-brand-600"
          onClick={onOpenCreate}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo registro
        </Button>
      </div>
    </div>

    {/* Week Grid with DnD */}
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto px-5 py-5 sm:px-6">
        <div className="grid min-w-[980px] grid-cols-7 gap-3">
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            return (
              <DroppableColumn
                key={dayKey}
                day={day}
                dayKey={dayKey}
                entries={entriesByDate.get(dayKey) ?? []}
                dailyTargetMinutes={dailyTargetMinutes}
                onDayClick={onDayClick}
                onOpenCreateForDate={onOpenCreateForDate}
                isEntryDraggable={isEntryDraggable}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeEntry ? (
          <div
            className="w-[130px] overflow-hidden rounded-[16px] border border-brand-500/40 bg-card shadow-lg"
            style={{ borderLeftColor: activeEntry.project.color, borderLeftWidth: "3px" }}
          >
            <div className="flex gap-2 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-muted-foreground">
                  {activeEntry.project.name}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-foreground">
                  {activeEntry.description || "Sem descrição"}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold text-foreground">
                {formatDuration(activeEntry.duration)}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>

    {/* Drop Context Menu */}
    {contextMenu ? (
      <DragDropContextMenu
        targetDate={contextMenu.targetDate}
        position={contextMenu.position}
        onMove={handleMove}
        onDuplicate={handleDuplicate}
        onClose={() => setContextMenu(null)}
      />
    ) : null}

    {/* Submit Confirmation Dialog */}
    <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submeter semana?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso enviará {weekEntryCount ?? 0} registro(s)
            {weekTotalMinutes != null ? ` (${formatDuration(weekTotalMinutes)})` : ""} para aprovação.
            Após submeter, os registros não poderão ser editados até que sejam aprovados ou rejeitados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-brand-500 text-white hover:bg-brand-600"
            onClick={handleSubmitWeekClick}
            disabled={submitting}
          >
            {submitting ? "Submetendo..." : "Submeter"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>
);
```

- [ ] **Step 4: Add DroppableColumn and DraggableEntry helper components**

Add these at the bottom of the same file, before the closing:

```tsx
import { useDraggable, useDroppable } from "@dnd-kit/core";

function DroppableColumn({
  day,
  dayKey,
  entries: dayEntries,
  dailyTargetMinutes,
  onDayClick,
  onOpenCreateForDate,
  isEntryDraggable,
}: {
  day: Date;
  dayKey: string;
  entries: TimeEntry[];
  dailyTargetMinutes: number;
  onDayClick: (date: Date) => void;
  onOpenCreateForDate?: (date: Date) => void;
  isEntryDraggable: (entry: TimeEntry) => boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey });

  const totalMinutes = dayEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const percentage =
    dailyTargetMinutes > 0
      ? Math.min(Math.round((totalMinutes / dailyTargetMinutes) * 100), 100)
      : 0;

  return (
    <div
      ref={setNodeRef}
      data-droppable-id={dayKey}
      className={cn(
        "flex flex-col rounded-[24px] border border-border/60 bg-background/70 transition",
        isToday(day)
          ? "border-brand-500/40 bg-brand-500/[0.02]"
          : "hover:border-brand-500/20",
        isOver && "border-brand-500/60 bg-brand-500/5",
      )}
    >
      {/* Column header */}
      <button
        type="button"
        onClick={() => onDayClick(day)}
        className="flex-none rounded-t-[24px] p-4 text-left transition hover:bg-background/60"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {format(day, "EEE", { locale: ptBR })}
            </p>
            <h3
              className={cn(
                "mt-1 font-display text-2xl font-semibold",
                isToday(day) ? "text-brand-500" : "text-foreground",
              )}
            >
              {format(day, "d")}
            </h3>
          </div>
          {isToday(day) ? (
            <Badge className="rounded-full bg-brand-500/10 text-[10px] text-brand-500">
              Hoje
            </Badge>
          ) : null}
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {dayEntries.length} {dayEntries.length === 1 ? "item" : "itens"}
            </span>
            <span className="font-mono font-medium text-foreground">
              {formatDuration(totalMinutes)}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/50">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                percentage >= 100
                  ? "bg-emerald-500"
                  : percentage > 0
                    ? "bg-brand-500"
                    : "bg-transparent",
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </button>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 pt-1" style={{ maxHeight: "320px" }}>
        {dayEntries.length === 0 ? (
          <div className="flex min-h-[80px] flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground">Sem registros</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayEntries.map((entry) => (
              <DraggableEntry
                key={entry.id}
                entry={entry}
                isDraggable={isEntryDraggable(entry)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="flex-none px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() =>
            onOpenCreateForDate ? onOpenCreateForDate(day) : onDayClick(day)
          }
          className="flex w-full items-center justify-center gap-1 rounded-[16px] border border-dashed border-border/60 py-2 text-xs text-muted-foreground transition hover:border-brand-500/40 hover:text-brand-500"
        >
          <Plus className="h-3 w-3" />
          Adicionar
        </button>
      </div>
    </div>
  );
}

function DraggableEntry({
  entry,
  isDraggable,
}: {
  entry: TimeEntry;
  isDraggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: entry.id,
      disabled: !isDraggable,
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        borderLeftColor: entry.project.color,
        borderLeftWidth: "3px",
      }
    : {
        borderLeftColor: entry.project.color,
        borderLeftWidth: "3px",
      };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "overflow-hidden rounded-[16px] border border-border/60 bg-card/90 transition hover:border-brand-500/30",
        isDraggable && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      style={style}
    >
      <div className="flex gap-2 p-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-muted-foreground">
            {entry.project.name}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-foreground">
            {entry.description || (
              <span className="italic text-muted-foreground">
                Sem descrição
              </span>
            )}
          </p>
        </div>
        <span className="shrink-0 font-mono text-xs font-semibold text-foreground">
          {formatDuration(entry.duration)}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/time/WeekView.tsx
git commit -m "feat: add drag & drop and submit week to WeekView"
```

---

### Task 6: Wire preferences into TimeEntryForm and QuickEntryDialog

**Files:**
- Modify: `src/components/time/TimeEntryForm.tsx`
- Modify: `src/components/layout/quick-entry-dialog.tsx`

- [ ] **Step 1: Update TimeEntryForm to read/save preferences**

In `src/components/time/TimeEntryForm.tsx`, add import:
```typescript
import { getTimePreferences, saveTimePreference } from "@/lib/time-preferences";
```

Update the `getDefaultValues` function to read preferences when no initialValues are provided:
```typescript
function getDefaultValues(
  initialValues?: TimeEntryFormInitialValues,
): TimeEntryFormValues {
  const prefs = typeof window !== "undefined" ? getTimePreferences() : null;

  return {
    projectId: initialValues?.projectId ?? prefs?.lastProjectId ?? "",
    description: initialValues?.description ?? "",
    date: initialValues?.date ? parseLocalDate(initialValues.date) : new Date(),
    duration: initialValues?.duration ?? prefs?.defaultDuration ?? 60,
    billable: initialValues?.billable ?? prefs?.defaultBillable ?? true,
  };
}
```

Initialize submitMode from preference (line 88):
```typescript
const [submitMode, setSubmitMode] = useState<"close" | "continue">(() => {
  if (typeof window === "undefined") return "close";
  return getTimePreferences().submitMode;
});
```

In the `handleSubmit` function (around line 134), after the `onSubmit` call succeeds, save preferences:
```typescript
// After the await onSubmit(payload) call:
if (mode === "create") {
  saveTimePreference("lastProjectId", payload.projectId);
  saveTimePreference("defaultBillable", payload.billable);
  saveTimePreference("defaultDuration", payload.duration);
  saveTimePreference("submitMode", submitMode);
}
```

- [ ] **Step 2: Update QuickEntryDialog to save preferences on submit**

In `src/components/layout/quick-entry-dialog.tsx`, add import:
```typescript
import { saveTimePreference } from "@/lib/time-preferences";
```

In the `handleSubmit` function, after the success toast (line 31), save preferences:
```typescript
// After toast.success and before closeQuickEntry:
saveTimePreference("lastProjectId", data.projectId);
saveTimePreference("defaultBillable", data.billable);
saveTimePreference("defaultDuration", data.duration);
```

- [ ] **Step 3: Commit**

```bash
git add src/components/time/TimeEntryForm.tsx src/components/layout/quick-entry-dialog.tsx
git commit -m "feat: wire time preferences into TimeEntryForm and QuickEntryDialog"
```

---

### Task 7: Verify AlertDialog component exists

**Files:**
- Check: `src/components/ui/alert-dialog.tsx`

- [ ] **Step 1: Verify the component exists**

```bash
ls src/components/ui/alert-dialog.tsx
```

If it doesn't exist, install it via shadcn:
```bash
npx shadcn@latest add alert-dialog
```

- [ ] **Step 2: Commit if new file was added**

```bash
git add src/components/ui/alert-dialog.tsx
git commit -m "chore: add alert-dialog shadcn component"
```

---

### Task 8: Type-check, lint, and fix

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript type-check**

```bash
npx tsc --noEmit
```

Fix any type errors that appear.

- [ ] **Step 2: Run Biome lint and format**

```bash
npx @biomejs/biome check --write src/
```

Fix any issues that appear.

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve type-check and lint issues"
```

---

### Task 9: Manual smoke test

- [ ] **Step 1: Start dev server and verify**

```bash
npm run dev
```

Verify:
1. Time page loads with "Registro de Tempo" title, tabs, and "Novo registro" button
2. Default view is week (or last saved preference)
3. No summary card, no capacity bars, no "Lançar manualmente" / "Duplicar última" buttons
4. Week view shows drag & drop cursor on entries
5. Dragging an entry to another day shows context menu with Move/Duplicate
6. "Submeter semana" button shows in week view header
7. Submit button disabled when no entries, shows confirmation dialog when clicked
8. Status badge shows after submission
9. "+" buttons in week columns open the modal with the date pre-filled
10. Preferences persist after page reload (view, project, billable, duration)

- [ ] **Step 2: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: smoke test adjustments"
```
