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
import { TIPO_VIA_OPTIONS } from '@/lib/portal-constants';
import {
  INSTALLATION_TYPES,
  EXPEDIENTE_LABELS,
  type InstallationType,
} from '@/lib/installation-types';

// ─── Props (unchanged interface) ───────────────────────────────────

interface NewInstallationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateInstallationDto) => Promise<void>;
}

// ─── Wizard state ──────────────────────────────────────────────────

interface WizardState {
  step: number;
  selectedType: string | null;
  docType: 'MTD' | 'PROYECTO' | null;
  expedienteType: string | null;
  titularNombre: string;
  titularApellido1: string;
  titularApellido2: string;
  // Dirección del titular
  titularTipoVia: string;
  titularNombreVia: string;
  titularNumero: string;
  titularCp: string;
  titularLocalidad: string;
  referencia: string;
  // Extra fields
  electrificacion: string;
  puntosRecarga: number;
  esquemaIve: string;
  potenciaPico: string;
  modalidadAutoconsumo: string;
}

// Tipos de vía — lista oficial portal ASEICAM (sustituye la del Excel CIE)
const TIPOS_VIA_CIE = TIPO_VIA_OPTIONS;

const INITIAL_STATE: WizardState = {
  step: 1,
  selectedType: null,
  docType: null,
  expedienteType: null,
  titularNombre: '',
  titularApellido1: '',
  titularApellido2: '',
  titularTipoVia: '',
  titularNombreVia: '',
  titularNumero: '',
  titularCp: '',
  titularLocalidad: '',
  referencia: '',
  electrificacion: 'BASICO',
  puntosRecarga: 1,
  esquemaIve: '4a',
  potenciaPico: '',
  modalidadAutoconsumo: 'sin_excedentes',
};

const STEP_SUBTITLES = [
  '¿Que vas a instalar?',
  'Tipo de documentacion',
  'Tipo de expediente',
  'Resumen y datos basicos',
];

// ─── Component ─────────────────────────────────────────────────────

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
      case 4: return !!state.titularNombre.trim() && !!state.titularNombreVia.trim() && !!state.titularLocalidad.trim();
      default: return false;
    }
  };

  const nextLabel = (): string => {
    switch (state.step) {
      case 1: return state.selectedType ? 'Siguiente →' : 'Selecciona un tipo';
      case 2: return state.docType ? 'Siguiente →' : 'Elige documentacion';
      case 3: return state.expedienteType ? 'Siguiente →' : 'Elige tipo de expediente';
      case 4: return 'Crear instalacion →';
      default: return 'Siguiente →';
    }
  };

  const goNext = () => {
    if (state.step === 2 && !state.docType && selectedTypeObj && !selectedTypeObj.canMTD) {
      // Auto-set forced proyecto
      update({ docType: 'PROYECTO' });
    }
    if (state.step < 4) {
      const nextStep = state.step + 1;
      // On entering step 2, auto-set PROYECTO if forced
      if (nextStep === 2 && selectedTypeObj && !selectedTypeObj.canMTD) {
        update({ step: nextStep, docType: 'PROYECTO' });
      } else if (nextStep === 2) {
        update({ step: nextStep, docType: null });
        setShowHelp(false);
      } else {
        update({ step: nextStep });
      }
    } else {
      handleCreate();
    }
  };

  const goBack = () => {
    if (state.step > 1) update({ step: state.step - 1 });
  };

  const handleCreate = async () => {
    if (!state.titularNombre.trim() || !state.titularNombreVia.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const fullName = [state.titularNombre, state.titularApellido1, state.titularApellido2].filter(Boolean).map(s => s.trim()).filter(Boolean).join(' ');
      const dto: CreateInstallationDto = {
        titularName: fullName,
        titularNombre: state.titularNombre.trim() || undefined,
        titularApellido1: state.titularApellido1.trim() || undefined,
        titularApellido2: state.titularApellido2.trim() || undefined,
        titularTipoVia: state.titularTipoVia || undefined,
        titularNombreVia: state.titularNombreVia.trim() || undefined,
        titularNumero: state.titularNumero.trim() || undefined,
        titularCp: state.titularCp.trim() || undefined,
        titularLocalidad: state.titularLocalidad.trim() || undefined,
        address: [state.titularTipoVia, state.titularNombreVia, state.titularNumero].filter(Boolean).join(' ').trim() + (state.titularCp ? `, ${state.titularCp}` : '') + (state.titularLocalidad ? ` ${state.titularLocalidad}` : '') || undefined,
        tipoDocumentacion: state.docType ?? undefined,
        installationType: state.selectedType ?? undefined,
        expedienteType: state.expedienteType ?? undefined,
        referencia: state.referencia.trim() || undefined,
      };

      // Type-specific extra fields
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
      // silently ignore
      setWaitlistModal({ open: false, typeName: '', typeKey: '' });
    }
  };

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
        <div className="px-7 pt-1 pb-5 text-[13px] text-slate-500">{STEP_SUBTITLES[state.step - 1]}</div>

        {/* Stepper */}
        <div className="flex gap-1.5 px-7 pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex-1 h-[3px] rounded-sm transition-colors duration-300 ${i <= state.step ? 'bg-blue-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        {/* Step content */}
        <div className="px-7 pb-7 max-h-[60vh] overflow-y-auto">
          {state.step === 1 && <Step1 state={state} update={update} onComingSoon={(name, key) => setWaitlistModal({ open: true, typeName: name, typeKey: key })} />}
          {state.step === 2 && <Step2 state={state} update={update} typeObj={selectedTypeObj!} showHelp={showHelp} setShowHelp={setShowHelp} />}
          {state.step === 3 && <Step3 state={state} update={update} typeObj={selectedTypeObj!} />}
          {state.step === 4 && <Step4 state={state} update={update} typeObj={selectedTypeObj!} error={error} />}
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

