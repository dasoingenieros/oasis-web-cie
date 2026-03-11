'use client';

import React, { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Button } from '@/components/ui/button';
import type { Circuit, CreateCircuitDto, SupplyType, ElectricalPanel, CalculationResult } from '@/lib/types';
import { panelsApi } from '@/lib/api-client';
import { getTemplatesForSupplyType, type CircuitTemplate } from '@/lib/schemas';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  Wand2,
  Calculator,
  AlertTriangle,
  Settings2,
  X,
} from 'lucide-react';

// ─── Constantes normalizadas ─────────────────────────────────

/** Calibres normalizados de PIA */
const PIA_RATINGS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];

/** Intensidades de cálculo normalizadas (= calibres PIA) */
const I_CALC_VALUES = PIA_RATINGS;

/** Secciones normalizadas mm² y su Iz para Cu/PVC/A1 (ITC-BT-19 Tabla 1) */
const SECTION_TABLE: { section: number; iz: number }[] = [
  { section: 1.5,  iz: 13 },
  { section: 2.5,  iz: 17.5 },
  { section: 4,    iz: 23 },
  { section: 6,    iz: 30 },
  { section: 10,   iz: 40 },
  { section: 16,   iz: 52 },
  { section: 25,   iz: 68 },
  { section: 35,   iz: 83 },
  { section: 50,   iz: 99 },
  { section: 70,   iz: 125 },
  { section: 95,   iz: 150 },
  { section: 120,  iz: 173 },
];

/** Dado un calibre PIA, devuelve la sección mínima necesaria */
function sectionForPia(piaA: number): number {
  const entry = SECTION_TABLE.find((s) => s.iz >= piaA);
  return entry?.section ?? 120;
}

/** Dado I de cálculo, devuelve el PIA normalizado ≥ I */
function piaForICalc(iCalcA: number): number {
  return PIA_RATINGS.find((p) => p >= iCalcA) ?? PIA_RATINGS[PIA_RATINGS.length - 1]!;
}

// ─── ITC-BT-25 Constraints ───────────────────────────────────

/** Límites por circuito según ITC-BT-25 Tabla 1 */
const ITC_BT25_CONSTRAINTS: Record<string, { maxPiaA: number; minSectionMm2: number }> = {
  'C1':   { maxPiaA: 10, minSectionMm2: 1.5 },
  'C2':   { maxPiaA: 16, minSectionMm2: 2.5 },
  'C3':   { maxPiaA: 25, minSectionMm2: 6 },
  'C4':   { maxPiaA: 20, minSectionMm2: 4 },
  'C4.1': { maxPiaA: 20, minSectionMm2: 4 },
  'C4.2': { maxPiaA: 20, minSectionMm2: 4 },
  'C4.3': { maxPiaA: 20, minSectionMm2: 4 },
  'C5':   { maxPiaA: 16, minSectionMm2: 2.5 },
  'C6':   { maxPiaA: 10, minSectionMm2: 1.5 },
  'C7':   { maxPiaA: 16, minSectionMm2: 2.5 },
  'C8':   { maxPiaA: 25, minSectionMm2: 6 },
  'C9':   { maxPiaA: 25, minSectionMm2: 6 },
  'C10':  { maxPiaA: 20, minSectionMm2: 4 },
  'C11':  { maxPiaA: 10, minSectionMm2: 1.5 },
  'C12':  { maxPiaA: 16, minSectionMm2: 2.5 },
};

const MAX_CIRCUITS_PER_DIFF_VIVIENDA = 5;

// ─── Validation ─────────────────────────────────────────────

interface ValidationError {
  circuitKey: string;
  circuitLabel: string;
  rule: string;
  actual: string;
  expected: string;
}

