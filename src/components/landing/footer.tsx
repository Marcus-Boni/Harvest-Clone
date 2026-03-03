"use client";

import { Timer } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
            <Timer className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-display text-sm font-bold text-white">
            OptSolv
          </span>
          <span className="font-display text-sm font-light text-brand-500">
            Time
          </span>
        </Link>

        {/* Info */}
        <div className="text-center text-xs text-white/30 md:text-right">
          <p>Desenvolvido para o Hackathon OptSolv 2025</p>
          <p className="mt-0.5">
            © 2025 OptSolv. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
