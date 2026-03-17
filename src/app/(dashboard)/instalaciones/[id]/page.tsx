'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInstallation } from '@/hooks/use-installation';
import { documentsApi, panelsApi } from '@/lib/api-client';
import { DatosForm } from '@/components/datos-form';
import type { DatosFormHandle, DatosFormState } from '@/components/datos-form';
import { DatosGuiadosTab } from '@/components/datos-guiados/datos-guiados-tab';
import type { DatosGuiadosHandle, DatosGuiadosState } from '@/components/datos-guiados/datos-guiados-tab';
import { CuadroForm } from '@/components/cuadro-form';
import type { CuadroFormHandle } from '@/components/cuadro-form';
import { CuadroV2Tab } from '@/components/cuadro-v2/cuadro-v2-tab';
import { InstallationDataSection } from '@/components/installation-data-section';
import { panelNodesApi } from '@/lib/api-client';
import { DocumentosTab } from '@/components/documentos-tab';
import type { DocumentosTabHandle } from '@/components/documentos-tab';
import { Button } from '@/components/ui/button';
import { useNavScroll } from '@/lib/nav-scroll-context';
import { cn, getStatusLabel, getStatusClasses, getSupplyTypeLabel } from '@/lib/utils';
import type { UpdateInstallationDto, CreateCircuitDto } from '@/lib/types';
import {
  ArrowLeft,
  Loader2,
  FileText,
  CircuitBoard,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  FolderOpen,
  Construction,
  Save,
  Trash2,
  Network,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';

type Tab = 'datos' | 'cuadro' | 'documentos';

function ProyectoProximamente() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Construction className="h-12 w-12 text-surface-400 mb-4" />
      <h2 className="text-lg font-semibold text-surface-700">Proyecto Técnico — Próximamente</h2>
      <p className="text-sm text-surface-500 mt-2 max-w-md">
        La gestión de Proyectos Técnicos estará disponible en una próxima versión de OASIS.
        De momento puedes gestionar instalaciones con Memoria Técnica de Diseño (MTD).
      </p>
    </div>
  );
}

// ─── CuadroTabContent — renders v1 or v2 based on panelVersion ───

