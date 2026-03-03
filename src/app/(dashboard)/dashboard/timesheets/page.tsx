"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Clock, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const mockTimesheets = [
  {
    period: "2025-W09",
    status: "open" as const,
    totalHours: 35.5,
    billableHours: 28,
  },
  {
    period: "2025-W08",
    status: "submitted" as const,
    totalHours: 40,
    billableHours: 32,
  },
  {
    period: "2025-W07",
    status: "approved" as const,
    totalHours: 38,
    billableHours: 30,
  },
  {
    period: "2025-W06",
    status: "rejected" as const,
    totalHours: 42,
    billableHours: 35,
  },
];

const statusConfig = {
  open: {
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    label: "Aberto",
  },
  submitted: {
    icon: Send,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Submetido",
  },
  approved: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-500/10",
    label: "Aprovado",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    label: "Rejeitado",
  },
};

export default function TimesheetsPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Timesheets
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submeta suas horas semanais para aprovação.
        </p>
      </motion.div>

      <div className="space-y-3">
        {mockTimesheets.map((ts) => {
          const config = statusConfig[ts.status];
          const StatusIcon = config.icon;

          return (
            <motion.div key={ts.period} variants={itemVariants}>
              <Card className="border-border/30 bg-card/80 backdrop-blur transition-colors hover:border-border/50">
                <CardContent className="flex items-center gap-4 py-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bg}`}
                  >
                    <StatusIcon className={`h-5 w-5 ${config.color}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Semana {ts.period}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ts.totalHours}h total · {ts.billableHours}h billable
                    </p>
                  </div>

                  <div
                    className={`rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.color}`}
                  >
                    {config.label}
                  </div>

                  {ts.status === "open" && (
                    <Button
                      size="sm"
                      className="gap-1 bg-brand-500 text-white hover:bg-brand-600"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submeter
                    </Button>
                  )}

                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
