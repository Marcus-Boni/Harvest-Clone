# Azure DevOps Extension — Duration Select, KPI Removal & Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the duration h/min inputs with a predefined select, remove the KPI stats row, and fix three bugs (azureWorkItemId=0 API 400, CompletedWork=0 on Done, RemainingWork written when no estimate).

**Architecture:** Changes flow from the innermost shared utility outward — `scheduling.ts` → `api.ts` → UI components. Each task produces a TypeScript-clean, buildable state. No test framework exists; verification is via `tsc --noEmit` and `npm run build` run from `azure-devops-extension/`.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, azure-devops-extension-sdk 4

---

## File Map

| File | What changes |
|------|-------------|
| `src/shared/scheduling.ts` | `resolveSchedulingHours` return type + null-remainingWork path |
| `src/shared/api.ts` | `WorkItemFieldUpdate` interface; `syncWorkItemFields` — System.State read, terminal skip, conditional RemainingWork write |
| `src/work-item-form/components/QuickLogForm.tsx` | Duration select + custom toggle; `azureWorkItemId` guard; success message skipped/null branches |
| `src/work-item-form/components/TimerControl.tsx` | `azureWorkItemId` guard |
| `src/work-item-form/components/Dashboard.tsx` | Remove stats row, Stat component, minutesToHours, elapsedLabel, dead styles |

---

## Task 1: Update `resolveSchedulingHours` in `scheduling.ts`

**Files:**
- Modify: `azure-devops-extension/src/shared/scheduling.ts`

**Context:** `resolveSchedulingHours` currently always returns `{ completedWork: number; remainingWork: number }`. We need it to return `remainingWork: null` when neither `originalEstimate` nor `currentRemaining` are set, signalling "do not write this field".

- [ ] **Step 1: Open `src/shared/scheduling.ts` and replace the entire file content**

```ts
const roundHours = (value: number): number => Math.round(value * 100) / 100;

export function toNumericHours(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function resolveSchedulingHours(values: {
  completedWork: unknown;
  remainingWork: unknown;
  originalEstimate: unknown;
  nextCompletedWork: number;
}): { completedWork: number; remainingWork: number | null } {
  const currentCompleted = toNumericHours(values.completedWork);
  const currentRemaining = toNumericHours(values.remainingWork);
  const originalEstimate = toNumericHours(values.originalEstimate);
  const nextCompletedWork = roundHours(values.nextCompletedWork);

  // When there is no original estimate and no existing remaining work,
  // only update CompletedWork — do not write RemainingWork at all.
  if (originalEstimate <= 0 && currentRemaining <= 0) {
    return { completedWork: nextCompletedWork, remainingWork: null };
  }

  const baselineHours =
    originalEstimate > 0
      ? originalEstimate
      : Math.max(currentCompleted + currentRemaining, nextCompletedWork);

  return {
    completedWork: nextCompletedWork,
    remainingWork: roundHours(Math.max(0, baselineHours - nextCompletedWork)),
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `azure-devops-extension/`:
```bash
npx tsc --noEmit
```
Expected: errors only from `api.ts` (uses old `remainingWork: number` type — will be fixed in Task 2). If no errors at all, that is fine too.

- [ ] **Step 3: Commit**

```bash
git add azure-devops-extension/src/shared/scheduling.ts
git commit -m "fix: resolveSchedulingHours returns null remainingWork when no estimate"
```

---

## Task 2: Update `WorkItemFieldUpdate` and `syncWorkItemFields` in `api.ts`

**Files:**
- Modify: `azure-devops-extension/src/shared/api.ts`

**Context:** Three changes:
1. `WorkItemFieldUpdate` interface: `remainingWork: number | null`, add `skipped?: boolean`
2. `syncWorkItemFields`: read `System.State` (batched with existing fields), return early for terminal states
3. `syncWorkItemFields`: only write `RemainingWork` when `updatedFields.remainingWork !== null`

- [ ] **Step 1: Update the `WorkItemFieldUpdate` interface (lines 151–155)**

Find:
```ts
export interface WorkItemFieldUpdate {
  completedWork: number; // hours
  remainingWork: number; // hours
  saved: boolean; // whether save() was called successfully
}
```

Replace with:
```ts
export interface WorkItemFieldUpdate {
  completedWork: number; // hours
  remainingWork: number | null; // hours; null = field was not written
  saved: boolean; // whether save() was called successfully
  skipped?: boolean; // true when sync was skipped (terminal work item state)
}
```

- [ ] **Step 2: Update `fieldNames` in `syncWorkItemFields` to include `System.State`**

Find (lines 173–177):
```ts
  const fieldNames = [
    "Microsoft.VSTS.Scheduling.CompletedWork",
    "Microsoft.VSTS.Scheduling.RemainingWork",
    "Microsoft.VSTS.Scheduling.OriginalEstimate",
  ];
