'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { NODE_TYPE_CONFIG, NODE_ICON_MAP, ROOT_ALLOWED_TYPES } from './node-type-config';
import type { PanelNodeType, CreatePanelNodeDto } from '@/lib/types';

const CALIBRE_OPTIONS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100];
const POLOS_OPTIONS = ['2', '3', '4'];
const CURVA_OPTIONS = ['B', 'C', 'D'];
const SENSITIVITY_OPTIONS = [10, 30, 100, 300, 500];
const DIFF_TYPE_OPTIONS = ['AC', 'A', 'B', 'F'];
const CONTACTOR_TYPE_OPTIONS = [
  { value: 'HORARIO', label: 'Horario' },
  { value: 'MANIOBRA', label: 'Maniobra' },
  { value: 'POTENCIA', label: 'Potencia' },
];

interface AddNodeDialogProps {
  open: boolean;
  onClose: () => void;
  parentId: string | null;
  parentType: PanelNodeType | null;
  parentName: string | null;
  existingRootTypes: PanelNodeType[];
  onConfirm: (data: CreatePanelNodeDto) => void;
  isCreating: boolean;
}

export function AddNodeDialog({
  open,
  onClose,
  parentId,
  parentType,
  parentName,
  existingRootTypes,
  onConfirm,
  isCreating,
}: AddNodeDialogProps) {
  const [selectedType, setSelectedType] = useState<PanelNodeType | null>(null);
  const [name, setName] = useState('');
  const [calibreA, setCalibreA] = useState('');
  const [polos, setPolos] = useState('');
  const [curva, setCurva] = useState('');
  const [poderCorteKa, setPoderCorteKa] = useState('');
  const [sensitivityMa, setSensitivityMa] = useState('');
  const [diffType, setDiffType] = useState('');
  const [subcuadroName, setSubcuadroName] = useState('');
  const [contactorType, setContactorType] = useState('');
  const [loadType, setLoadType] = useState('');

  // Determine allowed types
  let allowedTypes: PanelNodeType[];
  if (parentType && parentId) {
    allowedTypes = NODE_TYPE_CONFIG[parentType].allowedChildTypes;
  } else {
    // Root level: filter out IGA if one already exists
    allowedTypes = ROOT_ALLOWED_TYPES.filter((t) => {
      if (t === 'IGA' && existingRootTypes.includes('IGA')) return false;
      return true;
    });
  }

  const resetForm = () => {
    setSelectedType(null);
    setName('');
    setCalibreA('');
    setPolos('');
    setCurva('');
    setPoderCorteKa('');
    setSensitivityMa('');
    setDiffType('');
    setSubcuadroName('');
    setContactorType('');
    setLoadType('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleConfirm = () => {
    if (!selectedType) return;

    const dto: CreatePanelNodeDto = {
      nodeType: selectedType,
      parentId: parentId || undefined,
      name: name || undefined,
    };

    // Add type-specific fields
    if (['IGA', 'AUTOMATICO', 'GUARDAMOTOR'].includes(selectedType)) {
      if (calibreA) dto.calibreA = Number(calibreA);
      if (polos) dto.polos = Number(polos);
      if (curva) dto.curva = curva;
      if (poderCorteKa) dto.poderCorteKa = Number(poderCorteKa);
    }

    if (selectedType === 'DIFERENCIAL') {
      if (calibreA) dto.calibreA = Number(calibreA);
      if (polos) dto.polos = Number(polos);
      if (sensitivityMa) dto.sensitivityMa = Number(sensitivityMa);
      if (diffType) dto.diffType = diffType;
    }

    if (selectedType === 'SUBCUADRO') {
      if (subcuadroName) dto.subcuadroName = subcuadroName;
    }

    if (selectedType === 'CONTACTOR') {
      if (calibreA) dto.calibreA = Number(calibreA);
      if (contactorType) dto.contactorType = contactorType;
    }

    if (selectedType === 'CIRCUITO') {
      if (loadType) dto.loadType = loadType;
    }

    onConfirm(dto);
    resetForm();
  };

  const title = parentName ? `Añadir bajo "${parentName}"` : 'Añadir nodo raíz';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-surface-600">Tipo de elemento</Label>
            <div className="grid grid-cols-2 gap-2">
              {allowedTypes.map((type) => {
                const cfg = NODE_TYPE_CONFIG[type];
                const IconComponent = NODE_ICON_MAP[cfg.icon];
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${
                      selectedType === type
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                        : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                    }`}
                  >
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium ${cfg.color}`}>
                      {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
                      {cfg.shortLabel}
                    </span>
                    <span className="text-xs text-surface-600 truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fields based on selected type */}
          {selectedType && (
            <div className="space-y-3 border-t border-surface-100 pt-3">
              {/* Name — always shown */}
              <div className="space-y-1">
                <Label htmlFor="node-name" className="text-xs">Nombre (opcional)</Label>
                <Input
                  id="node-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={NODE_TYPE_CONFIG[selectedType].label}
                  className="h-8 text-sm"
                />
              </div>

              {/* IGA / AUTOMATICO / GUARDAMOTOR fields */}
              {['IGA', 'AUTOMATICO', 'GUARDAMOTOR'].includes(selectedType) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Calibre (A)</Label>
                    <Select value={calibreA} onValueChange={setCalibreA}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {CALIBRE_OPTIONS.map((v) => (
                          <SelectItem key={v} value={String(v)}>{v} A</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Polos</Label>
                    <Select value={polos} onValueChange={setPolos}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {POLOS_OPTIONS.map((v) => (
                          <SelectItem key={v} value={v}>{v}P</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Curva</Label>
                    <Select value={curva} onValueChange={setCurva}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURVA_OPTIONS.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Poder de corte (kA)</Label>
                    <Input
                      type="number"
                      value={poderCorteKa}
                      onChange={(e) => setPoderCorteKa(e.target.value)}
                      placeholder="6"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* DIFERENCIAL fields */}
              {selectedType === 'DIFERENCIAL' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Calibre (A)</Label>
                    <Select value={calibreA} onValueChange={setCalibreA}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {CALIBRE_OPTIONS.map((v) => (
                          <SelectItem key={v} value={String(v)}>{v} A</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Polos</Label>
                    <Select value={polos} onValueChange={setPolos}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2P</SelectItem>
                        <SelectItem value="4">4P</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sensibilidad (mA)</Label>
                    <Select value={sensitivityMa} onValueChange={setSensitivityMa}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {SENSITIVITY_OPTIONS.map((v) => (
                          <SelectItem key={v} value={String(v)}>{v} mA</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={diffType} onValueChange={setDiffType}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFF_TYPE_OPTIONS.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* SUBCUADRO fields */}
              {selectedType === 'SUBCUADRO' && (
                <div className="space-y-1">
                  <Label className="text-xs">Nombre del subcuadro</Label>
                  <Input
                    value={subcuadroName}
                    onChange={(e) => setSubcuadroName(e.target.value)}
                    placeholder="Subcuadro 1"
                    className="h-8 text-sm"
                  />
                </div>
              )}

              {/* CONTACTOR fields */}
              {selectedType === 'CONTACTOR' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Calibre (A)</Label>
                    <Select value={calibreA} onValueChange={setCalibreA}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {CALIBRE_OPTIONS.map((v) => (
                          <SelectItem key={v} value={String(v)}>{v} A</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo contactor</Label>
                    <Select value={contactorType} onValueChange={setContactorType}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACTOR_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* CIRCUITO fields */}
              {selectedType === 'CIRCUITO' && (
                <div className="space-y-1">
                  <Label className="text-xs">Tipo de carga</Label>
                  <Select value={loadType} onValueChange={setLoadType}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FUERZA">Fuerza</SelectItem>
                      <SelectItem value="ALUMBRADO">Alumbrado</SelectItem>
                      <SelectItem value="ALUMBRADO_EMERGENCIA">Alumbrado emergencia</SelectItem>
                      <SelectItem value="MOTOR">Motor</SelectItem>
                      <SelectItem value="RESISTIVO">Resistivo</SelectItem>
                      <SelectItem value="IRVE">IRVE</SelectItem>
                      <SelectItem value="DOMOTICA">Domótica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!selectedType || isCreating}
          >
            {isCreating ? 'Creando...' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
