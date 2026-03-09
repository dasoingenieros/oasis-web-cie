'use client';

import Link from 'next/link';
import { cn, formatRelativeTime, getStatusLabel, getStatusClasses, getSupplyTypeLabel } from '@/lib/utils';
import type { Installation } from '@/lib/types';
import { MapPin, Clock, ArrowRight, Trash2 } from 'lucide-react';

interface InstallationCardProps {
  installation: Installation;
  onDelete?: (id: string) => void;
}

export function InstallationCard({ installation, onDelete }: InstallationCardProps) {
  const { id, titularName, address, supplyType, status, updatedAt } = installation;

  return (
    <div className="group relative flex flex-col rounded-xl border border-surface-200 bg-white p-5 transition-all hover:border-surface-300 hover:shadow-md">
      {/* Status badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className={cn('status-badge', getStatusClasses(status))}>
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              status === 'DRAFT' && 'bg-surface-400',
              status === 'CALCULATED' && 'bg-blue-500',
              status === 'PENDING_REVIEW' && 'bg-amber-500',
              status === 'RETURNED' && 'bg-red-500',
              status === 'APPROVED' && 'bg-emerald-500',
              status === 'DOCUMENTED' && 'bg-violet-500',
              status === 'COMPLETED' && 'bg-green-500',
            )}
          />
          {getStatusLabel(status)}
        </span>

        <span className="text-2xs text-surface-500">
          {getSupplyTypeLabel(supplyType)}
        </span>
      </div>

      {/* Titular name */}
      <h3 className="text-sm font-semibold text-surface-900 truncate">
        {titularName || 'Sin titular'}
      </h3>

      {/* Address */}
      {address && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-surface-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{address}</span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-surface-200 pt-3">
        <div className="flex items-center gap-1 text-xs text-surface-400">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(updatedAt)}</span>
        </div>

        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(id);
              }}
              className="rounded p-1 text-surface-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <Link
            href={`/instalaciones/${id}`}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50"
          >
            Abrir
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