function validateBeforeCalc(
  rows: CircuitRow[],
  panel: ElectricalPanel | null,
  supplyType: string | null | undefined,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const isVivienda = supplyType?.startsWith('VIVIENDA');

  for (const row of rows) {
    const label = [row.code, row.name].filter(Boolean).join(' — ') || `Circuito #${row.order}`;

    // ── Required fields
    if (!row.name) {
      errors.push({ circuitKey: row.key, circuitLabel: label, rule: 'Nombre obligatorio', actual: '(vacío)', expected: 'Nombre del circuito' });
    }
    if (row.iCalcA <= 0) {
      errors.push({ circuitKey: row.key, circuitLabel: label, rule: 'Intensidad de cálculo > 0', actual: `${row.iCalcA} A`, expected: '> 0 A' });
    }
    if (row.length <= 0) {
      errors.push({ circuitKey: row.key, circuitLabel: label, rule: 'Longitud > 0', actual: `${row.length} m`, expected: '> 0 m' });
    }

    // ── ITC-BT-25 constraints (for codes C1-C12) — only for viviendas
    if (isVivienda) {
      const constraint = ITC_BT25_CONSTRAINTS[row.code];
      if (constraint) {
        const piaA = piaForICalc(row.iCalcA);
        if (piaA > constraint.maxPiaA) {
          errors.push({
            circuitKey: row.key, circuitLabel: label,
            rule: `PIA máx. ITC-BT-25 (${row.code})`,
            actual: `${piaA} A`,
            expected: `≤ ${constraint.maxPiaA} A`,
          });
        }
        const sectionMm2 = sectionForPia(piaA);
        if (sectionMm2 < constraint.minSectionMm2) {
          errors.push({
            circuitKey: row.key, circuitLabel: label,
            rule: `Sección mín. ITC-BT-25 (${row.code})`,
            actual: `${sectionMm2} mm²`,
            expected: `≥ ${constraint.minSectionMm2} mm²`,
          });
        }
      }
    }

    // ── Thermal check: Iz corrected ≥ I cálculo
    if (row.iCalcA > 0) {
      const piaA = piaForICalc(row.iCalcA);
      const sectionMm2 = sectionForPia(piaA);
      const entry = SECTION_TABLE.find((s) => s.section === sectionMm2);
      if (entry) {
        const izCorrected = entry.iz * row.tempCorrFactor * row.groupCorrFactor;
        if (izCorrected < row.iCalcA) {
          errors.push({
            circuitKey: row.key, circuitLabel: label,
            rule: 'Criterio térmico (Iz corregida ≥ I cálc.)',
            actual: `Iz = ${izCorrected.toFixed(1)} A`,
            expected: `≥ ${row.iCalcA} A (revisar factores corrección)`,
          });
        }
      }
    }
  }

  // ── Max circuits per differential (viviendas — ITC-BT-25)
  if (isVivienda && panel?.differentials) {
    for (const diff of panel.differentials) {
      if (diff.circuits.length > MAX_CIRCUITS_PER_DIFF_VIVIENDA) {
        // Mark all circuits beyond the limit
        for (let i = MAX_CIRCUITS_PER_DIFF_VIVIENDA; i < diff.circuits.length; i++) {
          const c = diff.circuits[i]!;
          errors.push({
            circuitKey: c.id,
            circuitLabel: `Dif. "${diff.name}"`,
            rule: `Máx. ${MAX_CIRCUITS_PER_DIFF_VIVIENDA} circuitos/diferencial (ITC-BT-25)`,
            actual: `${diff.circuits.length} circuitos asignados`,
            expected: `≤ ${MAX_CIRCUITS_PER_DIFF_VIVIENDA} circuitos`,
          });
        }
      }
    }
  }

  // ── Circuito trifásico (400V) solo en diferencial 4P
  if (panel?.differentials) {
    for (const diff of panel.differentials) {
      if (diff.poles === 2) {
        for (const c of diff.circuits) {
          const row = rows.find((r) => r.key === c.id);
          if (row && row.voltage === 400) {
            errors.push({
              circuitKey: c.id,
              circuitLabel: row.name || `Circuito #${row.order}`,
              rule: 'Circuito trifásico requiere diferencial 4P',
              actual: `Dif. "${diff.name}" (2P)`,
              expected: 'Diferencial de 4 polos',
            });
          }
        }
      }
    }
  }

  return errors;
}

// ─── Types ───────────────────────────────────────────────────

export interface CuadroFormHandle { addRow: () => void; }
interface CuadroFormProps {
  circuits: Circuit[];
  supplyType: SupplyType | string | null | undefined;
  supplyResult?: any;
  installation?: any;
  installationId: string;
  calculation?: CalculationResult | null;
  isSaving: boolean;
  isCalculating: boolean;
  onSave: (circuits: CreateCircuitDto[]) => Promise<void>;
  onCalculate: () => Promise<boolean>;
}

interface ManiobraDevice {
  type: string;   // CONTACTOR, GUARDAMOTOR, RELOJ, SECCIONADOR
  calibreA?: number;
  label?: string;
}

