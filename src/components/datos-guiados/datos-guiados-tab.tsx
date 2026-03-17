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

// ─── Sections hidden from guided view (auto-filled from tenant or shown in cuadro tab) ───
const HIDDEN_SECTIONS = new Set(['empresa', 'instalador', 'cgp', 'modulo_medida']);

// ─── Section display order ───
const SECTION_ORDER = [
  'titular',
  'emplazamiento',
  'tecnico',
  'acometida',
  'cgp',
  'lga',
  'modulo_medida',
  'protecciones',
  'tierra',
  'presupuesto',
  'certificacion',
  'firma',
  'info',
];

// ─── Text fields that must be stored/displayed in UPPERCASE ───
const UPPERCASE_FIELDS = new Set([
  'titularNombre', 'titularApellido1', 'titularApellido2',
  'titularNombreVia', 'titularLocalidad', 'titularProvincia',
  'emplazNombreVia', 'emplazLocalidad', 'emplazProvincia',
]);

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
  const pendingRef = useRef<Record<string, any>>({});
  pendingRef.current = pendingChanges;
  // dirty is derived — true whenever there are unsaved changes
  const dirty = Object.keys(pendingChanges).length > 0;
  const fieldConfigFetched = useRef(false);

  // ─── Fetch field config (ONCE) + status ───
  useEffect(() => {
    if (fieldConfigFetched.current) return;
    fieldConfigFetched.current = true;
    let cancelled = false;
    (async () => {
      try {
        const [config, status] = await Promise.all([
          installationsApi.getFieldConfig(installationId),
          installationsApi.getFieldStatus(installationId),
        ]);
        if (cancelled) return;
        setFieldConfig(config);
        setFieldStatus(status);
      } catch (err) {
        console.error('Error fetching field data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [installationId]);

  // ─── Detect "same address" on initial load only ───
  const sameAddrDetected = useRef(false);
  useEffect(() => {
    if (!fieldConfig || sameAddrDetected.current) return;
    sameAddrDetected.current = true;
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

  // ─── Save handler (reads latest pendingChanges via ref to avoid stale closures) ───
  const save = useCallback(async () => {
    const current = pendingRef.current;
    if (Object.keys(current).length === 0) return;
    const changesToSave = { ...current };
    try {
      await onSave(changesToSave);

      // Merge saved values into fieldConfig locally (no refetch — local state is source of truth)
      setFieldConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((section) => ({
            ...section,
            fields: section.fields.map((f) => {
              if (f.name in changesToSave) {
                const v = changesToSave[f.name];
                return { ...f, currentValue: v, isComplete: v != null && String(v).trim() !== '' };
              }
              return f;
            }),
          })),
        };
      });

      // Remove only the saved keys from pending (preserve any edits made during save)
      setPendingChanges((prev) => {
        const next: Record<string, any> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (k in changesToSave && v === changesToSave[k]) continue;
          next[k] = v;
        }
        return next;
      });

      // Refresh field-status only (progress/readiness, NOT field values)
      const status = await installationsApi.getFieldStatus(installationId);
      setFieldStatus(status);
    } catch (err) {
      console.error('Error saving:', err);
    }
  }, [onSave, installationId]);

  useImperativeHandle(ref, () => ({ save }), [save]);

  // ─── Field change handler (no auto-save — only explicit Guardar button) ───
  const handleFieldChange = useCallback(
    (name: string, value: any) => {
      // Uppercase for titular/emplazamiento text fields
      const v = UPPERCASE_FIELDS.has(name) && typeof value === 'string' ? value.toUpperCase() : value;
      const newChanges = { ...pendingChanges, [name]: v };

      // If sameAddress is active and this is a titular address field, copy to emplaz
      if (sameAddress && name in ADDRESS_FIELD_MAP) {
        const emplazField = ADDRESS_FIELD_MAP[name];
        newChanges[emplazField] = UPPERCASE_FIELDS.has(emplazField) && typeof v === 'string' ? v.toUpperCase() : v;
      }

      setPendingChanges(newChanges);
    },
    [pendingChanges, sameAddress],
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
      }
    },
    [fieldConfig, pendingChanges],
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
            uppercaseFields={UPPERCASE_FIELDS}
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
