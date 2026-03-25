# Design: Azure DevOps Extension — Duration Select, KPI Removal & Bug Fixes

**Date:** 2026-03-24
**Files affected:**
- `azure-devops-extension/src/work-item-form/components/QuickLogForm.tsx`
- `azure-devops-extension/src/work-item-form/components/TimerControl.tsx`
- `azure-devops-extension/src/work-item-form/components/Dashboard.tsx`
- `azure-devops-extension/src/shared/api.ts`
- `azure-devops-extension/src/shared/scheduling.ts`

---

## 1. Duration Select with Predefined Options

### Problem
The current duration input consists of two separate `<input type="number">` fields (`hours`/`minutes` state). This requires multiple interactions and is error-prone in the constrained space of a DevOps extension panel.

### Solution
Replace the two number inputs with a single `<select>` element listing predefined durations. A "Personalizado..." option at the end reveals inline h/min inputs.

### Predefined Options (value in minutes)
```
15 min  → "15"
30 min  → "30"
45 min  → "45"
1h      → "60"
1h 15m  → "75"
1h 30m  → "90"
1h 45m  → "105"
2h      → "120"
2h 30m  → "150"
3h      → "180"
3h 30m  → "210"
4h      → "240"
5h      → "300"
6h      → "360"
7h      → "420"
8h      → "480"
Personalizado... → "custom"
```

The select starts with a disabled placeholder option (`value=""`, text "Selecione a duração…").

### State Changes in `QuickLogForm`
Remove `hours: string` and `minutes: string`. Add:
- `selectedDuration: string` (default `""`)
- `customHours: string` (default `""`) — **rename** from former `hours` state
- `customMinutes: string` (default `""`) — **rename** from former `minutes` state

Duration resolution:
```ts
const totalMinutes =
  selectedDuration === "custom"
    ? (Number(customHours) || 0) * 60 + (Number(customMinutes) || 0)
    : Number(selectedDuration) || 0;
```

Reset on success: `setSelectedDuration("")`, `setCustomHours("")`, `setCustomMinutes("")`.

### UI Layout
- The `<select>` replaces the two `inputSmall` number inputs in the Date + Duration row.
- When `selectedDuration === "custom"`, render the two number inputs (h + min) immediately below the select. Hours uses `max={23}`, minutes uses `max={59}`. The 1440-minute upper bound validation stays unchanged.
- Remove the `durationPreview` span and its `isValidDuration` computed variable — the select label is self-descriptive.
- Update the validation error message from `"Informe a duração (horas e/ou minutos)."` to `"Selecione ou informe a duração."`.

---

## 2. Remove KPI Stats Row

### Problem
The stats row (Total, Minhas horas, Timer) occupies ~55px of vertical space and is redundant with data visible in the Histórico tab.

### Solution — `Dashboard.tsx`
Remove:
1. `const totalHours = minutesToHours(workItemData.totalMinutes);` (line 178)
2. `const myHours = minutesToHours(workItemData.myMinutes);` (line 179)
3. The entire `<div style={s.statsRow}>` JSX block (~lines 226–234)
4. The `Stat` sub-component function (~lines 352–374)
5. The `minutesToHours` helper function (~lines 396–400)
6. The `elapsedLabel` helper function (~lines 402–416) — its only consumer was the Timer `<Stat>` which is being removed; it is dead code after this change
7. Styles: `statsRow`, `statCard`, `statLabel`, `statValue`

**Retain:**
- `entryCount` — still used for the "Histórico (N)" tab label
- `isTimerActive` — still used for the timer tab indicator dot

---

## 3. Bug Fix: azureWorkItemId Validation Error (400)

### Problem
The API rejects payloads where `azureWorkItemId` is `0`. The guard `workItemId ?? undefined` does not convert `0` to `undefined` (`0 ?? undefined === 0`). New unsaved work items return `id = 0` from `getId()`, which passes the `Number.isFinite` check in `WorkItemFormApp.tsx` and sets `workItemId` to `0`.