interface CircuitRow {
  key: string;
  code: string;
  name: string;
  order: number;
  iCalcA: number;
  voltage: number;
  phases: number;
  length: number;
  cableType: 'CU' | 'AL';
  insulationType: 'PVC' | 'XLPE' | 'EPR';
  installMethod: string;
  cosPhi: number;
  tempCorrFactor: number;
  groupCorrFactor: number;
  installedPowerKw: string;
  isItcBt25: boolean;
  // Maniobra — cadena de dispositivos en serie
  maniobraChain: ManiobraDevice[];
  // Campos resultado (tras calcular)
  resultSection?: string;
  resultSectionMm2?: number;
  resultCdtV?: number;
  resultPmaxKw?: number;
  resultPiaA?: number;
}

let keyCounter = 0;
function nextKey(): string {
  return `c_${++keyCounter}`;
}

function isItcBt25Code(code: string): boolean {
  const itcCodes = ['C1','C2','C3','C4','C4.1','C4.2','C4.3','C5','C6','C7','C8','C9','C10','C11','C12'];
  return itcCodes.includes(code);
}

function templateToRow(t: CircuitTemplate, order: number): CircuitRow {
  const iCalcA = t.piaA ?? piaForICalc(Math.ceil(t.power / t.voltage));
  return {
    key: nextKey(),
    code: t.code,
    name: t.name,
    order,
    iCalcA,
    voltage: t.voltage,
    phases: t.phases,
    length: t.defaultLength,
    cableType: t.cableType,
    insulationType: t.insulationType,
    installMethod: t.installMethod,
    cosPhi: t.cosPhi,
    tempCorrFactor: 1,
    groupCorrFactor: 1,
    installedPowerKw: '',
    isItcBt25: isItcBt25Code(t.code),
    maniobraChain: [],
  };
}

function circuitToRow(c: Circuit): CircuitRow {
  const iCalcA = Math.round(c.power / c.voltage);
  return {
    key: c.id,
    code: c.code ?? '',
    name: c.name,
    order: c.order,
    iCalcA,
    voltage: c.voltage,
    phases: c.phases,
    length: c.length,
    cableType: c.cableType as 'CU' | 'AL',
    insulationType: c.insulationType as 'PVC' | 'XLPE' | 'EPR',
    installMethod: c.installMethod,
    cosPhi: c.cosPhi,
    tempCorrFactor: c.tempCorrFactor,
    groupCorrFactor: c.groupCorrFactor,
    installedPowerKw: '',
    isItcBt25: isItcBt25Code(c.code ?? ''),
    maniobraChain: (c.maniobraExtra as any)?.chain ?? (c.maniobraType ? [{ type: c.maniobraType, calibreA: c.maniobraCalibreA ?? undefined }] : []),
    // Result fields are populated from CalculationResult, not from circuit DB
  };
}

function emptyRow(order: number): CircuitRow {
  return {
    key: nextKey(),
    code: '',
    name: '',
    order,
    iCalcA: 16,
    voltage: 230,
    phases: 1,
    length: 15,
    cableType: 'CU',
    insulationType: 'PVC',
    installMethod: 'A1',
    cosPhi: 1,
    tempCorrFactor: 1,
    groupCorrFactor: 1,
    installedPowerKw: '',
    isItcBt25: false,
    maniobraChain: [],
  };
}

/** Nomenclatura tipo instalación ITC-BT-26 */
const INSTALL_TYPE_LABELS: Record<string, string> = {
  'A1': 'E.T.F.',
  'A2': 'E.T.C.',
  'B1': 'S.T.C.',
  'B2': 'S.T.R.',
  'C':  'S.C.P.F.',
  'D':  'ENTR.',
  'E':  'BANDJ.',
};

/** Tipos de dispositivo de maniobra individuales */
const MANIOBRA_DEVICE_TYPES: { value: string; label: string; short: string; hasCalibre: boolean }[] = [
  { value: 'CONTACTOR', label: 'Contactor', short: 'KM', hasCalibre: true },
  { value: 'GUARDAMOTOR', label: 'Guardamotor', short: 'GV', hasCalibre: true },
  { value: 'RELOJ', label: 'Reloj horario', short: 'KT', hasCalibre: false },
  { value: 'SECCIONADOR', label: 'Seccionador', short: 'QS', hasCalibre: true },
];

