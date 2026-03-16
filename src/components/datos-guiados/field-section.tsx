'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartField } from './smart-field';
import type { FieldConfigField } from '@/lib/types';

interface FieldSectionProps {
  id: string;
  label: string;
  fields: FieldConfigField[];
  defaultExpanded?: boolean;
  disabledFields?: Set<string>;
  onChange: (name: string, value: any) => void;
  /** Extra content rendered before the fields (e.g. "misma dirección" checkbox) */
  headerExtra?: React.ReactNode;
}

const SECTION_ICONS: Record<string, string> = {
  titular: '\u{1F4CB}',
  emplazamiento: '\u{1F4CD}',
  tecnico: '\u{26A1}',
  acometida: '\u{1F50C}',
  cgp: '\u{1F4E6}',
  lga: '\u{1F4CF}',
  di: '\u{1F50C}',
  modulo_medida: '\u{1F4D0}',
  protecciones: '\u{1F6E1}',
  tierra: '\u{26CF}',
  presupuesto: '\u{1F4B0}',
  certificacion: '\u{1F4DD}',
  firma: '\u{270D}',
  info: '\u{1F4AC}',
};

export function FieldSection({
  id,
  label,
  fields,
  defaultExpanded,
  disabledFields,
  onChange,
  headerExtra,
}: FieldSectionProps) {
  // Count required (non-optional) fields that are missing
  const requiredFields = fields.filter((f) => f.group === 'A' || f.group === 'B');
  const missingRequired = requiredFields.filter((f) => !f.isComplete && !f.optional);
  const allOptional = requiredFields.length === 0 || requiredFields.every((f) => f.optional);

  const [expanded, setExpanded] = useState(
    defaultExpanded ?? missingRequired.length > 0,
  );

  const icon = SECTION_ICONS[id] ?? '\u{1F4C4}';

  // Status indicator
  let statusEl: React.ReactNode;
  if (allOptional) {
    statusEl = (
      <span className="flex items-center gap-1 text-xs text-surface-400">
        <Circle className="h-3.5 w-3.5" />
        Opcional
      </span>
    );
  } else if (missingRequired.length === 0) {
    statusEl = (
      <span className="flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completo
      </span>
    );
  } else {
    statusEl = (
      <span className="flex items-center gap-1 text-xs text-amber-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        Faltan {missingRequired.length}
      </span>
    );
  }

  return (
    <div className="border border-surface-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-surface-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-surface-400" />
          )}
          <span className="text-base" aria-hidden>{icon}</span>
          <span className="text-sm font-semibold text-surface-800">{label}</span>
        </div>
        {statusEl}
      </button>

      {/* Fields */}
      {expanded && (
        <div className="p-4 space-y-3">
          {headerExtra}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
            {fields.map((field) => (
              <SmartField
                key={field.name}
                name={field.name}
                label={field.label}
                inputType={field.inputType}
                options={field.options}
                value={field.currentValue}
                group={field.group}
                onChange={onChange}
                disabled={disabledFields?.has(field.name)}
                missing={
                  !field.isComplete && !field.optional && (field.group === 'A' || field.group === 'B')
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
