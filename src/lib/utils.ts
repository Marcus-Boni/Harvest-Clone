import { type ClassValue, clsx } from "clsx";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format minutes into a human-readable duration string.
 * @example formatDuration(90) => "1h 30min"
 * @example formatDuration(45) => "45min"
 * @example formatDuration(480) => "8h"
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0min";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * Format minutes into decimal hours string.
 * @example formatDecimalHours(90) => "1.5h"
 */
export function formatDecimalHours(minutes: number): string {
  return `${(minutes / 60).toFixed(1)}h`;
}

/**
 * Format milliseconds into HH:MM:SS for timer display.
 * @example formatTimerDisplay(3661000) => "01:01:01"
 */
export function formatTimerDisplay(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, "0"))
    .join(":");
}

/**
 * Format a date into a human-friendly label.
 * @example formatDateLabel("2025-03-01") => "Hoje"
 * @example formatDateLabel("2025-02-28") => "Ontem"
 * @example formatDateLabel("2025-02-20") => "20 de fevereiro"
 */
export function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

/**
 * Format a date for display in the UI.
 * @example formatDate(new Date()) => "01 mar 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy", { locale: ptBR });
}

/**
 * Get relative time from now.
 * @example getRelativeTime(new Date()) => "há poucos segundos"
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

/**
 * Generate initials from a display name.
 * @example getInitials("Marcus Galvão") => "MG"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Resolve a user's profile image source.
 *
 * Microsoft OAuth can return the profile photo as a base64 data URI
 * (e.g. "data:image/jpeg;base64,..."). next/image does NOT support data URIs,
 * so callers must check `isBase64Image()` and render a plain <img> instead.
 *
 * Returns `null` when no image is available so the caller can show initials.
 */
export function resolveUserImage(
  image: string | null | undefined,
): string | null {
  if (!image || image.trim() === "") return null;
  return image.trim();
}

/**
 * Returns true when the image string is a base64 data URI.
 * In this case, use a native <img> element — not next/image.
 *
 * @example isBase64Image("data:image/jpeg;base64,/9j/...") // true
 * @example isBase64Image("https://graph.microsoft.com/...") // false
 */
export function isBase64Image(src: string | null | undefined): boolean {
  return typeof src === "string" && src.startsWith("data:");
}

/**
 * Get a tailwind-friendly color for project status badges.
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    submitted: "bg-blue-500/10 text-blue-400",
    approved: "bg-green-500/10 text-green-400",
    rejected: "bg-red-500/10 text-red-400",
    active: "bg-green-500/10 text-green-400",
    archived: "bg-muted text-muted-foreground",
    completed: "bg-blue-500/10 text-blue-400",
    open: "bg-yellow-500/10 text-yellow-400",
  };
  return colors[status] ?? "bg-muted text-muted-foreground";
}
