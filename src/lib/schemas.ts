import { z } from 'zod';

// ─── Installation (Datos administrativos) ────────────────────

export const installationSchema = z.object({
  // Titular
  titularName: z.string().min(1, 'Nombre del titular requerido'),
  titularNif: z
    .string()
    .regex(/^[0-9A-Z]{8,9}[A-Z]?$/i, 'NIF/CIF no válido')
    .or(z.literal(''))
    .optional(),
  titularAddress: z.string().optional(),

  // Emplazamiento
  address: z.string().min(1, 'Dirección del emplazamiento requerida'),
  cups: z
    .string()
    .regex(/^ES\d{16}[A-Z]{2}\d?[A-Z]?$/i, 'CUPS no válido (formato: ES + 16 dígitos + 2 letras)')
    .or(z.literal(''))
    .optional(),

  // Datos técnicos
  supplyType: z.enum(['VIVIENDA_BASICA', 'VIVIENDA_ELEVADA', 'IRVE', 'LOCAL_COMERCIAL']),
  supplyVoltage: z.coerce.number().int().min(220).max(400).default(230),
  contractedPower: z.coerce.number().min(0.1).max(500).optional(),

  // Instalador
  installerName: z.string().optional(),
  installerNif: z.string().optional(),
  installerRegNum: z.string().optional(),
});

export type InstallationFormValues = z.infer<typeof installationSchema>;

// ─── Circuit (Cuadro eléctrico) ──────────────────────────────

export const circuitSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  code: z.string().optional(),
  order: z.coerce.number().int().min(1),
  power: z.coerce.number().min(1, 'Potencia debe ser > 0'),
  voltage: z.coerce.number().int().min(220).max(400),
  phases: z.coerce.number().int().min(1).max(3),
  length: z.coerce.number().min(0.1, 'Longitud debe ser > 0'),
  cableType: z.enum(['CU', 'AL']),
  insulationType: z.string(),
  installMethod: z.enum(['A1', 'A2', 'B1', 'B2', 'C', 'D', 'E', 'F']),
  cosPhi: z.coerce.number().min(0.1).max(1).default(1),
  tempCorrFactor: z.coerce.number().min(0.1).max(2).default(1.0),
  groupCorrFactor: z.coerce.number().min(0.1).max(2).default(1.0),
});

export type CircuitFormValues = z.infer<typeof circuitSchema>;

// ─── Circuitos predefinidos ITC-BT-25 ────────────────────────
// Valores según ITC-BT-25 Tabla 1
// Potencia de cálculo = V × I_PIA
// cosφ = 1 (no se usa para ITC-BT-25, el motor usa directamente el PIA)
// Tipo instalación: E.T.F. (Empotrado en Tubo Flexible) → método A1

export interface CircuitTemplate {
  code: string;
  name: string;
  power: number;       // Potencia de cálculo W (= V × I_PIA)
  voltage: number;
  phases: number;
  cableType: 'CU' | 'AL';
  insulationType: string;
  installMethod: string;
  cosPhi: number;
  defaultLength: number;
  // Campos ITC-BT-25 de referencia (informativos)
  piaA?: number;         // Calibre PIA (A)
  sectionMm2?: number;   // Sección mínima (mm²)
  numConductors?: number; // Nº conductores (sin PE)
}

export const CIRCUIT_TEMPLATES_BASICA: CircuitTemplate[] = [
  { code: 'C1', name: 'Alumbrado',                   power: 2300, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 15, piaA: 10, sectionMm2: 1.5, numConductors: 2 },
  { code: 'C2', name: 'TC uso general',              power: 3680, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 15, piaA: 16, sectionMm2: 2.5, numConductors: 2 },
  { code: 'C3', name: 'Cocina/horno',                power: 5750, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 15, piaA: 25, sectionMm2: 6,   numConductors: 2 },
  { code: 'C4', name: 'Lavadora/lavavajillas/termo', power: 4600, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 15, piaA: 20, sectionMm2: 4,   numConductors: 2 },
  { code: 'C5', name: 'TC baño/cocina',              power: 3680, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 15, piaA: 16, sectionMm2: 2.5, numConductors: 2 },
];

export const CIRCUIT_TEMPLATES_ELEVADA: CircuitTemplate[] = [
  ...CIRCUIT_TEMPLATES_BASICA,
  { code: 'C6',  name: 'Alumbrado adicional',    power: 2300, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 15, piaA: 10, sectionMm2: 1.5, numConductors: 2 },
  { code: 'C7',  name: 'TC adicional',           power: 3680, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 15, piaA: 16, sectionMm2: 2.5, numConductors: 2 },
  { code: 'C8',  name: 'Calefacción eléctrica',  power: 5750, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 20, piaA: 25, sectionMm2: 6,   numConductors: 2 },
  { code: 'C9',  name: 'Aire acondicionado',     power: 5750, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 15, piaA: 25, sectionMm2: 6,   numConductors: 2 },
  { code: 'C10', name: 'Secadora',               power: 4600, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 10, piaA: 20, sectionMm2: 4,   numConductors: 2 },
  { code: 'C11', name: 'Automatización',          power: 2300, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 20, piaA: 10, sectionMm2: 1.5, numConductors: 2 },
  { code: 'C12', name: 'Circuito adicional',     power: 3680, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'H07V-K', installMethod: 'A1', cosPhi: 1, defaultLength: 15, piaA: 16, sectionMm2: 2.5, numConductors: 2 },
];

export const CIRCUIT_TEMPLATES_IRVE: CircuitTemplate[] = [
  { code: 'C12', name: 'IRVE - Punto de recarga VE', power: 7360, voltage: 230, phases: 1, cableType: 'CU', insulationType: 'RV-K', installMethod: 'B1', cosPhi: 1, defaultLength: 20 },
];

export function getTemplatesForSupplyType(supplyType: string): CircuitTemplate[] {
  switch (supplyType) {
    case 'VIVIENDA_BASICA': return CIRCUIT_TEMPLATES_BASICA;
    case 'VIVIENDA_ELEVADA': return CIRCUIT_TEMPLATES_ELEVADA;
    case 'IRVE': return CIRCUIT_TEMPLATES_IRVE;
    case 'LOCAL_COMERCIAL': return []; // Usuario define libremente
    default: return [];
  }
}

// ─── Nomenclatura tipo instalación para MTD ──────────────────

/** Mapeo método UNE/IEC → nomenclatura CAM (ITC-BT-26) para circuitos interiores */
export const INSTALL_METHOD_TO_ITC_BT_26: Record<string, string> = {
  'A1': 'E.T.F.',    // Empotrado en Tubo Flexible
  'A2': 'E.T.C.',    // Empotrado en Tubo Curvable
  'B1': 'S.T.C.',    // Superficial en Tubo Curvable
  'B2': 'S.T.R.',    // Superficial en Tubo Rígido
  'C':  'S.C.P.F.',  // Superficial en Canalización Prefabricada
};

/** Mapeo método UNE/IEC → nomenclatura CAM (ITC-BT-20) para LGA/Derivaciones */
export const INSTALL_METHOD_TO_ITC_BT_20: Record<string, string> = {
  'A1': 'T.P.',      // Bajo Tubo Protector
  'B1': 'T.P.',      // Bajo Tubo Protector
  'D':  'ENTR.',     // Enterrado
  'E':  'BANDJ.',    // En Bandeja
  'F':  'BANDJ.',    // En Bandeja
};

/** Tensión de aislamiento por defecto según contexto */
export function getDefaultInsulationVoltage(isInterior: boolean): string {
  return isInterior ? '450/750V' : '0.6/1kV';
}
