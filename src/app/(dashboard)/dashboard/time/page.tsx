"use client";

import { motion } from "framer-motion";
import { Clock, Pause, Play, Plus, Square, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MOCK_PROJECTS, MOCK_TIME_ENTRIES } from "@/lib/mock-data";
import {
  cn,
  formatDateLabel,
  formatDecimalHours,
  formatTimerDisplay,
  getStatusColor,
} from "@/lib/utils";
import { useTimerStore } from "@/stores/timer.store";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const;

export default function TimePage() {
  const timerStore = useTimerStore();
  const [displayTime, setDisplayTime] = useState("00:00:00");

  useEffect(() => {
    if (!timerStore.isRunning) return;
    const interval = setInterval(() => {
      setDisplayTime(formatTimerDisplay(timerStore.getElapsedMs()));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerStore.isRunning, timerStore.getElapsedMs]);

  const userEntries = MOCK_TIME_ENTRIES.filter((e) => e.userId === "user-1");

  // Group entries by date
  const groupedByDate = userEntries.reduce<Record<string, typeof userEntries>>(
    (acc, entry) => {
      const dateKey = entry.date.toISOString().split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(entry);
      return acc;
    },
    {},
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Registrar Tempo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use o timer ou adicione horas manualmente.
          </p>
        </div>
        <Button className="gap-1.5 bg-brand-500 text-white hover:bg-brand-600">
          <Plus className="h-4 w-4" />
          Nova Entrada
        </Button>
      </motion.div>

      {/* Timer Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-transparent">
          <CardContent className="flex flex-col items-center gap-6 py-8 md:flex-row md:justify-between">
            {/* Timer display */}
            <div className="text-center md:text-left">
              <p className="text-xs font-medium uppercase tracking-wider text-brand-400">
                Timer ao Vivo
              </p>
              <p className="mt-2 font-mono text-5xl font-bold text-foreground md:text-6xl">
                {timerStore.isRunning ? displayTime : "00:00:00"}
              </p>
              {timerStore.isRunning && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {timerStore.projectName} — {timerStore.description}
                </p>
              )}
            </div>

            {/* Timer controls */}
            <div className="flex items-center gap-3">
              {!timerStore.isRunning ? (
                <Button
                  size="lg"
                  className="gap-2 bg-brand-500 px-8 text-white hover:bg-brand-600"
                  onClick={() =>
                    timerStore.start({
                      projectId: "proj-1",
                      projectName: "OptSolv Time Tracker",
                      description: "Desenvolvimento",
                    })
                  }
                >
                  <Play className="h-5 w-5" />
                  Iniciar
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2"
                    onClick={
                      timerStore.isPaused ? timerStore.resume : timerStore.pause
                    }
                  >
                    <Pause className="h-5 w-5" />
                    {timerStore.isPaused ? "Retomar" : "Pausar"}
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="gap-2"
                    onClick={() => timerStore.stop()}
                  >
                    <Square className="h-5 w-5" />
                    Parar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Time Entries by Date */}
      {Object.entries(groupedByDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([dateKey, entries]) => (
          <motion.div key={dateKey} variants={itemVariants}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-foreground">
                {formatDateLabel(dateKey)}
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                {formatDecimalHours(
                  entries.reduce((sum, e) => sum + e.duration, 0),
                )}
              </span>
            </div>
            <div className="space-y-2">
              {entries.map((entry) => (
                <Card
                  key={entry.id}
                  className="border-border/30 bg-card/80 backdrop-blur transition-colors hover:border-border/50"
                >
                  <CardContent className="flex items-center gap-4 py-3">
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          MOCK_PROJECTS.find((p) => p.id === entry.projectId)
                            ?.color ?? "#666",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {entry.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.projectName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          getStatusColor(entry.status),
                        )}
                      >
                        {entry.status}
                      </Badge>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {formatDecimalHours(entry.duration)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        ))}
    </motion.div>
  );
}