/** Parsea un string con coma o punto a número */
function parseDecimal(val: string): number {
  const normalized = val.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

// ─── Estilos para ocultar flechas de inputs numéricos ────────
const noSpinnerStyle = `
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .no-spinner[type=number] {
    -moz-appearance: textfield;
  }
`;

// ─── Component ───────────────────────────────────────────────

export const CuadroForm = forwardRef<CuadroFormHandle, CuadroFormProps>(function CuadroForm({
  circuits,
  supplyType,
  supplyResult,
  installation,
  installationId,
  calculation,
  isSaving,
  isCalculating,
  onSave,
  onCalculate,
}, ref) {
  const [rows, setRows] = useState<CircuitRow[]>([]);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expandedManiobra, setExpandedManiobra] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<ElectricalPanel | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const failedKeys = useMemo(() => new Set(validationErrors.map((e) => e.circuitKey)), [validationErrors]);

  // Fetch panel data to check differentials — refetch when circuits change
  // (user flow: save circuits → create differentials → assign → calculate)
  const fetchPanel = useCallback(() => {
    if (installationId) {
      panelsApi.get(installationId).then(setPanel).catch(() => setPanel(null));
    }
  }, [installationId]);

  useEffect(() => { fetchPanel(); }, [fetchPanel, circuits]);

  // Calculate whether the "Calcular" button should be disabled
  const calcDisabledReason = useMemo(() => {
    if (rows.length === 0) return 'Añade circuitos y asígnalos a diferenciales antes de calcular';
    if (!panel || !panel.differentials || panel.differentials.length === 0)
      return 'Añade circuitos y asígnalos a diferenciales antes de calcular';
    // Check if all saved circuits are assigned to a differential
    const assignedCircuitIds = new Set(panel.differentials.flatMap(d => d.circuits.map(c => c.id)));
    const savedCircuits = circuits.filter(c => c.id);
    if (savedCircuits.length > 0 && savedCircuits.some(c => !assignedCircuitIds.has(c.id)))
      return 'Añade circuitos y asígnalos a diferenciales antes de calcular';
    return null;
  }, [rows.length, panel, circuits]);

  // Build lookup of calculation results by circuit ID
  const calcResultsById = useMemo(() => {
    const map = new Map<string, any>();
    if (!calculation?.resultSnapshot) return map;
    const snap = calculation.resultSnapshot as any;
    const circuitResults = snap?.circuits ?? [];
    for (const cr of circuitResults) {
      if (cr?.id) map.set(cr.id, cr);
    }
    return map;
  }, [calculation]);

  useEffect(() => {
    if (circuits.length > 0) {
      const baseRows = circuits.map(circuitToRow);
      // Merge calculation results into rows (read-only display, never modifies circuit DB)
      if (calcResultsById.size > 0) {
        for (const row of baseRows) {
          const cr = calcResultsById.get(row.key);
          if (cr) {
            const nCond = row.voltage === 400 ? 4 : 2;
            row.resultSection = `${nCond}×${cr.sectionMm2}`;
            row.resultSectionMm2 = cr.sectionMm2;
            row.resultCdtV = cr.voltageDropV ?? (cr.voltageDropPct != null
              ? Math.round(row.voltage * (cr.voltageDropPct / 100) * 100) / 100
              : undefined);
            row.resultPmaxKw = cr.calculatedPowerW != null
              ? Math.round(cr.calculatedPowerW / 10) / 100
              : undefined;
            row.resultPiaA = cr.breakerRatingA;
          }
        }
      }
      setRows(baseRows);
    }
  }, [circuits, calcResultsById]);

  const updateRow = useCallback((key: string, field: keyof CircuitRow, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
    setDirty(true);
  }, []);

  const removeRow = useCallback((key: string) => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.key !== key);
      return filtered.map((r, i) => ({ ...r, order: i + 1 }));
    });
    setDirty(true);
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow(prev.length + 1)]);
    setDirty(true);
  }, []);

  const addRowRef = useRef(addRow);
  addRowRef.current = addRow;
  useImperativeHandle(ref, () => ({ addRow: () => addRowRef.current() }), []);

  const toggleManiobra = useCallback((key: string) => {
    setExpandedManiobra((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const removeManiobra = useCallback((key: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key ? { ...r, maniobraChain: [] } : r,
      ),
    );
    setExpandedManiobra((prev) => { const next = new Set(prev); next.delete(key); return next; });
    setDirty(true);
  }, []);

  const loadTemplates = useCallback(() => {
    const templates = getTemplatesForSupplyType(supplyType ?? '');
    if (templates.length === 0) return;
    setRows(templates.map((t, i) => templateToRow(t, i + 1)));
    setDirty(true);
  }, [supplyType]);

  const handleSave = async () => {
    const invalid = rows.some((r) => !r.name || r.iCalcA <= 0 || r.length <= 0);
    if (invalid) {
      alert('Revisa los circuitos: nombre, intensidad y longitud son obligatorios.');
      return;
    }

    const dtos: CreateCircuitDto[] = rows.map((r) => ({
      name: r.name,
      code: r.code || undefined,
      order: r.order,
      power: r.voltage * r.iCalcA,
      voltage: r.voltage,
      phases: r.phases,
      length: r.length,
      cableType: r.cableType,
      insulationType: r.insulationType,
      installMethod: r.installMethod,
      cosPhi: r.cosPhi,
      tempCorrFactor: r.tempCorrFactor,
      groupCorrFactor: r.groupCorrFactor,
      maniobraType: r.maniobraChain.length > 0 ? r.maniobraChain[0].type : undefined,
      maniobraCalibreA: r.maniobraChain.length > 0 ? r.maniobraChain[0].calibreA : undefined,
      maniobraExtra: r.maniobraChain.length > 0 ? { chain: r.maniobraChain } : undefined,
    }));

    await onSave(dtos);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCalculate = async () => {
    // Refresh panel data before validating
    let currentPanel = panel;
    if (installationId) {
      try {
        currentPanel = await panelsApi.get(installationId);
        setPanel(currentPanel);
      } catch { /* keep existing */ }
    }

    // Pre-validation: ITC rules + circuit params + differential limits
    const errors = validateBeforeCalc(rows, currentPanel, supplyType);
    setValidationErrors(errors);
    if (errors.length > 0) return;

    if (dirty) {
      await handleSave();
    }
    await onCalculate();
  };

  const totalPowerW = rows.reduce((sum, r) => sum + r.voltage * r.iCalcA, 0);
  // P. máx. admisible: supplyResult (memoria) > installation (BD) > suma circuitos
  const maxPowerW = supplyResult?.designPowerW
    ?? (installation?.potMaxAdmisible ? installation.potMaxAdmisible * 1000 : undefined)
    ?? totalPowerW;

  // Clase base para selects compactos
  const selectCls = "h-7 w-full rounded border border-surface-300 bg-white px-1 text-xs";
  // Clase para inputs de texto sin flechas
  const inputCls = "no-spinner h-7 rounded border border-surface-300 bg-white px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400";

  return (
    <div className="space-y-4">
      {/* CSS para ocultar flechas */}
      <style>{noSpinnerStyle}</style>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-surface-500">
            {rows.length} circuito{rows.length !== 1 ? 's' : ''} · P. máx. admisible:{' '}
            <span className="font-medium text-surface-700">
              {(maxPowerW / 1000).toFixed(2)} kW
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {supplyType && supplyType !== 'LOCAL_COMERCIAL' && rows.length === 0 && (
            <Button variant="outline" size="sm" onClick={loadTemplates}>
              <Wand2 className="mr-2 h-3.5 w-3.5" />
              Cargar circuitos ITC-BT-25
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Añadir circuito
          </Button>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-surface-200 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-surface-400" />
          <p className="mt-3 text-sm font-medium text-surface-700">Sin circuitos definidos</p>
          <p className="mt-1 text-xs text-surface-500 max-w-xs">
            {supplyType && supplyType !== 'LOCAL_COMERCIAL'
              ? 'Pulsa "Cargar circuitos ITC-BT-25" para rellenar automáticamente, o añade circuitos manualmente.'
              : 'Añade los circuitos de la instalación manualmente.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-surface-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left text-[11px]">
                <th className="px-1.5 py-2 font-medium text-surface-700 w-7">#</th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-12">Cód.</th>
                <th className="px-1.5 py-2 font-medium text-surface-700 min-w-[60px]">Circuito</th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-16 text-right">P.Cálc.<br/><span className="font-normal text-surface-400">kW</span></th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-[70px] text-center">V / Fases</th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-14 text-center">I.Cálc.<br/><span className="font-normal text-surface-400">A</span></th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-20 text-center">Sección</th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-20 text-center">S.Calc.</th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-14 text-center">Mat</th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-20 text-center">Aisl.</th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-16 text-center">Inst.</th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-14">Long.<br/><span className="font-normal text-surface-400">m</span></th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-14 text-right">CdT<br/><span className="font-normal text-surface-400">V</span></th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-16 text-right">P.Adm.<br/><span className="font-normal text-surface-400">kW</span></th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-14">P.Inst.<br/><span className="font-normal text-surface-400">kW</span></th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-12 text-center">PIA<br/><span className="font-normal text-surface-400">A</span></th>
                <th className="px-1.5 py-2 font-medium text-surface-700 w-10 text-center">Man.</th>
                <th className="px-1.5 py-2 w-7" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const powerW = row.voltage * row.iCalcA;
                const pCalcKw = (powerW / 1000).toFixed(2);
                const piaA = piaForICalc(row.iCalcA);
                const sectionMm2 = sectionForPia(piaA);
                const nCond = row.voltage === 400 ? 4 : 2;
                const userSection = `${nCond}×${sectionMm2}`;
                const displayPia = row.resultPiaA ?? piaA;
                // Comparison: user section vs engine recommendation
                const hasCalcSection = row.resultSectionMm2 != null;
                const sectionInsufficient = hasCalcSection && sectionMm2 < row.resultSectionMm2!;

                return (
                  <React.Fragment key={row.key}>
                  <tr
                    className={`border-b transition-colors hover:bg-surface-50/50${
                      failedKeys.has(row.key)
                        ? ' bg-red-50 border-red-300'
                        : row.maniobraChain.length > 0
                          ? ' bg-blue-500/5 border-surface-600'
                          : ' border-surface-600'
                    }`}
                  >
                    {/* # */}
                    <td className="px-1.5 py-1 text-surface-400 tabular-nums text-xs">
                      {row.order}
                    </td>
                    {/* Código */}
                    <td className="px-1.5 py-1">
                      <input
                        value={row.code}
                        onChange={(e) => updateRow(row.key, 'code', e.target.value)}
                        className={`${inputCls} w-12`}
                        placeholder="—"
                      />
                    </td>
                    {/* Circuito */}
                    <td className="px-1.5 py-1">
                      <input
                        value={row.name}
                        onChange={(e) => updateRow(row.key, 'name', e.target.value)}
                        className={`${inputCls} w-full`}
                        placeholder="Nombre"
                      />
                    </td>
                    {/* P. Cálculo (kW) — auto = V × I */}
                    <td className="px-1.5 py-1 text-right">
                      <span className="text-xs tabular-nums text-surface-500">{pCalcKw}</span>
                    </td>
                    {/* Tensión (V) + Fases */}
                    <td className="px-1.5 py-1 text-center">
                      {panel?.voltage === 400 ? (
                        <select
                          value={row.voltage}
                          onChange={(e) => {
                            const newV = Number(e.target.value);
                            updateRow(row.key, 'voltage', newV);
                            updateRow(row.key, 'phases', newV === 400 ? 3 : 1);
                          }}
                          className={`${selectCls} w-[70px]`}
                        >
                          <option value={230}>230 1F</option>
                          <option value={400}>400 3F</option>
                        </select>
                      ) : (
                        <span className="text-xs text-surface-500">230 1F</span>
                      )}
                    </td>
                    {/* I. Cálculo (A) — select normalizado */}
                    <td className="px-1.5 py-1 text-center">
                      <select
                        value={row.iCalcA}
                        onChange={(e) => updateRow(row.key, 'iCalcA', Number(e.target.value))}
                        className={`${selectCls} w-14`}
                      >
                        {I_CALC_VALUES.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </td>
                    {/* Sección usuario — nunca se sobreescribe */}
                    <td className="px-1.5 py-1 text-center">
                      <span
                        className={`text-xs tabular-nums inline-flex items-center gap-1 rounded px-1 py-0.5 ${
                          hasCalcSection
                            ? sectionInsufficient
                              ? 'bg-red-100 text-red-700 font-medium'
                              : 'bg-emerald-100 text-emerald-700 font-medium'
                            : 'text-surface-500'
                        }`}
                        title={
                          hasCalcSection
                            ? sectionInsufficient
                              ? `Sección insuficiente. Mínimo recomendado: ${row.resultSectionMm2}mm²`
                              : 'Cumple'
                            : undefined
                        }
                      >
                        {userSection}
                      </span>
                    </td>
                    {/* Sección calculada — resultado del motor */}
                    <td className="px-1.5 py-1 text-center">
                      <span className="text-xs tabular-nums text-surface-400">
                        {row.resultSection ?? '—'}
                      </span>
                    </td>
                    {/* Material */}
                    <td className="px-1.5 py-1 text-center">
                      <select
                        value={row.cableType}
                        onChange={(e) => updateRow(row.key, 'cableType', e.target.value)}
                        className={`${selectCls} w-16`}
                      >
                        <option value="CU">CU</option>
                        <option value="AL">AL</option>
                      </select>
                    </td>
                    {/* T. Aislamiento */}
                    <td className="px-1.5 py-1 text-center">
                      <select
                        value={row.insulationType}
                        onChange={(e) => updateRow(row.key, 'insulationType', e.target.value)}
                        className={`${selectCls} w-[80px]`}
                      >
                        <option value="PVC">450/750V</option>
                        <option value="XLPE">0.6/1kV</option>
                      </select>
                    </td>
                    {/* Tipo Instalación — compacto */}
                    <td className="px-1.5 py-1 text-center">
                      <select
                        value={row.installMethod}
                        onChange={(e) => updateRow(row.key, 'installMethod', e.target.value)}
                        className={`${selectCls} w-16`}
                      >
                        {Object.entries(INSTALL_TYPE_LABELS).map(([code, label]) => (
                          <option key={code} value={code}>{label}</option>
                        ))}
                      </select>
                    </td>
                    {/* Longitud (m) — sin flechas, acepta coma */}
                    <td className="px-1.5 py-1">
                      <input
                        value={row.length}
                        onChange={(e) => {
                          const val = e.target.value.replace(',', '.');
                          const num = parseFloat(val);
                          if (!isNaN(num) && num >= 0) {
                            updateRow(row.key, 'length', num);
                          } else if (val === '' || val === '0') {
                            updateRow(row.key, 'length', 0);
                          }
                        }}
                        className={`${inputCls} w-14`}
                        placeholder="m"
                        inputMode="decimal"
                      />
                    </td>
                    {/* CdT (V) — resultado */}
                    <td className="px-1.5 py-1 text-right">
                      <span className="text-xs tabular-nums text-surface-400">
                        {row.resultCdtV != null ? row.resultCdtV.toFixed(2) : '—'}
                      </span>
                    </td>
                    {/* P. Máx. Admisible (kW) — resultado */}
                    <td className="px-1.5 py-1 text-right">
                      <span className="text-xs tabular-nums text-surface-400">
                        {row.resultPmaxKw != null ? row.resultPmaxKw.toFixed(2) : pCalcKw}
                      </span>
                    </td>
                    {/* P. Total Instalada (kW) — input libre, sin flechas, acepta coma */}
                    <td className="px-1.5 py-1">
                      <input
                        value={row.installedPowerKw}
                        onChange={(e) => updateRow(row.key, 'installedPowerKw', e.target.value)}
                        className={`${inputCls} w-14`}
                        placeholder="—"
                        inputMode="decimal"
                      />
                    </td>
                    {/* PIA (A) — auto-calculado según I.Cálc */}
                    <td className="px-1.5 py-1 text-center">
                      <span className="text-xs tabular-nums font-medium text-surface-700">
                        {displayPia}
                      </span>
                    </td>
                    {/* Maniobra — toggle */}
                    <td className="px-1.5 py-1 text-center">
                      {row.maniobraChain.length > 0 ? (
                        <button
                          onClick={() => toggleManiobra(row.key)}
                          className="rounded px-1 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-500/20 transition-colors"
                          title={row.maniobraChain.map((d) => MANIOBRA_DEVICE_TYPES.find((m) => m.value === d.type)?.short ?? d.type).join('→')}
                        >
                          {row.maniobraChain.length > 1
                            ? `${row.maniobraChain.length}×`
                            : MANIOBRA_DEVICE_TYPES.find((m) => m.value === row.maniobraChain[0]?.type)?.short ?? '⚙'}
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleManiobra(row.key)}
                          className="rounded p-0.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-500"
                          title="Añadir maniobra"
                        >
                          <Settings2 className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                    {/* Eliminar */}
                    <td className="px-1.5 py-1">
                      <button
                        onClick={() => removeRow(row.key)}
                        className="rounded p-0.5 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                  {/* Sub-fila maniobra expandible — cadena de dispositivos */}
                  {expandedManiobra.has(row.key) && (
                    <tr className="bg-blue-500/5 border-b border-surface-600">
                      <td colSpan={18} className="px-3 py-2">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-surface-500">Cadena maniobra:</span>
                            <span className="text-surface-400">PIA {displayPia}A →</span>
                            {row.maniobraChain.map((dev, idx) => {
                              const devType = MANIOBRA_DEVICE_TYPES.find((m) => m.value === dev.type);
                              return (
                                <span key={idx} className="flex items-center gap-1">
                                  <span className="bg-blue-500/15 text-blue-600 rounded px-1.5 py-0.5 font-medium">{devType?.short ?? dev.type}</span>
                                  {devType?.hasCalibre && <span className="text-surface-500">{dev.calibreA ?? '—'}A</span>}
                                  <span className="text-surface-400">→</span>
                                </span>
                              );
                            })}
                            <span className="text-surface-400 text-[10px]">Receptor</span>
                          </div>
                          {/* Dispositivos editables */}
                          {row.maniobraChain.map((dev, idx) => (
                            <div key={idx} className="flex items-center gap-2 pl-4 text-xs">
                              <span className="text-surface-400 w-4">{idx + 1}.</span>
                              <select
                                value={dev.type}
                                onChange={(e) => {
                                  const newChain = [...row.maniobraChain];
                                  const newType = e.target.value;
                                  const hasCal = MANIOBRA_DEVICE_TYPES.find((m) => m.value === newType)?.hasCalibre;
                                  newChain[idx] = { ...newChain[idx], type: newType, calibreA: hasCal ? (dev.calibreA || piaForICalc(row.iCalcA)) : undefined };
                                  setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, maniobraChain: newChain } : r));
                                  setDirty(true);
                                }}
                                className={`${selectCls} w-36`}
                              >
                                {MANIOBRA_DEVICE_TYPES.map((m) => (
                                  <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                              </select>
                              {MANIOBRA_DEVICE_TYPES.find((m) => m.value === dev.type)?.hasCalibre && (
                                <select
                                  value={dev.calibreA || ''}
                                  onChange={(e) => {
                                    const newChain = [...row.maniobraChain];
                                    newChain[idx] = { ...newChain[idx], calibreA: Number(e.target.value) };
                                    setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, maniobraChain: newChain } : r));
                                    setDirty(true);
                                  }}
                                  className={`${selectCls} w-20`}
                                >
                                  {PIA_RATINGS.map((a) => (
                                    <option key={a} value={a}>{a} A</option>
                                  ))}
                                </select>
                              )}
                              <button
                                onClick={() => {
                                  const newChain = row.maniobraChain.filter((_, i) => i !== idx);
                                  setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, maniobraChain: newChain } : r));
                                  setDirty(true);
                                }}
                                className="rounded p-0.5 text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Quitar dispositivo"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {/* Botón añadir dispositivo */}
                          <div className="flex items-center gap-2 pl-4">
                            <button
                              onClick={() => {
                                const defaultCalibre = piaForICalc(row.iCalcA);
                                const newDevice: ManiobraDevice = { type: 'CONTACTOR', calibreA: defaultCalibre };
                                const newChain = [...row.maniobraChain, newDevice];
                                setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, maniobraChain: newChain } : r));
                                setDirty(true);
                              }}
                              className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-blue-500 hover:bg-blue-50 border border-blue-500/30 transition-colors"
                            >
                              <Plus className="h-2.5 w-2.5" /> Añadir dispositivo
                            </button>
                            {row.maniobraChain.length > 0 && (
                              <button
                                onClick={() => removeManiobra(row.key)}
                                className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-red-600 hover:bg-red-50 border border-red-500/30 transition-colors"
                              >
                                <X className="h-2.5 w-2.5" /> Limpiar todo
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            </tbody>
          </table>
        </div>
      )}

      {/* Action buttons */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-surface-200 pt-5">
          <Button onClick={handleSave} disabled={isSaving || !dirty} variant="outline">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                Guardado
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar circuitos
              </>
            )}
          </Button>

          <span title={calcDisabledReason || undefined} onMouseEnter={fetchPanel}>
            <Button onClick={handleCalculate} disabled={isCalculating || !!calcDisabledReason}>
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando…
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calcular instalación
                </>
              )}
            </Button>
          </span>

          {dirty && (
            <span className="text-xs text-amber-600">
              Cambios sin guardar
            </span>
          )}
        </div>
      )}

      {/* Validation errors panel */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-red-700">
                {validationErrors.length} error{validationErrors.length !== 1 ? 'es' : ''} de validación
              </span>
            </div>
            <button
              onClick={() => setValidationErrors([])}
              className="rounded p-0.5 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-red-200">
            {validationErrors.map((err, i) => (
              <div key={i} className="py-2 first:pt-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-red-800 min-w-0">
                    {err.circuitLabel}
                  </span>
                </div>
                <p className="text-xs text-red-700 mt-0.5">
                  <span className="font-medium">{err.rule}</span>
                  {' — '}tiene: <span className="font-mono bg-red-100 px-1 rounded">{err.actual}</span>
                  {', '}esperado: <span className="font-mono bg-red-100 px-1 rounded">{err.expected}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
