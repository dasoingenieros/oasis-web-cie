'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useInstallations } from '@/hooks/use-installations';
import { subscriptionsApi } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InstallationCard } from '@/components/installation-card';
import { NewInstallationDialog } from '@/components/new-installation-dialog';
import type { DashboardStats, CreateInstallationDto, UsageData } from '@/lib/types';
import {
  Plus,
  FileText,
  PenLine,
  Calculator,
  CheckCircle2,
  Loader2,
  Zap,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    installations,
    isLoading,
    error,
    createInstallation,
    deleteInstallation,
  } = useInstallations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Fetch usage data
  useEffect(() => {
    subscriptionsApi.getUsage().then(setUsage).catch(() => {});
  }, []);

  // Handle Stripe checkout return
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const puntual = searchParams.get('puntual');

    if (sessionId) {
      showToast('Pago completado. Tu plan se ha actualizado.');
      subscriptionsApi.getUsage().then(setUsage).catch(() => {});
      router.replace('/');
    } else if (puntual === 'success') {
      showToast('Crédito añadido. Ya puedes generar tu certificado.');
      subscriptionsApi.getUsage().then(setUsage).catch(() => {});
      router.replace('/');
    }
  }, [searchParams, showToast, router]);

  const stats: DashboardStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: installations.length,
      draft: installations.filter((i) => i.status === 'DRAFT').length,
      calculated: installations.filter((i) => i.status === 'CALCULATED').length,
      pendingReview: installations.filter((i) => i.status === 'PENDING_REVIEW').length,
      completed: installations.filter((i) => i.status === 'COMPLETED').length,
      thisMonth: installations.filter(
        (i) => new Date(i.createdAt) >= monthStart,
      ).length,
    };
  }, [installations]);

  const handleCreate = async (dto: CreateInstallationDto) => {
    const created = await createInstallation(dto);
    router.push(`/instalaciones/${created.id}`);
  };

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteRequest = (id: string) => {
    setDeleteTarget(id);
    setDeleteConfirmText('');
    setDeleteError(null);
  };

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteConfirmText !== 'ELIMINAR') return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteInstallation(deleteTarget);
      setDeleteTarget(null);
      setDeleteConfirmText('');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Error al eliminar';
      setDeleteError(typeof msg === 'string' ? msg : msg[0]);
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const statCards = [
    { label: 'Total', value: stats.total, icon: FileText, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Borrador', value: stats.draft, icon: PenLine, color: 'text-surface-600', bg: 'bg-surface-100' },
    { label: 'Calculados', value: stats.calculated, icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completados', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  // Usage banner logic
  const plan = usage?.plan?.toUpperCase() ?? 'FREE';
  const isFreePlan = plan === 'FREE';
  const isPro = plan === 'PRO';
  const isEnterprise = plan === 'ENTERPRISE';
  const credits = usage?.availableCredits ?? 0;
  const atLimit = isFreePlan && credits === 0;

  return (
    <div className="space-y-6">
      {/* Plan usage banner */}
      {usage && (
        <>
          {isFreePlan && (
            <div className={`rounded-xl border p-4 ${atLimit ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${atLimit ? 'text-red-600' : 'text-blue-600'}`} />
                  <span className={`text-sm font-semibold ${atLimit ? 'text-red-800' : 'text-blue-800'}`}>
                    {atLimit
                      ? 'Plan Free — Sin certificados disponibles. Actualiza tu plan.'
                      : `Plan Free — ${credits} certificado${credits !== 1 ? 's' : ''} disponible${credits !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <a
                  href="/pricing"
                  className={`text-sm font-medium inline-flex items-center gap-1 ${
                    atLimit ? 'text-red-700 hover:text-red-600' : 'text-blue-700 hover:text-blue-600'
                  } transition-colors`}
                >
                  Mejorar plan
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
          {isPro && (
            <div className="rounded-xl border p-4 bg-emerald-50 border-emerald-200">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">
                  Plan Pro — Certificados ilimitados
                </span>
              </div>
            </div>
          )}
          {isEnterprise && (
            <div className="rounded-xl border p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-800">
                  Plan Enterprise — Certificados ilimitados
                </span>
              </div>
            </div>
          )}
          {credits > 0 && !isFreePlan && (
            <div className="rounded-xl border p-4 bg-amber-50 border-amber-200">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">
                  {credits} crédito{credits !== 1 ? 's' : ''} puntual{credits !== 1 ? 'es' : ''} disponible{credits !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">
            Hola, {user?.name?.split(' ')[0] ?? 'usuario'}
          </h1>
          <p className="mt-0.5 text-sm text-surface-500">
            {stats.thisMonth > 0
              ? `${stats.thisMonth} instalaciones este mes`
              : 'Sin instalaciones este mes'}
          </p>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva instalación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-surface-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-surface-900 tabular-nums">{stat.value}</p>
                <p className="text-xs text-surface-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Installation list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      ) : installations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-300 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <Zap className="h-6 w-6 text-brand-600" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-surface-900">Sin instalaciones</h3>
          <p className="mt-1 text-sm text-surface-500 max-w-xs">
            Crea tu primera instalación para empezar a generar certificados eléctricos automáticamente.
          </p>
          <Button className="mt-5" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear primera instalación
          </Button>
        </div>
      ) : (
        <div>
          <h2 className="mb-3 text-sm font-medium text-surface-500">Instalaciones recientes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {installations.map((installation) => (
              <InstallationCard
                key={installation.id}
                installation={installation}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-surface-200 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-surface-900">Eliminar instalación</h3>
            <p className="mt-2 text-sm text-surface-500">
              Esta acción es <span className="font-bold text-red-600">permanente e irreversible</span>. Se eliminarán todos los datos, circuitos y documentos asociados.
            </p>
            <p className="mt-3 text-sm text-surface-500">
              Escribe <span className="font-mono font-bold text-red-600">ELIMINAR</span> para confirmar:
            </p>
            <input
              className="mt-2 w-full h-9 rounded-md border border-surface-300 bg-white px-3 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Escribe ELIMINAR"
              autoFocus
            />
            {deleteError && (
              <p className="mt-2 text-sm text-red-600 font-medium">{deleteError}</p>
            )}
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); setDeleteError(null); }}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
                onClick={handleDeleteConfirm}
              >
                {isDeleting ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Eliminando...</> : 'Eliminar definitivamente'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <NewInstallationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-lg bg-emerald-50 border border-emerald-200 shadow-lg">
          <span className="text-sm font-medium text-emerald-800">{toast}</span>
        </div>
      )}
    </div>
  );
}
