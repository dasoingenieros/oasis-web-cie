'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Circuit, ElectricalPanel, Differential, SavePanelWithDifferentialsDto, SupplyType } from '@/lib/types';
import { panelsApi, installationsApi } from '@/lib/api-client';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  Wand2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Zap,
  Cable,
  Info,
} from 'lucide-react';

// ─── Constantes ──────────────────────────────────────────────

const IGA_RATINGS = [10, 15, 16, 20, 25, 32, 40, 50, 63];
const DIFF_CALIBRES = [25, 40, 63, 80, 100];
const CURVES = ['B', 'C', 'D'];
const POWER_CUT_KA = [6, 10, 15];
const SENSITIVITIES = [30, 300];
const DIFF_TYPES = ['AC', 'A', 'F', 'B'];

const DI_SECTIONS = [6, 10, 16, 25, 35, 50, 70, 95, 120];
const DI_MATERIALS = ['CU', 'AL'];
const DI_INSULATIONS = ['XLPE', 'PVC', 'EPR'];
const DI_INSTALL_TYPES = ['TP', 'E.T.F.', 'E.T.C.', 'S.T.C.', 'F.D.P.', 'BANDJ.'];

function calcMaxPowerW(calibreA: number, voltage: number): number {
  if (voltage === 400) return Math.round(Math.sqrt(3) * 400 * calibreA);
  return 230 * calibreA;
}

function igaForPower(powerW: number, voltage: number): number {
  const iNeed = voltage === 400 ? powerW / (Math.sqrt(3) * 400) : powerW / 230;
  return IGA_RATINGS.find((r) => r >= iNeed) ?? 63;
}

// ─── CSS sin flechas ─────────────────────────────────────────

const noSpinnerStyle = `
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .no-spinner[type=number] { -moz-appearance: textfield; }
`;

const selectCls = 'h-7 rounded border border-surface-300 bg-white px-1.5 text-xs';
const inputCls = 'no-spinner h-7 rounded border border-surface-300 bg-white px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-blue-400';

// ─── State types ─────────────────────────────────────────────

interface IgaState {
  calibreA: number;
  curve: string;
  powerCutKa: number;
  poles: number;
  voltage: number;
}

interface DiState {
  seccionDi: number | null;
  materialDi: string;
  longitudDi: number | null;
  aislamientoDi: string;
  tipoInstalacionDi: string;
}

interface DiffState {
  id?: string;
  name: string;
  order: number;
  calibreA: number;
  sensitivityMa: number;
  type: string;
  poles: number;
  circuitIds: string[];
  isProtected?: boolean | null;
  protectionNote?: string | null;
  expanded: boolean;
}

// ─── Props ───────────────────────────────────────────────────

interface PanelFormProps {
  installationId: string;
  circuits: Circuit[];
  supplyType: SupplyType | string | null | undefined;
  contractedPower?: number | null;
}

