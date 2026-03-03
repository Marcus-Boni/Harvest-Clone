"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { useRef } from "react";

const steps = [
  {
    number: "1",
    title: "Registre",
    description:
      "Adicione horas manualmente ou com o timer ao vivo. Vincule ao Azure DevOps com autocomplete.",
    icon: Clock,
  },
  {
    number: "2",
    title: "Submita",
    description:
      "Envie sua semana para aprovação do seu manager com um clique. Acompanhe o status em tempo real.",
    icon: CheckCircle2,
  },
  {
    number: "3",
    title: "Acompanhe",
    description:
      "Managers aprovam e você acompanha tudo em dashboards, relatórios e exports profissionais.",
    icon: ShieldCheck,
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.5"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative py-20 md:py-32"
    >
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Simples como <span className="gradient-text">1, 2, 3</span>
          </h2>
          <p className="mt-4 text-base text-white/50">
            Menos de 5 minutos por dia para manter suas horas sempre em dia.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-8 top-0 hidden h-full w-px bg-white/5 md:block">
            <motion.div
              style={{ height: lineHeight }}
              className="w-full bg-gradient-to-b from-brand-500 to-brand-500/30"
            />
          </div>

          <div className="space-y-16 md:space-y-20">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="flex gap-6 md:gap-10"
              >
                {/* Number circle */}
                <div className="relative shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 ring-2 ring-brand-500/30">
                    <span className="font-display text-xl font-bold text-brand-500">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-2">
                  <div className="flex items-center gap-3">
                    <step.icon className="h-5 w-5 text-brand-400" />
                    <h3 className="font-display text-xl font-bold text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-white/50">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
