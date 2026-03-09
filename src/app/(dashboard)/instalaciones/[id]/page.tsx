'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInstallation } from '@/hooks/use-installation';
import { documentsApi } from '@/lib/api-client';
import { DatosForm } from '@/components/datos-form';
import { CuadroForm } from '@/components/cuadro-form';
import { PanelForm } from '@/components/panel-form';
import { ResultadosTab } from '@/components/resultados-tab';
import { DocumentosTab } from '@/components/documentos-tab';
import { Button } from '@/components/ui/button';
import { cn, getStatusLabel, getStatusClasses, getSupplyTypeLabel } from '@/lib/utils';
import type { UpdateInstallationDto, CreateCircuitDto } from '@/lib/types';
import {
  ArrowLeft,
  Loader2,
  FileText,
  CircuitBoard,
  Calculator,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  Zap,
  FolderOpen,
  Construction,
} from 'lucide-react';

type Tab = 'datos' | 'cuadro' | 'resultados' | 'documentos';

function SupplyResultBanner({ result }: { result: any }) {
  if (!result) return null;
  const ok = result.isValid;
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
          <span className="text-surface-500 text-xs">Potencia diseño</span>
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
          <p className="font-medium">{result.differentials.length} × {result.differentials[0]?.sensitivitityMa ?? 30} mA</p>
        </div>
        <div>
          <span className="text-surface-500 text-xs">I nominal</span>
          <p className="font-medium">{result.iga.nominalCurrentA} A</p>
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

export default function InstallationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
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
    saveCircuits,
    calculate,
    calculateSupply,
    refetch,
  } = useInstallation(id);

  const [documentCount, setDocumentCount] = useState(0);
  useEffect(() => {
    if (id) { documentsApi.list(id).then(docs => setDocumentCount(docs.length)).catch(() => {}); }
  }, [id, calculation]);

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

  const handleSaveDatos = async (data: UpdateInstallationDto) => {
    await updateInstallation(data);
  };

  const handleSaveCircuits = async (dtos: CreateCircuitDto[]) => {
    await saveCircuits(dtos);
  };

  const handleCalculate = async () => {
    try {
      await Promise.all([
        calculate(),
        calculateSupply(),
      ]);
      setActiveTab('resultados');
    } catch {
      alert('Error al calcular. Revisa que los circuitos estén guardados correctamente.');
    }
  };

  const handleRecalculate = async () => {
    try {
      await Promise.all([
        calculate(),
        calculateSupply(),
      ]);
    } catch {
      alert('Error al recalcular.');
    }
  };

  const tipoDocLabel = isProyecto ? 'Proyecto' : 'MTD';

  const tabs: Array<{ id: Tab; label: string; icon: typeof FileText; badge?: string; disabled?: boolean }> = [
    { id: 'datos', label: 'Datos', icon: FileText },
    {
      id: 'cuadro',
      label: 'Cuadro eléctrico',
      icon: CircuitBoard,
      badge: circuits.length > 0 ? String(circuits.length) : undefined,
      disabled: isProyecto,
    },
    {
      id: 'resultados',
      label: 'Resultados',
      icon: Calculator,
      badge: calculation?.allCompliant ? '✓' : undefined,
      disabled: isProyecto,
    },
    { id: 'documentos', label: 'Documentos', icon: FileDown, disabled: isProyecto },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/instalaciones')}
            className="mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-surface-900">
                {installation.titularName || 'Sin titular'}
              </h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isProyecto
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-blue-50 text-blue-600'
              }`}>
                {isProyecto ? <FolderOpen className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                {tipoDocLabel}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-surface-500">
              {installation.address || 'Sin dirección'} ·{' '}
              {getSupplyTypeLabel(installation.supplyType)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {calculation?.allCompliant && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Cumple REBT
            </span>
          )}
          <span className={cn('status-badge', getStatusClasses(installation.status))}>
            {getStatusLabel(installation.status)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
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

      {/* Tab content */}
      <div>
        {activeTab === 'datos' && (
          <div className="rounded-lg border border-surface-200 bg-white p-6">
            {isProyecto ? (
              <ProyectoProximamente />
            ) : (
              <DatosForm
                installation={installation}
                isSaving={isSaving}
                onSave={handleSaveDatos}
              />
            )}
          </div>
        )}

        {activeTab === 'cuadro' && !isProyecto && (
          <div className="space-y-4">
            {supplyResult && <SupplyResultBanner result={supplyResult} />}
            <div className="rounded-lg border border-surface-200 bg-white p-6">
              <PanelForm
                installationId={id}
                circuits={circuits}
                supplyType={installation.supplyType}
              />
            </div>
            <div className="rounded-lg border border-surface-200 bg-white p-6">
              <CuadroForm
                circuits={circuits}
                supplyType={installation.supplyType}
                supplyResult={supplyResult}
                installation={installation}
                isSaving={isSaving}
                isCalculating={isCalculating}
                onSave={handleSaveCircuits}
                onCalculate={handleCalculate}
              />
            </div>
          </div>
        )}

        {activeTab === 'resultados' && !isProyecto && (
          <div className="space-y-4">
            {supplyResult && <SupplyResultBanner result={supplyResult} />}
            <div className="rounded-lg border border-surface-200 bg-white p-6">
              <ResultadosTab
                circuits={circuits}
                calculation={calculation}
                supplyResult={supplyResult}
                installation={installation}
                isCalculating={isCalculating}
                documentCount={documentCount}
                onRecalculate={handleRecalculate}
                onGoToCuadro={() => setActiveTab('cuadro')}
              />
            </div>
          </div>
        )}

        {activeTab === 'documentos' && !isProyecto && (
          <div className="rounded-lg border border-surface-200 bg-white p-6">
            <DocumentosTab
              installationId={id}
              calculation={calculation}
              installation={installation}
            />
          </div>
        )}
      </div>
    </div>
  );
}
