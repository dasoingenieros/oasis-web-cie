'use client';

import React, { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Button } from '@/components/ui/button';
import type { Circuit, CreateCircuitDto, SupplyType, ElectricalPanel, CalculationResult, SavePanelWithDifferentialsDto } from '@/lib/types';
import { panelsApi, installationsApi } from '@/lib/api-client';
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
  ChevronDown,
  ChevronRight,
  Zap,
  Cable,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  Info,
  XCircle,
} from 'lucide-react';
import { CalculationDisclaimer } from '@/components/legal/calculation-disclaimer';
import { NormativeVersionBanner } from '@/components/legal/normative-version-banner';

// ─── Constantes ──────────────────────────────────────────────

const PIA_RATINGS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
const I_CALC_VALUES = PIA_RATINGS;
const IGA_RATINGS = [10, 15, 16, 20, 25, 32, 40, 50, 63];
const DIFF_CALIBRES = [25, 40, 63, 80, 100];
const CURVES = ['B', 'C', 'D'];
const POWER_CUT_KA = [6, 10, 15];
const SENSITIVITIES = [10, 30, 100, 300, 500];
const DIFF_TYPES = ['AC', 'A', 'F', 'B'];
const DI_SECTIONS = [6, 10, 16, 25, 35, 50, 70, 95, 120];
const DI_MATERIALS = ['CU', 'AL'];
const DI_INSULATIONS = ['XLPE', 'PVC', 'EPR'];
const DI_INSTALL_TYPES = ['TP', 'E.T.F.', 'E.T.C.', 'S.T.C.', 'F.D.P.', 'BANDJ.'];

const SECTION_TABLE: { section: number; iz: number }[] = [
  { section: 1.5, iz: 13 }, { section: 2.5, iz: 17.5 }, { section: 4, iz: 23 },
  { section: 6, iz: 30 }, { section: 10, iz: 40 }, { section: 16, iz: 52 },
  { section: 25, iz: 68 }, { section: 35, iz: 83 }, { section: 50, iz: 99 },
  { section: 70, iz: 125 }, { section: 95, iz: 150 }, { section: 120, iz: 173 },
];

const ITC_BT25_CONSTRAINTS: Record<string, { maxPiaA: number; minSectionMm2: number }> = {
  'C1': { maxPiaA: 10, minSectionMm2: 1.5 }, 'C2': { maxPiaA: 16, minSectionMm2: 2.5 },
  'C3': { maxPiaA: 25, minSectionMm2: 6 }, 'C4': { maxPiaA: 20, minSectionMm2: 4 },
  'C4.1': { maxPiaA: 20, minSectionMm2: 4 }, 'C4.2': { maxPiaA: 20, minSectionMm2: 4 },
  'C4.3': { maxPiaA: 20, minSectionMm2: 4 }, 'C5': { maxPiaA: 16, minSectionMm2: 2.5 },
  'C6': { maxPiaA: 10, minSectionMm2: 1.5 }, 'C7': { maxPiaA: 16, minSectionMm2: 2.5 },
  'C8': { maxPiaA: 25, minSectionMm2: 6 }, 'C9': { maxPiaA: 25, minSectionMm2: 6 },
  'C10': { maxPiaA: 20, minSectionMm2: 4 }, 'C11': { maxPiaA: 10, minSectionMm2: 1.5 },
  'C12': { maxPiaA: 16, minSectionMm2: 2.5 },
};

const MAX_CIRCUITS_PER_DIFF_VIVIENDA = 5;

const INSTALL_TYPE_LABELS: Record<string, string> = {
  'A1': 'E.T.F.', 'A2': 'E.T.C.', 'B1': 'S.T.C.', 'B2': 'S.T.R.',
  'C': 'S.C.P.F.', 'D': 'ENTR.', 'E': 'BANDJ.',
};

const MANIOBRA_DEVICE_TYPES: { value: string; label: string; short: string; hasCalibre: boolean }[] = [
  { value: 'CONTACTOR', label: 'Contactor', short: 'KM', hasCalibre: true },
  { value: 'GUARDAMOTOR', label: 'Guardamotor', short: 'GV', hasCalibre: true },
  { value: 'RELOJ', label: 'Reloj horario', short: 'KT', hasCalibre: false },
  { value: 'SECCIONADOR', label: 'Seccionador', short: 'QS', hasCalibre: true },
];

// ─── Helpers ─────────────────────────────────────────────────

function sectionForPia(piaA: number): number {
  return SECTION_TABLE.find((s) => s.iz >= piaA)?.section ?? 120;
}

function piaForICalc(iCalcA: number): number {
  return PIA_RATINGS.find((p) => p >= iCalcA) ?? PIA_RATINGS[PIA_RATINGS.length - 1]!;
}

/** CdT% con la sección del USUARIO (no la del motor).
 *  Mono: (2 × L × I × cosφ × 100) / (γ × S × V)
 *  Tri:  (√3 × L × I × cosφ × 100) / (γ × S × V)
 *  γ = 56 CU, 35 AL */
function calcUserCdtPct(row: CircuitRow, sectionMm2: number): number | null {
  if (sectionMm2 <= 0 || row.voltage <= 0 || row.length <= 0) return null;
  const gamma = row.cableType === 'CU' ? 56 : 35;
  const factor = row.phases === 3 || row.voltage === 400 ? Math.sqrt(3) : 2;
  return (factor * row.length * row.iCalcA * row.cosPhi * 100) / (gamma * sectionMm2 * row.voltage);
}

function calcMaxPowerW(calibreA: number, voltage: number): number {
  if (voltage === 400) return Math.round(Math.sqrt(3) * 400 * calibreA);
  return 230 * calibreA;
}

function isItcBt25Code(code: string): boolean {
  return ['C1','C2','C3','C4','C4.1','C4.2','C4.3','C5','C6','C7','C8','C9','C10','C11','C12'].includes(code);
}

// ─── CSS ─────────────────────────────────────────────────────

const noSpinnerStyle = `
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .no-spinner[type=number] { -moz-appearance: textfield; }
`;

const selectCls = 'h-7 w-full rounded border border-surface-300 bg-white px-1 text-xs';
const inputCls = 'no-spinner h-7 rounded border border-surface-300 bg-white px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400';

// ─── Types ───────────────────────────────────────────────────

interface IgaState {
  calibreA: number; curve: string; powerCutKa: number; poles: number; voltage: number;
}

interface DiState {
  seccionDi: number | null; materialDi: string; longitudDi: number | null;
  aislamientoDi: string; tipoInstalacionDi: string;
}

interface DiffState {
  localId: string;
  id?: string;
  name: string;
  order: number;
  calibreA: number;
  sensitivityMa: number;
  type: string;
  poles: number;
  circuitKeys: string[];
  isProtected?: boolean | null;
  protectionNote?: string | null;
  expanded: boolean;
}

interface ManiobraDevice {
  type: string; calibreA?: number; label?: string;
}

