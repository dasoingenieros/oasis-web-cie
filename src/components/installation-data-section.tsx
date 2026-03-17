'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { installationsApi } from '@/lib/api-client';
import type { Installation } from '@/lib/types';
import { Cable, Gauge, Zap, HelpCircle, Save, Check, Loader2 } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

const TIPOS_CGP = ['CGP', 'BTV', 'N/A'];
const ESQUEMAS_CGP: Record<string, string[]> = {
  CGP: ['7', '8', '9', '10', '11'],
  BTV: ['C', 'D'],
};
const TIPOS_MODULO = ['PANELABLE', 'ENVOLVENTE', 'ARMARIO', 'INDEPENDIENTE'];
const SITUACION_MODULO = ['INTERIOR', 'FACHADA'];
const CONTADOR_UBICACION = ['ARMARIO', 'LOCAL', 'CPM'];
const DI_MATERIALS = ['CU', 'AL'];
const DI_SECTIONS = ['6', '10', '16', '25', '35', '50', '70', '95', '120'];

// ─── Tooltip descriptions ───
const ESQUEMA_CGP_TOOLTIPS: Record<string, string> = {
  '7': '7 — Acometida inferior, salida superior (el más habitual)',
  '8': '8 — Acometida superior, salida inferior',
  '9': '9 — Acometida y salida inferior',
  '10': '10 — Acometida y salida superior',
  '11': '11 — Acometida lateral',
  'C': 'C — Disposición vertical',
  'D': 'D — Disposición horizontal',
};

const FIELD_TOOLTIPS: Record<string, string> = {
  tipoCgp: 'CGP: Caja General · BTV: Bases Tripolares · N/A: No aplica',
  esquemaCgp: Object.values(ESQUEMA_CGP_TOOLTIPS).map(s => s.replace(/ — .*/, '')).join(' · '),
  tipoModuloMedida: 'Panelable · Envolvente · Armario · Independiente',
  situacionModulo: 'Interior (dentro del edificio) · Fachada (vía pública)',
  materialDi: 'CU: Cobre (estándar) · AL: Aluminio (más económico)',
};

function FieldLabel({ text, tooltip }: { text: string; tooltip?: string }) {
  return (
    <label className="text-[11px] text-surface-500 mb-0.5 flex items-center gap-1">
      {text}
      {tooltip && (
        <Tooltip content={tooltip} side="bottom" maxWidth={300}>
          <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
        </Tooltip>
      )}
    </label>
  );
}

const selectCls = 'h-7 rounded border border-surface-300 bg-white px-1.5 text-xs';
const inputCls = 'no-spinner h-7 rounded border border-surface-300 bg-white px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-400';
const readonlyCls = 'h-7 flex items-center text-xs text-surface-500 bg-surface-50 rounded px-1.5';

const noSpinnerStyle = `
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .no-spinner[type=number] { -moz-appearance: textfield; }
`;

interface InstallationDataSectionProps {
  installationId: string;
  installation?: Installation;
}

interface InstDataState {
  tipoCgp: string;
  esquemaCgp: string;
  inBaseCgp: number | null;
  inCartuchoCgp: number | null;
  tipoModuloMedida: string;
  situacionModulo: string;
  contadorUbicacion: string;
  longitudDi: number | null;
  materialDi: string;
  seccionDi: number | null;
  cdtDi: number | null;
}

