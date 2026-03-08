// ═══════════════════════════════════════════════════════════════
// Unifilar Editor — TypeScript Types
// ═══════════════════════════════════════════════════════════════

export type SymbolType =
  | 'acometida' | 'cgp' | 'contador'
  | 'magnetotermico' | 'diferencial' | 'fusible'
  | 'busbar'
  | 'punto_luz' | 'toma_corriente'
  | 'tierra' | 'texto' | 'info_block'
  | 'contactor' | 'guardamotor' | 'reloj_horario' | 'motor' | 'seccionador' | 'magneto_diferencial';

export type SymbolCategory = 'supply' | 'protection' | 'distribution' | 'receptor' | 'maniobra' | 'other';

export interface SymbolDef {
  label: string;
  w: number;
  h: number;
  category: SymbolCategory;
}

export const SYMBOL_TYPES: Record<SymbolType, SymbolDef> = {
  acometida:            { label: 'Acometida',            w: 30,  h: 34,  category: 'supply' },
  cgp:                  { label: 'CGP',                  w: 34,  h: 44,  category: 'supply' },
  contador:             { label: 'Contador',             w: 30,  h: 40,  category: 'supply' },
  magnetotermico:       { label: 'Magnetotérmico',       w: 26,  h: 56,  category: 'protection' },
  diferencial:          { label: 'Diferencial',          w: 28,  h: 56,  category: 'protection' },
  fusible:              { label: 'Fusible',              w: 14,  h: 36,  category: 'protection' },
  magneto_diferencial:  { label: 'Magneto-diferencial',  w: 28,  h: 70,  category: 'protection' },
  seccionador:          { label: 'Seccionador',          w: 20,  h: 40,  category: 'protection' },
  busbar:               { label: 'Barra distribución',   w: 200, h: 6,   category: 'distribution' },
  punto_luz:            { label: 'Punto de luz',         w: 16,  h: 20,  category: 'receptor' },
  toma_corriente:       { label: 'Toma corriente',       w: 18,  h: 20,  category: 'receptor' },
  motor:                { label: 'Motor',                w: 30,  h: 36,  category: 'receptor' },
  contactor:            { label: 'Contactor',            w: 24,  h: 48,  category: 'maniobra' },
  guardamotor:          { label: 'Guardamotor',          w: 26,  h: 56,  category: 'maniobra' },
  reloj_horario:        { label: 'Reloj horario',        w: 30,  h: 40,  category: 'maniobra' },
  tierra:               { label: 'Toma de tierra',       w: 22,  h: 22,  category: 'other' },
  texto:                { label: 'Texto libre',          w: 80,  h: 20,  category: 'other' },
  info_block:           { label: 'Info circuito',        w: 80,  h: 60,  category: 'other' },
};

export const CATEGORIES: Record<SymbolCategory, { label: string; icon: string }> = {
  supply:       { label: 'Alimentación',  icon: '⚡' },
  protection:   { label: 'Protección',    icon: '🛡' },
  distribution: { label: 'Distribución',  icon: '━' },
  receptor:     { label: 'Receptores',    icon: '💡' },
  maniobra:     { label: 'Maniobra',      icon: '⚙' },
  other:        { label: 'Otros',         icon: '◇' },
};

export interface UnifilarNode {
  id: string;
  type: SymbolType;
  x: number;
  y: number;
  props: Record<string, any>;
}

export interface UnifilarWire {
  id: string;
  from: string;
  to: string;
  fromPort: 'top' | 'bottom';
  toPort: 'top' | 'bottom';
  props: {
    section?: number;
    material?: string;
    conductores?: number;
    length?: number;
    insulation?: string;
  };
}

export interface UnifilarTemplate {
  nodes: UnifilarNode[];
  wires: UnifilarWire[];
  meta: {
    name: string;
    version: number;
    installationId?: string;
    created: string;
    modified?: string;
  };
}

export interface UnifilarState {
  nodes: UnifilarNode[];
  wires: UnifilarWire[];
  meta: UnifilarTemplate['meta'];
  selection: { type: 'node' | 'wire' | null; id: string | null };
  isDirty: boolean;
}

export type UnifilarAction =
  | { type: 'MOVE_NODE'; id: string; x: number; y: number }
  | { type: 'SELECT'; selType: 'node' | 'wire'; id: string }
  | { type: 'DESELECT' }
  | { type: 'UPDATE_PROPS'; props: Record<string, any> }
  | { type: 'ADD_NODE'; node: UnifilarNode }
  | { type: 'DELETE_SELECTED' }
  | { type: 'ADD_WIRE'; wire: UnifilarWire }
  | { type: 'DUPLICATE_NODE' }
  | { type: 'LOAD_TEMPLATE'; template: UnifilarTemplate };

// ── Helpers ──
let _uid = Date.now();
export const uid = () => `n${_uid++}`;
export const GRID_SIZE = 10;
export const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;