```

Replace with:
```ts
  const fieldNames = [
    "Microsoft.VSTS.Scheduling.CompletedWork",
    "Microsoft.VSTS.Scheduling.RemainingWork",
    "Microsoft.VSTS.Scheduling.OriginalEstimate",
    "System.State",
  ];
```

- [ ] **Step 3: Update the fallback path to also fetch `System.State`**

Find the fallback object in `syncWorkItemFields` (the object starting with `"Microsoft.VSTS.Scheduling.CompletedWork": await formService.getFieldValue...`):
```ts
        : {
        "Microsoft.VSTS.Scheduling.CompletedWork":
          await formService.getFieldValue(
            "Microsoft.VSTS.Scheduling.CompletedWork",
            {
              returnOriginalValue: false,
            },
          ),
        "Microsoft.VSTS.Scheduling.RemainingWork":
          await formService.getFieldValue(
            "Microsoft.VSTS.Scheduling.RemainingWork",
            {
              returnOriginalValue: false,
            },
          ),
        "Microsoft.VSTS.Scheduling.OriginalEstimate":
          await formService.getFieldValue(
            "Microsoft.VSTS.Scheduling.OriginalEstimate",
            {
              returnOriginalValue: false,
            },
          ),
      };
```

Replace with:
```ts
        : {
        "Microsoft.VSTS.Scheduling.CompletedWork":
          await formService.getFieldValue(
            "Microsoft.VSTS.Scheduling.CompletedWork",
            {
              returnOriginalValue: false,
            },
          ),
        "Microsoft.VSTS.Scheduling.RemainingWork":
          await formService.getFieldValue(
            "Microsoft.VSTS.Scheduling.RemainingWork",
            {
              returnOriginalValue: false,
            },
          ),
        "Microsoft.VSTS.Scheduling.OriginalEstimate":
          await formService.getFieldValue(
            "Microsoft.VSTS.Scheduling.OriginalEstimate",
            {
              returnOriginalValue: false,
            },
          ),
        "System.State":
          await formService.getFieldValue("System.State", {
            returnOriginalValue: false,
          }),
      };
```

- [ ] **Step 4: Add terminal-state early return after `fieldValues` is populated**

Find the line:
```ts
  const currentCompleted = toNumericHours(
    fieldValues["Microsoft.VSTS.Scheduling.CompletedWork"],
  );
```

Insert the following block **immediately before** that line:
```ts
  // Skip field updates when the work item is in a terminal state.
  // Writing scheduling fields on Done/Closed items produces incorrect results.
  const TERMINAL_STATES = new Set(["Done", "Closed", "Resolved", "Removed"]);
  const workItemState = fieldValues["System.State"];
  if (typeof workItemState === "string" && TERMINAL_STATES.has(workItemState)) {
    return { completedWork: 0, remainingWork: null, saved: false, skipped: true };
  }

