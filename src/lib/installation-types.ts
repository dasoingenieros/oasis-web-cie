import {
  Home, Building2, Factory, Car, Link, Clock, Zap, Sun, Activity,
  UtensilsCrossed, Circle, Briefcase, Building, LayoutGrid, Droplets,
  ArrowUpDown, Flame, RectangleHorizontal, Droplet, Landmark,
  AlertTriangle, Calendar, Waves, Lightbulb, PlugZap, Fence,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface InstallationType {
  key: string;
  name: string;
  sub: string;
  icon: LucideIcon;
  group: 'available' | 'coming_soon';
  canMTD: boolean;
  always?: boolean;       // always allows MTD (no threshold)
  threshold?: number;     // kW threshold for MTD
  reason?: string;        // reason when forced to Proyecto
  extraDocs?: string[];   // additional docs
  help?: string;          // help text for MTD/Proyecto decision
}

export const INSTALLATION_TYPES: InstallationType[] = [
  // ── Available (20) ─────────────────────────────────────────
  { key: 'vivienda', name: 'Vivienda', sub: 'Basica o Elevada', icon: Home, group: 'available', canMTD: true, threshold: 50, help: 'Viviendas ≤50 kW → MTD. Si >50 kW → Proyecto.' },
  { key: 'local', name: 'Local / Oficina', sub: 'Sin publica concurrencia', icon: Building2, group: 'available', canMTD: true, threshold: 100, help: 'Si ≤100 kW → MTD. Si >100 kW → Proyecto.' },
  { key: 'industrial', name: 'Industrial', sub: 'Nave, taller, almacen', icon: Factory, group: 'available', canMTD: true, threshold: 100, help: 'Naves ≤100 kW → MTD. Si >100 kW → Proyecto.' },
  { key: 'garaje', name: 'Garajes (NO LPC)', sub: '≤25 plazas', icon: Car, group: 'available', canMTD: true, always: true, help: 'Garajes pequeños van con MTD.' },
  { key: 'enlace', name: 'Enlace y Comunes', sub: 'CGP, LGA, contadores', icon: Link, group: 'available', canMTD: true, threshold: 100, help: 'Enlace ≤100 kW → MTD.' },
  { key: 'temporal', name: 'Temporal', sub: 'Obras, ferias, eventos', icon: Clock, group: 'available', canMTD: true, threshold: 100, help: 'Temporales ≤100 kW y sin LPC → MTD.' },
  { key: 'irve', name: 'IRVE', sub: 'Recarga vehiculo electrico', icon: Zap, group: 'available', canMTD: true, always: true, extraDocs: ['Anexo IVE'], help: 'Puntos de recarga residenciales van con MTD + Anexo IVE.' },
  { key: 'autoconsumo', name: 'Autoconsumo / FV', sub: 'Fotovoltaica', icon: Sun, group: 'available', canMTD: true, threshold: 10, extraDocs: ['Declaracion FV', 'Fichero Registro CAM'], help: 'FV ≤10 kW → MTD. Si >10 kW → Proyecto.' },
  { key: 'generacion', name: 'Generacion', sub: 'Grupos electrogenos', icon: Activity, group: 'available', canMTD: true, threshold: 100, help: 'Generacion ≤100 kW → MTD.' },
  { key: 'lpc_host', name: 'Hosteleria', sub: 'Bares, restaurantes', icon: UtensilsCrossed, group: 'available', canMTD: false, reason: 'Publica concurrencia: siempre Proyecto.' },
  { key: 'lpc_espec', name: 'Espectaculos', sub: 'Cines, teatros, discotecas', icon: Circle, group: 'available', canMTD: false, reason: 'Publica concurrencia: siempre Proyecto.' },
  { key: 'lpc_reun', name: 'Reunion y Trabajo', sub: 'C. comerciales, clinicas', icon: Briefcase, group: 'available', canMTD: false, reason: 'Publica concurrencia: siempre Proyecto.' },
  { key: 'lpc_otros', name: 'Otros LPC', sub: 'Baja densidad ocupacion', icon: Building, group: 'available', canMTD: false, reason: 'Publica concurrencia: siempre Proyecto.' },
  { key: 'garaje_lpc', name: 'Garaje LPC', sub: '>25 plazas / vent. forzada', icon: LayoutGrid, group: 'available', canMTD: false, reason: 'Garajes grandes: publica concurrencia.' },
  { key: 'mojado', name: 'Local Mojado', sub: 'Lavaderos', icon: Droplets, group: 'available', canMTD: false, reason: 'ITC-BT-30: siempre Proyecto.' },
  { key: 'elevacion', name: 'Elevacion y Transporte', sub: 'Ascensores, montacargas', icon: ArrowUpDown, group: 'available', canMTD: false, reason: 'ITC-BT-32: siempre Proyecto.' },
  { key: 'caldeo', name: 'Cond. Aislados Caldeo', sub: 'Suelo radiante electrico', icon: Flame, group: 'available', canMTD: false, reason: 'ITC-BT-45: siempre Proyecto.' },
  { key: 'rotulos', name: 'Rotulos Luminosos', sub: 'ITC-BT-44', icon: RectangleHorizontal, group: 'available', canMTD: false, reason: 'ITC-BT-44: siempre Proyecto.' },
  { key: 'local_esp', name: 'Local Especial / Bombas', sub: 'Bombas, emergencias', icon: Droplet, group: 'available', canMTD: false, reason: 'Local especial: siempre Proyecto.' },
  { key: 'temporal_lpc', name: 'Temporal LPC', sub: 'Ferias, conciertos', icon: Landmark, group: 'available', canMTD: false, reason: 'Temporal LPC: siempre Proyecto.' },

  // ── Coming soon (6) ────────────────────────────────────────
  { key: 'atex', name: 'ATEX', sub: 'Riesgo incendio/explosion', icon: AlertTriangle, group: 'coming_soon', canMTD: false },
  { key: 'quiro', name: 'Quirofanos', sub: 'ITC-BT-38', icon: Calendar, group: 'coming_soon', canMTD: false },
  { key: 'piscinas', name: 'Piscinas / Fuentes', sub: 'ITC-BT-31', icon: Waves, group: 'coming_soon', canMTD: false },
  { key: 'alumbrado', name: 'Alumbrado Exterior', sub: 'ITC-BT-09', icon: Lightbulb, group: 'coming_soon', canMTD: false },
  { key: 'tensiones', name: 'Tensiones Especiales', sub: 'Alta tension', icon: PlugZap, group: 'coming_soon', canMTD: false },
  { key: 'cercas', name: 'Cercas Electricas', sub: 'ITC-BT-39', icon: Fence, group: 'coming_soon', canMTD: false },
];

export const EXPEDIENTE_LABELS: Record<string, string> = {
  NUEVA: 'Nueva Instalacion',
  AMPLIACION: 'Ampliacion',
  AMPLIACION_CAMBIO_TITULAR: 'Ampliacion con Cambio de Titular',
  AMPLIACION_SIN_INSTALACION: 'Ampliacion sin Instalacion',
  MODIFICACION: 'Modificacion',
  MODIFICACION_CAMBIO_TITULAR: 'Modificacion con Cambio de Titular',
  MODIFICACION_SIN_INSTALACION: 'Modificacion sin Instalacion',
};

export function getInstallationType(key: string): InstallationType | undefined {
  return INSTALLATION_TYPES.find((t) => t.key === key);
}
