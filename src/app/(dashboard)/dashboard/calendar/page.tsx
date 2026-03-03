"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};
const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
};

const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function generateMockCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { day: number; hours: number; isToday: boolean }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isToday =
      date.toISOString().split("T")[0] ===
      new Date().toISOString().split("T")[0];
    days.push({
      day: d,
      hours: isWeekend
        ? 0
        : Math.random() > 0.2
          ? Math.round(Math.random() * 5 + 4)
          : 0,
      isToday,
    });
  }

  return { firstDay, days };
}

function getHeatmapColor(hours: number): string {
  if (hours === 0) return "bg-muted/30";
  if (hours < 4) return "bg-brand-500/15";
  if (hours < 6) return "bg-brand-500/30";
  if (hours < 8) return "bg-brand-500/50";
  return "bg-brand-500/70";
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const { firstDay, days } = generateMockCalendar(year, month);

  const monthNames = [
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

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Calendário
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualize suas horas registradas por dia.
        </p>
      </motion.div>

      {/* Month navigation */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-display text-lg font-semibold text-foreground">
          {monthNames[month]} {year}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Calendar grid */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl border border-border/50 bg-card/80 p-4 backdrop-blur"
      >
        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {days.map(({ day, hours, isToday }) => (
            <motion.button
              key={day}
              type="button"
              variants={itemVariants}
              className={cn(
                "group relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-all hover:ring-2 hover:ring-brand-500/30",
                getHeatmapColor(hours),
                isToday && "ring-2 ring-brand-500",
              )}
              aria-label={`${day} de ${monthNames[month]}, ${hours}h registradas`}
            >
              <span
                className={cn(
                  "font-medium",
                  isToday ? "text-brand-500" : "text-foreground",
                )}
              >
                {day}
              </span>
              {hours > 0 && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {hours}h
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground"
      >
        <span>Intensidade:</span>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-muted/30" />
          <span>0h</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-brand-500/30" />
          <span>4-6h</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-brand-500/50" />
          <span>6-8h</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-brand-500/70" />
          <span>8h+</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
