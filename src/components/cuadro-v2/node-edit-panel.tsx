'use client';

import { useState, useEffect } from 'react';
import { X, Save, ArrowUpDown, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
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
import { NODE_TYPE_CONFIG, NODE_ICON_MAP } from './node-type-config';
import type { TreeNodeData } from './tree-node';
import type { PanelNodeType, TreeValidationItem } from '@/lib/types';

interface NodeEditPanelProps {
  node: TreeNodeData;
  onSave: (nodeId: string, data: Record<string, unknown>) => Promise<void>;
  onMoveRequest: (nodeId: string) => void;
  onClose: () => void;
  validations?: TreeValidationItem[];
}

const CALIBRE_OPTIONS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160];
const PODER_CORTE_OPTIONS = [4.5, 6, 10, 15, 25, 50];
const SENSITIVITY_OPTIONS = [10, 30, 100, 300, 500];
const SECTION_OPTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

const POLOS_BY_TYPE: Record<string, string[]> = {
  IGA: ['2P', '3P', '4P'],
  AUTOMATICO: ['1P', '1P+N', '2P', '3P', '3P+N', '4P'],
  DIFERENCIAL: ['2P', '4P'],
  GUARDAMOTOR: ['3P'],
};

const CURVA_BY_TYPE: Record<string, string[]> = {
  IGA: ['B', 'C', 'D'],
  AUTOMATICO: ['B', 'C', 'D'],
  GUARDAMOTOR: ['D'],
};

const LOAD_TYPE_OPTIONS = ['Fuerza', 'Alumbrado', 'Alum.Emerg.', 'Motor', 'Resistivo', 'IRVE', 'Domótica'];
const DIFF_TYPE_OPTIONS = ['AC', 'A', 'B', 'F'];
const VOLTAGE_OPTIONS = [230, 400];
const PHASE_OPTIONS = ['1F', '3F'];
const CABLE_OPTIONS = ['H07V-K', 'H07Z1-K', 'RV-K', 'RZ1-K', 'EPR'];
const MATERIAL_OPTIONS = ['CU', 'AL'];
const INSTALL_METHOD_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C', 'D', 'E', 'F'];
const CONTACTOR_TYPE_OPTIONS = ['Horario', 'Maniobra', 'Potencia'];

// Map polos display values to numeric values and back
function polosToNumber(display: string): number {
  const map: Record<string, number> = { '1P': 1, '1P+N': 1, '2P': 2, '3P': 3, '3P+N': 3, '4P': 4 };
  return map[display] ?? parseInt(display);
}

function polosToDisplay(value: number | null, nodeType: PanelNodeType): string {
  if (value === null) return '';
  const options = POLOS_BY_TYPE[nodeType] || [];
  // Find matching display value
  for (const opt of options) {
    if (polosToNumber(opt) === value) return opt;
  }
  return `${value}P`;
}

function phasesToDisplay(value: number | null): string {
  if (value === null) return '';
  return value === 1 ? '1F' : '3F';
}

function phasesFromDisplay(display: string): number {
  return display === '1F' ? 1 : 3;
}