function CuadroTabContent({
  panelVersion,
  installationId,
  installation,
  circuits,
  supplyResult,
  calculation,
  isSaving,
  isCalculating,
  cuadroRef,
  onSave,
  onCalculate,
  onRefetch,
}: {
  panelVersion: string;
  installationId: string;
  installation: any;
  circuits: any[];
  supplyResult: any;
  calculation: any;
  isSaving: boolean;
  isCalculating: boolean;
  cuadroRef: React.RefObject<CuadroFormHandle | null>;
  onSave: (dtos: any[]) => Promise<any>;
  onCalculate: () => Promise<boolean>;
  onRefetch: () => Promise<void>;
}) {
  // Vivienda uses simple panel only — no upgrade to v2
  const isVivienda = installation?.installationType === 'vivienda';
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await panelNodesApi.upgradeToV2(installationId);
      setShowUpgradeDialog(false);
      await onRefetch();
    } catch {
      alert('Error al cambiar a Cuadro Avanzado.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDowngrade = async () => {
    setIsDowngrading(true);
    try {
      await panelNodesApi.downgradeToV1(installationId);
      setShowDowngradeDialog(false);
      await onRefetch();
    } catch {
      alert('Error al volver a Cuadro Simple.');
    } finally {
      setIsDowngrading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Installation data (CGP, Modulo, DI) */}
      <InstallationDataSection installationId={installationId} installation={installation} />

      {/* Version switch button — hidden for vivienda (always simple) */}
      {!isVivienda && (panelVersion === 'v1' ? (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
          <span className="text-xs text-blue-700">
            <strong>Cuadro Simple</strong> — Formato tabla con circuitos y diferenciales
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUpgradeDialog(true)}
            className="h-7 text-xs px-3 gap-1 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <ArrowUpCircle className="h-3.5 w-3.5" />
            Cambiar a Cuadro Avanzado
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-4 py-2">
          <span className="text-xs text-purple-700">
            <strong>Cuadro Avanzado</strong> — Árbol jerárquico con subcuadros y protecciones
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDowngradeDialog(true)}
            className="h-7 text-xs px-3 gap-1 border-purple-300 text-purple-700 hover:bg-purple-100"
          >
            <ArrowDownCircle className="h-3.5 w-3.5" />
            Volver a Cuadro Simple
          </Button>
        </div>
      ))}

      {/* Render v1 or v2 */}
      {panelVersion === 'v1' ? (
        <div className="rounded-lg border border-surface-200 bg-white p-6">
          <CuadroForm
            ref={cuadroRef}
            circuits={circuits}
            supplyType={installation.supplyType}
            contractedPower={installation.contractedPower}
            supplyResult={supplyResult}
            installation={installation}
            installationId={installationId}
            calculation={calculation}
            isSaving={isSaving}
            isCalculating={isCalculating}
            onSave={onSave}
            onCalculate={onCalculate}
          />
        </div>
      ) : (
        <CuadroV2Tab installationId={installationId} />
      )}

      {/* Upgrade dialog */}
      {showUpgradeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Network className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900">Cambiar a Cuadro Avanzado</h3>
              </div>
            </div>
            <p className="text-sm text-surface-700 mb-4">
              El Cuadro Avanzado permite subcuadros, automáticos intermedios,
              guardamotores y validaciones de protección.
            </p>
            <p className="text-sm text-surface-700 mb-4">
              Se importarán los circuitos actuales al nuevo formato.
              Podrás volver al modo simple en cualquier momento.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpgradeDialog(false)}
                disabled={isUpgrading}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleUpgrade}
                disabled={isUpgrading}
              >
                {isUpgrading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowUpCircle className="h-4 w-4 mr-1" />}
                Cambiar a Avanzado
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Downgrade dialog */}
      {showDowngradeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900">Volver a Cuadro Simple</h3>
              </div>
            </div>
            <p className="text-sm text-surface-700 mb-4">
              Se eliminarán todos los datos del Cuadro Avanzado
              (subcuadros, automáticos intermedios, etc.).
            </p>
            <p className="text-sm text-red-600 font-medium mb-4">
              Los circuitos del Cuadro Simple no se modifican.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDowngradeDialog(false)}
                disabled={isDowngrading}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleDowngrade}
                disabled={isDowngrading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDowngrading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowDownCircle className="h-4 w-4 mr-1" />}
                Volver a Simple
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Height constants for sticky stack ───
const NAV_H = 56;   // h-14 = 3.5rem = 56px
const HEADER_H = 40; // compact header — original font sizes, tight padding
const TABS_H = 36;   // tabs — original text-sm + h-4 icons
const ZONE_H = 32;   // tab zone

