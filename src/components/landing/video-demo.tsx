"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";

interface VideoDemoProps {
  /** Path to the exported .mp4 video from Remotion */
  src?: string;
  /** Thumbnail poster image */
  poster?: string;
  /** Video duration label, e.g. "1:32" */
  duration?: string;
}

export function VideoDemo({ src, poster, duration = "1:32" }: VideoDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="video-demo" className="relative py-20 md:py-32">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Como funciona em <span className="gradient-text">90 segundos</span>
          </h2>
          <p className="mt-4 text-base text-white/50">
            Veja como registrar, submeter e acompanhar horas em menos de 2
            minutos por dia.
          </p>
        </motion.div>

        {/* Video container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl shadow-brand-500/5"
        >
          {/* Gradient border glow */}
          <div className="absolute -inset-[1px] -z-10 rounded-2xl bg-gradient-to-b from-brand-500/20 via-transparent to-transparent" />

          {src && isPlaying ? (
            <video
              src={src}
              poster={poster}
              controls
              autoPlay
              className="aspect-video w-full"
            />
          ) : (
            <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-[#171717] to-[#0a0a0a]">
              {/* Decorative elements */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="grid grid-cols-12 gap-3 p-12">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div
                      key={`dot-${i}`}
                      className="h-1 w-1 rounded-full bg-white"
                    />
                  ))}
                </div>
              </div>

              {/* Play button */}
              <button
                type="button"
                onClick={() => src && setIsPlaying(true)}
                className="group/play relative z-10 flex flex-col items-center gap-4"
                aria-label="Reproduzir vídeo de demonstração"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 shadow-lg shadow-brand-500/30 transition-shadow group-hover/play:shadow-xl group-hover/play:shadow-brand-500/40"
                >
                  <Play className="ml-1 h-8 w-8 text-white" fill="white" />
                </motion.div>
                {!src && (
                  <span className="rounded-full bg-white/5 px-4 py-1.5 text-sm text-white/50 backdrop-blur">
                    Vídeo em produção
                  </span>
                )}
                {src && (
                  <span className="text-sm text-white/40">{duration}</span>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Bullet points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/40"
        >
          {[
            "Timer ao vivo e entrada manual",
            "Submit semanal para aprovação",
            "Relatórios com export em Excel/PDF",
          ].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
