'use client';

import { useCallback, useEffect, useState } from 'react';
import { installationsApi } from '@/lib/api-client';
import type { Installation, CreateInstallationDto } from '@/lib/types';

export function useInstallations() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstallations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await installationsApi.list();
      setInstallations(data);
    } catch (err) {
      setError('Error al cargar las instalaciones');
      console.error('Failed to fetch installations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstallations();
  }, [fetchInstallations]);

  const createInstallation = useCallback(
    async (dto: CreateInstallationDto): Promise<Installation> => {
      const created = await installationsApi.create(dto);
      setInstallations((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  const deleteInstallation = useCallback(async (id: string) => {
    await installationsApi.delete(id);
    setInstallations((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return {
    installations,
    isLoading,
    error,
    refetch: fetchInstallations,
    createInstallation,
    deleteInstallation,
  };
}
