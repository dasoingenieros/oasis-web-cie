'use client';

import { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { installationsApi } from '@/lib/api-client';
import type {
  Installation,
  UpdateInstallationDto,
  FieldStatusResponse,
  FieldConfigResponse,
  FieldConfigSection,
} from '@/lib/types';
import { ProgressBar } from './progress-bar';
import { FieldSection } from './field-section';
import { Loader2, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Sections hidden from guided view (auto-filled from tenant) ───
const HIDDEN_SECTIONS = new Set(['empresa', 'instalador', 'distribuidora']);

// ─── Section display order ───
const SECTION_ORDER = [
  'titular',
  'emplazamiento',
  'tecnico',
  'acometida',
  'cgp',
  'lga',
  'di',
  'modulo_medida',
  'protecciones',
  'tierra',
  'presupuesto',
  'certificacion',
  'firma',
  'info',
];

// ─── Address fields copied from titular → emplazamiento ───
const ADDRESS_FIELD_MAP: Record<string, string> = {
  titularTipoVia: 'emplazTipoVia',
  titularNombreVia: 'emplazNombreVia',
  titularNumero: 'emplazNumero',
  titularBloque: 'emplazBloque',
  titularEscalera: 'emplazEscalera',
  titularPiso: 'emplazPiso',
  titularPuerta: 'emplazPuerta',
  titularLocalidad: 'emplazLocalidad',
  titularProvincia: 'emplazProvincia',
  titularCp: 'emplazCp',
};

export interface DatosGuiadosState {
  percent: number;
  filled: number;
  total: number;
  dirty: boolean;
}

export interface DatosGuiadosHandle {
  save: () => Promise<void>;
}

interface Props {
  installationId: string;
  installation: Installation;
  isSaving: boolean;
  onSave: (data: UpdateInstallationDto) => Promise<void>;
  onStateChange?: (state: DatosGuiadosState) => void;
  onShowAllFields?: () => void;
}

export const DatosGuiadosTab = forwardRef<DatosGuiadosHandle, Props>(function DatosGuiadosTab(
  { installationId, installation, isSaving, onSave, onStateChange, onShowAllFields },
  ref,
) {
  const [fieldConfig, setFieldConfig] = useState<FieldConfigResponse | null>(null);
  const [fieldStatus, setFieldStatus] = useState<FieldStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sameAddress, setSameAddress] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [dirty, setDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch field config + status ───
  const fetchFieldData = useCallback(async () => {
    try {
      const [config, status] = await Promise.all([
        installationsApi.getFieldConfig(installationId),
        installationsApi.getFieldStatus(installationId),
      ]);
      setFieldConfig(config);
      setFieldStatus(status);
    } catch (err) {
      console.error('Error fetching field data:', err);
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => {
    fetchFieldData();
  }, [fetchFieldData]);

  // ─── Detect "same address" on load ───
  useEffect(() => {
    if (!fieldConfig) return;
    const sections = fieldConfig.sections;
    const titularSection = sections.find((s) => s.id === 'titular');
    const emplazSection = sections.find((s) => s.id === 'emplazamiento');
    if (!titularSection || !emplazSection) return;

    const fieldMap = new Map(
      [...titularSection.fields, ...emplazSection.fields].map((f) => [f.name, f.currentValue]),
    );

    const allMatch = Object.entries(ADDRESS_FIELD_MAP).every(([tKey, eKey]) => {
      const tVal = fieldMap.get(tKey);
      const eVal = fieldMap.get(eKey);
      if (!tVal && !eVal) return true;
      return tVal === eVal;
    });

    // Only set sameAddress if titular has at least some values
    const hasTitularAddr = Object.keys(ADDRESS_FIELD_MAP).some(
      (k) => fieldMap.get(k) != null && String(fieldMap.get(k)).trim() !== '',
    );
    if (allMatch && hasTitularAddr) {
      setSameAddress(true);
    }
  }, [fieldConfig]);

  // ─── Report state to parent ───
  useEffect(() => {
    if (!fieldStatus) return;
    onStateChange?.({
      percent: fieldStatus.completionPct,
      filled: fieldStatus.completedFields,
      total: fieldStatus.totalFields,
      dirty,
    });
  }, [fieldStatus, dirty, onStateChange]);

  // ─── Build merged section data (server values + pending local changes) ───
  const getMergedSections = useCallback((): FieldConfigSection[] => {
    if (!fieldConfig) return [];
    return fieldConfig.sections
      .filter((s) => !HIDDEN_SECTIONS.has(s.id))
      .sort((a, b) => {
        const ai = SECTION_ORDER.indexOf(a.id);
        const bi = SECTION_ORDER.indexOf(b.id);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
      .map((section) => ({
        ...section,
        fields: section.fields.map((f) => {
          if (f.name in pendingChanges) {
            const newVal = pendingChanges[f.name];
            return {
              ...f,
              currentValue: newVal,
              isComplete: newVal != null && String(newVal).trim() !== '',
            };
          }
          return f;
        }),
      }));
  }, [fieldConfig, pendingChanges]);

  // ─── Save handler ───
  const save = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    try {
      await onSave(pendingChanges);
      setPendingChanges({});
      setDirty(false);
      // Refresh field status after save
      const status = await installationsApi.getFieldStatus(installationId);
      setFieldStatus(status);
      // Also refresh config to get updated values
      const config = await installationsApi.getFieldConfig(installationId);
      setFieldConfig(config);
    } catch (err) {
      console.error('Error saving:', err);
    }
  }, [pendingChanges, onSave, installationId]);

  useImperativeHandle(ref, () => ({ save }), [save]);

  // ─── Auto-save with debounce ───
  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Trigger save via ref
      save();
    }, 1500);
  }, [save]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ─── Field change handler ───
  const handleFieldChange = useCallback(
    (name: string, value: any) => {
      const newChanges = { ...pendingChanges, [name]: value };

      // If sameAddress is active and this is a titular address field, copy to emplaz
      if (sameAddress && name in ADDRESS_FIELD_MAP) {
        const emplazField = ADDRESS_FIELD_MAP[name];
        newChanges[emplazField] = value;
      }

      setPendingChanges(newChanges);
      setDirty(true);
      scheduleSave();
    },
    [pendingChanges, sameAddress, scheduleSave],
  );

  // ─── "Same address" toggle ───
  const handleSameAddressToggle = useCallback(
    (checked: boolean) => {
      setSameAddress(checked);
      if (checked && fieldConfig) {
        // Copy current titular values to emplaz
        const titularSection = fieldConfig.sections.find((s) => s.id === 'titular');
        if (!titularSection) return;

        const titularValues = new Map(titularSection.fields.map((f) => [f.name, f.currentValue]));
        const newChanges = { ...pendingChanges };

        Object.entries(ADDRESS_FIELD_MAP).forEach(([tKey, eKey]) => {
          const val = tKey in pendingChanges ? pendingChanges[tKey] : titularValues.get(tKey);
          if (val != null) {
            newChanges[eKey] = val;
          }
        });

        setPendingChanges(newChanges);
        setDirty(true);
        scheduleSave();
      }
    },
    [fieldConfig, pendingChanges, scheduleSave],
  );

  // ─── Disabled fields (emplaz address when sameAddress active) ───
  const disabledFields = new Set<string>();
  if (sameAddress) {
    Object.values(ADDRESS_FIELD_MAP).forEach((f) => disabledFields.add(f));
  }

  // ─── Scroll to first missing section for a doc type ───
  const handleDocClick = useCallback(
    (docType: string) => {
      if (!fieldStatus) return;
      const missing = fieldStatus.missingSections[0];
      if (missing) {
        const el = document.getElementById(`section-${missing.section}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [fieldStatus],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!fieldConfig || !fieldStatus) {
    return (
      <div className="text-center py-12 text-sm text-surface-500">
        No se pudo cargar la configuración de campos.
      </div>
    );
  }

  const mergedSections = getMergedSections();

  return (
    <div className="space-y-4">
      {/* Progress + document readiness */}
      <ProgressBar
        completionPct={fieldStatus.completionPct}
        completedFields={fieldStatus.completedFields}
        totalFields={fieldStatus.totalFields}
        documentReadiness={fieldStatus.documentReadiness}
        onDocClick={handleDocClick}
      />

      {/* Sections */}
      {mergedSections.map((section) => (
        <div key={section.id} id={`section-${section.id}`}>
          <FieldSection
            id={section.id}
            label={section.label}
            fields={section.fields}
            disabledFields={disabledFields}
            onChange={handleFieldChange}
            headerExtra={
              section.id === 'emplazamiento' ? (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-surface-100">
                  <input
                    type="checkbox"
                    id="same-address"
                    checked={sameAddress}
                    onChange={(e) => handleSameAddressToggle(e.target.checked)}
                    className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="same-address" className="text-sm text-surface-700 cursor-pointer">
                    Misma dirección que el titular
                  </label>
                </div>
              ) : undefined
            }
          />
        </div>
      ))}

      {/* Fallback to full form */}
      <div className="flex justify-center pt-2 pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onShowAllFields}
          className="gap-2 text-surface-600"
        >
          <List className="h-4 w-4" />
          Ver todos los campos
        </Button>
      </div>
    </div>
  );
});