export function NodeEditPanel({ node, onSave, onMoveRequest, onClose, validations }: NodeEditPanelProps) {
  const config = NODE_TYPE_CONFIG[node.nodeType];
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(node.name || '');
  const [calibreA, setCalibreA] = useState<number | null>(node.calibreA);
  const [polos, setPolos] = useState(polosToDisplay(node.polos, node.nodeType));
  const [curva, setCurva] = useState(node.curva || '');
  const [poderCorteKa, setPoderCorteKa] = useState<number | null>(node.poderCorteKa);
  const [sensitivityMa, setSensitivityMa] = useState<number | null>(node.sensitivityMa);
  const [diffType, setDiffType] = useState(node.diffType || '');
  const [loadType, setLoadType] = useState(node.loadType || '');
  const [power, setPower] = useState<number | null>(node.power);
  const [voltage, setVoltage] = useState<number | null>(node.voltage);
  const [phases, setPhases] = useState(phasesToDisplay(node.phases));
  const [cosPhi, setCosPhi] = useState<number | null>(node.cosPhi);
  const [length, setLength] = useState<number | null>(node.length);
  const [section, setSection] = useState<number | null>(node.section);
  const [cableType, setCableType] = useState(node.cableType || '');
  const [material, setMaterial] = useState(node.material || '');
  const [installMethod, setInstallMethod] = useState(node.installMethod || '');
  const [quantity, setQuantity] = useState<number | null>(node.quantity);
  const [subcuadroName, setSubcuadroName] = useState(node.subcuadroName || '');
  const [contactorType, setContactorType] = useState(node.contactorType || '');

  // Reset form when node changes
  useEffect(() => {
    setName(node.name || '');
    setCalibreA(node.calibreA);
    setPolos(polosToDisplay(node.polos, node.nodeType));
    setCurva(node.curva || '');
    setPoderCorteKa(node.poderCorteKa);
    setSensitivityMa(node.sensitivityMa);
    setDiffType(node.diffType || '');
    setLoadType(node.loadType || '');
    setPower(node.power);
    setVoltage(node.voltage);
    setPhases(phasesToDisplay(node.phases));
    setCosPhi(node.cosPhi);
    setLength(node.length);
    setSection(node.section);
    setCableType(node.cableType || '');
    setMaterial(node.material || '');
    setInstallMethod(node.installMethod || '');
    setQuantity(node.quantity);
    setSubcuadroName(node.subcuadroName || '');
    setContactorType(node.contactorType || '');
  }, [node.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, unknown> = { name: name || null };

      const type = node.nodeType;

      if (['IGA', 'AUTOMATICO', 'GUARDAMOTOR'].includes(type)) {
        data.calibreA = calibreA;
        data.polos = polos ? polosToNumber(polos) : null;
        data.curva = curva || null;
        data.poderCorteKa = poderCorteKa;
      }

      if (type === 'DIFERENCIAL') {
        data.calibreA = calibreA;
        data.polos = polos ? polosToNumber(polos) : null;
        data.sensitivityMa = sensitivityMa;
        data.diffType = diffType || null;
      }

      if (type === 'CONTACTOR') {
        data.calibreA = calibreA;
        data.contactorType = contactorType || null;
      }

      if (type === 'SUBCUADRO') {
        data.subcuadroName = subcuadroName || null;
      }

      if (type === 'CIRCUITO') {
        data.loadType = loadType || null;
        data.power = power;
        data.voltage = voltage;
        data.phases = phases ? phasesFromDisplay(phases) : null;
        data.cosPhi = cosPhi;
        data.length = length;
        data.section = section;
        data.cableType = cableType || null;
        data.material = material || null;
        data.installMethod = installMethod || null;
        data.quantity = quantity;
      }

      await onSave(node.id, data);
      showToast('Guardado correctamente');
    } catch {
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const renderSelect = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: (string | number)[],
    unit?: string,
  ) => (
    <div className="space-y-1">
      <Label className="text-xs text-surface-500">{label}{unit ? ` (${unit})` : ''}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={String(opt)} value={String(opt)}>
              {String(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderNumberInput = (
    label: string,
    value: number | null,
    onChange: (v: number | null) => void,
    opts?: { unit?: string; step?: number; min?: number },
  ) => (
    <div className="space-y-1">
      <Label className="text-xs text-surface-500">{label}{opts?.unit ? ` (${opts.unit})` : ''}</Label>
      <Input
        type="number"
        className="h-8 text-sm"
        value={value ?? ''}
        step={opts?.step}
        min={opts?.min}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      />
    </div>
  );

  const renderProtectionFields = () => {
    const type = node.nodeType;
    const polosOptions = POLOS_BY_TYPE[type] || [];
    const curvaOptions = CURVA_BY_TYPE[type] || [];

    return (
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-surface-600 uppercase tracking-wide">Protección</h4>
        <div className="grid grid-cols-2 gap-3">
          {renderSelect('Calibre', calibreA != null ? String(calibreA) : '', (v) => setCalibreA(Number(v)), CALIBRE_OPTIONS, 'A')}
          {polosOptions.length > 0 && renderSelect('Polos', polos, setPolos, polosOptions)}
          {curvaOptions.length > 0 && renderSelect('Curva', curva, setCurva, curvaOptions)}
          {type !== 'GUARDAMOTOR' && renderSelect('P. Corte', poderCorteKa != null ? String(poderCorteKa) : '', (v) => setPoderCorteKa(Number(v)), PODER_CORTE_OPTIONS, 'kA')}
        </div>
      </div>
    );
  };

  const renderDifferentialFields = () => (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-surface-600 uppercase tracking-wide">Diferencial</h4>
      <div className="grid grid-cols-2 gap-3">
        {renderSelect('Calibre', calibreA != null ? String(calibreA) : '', (v) => setCalibreA(Number(v)), CALIBRE_OPTIONS, 'A')}
        {renderSelect('Polos', polos, setPolos, POLOS_BY_TYPE['DIFERENCIAL'] || [])}
        {renderSelect('Sensibilidad', sensitivityMa != null ? String(sensitivityMa) : '', (v) => setSensitivityMa(Number(v)), SENSITIVITY_OPTIONS, 'mA')}
        {renderSelect('Tipo', diffType, setDiffType, DIFF_TYPE_OPTIONS)}
      </div>
    </div>
  );

  const renderCircuitFields = () => (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-surface-600 uppercase tracking-wide">Circuito</h4>
      <div className="grid grid-cols-2 gap-3">
        {renderSelect('Tipo carga', loadType, setLoadType, LOAD_TYPE_OPTIONS)}
        {renderNumberInput('Potencia', power, setPower, { unit: 'W' })}
        {renderSelect('Tensión', voltage != null ? String(voltage) : '', (v) => setVoltage(Number(v)), VOLTAGE_OPTIONS, 'V')}
        {renderSelect('Fases', phases, setPhases, PHASE_OPTIONS)}
        {renderNumberInput('cos φ', cosPhi, setCosPhi, { step: 0.01, min: 0 })}
        {renderNumberInput('Longitud', length, setLength, { unit: 'm', step: 0.1, min: 0 })}
        {renderSelect('Sección', section != null ? String(section) : '', (v) => setSection(Number(v)), SECTION_OPTIONS, 'mm²')}
        {renderSelect('Cable', cableType, setCableType, CABLE_OPTIONS)}
        {renderSelect('Material', material, setMaterial, MATERIAL_OPTIONS)}
        {renderSelect('Método inst.', installMethod, setInstallMethod, INSTALL_METHOD_OPTIONS)}
        {renderNumberInput('Nº puntos', quantity, setQuantity, { min: 0 })}
      </div>
    </div>
  );

  const renderContactorFields = () => (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-surface-600 uppercase tracking-wide">Contactor</h4>
      <div className="grid grid-cols-2 gap-3">
        {renderSelect('Calibre', calibreA != null ? String(calibreA) : '', (v) => setCalibreA(Number(v)), CALIBRE_OPTIONS, 'A')}
        {renderSelect('Tipo contactor', contactorType, setContactorType, CONTACTOR_TYPE_OPTIONS)}
      </div>
    </div>
  );

  const renderSubcuadroFields = () => (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-surface-600 uppercase tracking-wide">Subcuadro</h4>
      <div className="space-y-1">
        <Label className="text-xs text-surface-500">Nombre subcuadro</Label>
        <Input
          className="h-8 text-sm"
          value={subcuadroName}
          onChange={(e) => setSubcuadroName(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full lg:w-[380px] shrink-0 border-l border-surface-200 bg-white flex flex-col max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-surface-100 px-4 py-3">
        {(() => {
          const IconComponent = NODE_ICON_MAP[config.icon];
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border shrink-0 ${config.color}`}>
              {IconComponent && <IconComponent className="h-3.5 w-3.5" />}
              {config.shortLabel}
            </span>
          );
        })()}
        <span className="text-sm font-medium text-surface-800 truncate flex-1">
          {node.name || config.label}
        </span>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded text-surface-400 hover:text-surface-600 hover:bg-surface-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Name field (all types) */}
        <div className="space-y-1">
          <Label className="text-xs text-surface-500">Nombre</Label>
          <Input
            className="h-8 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={config.label}
          />
        </div>

        {/* Type-specific fields */}
        {['IGA', 'AUTOMATICO', 'GUARDAMOTOR'].includes(node.nodeType) && renderProtectionFields()}
        {node.nodeType === 'DIFERENCIAL' && renderDifferentialFields()}
        {node.nodeType === 'CIRCUITO' && renderCircuitFields()}
        {node.nodeType === 'CONTACTOR' && renderContactorFields()}
        {node.nodeType === 'SUBCUADRO' && renderSubcuadroFields()}

        {/* Validations section */}
        {validations && validations.length > 0 && (
          <div className="space-y-2 border-t border-surface-200 pt-4">
            <h4 className="text-xs font-semibold text-surface-600 uppercase tracking-wide">Validaciones</h4>
            <div className="space-y-1.5">
              {validations.map((v, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-1.5 text-xs px-2 py-1.5 rounded ${
                    v.severity === 'error'
                      ? 'bg-red-50 text-red-700'
                      : v.severity === 'warning'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {v.severity === 'error' ? <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" /> : v.severity === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" /> : <Info className="h-3.5 w-3.5 shrink-0 mt-px" />}
                  {v.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="border-t border-surface-100 px-4 py-3 flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 flex-1">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMoveRequest(node.id)}
          className="gap-1.5"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Mover
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
