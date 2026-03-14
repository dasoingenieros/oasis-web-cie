'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInstallation } from '@/hooks/use-installation';
import { documentsApi, panelsApi } from '@/lib/api-client';
import { DatosForm } from '@/components/datos-form';
import type { DatosFormHandle, DatosFormState } from '@/components/datos-form';
import { CuadroForm } from '@/components/cuadro-form';
import type { CuadroFormHandle } from '@/components/cuadro-form';
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
  Zap,
  FolderOpen,
  Construction,
  Save,
  Plus,
  Trash2,
} from 'lucide-react';

type Tab = 'datos' | 'cuadro' | 'documentos';

function SupplyResultBanner({ result, panel }: { result: any; panel?: any }) {
  if (!result) return null;
  const ok = result.isValid;

  // Diferenciales: preferir los del usuario (panel) sobre los del motor
  const userDiffs = panel?.differentials;
  const hasPanelDiffs = userDiffs && userDiffs.length > 0;
  const diffDisplay = hasPanelDiffs
    ? userDiffs.map((d: any) => `${d.name} ${d.calibreA}A/${d.sensitivityMa}mA tipo ${d.type}`).join(' · ')
    : `${result.differentials.length} × ${result.differentials[0]?.sensitivityMa ?? 30} mA (sugeridos)`;

  return (
    <div className={`rounded-lg border p-4 ${ok ? 'border-emerald-500/30 bg-emerald-50' : 'border-amber-500/30 bg-amber-50'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Zap className={`h-4 w-4 ${ok ? 'text-emerald-600' : 'text-amber-600'}`} />
        <span className={`text-sm font-semibold ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
          Suministro calculado {ok ? '— cumple REBT' : '— revisar advertencias'}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-surface-500 text-xs">Potencia Máx. Admisible</span>
          <p className="font-medium">{(result.designPowerW / 1000).toFixed(2)} kW</p>
        </div>
        {result.electrificationGrade && (
          <div>
            <span className="text-surface-500 text-xs">Electrificación</span>
            <p className="font-medium">{result.electrificationGrade === 'basic' ? 'Básica' : 'Elevada'}</p>
          </div>
        )}
        <div>
          <span className="text-surface-500 text-xs">IGA</span>
          <p className="font-bold text-blue-600">{result.iga.ratingA} A</p>
        </div>
        <div>
          <span className="text-surface-500 text-xs">Sección DI</span>
          <p className="font-bold text-blue-600">{result.di.sectionMm2} mm²</p>
        </div>
        <div>
          <span className="text-surface-500 text-xs">CdT DI</span>
          <p className={`font-medium ${result.di.cdtResult.cdtCompliant ? 'text-emerald-600' : 'text-red-600'}`}>
            {result.di.cdtResult.voltageDropPct.toFixed(3)}% (lím. {result.di.cdtResult.cdtLimitPct}%)
          </p>
        </div>
        <div>
          <span className="text-surface-500 text-xs">Conductor PE</span>
          <p className="font-medium">{result.protectionConductorMm2} mm²</p>
        </div>
        <div>
          <span className="text-surface-500 text-xs">Diferenciales</span>
          <p className="font-medium text-xs">{diffDisplay}</p>
        </div>
      </div>
      {result.warnings && result.warnings.length > 0 && (
        <div className="mt-3 border-t border-surface-200 pt-2">
          {result.warnings.map((w: string, i: number) => (
            <p key={i} className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const cuadroRef = useRef<CuadroFormHandle>(null);
  const docsRef = useRef<DocumentosTabHandle>(null);

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
          {compliant && (
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
        className="sticky z-10 -mx-4 lg:-mx-6 px-3 lg:px-5 bg-surface-50/95 backdrop-blur-sm border-b border-surface-200 flex items-center gap-2 transition-[top] duration-300"
        style={{ top: zoneTop, height: ZONE_H }}
      >
        {activeTab === 'datos' && (
          <>
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
              onClick={() => datosRef.current?.save()}
              disabled={isSaving || !datosState.dirty}
              className="h-7 text-xs px-3 gap-1"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Guardar
            </Button>
          </>
        )}

        {activeTab === 'cuadro' && (
          <>
            <span className="text-xs text-surface-500">
              {circuits.length} circuito{circuits.length !== 1 ? 's' : ''} · {diffCount} dif.
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowResetModal(true)}
                disabled={circuits.length === 0 && diffCount === 0}
                className="h-7 text-xs px-3 gap-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Reiniciar Cuadro Eléctrico
              </Button>
            </div>
          </>
        )}

        {activeTab === 'documentos' && (
          <>
            <span className="text-xs text-surface-500">
              {documentCount} documento{documentCount !== 1 ? 's' : ''}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => docsRef.current?.generateMtd()}
                disabled={!calculation}
                className="h-7 text-xs px-3 gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                Generar MTD
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => docsRef.current?.generateCie()}
                disabled={!compliant}
                className="h-7 text-xs px-3 gap-1"
              >
                <FileDown className="h-3.5 w-3.5" />
                Generar CIE
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ═══ Tab Content ═══ */}
      <div className="mt-4 px-0">
        {activeTab === 'datos' && (
          <div className="rounded-lg border border-surface-200 bg-white p-6">
            {isProyecto ? (
              <ProyectoProximamente />
            ) : (
              <DatosForm
                ref={datosRef}
                installation={installation}
                isSaving={isSaving}
                onSave={handleSaveDatos}
                onStateChange={setDatosState}
              />
            )}
          </div>
        )}

        {activeTab === 'cuadro' && !isProyecto && (
          <div className="space-y-4">
            <div className="rounded-lg border border-surface-200 bg-white p-6">
              <CuadroForm
                ref={cuadroRef}
                circuits={circuits}
                supplyType={installation.supplyType}
                contractedPower={installation.contractedPower}
                supplyResult={supplyResult}
                installation={installation}
                installationId={id}
                calculation={calculation}
                isSaving={isSaving}
                isCalculating={isCalculating}
                onSave={handleSaveCircuits}
                onCalculate={handleCalculate}
              />
            </div>
          </div>
        )}

        {activeTab === 'documentos' && !isProyecto && (
          <div className="rounded-lg border border-surface-200 bg-white p-6">
            <DocumentosTab
              ref={docsRef}
              installationId={id}
              calculation={calculation}
              installation={installation}
              onDocCountChange={setDocumentCount}
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
