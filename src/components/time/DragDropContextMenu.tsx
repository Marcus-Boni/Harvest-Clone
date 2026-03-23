"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, Copy } from "lucide-react";
import { useEffect, useRef } from "react";

interface DragDropContextMenuProps {
  targetDate: Date;
  position: { x: number; y: number };
  onMove: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

export function DragDropContextMenu({
  targetDate,
  position,
  onMove,
  onDuplicate,
  onClose,
}: DragDropContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const dayLabel = format(targetDate, "EEEE", { locale: ptBR });

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[200px] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl"
      style={{
        left: position.x,
        top: position.y,
        transform: "translateX(-50%)",
      }}
    >
      <div className="border-b border-border/60 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {dayLabel}
      </div>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition hover:bg-accent"
        onClick={() => {
          onMove();
          onClose();
        }}
      >
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        Mover para {dayLabel}
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition hover:bg-accent"
        onClick={() => {
          onDuplicate();
          onClose();
        }}
      >
        <Copy className="h-4 w-4 text-muted-foreground" />
        Duplicar em {dayLabel}
      </button>
    </div>
  );
}