// ─── Step 1: ¿Que vas a instalar? ──────────────────────────────────

function Step1({
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
            onClick={() => update({ selectedType: t.key, docType: null, expedienteType: null })}
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

// ─── Step 2: MTD o Proyecto ────────────────────────────────────────

function Step2({
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
  const Icon = typeObj.icon;

  return (
    <div className="animate-in fade-in duration-250">
      {/* Context bar */}
      <div className="text-center p-4 bg-slate-50 rounded-xl mb-5">
        <Icon className="w-6 h-6 mx-auto mb-1.5 text-slate-700" strokeWidth={1.2} />
        <div className="text-base font-bold">{typeObj.name}</div>
        <div className="text-xs text-slate-500">{typeObj.sub}</div>
      </div>

      {typeObj.canMTD ? (
        <>
          <p className="text-center text-sm font-semibold mb-3">¿Que documentacion vas a presentar?</p>
          <div className="grid grid-cols-2 gap-3 my-4">
            <DocCard
              icon={<FileText className="w-7 h-7" />}
              title="Memoria Tecnica"
              desc="La genera CIE Platform. Para la mayoria de instalaciones."
              selected={state.docType === 'MTD'}
              onClick={() => update({ docType: 'MTD' })}
            />
            <DocCard
              icon={<BookOpen className="w-7 h-7" />}
              title="Proyecto Tecnico"
              desc={`Lo sube el tecnico. Obligatorio para >${typeObj.threshold ?? 100} kW o LPC.`}
              selected={state.docType === 'PROYECTO'}
              onClick={() => update({ docType: 'PROYECTO' })}
            />
          </div>
          <button onClick={() => setShowHelp(!showHelp)} className="block mx-auto text-xs text-blue-500 hover:underline my-2">
            🔍 No estoy seguro, ¿cual necesito?
          </button>
          {showHelp && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 my-2.5 text-xs text-blue-800 leading-relaxed animate-in fade-in duration-200">
              <strong>¿MTD o Proyecto?</strong><br /><br />
              {typeObj.help}<br /><br />
              <strong>Memoria Tecnica</strong> — La genera CIE Platform automaticamente.<br />
              <strong>Proyecto Tecnico</strong> — Lo sube el tecnico competente.
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center opacity-30 cursor-default">
              <FileText className="w-7 h-7 mx-auto mb-2 text-slate-400" />
              <div className="text-sm font-bold text-slate-400">Memoria Tecnica</div>
              <div className="text-[11px] text-slate-500">No disponible para este tipo.</div>
            </div>
            <div className="border-2 border-blue-500 bg-blue-50 rounded-xl p-5 text-center">
              <BookOpen className="w-7 h-7 mx-auto mb-2 text-blue-500" />
              <div className="text-sm font-bold">Proyecto Tecnico</div>
              <div className="text-[11px] text-slate-500">{typeObj.reason}</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-4 text-center my-3.5">
            <div className="text-[13px] font-bold text-blue-700 mb-1">Sube tu Proyecto, nosotros generamos el resto</div>
            <div className="text-[11px] text-blue-500 leading-relaxed">CIE, Solicitud BT y Esquema Unifilar automaticos a partir de tus datos.</div>
            <div className="text-xs font-semibold text-blue-700 mt-1.5 italic">Proximamente: genera el Proyecto completo en minutos con CIE Platform</div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step 3: Tipo de expediente ────────────────────────────────────

function Step3({
  state,
  update,
  typeObj,
}: {
  state: WizardState;
  update: (p: Partial<WizardState>) => void;
  typeObj: InstallationType;
}) {
  const Icon = typeObj.icon;
  const mainExp = state.expedienteType?.startsWith('AMPLIACION') ? 'ampliacion'
    : state.expedienteType?.startsWith('MODIFICACION') ? 'modificacion'
    : state.expedienteType === 'NUEVA' ? 'nueva' : null;

  const selectMain = (type: 'nueva' | 'ampliacion' | 'modificacion') => {
    if (type === 'nueva') {
      update({ expedienteType: 'NUEVA' });
    } else if (type === 'ampliacion') {
      update({ expedienteType: 'AMPLIACION' });
    } else {
      update({ expedienteType: 'MODIFICACION' });
    }
  };

  return (
    <div className="animate-in fade-in duration-250">
      {/* Context bar */}
      <div className="text-center p-4 bg-slate-50 rounded-xl mb-5">
        <Icon className="w-6 h-6 mx-auto mb-1.5 text-slate-700" strokeWidth={1.2} />
        <div className="text-base font-bold">{typeObj.name}</div>
        <div className="text-xs text-slate-500">{typeObj.sub}</div>
        <div className="text-xs font-semibold text-blue-500 mt-1">
          {state.docType === 'MTD' ? '📄 Memoria Tecnica' : '📋 Proyecto Tecnico'}
        </div>
      </div>

      <p className="text-center text-sm font-semibold mb-3.5">¿Que tipo de expediente?</p>

      <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-2.5 my-4">
        <ExpCard
          icon={<PlusCircle className="w-7 h-7" />}
          title="Nueva"
          desc="Instalacion completamente nueva"
          selected={mainExp === 'nueva'}
          onClick={() => selectMain('nueva')}
        />
        <ExpCard
          icon={<Maximize2 className="w-7 h-7" />}
          title="Ampliacion"
          desc="Ampliar instalacion existente"
          selected={mainExp === 'ampliacion'}
          onClick={() => selectMain('ampliacion')}
        />
        <ExpCard
          icon={<Pencil className="w-7 h-7" />}
          title="Modificacion"
          desc="Modificar instalacion existente"
          selected={mainExp === 'modificacion'}
          onClick={() => selectMain('modificacion')}
        />
      </div>

      {/* Sub-options ampliacion */}
      {mainExp === 'ampliacion' && (
        <div className="animate-in fade-in duration-200 my-3">
          <div className="text-xs font-semibold text-slate-700 mb-2">Tipo de ampliacion:</div>
          <SubOption label="Ampliacion" selected={state.expedienteType === 'AMPLIACION'} onClick={() => update({ expedienteType: 'AMPLIACION' })} />
          <SubOption label="Ampliacion con Cambio de Titular" selected={state.expedienteType === 'AMPLIACION_CAMBIO_TITULAR'} onClick={() => update({ expedienteType: 'AMPLIACION_CAMBIO_TITULAR' })} />
          <SubOption label="Ampliacion sin Instalacion" selected={state.expedienteType === 'AMPLIACION_SIN_INSTALACION'} onClick={() => update({ expedienteType: 'AMPLIACION_SIN_INSTALACION' })} />
        </div>
      )}

      {/* Sub-options modificacion */}
      {mainExp === 'modificacion' && (
        <div className="animate-in fade-in duration-200 my-3">
          <div className="text-xs font-semibold text-slate-700 mb-2">Tipo de modificacion:</div>
          <SubOption label="Modificacion Instalacion" selected={state.expedienteType === 'MODIFICACION'} onClick={() => update({ expedienteType: 'MODIFICACION' })} />
          <SubOption label="Modificacion con Cambio de Titular" selected={state.expedienteType === 'MODIFICACION_CAMBIO_TITULAR'} onClick={() => update({ expedienteType: 'MODIFICACION_CAMBIO_TITULAR' })} />
          <SubOption label="Modificacion sin Instalacion" selected={state.expedienteType === 'MODIFICACION_SIN_INSTALACION'} onClick={() => update({ expedienteType: 'MODIFICACION_SIN_INSTALACION' })} />
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Resumen + datos ───────────────────────────────────────

function Step4({
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
  const extraDocs = typeObj.extraDocs ?? [];

  return (
    <div className="animate-in fade-in duration-250">
      {/* Type summary header */}
      <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl mb-3.5">
        <Icon className="w-7 h-7 flex-shrink-0 text-slate-700" strokeWidth={1.2} />
        <div>
          <div className="text-[15px] font-semibold">{typeObj.name}</div>
          <div className="text-xs text-slate-500">{typeObj.sub}</div>
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5 my-2.5">
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-500 border border-blue-200">
          {state.docType === 'MTD' ? '📄 Memoria Tecnica' : '📋 Proyecto Tecnico'}
        </span>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-500 border border-emerald-200">
          {EXPEDIENTE_LABELS[state.expedienteType ?? ''] ?? state.expedienteType}
        </span>
        {extraDocs.map((d) => (
          <span key={d} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-200">{d}</span>
        ))}
      </div>

      {/* Doc list */}
      <div className="my-3.5 space-y-1">
        {state.docType === 'MTD' ? (
          <DocItem icon="check" color="green" text="Memoria Tecnica de Diseno (MTD) — generada automaticamente" />
        ) : (
          <DocItem icon="upload" color="amber" text="Proyecto Tecnico — lo subes tu" />
        )}
        <DocItem icon="check" color="green" text="Certificado de Instalacion Electrica (CIE)" />
        <DocItem icon="check" color="green" text="Solicitud de Suministro BT" />
        <DocItem icon="check" color="green" text="Esquema Unifilar" />
        {extraDocs.map((d) => (
          <DocItem key={d} icon="check" color="blue" text={d} />
        ))}
      </div>

      {/* Proyecto banner */}
      {state.docType === 'PROYECTO' && (
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-4 text-center my-3.5">
          <div className="text-[13px] font-bold text-blue-700 mb-1">Proximamente: genera tu Proyecto con CIE Platform</div>
          <div className="text-[11px] text-blue-500 leading-relaxed">Estamos trabajando para que puedas generar el Proyecto Tecnico automaticamente.</div>
        </div>
      )}

      <div className="h-px bg-slate-200 my-3.5" />

      {/* Form fields — Datos del titular */}
      <div className="text-xs font-semibold text-slate-500 mb-1">Datos del titular</div>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Nombre / Razon Social *" value={state.titularNombre} onChange={(v) => update({ titularNombre: v })} placeholder="Nombre" />
        <FormField label="Primer apellido" value={state.titularApellido1} onChange={(v) => update({ titularApellido1: v })} placeholder="Apellido 1" />
        <FormField label="Segundo apellido" value={state.titularApellido2} onChange={(v) => update({ titularApellido2: v })} placeholder="Apellido 2" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <FormSelect label="Tipo de via" value={state.titularTipoVia} onChange={(v) => update({ titularTipoVia: v })} options={[{value:'',label:'Seleccionar'}, ...TIPOS_VIA_CIE.map(t => ({value:t.value,label:t.label}))]} />
        <FormField label="Nombre via *" value={state.titularNombreVia} onChange={(v) => update({ titularNombreVia: v })} placeholder="Ejemplo" />
        <FormField label="Numero" value={state.titularNumero} onChange={(v) => update({ titularNumero: v })} placeholder="1" />
        <FormField label="Codigo Postal" value={state.titularCp} onChange={(v) => update({ titularCp: v })} placeholder="28001" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div className="mb-3"><label className="block text-xs font-semibold text-slate-700 mb-1">Municipio *</label><LocalidadCombobox value={state.titularLocalidad} onChange={(v) => update({ titularLocalidad: v })} placeholder="Buscar municipio..." /></div>
      </div>
      <FormField label="Referencia" optional value={state.referencia} onChange={(v) => update({ referencia: v })} placeholder="Ej: EXP-2026-042, Reforma Piso 3B..." />

      {/* Extra fields per type */}
      {state.selectedType === 'vivienda' && (
        <FormSelect
          label="Electrificacion"
          value={state.electrificacion}
          onChange={(v) => update({ electrificacion: v })}
          options={[
            { value: 'BASICO', label: 'Basica (C1-C5)' },
            { value: 'ELEVADO', label: 'Elevada (C1-C12)' },
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

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}

// ─── Shared sub-components ─────────────────────────────────────────

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
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 rounded-xl p-5 text-center transition-all cursor-pointer
        ${selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 hover:-translate-y-px'}
      `}
    >
      <div className={`mx-auto mb-2 ${selected ? 'text-blue-500' : 'text-slate-700'}`}>{icon}</div>
      <div className="text-sm font-bold mb-1">{title}</div>
      <div className="text-[11px] text-slate-500 leading-snug">{desc}</div>
    </button>
  );
}

function ExpCard({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 rounded-xl p-5 text-center transition-all cursor-pointer
        ${selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 hover:-translate-y-px'}
      `}
    >
      <div className={`mx-auto mb-2 transition-colors ${selected ? 'text-blue-500' : 'text-slate-500'}`}>{icon}</div>
      <div className="text-sm font-bold mb-1">{title}</div>
      <div className="text-[11px] text-slate-500 leading-snug">{desc}</div>
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

function DocItem({ icon, color, text }: { icon: 'check' | 'upload'; color: 'green' | 'amber' | 'blue'; text: string }) {
  const colorMap = { green: 'text-emerald-500', amber: 'text-amber-500', blue: 'text-blue-500' };
  return (
    <div className="flex items-center gap-2 py-1 text-[13px]">
      <span className={`font-bold ${colorMap[color]}`}>{icon === 'check' ? '✓' : '↑'}</span>
      <span>{text}</span>
    </div>
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