export function InstallationDataSection({ installationId, installation }: InstallationDataSectionProps) {
  const [data, setData] = useState<InstDataState>({
    tipoCgp: 'CGP',
    esquemaCgp: '',
    inBaseCgp: null,
    inCartuchoCgp: null,
    tipoModuloMedida: 'PANELABLE',
    situacionModulo: 'FACHADA',
    contadorUbicacion: 'CPM',
    longitudDi: null,
    materialDi: 'CU',
    seccionDi: null,
    cdtDi: null,
  });
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<InstDataState | null>(null);

  // Load from installation or fetch
  useEffect(() => {
    if (loaded) return;
    const load = async () => {
      try {
        const inst = installation ?? await installationsApi.get(installationId);
        if (inst) {
          setData({
            tipoCgp: (inst as any).tipoCgp || 'CGP',
            esquemaCgp: (inst as any).esquemaCgp || '',
            inBaseCgp: (inst as any).inBaseCgp ?? null,
            inCartuchoCgp: (inst as any).inCartuchoCgp ?? null,
            tipoModuloMedida: (inst as any).tipoModuloMedida || 'PANELABLE',
            situacionModulo: (inst as any).situacionModulo || 'FACHADA',
            contadorUbicacion: (inst as any).contadorUbicacion || 'CPM',
            longitudDi: inst.longitudDi ?? null,
            materialDi: inst.materialDi || 'CU',
            seccionDi: inst.seccionDi ?? null,
            cdtDi: (inst as any).cdtDi ?? null,
          });
        }
      } catch {
        // ignore
      }
      setLoaded(true);
    };
    load();
  }, [installationId, installation, loaded]);

  // Persist helper — used by debounce, flush, and manual save
  const doSave = useCallback(async (d: InstDataState) => {
    setSaveStatus('saving');
    try {
      await installationsApi.update(installationId, {
        tipoCgp: d.tipoCgp,
        esquemaCgp: d.esquemaCgp || undefined,
        inBaseCgp: d.inBaseCgp,
        inCartuchoCgp: d.inCartuchoCgp,
        tipoModuloMedida: d.tipoModuloMedida,
        situacionModulo: d.situacionModulo,
        contadorUbicacion: d.contadorUbicacion,
        longitudDi: d.longitudDi,
        materialDi: d.materialDi,
        seccionDi: d.seccionDi,
      } as any);
      pendingDataRef.current = null;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 1500);
    } catch {
      setSaveStatus('idle');
    }
  }, [installationId]);

  // Auto-save with debounce
  const scheduleAutoSave = useCallback((newData: InstDataState) => {
    pendingDataRef.current = newData;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSave(newData), 1000);
  }, [doSave]);

  // Flush pending save on unmount instead of discarding it
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (pendingDataRef.current) {
        // Fire-and-forget: save pending changes before unmount
        const d = pendingDataRef.current;
        installationsApi.update(installationId, {
          tipoCgp: d.tipoCgp,
          esquemaCgp: d.esquemaCgp || undefined,
          inBaseCgp: d.inBaseCgp,
          inCartuchoCgp: d.inCartuchoCgp,
          tipoModuloMedida: d.tipoModuloMedida,
          situacionModulo: d.situacionModulo,
          contadorUbicacion: d.contadorUbicacion,
          longitudDi: d.longitudDi,
          materialDi: d.materialDi,
          seccionDi: d.seccionDi,
        } as any).catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((field: keyof InstDataState, value: string | number | null) => {
    setData(prev => {
      const next = { ...prev, [field]: value };
      scheduleAutoSave(next);
      return next;
    });
  }, [scheduleAutoSave]);

  const handleManualSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingDataRef.current = null;
    doSave(data);
  }, [data, doSave]);

  if (!loaded) return null;

  return (
    <div className="space-y-3 mb-4">
      <style>{noSpinnerStyle}</style>

      {/* Header with save button */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleManualSave}
          disabled={saveStatus === 'saving'}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
            saveStatus === 'saved'
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : saveStatus === 'saving'
                ? 'bg-surface-100 text-surface-400 border border-surface-200 cursor-wait'
                : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
          }`}
        >
          {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
          {saveStatus === 'saved' && <Check className="h-3 w-3" />}
          {saveStatus === 'idle' && <Save className="h-3 w-3" />}
          {saveStatus === 'saving' ? 'Guardando…' : saveStatus === 'saved' ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      {/* CGP */}
      <div className="rounded-lg border border-surface-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-semibold text-surface-700">C.G.P.</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <FieldLabel text="Tipo" tooltip={FIELD_TOOLTIPS.tipoCgp} />
            <select
              value={data.tipoCgp}
              onChange={e => {
                const newTipo = e.target.value;
                update('tipoCgp', newTipo);
                // Reset esquemaCgp when tipo changes
                const opts = ESQUEMAS_CGP[newTipo];
                setData(prev => ({ ...prev, tipoCgp: newTipo, esquemaCgp: opts?.[0] ?? '' }));
              }}
              className={`${selectCls} w-full`}
            >
              {TIPOS_CGP.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {data.tipoCgp !== 'N/A' && (
          <div>
            <FieldLabel text="Esquema" tooltip={FIELD_TOOLTIPS.esquemaCgp} />
            <select
              value={data.esquemaCgp}
              onChange={e => update('esquemaCgp', e.target.value)}
              className={`${selectCls} w-full`}
            >
              <option value="">—</option>
              {(ESQUEMAS_CGP[data.tipoCgp] ?? []).map(s => (
                <option key={s} value={s}>{ESQUEMA_CGP_TOOLTIPS[s] ?? s}</option>
              ))}
            </select>
          </div>
          )}
          <div>
            <FieldLabel text="In base (A)" />
            <input
              type="number"
              value={data.inBaseCgp ?? ''}
              onChange={e => update('inBaseCgp', e.target.value ? Number(e.target.value) : null)}
              className={`${inputCls} w-full`}
              placeholder="A"
              min={0}
            />
          </div>
          <div>
            <FieldLabel text="In cartucho (A)" />
            <input
              type="number"
              value={data.inCartuchoCgp ?? ''}
              onChange={e => update('inCartuchoCgp', e.target.value ? Number(e.target.value) : null)}
              className={`${inputCls} w-full`}
              placeholder="A"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Modulo de medida */}
      <div className="rounded-lg border border-surface-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs font-semibold text-surface-700">Modulo de medida</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <FieldLabel text="Tipo" tooltip={FIELD_TOOLTIPS.tipoModuloMedida} />
            <select
              value={data.tipoModuloMedida}
              onChange={e => update('tipoModuloMedida', e.target.value)}
              className={`${selectCls} w-full`}
            >
              {TIPOS_MODULO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel text="Situacion" tooltip={FIELD_TOOLTIPS.situacionModulo} />
            <select
              value={data.situacionModulo}
              onChange={e => update('situacionModulo', e.target.value)}
              className={`${selectCls} w-full`}
            >
              {SITUACION_MODULO.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel text="Contador" />
            <select
              value={data.contadorUbicacion}
              onChange={e => update('contadorUbicacion', e.target.value)}
              className={`${selectCls} w-full`}
            >
              {CONTADOR_UBICACION.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* DI */}
      <div className="rounded-lg border border-surface-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Cable className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-surface-700">Derivacion Individual (DI)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <FieldLabel text="Seccion (mm²)" />
            <select
              value={data.seccionDi != null ? String(data.seccionDi) : ''}
              onChange={e => update('seccionDi', e.target.value ? Number(e.target.value) : null)}
              className={`${selectCls} w-full`}
            >
              <option value="">—</option>
              {DI_SECTIONS.map(s => <option key={s} value={s}>{s} mm²</option>)}
            </select>
          </div>
          <div>
            <FieldLabel text="Material" tooltip={FIELD_TOOLTIPS.materialDi} />
            <select
              value={data.materialDi}
              onChange={e => update('materialDi', e.target.value)}
              className={`${selectCls} w-full`}
            >
              {DI_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel text="Longitud (m) *" />
            <input
              type="number"
              value={data.longitudDi ?? ''}
              onChange={e => update('longitudDi', e.target.value ? Number(e.target.value) : null)}
              className={`${inputCls} w-full`}
              placeholder="m"
              min={0}
              step={0.1}
            />
          </div>
          <div>
            <FieldLabel text="CdT (%)" />
            <div className={readonlyCls}>
              {data.cdtDi != null ? `${data.cdtDi.toFixed(3)}%` : '—'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