export default function InstallationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { navHidden } = useNavScroll();
  const [activeTab, setActiveTab] = useState<Tab>('datos');

  const {
    installation,
    circuits,
    calculation,
    supplyResult,
    isLoading,
    isSaving,
    isCalculating,
    error,
    updateInstallation,
    refetchCircuits,
    calculate,
    calculateSupply,
    refetch,
  } = useInstallation(id);

  // ─── Refs for child imperative handles ───
  const datosRef = useRef<DatosFormHandle>(null);
  const datosGuiadosRef = useRef<DatosGuiadosHandle>(null);
  const cuadroRef = useRef<CuadroFormHandle>(null);
  const docsRef = useRef<DocumentosTabHandle>(null);

  // ─── Datos view mode: 'guiado' (new) vs 'completo' (legacy) ───
  const [datosView, setDatosView] = useState<'guiado' | 'completo'>('guiado');

  // ─── Datos state from callback ───
  const [datosState, setDatosState] = useState<DatosFormState>({ percent: 0, filled: 0, total: 1, dirty: false });

  // ─── Document count ───
  const [documentCount, setDocumentCount] = useState(0);
  const [calcSuccess, setCalcSuccess] = useState(false);
  useEffect(() => {
    if (id) { documentsApi.list(id).then(docs => setDocumentCount(docs.length)).catch(() => {}); }
  }, [id, calculation]);

  // ─── Panel info for cuadro zone (differential count + data for banner) ───
  const [panelData, setPanelData] = useState<any>(null);
  const diffCount = panelData?.differentials?.length ?? 0;
  useEffect(() => {
    if (id) {
      panelsApi.get(id).then(p => setPanelData(p ?? null)).catch(() => {});
    }
  }, [id, circuits]);

  // ─── REBT compliance summary for sticky bar ───
  const calcCompliance = useMemo(() => {
    if (!calculation) return null;
    const snap = calculation.resultSnapshot as any;
    const circuitResults = snap?.circuits ?? [];
    let compliant = 0, nonCompliant = 0;
    for (const cr of circuitResults) {
      if (cr?.isCompliant === true) compliant++;
      else if (cr?.isCompliant === false) nonCompliant++;
    }
    return { compliant, nonCompliant, total: circuitResults.length };
  }, [calculation]);

  // ─── Reset panel modal ───
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPanel = async () => {
    if (resetConfirmText !== 'ELIMINAR') return;
    setIsResetting(true);
    try {
      await panelsApi.reset(id);
      setShowResetModal(false);
      setResetConfirmText('');
      setPanelData(null);
      await refetch();
    } catch {
      alert('Error al reiniciar el cuadro eléctrico.');
    } finally {
      setIsResetting(false);
    }
  };

  // ─── Dynamic top offsets ───
  const navOffset = navHidden ? 0 : NAV_H;
  const headerTop = navOffset;
  const tabsTop = navOffset + HEADER_H;
  const zoneTop = navOffset + HEADER_H + TABS_H;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !installation) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-red-600">{error || 'Instalación no encontrada'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push('/instalaciones')}>
          Volver a instalaciones
        </Button>
      </div>
    );
  }

  const isProyecto = (installation as any).tipoDocumentacion === 'PROYECTO';
  const tipoDocLabel = isProyecto ? 'Proyecto' : 'MTD';

  const handleSaveDatos = async (data: UpdateInstallationDto) => {
    await updateInstallation(data);
  };

  const handleSaveCircuits = async (_dtos: CreateCircuitDto[]) => {
    // Circuits already saved atomically via panelsApi.saveAll() in CuadroForm.
    // Just refetch from server to sync parent state (don't call replaceAll which
    // would destroy the differential assignments created by saveAll).
    return await refetchCircuits();
  };

  const handleCalculate = async (): Promise<boolean> => {
    try {
      await calculate();
      await calculateSupply();
      setCalcSuccess(true);
      setTimeout(() => setCalcSuccess(false), 3000);
      return true;
    } catch {
      alert('Error al calcular. Revisa que los circuitos estén guardados correctamente.');
      return false;
    }
  };

  const panelVersion = (installation as any).panelVersion ?? 'v1';

  const tabs: Array<{ id: Tab; label: string; icon: typeof FileText; badge?: string; disabled?: boolean }> = [
    { id: 'datos', label: 'Datos', icon: FileText },
    {
      id: 'cuadro',
      label: 'Cuadro eléctrico',
      icon: CircuitBoard,
      badge: circuits.length > 0 ? String(circuits.length) : undefined,
      disabled: isProyecto,
    },
    { id: 'documentos', label: 'Documentos', icon: FileDown, disabled: isProyecto },
  ];

  const compliant = calculation?.allCompliant;

  return (
    <div className="-mt-4 lg:-mt-6">
      {/* Toast de éxito */}
      {calcSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">Cálculo completado correctamente</span>
          </div>
        </div>
      )}

      {/* ═══ Compact Header (sticky) ═══ */}
      <div
        className="sticky z-10 -mx-4 lg:-mx-6 px-3 lg:px-5 bg-white/95 backdrop-blur-sm border-b border-surface-200 flex items-center gap-2 transition-[top] duration-300"
        style={{ top: headerTop, height: HEADER_H }}
      >
        <button
          onClick={() => router.push('/instalaciones')}
          className="text-surface-400 hover:text-surface-600 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-surface-800 truncate">
          {installation.titularName || 'Sin titular'}
        </span>
        <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          isProyecto ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {isProyecto ? <FolderOpen className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
          {tipoDocLabel}
        </span>
        <span className="text-xs text-surface-400 hidden sm:inline">·</span>
        <span className="text-xs text-surface-500 truncate hidden sm:inline">
          {installation.address || 'Sin dirección'}
        </span>
        <span className="text-xs text-surface-400 hidden md:inline">·</span>
        <span className="text-xs text-surface-500 hidden md:inline">
          {getSupplyTypeLabel(installation.supplyType)}
        </span>
        {(installation as any).referencia && (
          <>
            <span className="text-xs text-surface-400 hidden lg:inline">·</span>
            <span className="text-xs text-surface-400 hidden lg:inline font-mono">
              {(installation as any).referencia}
            </span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {compliant && activeTab !== 'cuadro' && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cumple REBT</span>
            </span>
          )}
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getStatusClasses(installation.status))}>
            {getStatusLabel(installation.status)}
          </span>
        </div>
      </div>

      {/* ═══ Tabs (sticky) ═══ */}
      <div
        className="sticky z-10 -mx-4 lg:-mx-6 px-3 lg:px-5 bg-white/95 backdrop-blur-sm flex gap-1 border-b border-surface-200 transition-[top] duration-300"
        style={{ top: tabsTop, height: TABS_H }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors',
              tab.disabled
                ? 'border-transparent text-surface-400 cursor-not-allowed'
                : activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-surface-500 hover:border-surface-300 hover:text-surface-700',
            )}
            disabled={tab.disabled}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.badge && !tab.disabled && (
              <span className="ml-1 rounded-full bg-surface-100 px-1.5 py-0.5 text-2xs font-medium text-surface-700">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ Tab Zone (sticky) ═══ */}
      <div
        className="sticky z-10 -mx-4 lg:-mx-6 px-3 lg:px-5 bg-surface-50/95 backdrop-blur-sm border-b border-surface-200 transition-[top] duration-300"
        style={{ top: zoneTop, minHeight: ZONE_H }}
      >
        {activeTab === 'datos' && (
          <div className="flex items-center gap-2" style={{ height: ZONE_H }}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-24 bg-surface-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${datosState.percent === 100 ? 'bg-emerald-500' : datosState.percent > 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${datosState.percent}%` }}
                />
              </div>
              <span className={`text-xs font-medium tabular-nums ${datosState.percent === 100 ? 'text-emerald-600' : datosState.percent > 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {datosState.percent}% — {datosState.filled}/{datosState.total}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (datosView === 'guiado') datosGuiadosRef.current?.save();
                else datosRef.current?.save();
              }}
              disabled={isSaving || !datosState.dirty}
              className="h-7 text-xs px-3 gap-1"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Guardar
            </Button>
          </div>
        )}

        {activeTab === 'cuadro' && panelVersion === 'v1' && (
          <div className="py-1">
            <div className="flex items-center gap-2" style={{ minHeight: ZONE_H - 8 }}>
              <span className="text-xs text-surface-500">
                {circuits.length} circuito{circuits.length !== 1 ? 's' : ''} · {diffCount} dif.
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowResetModal(true)}
                  disabled={circuits.length === 0 && diffCount === 0}
                  className="h-7 text-xs px-2 gap-1 text-surface-400 hover:text-red-600 hover:bg-red-50"
                  title="Reiniciar Cuadro El&#233;ctrico"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => cuadroRef.current?.calculate()}
                  disabled={isCalculating}
                  className="h-7 text-xs px-3 gap-1"
                >
                  {isCalculating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calculator className="h-3 w-3" />}
                  Verificar REBT
                </Button>
              </div>
            </div>
            {/* REBT summary banner */}
            {calculation && supplyResult && calcCompliance && (
              <div className={`rounded-md px-3 py-1 mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs ${
                calcCompliance.nonCompliant === 0
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-red-50 text-red-800'
              }`}>
                {calcCompliance.nonCompliant === 0 ? (
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <span className="font-semibold">
                  {calcCompliance.nonCompliant === 0
                    ? 'Cumple REBT'
                    : `${calcCompliance.nonCompliant} circuito${calcCompliance.nonCompliant !== 1 ? 's' : ''} no cumple${calcCompliance.nonCompliant !== 1 ? 'n' : ''}`}
                </span>
                <span className="opacity-75">
                  P.Máx: {(supplyResult.designPowerW / 1000).toFixed(2)} kW · IGA: {supplyResult.iga.ratingA}A · DI: {supplyResult.di.sectionMm2}mm² (CdT {supplyResult.di.cdtResult.voltageDropPct.toFixed(2)}%) · {calcCompliance.compliant}/{calcCompliance.total} OK
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cuadro' && panelVersion === 'v2' && (
          <div className="flex items-center gap-2" style={{ height: ZONE_H }}>
            <span className="text-xs text-surface-500">Cuadro eléctrico — Vista de árbol</span>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="flex items-center gap-2" style={{ height: ZONE_H }}>
            <span className="text-xs text-surface-500">
              {documentCount} documento{documentCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ═══ Tab Content ═══ */}
      <div className="mt-4 px-0">
        {activeTab === 'datos' && (
          <>
            {isProyecto ? (
              <div className="rounded-lg border border-surface-200 bg-white p-6">
                <ProyectoProximamente />
              </div>
            ) : datosView === 'guiado' ? (
              <DatosGuiadosTab
                ref={datosGuiadosRef}
                installationId={id}
                installation={installation}
                isSaving={isSaving}
                onSave={handleSaveDatos}
                onStateChange={setDatosState}
                onShowAllFields={() => setDatosView('completo')}
              />
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setDatosView('guiado')}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  &larr; Volver a vista guiada
                </button>
                <div className="rounded-lg border border-surface-200 bg-white p-6">
                  <DatosForm
                    ref={datosRef}
                    installation={installation}
                    isSaving={isSaving}
                    onSave={handleSaveDatos}
                    onStateChange={setDatosState}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'cuadro' && !isProyecto && (
          <CuadroTabContent
            panelVersion={panelVersion}
            installationId={id}
            installation={installation}
            circuits={circuits}
            supplyResult={supplyResult}
            calculation={calculation}
            isSaving={isSaving}
            isCalculating={isCalculating}
            cuadroRef={cuadroRef}
            onSave={handleSaveCircuits}
            onCalculate={handleCalculate}
            onRefetch={refetch}
          />
        )}

        {activeTab === 'documentos' && !isProyecto && (
          <div className="rounded-lg border border-surface-200 bg-white p-6">
            <DocumentosTab
              ref={docsRef}
              installationId={id}
              calculation={calculation}
              installation={installation}
              onDocCountChange={setDocumentCount}
              onNavigateToSection={(tab, sectionNum) => {
                setActiveTab(tab as Tab);
                if (tab === 'datos' && sectionNum != null) {
                  setTimeout(() => datosRef.current?.scrollToSection(sectionNum), 200);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* ═══ Modal Reiniciar Cuadro Eléctrico ═══ */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-surface-900">Reiniciar Cuadro Eléctrico</h3>
                <p className="text-sm text-surface-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-surface-700 mb-4">
              Se eliminarán <strong>todos los circuitos y diferenciales</strong> de esta instalación.
              Los datos de la pestaña Datos (potencia, tensión, tipo instalación, etc.) se mantienen intactos.
            </p>
            <p className="text-sm text-surface-700 mb-2">
              Escribe <strong className="text-red-600">ELIMINAR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowResetModal(false); setResetConfirmText(''); }}
                disabled={isResetting}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleResetPanel}
                disabled={resetConfirmText !== 'ELIMINAR' || isResetting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Reiniciar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