interface EngineStep {
  order: number;
  description: string;
  formula: string;
  result: string | number;
  normRef: string;
  inputValues: Record<string, unknown>;
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
  insulationType: string;
  installMethod: string;
  cosPhi: number;
  tempCorrFactor: number;
  groupCorrFactor: number;
  installedPowerKw: string;
  isItcBt25: boolean;
  isLighting: boolean;
  maniobraChain: ManiobraDevice[];
  resultSection?: string;
  resultSectionMm2?: number;
  resultCdtV?: number;
  resultPmaxKw?: number;
  resultPiaA?: number;
  resultVoltageDropPct?: number;
  resultIsCompliant?: boolean;
  resultJustification?: EngineStep[];
}

interface ValidationError {
  circuitKey: string; circuitLabel: string; rule: string; actual: string; expected: string;
}

let keyCounter = 0;
function nextKey(): string { return `c_${++keyCounter}`; }
let diffKeyCounter = 0;
function nextDiffKey(): string { return `d_${++diffKeyCounter}`; }

function templateToRow(t: CircuitTemplate, order: number): CircuitRow {
  const iCalcA = t.piaA ?? piaForICalc(Math.ceil(t.power / t.voltage));
  return {
    key: nextKey(), code: t.code, name: t.name, order, iCalcA,
    voltage: t.voltage, phases: t.phases, length: t.defaultLength,
    cableType: t.cableType, insulationType: t.insulationType, installMethod: t.installMethod,
    cosPhi: t.cosPhi, tempCorrFactor: 1, groupCorrFactor: 1, installedPowerKw: '',
    isItcBt25: isItcBt25Code(t.code), isLighting: t.code === 'C1' || t.code === 'C6', maniobraChain: [],
  };
}

function circuitToRow(c: Circuit): CircuitRow {
  const iCalcA = Math.round(c.power / c.voltage);
  return {
    key: c.id, code: c.code ?? '', name: c.name, order: c.order, iCalcA,
    voltage: c.voltage, phases: c.phases, length: c.length,
    cableType: c.cableType as 'CU' | 'AL', insulationType: c.insulationType,
    installMethod: c.installMethod, cosPhi: c.cosPhi,
    tempCorrFactor: c.tempCorrFactor, groupCorrFactor: c.groupCorrFactor,
    installedPowerKw: '', isItcBt25: isItcBt25Code(c.code ?? ''),
    isLighting: c.isLighting ?? (c.code === 'C1' || c.code === 'C6'),
    maniobraChain: (c.maniobraExtra as any)?.chain ?? (c.maniobraType ? [{ type: c.maniobraType, calibreA: c.maniobraCalibreA ?? undefined }] : []),
  };
}

function emptyRow(order: number): CircuitRow {
  return {
    key: nextKey(), code: '', name: '', order, iCalcA: 16, voltage: 230, phases: 1, length: 15,
    cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1,
    tempCorrFactor: 1, groupCorrFactor: 1, installedPowerKw: '', isItcBt25: false, isLighting: false, maniobraChain: [],
  };
}

// ─── Validation ──────────────────────────────────────────────

function validateBeforeCalc(
  rows: CircuitRow[],
  diffs: DiffState[],
  supplyType: string | null | undefined,
  igaPoles: number,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const isVivienda = supplyType?.startsWith('VIVIENDA');

  for (const row of rows) {
    const label = [row.code, row.name].filter(Boolean).join(' — ') || `Circuito #${row.order}`;
    if (!row.name) errors.push({ circuitKey: row.key, circuitLabel: label, rule: 'Nombre obligatorio', actual: '(vacío)', expected: 'Nombre del circuito' });
    if (row.iCalcA <= 0) errors.push({ circuitKey: row.key, circuitLabel: label, rule: 'Intensidad de cálculo > 0', actual: `${row.iCalcA} A`, expected: '> 0 A' });
    if (row.length <= 0) errors.push({ circuitKey: row.key, circuitLabel: label, rule: 'Longitud > 0', actual: `${row.length} m`, expected: '> 0 m' });

    if (isVivienda) {
      const constraint = ITC_BT25_CONSTRAINTS[row.code];
      if (constraint) {
        const piaA = piaForICalc(row.iCalcA);
        if (piaA > constraint.maxPiaA)
          errors.push({ circuitKey: row.key, circuitLabel: label, rule: `PIA máx. ITC-BT-25 (${row.code})`, actual: `${piaA} A`, expected: `≤ ${constraint.maxPiaA} A` });
        const sectionMm2 = sectionForPia(piaA);
        if (sectionMm2 < constraint.minSectionMm2)
          errors.push({ circuitKey: row.key, circuitLabel: label, rule: `Sección mín. ITC-BT-25 (${row.code})`, actual: `${sectionMm2} mm²`, expected: `≥ ${constraint.minSectionMm2} mm²` });
      }
    }

    if (row.iCalcA > 0) {
      const piaA = piaForICalc(row.iCalcA);
      const sectionMm2 = sectionForPia(piaA);
      const entry = SECTION_TABLE.find((s) => s.section === sectionMm2);
      if (entry) {
        const izCorrected = entry.iz * row.tempCorrFactor * row.groupCorrFactor;
        if (izCorrected < row.iCalcA)
          errors.push({ circuitKey: row.key, circuitLabel: label, rule: 'Criterio térmico (Iz corregida ≥ I cálc.)', actual: `Iz = ${izCorrected.toFixed(1)} A`, expected: `≥ ${row.iCalcA} A (revisar factores corrección)` });
      }
    }
  }

  // Max circuits per differential (viviendas)
  if (isVivienda) {
    for (const diff of diffs) {
      if (diff.circuitKeys.length > MAX_CIRCUITS_PER_DIFF_VIVIENDA) {
        for (let i = MAX_CIRCUITS_PER_DIFF_VIVIENDA; i < diff.circuitKeys.length; i++) {
          errors.push({
            circuitKey: diff.circuitKeys[i]!, circuitLabel: `Dif. "${diff.name}"`,
            rule: `Máx. ${MAX_CIRCUITS_PER_DIFF_VIVIENDA} circuitos/diferencial (ITC-BT-25)`,
            actual: `${diff.circuitKeys.length} circuitos asignados`, expected: `≤ ${MAX_CIRCUITS_PER_DIFF_VIVIENDA} circuitos`,
          });
        }
      }
    }
  }

  // 3-phase circuits need 4P differential
  for (const diff of diffs) {
    if (diff.poles === 2) {
      for (const ck of diff.circuitKeys) {
        const row = rows.find((r) => r.key === ck);
        if (row && row.voltage === 400)
          errors.push({ circuitKey: ck, circuitLabel: row.name || `Circuito #${row.order}`, rule: 'Circuito trifásico requiere diferencial 4P', actual: `Dif. "${diff.name}" (2P)`, expected: 'Diferencial de 4 polos' });
      }
    }
  }

  return errors;
}

// ─── Props ───────────────────────────────────────────────────

export interface CuadroFormHandle { addRow: () => void; }

interface CuadroFormProps {
  circuits: Circuit[];
  supplyType: SupplyType | string | null | undefined;
  contractedPower?: number | null;
  supplyResult?: any;
  installation?: any;
  installationId: string;
  calculation?: CalculationResult | null;
  isSaving: boolean;
  isCalculating: boolean;
  onSave: (circuits: CreateCircuitDto[]) => Promise<Circuit[]>;
  onCalculate: () => Promise<boolean>;
}

// ─── Component ───────────────────────────────────────────────

