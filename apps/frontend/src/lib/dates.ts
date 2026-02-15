import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "dd/MM/yyyy", { locale: es });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "dd/MM/yyyy HH:mm", { locale: es });
}

export function formatRelative(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isToday(date)) return format(date, "HH:mm", { locale: es });
  if (isYesterday(date)) return `Ayer ${format(date, "HH:mm", { locale: es })}`;
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}