```

- [ ] **Step 5: Replace the `setFieldValues` / `setFieldValue` block with a conditional write**

Find the entire block (starting from `if (formService.setFieldValues) {`):
```ts
  if (formService.setFieldValues) {
    await formService.setFieldValues({
      "Microsoft.VSTS.Scheduling.CompletedWork": updatedFields.completedWork,
      "Microsoft.VSTS.Scheduling.RemainingWork": updatedFields.remainingWork,
    });
  } else {
    await formService.setFieldValue(
      "Microsoft.VSTS.Scheduling.CompletedWork",
      updatedFields.completedWork,
    );
    await formService.setFieldValue(
      "Microsoft.VSTS.Scheduling.RemainingWork",
      updatedFields.remainingWork,
    );
  }
```

Replace with:
```ts
  // Only write RemainingWork when the scheduling logic determined it should be updated.
  // When remainingWork is null (no original estimate + no existing remaining work),
  // we intentionally leave the field untouched to match DevOps default behaviour.
  const fieldsToUpdate: Record<string, unknown> = {
    "Microsoft.VSTS.Scheduling.CompletedWork": updatedFields.completedWork,
  };
  if (updatedFields.remainingWork !== null) {
    fieldsToUpdate["Microsoft.VSTS.Scheduling.RemainingWork"] = updatedFields.remainingWork;
  }

  if (formService.setFieldValues) {
    await formService.setFieldValues(fieldsToUpdate);
  } else {
    await formService.setFieldValue(
      "Microsoft.VSTS.Scheduling.CompletedWork",
      updatedFields.completedWork,
    );
    if (updatedFields.remainingWork !== null) {
      await formService.setFieldValue(
        "Microsoft.VSTS.Scheduling.RemainingWork",
        updatedFields.remainingWork,
      );
    }
  }
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: errors only in `QuickLogForm.tsx` (uses `updated.remainingWork.toFixed(1)` on the now-nullable type — will be fixed in Task 4). Zero errors in `scheduling.ts` and `api.ts`.

- [ ] **Step 7: Commit**

```bash
git add azure-devops-extension/src/shared/api.ts
git commit -m "fix: syncWorkItemFields skips terminal states and conditionally writes RemainingWork"
```

---

## Task 3: Fix `azureWorkItemId` guard in `TimerControl.tsx`

**Files:**
- Modify: `azure-devops-extension/src/work-item-form/components/TimerControl.tsx`

**Context:** Line 58 passes `workItemId ?? undefined` which sends `0` to the API for new unsaved work items. The `??` operator only coalesces `null`/`undefined`, not `0`.

- [ ] **Step 1: Fix the guard in `handleStart`**

Find (line 58):
```ts
        azureWorkItemId: workItemId ?? undefined,
```

Replace with:
```ts
        azureWorkItemId: workItemId != null && workItemId > 0 ? workItemId : undefined,
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: zero errors in `TimerControl.tsx`.

- [ ] **Step 3: Commit**

```bash
git add azure-devops-extension/src/work-item-form/components/TimerControl.tsx
git commit -m "fix: guard azureWorkItemId against 0 in TimerControl"
```

---

## Task 4: Refactor `QuickLogForm.tsx` — duration select, azureWorkItemId fix, success message

**Files:**
- Modify: `azure-devops-extension/src/work-item-form/components/QuickLogForm.tsx`

**Context:** Three changes in one component:
1. Replace `hours`/`minutes` state with `selectedDuration`/`customHours`/`customMinutes`; render a `<select>` with predefined options and an inline custom toggle
2. Fix `azureWorkItemId: workItemId ?? undefined` → `workItemId > 0 ? workItemId : undefined`
3. Update the DevOps success message to handle `skipped: true` and `remainingWork: null`

- [ ] **Step 1: Replace the state declarations**

Find:
```ts
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
```

Replace with:
```ts
  const [selectedDuration, setSelectedDuration] = useState("");
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");
```

- [ ] **Step 2: Update `totalMinutes` and `isValidDuration` computation in `handleSubmit`**

Find:
```ts
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const totalMinutes = h * 60 + m;
```

Replace with:
```ts
    const totalMinutes =
      selectedDuration === "custom"
        ? (Number(customHours) || 0) * 60 + (Number(customMinutes) || 0)
        : Number(selectedDuration) || 0;
```

- [ ] **Step 3: Update the validation error message**

Find:
```ts
      setError("Informe a duração (horas e/ou minutos).");
```

Replace with:
```ts
      setError("Selecione ou informe a duração.");
```

- [ ] **Step 4: Fix the `azureWorkItemId` guard**

Find:
```ts
        azureWorkItemId: workItemId ?? undefined,
```

Replace with:
```ts
        azureWorkItemId: workItemId != null && workItemId > 0 ? workItemId : undefined,
```

- [ ] **Step 5: Update the DevOps success message block to handle `skipped` and `null remainingWork`**

Find:
```ts
          const updated = await syncWorkItemFields(formService, totalMinutes);
          devOpsMsg = ` · DevOps: ${updated.completedWork.toFixed(1)}h concluído, ${updated.remainingWork.toFixed(1)}h restante`;
          setDevOpsUpdated(true);
```

Replace with:
```ts
          const updated = await syncWorkItemFields(formService, totalMinutes);
          if (updated.skipped) {
            devOpsMsg = " · DevOps: item em estado terminal, campos não modificados";
          } else {
            const remainingStr =
              updated.remainingWork !== null
                ? `, ${updated.remainingWork.toFixed(1)}h restante`
                : "";
            devOpsMsg = ` · DevOps: ${updated.completedWork.toFixed(1)}h concluído${remainingStr}`;
          }
          setDevOpsUpdated(true);
```

- [ ] **Step 6: Update the reset on success**

Find:
```ts
      setDescription("");
      setHours("");
      setMinutes("");
```

Replace with:
```ts
      setDescription("");
      setSelectedDuration("");
      setCustomHours("");
      setCustomMinutes("");
```

- [ ] **Step 7: Remove the `durationValue` and `isValidDuration` computed lines**

Find:
```ts
  const durationValue = `${Number(hours) || 0}h ${Number(minutes) || 0}m`;
  const isValidDuration = (Number(hours) || 0) * 60 + (Number(minutes) || 0) >= 1;
```

Delete both lines entirely.

- [ ] **Step 8: Replace the Duration JSX in the Date + Duration row**

Find the entire duration `<div>`:
```tsx
        <div style={{ ...s.row, flex: 1 }}>
          <label style={s.label} htmlFor="qlf-hours">
            Duração
          </label>
          <div style={{ display: "flex", gap: 4 }}>
            <input
              id="qlf-hours"
              style={s.inputSmall}
              type="number"
              placeholder="h"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              disabled={loading}
              aria-label="Horas"
            />
            <input
              id="qlf-minutes"
              style={s.inputSmall}
              type="number"
              placeholder="min"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              disabled={loading}
              aria-label="Minutos"
            />
          </div>
          {isValidDuration && (
            <span style={s.durationPreview}>{durationValue}</span>
          )}
        </div>
```

Replace with:
```tsx
        <div style={{ ...s.row, flex: 1 }}>
          <label style={s.label} htmlFor="qlf-duration">
            Duração
          </label>
          <select
            id="qlf-duration"
            style={s.select}
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            disabled={loading}
            required
          >
            <option value="" disabled>
              Selecione a duração…
            </option>
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1h</option>
            <option value="75">1h 15m</option>
            <option value="90">1h 30m</option>
            <option value="105">1h 45m</option>
            <option value="120">2h</option>
            <option value="150">2h 30m</option>
            <option value="180">3h</option>
            <option value="210">3h 30m</option>
            <option value="240">4h</option>
            <option value="300">5h</option>
            <option value="360">6h</option>
            <option value="420">7h</option>
            <option value="480">8h</option>
            <option value="custom">Personalizado…</option>
          </select>
          {selectedDuration === "custom" && (
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              <input
                style={s.inputSmall}
                type="number"
                placeholder="h"
                min={0}
                max={23}
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                disabled={loading}
                aria-label="Horas (personalizado)"
              />
              <input
                style={s.inputSmall}
                type="number"
                placeholder="min"
                min={0}
                max={59}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                disabled={loading}
                aria-label="Minutos (personalizado)"
              />
            </div>
          )}
        </div>
```

- [ ] **Step 9: Remove the `durationPreview` style entry from the `s` object**

Find:
```ts
  durationPreview: {
    fontSize: 10,
    color: "var(--brand)",
    marginTop: 2,
    fontVariantNumeric: "tabular-nums",
  },
```

Delete those lines entirely.

- [ ] **Step 10: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```
Expected: zero errors across all files.

- [ ] **Step 11: Commit**

```bash
git add azure-devops-extension/src/work-item-form/components/QuickLogForm.tsx
git commit -m "feat: replace h/min duration inputs with predefined select in QuickLogForm"
```

---

## Task 5: Remove KPI stats row from `Dashboard.tsx`

**Files:**
- Modify: `azure-devops-extension/src/work-item-form/components/Dashboard.tsx`

**Context:** Remove the stats row and all its dependencies. Keep `entryCount` (tab label) and `isTimerActive` (timer dot). `minutesToHours` and `elapsedLabel` become dead code once `Stat` is removed.

- [ ] **Step 1: Remove the `totalHours` and `myHours` computed variables**

Find:
```ts
  const totalHours = minutesToHours(workItemData.totalMinutes);
  const myHours = minutesToHours(workItemData.myMinutes);
```

Delete both lines.

- [ ] **Step 2: Remove the `statsRow` JSX block**

Find and delete the entire block:
```tsx
      {/* ── Stats row ───────────────────────────────────────────── */}
      <div style={s.statsRow}>
        <Stat label="Total" value={totalHours} />
        <Stat label="Minhas horas" value={myHours} />
        <Stat
          label="Timer"
          value={timer ? elapsedLabel(timer) : "—"}
          highlight={isTimerActive}
        />
      </div>
```

- [ ] **Step 3: Remove the `Stat` sub-component function**

Find and delete the entire function:
```tsx
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
```

- [ ] **Step 4: Remove the `minutesToHours` helper**

Find and delete:
```ts
function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
```

- [ ] **Step 5: Remove the `elapsedLabel` helper**

Find and delete:
```ts
function elapsedLabel(timer: ActiveTimer): string {
  const now = Date.now();
  const start = new Date(timer.startedAt).getTime();
  const elapsed = timer.pausedAt
    ? timer.accumulatedMs
    : timer.accumulatedMs + (now - start);
  const totalSecs = Math.floor(Math.max(0, elapsed) / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const sec = totalSecs % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}
```

- [ ] **Step 6: Remove the dead styles from the `s` object**

Find and delete each of these style entries:
```ts
  statsRow: { display: "flex", gap: 6 },
  statCard: {
    flex: 1,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "7px 8px",
  },
  statLabel: {
    fontSize: 9,
    color: "var(--muted)",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statValue: {
    fontSize: 13,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
```

- [ ] **Step 7: Verify full build passes**

```bash
npx tsc --noEmit && npm run build
```
Expected: zero TypeScript errors, successful Vite build output in `dist/`.

- [ ] **Step 8: Commit**

```bash
git add azure-devops-extension/src/work-item-form/components/Dashboard.tsx
git commit -m "feat: remove KPI stats row from Dashboard"
```

---

## Task 6: Final build verification

- [ ] **Step 1: Run full build from `azure-devops-extension/`**

```bash
npx tsc --noEmit && npm run build
```
Expected: zero TypeScript errors, clean Vite build.

- [ ] **Step 2: Verify no regressions in unchanged files**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules"
```
Expected: empty output (no errors outside node_modules).
