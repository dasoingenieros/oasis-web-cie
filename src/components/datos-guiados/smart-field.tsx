'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface SmartFieldProps {
  name: string;
  label: string;
  inputType?: string;
  options?: string[];
  value: any;
  group: string;
  onChange: (name: string, value: any) => void;
  disabled?: boolean;
  missing?: boolean; // required field that is empty
  uppercase?: boolean; // force uppercase display
}

/** Title-case display for uppercase option values (e.g. 'CALLE' → 'Calle') */
function optionLabel(opt: string): string {
  if (!opt) return opt;
  return opt.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

export function SmartField({
  name,
  label,
  inputType = 'text',
  options,
  value,
  group,
  onChange,
  disabled,
  missing,
  uppercase,
}: SmartFieldProps) {
  const isCalculated = group === 'C';
  const isDisabled = disabled || isCalculated;
  const displayValue = value ?? '';

  // Calculated fields: grey background with lock icon
  if (isCalculated) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-surface-500 flex items-center gap-1">
          <Lock className="h-3 w-3" />
          {label}
        </Label>
        <div className="flex h-9 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-600">
          {displayValue !== '' ? String(displayValue) : '—'}
        </div>
      </div>
    );
  }

  // Boolean fields
  if (inputType === 'boolean') {
    return (
      <div className="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          id={name}
          checked={!!value}
          onChange={(e) => onChange(name, e.target.checked)}
          disabled={isDisabled}
          className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
        />
        <Label htmlFor={name} className="text-sm text-surface-700 cursor-pointer">
          {label}
        </Label>
      </div>
    );
  }

  // Select fields
  if (inputType === 'select' && options && options.length > 0) {
    return (
      <div className="space-y-1">
        <Label htmlFor={name} className="text-xs text-surface-600">{label}</Label>
        <Select
          value={displayValue !== '' ? String(displayValue) : undefined}
          onValueChange={(val) => onChange(name, val)}
          disabled={isDisabled}
        >
          <SelectTrigger
            className={cn(
              'h-9 text-sm',
              missing && 'border-amber-400 bg-amber-50/50',
              isDisabled && 'opacity-60',
            )}
          >
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>{optionLabel(opt)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Textarea
  if (inputType === 'textarea') {
    return (
      <div className="space-y-1">
        <Label htmlFor={name} className="text-xs text-surface-600">{label}</Label>
        <textarea
          id={name}
          value={displayValue}
          onChange={(e) => onChange(name, e.target.value)}
          disabled={isDisabled}
          rows={3}
          className={cn(
            'flex w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
            missing && 'border-amber-400 bg-amber-50/50',
          )}
        />
      </div>
    );
  }

  // Number / Text input
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs text-surface-600">{label}</Label>
      <Input
        id={name}
        type={inputType === 'number' ? 'number' : 'text'}
        value={displayValue}
        onChange={(e) => {
          const val = inputType === 'number'
            ? (e.target.value === '' ? null : Number(e.target.value))
            : e.target.value;
          onChange(name, val);
        }}
        disabled={isDisabled}
        className={cn(
          'h-9 text-sm',
          missing && 'border-amber-400 bg-amber-50/50',
          isDisabled && 'opacity-60',
          uppercase && 'uppercase',
        )}
      />
    </div>
  );
}
