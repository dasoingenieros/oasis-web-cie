'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useInstallations } from '@/hooks/use-installations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InstallationCard } from '@/components/installation-card';
import type { DashboardStats } from '@/lib/types';
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
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const created = await createInstallation({
        supplyType: 'VIVIENDA_BASICA',
      });
      router.push(`/instalaciones/${created.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar esta instalación? Esta acción no se puede deshacer.')) {
      await deleteInstallation(id);
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

        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando…</>
          ) : (
            <><Plus className="mr-2 h-4 w-4" />Nueva instalación</>
          )}
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
          <Button className="mt-5" onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando…</>
            ) : (
              <><Plus className="mr-2 h-4 w-4" />Crear primera instalación</>
            )}
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
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
