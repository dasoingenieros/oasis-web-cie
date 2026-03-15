'use client';

import { useState, useCallback, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { documentsApi } from '@/lib/api-client';
import type { Document, CalculationResult, ReviewStatus } from '@/lib/types';
import { DOCUMENT_TYPE_LABELS, REVIEW_STATUS_LABELS, formatDatetime } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FileText, FileDown, Loader2, AlertTriangle,
  CheckCircle2, ScrollText, Zap, FileWarning, Trash2, FileSpreadsheet, FileInput,
  Upload, Eye, RefreshCw, X, Search, MessageSquareWarning, ArrowRight, ChevronRight,
} from 'lucide-react';
import { UnifilarEditor } from '@/components/unifilar/unifilar-editor';
import { UpgradeModal } from '@/components/upgrade-modal';
import { CertificateConfirmationModal } from '@/components/legal/certificate-confirmation-modal';
import { TramitacionPanel } from '@/components/tramitacion-panel';
import { consentApi } from '@/lib/api-client';
import { LEGAL_VERSIONS } from '@/lib/legal-versions';

export interface DocumentosTabHandle { generateMtd: () => void; generateCie: () => void; }
interface DocumentosTabProps {
  installationId: string;
  calculation: CalculationResult | null;
  installation?: any;
  onDocCountChange?: (count: number) => void;
  onNavigateToSection?: (tab: string, sectionNum?: number) => void;
}

const DOC_TYPES = ['CERTIFICADO', 'MEMORIA_TECNICA', 'SOLICITUD', 'UNIFILAR'] as const;
type DocType = typeof DOC_TYPES[number];

const DOC_TYPE_LABELS_SHORT: Record<DocType, string> = {
  CERTIFICADO: 'CIE',
  MEMORIA_TECNICA: 'Memoria Técnica',
  SOLICITUD: 'Solicitud BT',
  UNIFILAR: 'Esquema Unifilar',
};

const DOC_TYPE_ICONS: Record<DocType, typeof FileText> = {
  CERTIFICADO: FileText,
  MEMORIA_TECNICA: ScrollText,
  SOLICITUD: FileInput,
  UNIFILAR: Zap,
};

const SECTION_LABELS: Record<number, string> = {
  1: 'Autor de la Memoria',
  2: 'Datos del Titular',
  3: 'Emplazamiento de la Instalación',
  4: 'Datos Técnicos',
  5: 'Acometida',
  6: 'C.G.P. o C/C de Seguridad',
  7: 'L.G.A. y Derivación Individual',
  8: 'Módulo de Medida',
  9: 'Protecciones',
  10: 'Puesta a Tierra y Verificaciones',
  11: 'Empresa Instaladora',
  12: 'Empresa Distribuidora',
  13: 'Certificación (CIE)',
  14: 'Presupuesto',
  15: 'Información Adicional y Memoria',
};

