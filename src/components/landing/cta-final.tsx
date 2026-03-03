"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CtaFinal() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Dramatic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-950/30 via-[#0a0a0a] to-[#0a0a0a]" />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`cta-particle-${i}`}
            className="absolute h-1.5 w-1.5 rounded-full bg-brand-500/20"
            style={{
              top: `${30 + i * 20}%`,
              left: `${20 + i * 30}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 5 + i,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 mx-auto max-w-3xl px-4 text-center md:px-8"
      >
        <h2 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl">
          Pronto para organizar
          <br />
          <span className="gradient-text">suas horas?</span>
        </h2>
        <p className="mt-4 text-base text-white/50">
          Feito para o time OptSolv. Comece a usar agora.
        </p>

        <div className="mt-10">
          <Button
            size="lg"
            className="shimmer-btn gap-2 bg-brand-500 px-10 py-6 text-lg font-bold text-white hover:bg-brand-600"
            asChild
          >
            <Link href="/login">
              Acessar o App Agora
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