### Fix — Both `QuickLogForm.tsx` and `TimerControl.tsx`
Find the `azureWorkItemId` line in the payload and change to:
```ts
azureWorkItemId: workItemId != null && workItemId > 0 ? workItemId : undefined,
```

---

## 4. Bug Fix: CompletedWork/RemainingWork Incorrect Updates

### Fix A — Skip sync for terminal-state work items (`api.ts`)

At the **top** of `syncWorkItemFields`, add `"System.State"` to the `fieldNames` array. Update the batch read and the fallback path to include it:

**Batch path (`getFieldValues`):** Add `"System.State"` to `fieldNames` so it is fetched in the same call.

**Fallback path (individual `getFieldValue` calls):** Add a corresponding call:
```ts
"System.State": await formService.getFieldValue("System.State", { returnOriginalValue: false }),
```

After reading fields, check the state before any scheduling logic:
```ts
const TERMINAL_STATES = new Set(["Done", "Closed", "Resolved", "Removed"]);
const state = fieldValues["System.State"];
if (typeof state === "string" && TERMINAL_STATES.has(state)) {
  return { completedWork: 0, remainingWork: null, saved: false, skipped: true };
}
```

Update the `WorkItemFieldUpdate` interface:
```ts
export interface WorkItemFieldUpdate {
  completedWork: number;
  remainingWork: number | null;  // null = field was not written
  saved: boolean;
  skipped?: boolean;             // true when sync was skipped (terminal state)
}
```

In `QuickLogForm.tsx`, update the success message block to handle the `skipped` and `null remainingWork` cases:
```ts
if (updated.skipped) {
  devOpsMsg = " · DevOps: item em estado terminal, campos não modificados";
} else {
  const remainingStr = updated.remainingWork !== null
    ? `, ${updated.remainingWork.toFixed(1)}h restante`
    : "";
  devOpsMsg = ` · DevOps: ${updated.completedWork.toFixed(1)}h concluído${remainingStr}`;
}
```

### Fix B — No OriginalEstimate: only update CompletedWork (`scheduling.ts`)

Change the return type of `resolveSchedulingHours` to `{ completedWork: number; remainingWork: number | null }`.

When `originalEstimate <= 0` **and** `currentRemaining <= 0`, return `null` for `remainingWork` to signal "do not write this field":

```ts
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

In `syncWorkItemFields` (`api.ts`), conditionally include `RemainingWork` only when non-null.
Add an inline comment explaining why:
```ts
const fieldsToUpdate: Record<string, unknown> = {
  "Microsoft.VSTS.Scheduling.CompletedWork": updatedFields.completedWork,
};
// Only write RemainingWork when the scheduling logic determined it should be updated.
// When remainingWork is null (no original estimate + no existing remaining work),
// we intentionally leave the field untouched to match DevOps default behaviour.
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

---

## Files Summary

| File | Change |
|------|--------|
| `QuickLogForm.tsx` | Replace h/min inputs with duration select + custom toggle; rename `hours`→`customHours`, `minutes`→`customMinutes`; fix `azureWorkItemId` guard; update success message for `skipped` and `null remainingWork` |
| `TimerControl.tsx` | Fix `azureWorkItemId` guard (`workItemId > 0 ? workItemId : undefined`) |
| `Dashboard.tsx` | Remove `statsRow`, `Stat` component, `minutesToHours`, `elapsedLabel`, `totalHours`/`myHours` declarations, related styles |
| `api.ts` | `syncWorkItemFields`: add `System.State` to fieldNames + fallback path; skip if terminal; conditionally write `RemainingWork`; update `WorkItemFieldUpdate` type |
| `scheduling.ts` | `resolveSchedulingHours`: return `null` for `remainingWork` when `originalEstimate <= 0 && currentRemaining <= 0`; update return type |

---

## Out of Scope
- Timer tab duration input (`TimerControl.tsx`) — not requested (only the `azureWorkItemId` fix applies there)
- Backend API changes
- Adding new DevOps field syncs beyond the existing ones