export function PanelForm({ installationId, circuits, supplyType, contractedPower }: PanelFormProps) {
  const [iga, setIga] = useState<IgaState>({
    calibreA: 25, curve: 'C', powerCutKa: 6, poles: 2, voltage: 230,
  });
  const [di, setDi] = useState<DiState>({
    seccionDi: null, materialDi: 'CU', longitudDi: null, aislamientoDi: 'XLPE', tipoInstalacionDi: 'E.T.F.',
  });
  const [diffs, setDiffs] = useState<DiffState[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [diDirty, setDiDirty] = useState(false);
  const [diSaved, setDiSaved] = useState(false);

  // Cargar panel existente + datos DI
  useEffect(() => {
    (async () => {
      try {
        // Cargar DI desde installation
        const inst = await installationsApi.get(installationId);
        if (inst) {
          setDi({
            seccionDi: inst.seccionDi ?? null,
            materialDi: inst.materialDi || 'CU',
            longitudDi: inst.longitudDi ?? null,
            aislamientoDi: inst.aislamientoDi || 'XLPE',
            tipoInstalacionDi: inst.tipoInstalacionDi || 'E.T.F.',
          });
        }

        // Cargar panel
        const panel = await panelsApi.get(installationId);
        if (panel) {
          setIga({
            calibreA: panel.igaCalibreA,
            curve: panel.igaCurve,
            powerCutKa: panel.igaPowerCutKa,
            poles: panel.igaPoles,
            voltage: panel.voltage,
          });
          setDiffs(panel.differentials.map((d) => ({
            id: d.id,
            name: d.name,
            order: d.order,
            calibreA: d.calibreA,
            sensitivityMa: d.sensitivityMa,
            type: d.type,
            poles: d.poles,
            circuitIds: d.circuits.map((c) => c.id),
            isProtected: d.isProtected,
            protectionNote: d.protectionNote,
            expanded: true,
          })));
        }
      } catch {
        // No panel yet
      } finally {
        setLoading(false);
      }
    })();
  }, [installationId]);

  // ─── DI handlers ───────────────────────────────────────────

  const updateDi = useCallback((field: keyof DiState, value: string | number | null) => {
    setDi((prev) => ({ ...prev, [field]: value }));
    setDiDirty(true);
  }, []);

  const saveDi = useCallback(async () => {
    try {
      await installationsApi.update(installationId, {
        seccionDi: di.seccionDi,
        materialDi: di.materialDi,
        longitudDi: di.longitudDi,
        aislamientoDi: di.aislamientoDi,
        tipoInstalacionDi: di.tipoInstalacionDi,
      } as any);
      setDiDirty(false);
      setDiSaved(true);
      setTimeout(() => setDiSaved(false), 2000);
    } catch {
      alert('Error al guardar Derivación Individual');
    }
  }, [installationId, di]);

  // ─── IGA handlers ──────────────────────────────────────────

  const updateIga = useCallback((field: keyof IgaState, value: number | string) => {
    setIga((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'voltage') {
        next.poles = value === 400 ? 4 : 2;
      }
      return next;
    });
    setDirty(true);
  }, []);

  const maxPowerW = calcMaxPowerW(iga.calibreA, iga.voltage);
  const maxPowerKw = (maxPowerW / 1000).toFixed(2);
  const contractedOk = !contractedPower || contractedPower <= maxPowerW;

  // ─── Differential handlers ─────────────────────────────────

  const addDiff = useCallback(() => {
    setDiffs((prev) => [...prev, {
      name: `Diferencial ${prev.length + 1}`,
      order: prev.length + 1,
      calibreA: 40,
      sensitivityMa: 30,
      type: 'AC',
      poles: iga.poles,
      circuitIds: [],
      expanded: true,
    }]);
    setDirty(true);
  }, [iga.poles]);

  const removeDiff = useCallback((idx: number) => {
    setDiffs((prev) => prev.filter((_, i) => i !== idx).map((d, i) => ({ ...d, order: i + 1 })));
    setDirty(true);
  }, []);

  const updateDiff = useCallback((idx: number, field: keyof DiffState, value: unknown) => {
    setDiffs((prev) => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
    setDirty(true);
  }, []);

  const toggleCircuit = useCallback((diffIdx: number, circuitId: string) => {
    setDiffs((prev) => prev.map((d, i) => {
      if (i !== diffIdx) return d;
      const has = d.circuitIds.includes(circuitId);
      return {
        ...d,
        circuitIds: has
          ? d.circuitIds.filter((id) => id !== circuitId)
          : [...d.circuitIds, circuitId],
      };
    }));
    setDirty(true);
  }, []);

  // ─── Circuitos asignados/sin asignar ───────────────────────

  const assignedIds = new Set(diffs.flatMap((d) => d.circuitIds));
  const unassigned = circuits.filter((c) => !assignedIds.has(c.id));

  // ─── Cargar plantilla ──────────────────────────────────────

  const loadTemplate = useCallback(async () => {
    if (circuits.length === 0) {
      alert('Primero crea los circuitos en el cuadro eléctrico.');
      return;
    }
    setSaving(true);
    try {
      const panel = await panelsApi.createFromTemplate(installationId);
      setIga({
        calibreA: panel.igaCalibreA,
        curve: panel.igaCurve,
        powerCutKa: panel.igaPowerCutKa,
        poles: panel.igaPoles,
        voltage: panel.voltage,
      });
      setDiffs(panel.differentials.map((d) => ({
        id: d.id,
        name: d.name,
        order: d.order,
        calibreA: d.calibreA,
        sensitivityMa: d.sensitivityMa,
        type: d.type,
        poles: d.poles,
        circuitIds: d.circuits.map((c) => c.id),
        isProtected: d.isProtected,
        protectionNote: d.protectionNote,
        expanded: true,
      })));
      setDirty(false);
    } catch (err) {
      alert('Error al crear plantilla');
    } finally {
      setSaving(false);
    }
  }, [installationId, circuits]);

  // ─── Guardar ───────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Guardar DI si tiene cambios
      if (diDirty) {
        await saveDi();
      }

      const dto: SavePanelWithDifferentialsDto = {
        panel: {
          igaCalibreA: iga.calibreA,
          igaCurve: iga.curve,
          igaPowerCutKa: iga.powerCutKa,
          igaPoles: iga.poles,
          voltage: iga.voltage,
        },
        differentials: diffs.map((d) => ({
          id: d.id,
          name: d.name,
          order: d.order,
          calibreA: d.calibreA,
          sensitivityMa: d.sensitivityMa,
          type: d.type,
          poles: d.poles,
          circuitIds: d.circuitIds,
        })),
      };
      const panel = await panelsApi.save(installationId, dto);
      setDiffs(panel.differentials.map((d) => ({
        id: d.id,
        name: d.name,
        order: d.order,
        calibreA: d.calibreA,
        sensitivityMa: d.sensitivityMa,
        type: d.type,
        poles: d.poles,
        circuitIds: d.circuits.map((c) => c.id),
        isProtected: d.isProtected,
        protectionNote: d.protectionNote,
        expanded: true,
      })));
      setDirty(false);
      setDiDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Error al guardar el cuadro');
    } finally {
      setSaving(false);
    }
  }, [installationId, iga, diffs, diDirty, saveDi]);

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-surface-400" />
      </div>
    );
  }

  const anyDirty = dirty || diDirty;

  return (
    <div className="space-y-6">
      <style>{noSpinnerStyle}</style>

      {/* ── DERIVACIÓN INDIVIDUAL ──────────────────────────────── */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cable className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-800">Derivación Individual (DI)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Sección */}
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Sección (mm²)</label>
            <select
              value={di.seccionDi ?? ''}
              onChange={(e) => updateDi('seccionDi', e.target.value ? Number(e.target.value) : null)}
              className={`${selectCls} w-full`}
            >
              <option value="">—</option>
              {DI_SECTIONS.map((s) => <option key={s} value={s}>{s} mm²</option>)}
            </select>
          </div>
          {/* Material */}
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Material</label>
            <select
              value={di.materialDi}
              onChange={(e) => updateDi('materialDi', e.target.value)}
              className={`${selectCls} w-full`}
            >
              {DI_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {/* Longitud */}
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Longitud (m)</label>
            <input
              type="number"
              value={di.longitudDi ?? ''}
              onChange={(e) => updateDi('longitudDi', e.target.value ? Number(e.target.value) : null)}
              className={`${inputCls} w-full`}
              placeholder="m"
              min={0}
              step={0.1}
            />
          </div>
          {/* Aislamiento */}
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Aislamiento</label>
            <select
              value={di.aislamientoDi}
              onChange={(e) => updateDi('aislamientoDi', e.target.value)}
              className={`${selectCls} w-full`}
            >
              {DI_INSULATIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {/* Tipo instalación */}
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Tipo instalación</label>
            <select
              value={di.tipoInstalacionDi}
              onChange={(e) => updateDi('tipoInstalacionDi', e.target.value)}
              className={`${selectCls} w-full`}
            >
              {DI_INSTALL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── IGA ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-800">Interruptor General Automático (IGA)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {/* Calibre IGA */}
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Calibre (A)</label>
            <select
              value={iga.calibreA}
              onChange={(e) => updateIga('calibreA', Number(e.target.value))}
              className={`${selectCls} w-full`}
            >
              {IGA_RATINGS.map((a) => <option key={a} value={a}>{a}A</option>)}
            </select>
          </div>
          {/* P. Máx. Admisible */}
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">P. Máx. Adm.</label>
            <div className="h-7 flex items-center text-xs font-medium text-blue-700 bg-blue-500/15 rounded px-2">
              {maxPowerKw} kW
            </div>
          </div>
          {/* Tensión */}
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Tensión</label>
            <select
              value={iga.voltage}
              onChange={(e) => updateIga('voltage', Number(e.target.value))}
              className={`${selectCls} w-full`}
            >
              <option value={230}>230V mono</option>
              <option value={400}>400V tri</option>
            </select>
          </div>
          {/* Curva */}
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Curva</label>
            <select
              value={iga.curve}
              onChange={(e) => updateIga('curve', e.target.value)}
              className={`${selectCls} w-full`}
            >
              {CURVES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {/* Poder de corte */}
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">P. Corte</label>
            <select
              value={iga.powerCutKa}
              onChange={(e) => updateIga('powerCutKa', Number(e.target.value))}
              className={`${selectCls} w-full`}
            >
              {POWER_CUT_KA.map((k) => <option key={k} value={k}>{k} kA</option>)}
            </select>
          </div>
          {/* Polos */}
          <div>
            <label className="text-[11px] text-surface-500 block mb-1">Polos</label>
            <div className="h-7 flex items-center text-xs text-surface-700 bg-surface-100 rounded px-2">
              {iga.poles}P
            </div>
          </div>
        </div>
        {/* Warning potencia */}
        {!contractedOk && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded p-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            P. contratada ({((contractedPower ?? 0) / 1000).toFixed(2)} kW) &gt; P. máx. admisible ({maxPowerKw} kW). Sube el calibre del IGA.
          </div>
        )}
      </div>

      {/* ── DIFERENCIALES ───────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-700">Diferenciales</h3>
          <div className="flex gap-2">
            {diffs.length === 0 && circuits.length > 0 && (
              <Button variant="outline" size="sm" onClick={loadTemplate} disabled={saving}>
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                Cargar plantilla
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={addDiff}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Añadir diferencial
            </Button>
          </div>
        </div>

        {diffs.length === 0 ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-sm text-blue-700 flex items-center gap-2">
              <span className="text-blue-500 flex-shrink-0 text-base">&#9432;</span>
              <span>Recomendado: define primero los circuitos y despues configura los diferenciales para asignarlos facilmente.</span>
            </div>
            <div className="rounded-lg border-2 border-dashed border-surface-200 py-8 text-center">
              <p className="text-sm text-surface-500">Sin diferenciales definidos.</p>
              <p className="text-xs text-surface-400 mt-1">Carga la plantilla o añade diferenciales manualmente.</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              Añade al menos un diferencial y asigna circuitos antes de calcular.
            </div>
          </div>
        ) : (
          diffs.map((diff, idx) => {
            const diffCircuits = circuits.filter((c) => diff.circuitIds.includes(c.id));
            const sumPias = diffCircuits.reduce((sum, c) => {
              if (!c.assignedBreaker) return sum;
              const m = c.assignedBreaker.match(/(\d+)A/);
              return sum + (m && m[1] ? parseInt(m[1]) : 0);
            }, 0);

            return (
              <div
                key={idx}
                className={`rounded-lg border ${
                  diff.isProtected === false
                    ? 'border-red-500/30 bg-red-500/5'
                    : diff.isProtected === true
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-surface-200 bg-white'
                }`}
              >
                {/* Cabecera diferencial */}
                <div className="flex items-center gap-2 p-3">
                  <button
                    onClick={() => updateDiff(idx, 'expanded', !diff.expanded)}
                    className="text-surface-400 hover:text-surface-700"
                  >
                    {diff.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  {/* Nombre */}
                  <input
                    value={diff.name}
                    onChange={(e) => updateDiff(idx, 'name', e.target.value)}
                    className={`${inputCls} w-32`}
                  />

                  {/* Calibre */}
                  <select
                    value={diff.calibreA}
                    onChange={(e) => updateDiff(idx, 'calibreA', Number(e.target.value))}
                    className={`${selectCls} w-16`}
                  >
                    {DIFF_CALIBRES.map((a) => <option key={a} value={a}>{a}A</option>)}
                  </select>

                  {/* Sensibilidad */}
                  <select
                    value={diff.sensitivityMa}
                    onChange={(e) => updateDiff(idx, 'sensitivityMa', Number(e.target.value))}
                    className={`${selectCls} w-20`}
                  >
                    {SENSITIVITIES.map((s) => <option key={s} value={s}>{s}mA</option>)}
                  </select>

                  {/* Tipo */}
                  <select
                    value={diff.type}
                    onChange={(e) => updateDiff(idx, 'type', e.target.value)}
                    className={`${selectCls} w-16`}
                  >
                    {DIFF_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>

                  {/* Protección */}
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

                  {/* Info */}
                  <span className="text-[11px] text-surface-400 ml-auto">
                    {diffCircuits.length} circ. · ΣPIAs {sumPias}A
                  </span>

                  {/* Eliminar */}
                  <button
                    onClick={() => removeDiff(idx)}
                    className="rounded p-1 text-surface-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Circuitos del diferencial */}
                {diff.expanded && (
                  <div className="border-t border-surface-600 px-3 pb-3 pt-2">
                    <p className="text-[11px] text-surface-400 mb-2">Circuitos asignados (clic para asignar/desasignar):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {circuits.map((c) => {
                        const isAssigned = diff.circuitIds.includes(c.id);
                        const isOther = !isAssigned && assignedIds.has(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => !isOther && toggleCircuit(idx, c.id)}
                            disabled={isOther}
                            className={`rounded px-2 py-1 text-[11px] transition-colors ${
                              isAssigned
                                ? 'bg-blue-500/15 text-blue-700 border border-blue-500/30'
                                : isOther
                                ? 'bg-surface-50 text-surface-400 border border-surface-600 cursor-not-allowed'
                                : 'bg-surface-50 text-surface-700 border border-surface-200 hover:bg-blue-50 hover:border-blue-500/30'
                            }`}
                            title={isOther ? 'Asignado a otro diferencial' : ''}
                          >
                            {c.code ?? `#${c.order}`} — {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Circuitos sin asignar */}
        {unassigned.length > 0 && diffs.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded p-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            {unassigned.length} circuito{unassigned.length > 1 ? 's' : ''} sin diferencial asignado:
            {' '}{unassigned.map((c) => c.code ?? c.name).join(', ')}
          </div>
        )}
      </div>

      {/* ── BOTONES ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t border-surface-200 pt-4">
        <Button onClick={handleSave} disabled={saving || !anyDirty} variant="outline">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando…</>
          ) : saved ? (
            <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Guardado</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Guardar cuadro</>
          )}
        </Button>
        {anyDirty && <span className="text-xs text-amber-600">Cambios sin guardar</span>}
      </div>
    </div>
  );
}
