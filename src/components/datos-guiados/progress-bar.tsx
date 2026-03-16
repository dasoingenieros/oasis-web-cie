'use client';

import type { DocumentReadiness } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface ProgressBarProps {
  completionPct: number;
  completedFields: number;
  totalFields: number;
  documentReadiness: {
    MTD: DocumentReadiness;
    CIE: DocumentReadiness;
    SOLICITUD_BT: DocumentReadiness;
  };
  onDocClick?: (docType: string) => void;
}

const DOC_LABELS: Record<string, string> = {
  MTD: 'MTD',
  CIE: 'CIE',
  SOLICITUD_BT: 'Sol. BT',
};

export function ProgressBar({
  completionPct,
  completedFields,
  totalFields,
  documentReadiness,
  onDocClick,
}: ProgressBarProps) {
  const pct = Math.round(completionPct);

  return (
    <div className="rounded-lg border border-surface-200 bg-white p-4 space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-surface-100 rounded-full h-2.5">
          <div
            className={cn(
              'h-2.5 rounded-full transition-all duration-500',
              pct === 100
                ? 'bg-emerald-500'
                : pct > 60
                  ? 'bg-brand-500'
                  : pct > 30
                    ? 'bg-amber-400'
                    : 'bg-red-400',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={cn(
          'text-sm font-semibold tabular-nums whitespace-nowrap',
          pct === 100 ? 'text-emerald-600' : pct > 60 ? 'text-brand-600' : 'text-amber-600',
        )}>
          {pct}%
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-surface-500">
          {completedFields} de {totalFields} campos completados
        </span>

        {/* Document readiness badges */}
        <div className="flex items-center gap-2">
          {(Object.keys(documentReadiness) as Array<keyof typeof documentReadiness>).map((docType) => {
            const info = documentReadiness[docType];
            const ready = info.ready;
            return (
              <button
                key={docType}
                onClick={() => !ready && onDocClick?.(docType)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  ready
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer',
                )}
                title={
                  ready
                    ? `${DOC_LABELS[docType]}: Todos los campos completos`
                    : `Faltan: ${info.missingFields.join(', ')}`
                }
              >
                {ready ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {DOC_LABELS[docType]}
                {!ready && (
                  <span className="text-2xs">({info.missingCount})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