export const DocumentosTab = forwardRef<DocumentosTabHandle, DocumentosTabProps>(function DocumentosTab({ installationId, calculation, installation, onDocCountChange, onNavigateToSection }, ref) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Upload signed state ──
  const [uploadTarget, setUploadTarget] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSignerName, setUploadSignerName] = useState('');

  // ── Unifilar modal state ──
  const [showUnifilar, setShowUnifilar] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // ── Legal: responsibility checkbox + confirmation modal ──
  const [acceptedResponsibility, setAcceptedResponsibility] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Preview state ──
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // ── Section picker state ──
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [sectionPickerDoc, setSectionPickerDoc] = useState<Document | null>(null);

  // ── Report modal state ──
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDoc, setReportDoc] = useState<Document | null>(null);
  const [reportDescription, setReportDescription] = useState('');
  const [reportScreenshot, setReportScreenshot] = useState<File | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  // ── Toast state ──
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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
  useEffect(() => { onDocCountChange?.(documents.length); }, [documents.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => { if (previewBlobUrl) window.URL.revokeObjectURL(previewBlobUrl); };
  }, [previewBlobUrl]);

  // ── Helper: get latest doc per type ──
  const getLatestDoc = useCallback((type: DocType): Document | undefined => {
    return documents
      .filter((d) => d.type === type)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];
  }, [documents]);

  // ── Signed count for progress bar ──
  const signedCount = DOC_TYPES.reduce((n, t) => {
    const doc = getLatestDoc(t);
    return n + (doc?.signedAt ? 1 : 0);
  }, 0);

  // ── Open preview for a document ──
  const openPreview = async (doc: Document) => {
    setLoadingPreview(true);
    setPreviewDoc(doc);
    try {
      const blob = await documentsApi.preview(installationId, doc.id);
      if (previewBlobUrl) window.URL.revokeObjectURL(previewBlobUrl);
      const url = window.URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch {
      setError('Error al cargar la vista previa');
      setPreviewDoc(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewBlobUrl) window.URL.revokeObjectURL(previewBlobUrl);
    setPreviewDoc(null);
    setPreviewBlobUrl(null);
  };

  // ── Approve document ──
  const handleApprove = async (doc: Document) => {
    try {
      const updated = await documentsApi.approve(installationId, doc.id);
      setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
      // Trigger download after approval
      const blob = await documentsApi.download(installationId, doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url;
      link.download = doc.filename || `${doc.type}.pdf`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      closePreview();
      showToast('Documento aprobado y descargado para firmar');
    } catch { setError('Error al aprobar el documento'); }
  };

  // ── Mark as needs review ──
  const handleNeedsReview = (doc: Document) => {
    setSectionPickerDoc(doc);
    setShowSectionPicker(true);
  };

  const handleSelectSection = async (sectionNum: number) => {
    if (!sectionPickerDoc) return;
    try {
      const updated = await documentsApi.updateReviewStatus(
        installationId, sectionPickerDoc.id, 'NEEDS_REVIEW', `section:${sectionNum}`,
      );
      setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
      setShowSectionPicker(false);
      setSectionPickerDoc(null);
      closePreview();
      // Navigate to datos tab, scroll to section
      onNavigateToSection?.('datos', sectionNum);
    } catch { setError('Error al marcar el documento para revisión'); }
  };

  // ── Report format error ──
  const handleOpenReport = (doc: Document) => {
    setReportDoc(doc);
    setReportDescription('');
    setReportScreenshot(null);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportDoc || !reportDescription.trim()) return;
    setSubmittingReport(true);
    try {
      await documentsApi.report(installationId, reportDoc.id, reportDescription, reportScreenshot || undefined);
      await fetchDocuments();
      setShowReportModal(false);
      setReportDoc(null);
      closePreview();
      showToast('Reporte enviado');
    } catch { setError('Error al enviar el reporte'); }
    finally { setSubmittingReport(false); }
  };

  // MTD — now auto-opens preview
  const handleGenerate = async (type: 'MEMORIA_TECNICA' | 'UNIFILAR') => {
    setGenerating(type); setError(null);
    try {
      const doc = await documentsApi.generate(installationId, type);
      setDocuments((prev) => [doc, ...prev]);
      // Auto-open preview for MTD
      if (type === 'MEMORIA_TECNICA') {
        openPreview(doc);
      }
    }
    catch (err: any) { if (!isCertLimitError(err)) setError(err?.response?.data?.message || 'Error al generar el documento'); }
    finally { setGenerating(null); }
  };

  // CIE — now auto-opens preview instead of auto-download
  const handleGenerateCie = async (format: 'xls' | 'pdf') => {
    const key = `CERTIFICADO_${format}`; setGenerating(key); setError(null);
    try {
      const { blob, filename } = await documentsApi.generateCie(installationId, format);
      await fetchDocuments();
      // If PDF, open preview of the newly generated doc
      if (format === 'pdf') {
        // Refresh docs list then open preview of the latest CIE
        const docs = await documentsApi.list(installationId);
        setDocuments(docs);
        const latestCie = docs
          .filter(d => d.type === 'CERTIFICADO')
          .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];
        if (latestCie) openPreview(latestCie);
      } else {
        // XLS: direct download (can't preview)
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url;
        link.download = filename;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err: any) { if (!isCertLimitError(err)) setError(err?.response?.data?.message || 'Error al generar el CIE'); }
    finally { setGenerating(null); }
  };

  // Solicitud BT — auto-opens preview for PDF
  const handleGenerateSolicitud = async (format: 'docx' | 'pdf') => {
    const key = `SOLICITUD_${format}`; setGenerating(key); setError(null);
    try {
      const blob = await documentsApi.generateSolicitud(installationId, format);
      await fetchDocuments();
      if (format === 'pdf') {
        const docs = await documentsApi.list(installationId);
        setDocuments(docs);
        const latestSol = docs
          .filter(d => d.type === 'SOLICITUD')
          .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0];
        if (latestSol) openPreview(latestSol);
      } else {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url;
        link.download = `SOLICITUD_BT_${installationId.slice(0, 8)}.${format}`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err: any) { if (!isCertLimitError(err)) setError(err?.response?.data?.message || 'Error al generar la Solicitud BT'); }
    finally { setGenerating(null); }
  };

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

  const handleDownloadSigned = async (doc: Document) => {
    try {
      const blob = await documentsApi.downloadSigned(installationId, doc.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url;
      link.download = doc.filename.replace(/\.\w+$/, '_firmado.pdf');
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch { setError('Error al descargar el documento firmado'); }
  };

  const handleUploadSigned = async () => {
    if (!uploadTarget || !uploadFile) return;
    setUploading(true); setError(null);
    try {
      const updated = await documentsApi.uploadSigned(
        installationId, uploadTarget.id, uploadFile, uploadSignerName || undefined,
      );
      setDocuments((prev) => prev.map((d) => d.id === updated.id ? updated : d));
      setUploadTarget(null); setUploadFile(null); setUploadSignerName('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al subir el documento firmado');
    } finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirm !== 'ELIMINAR') return;
    setDeleting(true);
    try {
      await documentsApi.remove(installationId, deleteTarget.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null); setDeleteConfirm('');
      if (previewDoc?.id === deleteTarget.id) closePreview();
    } catch { setError('Error al eliminar el documento'); }
    finally { setDeleting(false); }
  };

  // ── Generate action per type ──
  const handleGenerateForType = (type: DocType) => {
    switch (type) {
      case 'CERTIFICADO': requestCieGeneration('pdf'); break;
      case 'MEMORIA_TECNICA': handleGenerate('MEMORIA_TECNICA'); break;
      case 'SOLICITUD': requestSolicitudGeneration('pdf'); break;
      case 'UNIFILAR': setShowUnifilar(true); break;
    }
  };

  // Can generate this type?
  const canGenerate = (type: DocType): boolean => {
    if (!hasCalculation) return false;
    if (type === 'CERTIFICADO' || type === 'SOLICITUD') return isCompliant;
    return true;
  };

  // Is currently generating this type?
  const isGenerating = (type: DocType): boolean => {
    if (!generating) return false;
    if (type === 'CERTIFICADO') return generating.startsWith('CERTIFICADO');
    if (type === 'SOLICITUD') return generating.startsWith('SOLICITUD');
    return generating === type;
  };

  // ── Row status logic (extended with review statuses) ──
  type RowStatus = 'none' | 'pending_review' | 'approved' | 'needs_review' | 'reported' | 'signed';
  const getRowStatus = (type: DocType): { status: RowStatus; doc?: Document } => {
    const doc = getLatestDoc(type);
    if (!doc) return { status: 'none' };
    if (doc.signedAt) return { status: 'signed', doc };
    const rs = (doc.reviewStatus || 'PENDING') as ReviewStatus;
    if (rs === 'APPROVED') return { status: 'approved', doc };
    if (rs === 'NEEDS_REVIEW') return { status: 'needs_review', doc };
    if (rs === 'REPORTED') return { status: 'reported', doc };
    return { status: 'pending_review', doc };
  };

  // ── Navigate to fix section from NEEDS_REVIEW doc ──
  const handleGoToFix = (doc: Document) => {
    const note = doc.reviewNote || '';
    const match = note.match(/section:(\d+)/);
    const sectionNum = match ? parseInt(match[1], 10) : undefined;
    onNavigateToSection?.('datos', sectionNum);
  };

  // ── Regenerate document (resets status to PENDING) ──
  const handleRegenerate = (type: DocType) => {
    handleGenerateForType(type);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">{toast}</span>
          </div>
        </div>
      )}

      {/* Avisos */}
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
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
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

      {/* ── Progress bar: Firmados X/4 ── */}
      {documents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-surface-700">Firmados: {signedCount}/4</span>
            {signedCount === 4 && (
              <span className="text-xs font-medium text-emerald-600">Listo para tramitar</span>
            )}
          </div>
          <div className="w-full bg-surface-100 rounded-full h-2">
            <div
              className={cn('h-2 rounded-full transition-all duration-500', signedCount === 4 ? 'bg-emerald-500' : 'bg-brand-500')}
              style={{ width: `${(signedCount / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* All-signed banner */}
      {signedCount === 4 && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-700">Todos los documentos firmados. Listo para tramitar.</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           PREVIEW PANEL — Shows when a document is being reviewed
         ══════════════════════════════════════════════════════════════ */}
      {previewDoc && (
        <div className="rounded-lg border border-surface-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-surface-50 border-b border-surface-200">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-surface-500" />
              <span className="text-sm font-semibold text-surface-700">
                Vista previa: {DOC_TYPE_LABELS_SHORT[previewDoc.type as DocType] || previewDoc.type}
              </span>
            </div>
            <button onClick={closePreview} className="text-surface-400 hover:text-surface-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Document viewer */}
          <div className="bg-surface-100">
            {loadingPreview ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-surface-400" />
              </div>
            ) : previewBlobUrl && (
              previewDoc.mimeType === 'image/svg+xml' ? (
                <div className="flex justify-center p-4">
                  <img src={previewBlobUrl} alt="Unifilar" className="max-w-full max-h-[600px]" />
                </div>
              ) : (
                <iframe
                  src={previewBlobUrl}
                  className="w-full h-[600px] border-0"
                  title="Vista previa del documento"
                />
              )
            )}
          </div>

          {/* Action buttons */}
          <div className="px-4 py-4 border-t border-surface-200 flex flex-wrap gap-3">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleApprove(previewDoc)}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Correcto, descargar para firmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-400 text-amber-700 hover:bg-amber-50"
              onClick={() => handleNeedsReview(previewDoc)}
            >
              <Search className="mr-1.5 h-4 w-4" />
              Datos incorrectos, revisar datos
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-surface-600"
              onClick={() => handleOpenReport(previewDoc)}
            >
              <MessageSquareWarning className="mr-1.5 h-4 w-4" />
              Error de formato, reportar
            </Button>
          </div>
        </div>
      )}

      {/* ── Document status table ── */}
      <div>
        <h3 className="text-sm font-semibold text-surface-50 mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />Estado de documentos
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-surface-400" /></div>
        ) : (
          <div className="rounded-lg border border-surface-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 text-left">
                  <th className="px-4 py-2.5 font-medium text-surface-500">Documento</th>
                  <th className="px-4 py-2.5 font-medium text-surface-500">Estado</th>
                  <th className="px-4 py-2.5 font-medium text-surface-500 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {DOC_TYPES.map((type) => {
                  const { status, doc } = getRowStatus(type);
                  const Icon = DOC_TYPE_ICONS[type];
                  return (
                    <tr key={type} className="bg-white hover:bg-surface-50/50 transition-colors">
                      {/* Documento */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn('rounded-lg p-1.5', doc ? 'bg-brand-50 text-brand-600' : 'bg-surface-100 text-surface-400')}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-surface-700">{DOC_TYPE_LABELS_SHORT[type]}</p>
                            {doc && (
                              <p className="text-xs text-surface-400 mt-0.5">{formatDatetime(doc.generatedAt)}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        {status === 'none' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-500">
                            No generado
                          </span>
                        )}
                        {status === 'pending_review' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            Pendiente revisión
                          </span>
                        )}
                        {status === 'approved' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            Pendiente firma
                          </span>
                        )}
                        {status === 'needs_review' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                            <AlertTriangle className="h-3 w-3" />
                            Datos incorrectos
                          </span>
                        )}
                        {status === 'reported' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            <MessageSquareWarning className="h-3 w-3" />
                            Error reportado
                          </span>
                        )}
                        {status === 'signed' && doc && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Firmado {formatDatetime(doc.signedAt!)}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end flex-wrap">
                          {/* No generado → Generar */}
                          {status === 'none' && (
                            <>
                              {type === 'CERTIFICADO' ? (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" disabled={!canGenerate(type) || isGenerating(type)} onClick={() => requestCieGeneration('xls')}>
                                    {generating === 'CERTIFICADO_xls' ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileSpreadsheet className="mr-1 h-3 w-3" />Excel</>}
                                  </Button>
                                  <Button size="sm" disabled={!canGenerate(type) || isGenerating(type)} onClick={() => requestCieGeneration('pdf')}>
                                    {generating === 'CERTIFICADO_pdf' ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileText className="mr-1 h-3 w-3" />PDF</>}
                                  </Button>
                                </div>
                              ) : type === 'SOLICITUD' ? (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" disabled={!canGenerate(type) || isGenerating(type)} onClick={() => requestSolicitudGeneration('docx')}>
                                    {generating === 'SOLICITUD_docx' ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileText className="mr-1 h-3 w-3" />Word</>}
                                  </Button>
                                  <Button size="sm" disabled={!canGenerate(type) || isGenerating(type)} onClick={() => requestSolicitudGeneration('pdf')}>
                                    {generating === 'SOLICITUD_pdf' ? <Loader2 className="h-3 w-3 animate-spin" /> : <><FileText className="mr-1 h-3 w-3" />PDF</>}
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" disabled={!canGenerate(type) || isGenerating(type)} onClick={() => handleGenerateForType(type)}>
                                  {isGenerating(type) ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                                  Generar
                                </Button>
                              )}
                            </>
                          )}

                          {/* Pendiente revisión → Revisar */}
                          {status === 'pending_review' && doc && (
                            <>
                              <Button size="sm" onClick={() => openPreview(doc)}>
                                <Eye className="mr-1 h-3 w-3" />Revisar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                                <FileDown className="mr-1 h-3 w-3" />Descargar
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-500 hover:text-red-300 hover:bg-red-50" onClick={() => { setDeleteTarget(doc); setDeleteConfirm(''); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}

                          {/* Aprobado, pendiente firma → Descargar + Subir firmado */}
                          {status === 'approved' && doc && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                                <FileDown className="mr-1 h-3 w-3" />Descargar
                              </Button>
                              <Button size="sm" onClick={() => { setUploadTarget(doc); setUploadFile(null); setUploadSignerName(''); }}>
                                <Upload className="mr-1 h-3 w-3" />Subir firmado
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-500 hover:text-red-300 hover:bg-red-50" onClick={() => { setDeleteTarget(doc); setDeleteConfirm(''); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}

                          {/* Datos incorrectos → Ir a corregir + Regenerar */}
                          {status === 'needs_review' && doc && (
                            <>
                              <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50" onClick={() => handleGoToFix(doc)}>
                                <ArrowRight className="mr-1 h-3 w-3" />Ir a corregir
                              </Button>
                              <Button size="sm" disabled={!canGenerate(type) || isGenerating(type)} onClick={() => handleRegenerate(type)}>
                                <RefreshCw className="mr-1 h-3 w-3" />Regenerar
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-500 hover:text-red-300 hover:bg-red-50" onClick={() => { setDeleteTarget(doc); setDeleteConfirm(''); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}

                          {/* Error reportado → Regenerar */}
                          {status === 'reported' && doc && (
                            <>
                              <Button size="sm" disabled={!canGenerate(type) || isGenerating(type)} onClick={() => handleRegenerate(type)}>
                                <RefreshCw className="mr-1 h-3 w-3" />Regenerar
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-500 hover:text-red-300 hover:bg-red-50" onClick={() => { setDeleteTarget(doc); setDeleteConfirm(''); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}

                          {/* Firmado → Descargar + Ver firmado + Reemplazar */}
                          {status === 'signed' && doc && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                                <FileDown className="mr-1 h-3 w-3" />Original
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDownloadSigned(doc)}>
                                <Eye className="mr-1 h-3 w-3" />Firmado
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setUploadTarget(doc); setUploadFile(null); setUploadSignerName(''); }}>
                                <RefreshCw className="mr-1 h-3 w-3" />Reemplazar
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-500 hover:text-red-300 hover:bg-red-50" onClick={() => { setDeleteTarget(doc); setDeleteConfirm(''); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
           SECTION PICKER MODAL
         ══════════════════════════════════════════════════════════════ */}
      {showSectionPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-surface-200">
              <h3 className="text-sm font-semibold text-surface-900">¿Qué sección tiene datos incorrectos?</h3>
              <p className="text-xs text-surface-500 mt-1">Selecciona la sección a corregir. Se navegará directamente a ella.</p>
            </div>
            <div className="overflow-y-auto flex-1">
              {Object.entries(SECTION_LABELS).map(([num, label]) => (
                <button
                  key={num}
                  onClick={() => handleSelectSection(parseInt(num, 10))}
                  className="flex items-center gap-3 w-full px-6 py-3 text-left hover:bg-surface-50 transition-colors border-b border-surface-100 last:border-0"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                    {num}
                  </span>
                  <span className="text-sm text-surface-700 flex-1">{label}</span>
                  <ChevronRight className="h-4 w-4 text-surface-400" />
                </button>
              ))}
              {/* Cuadro eléctrico option */}
              <button
                onClick={() => {
                  setShowSectionPicker(false);
                  setSectionPickerDoc(null);
                  closePreview();
                  onNavigateToSection?.('cuadro');
                }}
                className="flex items-center gap-3 w-full px-6 py-3 text-left hover:bg-surface-50 transition-colors"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold shrink-0">
                  C
                </span>
                <span className="text-sm text-surface-700 flex-1">Cuadro eléctrico</span>
                <ChevronRight className="h-4 w-4 text-surface-400" />
              </button>
            </div>
            <div className="px-6 py-3 border-t border-surface-200">
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setShowSectionPicker(false); setSectionPickerDoc(null); }}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           FEEDBACK REPORT MODAL
         ══════════════════════════════════════════════════════════════ */}
      {showReportModal && reportDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-sm font-semibold text-surface-900 mb-1">Reportar error de formato</h3>
            <p className="text-xs text-surface-500 mb-4">
              {DOCUMENT_TYPE_LABELS[reportDoc.type] || reportDoc.type}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Descripción del error *</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe el problema de formato encontrado..."
                  className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[100px] resize-y"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Captura de pantalla (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReportScreenshot(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-surface-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-surface-100 file:text-surface-600 hover:file:bg-surface-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => { setShowReportModal(false); setReportDoc(null); }}>
                Cancelar
              </Button>
              <Button size="sm" disabled={!reportDescription.trim() || submittingReport} onClick={handleSubmitReport}>
                {submittingReport ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MessageSquareWarning className="mr-1 h-3 w-3" />}
                Enviar reporte
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload signed modal ── */}
      {uploadTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-sm font-semibold text-surface-50 mb-1">
              Subir documento firmado
            </h3>
            <p className="text-xs text-surface-500 mb-4">
              {DOCUMENT_TYPE_LABELS[uploadTarget.type] || uploadTarget.type}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Archivo PDF firmado *</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-surface-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-700 mb-1">Nombre del firmante (opcional)</label>
                <input
                  type="text"
                  value={uploadSignerName}
                  onChange={(e) => setUploadSignerName(e.target.value)}
                  placeholder="Nombre del técnico que firma"
                  className="w-full h-9 rounded-md border border-surface-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => { setUploadTarget(null); setUploadFile(null); setUploadSignerName(''); }}>
                Cancelar
              </Button>
              <Button size="sm" disabled={!uploadFile || uploading} onClick={handleUploadSigned}>
                {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                Subir
              </Button>
            </div>
          </div>
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

      {/* Needs-review banner (when coming back from datos tab) */}
      {documents.some(d => d.reviewStatus === 'NEEDS_REVIEW') && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700">Documentos pendientes de corrección</p>
            <p className="text-xs text-amber-600 mt-0.5">Tras corregir los datos, vuelva a Documentos y pulse Regenerar en los documentos marcados como &quot;Datos incorrectos&quot;.</p>
          </div>
        </div>
      )}

      {/* ═══ TRAMITACIÓN ASEICAM ═══ */}
      <TramitacionPanel
        installationId={installationId}
        installationName={installation?.titularName || installation?.referencia}
        hasRequiredDocs={
          documents.some((d) => d.type === 'CERTIFICADO') &&
          documents.some((d) => d.type === 'MEMORIA_TECNICA') &&
          signedCount === 4
        }
      />

      {/* ═══ UNIFILAR EDITOR — Fullscreen Modal ═══ */}
      {showUnifilar && (
        <div className="fixed inset-0 z-[100] bg-[#08090d]">
          <UnifilarEditor installationId={installationId} onClose={() => setShowUnifilar(false)} installationData={installation} />
        </div>
      )}

      {/* Upgrade modal */}
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
