'use client';
import { useCallback, useEffect, useState } from 'react';
import { installationsApi, circuitsApi, calculationsApi } from '@/lib/api-client';
import type { Installation, Circuit, CalculationResult, UpdateInstallationDto, CreateCircuitDto } from '@/lib/types';

export function useInstallation(id: string) {
  const [installation, setInstallation] = useState<Installation | null>(null);
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [supplyResult, setSupplyResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch installation + circuits + latest calculation
  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [inst, circs, calc] = await Promise.all([
        installationsApi.get(id),
        circuitsApi.list(id),
        calculationsApi.getLatest(id),
      ]);
      setInstallation(inst);
      setCircuits(circs);
      setCalculation(calc);
    } catch {
      setError('Error al cargar la instalación');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Update installation data
  const updateInstallation = useCallback(
    async (dto: UpdateInstallationDto): Promise<Installation> => {
      setIsSaving(true);
      try {
        const updated = await installationsApi.update(id, dto);
        setInstallation(updated);
        return updated;
      } finally {
        setIsSaving(false);
      }
    },
    [id],
  );

  // Replace all circuits
  const saveCircuits = useCallback(
    async (dtos: CreateCircuitDto[]): Promise<Circuit[]> => {
      setIsSaving(true);
      try {
        const saved = await circuitsApi.replaceAll(id, dtos);
        setCircuits(saved);
        return saved;
      } finally {
        setIsSaving(false);
      }
    },
    [id],
  );

  // Run circuit calculation (read-only — does not modify circuit records)
  const calculate = useCallback(async (): Promise<CalculationResult> => {
    setIsCalculating(true);
    try {
      const result = await calculationsApi.calculate(id);
      setCalculation(result);
      // Refetch installation to get updated status
      const [updated, circs] = await Promise.all([
        installationsApi.get(id),
        circuitsApi.list(id),
      ]);
      setInstallation(updated);
      setCircuits(circs);
      return result;
    } finally {
      setIsCalculating(false);
    }
  }, [id]);

  // Run supply calculation (IGA + DI + differentials)
  const calculateSupply = useCallback(async (): Promise<any> => {
    try {
      const result = await calculationsApi.calculateSupply(id);
      setSupplyResult(result);
      // Refetch installation to get updated seccionDi
      const updated = await installationsApi.get(id);
      setInstallation(updated);
      return result;
    } catch (err) {
      console.error('Error calculando suministro:', err);
      return null;
    }
  }, [id]);

  return {
    installation,
    circuits,
    calculation,
    supplyResult,
    isLoading,
    isSaving,
    isCalculating,
    error,
    refetch: fetch,
    updateInstallation,
    saveCircuits,
    calculate,
    calculateSupply,
  };
}