export const CuadroForm = forwardRef<CuadroFormHandle, CuadroFormProps>(function CuadroForm({
  circuits, supplyType, contractedPower, supplyResult, installation, installationId,
  calculation, isSaving, isCalculating, onSave, onCalculate,
}, ref) {
  // ── IGA state
  const [iga, setIga] = useState<IgaState>({ calibreA: 25, curve: 'C', powerCutKa: 6, poles: 2, voltage: 230 });
  // ── DI state
  const [di, setDi] = useState<DiState>({ seccionDi: null, materialDi: 'CU', longitudDi: null, aislamientoDi: 'XLPE', tipoInstalacionDi: 'E.T.F.' });
  // ── Differentials
  const [diffs, setDiffs] = useState<DiffState[]>([]);
  // ── Circuit rows
  const [rows, setRows] = useState<CircuitRow[]>([]);
  // ── UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedManiobra, setExpandedManiobra] = useState<Set<string>>(new Set());
  const [expandedJustification, setExpandedJustification] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const failedKeys = useMemo(() => new Set(validationErrors.map((e) => e.circuitKey)), [validationErrors]);

  // ── Load panel + DI data on mount
  useEffect(() => {
    (async () => {
      try {
        // Load DI from installation
        if (installation) {
          setDi({
            seccionDi: installation.seccionDi ?? null,
            materialDi: installation.materialDi || 'CU',
            longitudDi: installation.longitudDi ?? null,
            aislamientoDi: installation.aislamientoDi || 'XLPE',
            tipoInstalacionDi: installation.tipoInstalacionDi || 'E.T.F.',
          });
        }
        // Load panel with diffs
        const panel = await panelsApi.get(installationId);
        if (panel) {
          setIga({
            calibreA: panel.igaCalibreA, curve: panel.igaCurve,
            powerCutKa: panel.igaPowerCutKa, poles: panel.igaPoles, voltage: panel.voltage,
          });
          setDiffs(panel.differentials.map((d) => ({
            localId: d.id, id: d.id, name: d.name, order: d.order,
            calibreA: d.calibreA, sensitivityMa: d.sensitivityMa, type: d.type, poles: d.poles,
            circuitKeys: d.circuits.map((c) => c.id),
            isProtected: d.isProtected, protectionNote: d.protectionNote, expanded: true,
          })));
        }
      } catch { /* no panel yet */ }
      finally { setLoading(false); }
    })();
  }, [installationId, installation]);

  // ── Build rows from circuits + merge calc results
  const calcResultsById = useMemo(() => {
    const map = new Map<string, any>();
    if (!calculation?.resultSnapshot) return map;
    const snap = calculation.resultSnapshot as any;
    for (const cr of snap?.circuits ?? []) { if (cr?.id) map.set(cr.id, cr); }
    return map;
  }, [calculation]);

  useEffect(() => {
    if (circuits.length > 0) {
      const baseRows = circuits.map(circuitToRow);
      if (calcResultsById.size > 0) {
        for (const row of baseRows) {
          const cr = calcResultsById.get(row.key);
          if (cr) {
            const nCond = row.voltage === 400 ? 4 : 2;
            row.resultSection = `${nCond}×${cr.sectionMm2}`;
            row.resultSectionMm2 = cr.sectionMm2;
            row.resultCdtV = cr.voltageDropV ?? (cr.voltageDropPct != null ? Math.round(row.voltage * (cr.voltageDropPct / 100) * 100) / 100 : undefined);
            row.resultPmaxKw = cr.calculatedPowerW != null ? Math.round(cr.calculatedPowerW / 10) / 100 : undefined;
            row.resultPiaA = cr.breakerRatingA;
            row.resultVoltageDropPct = cr.voltageDropPct;
            row.resultIsCompliant = cr.isCompliant;
            row.resultJustification = cr.justification?.steps;
          }
        }
      }
      setRows(baseRows);
    }
  }, [circuits, calcResultsById]);

  // ── IGA handlers
  const updateIga = useCallback((field: keyof IgaState, value: number | string) => {
    if (field === 'voltage') {
      const newVoltage = Number(value);
      if (iga.voltage === 400 && newVoltage === 230) {
        const triCircuits = rows.filter((r) => r.voltage === 400);
        if (triCircuits.length > 0) {
          const ok = confirm(`Cambiar a monofásico afectará a ${triCircuits.length} circuito${triCircuits.length > 1 ? 's' : ''} trifásico${triCircuits.length > 1 ? 's' : ''}.\n\nLos circuitos trifásicos deberán convertirse a monofásico manualmente.\n\n¿Continuar?`);
          if (!ok) return;
        }
      }
      setIga((prev) => ({ ...prev, voltage: newVoltage, poles: newVoltage === 400 ? 4 : 2 }));
      setDiffs((prev) => prev.map((d) => ({ ...d, poles: newVoltage === 230 ? 2 : d.poles })));
      setDirty(true);
      return;
    }
    setIga((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }, [iga.voltage, rows]);

  const maxPowerW = calcMaxPowerW(iga.calibreA, iga.voltage);
  const maxPowerKw = (maxPowerW / 1000).toFixed(2);
  const contractedOk = !contractedPower || contractedPower <= maxPowerW;

  // ── DI handlers
  const updateDi = useCallback((field: keyof DiState, value: string | number | null) => {
    setDi((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }, []);

  // ── Differential handlers
  const addDiff = useCallback(() => {
    setDiffs((prev) => [...prev, {
      localId: nextDiffKey(), name: `Diferencial ${prev.length + 1}`, order: prev.length + 1,
      calibreA: 40, sensitivityMa: 30, type: 'AC', poles: iga.poles,
      circuitKeys: [], expanded: true,
    }]);
    setDirty(true);
  }, [iga.poles]);

  const removeDiff = useCallback((idx: number) => {
    const diff = diffs[idx];
    if (!diff) return;
    if (diff.circuitKeys.length > 0) {
      const ok = confirm(`El diferencial "${diff.name}" tiene ${diff.circuitKeys.length} circuito${diff.circuitKeys.length > 1 ? 's' : ''} asignado${diff.circuitKeys.length > 1 ? 's' : ''}.\n\nLos circuitos quedarán sin diferencial asignado.\n\n¿Eliminar?`);
      if (!ok) return;
    }
    setDiffs((prev) => prev.filter((_, i) => i !== idx).map((d, i) => ({ ...d, order: i + 1 })));
    setDirty(true);
  }, [diffs]);

  const updateDiff = useCallback((idx: number, field: keyof DiffState, value: unknown) => {
    setDiffs((prev) => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
    // Auto-correct: when changing poles from 4 to 2, force trifásico circuits to monofásico
    if (field === 'poles' && value === 2) {
      const diff = diffs[idx];
      if (diff) {
        setRows((prev) => prev.map((r) =>
          diff.circuitKeys.includes(r.key) && r.voltage === 400
            ? { ...r, voltage: 230, phases: 1 }
            : r
        ));
      }
    }
    setDirty(true);
  }, [diffs]);

  // ── Circuit row handlers
  const updateRow = useCallback((key: string, field: keyof CircuitRow, value: string | number | boolean) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
    setDirty(true);
  }, []);

  const removeRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
    // Also remove from diffs
    setDiffs((prev) => prev.map((d) => ({ ...d, circuitKeys: d.circuitKeys.filter((k) => k !== key) })));
    setDirty(true);
  }, []);

  const addCircuitToDiff = useCallback((diffIdx: number) => {
    const row = emptyRow(rows.length + 1);
    setRows((prev) => [...prev, row]);
    setDiffs((prev) => prev.map((d, i) => i === diffIdx ? { ...d, circuitKeys: [...d.circuitKeys, row.key] } : d));
    setDirty(true);
  }, [rows.length]);

  const addUnassignedCircuit = useCallback(() => {
    setRows((prev) => [...prev, emptyRow(prev.length + 1)]);
    setDirty(true);
  }, []);

  const addRowRef = useRef(addUnassignedCircuit);
  addRowRef.current = addUnassignedCircuit;
  useImperativeHandle(ref, () => ({ addRow: () => addRowRef.current() }), []);

  // Move circuit to a different differential
  const moveCircuit = useCallback((rowKey: string, targetDiffIdx: number | null) => {
    // Auto-correct: if moving to a 2P differential, force monofásico
    if (targetDiffIdx !== null) {
      const targetDiff = diffs[targetDiffIdx];
      if (targetDiff && targetDiff.poles === 2) {
        setRows((prev) => prev.map((r) =>
          r.key === rowKey && r.voltage === 400 ? { ...r, voltage: 230, phases: 1 } : r
        ));
      }
    }
    setDiffs((prev) => prev.map((d, i) => {
      const without = d.circuitKeys.filter((k) => k !== rowKey);
      if (targetDiffIdx === i) return { ...d, circuitKeys: [...without, rowKey] };
      return { ...d, circuitKeys: without };
    }));
    setDirty(true);
  }, [diffs]);

  // Maniobra handlers
  const toggleManiobra = useCallback((key: string) => {
    setExpandedManiobra((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }, []);

  const toggleJustification = useCallback((key: string) => {
    setExpandedJustification((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }, []);

  const removeManiobra = useCallback((key: string) => {
    setRows((prev) => prev.map((r) => r.key === key ? { ...r, maniobraChain: [] } : r));
    setExpandedManiobra((prev) => { const next = new Set(prev); next.delete(key); return next; });
    setDirty(true);
  }, []);

  // ── Template loading
  const loadCircuitTemplates = useCallback(() => {
    const templates = getTemplatesForSupplyType(supplyType ?? '');
    if (templates.length === 0) return;
    const newRows = templates.map((t, i) => templateToRow(t, i + 1));
    setRows(newRows);
    // Auto-create one differential with all circuits
    const diffId = nextDiffKey();
    setDiffs([{
      localId: diffId, name: 'Diferencial 1', order: 1,
      calibreA: 40, sensitivityMa: 30, type: 'AC', poles: iga.poles,
      circuitKeys: newRows.map((r) => r.key), expanded: true,
    }]);
    setDirty(true);
  }, [supplyType, iga.poles]);

  // ── Computed
  const assignedKeys = useMemo(() => new Set(diffs.flatMap((d) => d.circuitKeys)), [diffs]);
  const unassignedRows = useMemo(() => rows.filter((r) => !assignedKeys.has(r.key)), [rows, assignedKeys]);

  const totalPowerW = rows.reduce((sum, r) => sum + r.voltage * r.iCalcA, 0);
  const displayMaxPowerW = supplyResult?.designPowerW
    ?? (installation?.potMaxAdmisible ? installation.potMaxAdmisible * 1000 : undefined)
    ?? totalPowerW;

  // ── Compliance counts (from calc results)
  const calcCompliance = useMemo(() => {
    if (!calculation) return null;
    let compliant = 0, nonCompliant = 0;
    for (const row of rows) {
      if (row.resultIsCompliant === true) compliant++;
      else if (row.resultIsCompliant === false) nonCompliant++;
    }
    return { compliant, nonCompliant, total: rows.length };
  }, [calculation, rows]);

  // ── Save handler
  const handleSave = useCallback(async () => {
    // Validate basics
    const invalid = rows.some((r) => !r.name || r.iCalcA <= 0 || r.length <= 0);
    if (invalid) {
      alert('Revisa los circuitos: nombre, intensidad y longitud son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      // 1. Renumber rows in global order: diffs' circuits first, then unassigned
      const orderedKeys: string[] = [];
      for (const diff of diffs) { orderedKeys.push(...diff.circuitKeys); }
      for (const r of rows) { if (!assignedKeys.has(r.key)) orderedKeys.push(r.key); }
      const rowByKey = new Map(rows.map((r) => [r.key, r]));
      const orderedRows = orderedKeys.map((k, i) => {
        const r = rowByKey.get(k)!;
        return { ...r, order: i + 1 };
      });

      // 2. Build circuit DTOs
      const dtos: CreateCircuitDto[] = orderedRows.map((r) => ({
        name: r.name, code: r.code || undefined, order: r.order,
        power: r.voltage * r.iCalcA, voltage: r.voltage, phases: r.phases, length: r.length,
        cableType: r.cableType, insulationType: r.insulationType, installMethod: r.installMethod,
        cosPhi: r.cosPhi, tempCorrFactor: r.tempCorrFactor, groupCorrFactor: r.groupCorrFactor,
        isLighting: r.isLighting,
        maniobraType: r.maniobraChain.length > 0 ? r.maniobraChain[0].type : undefined,
        maniobraCalibreA: r.maniobraChain.length > 0 ? r.maniobraChain[0].calibreA : undefined,
        maniobraExtra: r.maniobraChain.length > 0 ? { chain: r.maniobraChain } : undefined,
      }));

      // 3. Save circuits — get back IDs
      const savedCircuits = await onSave(dtos);

      // 4. Map old keys to new IDs (by order)
      const keyToNewId = new Map<string, string>();
      for (let i = 0; i < orderedKeys.length; i++) {
        if (savedCircuits[i]) keyToNewId.set(orderedKeys[i], savedCircuits[i].id);
      }

      // 5. Save DI
      await installationsApi.update(installationId, {
        seccionDi: di.seccionDi, materialDi: di.materialDi, longitudDi: di.longitudDi,
        aislamientoDi: di.aislamientoDi, tipoInstalacionDi: di.tipoInstalacionDi,
      } as any);

      // 6. Save panel + differentials with mapped IDs
      const panelDto: SavePanelWithDifferentialsDto = {
        panel: {
          igaCalibreA: iga.calibreA, igaCurve: iga.curve, igaPowerCutKa: iga.powerCutKa,
          igaPoles: iga.poles, voltage: iga.voltage,
        },
        differentials: diffs.map((d) => ({
          id: d.id, name: d.name, order: d.order,
          calibreA: d.calibreA, sensitivityMa: d.sensitivityMa, type: d.type, poles: d.poles,
          circuitIds: d.circuitKeys.map((k) => keyToNewId.get(k) ?? k),
        })),
      };
      const savedPanel = await panelsApi.save(installationId, panelDto);

      // 7. Update local state with saved panel
      setDiffs(savedPanel.differentials.map((d) => ({
        localId: d.id, id: d.id, name: d.name, order: d.order,
        calibreA: d.calibreA, sensitivityMa: d.sensitivityMa, type: d.type, poles: d.poles,
        circuitKeys: d.circuits.map((c) => c.id),
        isProtected: d.isProtected, protectionNote: d.protectionNote, expanded: true,
      })));

      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error al guardar. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [rows, diffs, iga, di, installationId, onSave, assignedKeys]);

  // ── Calculate handler
  const handleCalculate = useCallback(async () => {
    const errors = validateBeforeCalc(rows, diffs, supplyType, iga.poles);
    setValidationErrors(errors);
    if (errors.length > 0) return;

    // Check all circuits are assigned
    if (unassignedRows.length > 0) {
      alert('Todos los circuitos deben estar asignados a un diferencial antes de calcular.');
      return;
    }
    if (diffs.length === 0) {
      alert('Añade al menos un diferencial antes de calcular.');
      return;
    }

    if (dirty) await handleSave();
    await onCalculate();
  }, [rows, diffs, supplyType, iga.poles, unassignedRows.length, dirty, handleSave, onCalculate]);

  // ── Render helpers
  const renderCircuitTable = (circuitRows: CircuitRow[], diffIdx: number | null) => {
    if (circuitRows.length === 0 && diffIdx !== null) {
      return (
        <div className="py-3 text-center text-xs text-surface-400">
          Sin circuitos. Pulsa &quot;+ Añadir circuito&quot; para crear uno.
        </div>
      );
    }
    if (circuitRows.length === 0) return null;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left text-[11px]">
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-7">#</th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-12">Cód.</th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 min-w-[60px]">Circuito</th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-16 text-right">P.Cálc.<br/><span className="font-normal text-surface-400">kW</span></th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-[70px] text-center">V / Fases</th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-14 text-center">I.Cálc.<br/><span className="font-normal text-surface-400">A</span></th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-20 text-center">Sección</th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-20 text-center">S.Calc.</th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-14 text-center">Mat</th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-20 text-center">Aisl.</th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-16 text-center">Inst.</th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-14">Long.<br/><span className="font-normal text-surface-400">m</span></th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-14 text-right">CdT<br/><span className="font-normal text-surface-400">%</span></th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-12 text-center">PIA<br/><span className="font-normal text-surface-400">A</span></th>
              <th className="px-1.5 py-1.5 font-medium text-surface-700 w-10 text-center">Man.</th>
              {diffIdx === null && diffs.length > 0 && <th className="px-1.5 py-1.5 font-medium text-surface-700 w-24 text-center">Dif.</th>}
              <th className="px-1.5 py-1.5 w-7" />
            </tr>
          </thead>
          <tbody>
            {circuitRows.map((row) => {
              const powerW = row.voltage * row.iCalcA;
              const pCalcKw = (powerW / 1000).toFixed(2);
              const piaA = piaForICalc(row.iCalcA);
              const sectionMm2 = sectionForPia(piaA);
              const nCond = row.voltage === 400 ? 4 : 2;
              const userSection = `${nCond}×${sectionMm2}`;
              const displayPia = row.resultPiaA ?? piaA;
              const hasCalcSection = row.resultSectionMm2 != null;
              const sectionInsufficient = hasCalcSection && sectionMm2 < row.resultSectionMm2!;

              const hasJustification = (row.resultJustification?.length ?? 0) > 0;
              const cdtLimit = row.isLighting ? 3.0 : 5.0;
              // CdT con la sección del USUARIO (no la del motor)
              const cdtPct = calcUserCdtPct(row, sectionMm2);
              const cdtOk = cdtPct != null && cdtPct <= cdtLimit;
              const cdtDanger = cdtPct != null && cdtPct > cdtLimit;

              // Row background: validation error > compliance coloring > maniobra > default
              const rowBg = failedKeys.has(row.key)
                ? ' bg-red-50 border-red-300'
                : row.resultIsCompliant === false
                  ? ' bg-red-50 border-red-300'
                  : row.resultIsCompliant === true
                    ? ' bg-green-50 border-surface-600'
                    : row.maniobraChain.length > 0
                      ? ' bg-blue-500/5 border-surface-600'
                      : ' border-surface-600';

              return (
                <React.Fragment key={row.key}>
                  <tr className={`border-b transition-colors hover:bg-surface-50/50${rowBg}`}>
                    <td className="px-1.5 py-1 text-surface-400 tabular-nums text-xs">
                      <div className="flex items-center gap-0.5">
                        {hasJustification && (
                          <button onClick={() => toggleJustification(row.key)} className="text-surface-400 hover:text-surface-700 flex-shrink-0" title="Ver justificación técnica">
                            {expandedJustification.has(row.key) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          </button>
                        )}
                        <span>{row.order}</span>
                      </div>
                    </td>
                    <td className="px-1.5 py-1">
                      <input value={row.code} onChange={(e) => updateRow(row.key, 'code', e.target.value)} className={`${inputCls} w-12`} placeholder="—" />
                    </td>
                    <td className="px-1.5 py-1">
                      <div className="flex items-center gap-1">
                        <input value={row.name} onChange={(e) => updateRow(row.key, 'name', e.target.value)} className={`${inputCls} w-full`} placeholder="Nombre" />
                        <button
                          type="button"
                          onClick={() => updateRow(row.key, 'isLighting', !row.isLighting)}
                          className={`shrink-0 rounded p-0.5 text-xs transition-colors ${row.isLighting ? 'bg-amber-100 text-amber-600' : 'text-surface-300 hover:text-surface-500 hover:bg-surface-100'}`}
                          title={row.isLighting ? 'Alumbrado (límite CdT 3%)' : 'Fuerza (límite CdT 5%) — pulsa para marcar como alumbrado'}
                        >
                          💡
                        </button>
                      </div>
                    </td>
                    <td className="px-1.5 py-1 text-right">
                      <span className="text-xs tabular-nums text-surface-500">{pCalcKw}</span>
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      {iga.voltage === 400 && (diffIdx === null || (diffs[diffIdx]?.poles ?? 2) === 4) ? (
                        <select value={row.voltage} onChange={(e) => { updateRow(row.key, 'voltage', Number(e.target.value)); updateRow(row.key, 'phases', Number(e.target.value) === 400 ? 3 : 1); }} className={`${selectCls} w-[70px]`}>
                          <option value={230}>230 1F</option>
                          <option value={400}>400 3F</option>
                        </select>
                      ) : <span className="text-xs text-surface-500">230 1F</span>}
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      <select value={row.iCalcA} onChange={(e) => updateRow(row.key, 'iCalcA', Number(e.target.value))} className={`${selectCls} w-14`}>
                        {I_CALC_VALUES.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      <span className={`text-xs tabular-nums inline-flex items-center gap-1 rounded px-1 py-0.5 ${hasCalcSection ? sectionInsufficient ? 'bg-red-100 text-red-700 font-medium' : 'bg-emerald-100 text-emerald-700 font-medium' : 'text-surface-500'}`}
                        title={hasCalcSection ? sectionInsufficient ? `Sección insuficiente. Mínimo: ${row.resultSectionMm2}mm²` : 'Cumple' : undefined}>
                        {userSection}
                      </span>
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      <span className="text-xs tabular-nums text-surface-400">{row.resultSection ?? '—'}</span>
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      <select value={row.cableType} onChange={(e) => updateRow(row.key, 'cableType', e.target.value)} className={`${selectCls} w-16`}>
                        <option value="CU">CU</option><option value="AL">AL</option>
                      </select>
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      <select value={row.insulationType} onChange={(e) => updateRow(row.key, 'insulationType', e.target.value)} className={`${selectCls} w-[90px]`}>
                        <option value="H07V-K">H07V-K</option><option value="H07V-U">H07V-U</option><option value="H07Z1-K">H07Z1-K</option>
                        <option value="RV-K">RV-K</option><option value="RZ1-K">RZ1-K</option><option value="EPR">EPR</option>
                      </select>
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      <select value={row.installMethod} onChange={(e) => updateRow(row.key, 'installMethod', e.target.value)} className={`${selectCls} w-16`}>
                        {Object.entries(INSTALL_TYPE_LABELS).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                      </select>
                    </td>
                    <td className="px-1.5 py-1">
                      <input value={row.length} onChange={(e) => { const val = e.target.value.replace(',', '.'); const num = parseFloat(val); if (!isNaN(num) && num >= 0) updateRow(row.key, 'length', num); else if (val === '' || val === '0') updateRow(row.key, 'length', 0); }} className={`${inputCls} w-14`} placeholder="m" inputMode="decimal" />
                    </td>
                    <td className="px-1.5 py-1 text-right">
                      {cdtPct != null ? (
                        <span className={`text-xs tabular-nums ${cdtDanger ? 'text-red-600 font-bold' : cdtOk ? 'text-emerald-600 font-medium' : 'text-surface-400'}`}>
                          <span className="text-surface-400 font-normal">{cdtLimit}%</span>{' | '}{cdtPct.toFixed(2)}%
                        </span>
                      ) : <span className="text-xs text-surface-400">—</span>}
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      <span className="text-xs tabular-nums font-medium text-surface-700">{displayPia}</span>
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      {row.maniobraChain.length > 0 ? (
                        <button onClick={() => toggleManiobra(row.key)} className="rounded px-1 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-500/20 transition-colors"
                          title={row.maniobraChain.map((d) => MANIOBRA_DEVICE_TYPES.find((m) => m.value === d.type)?.short ?? d.type).join('→')}>
                          {row.maniobraChain.length > 1 ? `${row.maniobraChain.length}×` : MANIOBRA_DEVICE_TYPES.find((m) => m.value === row.maniobraChain[0]?.type)?.short ?? '⚙'}
                        </button>
                      ) : (
                        <button onClick={() => toggleManiobra(row.key)} className="rounded p-0.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-500" title="Añadir maniobra">
                          <Settings2 className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                    {/* Move-to-diff dropdown (only in unassigned section) */}
                    {diffIdx === null && diffs.length > 0 && (
                      <td className="px-1.5 py-1 text-center">
                        <select value="" onChange={(e) => { if (e.target.value) moveCircuit(row.key, Number(e.target.value)); }} className={`${selectCls} w-24 text-[10px]`}>
                          <option value="">Asignar…</option>
                          {diffs.map((d, i) => <option key={d.localId} value={i}>{d.name}</option>)}
                        </select>
                      </td>
                    )}
                    <td className="px-1.5 py-1">
                      <button onClick={() => removeRow(row.key)} className="rounded p-0.5 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Eliminar">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                  {/* Maniobra sub-row */}
                  {expandedManiobra.has(row.key) && (
                    <tr className="bg-blue-500/5 border-b border-surface-600">
                      <td colSpan={diffIdx === null && diffs.length > 0 ? 17 : 16} className="px-3 py-2">
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
                          {row.maniobraChain.map((dev, idx) => (
                            <div key={idx} className="flex items-center gap-2 pl-4 text-xs">
                              <span className="text-surface-400 w-4">{idx + 1}.</span>
                              <select value={dev.type} onChange={(e) => {
                                const newChain = [...row.maniobraChain];
                                const newType = e.target.value;
                                const hasCal = MANIOBRA_DEVICE_TYPES.find((m) => m.value === newType)?.hasCalibre;
                                newChain[idx] = { ...newChain[idx], type: newType, calibreA: hasCal ? (dev.calibreA || piaForICalc(row.iCalcA)) : undefined };
                                setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, maniobraChain: newChain } : r));
                                setDirty(true);
                              }} className={`${selectCls} w-36`}>
                                {MANIOBRA_DEVICE_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                              </select>
                              {MANIOBRA_DEVICE_TYPES.find((m) => m.value === dev.type)?.hasCalibre && (
                                <select value={dev.calibreA || ''} onChange={(e) => {
                                  const newChain = [...row.maniobraChain];
                                  newChain[idx] = { ...newChain[idx], calibreA: Number(e.target.value) };
                                  setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, maniobraChain: newChain } : r));
                                  setDirty(true);
                                }} className={`${selectCls} w-20`}>
                                  {PIA_RATINGS.map((a) => <option key={a} value={a}>{a} A</option>)}
                                </select>
                              )}
                              <button onClick={() => {
                                const newChain = row.maniobraChain.filter((_, i) => i !== idx);
                                setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, maniobraChain: newChain } : r));
                                setDirty(true);
                              }} className="rounded p-0.5 text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Quitar">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 pl-4">
                            <button onClick={() => {
                              const newDevice: ManiobraDevice = { type: 'CONTACTOR', calibreA: piaForICalc(row.iCalcA) };
                              setRows((prev) => prev.map((r) => r.key === row.key ? { ...r, maniobraChain: [...r.maniobraChain, newDevice] } : r));
                              setDirty(true);
                            }} className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-blue-500 hover:bg-blue-50 border border-blue-500/30 transition-colors">
                              <Plus className="h-2.5 w-2.5" /> Añadir dispositivo
                            </button>
                            {row.maniobraChain.length > 0 && (
                              <button onClick={() => removeManiobra(row.key)} className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-red-600 hover:bg-red-50 border border-red-500/30 transition-colors">
                                <X className="h-2.5 w-2.5" /> Limpiar todo
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Justification sub-row */}
                  {expandedJustification.has(row.key) && hasJustification && (
                    <tr>
                      <td colSpan={diffIdx === null && diffs.length > 0 ? 17 : 16} className="p-0">
                        <div className="bg-surface-50 border-t border-surface-200 px-6 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Info className="h-4 w-4 text-blue-600" />
                            <p className="text-xs font-semibold text-surface-700">
                              Justificación técnica — {row.code || row.name}
                            </p>
                            {row.resultIsCompliant === true && (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5 font-medium">
                                <CheckCircle2 className="h-3 w-3" /> Cumple
                              </span>
                            )}
                            {row.resultIsCompliant === false && (
                              <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 rounded px-1.5 py-0.5 font-medium">
                                <XCircle className="h-3 w-3" /> No cumple
                              </span>
                            )}
                          </div>
                          <div className="space-y-3">
                            {(row.resultJustification ?? []).map((step, stepIdx) => (
                              <div key={stepIdx} className="flex gap-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-blue-50 text-blue-600">
                                  {stepIdx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-surface-700">{step.description}</p>
                                  <p className="text-xs text-surface-500 mt-0.5">{step.formula}</p>
                                  {step.inputValues && Object.keys(step.inputValues).length > 0 && (
                                    <code className="block mt-1 text-[11px] bg-white rounded px-2 py-1 font-mono border border-surface-200 text-surface-700">
                                      {Object.entries(step.inputValues).map(([k, v]) => `${k} = ${v}`).join(', ')}
                                    </code>
                                  )}
                                  {step.result != null && (
                                    <p className="mt-1 text-xs font-semibold text-surface-900">&rarr; {String(step.result)}</p>
                                  )}
                                  {step.normRef && (
                                    <span className="inline-block mt-1 rounded border border-surface-200 bg-white px-1.5 py-0.5 text-[10px] text-surface-500">
                                      {step.normRef}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
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
    );
  };

  // ── Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-surface-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{noSpinnerStyle}</style>

      {/* ═══ RESULTADOS DEL CÁLCULO (solo tras calcular) ═══ */}
      {calculation && supplyResult && (
        <div className="space-y-3">
          {/* a) Card suministro */}
          <div className={`rounded-lg border p-4 ${supplyResult.isValid ? 'border-emerald-500/30 bg-emerald-50' : 'border-amber-500/30 bg-amber-50'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className={`h-4 w-4 ${supplyResult.isValid ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className={`text-sm font-semibold ${supplyResult.isValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                Suministro calculado {supplyResult.isValid ? '— cumple REBT' : '— revisar advertencias'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-surface-500 text-xs">Potencia Máx. Admisible</span>
                <p className="font-medium">{(supplyResult.designPowerW / 1000).toFixed(2)} kW</p>
              </div>
              <div>
                <span className="text-surface-500 text-xs">IGA</span>
                <p className="font-bold text-blue-600">{supplyResult.iga.ratingA} A</p>
              </div>
              <div>
                <span className="text-surface-500 text-xs">Sección DI</span>
                <p className="font-bold text-blue-600">{supplyResult.di.sectionMm2} mm²</p>
              </div>
              <div>
                <span className="text-surface-500 text-xs">CdT DI</span>
                <p className={`font-medium ${supplyResult.di.cdtResult.cdtCompliant ? 'text-emerald-600' : 'text-red-600'}`}>
                  {supplyResult.di.cdtResult.voltageDropPct.toFixed(3)}% (lím. {supplyResult.di.cdtResult.cdtLimitPct}%)
                </p>
              </div>
              <div>
                <span className="text-surface-500 text-xs">Conductor PE</span>
                <p className="font-medium">{supplyResult.protectionConductorMm2} mm²</p>
              </div>
              <div>
                <span className="text-surface-500 text-xs">Diferenciales</span>
                <p className="font-medium text-xs">
                  {diffs.length > 0
                    ? diffs.map(d => `${d.name} ${d.calibreA}A/${d.sensitivityMa}mA tipo ${d.type}`).join(' · ')
                    : `${supplyResult.differentials.length} × ${supplyResult.differentials[0]?.sensitivityMa ?? 30} mA (sugeridos)`}
                </p>
              </div>
              <div>
                <span className="text-surface-500 text-xs">I cálculo</span>
                <p className="font-medium">{supplyResult.iga.nominalCurrentA} A</p>
              </div>
            </div>
            {supplyResult.warnings && supplyResult.warnings.length > 0 && (
              <div className="mt-3 border-t border-surface-200 pt-2">
                {supplyResult.warnings.map((w: string, i: number) => (
                  <p key={i} className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {w}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* b) Banner normativo azul */}
          <NormativeVersionBanner />

          {/* c) Disclaimer amarillo */}
          <CalculationDisclaimer />

          {/* d) Banner compliance */}
          {calcCompliance && (
            <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
              calcCompliance.nonCompliant === 0
                ? 'border-emerald-500/30 bg-emerald-50'
                : 'border-red-500/30 bg-red-50'
            }`}>
              {calcCompliance.nonCompliant === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className={`text-sm font-semibold ${calcCompliance.nonCompliant === 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                  {calcCompliance.nonCompliant === 0
                    ? 'Todos los circuitos cumplen con el REBT'
                    : `${calcCompliance.nonCompliant} circuito${calcCompliance.nonCompliant !== 1 ? 's' : ''} no cumple${calcCompliance.nonCompliant !== 1 ? 'n' : ''}`}
                </p>
                <p className={`text-xs mt-0.5 ${calcCompliance.nonCompliant === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {calcCompliance.nonCompliant === 0
                    ? 'Instalación conforme al RD 842/2002.'
                    : 'Revisa los circuitos marcados en rojo.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ DERIVACIÓN INDIVIDUAL ═══ */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cable className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-800">Derivación Individual (DI)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Sección (mm²)</label>
            <select value={di.seccionDi ?? ''} onChange={(e) => updateDi('seccionDi', e.target.value ? Number(e.target.value) : null)} className={`${selectCls}`}>
              <option value="">—</option>
              {DI_SECTIONS.map((s) => <option key={s} value={s}>{s} mm²</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Material</label>
            <select value={di.materialDi} onChange={(e) => updateDi('materialDi', e.target.value)} className={`${selectCls}`}>
              {DI_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Longitud (m)</label>
            <input type="number" value={di.longitudDi ?? ''} onChange={(e) => updateDi('longitudDi', e.target.value ? Number(e.target.value) : null)} className={`${inputCls} w-full`} placeholder="m" min={0} step={0.1} />
          </div>
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Aislamiento</label>
            <select value={di.aislamientoDi} onChange={(e) => updateDi('aislamientoDi', e.target.value)} className={`${selectCls}`}>
              {DI_INSULATIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Tipo instalación</label>
            <select value={di.tipoInstalacionDi} onChange={(e) => updateDi('tipoInstalacionDi', e.target.value)} className={`${selectCls}`}>
              {DI_INSTALL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ═══ IGA ═══ */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-800">Interruptor General Automático (IGA)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Calibre (A)</label>
            <select value={iga.calibreA} onChange={(e) => updateIga('calibreA', Number(e.target.value))} className={`${selectCls}`}>
              {IGA_RATINGS.map((a) => <option key={a} value={a}>{a}A</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">P. Máx. Adm.</label>
            <div className="h-7 flex items-center text-xs font-medium text-blue-700 bg-blue-500/15 rounded px-2">{maxPowerKw} kW</div>
          </div>
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Tensión</label>
            <select value={iga.voltage} onChange={(e) => updateIga('voltage', Number(e.target.value))} className={`${selectCls}`}>
              <option value={230}>230V mono</option>
              <option value={400}>400V tri</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Curva</label>
            <select value={iga.curve} onChange={(e) => updateIga('curve', e.target.value)} className={`${selectCls}`}>
              {CURVES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">P. Corte</label>
            <select value={iga.powerCutKa} onChange={(e) => updateIga('powerCutKa', Number(e.target.value))} className={`${selectCls}`}>
              {POWER_CUT_KA.map((k) => <option key={k} value={k}>{k} kA</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Polos</label>
            <div className="h-7 flex items-center text-xs text-surface-700 bg-surface-100 rounded px-2">{iga.poles}P</div>
          </div>
        </div>
        {!contractedOk && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded p-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            P. contratada ({((contractedPower ?? 0) / 1000).toFixed(2)} kW) &gt; P. máx. admisible ({maxPowerKw} kW). Sube el calibre del IGA.
          </div>
        )}
      </div>

      {/* ═══ CUADRO ELÉCTRICO: Diferenciales + Circuitos ═══ */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-surface-700">Cuadro Eléctrico</h3>
            <p className="text-xs text-surface-500">
              {rows.length} circuito{rows.length !== 1 ? 's' : ''} · {diffs.length} diferencial{diffs.length !== 1 ? 'es' : ''} · P. máx.: {(displayMaxPowerW / 1000).toFixed(2)} kW
            </p>
          </div>
          <div className="flex items-center gap-2">
            {rows.length === 0 && supplyType && supplyType !== 'LOCAL_COMERCIAL' && (
              <Button variant="outline" size="sm" onClick={loadCircuitTemplates}>
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                Cargar plantilla ITC-BT-25
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={addDiff}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Añadir diferencial
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {diffs.length === 0 && rows.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-surface-200 py-10 text-center">
            <AlertTriangle className="h-8 w-8 text-surface-400 mx-auto" />
            <p className="mt-3 text-sm font-medium text-surface-700">Sin circuitos ni diferenciales</p>
            <p className="mt-1 text-xs text-surface-500 max-w-sm mx-auto">
              {supplyType && supplyType !== 'LOCAL_COMERCIAL'
                ? 'Pulsa "Cargar plantilla ITC-BT-25" para rellenar automáticamente, o añade diferenciales y circuitos manualmente.'
                : 'Añade un diferencial y crea circuitos dentro de él.'}
            </p>
          </div>
        )}

        {/* ── Differentials ── */}
        {diffs.map((diff, idx) => {
          const diffRows = rows.filter((r) => diff.circuitKeys.includes(r.key));
          const sumPias = diffRows.reduce((sum, r) => sum + piaForICalc(r.iCalcA), 0);

          return (
            <div
              key={diff.localId}
              className={`rounded-lg border ${
                diff.isProtected === false ? 'border-red-500/30 bg-red-500/5'
                : diff.isProtected === true ? 'border-green-500/30 bg-green-500/5'
                : 'border-surface-200 bg-white'
              }`}
            >
              {/* Differential header */}
              <div className="flex flex-wrap items-center gap-2 p-3 border-b border-surface-100">
                <button onClick={() => updateDiff(idx, 'expanded', !diff.expanded)} className="text-surface-400 hover:text-surface-700">
                  {diff.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <input value={diff.name} onChange={(e) => updateDiff(idx, 'name', e.target.value)} className={`${inputCls} w-32`} />
                <select value={diff.calibreA} onChange={(e) => updateDiff(idx, 'calibreA', Number(e.target.value))} className={`${selectCls} !w-16`}>
                  {DIFF_CALIBRES.map((a) => <option key={a} value={a}>{a}A</option>)}
                </select>
                <select value={diff.sensitivityMa} onChange={(e) => updateDiff(idx, 'sensitivityMa', Number(e.target.value))} className={`${selectCls} !w-20`}>
                  {SENSITIVITIES.map((s) => <option key={s} value={s}>{s}mA</option>)}
                </select>
                <select value={diff.type} onChange={(e) => updateDiff(idx, 'type', e.target.value)} className={`${selectCls} !w-16`}>
                  {DIFF_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {iga.voltage === 400 ? (
                  <select value={diff.poles} onChange={(e) => updateDiff(idx, 'poles', Number(e.target.value))} className={`${selectCls} !w-16`}>
                    <option value={2}>2P</option><option value={4}>4P</option>
                  </select>
                ) : (
                  <span className="text-[11px] text-surface-500 bg-surface-100 rounded px-2 py-1">2P</span>
                )}
                {diff.isProtected === true && (
                  <span className="flex items-center gap-1 text-[11px] text-green-700 bg-green-500/15 rounded px-2 py-0.5">
                    <ShieldCheck className="h-3 w-3" /> Protegido
                  </span>
                )}
                {diff.isProtected === false && (
                  <span className="flex items-center gap-1 text-[11px] text-red-600 bg-red-500/15 rounded px-2 py-0.5" title={diff.protectionNote ?? ''}>
                    <ShieldAlert className="h-3 w-3" /> No protegido
                  </span>
                )}
                <span className="text-[11px] text-surface-400 ml-auto">
                  {diffRows.length} circ. · ΣPIAs {sumPias}A
                </span>
                <button onClick={() => removeDiff(idx)} className="rounded p-1 text-surface-400 hover:bg-red-50 hover:text-red-600" title="Eliminar diferencial">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Circuits inside differential */}
              {diff.expanded && (
                <div className="px-2 pb-3 pt-1">
                  {renderCircuitTable(diffRows, idx)}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => addCircuitToDiff(idx)}
                      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-500/30 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Añadir circuito
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Unassigned circuits ── */}
        {unassignedRows.length > 0 && (
          <div className="rounded-lg border border-amber-400/40 bg-amber-50/50">
            <div className="flex items-center gap-2 p-3 border-b border-amber-200/50">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-amber-800">Sin diferencial asignado</h4>
              <span className="text-[11px] text-amber-600 ml-auto">{unassignedRows.length} circuito{unassignedRows.length > 1 ? 's' : ''}</span>
            </div>
            <div className="px-2 pb-3 pt-1">
              {renderCircuitTable(unassignedRows, null)}
              <div className="mt-2">
                <button
                  onClick={addUnassignedCircuit}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-100 border border-surface-300 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Añadir circuito sin diferencial
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty diff hint */}
        {diffs.length === 0 && rows.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Añade al menos un diferencial y asigna circuitos antes de calcular.</span>
          </div>
        )}
      </div>

      {/* ═══ ACTION BUTTONS ═══ */}
      {(rows.length > 0 || diffs.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 border-t border-surface-200 pt-5">
          <Button onClick={handleSave} disabled={saving || isSaving || !dirty} variant="outline">
            {saving || isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando…</>
            ) : saved ? (
              <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Guardado</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Guardar cuadro</>
            )}
          </Button>
          <Button onClick={handleCalculate} disabled={isCalculating || rows.length === 0 || diffs.length === 0}>
            {isCalculating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando…</>
            ) : (
              <><Calculator className="mr-2 h-4 w-4" /> Calcular instalación</>
            )}
          </Button>
          {dirty && <span className="text-xs text-amber-600">Cambios sin guardar</span>}
        </div>
      )}

      {/* ═══ VALIDATION ERRORS ═══ */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-red-700">{validationErrors.length} error{validationErrors.length !== 1 ? 'es' : ''} de validación</span>
            </div>
            <button onClick={() => setValidationErrors([])} className="rounded p-0.5 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors" title="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-red-200">
            {validationErrors.map((err, i) => (
              <div key={i} className="py-2 first:pt-0 last:pb-0">
                <span className="text-xs font-medium text-red-800">{err.circuitLabel}</span>
                <p className="text-xs text-red-700 mt-0.5">
                  <span className="font-medium">{err.rule}</span> — tiene: <span className="font-mono bg-red-100 px-1 rounded">{err.actual}</span>, esperado: <span className="font-mono bg-red-100 px-1 rounded">{err.expected}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
