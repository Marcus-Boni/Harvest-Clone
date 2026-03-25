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
