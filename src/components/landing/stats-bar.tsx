"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

const stats = [
  { value: 30, suffix: "", label: "Colaboradores" },
  { value: 100, suffix: "%", label: "Integrado Azure DO" },
  { value: 5, suffix: "min", label: "Por dia p/ registrar" },
  { value: 0, suffix: "", label: "Planilha manual", displayValue: "0" },
];

export function StatsBar() {
  return (
    <section className="relative py-20">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-5xl px-4 md:px-8"
      >
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-4xl font-bold text-white md:text-5xl">
                <span className="gradient-text">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </span>
              </div>
              <p className="mt-2 text-sm text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
