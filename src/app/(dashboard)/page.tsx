'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useInstallations } from '@/hooks/use-installations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InstallationCard } from '@/components/installation-card';
import { NewInstallationDialog } from '@/components/new-installation-dialog';
import type { DashboardStats, CreateInstallationDto } from '@/lib/types';
import {
  Plus,
  FileText,
  PenLine,
  Calculator,
  CheckCircle2,
  Loader2,
  Zap,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    installations,
    isLoading,
    error,
    createInstallation,
    deleteInstallation,
  } = useInstallations();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Compute stats
  const stats: DashboardStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: installations.length,
      draft: installations.filter((i) => i.status === 'DRAFT').length,
      calculated: installations.filter((i) => i.status === 'CALCULATED').length,
      pendingReview: installations.filter((i) => i.status === 'PENDING_REVIEW')
        .length,
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
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteConfirmText !== 'ELIMINAR') return;
    setIsDeleting(true);
    try {
      await deleteInstallation(deleteTarget);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
      setDeleteConfirmText('');
    }
  };

  const statCards = [
    {
      label: 'Total',
      value: stats.total,
      icon: FileText,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
    {
      label: 'Borrador',
      value: stats.draft,
      icon: PenLine,
      color: 'text-slate-500',
      bg: 'bg-slate-50',
    },
    {
      label: 'Calculados',
      value: stats.calculated,
      icon: Calculator,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Completados',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Hola, {user?.name?.split(' ')[0] ?? 'usuario'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
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
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Installation list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      ) : installations.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <Zap className="h-6 w-6 text-brand-500" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            Sin instalaciones
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-xs">
            Crea tu primera instalación para empezar a generar certificados
            eléctricos automáticamente.
          </p>
          <Button className="mt-5" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear primera instalación
          </Button>
        </div>
      ) : (
        /* Grid of installation cards */
        <div>
          <h2 className="mb-3 text-sm font-medium text-slate-500">
            Instalaciones recientes
          </h2>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900">Eliminar instalación</h3>
            <p className="mt-2 text-sm text-slate-600">
              Esta acción es <span className="font-bold text-red-600">permanente e irreversible</span>. Se eliminarán todos los datos, circuitos y documentos asociados.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Escribe <span className="font-mono font-bold text-red-600">ELIMINAR</span> para confirmar:
            </p>
            <input
              className="mt-2 w-full h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Escribe ELIMINAR"
              autoFocus
            />
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
                onClick={handleDeleteConfirm}
              >
                {isDeleting ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Eliminando…</> : 'Eliminar definitivamente'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo nueva instalación */}
      <NewInstallationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
