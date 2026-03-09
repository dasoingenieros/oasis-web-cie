'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText, FolderOpen, HelpCircle } from 'lucide-react';
import type { CreateInstallationDto, SupplyType } from '@/lib/types';

const newInstallationSchema = z.object({
  titularName: z.string().min(1, 'Nombre del titular requerido'),
  address: z.string().min(1, 'Dirección del emplazamiento requerida'),
  supplyType: z.enum([
    'VIVIENDA_BASICA',
    'VIVIENDA_ELEVADA',
    'IRVE',
    'LOCAL_COMERCIAL',
  ]),
  tipoDocumentacion: z.enum(['MTD', 'PROYECTO']),
});

type NewInstallationForm = z.infer<typeof newInstallationSchema>;

interface NewInstallationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateInstallationDto) => Promise<void>;
}

const supplyTypes: Array<{ value: SupplyType; label: string; desc: string }> = [
  {
    value: 'VIVIENDA_BASICA',
    label: 'Vivienda básica',
    desc: 'Electrificación básica — C1 a C5',
  },
  {
    value: 'VIVIENDA_ELEVADA',
    label: 'Vivienda elevada',
    desc: 'Electrificación elevada — C1 a C12',
  },
  {
    value: 'IRVE',
    label: 'IRVE',
    desc: 'Punto de recarga vehículo eléctrico',
  },
  {
    value: 'LOCAL_COMERCIAL',
    label: 'Local comercial',
    desc: 'Local o actividad comercial',
  },
];

// ─── Mini asistente MTD vs Proyecto ───

function WizardHelper({ onResult }: { onResult: (tipo: 'MTD' | 'PROYECTO') => void }) {
  const [step, setStep] = useState(0);

  const questions = [
    { q: '¿La potencia prevista supera los 100 kW?', proyecto: true },
    { q: '¿Es un local de pública concurrencia (LPC)?', proyecto: true },
    { q: '¿Es una instalación con riesgo de incendio o explosión?', proyecto: true },
    { q: '¿Incluye líneas aéreas o subterráneas de alta tensión?', proyecto: true },
    { q: '¿Es una instalación industrial con potencia > 20 kW?', proyecto: true },
  ];

  const handleAnswer = (yes: boolean) => {
    if (yes && questions[step].proyecto) {
      onResult('PROYECTO');
      return;
    }
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onResult('MTD');
    }
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <p className="text-xs text-blue-600 font-medium">Pregunta {step + 1} de {questions.length}</p>
      <p className="text-sm text-blue-700 font-medium">{questions[step].q}</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => handleAnswer(true)}>Sí</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => handleAnswer(false)}>No</Button>
      </div>
    </div>
  );
}

export function NewInstallationDialog({
  open,
  onOpenChange,
  onSubmit,
}: NewInstallationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [tipoDoc, setTipoDoc] = useState<'MTD' | 'PROYECTO' | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NewInstallationForm>({
    resolver: zodResolver(newInstallationSchema),
    defaultValues: {
      supplyType: 'VIVIENDA_BASICA',
    },
  });

  const handleSelectTipoDoc = (tipo: 'MTD' | 'PROYECTO') => {
    setTipoDoc(tipo);
    setValue('tipoDocumentacion', tipo);
    setShowWizard(false);
  };

  const handleFormSubmit = async (data: NewInstallationForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(data);
      reset();
      setTipoDoc(null);
      setShowWizard(false);
      onOpenChange(false);
    } catch {
      setError('Error al crear la instalación. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setTipoDoc(null);
      setShowWizard(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva instalación</DialogTitle>
          <DialogDescription>
            Elige el tipo de documentación y los datos básicos.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 pt-2"
        >
          {/* PASO 1: TIPO DOCUMENTACIÓN */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de documentación *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectTipoDoc('MTD')}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  tipoDoc === 'MTD'
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50'
                }`}
              >
                <FileText className={`h-6 w-6 ${tipoDoc === 'MTD' ? 'text-blue-600' : 'text-surface-400'}`} />
                <span className={`text-sm font-semibold ${tipoDoc === 'MTD' ? 'text-blue-600' : 'text-surface-700'}`}>MTD</span>
                <span className="text-xs text-surface-500 text-center">Memoria Técnica de Diseño</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTipoDoc('PROYECTO')}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  tipoDoc === 'PROYECTO'
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50'
                }`}
              >
                <FolderOpen className={`h-6 w-6 ${tipoDoc === 'PROYECTO' ? 'text-blue-600' : 'text-surface-400'}`} />
                <span className={`text-sm font-semibold ${tipoDoc === 'PROYECTO' ? 'text-blue-600' : 'text-surface-700'}`}>Proyecto</span>
                <span className="text-xs text-surface-500 text-center">Proyecto Técnico</span>
              </button>
            </div>
            {!showWizard && (
              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                <HelpCircle className="h-3 w-3" />
                No estoy seguro, ayúdame a decidir
              </button>
            )}
            {showWizard && <WizardHelper onResult={handleSelectTipoDoc} />}
            {errors.tipoDocumentacion && (
              <p className="text-xs text-red-600">Selecciona el tipo de documentación</p>
            )}
          </div>

          {/* Aviso Proyecto */}
          {tipoDoc === 'PROYECTO' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-600 font-medium">Proyecto Técnico — Próximamente</p>
              <p className="text-xs text-amber-600 mt-1">La gestión de Proyectos Técnicos estará disponible en una próxima versión. Puedes crear la instalación para tenerla registrada.</p>
            </div>
          )}

          {/* PASO 2: DATOS BÁSICOS */}
          <div className="space-y-1.5">
            <Label htmlFor="titularName">Titular</Label>
            <Input
              id="titularName"
              placeholder="Nombre del titular"
              {...register('titularName')}
            />
            {errors.titularName && (
              <p className="text-xs text-red-600">
                {errors.titularName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección del emplazamiento</Label>
            <Input
              id="address"
              placeholder="C/ Ejemplo, 1, 28001 Madrid"
              {...register('address')}
            />
            {errors.address && (
              <p className="text-xs text-red-600">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de instalación</Label>
            <Select
              defaultValue="VIVIENDA_BASICA"
              onValueChange={(val) =>
                setValue('supplyType', val as SupplyType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                {supplyTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex flex-col">
                      <span>{t.label}</span>
                      <span className="text-xs text-surface-400">{t.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplyType && (
              <p className="text-xs text-red-600">
                {errors.supplyType.message}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 animate-fade-in">{error}</p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !tipoDoc}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando…
                </>
              ) : (
                'Crear instalación'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
