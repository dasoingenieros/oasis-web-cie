'use client';

import { useState, useCallback, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { documentsApi } from '@/lib/api-client';
import type { Document, CalculationResult } from '@/lib/types';
import { DOCUMENT_TYPE_LABELS, formatDatetime, formatFileSize } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FileText, FileDown, FilePlus2, Loader2, AlertTriangle, Clock,
  CheckCircle2, ScrollText, Zap, FileWarning, Trash2, FileSpreadsheet, FileInput,
  X,
} from 'lucide-react';
import { UnifilarEditor } from '@/components/unifilar/unifilar-editor';
import { UpgradeModal } from '@/components/upgrade-modal';
import { CertificateConfirmationModal } from '@/components/legal/certificate-confirmation-modal';
import { consentApi } from '@/lib/api-client';
import { LEGAL_VERSIONS } from '@/lib/legal-versions';

export interface DocumentosTabHandle { generateMtd: () => void; generateCie: () => void; }
interface DocumentosTabProps {
  installationId: string;
  calculation: CalculationResult | null;
  installation?: any;
  onDocCountChange?: (count: number) => void;
}

export const DocumentosTab = forwardRef<DocumentosTabHandle, DocumentosTabProps>(function DocumentosTab({ installationId, calculation, installation, onDocCountChange }, ref) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Unifilar modal state ──
  const [showUnifilar, setShowUnifilar] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // ── Legal: responsibility checkbox + confirmation modal ──
  const [acceptedResponsibility, setAcceptedResponsibility] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  /** Check if error is a cert limit error and show upgrade modal */
  const isCertLimitError = (err: any): boolean => {
    const data = err?.response?.data;
    if (data?.code === 'CERT_LIMIT_REACHED' || data?.code === 'CIE_LIMIT_REACHED' || (err?.response?.status === 403 && typeof data?.message === 'string' && data.message.toLowerCase().includes('límite'))) {
      setShowUpgrade(true);
      return true;
    }
    return false;
  };

  const hasCalculation = !!calculation;
  const isCompliant = calculation?.allCompliant === true;

  const fetchDocuments = useCallback(async () => {
    try { setLoading(true); const docs = await documentsApi.list(installationId); setDocuments(docs); }
    catch { setDocuments([]); }
    finally { setLoading(false); }
  }, [installationId]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // Notify parent of doc count changes
  useEffect(() => { onDocCountChange?.(documents.length); }, [documents.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // MTD
  const handleGenerate = async (type: 'MEMORIA_TECNICA' | 'UNIFILAR') => {
    setGenerating(type); setError(null);
    try { const doc = await documentsApi.generate(installationId, type); setDocuments((prev) => [doc, ...prev]); }
    catch (err: any) { if (!isCertLimitError(err)) setError(err?.response?.data?.message || 'Error al generar el documento'); }
    finally { setGenerating(null); }
  };

  // CIE
  const handleGenerateCie = async (format: 'xls' | 'pdf') => {
    const key = `CERTIFICADO_${format}`; setGenerating(key); setError(null);
    try {
      const { blob, filename } = await documentsApi.generateCie(installationId, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url;
      link.download = filename;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      await fetchDocuments();
    } catch (err: any) { if (!isCertLimitError(err)) setError(err?.response?.data?.message || 'Error al generar el CIE'); }
    finally { setGenerating(null); }
  };

  // Solicitud BT
  const handleGenerateSolicitud = async (format: 'docx' | 'pdf') => {
    const key = `SOLICITUD_${format}`; setGenerating(key); setError(null);
    try {
      const blob = await documentsApi.generateSolicitud(installationId, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url;
      link.download = `SOLICITUD_BT_${installationId.slice(0, 8)}.${format}`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      await fetchDocuments();
    } catch (err: any) { if (!isCertLimitError(err)) setError(err?.response?.data?.message || 'Error al generar la Solicitud BT'); }
    finally { setGenerating(null); }
  };

  /** Wrap CIE/Solicitud generation with confirmation modal */
  const requestCieGeneration = (format: 'xls' | 'pdf') => {
    if (!acceptedResponsibility) {
      setError('Debes aceptar la declaración de responsabilidad antes de generar documentos oficiales.');
      return;
    }
    setConfirmAction(() => async () => {
      try {
        await consentApi.log({ consentType: 'certificate_responsibility', documentVersion: LEGAL_VERSIONS.TOS, accepted: true, method: 'certificate_modal', certificateId: installationId });
      } catch { /* ignore */ }
      await handleGenerateCie(format);
    });
  };

  const requestSolicitudGeneration = (format: 'docx' | 'pdf') => {
    if (!acceptedResponsibility) {
      setError('Debes aceptar la declaración de responsabilidad antes de generar documentos oficiales.');
      return;
    }
    setConfirmAction(() => async () => {
      try {
        await consentApi.log({ consentType: 'certificate_responsibility', documentVersion: LEGAL_VERSIONS.TOS, accepted: true, method: 'certificate_modal', certificateId: installationId });
      } catch { /* ignore */ }
      await handleGenerateSolicitud(format);
    });
  };

  // Expose generate methods via ref
  const generateMtdFn = useRef(() => handleGenerate('MEMORIA_TECNICA'));
  generateMtdFn.current = () => handleGenerate('MEMORIA_TECNICA');
  const generateCieFn = useRef(() => requestCieGeneration('pdf'));
  generateCieFn.current = () => requestCieGeneration('pdf');
  useImperativeHandle(ref, () => ({
    generateMtd: () => generateMtdFn.current(),
    generateCie: () => generateCieFn.current(),
  }), []);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try { await confirmAction(); } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await documentsApi.download(installationId, doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url;
      link.download = doc.filename || `${doc.type}.pdf`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch { setError('Error al descargar el documento'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== 'ELIMINAR') return;
    setDeleting(true);
    try {
      await documentsApi.remove(installationId, deleteTarget.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null); setDeleteConfirm('');
    } catch { setError('Error al eliminar el documento'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Avisos */}
      {!loading && documents.length > 0 && hasCalculation && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300">Documentos emitidos ({documents.length})</p>
            <p className="text-xs text-blue-600 mt-0.5">Si recalculas o modificas datos, los nuevos documentos se generarán como nueva versión. Los documentos anteriores se mantendrán en el histórico.</p>
          </div>
        </div>
      )}
      {!hasCalculation && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Cálculo requerido</p>
            <p className="text-xs text-amber-600 mt-0.5">Para generar documentos, primero ejecuta el cálculo en la pestaña &quot;Cuadro eléctrico&quot;.</p>
          </div>
        </div>
      )}
      {hasCalculation && !isCompliant && (
        <div className="rounded-lg border border-red-500/30 bg-red-50 px-4 py-3 flex items-start gap-3">
          <FileWarning className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">Circuitos no conformes</p>
            <p className="text-xs text-red-600 mt-0.5">Puedes generar la MTD para revisión, pero el CIE y la Solicitud solo estarán disponibles cuando todos los circuitos cumplan.</p>
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Responsibility checkbox for official documents */}
      {hasCalculation && isCompliant && (
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-surface-200 bg-white p-4">
          <input
            type="checkbox"
            checked={acceptedResponsibility}
            onChange={(e) => setAcceptedResponsibility(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-600"
          />
          <span className="text-sm text-surface-600 leading-relaxed">
            Declaro que he verificado todos los datos y cálculos de esta instalación. Como técnico firmante, asumo la responsabilidad sobre el contenido de los documentos oficiales generados.
          </span>
        </label>
      )}

      {/* Generar documentos — 4 cards */}
      <div>
        <h3 className="text-sm font-semibold text-surface-50 mb-3 flex items-center gap-2">
          <FilePlus2 className="h-4 w-4" />Generar documentos
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* MTD */}
          <div className={cn('relative rounded-lg border p-4 flex flex-col gap-3', hasCalculation ? 'border-surface-200 bg-white hover:border-brand-500/50 transition-colors' : 'border-surface-200 bg-surface-50/50 opacity-60')}>
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2', hasCalculation ? 'bg-brand-50 text-brand-600' : 'bg-surface-100 text-surface-400')}><ScrollText className="h-5 w-5" /></div>
              <p className="text-sm font-semibold text-surface-700">Memoria Técnica</p>
            </div>
            <p className="text-xs text-surface-500 leading-relaxed">MTD oficial con cálculos y protecciones.</p>
            <Button size="sm" className="w-full mt-auto" disabled={!hasCalculation || generating === 'MEMORIA_TECNICA'} onClick={() => handleGenerate('MEMORIA_TECNICA')}>
              {generating === 'MEMORIA_TECNICA' ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Generando...</> : <><FilePlus2 className="mr-2 h-3 w-3" />Generar PDF</>}
            </Button>
          </div>

          {/* CIE */}
          <div className={cn('relative rounded-lg border p-4 flex flex-col gap-3', hasCalculation && isCompliant ? 'border-surface-200 bg-white hover:border-brand-500/50 transition-colors' : 'border-surface-200 bg-surface-50/50 opacity-60')}>
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2', hasCalculation && isCompliant ? 'bg-brand-50 text-brand-600' : 'bg-surface-100 text-surface-400')}><FileText className="h-5 w-5" /></div>
              <p className="text-sm font-semibold text-surface-700">Certificado (CIE)</p>
            </div>
            <p className="text-xs text-surface-500 leading-relaxed">CIE/BRIE oficial para tramitación.</p>
            {hasCalculation && !isCompliant && <p className="text-xs text-amber-600">⚠ Requiere cumplimiento REBT</p>}
            <div className="flex gap-2 mt-auto">
              <Button size="sm" variant="outline" className="flex-1" disabled={!hasCalculation || !isCompliant || generating?.startsWith('CERTIFICADO')} onClick={() => requestCieGeneration('xls')}>
                {generating === 'CERTIFICADO_xls' ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileSpreadsheet className="mr-1 h-3 w-3" />Excel</>}
              </Button>
              <Button size="sm" className="flex-1" disabled={!hasCalculation || !isCompliant || generating?.startsWith('CERTIFICADO')} onClick={() => requestCieGeneration('pdf')}>
                {generating === 'CERTIFICADO_pdf' ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileText className="mr-1 h-3 w-3" />PDF</>}
              </Button>
            </div>
          </div>

          {/* Solicitud BT */}
          <div className={cn('relative rounded-lg border p-4 flex flex-col gap-3', hasCalculation && isCompliant ? 'border-surface-200 bg-white hover:border-brand-500/50 transition-colors' : 'border-surface-200 bg-surface-50/50 opacity-60')}>
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2', hasCalculation && isCompliant ? 'bg-brand-50 text-brand-600' : 'bg-surface-100 text-surface-400')}><FileInput className="h-5 w-5" /></div>
              <p className="text-sm font-semibold text-surface-700">Solicitud BT</p>
            </div>
            <p className="text-xs text-surface-500 leading-relaxed">Solicitud oficial para la DGTEyEC.</p>
            {hasCalculation && !isCompliant && <p className="text-xs text-amber-600">⚠ Requiere cumplimiento REBT</p>}
            <div className="flex gap-2 mt-auto">
              <Button size="sm" variant="outline" className="flex-1" disabled={!hasCalculation || !isCompliant || generating?.startsWith('SOLICITUD')} onClick={() => requestSolicitudGeneration('docx')}>
                {generating === 'SOLICITUD_docx' ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileText className="mr-1 h-3 w-3" />Word</>}
              </Button>
              <Button size="sm" className="flex-1" disabled={!hasCalculation || !isCompliant || generating?.startsWith('SOLICITUD')} onClick={() => requestSolicitudGeneration('pdf')}>
                {generating === 'SOLICITUD_pdf' ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileText className="mr-1 h-3 w-3" />PDF</>}
              </Button>
            </div>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* UNIFILAR — AHORA ACTIVO                         */}
          {/* ════════════════════════════════════════════════ */}
          <div className={cn(
            'relative rounded-lg border p-4 flex flex-col gap-3',
            hasCalculation
              ? 'border-surface-200 bg-white hover:border-brand-500/50 transition-colors'
              : 'border-surface-200 bg-surface-50/50 opacity-60',
          )}>
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg p-2', hasCalculation ? 'bg-brand-50 text-brand-600' : 'bg-surface-100 text-surface-400')}>
                <Zap className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-surface-700">Esquema Unifilar</p>
            </div>
            <p className="text-xs text-surface-500 leading-relaxed">Esquema eléctrico unifilar. Editable y exportable a DXF (AutoCAD), SVG y PNG.</p>
            <Button
              size="sm"
              className="w-full mt-auto"
              disabled={!hasCalculation}
              onClick={() => setShowUnifilar(true)}
            >
              <Zap className="mr-2 h-3 w-3" />
              Generar
            </Button>
          </div>
        </div>
      </div>

      {/* Documentos generados */}
      <div>
        <h3 className="text-sm font-semibold text-surface-50 mb-3 flex items-center gap-2">
          <FileDown className="h-4 w-4" />Documentos generados
          {documents.length > 0 && <span className="ml-1 rounded-full bg-surface-100 px-1.5 py-0.5 text-2xs font-medium text-surface-700">{documents.length}</span>}
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-surface-400" /></div>
        ) : documents.length === 0 ? (
          <div className="text-center py-10 rounded-lg border border-dashed border-surface-200">
            <FileText className="h-8 w-8 text-surface-400 mx-auto mb-2" />
            <p className="text-xs text-surface-400">Aún no se han generado documentos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 rounded-lg border border-surface-200 bg-white p-3 hover:bg-surface-50 transition-colors">
                <div className="flex-shrink-0 rounded-lg bg-surface-100 p-2">
                  {doc.type === 'MEMORIA_TECNICA' ? <ScrollText className="h-5 w-5 text-surface-500" /> :
                   doc.type === 'CERTIFICADO' ? <FileText className="h-5 w-5 text-surface-500" /> :
                   doc.type === 'SOLICITUD' ? <FileInput className="h-5 w-5 text-surface-500" /> :
                   <Zap className="h-5 w-5 text-surface-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-700 truncate">
                    {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                    {doc.version && doc.version > 1 && <span className="ml-1.5 text-xs text-amber-600 font-medium">v{doc.version}</span>}
                    {doc.mimeType?.includes('ms-excel') && <span className="ml-1.5 text-xs text-surface-400 font-normal">.xls</span>}
                    {doc.mimeType?.includes('wordprocessingml') && <span className="ml-1.5 text-xs text-surface-400 font-normal">.docx</span>}
                    {doc.mimeType === 'application/pdf' && doc.type !== 'MEMORIA_TECNICA' && <span className="ml-1.5 text-xs text-surface-400 font-normal">.pdf</span>}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-surface-400 flex items-center gap-1"><Clock className="h-3 w-3" />{formatDatetime(doc.generatedAt)}</span>
                    {doc.sizeBytes && <span className="text-xs text-surface-400">{formatFileSize(doc.sizeBytes)}</span>}
                  </div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}><FileDown className="mr-1 h-3 w-3" />Descargar</Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-300 hover:bg-red-50" onClick={() => { setDeleteTarget(doc); setDeleteConfirm(''); }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-sm font-semibold text-surface-50 mb-2">Eliminar documento</h3>
              <p className="text-xs text-surface-700 mb-1">¿Seguro que quieres eliminar <strong>{DOCUMENT_TYPE_LABELS[deleteTarget.type] || deleteTarget.type}</strong>?</p>
              <p className="text-xs text-surface-500 mb-3">Escribe <strong>ELIMINAR</strong> para confirmar:</p>
              <input className="w-full h-9 rounded-md border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="ELIMINAR" autoFocus />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setDeleteTarget(null); setDeleteConfirm(''); }}>Cancelar</Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" disabled={deleteConfirm !== 'ELIMINAR' || deleting} onClick={handleDelete}>
                  {deleting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* UNIFILAR EDITOR — Fullscreen Modal                      */}
      {/* ════════════════════════════════════════════════════════ */}
      {showUnifilar && (
        <div className="fixed inset-0 z-[100] bg-[#08090d]">
          <UnifilarEditor installationId={installationId} onClose={() => setShowUnifilar(false)} installationData={installation} />
        </div>
      )}

      {/* Upgrade modal — shown when CIE limit reached */}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {/* Certificate confirmation modal */}
      <CertificateConfirmationModal
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        onConfirm={handleConfirm}
        loading={confirmLoading}
      />
    </div>
  );
});
