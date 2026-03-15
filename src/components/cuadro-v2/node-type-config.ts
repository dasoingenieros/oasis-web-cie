import type { LucideIcon } from 'lucide-react';
import {
  Zap,
  ShieldCheck,
  ToggleRight,
  GitBranch,
  Cog,
  Power,
  LayoutGrid,
  CircleDot,
} from 'lucide-react';
import type { PanelNodeType } from '@/lib/types';

export interface NodeTypeConfig {
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  canHaveChildren: boolean;
  allowedChildTypes: PanelNodeType[];
  fields: string[];
}

/** Map icon name string → Lucide component */
export const NODE_ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  ShieldCheck,
  ToggleRight,
  GitBranch,
  Cog,
  Power,
  LayoutGrid,
  CircleDot,
};

export const NODE_TYPE_CONFIG: Record<PanelNodeType, NodeTypeConfig> = {
  IGA: {
    label: 'Interruptor General Automático',
    shortLabel: 'IGA',
    icon: 'Zap',
    color: 'bg-red-100 text-red-800 border-red-300',
    canHaveChildren: true,
    allowedChildTypes: ['PROTECTOR_SOBRETENSIONES', 'AUTOMATICO', 'DIFERENCIAL', 'SUBCUADRO', 'CONTACTOR', 'CIRCUITO'],
    fields: ['calibreA', 'polos', 'curva', 'poderCorteKa'],
  },
  PROTECTOR_SOBRETENSIONES: {
    label: 'Protector Sobretensiones',
    shortLabel: 'SPD',
    icon: 'ShieldCheck',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    canHaveChildren: false,
    allowedChildTypes: [],
    fields: ['name'],
  },
  AUTOMATICO: {
    label: 'Magnetotérmico',
    shortLabel: 'MAG',
    icon: 'ToggleRight',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    canHaveChildren: true,
    allowedChildTypes: ['DIFERENCIAL', 'CIRCUITO', 'GUARDAMOTOR', 'CONTACTOR'],
    fields: ['calibreA', 'polos', 'curva', 'poderCorteKa'],
  },
  DIFERENCIAL: {
    label: 'Interruptor Diferencial',
    shortLabel: 'DIF',
    icon: 'GitBranch',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    canHaveChildren: true,
    allowedChildTypes: ['AUTOMATICO', 'CIRCUITO', 'GUARDAMOTOR', 'CONTACTOR'],
    fields: ['calibreA', 'polos', 'sensitivityMa', 'diffType'],
  },
  GUARDAMOTOR: {
    label: 'Guardamotor',
    shortLabel: 'GM',
    icon: 'Cog',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    canHaveChildren: true,
    allowedChildTypes: ['CIRCUITO'],
    fields: ['calibreA', 'polos', 'curva'],
  },
  CONTACTOR: {
    label: 'Contactor',
    shortLabel: 'KM',
    icon: 'Power',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    canHaveChildren: true,
    allowedChildTypes: ['CIRCUITO'],
    fields: ['calibreA', 'contactorType'],
  },
  SUBCUADRO: {
    label: 'Subcuadro',
    shortLabel: 'SC',
    icon: 'LayoutGrid',
    color: 'bg-green-100 text-green-800 border-green-300',
    canHaveChildren: true,
    allowedChildTypes: ['IGA', 'PROTECTOR_SOBRETENSIONES', 'AUTOMATICO', 'DIFERENCIAL', 'SUBCUADRO', 'CONTACTOR', 'CIRCUITO'],
    fields: ['subcuadroName'],
  },
  CIRCUITO: {
    label: 'Circuito',
    shortLabel: 'C',
    icon: 'CircleDot',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    canHaveChildren: false,
    allowedChildTypes: [],
    fields: ['name', 'loadType', 'power', 'voltage', 'phases', 'cosPhi', 'length', 'section', 'cableType', 'material', 'installMethod', 'quantity'],
  },
};

/** Types allowed as root nodes (no parent) */
export const ROOT_ALLOWED_TYPES: PanelNodeType[] = ['IGA', 'SUBCUADRO'];
