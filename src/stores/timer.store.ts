"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimerState {
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Whether the timer is paused */
  isPaused: boolean;
  /** Timestamp when the timer was started (ms) */
  startedAt: number | null;
  /** Accumulated elapsed time before pause (ms) */
  accumulatedTime: number;
  /** Current project ID */
  projectId: string | null;
  /** Current project name */
  projectName: string | null;
  /** Description of current task */
  description: string;
  /** Azure DevOps Work Item ID */
  taskId: string | null;
  /** Azure DevOps Work Item title */
  taskTitle: string | null;
  /** Whether the entry is billable */
  billable: boolean;
}

interface TimerActions {
  /** Start the timer with project context */
  start: (params: {
    projectId: string;
    projectName: string;
    description?: string;
    taskId?: string;
    taskTitle?: string;
    billable?: boolean;
  }) => void;
  /** Pause the running timer */
  pause: () => void;
  /** Resume a paused timer */
  resume: () => void;
  /** Stop the timer and return elapsed time in minutes */
  stop: () => number;
  /** Reset the timer to initial state */
  reset: () => void;
  /** Update description while timer is running */
  updateDescription: (description: string) => void;
  /** Get current elapsed time in milliseconds */
  getElapsedMs: () => number;
}

const initialState: TimerState = {
  isRunning: false,
  isPaused: false,
  startedAt: null,
  accumulatedTime: 0,
  projectId: null,
  projectName: null,
  description: "",
  taskId: null,
  taskTitle: null,
  billable: true,
};

export const useTimerStore = create<TimerState & TimerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      start: ({
        projectId,
        projectName,
        description = "",
        taskId,
        taskTitle,
        billable = true,
      }) => {
        set({
          isRunning: true,
          isPaused: false,
          startedAt: Date.now(),
          accumulatedTime: 0,
          projectId,
          projectName,
          description,
          taskId: taskId ?? null,
          taskTitle: taskTitle ?? null,
          billable,
        });
      },

      pause: () => {
        const state = get();
        if (!state.isRunning || state.isPaused) return;

        const elapsed = state.startedAt ? Date.now() - state.startedAt : 0;
        set({
          isPaused: true,
          accumulatedTime: state.accumulatedTime + elapsed,
          startedAt: null,
        });
      },

      resume: () => {
        const state = get();
        if (!state.isPaused) return;

        set({
          isPaused: false,
          startedAt: Date.now(),
        });
      },

      stop: () => {
        const state = get();
        const elapsed = state.getElapsedMs();
        const minutes = Math.round(elapsed / 60000);
        set(initialState);
        return minutes;
      },

      reset: () => set(initialState),

      updateDescription: (description: string) => set({ description }),

      getElapsedMs: () => {
        const state = get();
        if (!state.isRunning) return 0;

        if (state.isPaused) {
          return state.accumulatedTime;
        }

        const currentElapsed = state.startedAt
          ? Date.now() - state.startedAt
          : 0;
        return state.accumulatedTime + currentElapsed;
      },
    }),
    {
      name: "optsolv-timer",
      // ARCH: Persist timer state to localStorage so it survives page refresh
    },
  ),
);
