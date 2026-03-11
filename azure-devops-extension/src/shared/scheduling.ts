const roundHours = (value: number): number => Math.round(value * 100) / 100;

export function toNumericHours(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function resolveSchedulingHours(values: {
  completedWork: unknown;
  remainingWork: unknown;
  originalEstimate: unknown;
  nextCompletedWork: number;
}) {
  const currentCompleted = toNumericHours(values.completedWork);
  const currentRemaining = toNumericHours(values.remainingWork);
  const originalEstimate = toNumericHours(values.originalEstimate);
  const nextCompletedWork = roundHours(values.nextCompletedWork);

  const baselineHours =
    originalEstimate > 0
      ? originalEstimate
      : Math.max(currentCompleted + currentRemaining, nextCompletedWork);

  return {
    completedWork: nextCompletedWork,
    remainingWork: roundHours(Math.max(0, baselineHours - nextCompletedWork)),
  };
}
