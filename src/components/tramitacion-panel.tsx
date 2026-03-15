'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { tramitacionApi } from '@/lib/api-client';
import type { TramitacionExpediente, TramitacionConfig } from '@/lib/types';
import {
  TRAMITACION_STATUS_LABELS,
  TRAMITACION_STEP_LABELS,
  OCA_EICI_OPTIONS,
} from '@/lib/types';
import { formatDatetime } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Send, Loader2, CheckCircle2, AlertTriangle, XCircle,
  Clock, RefreshCw, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';

interface TramitacionPanelProps {
  installationId: string;
  installationName?: string;
  hasRequiredDocs: boolean;
}

// ─── Status color helpers ──────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'QUEUED': return 'bg-blue-100 text-blue-700';
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
    case 'NEEDS_INPUT': return 'bg-amber-100 text-amber-700';
    case 'SAVED':
    case 'DOCUMENTS_UPLOADED': return 'bg-blue-100 text-blue-700';
    case 'SENT':
    case 'REGISTERED': return 'bg-emerald-100 text-emerald-700';
    case 'ERROR': return 'bg-red-100 text-red-700';
    default: return 'bg-surface-100 text-surface-600';
  }
}

function statusIcon(status: string) {
  switch (status) {
    case 'QUEUED': return <Clock className="h-4 w-4" />;
    case 'IN_PROGRESS': return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'NEEDS_INPUT': return <AlertTriangle className="h-4 w-4" />;
    case 'SENT':
    case 'REGISTERED': return <CheckCircle2 className="h-4 w-4" />;
    case 'ERROR': return <XCircle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
}

export function TramitacionPanel({
  installationId,
  installationName,
  hasRequiredDocs,
}: TramitacionPanelProps) {
  // Config
  const [config, setConfig] = useState<TramitacionConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Active expediente (polling)
  const [activeExp, setActiveExp] = useState<TramitacionExpediente | null>(null);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // All expedientes (history)
  const [expedientes, setExpedientes] = useState<TramitacionExpediente[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Tramitar modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [tramitando, setTramitando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Load config + expedientes on mount ──────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [cfg, exps] = await Promise.all([
        tramitacionApi.getConfig(),
        tramitacionApi.getExpedientes(installationId),
      ]);
      setConfig(cfg);
      setExpedientes(exps);

      // Find active expediente (most recent non-terminal)
      const active = exps.find((e) =>
        ['QUEUED', 'IN_PROGRESS', 'NEEDS_INPUT'].includes(e.status),
      );
      if (active) {
        setActiveExp(active);
        if (['QUEUED', 'IN_PROGRESS'].includes(active.status)) {
          startPolling(active.id);
        }
      }
    } catch {
      // Config not available yet — that's OK
    } finally {
      setConfigLoading(false);
    }
  }, [installationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); return () => stopPolling(); }, [loadData]);

  // ─── Polling ─────────────────────────────────────────────────────

  const startPolling = (expedienteId: string) => {
    stopPolling();
    setPolling(true);
    pollingRef.current = setInterval(async () => {
      try {
        const status = await tramitacionApi.getStatus(expedienteId);
        setActiveExp(status);
        // Stop polling on terminal states
        if (['SENT', 'REGISTERED', 'ERROR', 'NEEDS_INPUT'].includes(status.status)) {
          stopPolling();
          // Refresh history
          tramitacionApi.getExpedientes(installationId).then(setExpedientes).catch(() => {});
        }
      } catch {
        stopPolling();
      }
    }, 2500);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
  };

  // ─── Tramitar ────────────────────────────────────────────────────

  const handleTramitar = async () => {
    setShowConfirm(false);
    setTramitando(true);
    setError(null);
    try {
      const result = await tramitacionApi.tramitar(installationId);
      setActiveExp({
        id: result.expedienteId,
        status: 'QUEUED',
        progress: 0,
        currentStep: null,
      } as TramitacionExpediente);
      startPolling(result.expedienteId);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al iniciar la tramitación');
    } finally {
      setTramitando(false);
    }
  };

  // ─── Retry ───────────────────────────────────────────────────────

  const handleRetry = async () => {
    setError(null);
    setTramitando(true);
    try {
      const result = await tramitacionApi.tramitar(installationId);
      setActiveExp({
        id: result.expedienteId,
        status: 'QUEUED',
        progress: 0,
        currentStep: null,
      } as TramitacionExpediente);
      startPolling(result.expedienteId);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al reintentar');
    } finally {
      setTramitando(false);
    }
  };

  // ─── Resolve NEEDS_INPUT ─────────────────────────────────────────

  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const handleResolve = async (manualSearchTerm?: string) => {
    if (!activeExp || !activeExp.needsInputData) return;

    setError(null);
    try {
      if (manualSearchTerm) {
        // Búsqueda manual — reintentar con nuevo término
        await tramitacionApi.resolve(activeExp.id, {
          field: activeExp.needsInputData.field,
          searchTerm: manualSearchTerm,
        });
      } else {
        // Selección de candidato
        if (!selectedCandidate) return;
        const candidate = activeExp.needsInputData.candidates.find(
          (c) => c.uuid === selectedCandidate,
        );
        if (!candidate) return;
        await tramitacionApi.resolve(activeExp.id, {
          field: activeExp.needsInputData.field,
          selectedValue: candidate.uuid,
          selectedLabel: candidate.label,
        });
      }
      // Resume polling
      setActiveExp((prev) => prev ? { ...prev, status: 'QUEUED', progress: 0, needsInputData: null } as TramitacionExpediente : null);
      startPolling(activeExp.id);
      setSelectedCandidate(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al resolver');
    }
  };

  // ─── Derived state ──────────────────────────────────────────────

  const hasCredentials = config?.hasCredentials ?? false;
  const canTramitar = hasRequiredDocs && hasCredentials;
  const hasActiveExp = activeExp && ['QUEUED', 'IN_PROGRESS', 'NEEDS_INPUT'].includes(activeExp.status);
  const completedExps = expedientes.filter((e) =>
    ['SENT', 'REGISTERED', 'ERROR', 'SAVED', 'DOCUMENTS_UPLOADED'].includes(e.status),
  );

  if (configLoading) return null;

  return (
    <div className="space-y-4">
      {/* ═══ HEADER: Tramitación ASEICAM ═══ */}
      <div>
        <h3 className="text-sm font-semibold text-surface-50 mb-3 flex items-center gap-2">
          <Send className="h-4 w-4" />Tramitación ASEICAM
        </h3>

        {/* No credentials warning */}
        {!hasCredentials && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-4 py-3 flex items-start gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Credenciales no configuradas</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Configura tus credenciales del Portal del Instalador en{' '}
                <a href="/configuracion" className="underline font-medium">Configuración</a>
                {' '}antes de tramitar.
              </p>
            </div>
          </div>
        )}

        {/* No required docs warning */}
        {!hasRequiredDocs && hasCredentials && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-4 py-3 flex items-start gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-600">Genera al menos el CIE y la MTD antes de tramitar.</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-50 px-4 py-3 flex items-start gap-3 mb-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* ═══ ACTIVE EXPEDIENTE PANEL ═══ */}
      {activeExp && activeExp.status !== 'ERROR' && (
        <div className="rounded-lg border border-surface-200 bg-white p-4 space-y-3">
          {/* Status header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusIcon(activeExp.status)}
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', statusColor(activeExp.status))}>
                {TRAMITACION_STATUS_LABELS[activeExp.status] || activeExp.status}
              </span>
            </div>
            {polling && (
              <span className="text-xs text-surface-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Actualizando...
              </span>
            )}
          </div>

          {/* Step label */}
          {activeExp.currentStep && ['QUEUED', 'IN_PROGRESS'].includes(activeExp.status) && (
            <p className="text-sm text-surface-600">
              {TRAMITACION_STEP_LABELS[activeExp.currentStep] || activeExp.currentStep}
            </p>
          )}

          {/* Progress bar */}
          {['QUEUED', 'IN_PROGRESS'].includes(activeExp.status) && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${activeExp.progress}%` }}
                />
              </div>
              <p className="text-xs text-surface-400 text-right">{activeExp.progress}%</p>
            </div>
          )}

          {/* NEEDS_INPUT view */}
          {activeExp.status === 'NEEDS_INPUT' && activeExp.needsInputData && (
            <NeedsInputView
              data={activeExp.needsInputData}
              selectedCandidate={selectedCandidate}
              onSelect={setSelectedCandidate}
              onConfirm={handleResolve}
            />
          )}

          {/* SENT/REGISTERED */}
          {['SENT', 'REGISTERED'].includes(activeExp.status) && (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  {activeExp.status === 'REGISTERED' ? 'Solicitud registrada' : 'Solicitud enviada'}
                </p>
                {activeExp.portalExpediente && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    N.º expediente: <strong>{activeExp.portalExpediente}</strong>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ERROR state */}
      {activeExp?.status === 'ERROR' && (
        <div className="rounded-lg border border-red-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', statusColor('ERROR'))}>Error</span>
          </div>
          <p className="text-sm text-red-600">{activeExp.errorMessage || 'Error desconocido'}</p>
          <Button size="sm" variant="outline" onClick={handleRetry} disabled={tramitando}>
            {tramitando ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
            Reintentar
          </Button>
        </div>
      )}

      {/* ═══ TRAMITAR BUTTON ═══ */}
      {!hasActiveExp && (
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={!canTramitar || tramitando}
          className="w-full sm:w-auto"
        >
          {tramitando ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" />Tramitar en ASEICAM</>
          )}
        </Button>
      )}

      {/* ═══ CONFIRMATION MODAL ═══ */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-base font-semibold text-surface-900 mb-3">Confirmar tramitación</h3>
            <p className="text-sm text-surface-600 mb-1">
              Se va a enviar la instalación al Portal del Instalador (ASEICAM):
            </p>
            {installationName && (
              <p className="text-sm font-medium text-surface-900 mb-3">{installationName}</p>
            )}
            {config?.portalEiciName && (
              <p className="text-xs text-surface-500 mb-4">
                EICI: <strong>{config.portalEiciName}</strong>
              </p>
            )}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
              <p className="text-xs text-amber-700">
                El proceso puede tardar unos minutos. Podrás seguir su progreso en tiempo real.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleTramitar}>
                <Send className="mr-2 h-3 w-3" />Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HISTORY TABLE ═══ */}
      {completedExps.length > 0 && (
        <div>
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-surface-500 hover:text-surface-700 transition-colors"
          >
            {historyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Historial de expedientes ({completedExps.length})
          </button>

          {historyExpanded && (
            <div className="mt-2 overflow-hidden rounded-lg border border-surface-200">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 text-left text-xs text-surface-500">
                  <tr>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">EICI</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">N.º Expediente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {completedExps.map((exp) => (
                    <tr key={exp.id} className="hover:bg-surface-50">
                      <td className="px-3 py-2.5 text-surface-600">{formatDatetime(exp.createdAt)}</td>
                      <td className="px-3 py-2.5 text-surface-600">
                        {exp.eiciNombre || OCA_EICI_OPTIONS.find((o) => o.value === exp.eiciId)?.label || '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColor(exp.status))}>
                          {TRAMITACION_STATUS_LABELS[exp.status] || exp.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-surface-600 font-medium">
                        {exp.portalExpediente || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── NEEDS_INPUT sub-component ──────────────────────────────────────

function NeedsInputView({
  data,
  selectedCandidate,
  onSelect,
  onConfirm,
}: {
  data: NonNullable<TramitacionExpediente['needsInputData']>;
  selectedCandidate: string | null;
  onSelect: (uuid: string) => void;
  onConfirm: (manualSearchTerm?: string) => void;
}) {
  const [manualTerm, setManualTerm] = useState('');
  const fieldLabel = data.field === 'via' ? 'vía del emplazamiento' : 'vía del titular';
  const hasCandidates = data.candidates.length > 0;

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
        <p className="text-sm text-amber-800">
          {hasCandidates
            ? <>No se encontró coincidencia exacta para la <strong>{fieldLabel}</strong>. Selecciona la correcta:</>
            : <>No se encontraron resultados para la <strong>{fieldLabel}</strong>
              {data.searchTerm ? <> (buscado: &quot;{data.searchTerm}&quot;)</> : null}.
              Escribe el nombre de la vía para buscar de nuevo:</>
          }
        </p>
      </div>

      {hasCandidates ? (
        <>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {data.candidates.map((c) => (
              <label
                key={c.uuid}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                  selectedCandidate === c.uuid
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-surface-200 bg-white hover:border-surface-300',
                )}
              >
                <input
                  type="radio"
                  name="recono-candidate"
                  value={c.uuid}
                  checked={selectedCandidate === c.uuid}
                  onChange={() => onSelect(c.uuid)}
                  className="h-4 w-4 text-blue-600 border-surface-300 focus:ring-blue-500"
                />
                <span className="flex-1 text-sm text-surface-700">{c.label}</span>
                {c.confidence > 0 && (
                  <span className={cn(
                    'text-xs font-medium px-1.5 py-0.5 rounded',
                    c.confidence >= 80 ? 'bg-emerald-100 text-emerald-700' :
                    c.confidence >= 50 ? 'bg-amber-100 text-amber-700' :
                    'bg-surface-100 text-surface-500',
                  )}>
                    {c.confidence}%
                  </span>
                )}
              </label>
            ))}
          </div>

          <Button size="sm" onClick={() => onConfirm()} disabled={!selectedCandidate}>
            <CheckCircle2 className="mr-2 h-3 w-3" />Confirmar selección
          </Button>
        </>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={manualTerm}
            onChange={(e) => setManualTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && manualTerm.trim()) onConfirm(manualTerm.trim()); }}
            placeholder="Ej: DE LA HABANA"
            className="flex-1 rounded-lg border border-surface-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <Button size="sm" onClick={() => onConfirm(manualTerm.trim())} disabled={!manualTerm.trim()}>
            <RefreshCw className="mr-2 h-3 w-3" />Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
