'use client';

import { useInstallations } from '@/hooks/use-installations';
import { InstallationCard } from '@/components/installation-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NewInstallationDialog } from '@/components/new-installation-dialog';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import type { CreateInstallationDto } from '@/lib/types';
import { Plus, Search, Loader2, FolderOpen } from 'lucide-react';

export default function InstalacionesPage() {
  const router = useRouter();
  const {
    installations,
    isLoading,
    error,
    createInstallation,
    deleteInstallation,
  } = useInstallations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return installations;
    const q = search.toLowerCase();
    return installations.filter(
      (i) =>
        i.titularName?.toLowerCase().includes(q) ||
        i.address?.toLowerCase().includes(q) ||
        i.cups?.toLowerCase().includes(q),
    );
  }, [installations, search]);

  const handleCreate = async (dto: CreateInstallationDto) => {
    const created = await createInstallation(dto);
    router.push(`/instalaciones/${created.id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar esta instalación?')) {
      await deleteInstallation(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">
            Instalaciones
          </h1>
          <p className="mt-0.5 text-sm text-surface-500">
            {installations.length} instalaciones en total
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva instalación
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        <Input
          placeholder="Buscar por titular, dirección o CUPS…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : error ? (
        <p className="py-10 text-center text-sm text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-10 w-10 text-surface-400" />
          <p className="mt-3 text-sm text-surface-500">
            {search
              ? 'No se encontraron resultados'
              : 'No hay instalaciones todavía'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((installation) => (
            <InstallationCard
              key={installation.id}
              installation={installation}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <NewInstallationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
