'use client';

import { useState, useCallback } from 'react';
import { LocalidadCombobox } from '@/components/localidad-combobox';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, FileText, BookOpen, PlusCircle, Maximize2, Pencil, X } from 'lucide-react';
import type { CreateInstallationDto } from '@/lib/types';
import { waitlistApi } from '@/lib/api-client';
import { TIPO_VIA_OPTIONS, TIPO_DOCUMENTO_OPTIONS } from '@/lib/portal-constants';
import {
  INSTALLATION_TYPES,
  EXPEDIENTE_LABELS,
  type InstallationType,
} from '@/lib/installation-types';

// ─── Props ──────────────────────────────────────────────────────

interface NewInstallationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateInstallationDto) => Promise<void>;
}

// ─── Distribuidoras ─────────────────────────────────────────────

const DISTRIBUIDORA_OPTIONS = [
  { value: '0021 - I-DE Redes Eléctricas Inteligentes', label: '0021 - I-DE Redes Eléctricas Inteligentes' },
  { value: '0022 - UFD Distribución Electricidad', label: '0022 - UFD Distribución Electricidad' },
  { value: '0031 - E-Distribución Redes Digitales', label: '0031 - E-Distribución Redes Digitales' },
  { value: '0026 - Hidrocantábrico Distribución Eléctrica', label: '0026 - Hidrocantábrico Distribución Eléctrica' },
  { value: '0483 - Distribución Eléctrica del Tajuña', label: '0483 - Distribución Eléctrica del Tajuña' },
  { value: '0494 - Distribución Eléctrica El Pozo del Tio Raimundo', label: '0494 - Distribución Eléctrica El Pozo del Tio Raimundo' },
  { value: '0315 - Hidroeléctrica Vega', label: '0315 - Hidroeléctrica Vega' },
  { value: '0148 - Distribución Eléctrica Las Mercedes', label: '0148 - Distribución Eléctrica Las Mercedes' },
  { value: '0027 - Viesgo Distribución Eléctrica', label: '0027 - Viesgo Distribución Eléctrica' },
];

// ─── Wizard state ───────────────────────────────────────────────

interface WizardState {
  step: number;
  // Step 1 — Tipo instalación
  selectedType: string | null;
  // Step 2 — Documentación (skipped when auto)
  docType: 'MTD' | 'PROYECTO' | null;
  // Step 3 — Actuación
  expedienteType: string | null;
  // Step 4 — Titular
  holderDocType: string;
  titularNif: string;
  titularNombre: string;
  titularApellido1: string;
  titularApellido2: string;
  titularEmail: string;
  titularTelefono: string;
  titularMovil: string;
  // Step 5 — Dirección
  titularTipoVia: string;
  titularNombreVia: string;
  titularNumero: string;
  titularBloque: string;
  titularEscalera: string;
  titularPiso: string;
  titularPuerta: string;
  titularLocalidad: string;
  titularCp: string;
  mismaDir: boolean;
  emplazTipoVia: string;
  emplazNombreVia: string;
  emplazNumero: string;
  emplazBloque: string;
  emplazEscalera: string;
  emplazPiso: string;
  emplazPuerta: string;
  emplazLocalidad: string;
  emplazCp: string;
  cups: string;
  // Step 6 — Técnicos
  distribuidora: string;
  supplyVoltage: string;
  referencia: string;
  electrificacion: string;
  puntosRecarga: number;
  esquemaIve: string;
  potenciaPico: string;
  modalidadAutoconsumo: string;
}

const TIPOS_VIA_CIE = TIPO_VIA_OPTIONS;

const INITIAL_STATE: WizardState = {
  step: 1,
  selectedType: null,
  docType: null,
  expedienteType: null,
  holderDocType: 'NIF',
  titularNif: '',
  titularNombre: '',
  titularApellido1: '',
  titularApellido2: '',
  titularEmail: '',
  titularTelefono: '',
  titularMovil: '',
  titularTipoVia: '',
  titularNombreVia: '',
  titularNumero: '',
  titularBloque: '',
  titularEscalera: '',
  titularPiso: '',
  titularPuerta: '',
  titularLocalidad: '',
  titularCp: '',
  mismaDir: true,
  emplazTipoVia: '',
  emplazNombreVia: '',
  emplazNumero: '',
  emplazBloque: '',
  emplazEscalera: '',
  emplazPiso: '',
  emplazPuerta: '',
  emplazLocalidad: '',
  emplazCp: '',
  cups: '',
  distribuidora: '0021 - I-DE Redes Eléctricas Inteligentes',
  supplyVoltage: '230',
  referencia: '',
  electrificacion: 'BASICO',
  puntosRecarga: 1,
  esquemaIve: '4a',
  potenciaPico: '',
  modalidadAutoconsumo: 'sin_excedentes',
};

