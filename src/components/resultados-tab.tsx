// ============================================================
// apps/web/src/components/resultados-tab.tsx
// REEMPLAZA TODO el contenido anterior por esto
// ============================================================

'use client';

import { useState, useMemo } from 'react';
import type {
  Circuit,
  CalculationResult,
  JustificationStep,
  InstallationSummary,
} from '@/lib/types';
import {
  formatPower,
  formatSection,
  formatVoltageDrop,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Zap,
  Cable,
  Shield,
  Activity,
  Calculator,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Tipo del motor (resultSnapshot.circuits[]) ────────────────
interface EngineCircuitResult {
  id: string;
  sectionMm2: number;
  voltageDropPct: number;
  accumulatedCdtPct: number;
  nominalCurrentA: number;
  admissibleCurrentA: number;
  correctedIzA: number;
  breakerRatingA: number;
  breakerCurve: string;
  rcdSensitivityMa: number;
  tubeDiameterMm: number;
  sectionCriteria: string;
  cdtLimitPct: number;
  cdtCompliant: boolean;
  isCompliant: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  justification: {
    steps: EngineStep[];
    formulasUsed: string[];
    normReferences: string[];
    tableReferences: string[];
  };
}

interface EngineStep {
  order: number;
  description: string;
  formula: string;
  result: string | number;
  normRef: string;
  inputValues: Record<string, unknown>;
}

// ─── Circuito combinado (datos entrada + resultados motor) ────
interface MergedCircuit {
  // Datos de entrada (del Circuit de Prisma)
  id: string;
  name: string;
  code: string | null;
  order: number;
  power: number;
  voltage: number;
  phases: number;
  length: number;
  cableType: string;
  installMethod: string;
  // Resultados del motor
  sectionMm2: number | null;
  voltageDropPct: number | null;
  accumulatedCdtPct: number | null;
  breakerRatingA: number | null;
  breakerCurve: string | null;
  rcdSensitivityMa: number | null;
  isCompliant: boolean | null;
  justificationSteps: JustificationStep[];
}

interface ResultadosTabProps {
  circuits: Circuit[];
  calculation: CalculationResult | null;
  supplyResult?: any;
  installation?: any;
  isCalculating: boolean;
  documentCount?: number;
  onRecalculate: () => void;
  onGoToCuadro: () => void;
}

export function ResultadosTab({
  circuits,
  calculation,
  supplyResult,
  installation,
  isCalculating,
  documentCount = 0,
  onRecalculate,
  onGoToCuadro,
}: ResultadosTabProps) {
  // Si no hay cálculo, mostrar estado vacío
  if (!calculation) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Calculator className="h-10 w-10 text-surface-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-surface-700">Sin resultados</p>
          <p className="text-xs text-surface-400 mt-1">
            Configura los circuitos en "Cuadro eléctrico" y pulsa "Calcular instalación".
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onGoToCuadro}>
          <Zap className="mr-2 h-3 w-3" />
          Ir al cuadro eléctrico
        </Button>
      </div>
    );
  }

  // Extraer resultados del motor y cruzar con circuitos de entrada
  const snapshot = calculation.resultSnapshot as any;
  const engineCircuits: EngineCircuitResult[] = snapshot?.circuits || [];
  const inputCircuits = (calculation.inputSnapshot as any[]) || [];

  // Merge: cruzar datos de entrada con resultados del motor por ID
  const merged: MergedCircuit[] = useMemo(() => {
    return engineCircuits.map((eng, idx) => {
      // Buscar datos de entrada (por id)
      const input = inputCircuits.find((inp) => inp.id === eng.id);
      // Buscar datos del Circuit de Prisma (por id)
      const prismaCircuit = circuits.find((c) => c.id === eng.id);

      // Mapear steps del motor a formato del frontend
      const steps: JustificationStep[] = (eng.justification?.steps || []).map((s) => ({
        title: s.description,
        description: s.formula,
        formula: Object.entries(s.inputValues || {})
          .map(([k, v]) => `${k} = ${v}`)
          .join(', '),
        result: String(s.result),
        reference: s.normRef,
        compliant: undefined, // el motor no marca compliance por paso
      }));

      return {
        id: eng.id,
        name: prismaCircuit?.name || input?.label || `Circuito ${idx + 1}`,
        code: prismaCircuit?.code || input?.code || null,
        order: prismaCircuit?.order ?? idx,
        power: input?.loadPowerW ?? prismaCircuit?.power ?? 0,
        voltage: input?.voltageV ?? prismaCircuit?.voltage ?? 230,
        phases: input?.phaseSystem === 'three' ? 3 : 1,
        length: input?.lengthM ?? prismaCircuit?.length ?? 0,
        cableType: input?.conductorMaterial ?? prismaCircuit?.cableType ?? 'CU',
        installMethod: input?.installationMethod ?? prismaCircuit?.installMethod ?? 'A1',
        // Resultados
        sectionMm2: eng.sectionMm2 ?? null,
        voltageDropPct: eng.voltageDropPct ?? null,
        accumulatedCdtPct: eng.accumulatedCdtPct ?? null,
        breakerRatingA: eng.breakerRatingA ?? null,
        breakerCurve: eng.breakerCurve ?? null,
        rcdSensitivityMa: eng.rcdSensitivityMa ?? null,
        isCompliant: eng.isCompliant ?? null,
        justificationSteps: steps,
      };
    });
  }, [engineCircuits, inputCircuits, circuits]);

  const summary = buildSummary(merged, snapshot?.summary, supplyResult, installation);

  const date = new Date(calculation.calculatedAt).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* ── Banner compliance ── */}
      <div
        className={cn(
          'rounded-lg border px-4 py-3 flex items-start gap-3',
          calculation.allCompliant
            ? 'border-emerald-500/30 bg-emerald-50'
            : 'border-red-500/30 bg-red-50',
        )}
      >
        {calculation.allCompliant ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        )}
        <div>
          <p className={cn('text-sm font-semibold', calculation.allCompliant ? 'text-emerald-300' : 'text-red-300')}>
            {calculation.allCompliant
              ? 'Todos los circuitos cumplen con el REBT'
              : 'Algunos circuitos NO cumplen con el REBT'}
          </p>
          <p className={cn('text-xs mt-0.5', calculation.allCompliant ? 'text-emerald-600' : 'text-red-600')}>
            {calculation.allCompliant
              ? `Instalación conforme al RD 842/2002. Calculado el ${date}.`
              : `Revisa los circuitos marcados con ✗. Calculado el ${date}.`}
          </p>
        </div>
      </div>

      {/* ── Resumen global ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Zap} label="P. máx. admisible" value={formatPower(summary.totalPower)} color="text-amber-600" />
        <StatCard icon={Cable} label="Sección D.I." value={formatSection(summary.maxSection)} color="text-blue-600" />
        <StatCard icon={Activity} label="CdT máxima" value={formatVoltageDrop(summary.maxVoltageDrop)} color="text-purple-600" />
        <StatCard
          icon={Shield}
          label="Cumplen"
          value={`${summary.compliantCircuits}/${summary.totalCircuits}`}
          color={summary.nonCompliantCircuits > 0 ? 'text-red-600' : 'text-emerald-600'}
        />
      </div>

      {/* ── Tabla de circuitos ── */}
      <div>
        <h3 className="text-sm font-semibold text-surface-50 mb-3 flex items-center gap-2">
          <Cable className="h-4 w-4" />
          Resultados por circuito
        </h3>
        <div className="overflow-x-auto rounded-lg border border-surface-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="px-3 py-2 text-left text-xs font-medium text-surface-500 w-[50px]">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-surface-500">Circuito</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-surface-500">Potencia</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-surface-500">Sección</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-surface-500">CdT (%)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-surface-500">PIA</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-surface-500">Diferencial</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-surface-500 w-[60px]">Cumple</th>
                <th className="px-3 py-2 w-[40px]"></th>
              </tr>
            </thead>
            <tbody>
              {merged
                .sort((a, b) => a.order - b.order)
                .map((mc) => (
                  <CircuitRow key={mc.id} circuit={mc} />
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer ── */}
      {documentCount > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-50 px-3 py-2 flex items-center gap-2 text-xs text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Hay {documentCount} documento{documentCount !== 1 ? 's' : ''} emitido{documentCount !== 1 ? 's' : ''}. Recalcular puede afectar la coherencia. Los nuevos documentos se generarán como nueva versión.</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-surface-400">
          Motor v{calculation.engineVersion} · Norma: {calculation.normVersion} · Cálculo v{calculation.version}
        </p>
        <Button variant="outline" size="sm" onClick={onRecalculate} disabled={isCalculating}>
          {isCalculating ? (
            <><RefreshCw className="mr-2 h-3 w-3 animate-spin" />Calculando...</>
          ) : (
            <><RefreshCw className="mr-2 h-3 w-3" />Recalcular</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Subcomponentes ────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5', color)} />
        <div>
          <p className="text-xs text-surface-500">{label}</p>
          <p className="text-lg font-bold text-surface-50">{value}</p>
        </div>
      </div>
    </div>
  );
}

function CircuitRow({ circuit }: { circuit: MergedCircuit }) {
  const [expanded, setExpanded] = useState(false);
  const hasSteps = circuit.justificationSteps.length > 0;

  // Color CdT según límite
  const isLighting = circuit.code === 'C1' || circuit.code === 'C6' || circuit.code === 'C11';
  const cdtLimit = isLighting ? 3.0 : 5.0;
  const cdtValue = circuit.voltageDropPct;
  const cdtWarning = cdtValue != null && cdtValue > cdtLimit * 0.8;
  const cdtDanger = cdtValue != null && cdtValue > cdtLimit;

  // Formatear PIA
  const piaLabel = circuit.breakerRatingA != null
    ? `PIA ${circuit.breakerRatingA}A curva ${circuit.breakerCurve || 'C'}`
    : '—';

  // Formatear diferencial
  const rcdLabel = circuit.rcdSensitivityMa != null
    ? `Dif. ${circuit.rcdSensitivityMa}mA`
    : '—';

  return (
    <>
      <tr
        className={cn(
          'border-b border-surface-200 transition-colors',
          circuit.isCompliant === false && 'bg-red-500/5',
          hasSteps && 'cursor-pointer hover:bg-surface-50',
        )}
        onClick={() => hasSteps && setExpanded(!expanded)}
      >
        <td className="px-3 py-2.5 font-mono text-xs text-surface-400">
          {circuit.code || `#${circuit.order}`}
        </td>
        <td className="px-3 py-2.5 font-medium text-surface-700">{circuit.name}</td>
        <td className="px-3 py-2.5 text-right font-mono text-xs">{formatPower(circuit.power)}</td>
        <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-surface-50">
          {formatSection(circuit.sectionMm2)}
        </td>
        <td className={cn(
          'px-3 py-2.5 text-right font-mono text-xs',
          cdtDanger && 'text-red-600 font-bold',
          cdtWarning && !cdtDanger && 'text-amber-600 font-semibold',
        )}>
          {formatVoltageDrop(circuit.voltageDropPct)}
        </td>
        <td className="px-3 py-2.5 text-xs text-surface-700">{piaLabel}</td>
        <td className="px-3 py-2.5 text-xs text-surface-700">{rcdLabel}</td>
        <td className="px-3 py-2.5 text-center">
          {circuit.isCompliant === true ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
          ) : circuit.isCompliant === false ? (
            <XCircle className="h-4 w-4 text-red-500 mx-auto" />
          ) : (
            <span className="text-surface-400">—</span>
          )}
        </td>
        <td className="px-3 py-2.5">
          {hasSteps && (
            <button className="text-surface-400 hover:text-surface-700" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
        </td>
      </tr>

      {/* ── Justificación expandible ── */}
      {expanded && hasSteps && (
        <tr>
          <td colSpan={9} className="p-0">
            <div className="bg-surface-50 border-t border-surface-200 px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-semibold text-surface-700">
                  Justificación técnica — {circuit.code || circuit.name}
                </p>
              </div>
              <div className="space-y-3">
                {circuit.justificationSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-blue-50 text-blue-600">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-surface-700">{step.title}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{step.description}</p>
                      {step.formula && (
                        <code className="block mt-1 text-[11px] bg-white rounded px-2 py-1 font-mono border border-surface-200 text-surface-700">
                          {step.formula}
                        </code>
                      )}
                      {step.result && (
                        <p className="mt-1 text-xs font-semibold text-surface-50">→ {step.result}</p>
                      )}
                      {step.reference && (
                        <span className="inline-block mt-1 rounded border border-surface-200 bg-white px-1.5 py-0.5 text-[10px] text-surface-500">
                          {step.reference}
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
    </>
  );
}

// ─── Helpers ───────────────────────────────────────────────────

function buildSummary(
  merged: MergedCircuit[],
  engineSummary?: { totalPowerW?: number; maxSectionMm2?: number; maxVoltageDropPct?: number },
  supplyResult?: any,
  installation?: any,
): InstallationSummary {
  // P. máx. admisible: supplyResult (memoria) > installation (BD) > engineSummary > suma circuitos
  const totalPower = supplyResult?.designPowerW
    ?? (installation?.potMaxAdmisible ? installation.potMaxAdmisible * 1000 : undefined)
    ?? engineSummary?.totalPowerW
    ?? merged.reduce((sum, c) => sum + (c.power || 0), 0);

  // Sección D.I.: supplyResult (memoria) > installation (BD) > engineSummary > máx circuitos
  const maxSection = supplyResult?.di?.sectionMm2
    ?? installation?.seccionDi
    ?? engineSummary?.maxSectionMm2
    ?? Math.max(0, ...merged.map((c) => c.sectionMm2 ?? 0));

  // CdT máxima: la mayor de los circuitos interiores (esto sí es correcto como estaba)
  const maxVoltageDrop = engineSummary?.maxVoltageDropPct ?? Math.max(0, ...merged.map((c) => c.voltageDropPct ?? 0));

  return {
    totalPower,
    maxSection,
    maxVoltageDrop,
    maxVoltageDropAcc: Math.max(0, ...merged.map((c) => c.accumulatedCdtPct ?? 0)),
    totalCircuits: merged.length,
    compliantCircuits: merged.filter((c) => c.isCompliant === true).length,
    nonCompliantCircuits: merged.filter((c) => c.isCompliant === false).length,
  };
}
