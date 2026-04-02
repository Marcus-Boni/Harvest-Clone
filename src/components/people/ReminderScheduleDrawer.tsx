"use client";

import { Calendar, CheckCircle, History, Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

interface ScheduleData {
  id: string;
  enabled: boolean;
  daysOfWeek: number[];
  hour: number;
  minute: number;
  timezone: string;
  condition: "all" | "not_submitted";
  targetScope: "all" | "direct_reports";
  lastTriggeredAt: string | null;
}

interface LogEntry {
  id: string;
  triggeredBy: "manual" | "schedule";
  recipientCount: number;
  failedCount: number;
  personalNote: string | null;
  createdAt: string;
}

interface ReminderScheduleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionRole: string;
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const CONDITION_LABELS: Record<string, string> = {
  all: "Todos os usuários ativos",
  not_submitted: "Apenas quem não submeteu o timesheet da semana",
};

const SCOPE_LABELS: Record<string, string> = {
  all: "Toda a organização",
  direct_reports: "Meus subordinados diretos",
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return DATE_TIME_FORMATTER.format(date);
}

export default function ReminderScheduleDrawer({
  open,
  onOpenChange,
  sessionRole,
}: ReminderScheduleDrawerProps) {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [schedRes, logsRes] = await Promise.all([
        fetch("/api/notifications/schedule"),
        fetch("/api/notifications/schedule/logs?limit=5"),
      ]);

      if (!schedRes.ok) {
        toast.error("Erro ao carregar configuração de agendamento.");
        return;
      }

      const schedData = (await schedRes.json()) as ScheduleData;
      setSchedule(schedData);

      if (logsRes.ok) {
        const logsData = (await logsRes.json()) as { data: LogEntry[] };
        setLogs(logsData.data ?? []);
      }
    } catch (err) {
      console.error("[ReminderScheduleDrawer] fetchData:", err);
      toast.error("Erro inesperado ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void fetchData();
  }, [open, fetchData]);

  function toggleDay(day: number) {
    if (!schedule) return;
    const current = schedule.daysOfWeek;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    setSchedule({ ...schedule, daysOfWeek: next });
  }

  async function handleSave() {
    if (!schedule) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/notifications/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: schedule.enabled,
          daysOfWeek: schedule.daysOfWeek,
          hour: schedule.hour,
          minute: schedule.minute,
          timezone: schedule.timezone,
          condition: schedule.condition,
          targetScope: schedule.targetScope,
        }),
      });

      const json = (await res.json()) as { error?: unknown };
      if (!res.ok) {
        toast.error(
          typeof json.error === "string"
            ? json.error
            : "Erro ao salvar configuração.",
        );
        return;
      }

      toast.success("Agendamento atualizado com sucesso!");
      onOpenChange(false);
    } catch (err) {
      console.error("[ReminderScheduleDrawer] handleSave:", err);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border/60 px-5 pb-5 pt-6 sm:px-6">
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-400" aria-hidden="true" />
            Agendamento automático
          </SheetTitle>
          <SheetDescription className="max-w-[42ch] leading-relaxed">
            Configure quando os lembretes de horas serão enviados
            automaticamente.
          </SheetDescription>
        </SheetHeader>

        {isLoading || !schedule ? (
          <div className="flex flex-1 items-center justify-center px-6 py-16">
            <Loader2
              className="h-6 w-6 animate-spin text-muted-foreground"
              aria-label="Carregando..."
            />
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
                <section className="rounded-2xl border border-border/60 bg-muted/10 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Status atual
                        </p>
                        <Label
                          htmlFor="schedule-enabled"
                          className="text-sm font-semibold text-foreground"
                        >
                          Agendamento habilitado
                        </Label>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {schedule.enabled
                            ? "Lembretes automáticos ativos para a regra configurada abaixo."
                            : "Os lembretes permanecem desabilitados até você salvar uma configuração ativa."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                          <History
                            className="h-3.5 w-3.5 text-brand-400"
                            aria-hidden="true"
                          />
                          Último disparo automático
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDateTime(schedule.lastTriggeredAt) ??
                            "Nenhum disparo automático registrado até agora."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-full border border-border/60 bg-background/70 px-3 py-2 sm:justify-start">
                      <span className="text-xs font-medium text-muted-foreground">
                        {schedule.enabled ? "Ativo" : "Inativo"}
                      </span>
                      <Switch
                        id="schedule-enabled"
                        checked={schedule.enabled}
                        onCheckedChange={(checked) =>
                          setSchedule({ ...schedule, enabled: checked })
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-border/60 bg-background/40 p-4 sm:p-5">
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Recorrência
                        </p>
                        <Label className="text-sm font-semibold text-foreground">
                          Dias da semana
                        </Label>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {DAY_LABELS.map((label, day) => (
                          <button
                            key={`day-${
                              // biome-ignore lint/suspicious/noArrayIndexKey: <DAY_LABELS is static and will never change order>
                              day
                            }`}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`min-w-12 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                              schedule.daysOfWeek.includes(day)
                                ? "border-brand-500 bg-brand-500/10 text-brand-400"
                                : "border-border/50 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="schedule-hour">Hora</Label>
                        <Input
                          id="schedule-hour"
                          type="number"
                          min={0}
                          max={23}
                          value={schedule.hour}
                          onChange={(e) =>
                            setSchedule({
                              ...schedule,
                              hour: Math.max(
                                0,
                                Math.min(23, Number(e.target.value)),
                              ),
                            })
                          }
                          className="h-11 bg-background/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedule-minute">Minuto</Label>
                        <Input
                          id="schedule-minute"
                          type="number"
                          min={0}
                          max={59}
                          value={schedule.minute}
                          onChange={(e) =>
                            setSchedule({
                              ...schedule,
                              minute: Math.max(
                                0,
                                Math.min(59, Number(e.target.value)),
                              ),
                            })
                          }
                          className="h-11 bg-background/70"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schedule-condition">
                        Condição de envio
                      </Label>
                      <Select
                        value={schedule.condition}
                        onValueChange={(v) =>
                          setSchedule({
                            ...schedule,
                            condition: v as "all" | "not_submitted",
                          })
                        }
                      >
                        <SelectTrigger
                          id="schedule-condition"
                          className="h-11 bg-background/70"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_submitted">
                            {CONDITION_LABELS.not_submitted}
                          </SelectItem>
                          <SelectItem value="all">
                            {CONDITION_LABELS.all}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {sessionRole === "admin" && (
                      <div className="space-y-2">
                        <Label htmlFor="schedule-scope">Destinatários</Label>
                        <Select
                          value={schedule.targetScope}
                          onValueChange={(v) =>
                            setSchedule({
                              ...schedule,
                              targetScope: v as "all" | "direct_reports",
                            })
                          }
                        >
                          <SelectTrigger
                            id="schedule-scope"
                            className="h-11 bg-background/70"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {SCOPE_LABELS.all}
                            </SelectItem>
                            <SelectItem value="direct_reports">
                              {SCOPE_LABELS.direct_reports}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-border/60 bg-background/40 p-4 sm:p-5">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-foreground">
                      Últimos disparos
                    </Label>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Histórico recente dos envios para validar frequência,
                      entregas e falhas.
                    </p>
                  </div>

                  {logs.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {logs.map((log) => {
                        const successfulCount = Math.max(
                          log.recipientCount - log.failedCount,
                          0,
                        );

                        return (
                          <article
                            key={log.id}
                            className="rounded-xl border border-border/60 bg-background/70 p-4"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground">
                                    {log.triggeredBy === "manual"
                                      ? "Manual"
                                      : "Automático"}
                                  </span>
                                  <p className="text-sm font-medium text-foreground">
                                    {formatDateTime(log.createdAt) ??
                                      "Data inválida"}
                                  </p>
                                </div>

                                {log.personalNote ? (
                                  <p className="text-sm leading-relaxed text-muted-foreground">
                                    {log.personalNote}
                                  </p>
                                ) : (
                                  <p className="text-sm leading-relaxed text-muted-foreground">
                                    Disparo processado sem observações
                                    adicionais.
                                  </p>
                                )}
                              </div>

                              <div className="grid min-w-full grid-cols-2 gap-2 sm:min-w-[220px]">
                                <div className="rounded-lg bg-emerald-500/10 px-3 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">
                                    Entregues
                                  </p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
                                    <span className="text-sm font-semibold text-emerald-300">
                                      {successfulCount}
                                    </span>
                                  </div>
                                </div>

                                <div className="rounded-lg bg-rose-500/10 px-3 py-3">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-rose-300/80">
                                    Falhas
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-rose-300">
                                    {log.failedCount}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-sm leading-relaxed text-muted-foreground">
                      Nenhum disparo recente foi registrado ainda.
                    </div>
                  )}
                </section>
              </div>
            </div>

            <div className="border-t border-border/60 bg-background/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
              <Button
                className="h-11 w-full gap-2 bg-brand-500 text-white hover:bg-brand-600"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar configuração
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