const STEP_SUBTITLES: Record<number, string> = {
  1: 'Tipo de instalacion',
  2: 'Tipo de documentacion',
  3: 'Tipo de actuacion',
  4: 'Datos del titular',
  5: 'Direccion',
  6: 'Datos tecnicos',
};

const TOTAL_STEPS = 6;

// ─── Component ──────────────────────────────────────────────────

export function NewInstallationDialog({ open, onOpenChange, onSubmit }: NewInstallationDialogProps) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [waitlistModal, setWaitlistModal] = useState<{ open: boolean; typeName: string; typeKey: string }>({ open: false, typeName: '', typeKey: '' });
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSent, setWaitlistSent] = useState(false);

  const update = useCallback((patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch })), []);

  const selectedTypeObj = INSTALLATION_TYPES.find((t) => t.key === state.selectedType);

  // Skip step 2 for vivienda (auto MTD) and non-canMTD types (auto PROYECTO)
  const skipStep2 = !!state.selectedType && (state.selectedType === 'vivienda' || !selectedTypeObj?.canMTD);

  const handleClose = () => {
    setState(INITIAL_STATE);
    setError(null);
    setShowHelp(false);
    onOpenChange(false);
  };

  const canNext = (): boolean => {
    switch (state.step) {
      case 1: return !!state.selectedType;
      case 2: return !!state.docType;
      case 3: return !!state.expedienteType;
      case 4: return !!state.titularNombre.trim() && !!state.titularApellido1.trim() && (!!state.titularTelefono.trim() || !!state.titularMovil.trim());
      case 5: return !!state.titularNombreVia.trim() && !!state.titularLocalidad.trim();
      case 6: return !!state.distribuidora;
      default: return false;
    }
  };

  const nextLabel = (): string => {
    switch (state.step) {
      case 1: return state.selectedType ? 'Siguiente →' : 'Selecciona un tipo';
      case 2: return state.docType ? 'Siguiente →' : 'Elige documentacion';
      case 3: return state.expedienteType ? 'Siguiente →' : 'Elige tipo de actuacion';
      case 4: return canNext() ? 'Siguiente →' : 'Completa los datos';
      case 5: return canNext() ? 'Siguiente →' : 'Completa la direccion';
      case 6: return 'Crear instalacion →';
      default: return 'Siguiente →';
    }
  };

  const goNext = () => {
    let next = state.step + 1;
    if (next === 2 && skipStep2) next = 3;
    if (next <= TOTAL_STEPS) {
      update({ step: next });
    } else {
      handleCreate();
    }
  };

  const goBack = () => {
    let prev = state.step - 1;
    if (prev === 2 && skipStep2) prev = 1;
    if (prev >= 1) update({ step: prev });
  };

  const handleCreate = async () => {
    if (!state.titularNombre.trim() || !state.titularNombreVia.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const up = (s: string) => s.trim().toUpperCase();
      const fullName = [state.titularNombre, state.titularApellido1, state.titularApellido2].filter(Boolean).map(s => up(s)).filter(Boolean).join(' ');

      const emplazTipoVia = state.mismaDir ? state.titularTipoVia : state.emplazTipoVia;
      const emplazNombreVia = state.mismaDir ? state.titularNombreVia : state.emplazNombreVia;
      const emplazNumero = state.mismaDir ? state.titularNumero : state.emplazNumero;
      const emplazBloque = state.mismaDir ? state.titularBloque : state.emplazBloque;
      const emplazEscalera = state.mismaDir ? state.titularEscalera : state.emplazEscalera;
      const emplazPiso = state.mismaDir ? state.titularPiso : state.emplazPiso;
      const emplazPuerta = state.mismaDir ? state.titularPuerta : state.emplazPuerta;
      const emplazLocalidad = state.mismaDir ? state.titularLocalidad : state.emplazLocalidad;
      const emplazCp = state.mismaDir ? state.titularCp : state.emplazCp;

      const voltage = parseInt(state.supplyVoltage) || 230;

      const dto: CreateInstallationDto = {
        titularName: fullName,
        titularNombre: up(state.titularNombre) || undefined,
        titularApellido1: up(state.titularApellido1) || undefined,
        titularApellido2: up(state.titularApellido2) || undefined,
        holderDocType: state.holderDocType || undefined,
        titularNif: up(state.titularNif) || undefined,
        titularEmail: state.titularEmail.trim().toLowerCase() || undefined,
        titularTelefono: state.titularTelefono.trim() || undefined,
        titularMovil: state.titularMovil.trim() || undefined,
        titularTipoVia: state.titularTipoVia || undefined,
        titularNombreVia: up(state.titularNombreVia) || undefined,
        titularNumero: up(state.titularNumero) || undefined,
        titularBloque: up(state.titularBloque) || undefined,
        titularEscalera: up(state.titularEscalera) || undefined,
        titularPiso: up(state.titularPiso) || undefined,
        titularPuerta: up(state.titularPuerta) || undefined,
        titularCp: state.titularCp.trim() || undefined,
        titularLocalidad: state.titularLocalidad.trim() || undefined,
        titularProvincia: 'MADRID',
        address: [state.titularTipoVia, state.titularNombreVia, state.titularNumero].filter(Boolean).join(' ').trim() + (state.titularCp ? `, ${state.titularCp}` : '') + (state.titularLocalidad ? ` ${state.titularLocalidad}` : '') || undefined,
        emplazTipoVia: emplazTipoVia || undefined,
        emplazNombreVia: up(emplazNombreVia) || undefined,
        emplazNumero: up(emplazNumero) || undefined,
        emplazBloque: up(emplazBloque) || undefined,
        emplazEscalera: up(emplazEscalera) || undefined,
        emplazPiso: up(emplazPiso) || undefined,
        emplazPuerta: up(emplazPuerta) || undefined,
        emplazCp: emplazCp.trim() || undefined,
        emplazLocalidad: emplazLocalidad.trim() || undefined,
        emplazProvincia: 'MADRID',
        cups: up(state.cups) || undefined,
        tipoDocumentacion: state.docType ?? undefined,
        installationType: state.selectedType ?? undefined,
        expedienteType: state.expedienteType ?? undefined,
        distribuidora: state.distribuidora || undefined,
        supplyVoltage: voltage,
        referencia: state.referencia.trim() || undefined,
      };

      if (state.selectedType === 'vivienda') {
        dto.gradoElectrificacion = state.electrificacion;
      }
      if (state.selectedType === 'irve') {
        dto.puntosRecarga = state.puntosRecarga;
        dto.esquemaIve = state.esquemaIve;
      }
      if (state.selectedType === 'autoconsumo') {
        const p = parseFloat(state.potenciaPico);
        if (!isNaN(p)) dto.potenciaPico = p;
        dto.modalidadAutoconsumo = state.modalidadAutoconsumo;
      }

      await onSubmit(dto);
      setState(INITIAL_STATE);
      setError(null);
      onOpenChange(false);
    } catch {
      setError('Error al crear la instalacion. Intentalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWaitlistSubmit = async () => {
    if (!waitlistEmail.trim()) return;
    try {
      await waitlistApi.submit({ email: waitlistEmail, installationType: waitlistModal.typeKey });
      setWaitlistSent(true);
      setTimeout(() => {
        setWaitlistModal({ open: false, typeName: '', typeKey: '' });
        setWaitlistEmail('');
        setWaitlistSent(false);
      }, 1500);
    } catch {
      setWaitlistModal({ open: false, typeName: '', typeKey: '' });
    }
  };

  // Stepper: hide step 2 bar when auto-resolved
  const stepBars = skipStep2 ? [1, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-[780px] p-0 gap-0 overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Nueva instalacion</DialogTitle>

        {/* Header */}
        <div className="flex justify-between items-center px-7 pt-6">
          <h2 className="text-xl font-bold tracking-tight">Nueva instalacion</h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500">
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>
        <div className="px-7 pt-1 pb-5 text-[13px] text-slate-500">{STEP_SUBTITLES[state.step]}</div>

        {/* Stepper */}
        <div className="flex gap-1.5 px-7 pb-4">
          {stepBars.map((i) => (
            <div key={i} className={`flex-1 h-[3px] rounded-sm transition-colors duration-300 ${i <= state.step ? 'bg-blue-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        {/* Step content */}
        <div className="px-7 pb-7 max-h-[60vh] overflow-y-auto">
          {state.step === 1 && (
            <Step1TipoInstalacion
              state={state}
              update={update}
              onComingSoon={(name, key) => setWaitlistModal({ open: true, typeName: name, typeKey: key })}
            />
          )}
          {state.step === 2 && (
            <Step2Documentacion
              state={state}
              update={update}
              typeObj={selectedTypeObj!}
              showHelp={showHelp}
              setShowHelp={setShowHelp}
            />
          )}
          {state.step === 3 && <Step3Actuacion state={state} update={update} />}
          {state.step === 4 && <Step4Titular state={state} update={update} />}
          {state.step === 5 && <Step5Direccion state={state} update={update} />}
          {state.step === 6 && <Step6Tecnico state={state} update={update} typeObj={selectedTypeObj!} error={error} />}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-7 py-4 border-t border-slate-200 bg-slate-50/80">
          <button
            onClick={goBack}
            className={`text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors ${state.step <= 1 ? 'invisible' : ''}`}
          >
            ← Volver
          </button>
          <button
            onClick={goNext}
            disabled={!canNext() || isSubmitting}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : nextLabel()}
          </button>
        </div>

        {/* Waitlist modal */}
        {waitlistModal.open && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 rounded-lg">
            <div className="bg-white rounded-xl p-6 max-w-[380px] w-[90%] text-center">
              <h3 className="text-[15px] font-bold mb-1">{waitlistModal.typeName} — Proximamente</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">Estamos trabajando en este tipo. ¿Te avisamos cuando este disponible?</p>
              {waitlistSent ? (
                <p className="text-sm text-green-600 font-semibold">Te avisaremos</p>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] mb-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setWaitlistModal({ open: false, typeName: '', typeKey: '' }); setWaitlistEmail(''); }} className="px-4 py-2 text-[13px] font-semibold text-slate-500 hover:text-slate-900">No, gracias</button>
                    <button onClick={handleWaitlistSubmit} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-blue-500 hover:bg-blue-600">Avisarme →</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Step 1: Tipo de instalación ────────────────────────────────

function Step1TipoInstalacion({
  state,
  update,
  onComingSoon,
}: {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
  onComingSoon: (name: string, key: string) => void;
}) {
  const available = INSTALLATION_TYPES.filter((t) => t.group === 'available');
  const comingSoon = INSTALLATION_TYPES.filter((t) => t.group === 'coming_soon');

  return (
    <div className="animate-in fade-in duration-250">
      <SectionLabel>Tipos de instalacion</SectionLabel>
      <div className="grid grid-cols-4 max-sm:grid-cols-2 gap-2">
        {available.map((t) => (
          <TypeCard
            key={t.key}
            type={t}
            selected={state.selectedType === t.key}
            onClick={() => {
              const autoDoc = t.key === 'vivienda' ? ('MTD' as const) : (t.canMTD ? null : ('PROYECTO' as const));
              update({ selectedType: t.key, docType: autoDoc, expedienteType: null });
            }}
          />
        ))}
      </div>
      <SectionLabel className="mt-5">Proximamente</SectionLabel>
      <div className="grid grid-cols-4 max-sm:grid-cols-2 gap-2">
        {comingSoon.map((t) => (
          <TypeCard key={t.key} type={t} comingSoon onClick={() => onComingSoon(t.name, t.key)} />
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Documentación (MTD / Proyecto) ─────────────────────

function Step2Documentacion({
  state,
  update,
  typeObj,
  showHelp,
  setShowHelp,
}: {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
  typeObj: InstallationType;
  showHelp: boolean;
  setShowHelp: (v: boolean) => void;
}) {
  return (
    <div className="animate-in fade-in duration-250">
      <SectionLabel>Documentacion</SectionLabel>
      <div className="grid grid-cols-2 gap-2.5">
        <DocCard
          icon={<FileText className="w-6 h-6" />}
          title="Memoria Tecnica"
          desc="La genera CIE Platform."
          selected={state.docType === 'MTD'}
          onClick={() => update({ docType: 'MTD' })}
          compact
        />
        <DocCard
          icon={<BookOpen className="w-6 h-6" />}
          title="Proyecto Tecnico"
          desc={`Lo sube el tecnico. >${typeObj.threshold ?? 100} kW.`}
          selected={state.docType === 'PROYECTO'}
          onClick={() => update({ docType: 'PROYECTO' })}
          compact
        />
      </div>
      <button onClick={() => setShowHelp(!showHelp)} className="block mx-auto text-[10px] text-blue-500 hover:underline mt-1.5">
        ¿MTD o Proyecto?
      </button>
      {showHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2 text-xs text-blue-800 leading-relaxed animate-in fade-in duration-200">
          <strong>¿MTD o Proyecto?</strong><br /><br />
          {typeObj.help}<br /><br />
          <strong>Memoria Tecnica</strong> — La genera CIE Platform automaticamente.<br />
          <strong>Proyecto Tecnico</strong> — Lo sube el tecnico competente.
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Tipo de actuación ──────────────────────────────────

function Step3Actuacion({
  state,
  update,
}: {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
}) {
  const mainExp = state.expedienteType?.startsWith('AMPLIACION') ? 'ampliacion'
    : state.expedienteType?.startsWith('MODIFICACION') ? 'modificacion'
    : state.expedienteType === 'NUEVA' ? 'nueva' : null;

  const selectMain = (type: 'nueva' | 'ampliacion' | 'modificacion') => {
    if (type === 'nueva') update({ expedienteType: 'NUEVA' });
    else if (type === 'ampliacion') update({ expedienteType: 'AMPLIACION' });
    else update({ expedienteType: 'MODIFICACION' });
  };

  return (
    <div className="animate-in fade-in duration-250">
      <SectionLabel>Tipo de expediente</SectionLabel>
      <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-2">
        <ExpCard icon={<PlusCircle className="w-6 h-6" />} title="Nueva" desc="Instalacion nueva" selected={mainExp === 'nueva'} onClick={() => selectMain('nueva')} compact />
        <ExpCard icon={<Maximize2 className="w-6 h-6" />} title="Ampliacion" desc="Ampliar existente" selected={mainExp === 'ampliacion'} onClick={() => selectMain('ampliacion')} compact />
        <ExpCard icon={<Pencil className="w-6 h-6" />} title="Modificacion" desc="Modificar existente" selected={mainExp === 'modificacion'} onClick={() => selectMain('modificacion')} compact />
      </div>

      {mainExp === 'ampliacion' && (
        <div className="animate-in fade-in duration-200 mt-2">
          <SubOption label="Ampliacion" selected={state.expedienteType === 'AMPLIACION'} onClick={() => update({ expedienteType: 'AMPLIACION' })} />
          <SubOption label="Ampliacion con Cambio de Titular" selected={state.expedienteType === 'AMPLIACION_CAMBIO_TITULAR'} onClick={() => update({ expedienteType: 'AMPLIACION_CAMBIO_TITULAR' })} />
          <SubOption label="Ampliacion sin Instalacion" selected={state.expedienteType === 'AMPLIACION_SIN_INSTALACION'} onClick={() => update({ expedienteType: 'AMPLIACION_SIN_INSTALACION' })} />
        </div>
      )}
      {mainExp === 'modificacion' && (
        <div className="animate-in fade-in duration-200 mt-2">
          <SubOption label="Modificacion Instalacion" selected={state.expedienteType === 'MODIFICACION'} onClick={() => update({ expedienteType: 'MODIFICACION' })} />
          <SubOption label="Modificacion con Cambio de Titular" selected={state.expedienteType === 'MODIFICACION_CAMBIO_TITULAR'} onClick={() => update({ expedienteType: 'MODIFICACION_CAMBIO_TITULAR' })} />
          <SubOption label="Modificacion sin Instalacion" selected={state.expedienteType === 'MODIFICACION_SIN_INSTALACION'} onClick={() => update({ expedienteType: 'MODIFICACION_SIN_INSTALACION' })} />
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Datos del titular ──────────────────────────────────

function Step4Titular({
  state,
  update,
}: {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
}) {
  const docTypeOptions = [
    ...TIPO_DOCUMENTO_OPTIONS.map(o => ({ value: o.value, label: o.label })),
    { value: 'CIF', label: 'CIF' },
  ];

  return (
    <div className="animate-in fade-in duration-250">
      <FormSelect
        label="Tipo de documento"
        value={state.holderDocType}
        onChange={(v) => update({ holderDocType: v })}
        options={docTypeOptions}
      />
      <FormFieldUpper label="NIF / NIE / CIF" value={state.titularNif} onChange={(v) => update({ titularNif: v })} placeholder="12345678A" />
      <FormFieldUpper label="Nombre / Razon Social *" value={state.titularNombre} onChange={(v) => update({ titularNombre: v })} placeholder="Nombre" />
      <div className="grid grid-cols-2 gap-3">
        <FormFieldUpper label="Primer apellido *" value={state.titularApellido1} onChange={(v) => update({ titularApellido1: v })} placeholder="Apellido 1" />
        <FormFieldUpper label="Segundo apellido" value={state.titularApellido2} onChange={(v) => update({ titularApellido2: v })} placeholder="Apellido 2" />
      </div>
      <FormField label="Email" value={state.titularEmail} onChange={(v) => update({ titularEmail: v })} placeholder="titular@email.com" type="email" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Telefono" value={state.titularTelefono} onChange={(v) => update({ titularTelefono: v })} placeholder="912345678" />
        <FormField label="Movil" value={state.titularMovil} onChange={(v) => update({ titularMovil: v })} placeholder="612345678" />
      </div>
      <p className="text-[11px] text-slate-400 -mt-1">* Al menos uno de telefono o movil es obligatorio</p>
    </div>
  );
}

// ─── Step 5: Dirección ──────────────────────────────────────────

function Step5Direccion({
  state,
  update,
}: {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
}) {
  return (
    <div className="animate-in fade-in duration-250">
      <div className="text-xs font-semibold text-slate-500 mb-2">Direccion del titular</div>
      <div className="grid grid-cols-3 gap-3">
        <FormSelect label="Tipo de via" value={state.titularTipoVia} onChange={(v) => update({ titularTipoVia: v })} options={[{value:'',label:'Seleccionar'}, ...TIPOS_VIA_CIE.map(t => ({value:t.value,label:t.label}))]} />
        <FormFieldUpper label="Nombre via *" value={state.titularNombreVia} onChange={(v) => update({ titularNombreVia: v })} placeholder="Ejemplo" />
        <FormFieldUpper label="Numero" value={state.titularNumero} onChange={(v) => update({ titularNumero: v })} placeholder="1" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <FormFieldUpper label="Bloque" value={state.titularBloque} onChange={(v) => update({ titularBloque: v })} placeholder="" />
        <FormFieldUpper label="Escalera" value={state.titularEscalera} onChange={(v) => update({ titularEscalera: v })} placeholder="" />
        <FormFieldUpper label="Piso" value={state.titularPiso} onChange={(v) => update({ titularPiso: v })} placeholder="" />
        <FormFieldUpper label="Puerta" value={state.titularPuerta} onChange={(v) => update({ titularPuerta: v })} placeholder="" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="mb-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Municipio *</label>
          <LocalidadCombobox value={state.titularLocalidad} onChange={(v) => update({ titularLocalidad: v })} placeholder="Buscar municipio..." />
        </div>
        <FormField label="Codigo postal" value={state.titularCp} onChange={(v) => update({ titularCp: v })} placeholder="28001" />
      </div>

      <label className="flex items-center gap-2 my-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={state.mismaDir}
          onChange={(e) => update({ mismaDir: e.target.checked })}
          className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500/20"
        />
        <span className="text-[13px] font-medium text-slate-700">El emplazamiento es la misma direccion que el titular</span>
      </label>

      {!state.mismaDir && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-xs font-semibold text-slate-500 mb-2 mt-1">Direccion del emplazamiento</div>
          <div className="grid grid-cols-3 gap-3">
            <FormSelect label="Tipo de via" value={state.emplazTipoVia} onChange={(v) => update({ emplazTipoVia: v })} options={[{value:'',label:'Seleccionar'}, ...TIPOS_VIA_CIE.map(t => ({value:t.value,label:t.label}))]} />
            <FormFieldUpper label="Nombre via *" value={state.emplazNombreVia} onChange={(v) => update({ emplazNombreVia: v })} placeholder="Ejemplo" />
            <FormFieldUpper label="Numero" value={state.emplazNumero} onChange={(v) => update({ emplazNumero: v })} placeholder="1" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <FormFieldUpper label="Bloque" value={state.emplazBloque} onChange={(v) => update({ emplazBloque: v })} placeholder="" />
            <FormFieldUpper label="Escalera" value={state.emplazEscalera} onChange={(v) => update({ emplazEscalera: v })} placeholder="" />
            <FormFieldUpper label="Piso" value={state.emplazPiso} onChange={(v) => update({ emplazPiso: v })} placeholder="" />
            <FormFieldUpper label="Puerta" value={state.emplazPuerta} onChange={(v) => update({ emplazPuerta: v })} placeholder="" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Municipio</label>
              <LocalidadCombobox value={state.emplazLocalidad} onChange={(v) => update({ emplazLocalidad: v })} placeholder="Buscar municipio..." />
            </div>
            <FormField label="Codigo postal" value={state.emplazCp} onChange={(v) => update({ emplazCp: v })} placeholder="28001" />
          </div>
        </div>
      )}

      <FormFieldUpper label="CUPS" value={state.cups} onChange={(v) => update({ cups: v })} placeholder="ES0021..." optional />
    </div>
  );
}

// ─── Step 6: Datos técnicos ─────────────────────────────────────

function Step6Tecnico({
  state,
  update,
  typeObj,
  error,
}: {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
  typeObj: InstallationType;
  error: string | null;
}) {
  const Icon = typeObj.icon;

  return (
    <div className="animate-in fade-in duration-250">
      {/* Summary header */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
        <Icon className="w-6 h-6 flex-shrink-0 text-slate-700" strokeWidth={1.2} />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold">{typeObj.name}</div>
          <div className="text-[11px] text-slate-500">{typeObj.sub}</div>
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-500 border border-blue-200">
            {state.docType === 'MTD' ? 'MTD' : 'Proyecto'}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-500 border border-emerald-200">
            {EXPEDIENTE_LABELS[state.expedienteType ?? ''] ?? state.expedienteType}
          </span>
        </div>
      </div>

      <FormSelect
        label="Distribuidora"
        value={state.distribuidora}
        onChange={(v) => update({ distribuidora: v })}
        options={DISTRIBUIDORA_OPTIONS}
      />
      <FormSelect
        label="Tension de suministro"
        value={state.supplyVoltage}
        onChange={(v) => update({ supplyVoltage: v })}
        options={[
          { value: '230', label: '230V monofasico' },
          { value: '400', label: '400V trifasico' },
        ]}
      />

      {/* Type-specific technical fields */}
      {state.selectedType === 'vivienda' && (
        <FormSelect
          label="Grado de electrificacion"
          value={state.electrificacion}
          onChange={(v) => update({ electrificacion: v })}
          options={[
            { value: 'BASICO', label: 'Basica — 5.750 W' },
            { value: 'ELEVADO', label: 'Elevada — 9.200 W' },
          ]}
        />
      )}
      {state.selectedType === 'irve' && (
        <>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">N° puntos de recarga</label>
            <input
              type="number"
              min={1}
              value={state.puntosRecarga}
              onChange={(e) => update({ puntosRecarga: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
          <FormSelect
            label="Esquema IVE"
            value={state.esquemaIve}
            onChange={(v) => update({ esquemaIve: v })}
            options={[
              { value: '4a', label: '4a' },
              { value: '4b', label: '4b' },
            ]}
          />
        </>
      )}
      {state.selectedType === 'autoconsumo' && (
        <>
          <FormField label="Potencia pico (kWp)" value={state.potenciaPico} onChange={(v) => update({ potenciaPico: v })} placeholder="4.5" type="number" />
          <FormSelect
            label="Modalidad"
            value={state.modalidadAutoconsumo}
            onChange={(v) => update({ modalidadAutoconsumo: v })}
            options={[
              { value: 'sin_excedentes', label: 'Sin excedentes' },
              { value: 'con_excedentes_acogida', label: 'Con excedentes acogida a compensacion' },
              { value: 'con_excedentes_no_acogida', label: 'Con excedentes no acogida' },
            ]}
          />
        </>
      )}

      <FormField label="Referencia" optional value={state.referencia} onChange={(v) => update({ referencia: v })} placeholder="Ej: EXP-2026-042, Reforma Piso 3B..." />

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}

// ─── Shared sub-components ──────────────────────────────────────

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 my-2.5 ${className}`}>
      {children}
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function TypeCard({
  type,
  selected,
  comingSoon,
  onClick,
}: {
  type: InstallationType;
  selected?: boolean;
  comingSoon?: boolean;
  onClick: () => void;
}) {
  const Icon = type.icon;
  if (comingSoon) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative border border-dashed border-slate-300 rounded-lg p-3.5 text-center opacity-45 hover:opacity-65 hover:bg-white transition-all cursor-pointer"
      >
        <span className="absolute top-1 right-1 bg-amber-100 text-amber-600 text-[7px] font-semibold px-1 py-px rounded">Proximamente</span>
        <Icon className="w-6 h-6 mx-auto mb-1.5 text-slate-500" strokeWidth={1.2} />
        <div className="text-[11px] font-semibold text-slate-700 leading-tight">{type.name}</div>
        <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{type.sub}</div>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border rounded-lg p-3.5 text-center transition-all cursor-pointer
        ${selected
          ? 'border-blue-500 bg-blue-50/50 shadow-[0_0_0_2px_rgba(59,130,246,0.12)]'
          : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50/50'}
      `}
    >
      <Icon className={`w-6 h-6 mx-auto mb-1.5 transition-colors ${selected ? 'text-blue-500' : 'text-slate-500'}`} strokeWidth={1.2} />
      <div className="text-[11px] font-semibold text-slate-700 leading-tight">{type.name}</div>
      <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{type.sub}</div>
    </button>
  );
}

function DocCard({
  icon,
  title,
  desc,
  selected,
  onClick,
  compact,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 rounded-xl ${compact ? 'p-3.5' : 'p-5'} text-center transition-all cursor-pointer
        ${selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 hover:-translate-y-px'}
      `}
    >
      <div className={`mx-auto ${compact ? 'mb-1' : 'mb-2'} ${selected ? 'text-blue-500' : 'text-slate-700'}`}>{icon}</div>
      <div className={`${compact ? 'text-[12px]' : 'text-sm'} font-bold mb-0.5`}>{title}</div>
      <div className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-slate-500 leading-snug`}>{desc}</div>
    </button>
  );
}

function ExpCard({
  icon,
  title,
  desc,
  selected,
  onClick,
  compact,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 rounded-xl ${compact ? 'p-3' : 'p-5'} text-center transition-all cursor-pointer
        ${selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 hover:-translate-y-px'}
      `}
    >
      <div className={`mx-auto ${compact ? 'mb-1' : 'mb-2'} transition-colors ${selected ? 'text-blue-500' : 'text-slate-500'}`}>{icon}</div>
      <div className={`${compact ? 'text-[12px]' : 'text-sm'} font-bold mb-0.5`}>{title}</div>
      <div className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-slate-500 leading-snug`}>{desc}</div>
    </button>
  );
}

function SubOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3.5 py-2.5 border rounded-lg cursor-pointer transition-all mb-1.5 text-[13px] text-left
        ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/30'}
      `}
    >
      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 relative transition-colors ${selected ? 'border-blue-500' : 'border-slate-300'}`}>
        {selected && <div className="absolute top-[3px] left-[3px] w-1.5 h-1.5 rounded-full bg-blue-500" />}
      </div>
      {label}
    </button>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  optional,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  type?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label} {optional && <span className="font-normal text-slate-400">(opcional)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
      />
    </div>
  );
}

function FormFieldUpper({
  label,
  value,
  onChange,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label} {optional && <span className="font-normal text-slate-400">(opcional)</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] uppercase focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
