'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { LOCALIDAD_MADRID_OPTIONS } from '@/lib/portal-constants';

const options: Array<{ value: string; label: string }> = [...LOCALIDAD_MADRID_OPTIONS];

/**
 * Combobox con búsqueda para seleccionar localidad (municipio de Madrid).
 * Reutilizable en cualquier página — acepta value/onChange como un input controlado.
 */
export function LocalidadCombobox({ value, onChange, className, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={className} ref={wrapperRef}>
      <div className="relative">
        <input
          ref={inputRef}
          className="h-9 rounded-md border border-surface-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 w-full"
          value={open ? search : selectedLabel}
          placeholder={placeholder ?? 'Buscar localidad...'}
          onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(''); }}
          autoComplete="off"
        />
        {value && !open && (
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 text-xs" onClick={() => { onChange(''); setSearch(''); inputRef.current?.focus(); }}>✕</button>
        )}
        {open && (
          <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-surface-200 bg-white shadow-lg text-sm">
            {filtered.length === 0 && <li className="px-3 py-2 text-surface-400">Sin resultados</li>}
            {filtered.map((o) => (
              <li key={o.value} className={`px-3 py-1.5 cursor-pointer hover:bg-blue-50 ${o.value === value ? 'bg-blue-100 font-medium' : ''}`} onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setOpen(false); setSearch(''); }}>
                {o.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
