"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Link2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
} as const;

const features = [
  {
    title: "Timer Inteligente",
    description:
      "Start, pause, stop. Tempo real sincronizado com seu Azure DevOps.",
    icon: Clock,
    className: "md:col-span-2 md:row-span-2",
    highlight: true,
  },
  {
    title: "Calendário de Horas",
    description:
      "Visualize sua semana em um heatmap. Saiba exatamente onde seu tempo foi.",
    icon: Calendar,
    className: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Reports Completos",
    description:
      "Diário, semanal, mensal, anual. Exporte em Excel ou PDF com 1 clique.",
    icon: BarChart3,
    className: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Submit & Aprovação",
    description: "Submeta sua semana. Managers aprovam em segundos.",
    icon: CheckCircle2,
    className: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Azure DevOps Sync",
    description:
      "Vincule work items às suas entradas de tempo. Sincronização automática.",
    icon: Link2,
    className: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Gestão de Equipe",
    description:
      "Managers vêem tudo. Relatórios por colaborador, projeto e período.",
    icon: Users,
    className: "md:col-span-1 md:row-span-1",
  },
];

export function FeaturesBento() {
  return (
    <section id="features" className="relative py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Section title */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Tudo que você precisa para{" "}
            <span className="gradient-text">gerenciar seu tempo</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/50">
            Cada funcionalidade foi pensada para reduzir ao máximo o atrito no
            registro de horas diário.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur transition-colors hover:border-brand-500/30",
                feature.className,
              )}
            >
              {/* Hover glow */}
              <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-brand-500/0 to-brand-500/0 opacity-0 transition-opacity group-hover:opacity-100 group-hover:from-brand-500/5 group-hover:to-transparent" />

              <div className="relative z-10 flex h-full flex-col">
                {/* Icon */}
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 transition-colors group-hover:bg-brand-500/20">
                  <feature.icon className="h-5 w-5 text-brand-500" />
                </div>

                {/* Text */}
                <h3 className="font-display text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {feature.description}
                </p>

                {/* Large card — extra decorative element */}
                {feature.highlight && (
                  <div className="mt-auto pt-6">
                    <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      {/* Inline timer mockup */}
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/20">
                          <Clock className="h-6 w-6 text-brand-500" />
                          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-500" />
                          </span>
                        </div>
                        <div>
                          <div className="font-mono text-xl font-bold text-white">
                            01:42:17
                          </div>
                          <div className="text-xs text-white/40">
                            OptSolv Time Tracker · Frontend
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
