import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to locale-friendly format
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a date string to relative time (e.g., "hace 2 horas")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'ahora mismo';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return formatDate(date);
}

/**
 * Translate installation status to Spanish label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Borrador',
    CALCULATED: 'Calculado',
    PENDING_REVIEW: 'En revisión',
    RETURNED: 'Devuelto',
    APPROVED: 'Aprobado',
    DOCUMENTED: 'Documentado',
    SIGNED: 'Firmado',
    SUBMITTED: 'Tramitado',
    COMPLETED: 'Completado',
  };
  return labels[status] ?? status;
}

/**
 * Get Tailwind classes for status badge — light theme
 */
export function getStatusClasses(status: string): string {
  const classes: Record<string, string> = {
    DRAFT: 'bg-surface-100 text-surface-600',
    CALCULATED: 'bg-blue-50 text-blue-600',
    PENDING_REVIEW: 'bg-amber-50 text-amber-600',
    RETURNED: 'bg-red-50 text-red-600',
    APPROVED: 'bg-emerald-50 text-emerald-600',
    DOCUMENTED: 'bg-violet-50 text-violet-600',
    SIGNED: 'bg-indigo-50 text-indigo-600',
    SUBMITTED: 'bg-teal-50 text-teal-600',
    COMPLETED: 'bg-green-50 text-green-600',
  };
  return classes[status] ?? 'bg-surface-100 text-surface-600';
}

/**
 * Translate supply type to Spanish label
 */
export function getSupplyTypeLabel(type: string | null | undefined): string {
  if (!type) return '—';
  const labels: Record<string, string> = {
    VIVIENDA_BASICA: 'Vivienda básica',
    VIVIENDA_ELEVADA: 'Vivienda elevada',
    IRVE: 'IRVE',
    LOCAL_COMERCIAL: 'Local comercial',
  };
  return labels[type] ?? type;
}
