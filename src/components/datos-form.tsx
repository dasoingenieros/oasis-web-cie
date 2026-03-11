'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Installation, UpdateInstallationDto, SupplyType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Loader2, CheckCircle2, ChevronDown, ChevronRight, AlertTriangle, Lock, HelpCircle, Info } from 'lucide-react';
import { getInstallationType } from '@/lib/installation-types';

// ─── Campos que intervienen en cálculos (bloqueados tras calcular) ───
const CALC_LOCKED_FIELDS = new Set([
  'supplyType', 'supplyVoltage', 'esquemaDistribucion',
  'seccionAcometida', 'materialAcometida',
  'seccionLga', 'materialLga', 'longitudLga', 'aislamientoLga',
  'seccionDi', 'materialDi', 'longitudDi', 'numDerivaciones', 'aislamientoDi', 'tipoInstalacionDi',
  'seccionLineaEnlace', 'seccionCondProteccion',
  'igaNominal', 'igaPoderCorte', 'diferencialNominal', 'diferencialSensibilidad',
  'potMaxAdmisible', 'gradoElectrificacion',
]);

const CIE_REQUIRED_ALWAYS: string[] = [
  'tipoAutor',
  'titularNif', 'titularNombre',
  'titularTipoVia', 'titularNombreVia', 'titularNumero',
  'titularLocalidad', 'titularProvincia', 'titularCp', 'titularEmail',
  'emplazTipoVia', 'emplazNombreVia', 'emplazNumero',
  'emplazLocalidad', 'emplazProvincia', 'emplazCp', 'contadorUbicacion',
  'supplyType', 'supplyVoltage', 'tipoActuacion', 'usoInstalacion', 'esquemaDistribucion',
  'tipoInstalacionCie',
  'puntoConexion', 'tipoAcometida', 'materialAcometida', 'tipoCgp',
  'empresaNif', 'empresaNombre', 'empresaCategoria', 'empresaRegNum',
  'instaladorNombre', 'instaladorNif',
  'empresaTipoVia', 'empresaNombreVia', 'empresaNumero',
  'empresaLocalidad', 'empresaProvincia', 'empresaCp', 'empresaEmail',
  'distribuidora',
  'resistenciaTierra', 'resistenciaAislamiento',
];

function getRequiredFields(data: Record<string, any>): string[] {
  const fields = [...CIE_REQUIRED_ALWAYS];
  const nif = (data.titularNif ?? '').trim();
  if (nif && /^\d/.test(nif)) fields.push('titularApellido1');
  if (data.tipoActuacion === 'MODIFICACION' || data.tipoActuacion === 'AMPLIACION') {
    fields.push('numRegistroExistente', 'potOriginal');
  }
  return fields;
}

function getSpecialValidations(data: Record<string, any>): { field: string; ok: boolean; msg: string }[] {
  return [
    { field: 'titularTelefono', ok: !!(data.titularTelefono || data.titularMovil), msg: 'Teléfono o móvil del titular obligatorio' },
    { field: 'empresaTelefono', ok: !!(data.empresaTelefono || data.empresaMovil), msg: 'Teléfono o móvil de empresa obligatorio' },
  ];
}

const TIPOS_VIA = ['CALLE','ACCESO','ACUEDUCTO','ALAMEDA','ALTO','AVENIDA','BAJADA','BARRANCO','BULEVAR','CALLEJA','CALLEJON','CAMINO','CARRERA','CARRETERA','COLONIA','COSTANILLA','CUESTA','FINCA','GLORIETA','GRAN VIA','PARAJE','PARCELA','PARQUE','PASADIZO','PASAJE','PASEO','PLAZA','PLAZUELA','POLIGONO','RINCON','RONDA','ROTONDA','SECTOR','SENDA','TRASERA','TRAVESIA'];
const TIPOS_ACTUACION = [{ value: 'NUEVA', label: 'Nueva instalación' },{ value: 'MODIFICACION', label: 'Modificación' },{ value: 'AMPLIACION', label: 'Ampliación' }];
const PUNTOS_CONEXION = [{ value: 'RBT', label: 'RBT — Red de Baja Tensión' },{ value: 'CT', label: 'CT — Centro de Transformación' },{ value: 'IA', label: 'IA — Instalación Aislada' }];
const TIPOS_ACOMETIDA = [{ value: 'AEREA', label: 'Aérea' },{ value: 'SUBTERRANEA', label: 'Subterránea' }];
const MATERIALES = [{ value: 'CU', label: 'Cobre (Cu)' },{ value: 'AL', label: 'Aluminio (Al)' }];
const TIPOS_CGP = [{ value: 'CGP', label: 'C.G.P. (esquema)' },{ value: 'BTV', label: 'BTV (nº salidas)' },{ value: 'N/A', label: 'N/A' }];
const TIPOS_MODULO = [{ value: 'PANELABLE', label: 'Panelable' },{ value: 'ENVOLVENTE', label: 'Envolvente' },{ value: 'ARMARIO', label: 'Armario' },{ value: 'INDEPENDIENTE', label: 'Independiente' }];
const SITUACIONES_MODULO = [{ value: 'INTERIOR', label: 'En interior' },{ value: 'FACHADA', label: 'En fachada' }];
const UBICACIONES_CONTADOR = [{ value: 'ARMARIO', label: 'Armario' },{ value: 'LOCAL', label: 'Local' },{ value: 'CPM', label: 'Individual (CPM)' }];
const TIPOS_ELECTRODO = [{ value: 'PICAS', label: 'Picas' },{ value: 'PLACAS', label: 'Placas' },{ value: 'MALLAS', label: 'Mallas' }];
const ESQUEMAS_DISTRIBUCION = [{ value: 'TT', label: 'TT' },{ value: 'TN-S', label: 'TN-S' },{ value: 'TN-C', label: 'TN-C' },{ value: 'TN-C-S', label: 'TN-C-S' },{ value: 'IT', label: 'IT' }];
const CATEGORIAS_EMPRESA = [{ value: 'Básica', label: 'Básica' },{ value: 'Especialista', label: 'Especialista' }];
const DISTRIBUIDORAS = ['0021 I-DE REDES ELÉCTRICAS INTELIGENTES','0022 UFD DISTRIBUCIÓN ELECTRICIDAD','0026 HIDROCANTÁBRICO DISTRIBUCIÓN ELÉCTRICA','0483 DISTRIBUCIÓN ELÉCTRICA DEL TAJUÑA','0494 DISTRIBUCIÓN ELÉCTRICA EL POZO DEL TIO RAIMUNDO, S.L.U','0314 HIDROELÉCTRICA VEGA, S.A.'];
const SUPPLY_TYPES: Array<{ value: SupplyType; label: string }> = [{ value: 'VIVIENDA_BASICA', label: 'Vivienda básica (C1-C5)' },{ value: 'VIVIENDA_ELEVADA', label: 'Vivienda elevada (C1-C12)' },{ value: 'IRVE', label: 'IRVE - Punto de recarga VE' },{ value: 'LOCAL_COMERCIAL', label: 'Local comercial' }];
const AISLAMIENTOS = [{ value: 'XLPE', label: 'XLPE' },{ value: 'PVC', label: 'PVC' },{ value: 'EPR', label: 'EPR' }];
const TIPOS_INSTALACION_DI = [{ value: 'TP', label: 'TP — Bajo Tubo Protector' },{ value: 'E.T.F.', label: 'E.T.F. — Empotrado Tubo Flexible' },{ value: 'F.D.P.', label: 'F.D.P. — Fijado sobre Pared' },{ value: 'ENTR', label: 'ENTR — Enterrado' },{ value: 'AERO', label: 'AERO — Aéreo' },{ value: 'C.P.', label: 'C.P. — Bajo Canales Protectores' },{ value: 'BANDJ', label: 'BANDJ — En Bandeja' }];
const TIPOS_AUTOR = [{ value: 'INSTALADOR', label: 'Instalador autorizado' },{ value: 'TECNICO', label: 'Técnico cualificado' }];
// ─── Mapeo categoría wizard → subtipos CIE oficiales (Excel hoja OPCIONES col H) ───
// Los values deben coincidir EXACTAMENTE con los del template CERTIFICADO_BASICO.xls
const WIZARD_TO_CIE_TYPES: Record<string, Array<{ value: string; label: string }>> = {
  vivienda: [
    { value: 'VIVIENDA', label: 'Vivienda' },
  ],
  local: [
    { value: 'LOCAL/OFICINA (NO LPC)', label: 'Local/Oficina (no LPC)' },
  ],
  industrial: [
    { value: 'INDUSTRIAS Y OTROS ESTABLECIMIENTOS INDUSTRIALES', label: 'Industrial' },
  ],
  garaje: [
    { value: 'GARAJE VENTILACIÓN NATURAL', label: 'Garaje ventilación natural' },
  ],
  enlace: [
    { value: 'INSTALACIONES DE ENLACE', label: 'Instalaciones de enlace' },
    { value: 'INSTALACIONES COMUNES', label: 'Instalaciones comunes' },
  ],
  temporal: [
    { value: 'TEMP.  ALIMENTA MAQUINA OBRAS CONSTRUCCIÓN', label: 'Temporal — Obras construcción' },
    { value: 'TEMP. EN LOCALES O EMPLAZAMIENTOS ABIERTOS', label: 'Temporal — Locales/ferias' },
  ],
  irve: [
    { value: 'INFRAESTRUCTURA DE RECARGA VEHICULO ELECTRICO', label: 'IRVE' },
  ],
  autoconsumo: [
    { value: 'AUTOCONSUMO', label: 'Autoconsumo' },
    { value: 'GENERACION SOLAR FOTOVOLTAICA', label: 'Generación solar fotovoltaica' },
    { value: 'GENERACION SOLAR TERMOELÉCTRICA', label: 'Generación solar termoeléctrica' },
  ],
  generacion: [
    { value: 'GENERACION GRUPOS ELECTRÓGENOS FIJOS', label: 'Grupos electrógenos fijos' },
    { value: 'GRUPOS ELECTRÓGENOS PORTÁTILES', label: 'Grupos electrógenos portátiles' },
    { value: 'COGENERACIÓN', label: 'Cogeneración' },
    { value: 'AEROGENERADORES', label: 'Aerogeneradores' },
    { value: 'CONVERTIDORES', label: 'Convertidores' },
  ],
  lpc_host: [
    { value: 'LPC- BARES, RESTAURANTES O SIMILARES', label: 'LPC — Bares/Restaurantes' },
    { value: 'LPC- HOTELES', label: 'LPC — Hoteles' },
    { value: 'LPC- HOSTALES', label: 'LPC — Hostales' },
  ],
  lpc_espec: [
    { value: 'LPC - CINES', label: 'LPC — Cines' },
    { value: 'LPC- TEATROS', label: 'LPC — Teatros' },
    { value: 'LPC- AUDITORIOS', label: 'LPC — Auditorios' },
    { value: 'LPC- PLAZAS DE TOROS', label: 'LPC — Plazas de toros' },
    { value: 'LPC- HIPÓDROMOS', label: 'LPC — Hipódromos' },
    { value: 'LPC- PARQUES DE ATRACCIONES', label: 'LPC — Parques de atracciones' },
    { value: 'LPC- SALAS DE FIESTA', label: 'LPC — Salas de fiesta' },
    { value: 'LPC- DISCOTECAS', label: 'LPC — Discotecas' },
    { value: 'LPC- SALAS DE JUEGOS DE AZAR', label: 'LPC — Salas de juegos de azar' },
    { value: 'LPC- ESTADIOS Y PABELLONES DEPORTIVOS', label: 'LPC — Estadios/Pabellones' },
    { value: 'LPC- CANODROMOS', label: 'LPC — Canódromos' },
    { value: 'LPC- PARQUES ACUATICOS', label: 'LPC — Parques acuáticos' },
    { value: 'LPC- FERIAS FIJAS', label: 'LPC — Ferias fijas' },
    { value: 'LPC- BINGOS', label: 'LPC — Bingos' },
    { value: 'LPC- CIRCOS', label: 'LPC — Circos' },
  ],
  lpc_reun: [
    { value: 'LPC- ESTABLECIMIENTOS COMERCIALES', label: 'LPC — Establ. comerciales' },
    { value: 'LPC- AGRUP. ESTAB. EN CENTROS COMERCIALES', label: 'LPC — Agrup. centros comerciales' },
    { value: 'LPC- SALAS DE CONFERENCIAS Y CONGRESOS', label: 'LPC — Salas conferencias' },
    { value: 'LPC- CENTROS DE ENSEÑANZA', label: 'LPC — Centros enseñanza' },
    { value: 'LPC- OFICINAS CON PRESENCIA DE PÚBLICO', label: 'LPC — Oficinas con público' },
    { value: 'LPC- HOSPITALES, CLÍNICAS, AMBUL., CENTROS SALUD', label: 'LPC — Hospitales/Clínicas' },
    { value: 'LPC- CONSULTORIOS MÉDICOS', label: 'LPC — Consultorios médicos' },
    { value: 'LPC- CLUBES SOCIALES Y DEPORTIVOS', label: 'LPC — Clubes sociales/deportivos' },
    { value: 'LPC- GIMNASIOS', label: 'LPC — Gimnasios' },
    { value: 'LPC- CASINOS', label: 'LPC — Casinos' },
    { value: 'LPC- BIBLIOTECAS', label: 'LPC — Bibliotecas' },
    { value: 'LPC- MUSEOS', label: 'LPC — Museos' },
    { value: 'LPC- SALAS DE EXPOSICIONES', label: 'LPC — Salas de exposiciones' },
    { value: 'LPC- CENTROS CULTURALES', label: 'LPC — Centros culturales' },
    { value: 'LPC- ASILOS', label: 'LPC — Asilos' },
    { value: 'LPC- GUARDERÍAS', label: 'LPC — Guarderías' },
    { value: 'LPC- RESIDENCIAS DE ESTUDIANTES', label: 'LPC — Residencias estudiantes' },
    { value: 'LPC- TEMPLOS', label: 'LPC — Templos' },
    { value: 'LPC- ESTACIONES DE VIAJEROS', label: 'LPC — Estaciones de viajeros' },
    { value: 'LPC- AEROPUERTOS', label: 'LPC — Aeropuertos' },
  ],
  lpc_otros: [
    { value: 'LPC- OTROS', label: 'LPC — Otros' },
    { value: 'LPC-OTROS LOCALES BD2/BD3/BD4', label: 'LPC — Otros BD2/BD3/BD4' },
    { value: 'LPC- OTROS (OCUPACIÓN > 100)', label: 'LPC — Otros (ocupación >100)' },
  ],
  garaje_lpc: [
    { value: 'GARAJE VENTILACIÓN FORZADA', label: 'Garaje ventilación forzada' },
    { value: 'LPC- ESTACIONAMIENTOS SUBTERRÁNEOS', label: 'LPC — Estacionamientos subterráneos' },
  ],
  mojado: [
    { value: 'LOCAL MOJADO', label: 'Local mojado' },
    { value: 'LOCALES HÚMEDOS', label: 'Locales húmedos' },
  ],
  elevacion: [
    { value: 'MÁQUINAS DE ELEVACIÓN Y TRANSPORTE', label: 'Máquinas de elevación y transporte' },
  ],
  caldeo: [
    { value: 'CONDUCTORES AISLADOS PARA CALDEO', label: 'Conductores aislados para caldeo' },
  ],
  rotulos: [
    { value: 'DESTINADAS A RÓTULOS LUMINOSOS', label: 'Rótulos luminosos' },
  ],
  local_esp: [
    { value: 'BOMBAS DE EXTRACCIÓN O ELEVACIÓN DE AGUA', label: 'Bombas extracción/elevación agua' },
    { value: 'LOCALES POLVORIENTOS', label: 'Locales polvorientos' },
    { value: 'LOCALES CON RIESGO DE CORROSIÓN', label: 'Locales con riesgo de corrosión' },
    { value: 'LOCAL CON RIESGO INCENDIO O EXPLOSIÓN, NO GARAJE', label: 'Local riesgo incendio/explosión' },
    { value: 'QUIROFANOS Y SALAS DE INTERVENCION', label: 'Quirófanos y salas de intervención' },
    { value: 'PISCINAS', label: 'Piscinas' },
    { value: 'FUENTES', label: 'Fuentes' },
    { value: 'INSTALACIONES QUE UTILICEN TENSIONES ESPECIALES', label: 'Tensiones especiales' },
    { value: 'CERCAS ELÉCTRICAS', label: 'Cercas eléctricas' },
    { value: 'ALUMBRADO EXTERIOR PÚBLICO', label: 'Alumbrado exterior público' },
    { value: 'ALUMBRADO EXTERIOR PRIVADO', label: 'Alumbrado exterior privado' },
    { value: 'MOBILIARIO URBANO', label: 'Mobiliario urbano' },
  ],
  temporal_lpc: [
    { value: 'LPC- OTROS', label: 'LPC — Otros' },
  ],
};

// Fallback: todos los tipos CIE (para instalaciones sin categoría wizard)
const ALL_CIE_TYPES: Array<{ value: string; label: string }> = Object.values(WIZARD_TO_CIE_TYPES).flat()
  .filter((v, i, arr) => arr.findIndex((x) => x.value === v.value) === i)
  .concat({ value: 'OTRAS NO CONTEMPLADAS', label: 'Otras no contempladas' });

// ─── Potencias normalizadas REBT por tipo y tensión ──────────
const POTENCIAS_MONO: Array<{ value: string; label: string }> = [
  { value: '3450', label: '3.450 W (15A)' },
  { value: '5750', label: '5.750 W (25A)' },
  { value: '7360', label: '7.360 W (32A)' },
  { value: '9200', label: '9.200 W (40A)' },
  { value: '11500', label: '11.500 W (50A)' },
  { value: '14490', label: '14.490 W (63A)' },
];
const POTENCIAS_TRI: Array<{ value: string; label: string }> = [
  { value: '10392', label: '10.392 W (15A)' },
  { value: '13856', label: '13.856 W (20A)' },
  { value: '17321', label: '17.321 W (25A)' },
  { value: '20785', label: '20.785 W (30A)' },
  { value: '27713', label: '27.713 W (40A)' },
  { value: '34641', label: '34.641 W (50A)' },
  { value: '43648', label: '43.648 W (63A)' },
];
const POTENCIAS_REBT_BASICA_MONO = [POTENCIAS_MONO[1]]; // 5.750 W only
const POTENCIAS_REBT_BASICA_TRI = POTENCIAS_TRI.slice(0, 3); // up to 17.321 W
const POTENCIAS_REBT_ELEVADA_MONO = POTENCIAS_MONO.slice(1); // 5.750 – 14.490 W
const POTENCIAS_REBT_ELEVADA_TRI = POTENCIAS_TRI;

function getPotenciasRebt(supplyType: string, voltage: string): Array<{ value: string; label: string }> | null {
  const isTri = voltage === '400';
  if (supplyType === 'VIVIENDA_BASICA') return isTri ? POTENCIAS_REBT_BASICA_TRI : POTENCIAS_REBT_BASICA_MONO;
  if (supplyType === 'VIVIENDA_ELEVADA') return isTri ? POTENCIAS_REBT_ELEVADA_TRI : POTENCIAS_REBT_ELEVADA_MONO;
  return null;
}

interface DatosFormProps { installation: Installation; isSaving: boolean; onSave: (data: UpdateInstallationDto) => Promise<void>; }

function Section({ title, num, defaultOpen = true, children, badge }: { title: string; num: number; defaultOpen?: boolean; children: React.ReactNode; badge?: React.ReactNode; }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border border-surface-200 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-3 w-full px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors text-left">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">{num}</span>
        <span className="text-sm font-semibold text-surface-900 flex-1">{title}</span>
        {badge}
        {open ? <ChevronDown className="h-4 w-4 text-surface-400" /> : <ChevronRight className="h-4 w-4 text-surface-400" />}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </section>
  );
}

const inputCls = 'h-9 rounded-md border border-surface-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
const inputLockedCls = 'h-9 rounded-md border border-surface-200 bg-surface-100 px-3 text-sm text-surface-500 w-full cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
const selectFieldCls = 'h-9 rounded-md border border-surface-300 bg-white px-2 text-sm w-full';
const selectLockedCls = 'h-9 rounded-md border border-surface-200 bg-surface-100 px-2 text-sm text-surface-500 w-full cursor-not-allowed';

// ─── Diccionario de ayuda por campo ─────────────────────────────
const FIELD_HELP: Record<string, string> = {
  // Datos técnicos
  tipoActuacion: 'N = Nueva instalación, A = Ampliación-Reforma, M = Modificación, CN = Cambio de Nombre, CT = Cambio Tensión.',
  puntoConexion: 'RBT = Red de Baja Tensión, CT = Centro de Transformación.',
  tipoAcometida: 'Aérea o Subterránea, según información de la empresa distribuidora.',
  materialAcometida: 'Cu = Cobre, Al = Aluminio. Según tabla de referencia de la carpeta informativa.',
  gradoElectrificacion: 'Básica: ≤ 5.750 W (sup ≤ 160 m²). Elevada: ≤ 9.200 W (sup > 160 m² o con calefacción/AA).',
  usoInstalacion: 'Se rellena automáticamente desde el tipo de instalación CIE seleccionado. Coincide con el campo "Uso" de la MTD.',
  superficieM2: 'Superficie útil del local o vivienda en metros cuadrados.',
  supplyVoltage: '230V para monofásica, 400V para trifásica.',
  esquemaDistribucion: 'TT = Neutro a tierra (habitual en España), TN-S, TN-C, IT.',
  // CGP
  tipoCgp: 'CGP = Caja General de Protección (con esquema). BTV = Bases Tripolares Verticales (nº salidas).',
  inBaseCgp: 'Intensidad nominal de la base del fusible de la CGP.',
  inCartuchoCgp: 'Intensidad nominal del cartucho fusible instalado.',
  // LGA + DI
  seccionLga: 'Sección del conductor de la Línea General de Alimentación (mm²). Solo para edificios.',
  seccionDi: 'Sección del conductor de la Derivación Individual (mm²). Calculada automáticamente.',
  materialDi: 'Cu = Cobre, Al = Aluminio.',
  longitudDi: 'Longitud de la Derivación Individual en metros, desde el contador hasta el cuadro.',
  aislamientoDi: 'PVC: Uso general, hasta 70 °C. XLPE: Mayor capacidad de corriente, hasta 90 °C, recomendado para potencias altas. EPR: Mismo límite que XLPE (90 °C), más flexible, adecuado para instalaciones con curvas o movilidad.',
  aislamientoLga: 'PVC: Uso general, hasta 70 °C. XLPE: Mayor capacidad de corriente, hasta 90 °C, recomendado para potencias altas. EPR: Mismo límite que XLPE (90 °C), más flexible, adecuado para instalaciones con curvas o movilidad.',
  tipoInstalacionDi: 'Método de instalación según ITC-BT-19, Tabla 1. A1/A2: Empotrado en pared aislante. B1/B2: En tubo sobre pared o empotrado en obra. C: Cable sobre pared o bandeja maciza. D: Enterrado en tubo. E: Cable al aire en bandeja perforada. F: Conductores al aire espaciados.',
  // Módulo medida
  tipoModuloMedida: 'Envolvente, panelable o armario independiente.',
  situacionModulo: 'Interior del local, en fachada, en cuarto de centralización, etc.',
  // Protecciones
  igaNominal: 'Intensidad nominal del Interruptor General Automático (A). Se calcula según potencia contratada.',
  igaPoderCorte: 'Poder de corte del IGA en kA. Mínimo 4.5 kA según REBT.',
  diferencialNominal: 'Intensidad nominal del Interruptor Diferencial principal (A).',
  diferencialSensibilidad: 'Sensibilidad del diferencial: 30 mA para protección de personas, 300 mA para protección de incendio.',
  // Puesta a tierra
  tipoElectrodos: 'Picas: electrodos verticales. Placas: electrodos de placa. Mallas: conductor enterrado en anillo.',
  seccionLineaEnlace: 'Sección del conductor que conecta el electrodo de tierra con el punto de puesta a tierra (mm²).',
  seccionCondProteccion: 'Sección del conductor de protección PE según ITC-BT-18 (mm²). Se calcula automáticamente.',
  resistenciaTierra: 'Resistencia de la toma de tierra medida (Ω). Máximo 37Ω para diferencial 30mA / Uc≤50V.',
  resistenciaAislamiento: 'Resistencia de aislamiento de la instalación (MΩ). Mínimo según ITC-BT-19.',
  // Presupuesto
  presupuestoMateriales: 'Coste de materiales eléctricos (cables, protecciones, canalizaciones, mecanismos, etc.).',
  presupuestoManoObra: 'Coste de mano de obra de la instalación.',
  presupuestoTotal: 'Total = Materiales + Mano de obra (sin IVA).',
  // CIE
  tipoInstalacionCie: 'Tipo de instalación según nomenclatura CIE oficial. Filtrado automáticamente según la categoría elegida en el wizard.',
  // Empresa
  empresaCategoria: 'IBTB = Instalador BT Categoría Básica. IBTE = Categoría Especialista.',
  empresaRegNum: 'Número de inscripción de la empresa en el Registro Industrial de la Comunidad Autónoma.',
  instaladorCertNum: 'Número del certificado de cualificación individual del instalador.',
  // Distribuidora
  distribuidora: 'Empresa distribuidora eléctrica de la zona (UFD, i-DE, E-REDES, etc.).',
  // Memoria
  memoriaDescriptiva: 'Descripción de la instalación para la página 6 de la MTD. Incluir tipo de local, uso, características generales.',
  firmaLugar: 'Localidad donde se firma la Memoria Técnica de Diseño.',
};

function HelpTip({ field }: { field: string }) {
  const [open, setOpen] = useState(false);
  const text = FIELD_HELP[field];
  if (!text) return null;
  return (
    <span className="relative inline-block ml-1 group">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setTimeout(() => setOpen(false), 150)}
        className="text-surface-400 hover:text-blue-500 transition-colors"
        aria-label="Ayuda"
      >
        <HelpCircle className="inline h-3 w-3" />
      </button>
      {open && (
        <span
          className="absolute z-50 left-0 top-5 w-72 rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-xs text-surface-700 shadow-lg leading-relaxed"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function TextField({ label, field, value, onChange, placeholder, className, rf, locked }: { label: string; field: string; value: string; onChange: (f: string, v: string) => void; placeholder?: string; className?: string; rf: string[]; locked?: boolean; }) {
  const req = rf.includes(field);
  return (<div className={className ?? ''}><Label className="text-xs text-surface-700 mb-1 block">{label}{req && <span className="text-red-600 ml-0.5">*</span>}{locked && <Lock className="inline h-3 w-3 ml-1 text-surface-400" />}<HelpTip field={field} /></Label><input className={locked ? inputLockedCls : `${inputCls} ${req && !value ? 'border-amber-300' : ''}`} value={value} onChange={(e) => !locked && onChange(field, e.target.value)} placeholder={placeholder} disabled={locked} title={locked ? 'Modificar en Cuadro eléctrico' : undefined} /></div>);
}

function NumberField({ label, field, value, onChange, placeholder, step, className, suffix, rf, locked }: { label: string; field: string; value: number | string; onChange: (f: string, v: string) => void; placeholder?: string; step?: string; className?: string; suffix?: string; rf: string[]; locked?: boolean; }) {
  const req = rf.includes(field);
  return (<div className={className ?? ''}><Label className="text-xs text-surface-700 mb-1 block">{label}{req && <span className="text-red-600 ml-0.5">*</span>}{locked && <Lock className="inline h-3 w-3 ml-1 text-surface-400" />}<HelpTip field={field} /></Label><div className="relative"><input className={locked ? inputLockedCls : `${inputCls} ${req && !value ? 'border-amber-300' : ''}`} type="number" step={step ?? '1'} value={value} onChange={(e) => !locked && onChange(field, e.target.value)} placeholder={placeholder} disabled={locked} title={locked ? 'Modificar en Cuadro eléctrico' : undefined} />{suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-surface-400">{suffix}</span>}</div></div>);
}

function SelectField({ label, field, value, onChange, options, placeholder, className, rf, locked }: { label: string; field: string; value: string; onChange: (f: string, v: string) => void; options: Array<{ value: string; label: string }> | string[]; placeholder?: string; className?: string; rf: string[]; locked?: boolean; }) {
  const req = rf.includes(field);
  const opts = typeof options[0] === 'string' ? (options as string[]).map((o) => ({ value: o, label: o })) : (options as Array<{ value: string; label: string }>);
  return (<div className={className ?? ''}><Label className="text-xs text-surface-700 mb-1 block">{label}{req && <span className="text-red-600 ml-0.5">*</span>}{locked && <Lock className="inline h-3 w-3 ml-1 text-surface-400" />}<HelpTip field={field} /></Label><select className={locked ? selectLockedCls : `${selectFieldCls} ${req && !value ? 'border-amber-300' : ''}`} value={value} onChange={(e) => !locked && onChange(field, e.target.value)} disabled={locked} title={locked ? 'Modificar en Cuadro eléctrico' : undefined}><option value="">{placeholder ?? 'Seleccionar...'}</option>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>);
}

function DireccionFields({ prefix, data, onChange, rf }: { prefix: string; data: Record<string, string>; onChange: (f: string, v: string) => void; rf: string[]; }) {
  return (<><div className="grid grid-cols-4 gap-3"><SelectField label="Tipo vía" field={`${prefix}TipoVia`} value={data[`${prefix}TipoVia`] ?? ''} onChange={onChange} options={TIPOS_VIA} className="col-span-1" rf={rf} /><TextField label="Nombre vía" field={`${prefix}NombreVia`} value={data[`${prefix}NombreVia`] ?? ''} onChange={onChange} className="col-span-2" rf={rf} /><TextField label="Nº" field={`${prefix}Numero`} value={data[`${prefix}Numero`] ?? ''} onChange={onChange} className="col-span-1" rf={rf} /></div><div className="grid grid-cols-4 gap-3"><TextField label="Bloque" field={`${prefix}Bloque`} value={data[`${prefix}Bloque`] ?? ''} onChange={onChange} rf={rf} /><TextField label="Escalera" field={`${prefix}Escalera`} value={data[`${prefix}Escalera`] ?? ''} onChange={onChange} rf={rf} /><TextField label="Piso" field={`${prefix}Piso`} value={data[`${prefix}Piso`] ?? ''} onChange={onChange} rf={rf} /><TextField label="Puerta" field={`${prefix}Puerta`} value={data[`${prefix}Puerta`] ?? ''} onChange={onChange} rf={rf} /></div><div className="grid grid-cols-3 gap-3"><TextField label="Localidad" field={`${prefix}Localidad`} value={data[`${prefix}Localidad`] ?? ''} onChange={onChange} rf={rf} /><TextField label="Provincia" field={`${prefix}Provincia`} value={data[`${prefix}Provincia`] ?? ''} onChange={onChange} rf={rf} /><TextField label="C.P." field={`${prefix}Cp`} value={data[`${prefix}Cp`] ?? ''} onChange={onChange} placeholder="28001" rf={rf} /></div></>);
}

// ─── Componente principal ─────────────────────────────────────

export function DatosForm({ installation, isSaving, onSave }: DatosFormProps) {
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [data, setData] = useState<Record<string, any>>({});

  const isCalculated = installation.status !== 'DRAFT';
  const isLocked = (field: string) => isCalculated && CALC_LOCKED_FIELDS.has(field);

  useEffect(() => {
    const i = installation as any;
    setData({
      // Autor memoria
      tipoAutor: i.tipoAutor??'INSTALADOR',
      // Titular
      titularNif: i.titularNif??'', titularNombre: i.titularNombre??i.titularName??'',
      titularApellido1: i.titularApellido1??'', titularApellido2: i.titularApellido2??'',
      titularTipoVia: i.titularTipoVia??'', titularNombreVia: i.titularNombreVia??'',
      titularNumero: i.titularNumero??'', titularBloque: i.titularBloque??'',
      titularEscalera: i.titularEscalera??'', titularPiso: i.titularPiso??'',
      titularPuerta: i.titularPuerta??'', titularLocalidad: i.titularLocalidad??'',
      titularProvincia: i.titularProvincia??'', titularCp: i.titularCp??'',
      titularEmail: i.titularEmail??'', titularTelefono: i.titularTelefono??'', titularMovil: i.titularMovil??'',
      representanteNombre: i.representanteNombre??'', representanteNif: i.representanteNif??'',
      // Emplazamiento
      emplazTipoVia: i.emplazTipoVia??'', emplazNombreVia: i.emplazNombreVia??'',
      emplazNumero: i.emplazNumero??'', emplazBloque: i.emplazBloque??'',
      emplazEscalera: i.emplazEscalera??'', emplazPiso: i.emplazPiso??'',
      emplazPuerta: i.emplazPuerta??'', emplazLocalidad: i.emplazLocalidad??'',
      emplazProvincia: i.emplazProvincia??'', emplazCp: i.emplazCp??'',
      superficieM2: i.superficieM2??'', cups: i.cups??'',
      contadorUbicacion: i.contadorUbicacion??'',
      // Datos técnicos
      supplyType: i.supplyType??'VIVIENDA_BASICA', supplyVoltage: String(i.supplyVoltage??230),
      tipoActuacion: i.tipoActuacion??'NUEVA', usoInstalacion: i.usoInstalacion??'', aforo: i.aforo??'N/A',
      tipoInstalacionCie: i.tipoInstalacionCie??'',
      gradoElectrificacion: i.gradoElectrificacion??'',
      temporalidad: i.temporalidad??'',
      numRegistroExistente: i.numRegistroExistente??'',
      esquemaDistribucion: i.esquemaDistribucion??'TT',
      potMaxAdmisible: i.potMaxAdmisible??'',
      potAmpliacion: i.potAmpliacion??'',
      potOriginal: i.potOriginal??'',
      // Acometida
      puntoConexion: i.puntoConexion??'RBT', tipoAcometida: i.tipoAcometida??'',
      seccionAcometida: i.seccionAcometida??'', materialAcometida: i.materialAcometida??'CU',
      // CGP
      tipoCgp: i.tipoCgp??'', inBaseCgp: i.inBaseCgp??'', inCartuchoCgp: i.inCartuchoCgp??'',
      // LGA
      seccionLga: i.seccionLga??'', materialLga: i.materialLga??'CU',
      longitudLga: i.longitudLga??'', aislamientoLga: i.aislamientoLga??'',
      // DI
      seccionDi: i.seccionDi??'', materialDi: i.materialDi??'CU', numDerivaciones: i.numDerivaciones??'1',
      longitudDi: i.longitudDi??'', aislamientoDi: i.aislamientoDi??'', tipoInstalacionDi: i.tipoInstalacionDi??'',
      // Módulo medida
      tipoModuloMedida: i.tipoModuloMedida??'', situacionModulo: i.situacionModulo??'',
      // Protecciones
      igaNominal: i.igaNominal??'', igaPoderCorte: i.igaPoderCorte??'',
      diferencialNominal: i.diferencialNominal??'', diferencialSensibilidad: i.diferencialSensibilidad??'',
      // Puesta a tierra
      tipoElectrodos: i.tipoElectrodos??'',
      seccionLineaEnlace: i.seccionLineaEnlace??'', seccionCondProteccion: i.seccionCondProteccion??'',
      resistenciaTierra: i.resistenciaTierra??'', resistenciaAislamiento: i.resistenciaAislamiento??'',
      protSobretensiones: i.protSobretensiones??false,
      otrasVerificaciones: i.otrasVerificaciones??'',
      // Empresa
      empresaNif: i.empresaNif??'', empresaNombre: i.empresaNombre??'',
      empresaCategoria: i.empresaCategoria??'', empresaRegNum: i.empresaRegNum??i.installerRegNum??'',
      instaladorNombre: i.instaladorNombre??i.installerName??'',
      instaladorNif: i.instaladorNif??i.installerNif??'', instaladorCertNum: i.instaladorCertNum??'',
      empresaTipoVia: i.empresaTipoVia??'', empresaNombreVia: i.empresaNombreVia??'',
      empresaNumero: i.empresaNumero??'',
      empresaLocalidad: i.empresaLocalidad??'', empresaProvincia: i.empresaProvincia??'',
      empresaCp: i.empresaCp??'', empresaTelefono: i.empresaTelefono??'',
      empresaMovil: i.empresaMovil??'', empresaEmail: i.empresaEmail??'',
      // Distribuidora
      distribuidora: i.distribuidora??'',
      // CIE específicos
      aplicaReeae: i.aplicaReeae??false, potLuminariasReeae: i.potLuminariasReeae??'',
      aplicaItcBt51: i.aplicaItcBt51??false,
      // MTD
      memoriaDescriptiva: i.memoriaDescriptiva??'',
      // Presupuesto
      presupuestoMateriales: i.presupuestoMateriales??'', presupuestoManoObra: i.presupuestoManoObra??'',
      presupuestoTotal: i.presupuestoTotal??'',
      // Info adicional + firma
      infoAdicional: i.infoAdicional??'', firmaLugar: i.firmaLugar??'',
    });
    setDirty(false);
  }, [installation]);

  const set = (field: string, value: any) => { setData((prev) => ({ ...prev, [field]: value })); setDirty(true); };

  // Filtrar tipos CIE según categoría del wizard
  const wizardCategory = (installation as any).installationType as string | undefined;
  const cieTypeOptions = useMemo(() => {
    if (wizardCategory && WIZARD_TO_CIE_TYPES[wizardCategory]) return WIZARD_TO_CIE_TYPES[wizardCategory];
    return ALL_CIE_TYPES;
  }, [wizardCategory]);

  // Auto-preseleccionar si solo hay 1 subtipo
  useEffect(() => {
    if (cieTypeOptions.length === 1 && data.tipoInstalacionCie !== cieTypeOptions[0].value) {
      setData((prev) => ({ ...prev, tipoInstalacionCie: cieTypeOptions[0].value, usoInstalacion: cieTypeOptions[0].value }));
      setDirty(true);
    }
  }, [cieTypeOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const rf = useMemo(() => getRequiredFields(data), [data]);
  const sv = useMemo(() => getSpecialValidations(data), [data]);
  const { filled, total, percent } = useMemo(() => {
    let fc = 0;
    for (const f of rf) { const v = data[f]; if (v !== undefined && v !== null && v !== '' && v !== false) fc++; }
    const so = sv.filter((s) => s.ok).length;
    const t = rf.length + sv.length;
    return { filled: fc + so, total: t, percent: Math.round(((fc + so) / t) * 100) };
  }, [data, rf, sv]);

  const handleSave = async () => {
    const dto: UpdateInstallationDto = {};
    const nf = ['superficieM2','seccionAcometida','inBaseCgp','inCartuchoCgp','seccionLga','seccionDi','seccionLineaEnlace','seccionCondProteccion','resistenciaTierra','resistenciaAislamiento','presupuestoMateriales','presupuestoManoObra','presupuestoTotal','longitudDi','longitudLga','potMaxAdmisible','potAmpliacion','potOriginal','igaNominal','igaPoderCorte','diferencialNominal','potLuminariasReeae'];
    const intFields = ['supplyVoltage','numDerivaciones','diferencialSensibilidad','temporalidad'];
    const boolFields = ['protSobretensiones','aplicaReeae','aplicaItcBt51'];
    for (const [k, v] of Object.entries(data)) {
      // Locked fields: enviar al backend pero no editables en UI
      if (boolFields.includes(k)) { (dto as any)[k] = !!v; }
      else if (typeof v === 'string' && v === '') (dto as any)[k] = null;
      else if (intFields.includes(k)) (dto as any)[k] = v ? Number(v) : null;
      else if (nf.includes(k)) (dto as any)[k] = v ? Number(v) : null;
      else (dto as any)[k] = v;
    }
    dto.titularName = data.titularNombre || null;
    await onSave(dto);
    setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const telTH = !(data.titularTelefono || data.titularMovil);
  const telEH = !(data.empresaTelefono || data.empresaMovil);
  const isModifAmpl = data.tipoActuacion === 'MODIFICACION' || data.tipoActuacion === 'AMPLIACION';

  return (
    <div className="space-y-4">
      {/* AVISO CAMPOS BLOQUEADOS */}
      {isCalculated && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-50 p-3 flex items-start gap-2">
          <Lock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-blue-600 font-medium">Instalación calculada</p>
            <p className="text-xs text-blue-600">Los campos marcados con <Lock className="inline h-3 w-3" /> intervienen en los cálculos y solo pueden modificarse desde la pestaña Cuadro eléctrico.</p>
          </div>
        </div>
      )}

      {/* BARRA COMPLETITUD */}
      <div className="rounded-lg border border-surface-200 p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {percent === 100 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
            <span className="text-sm font-medium text-surface-900">Completitud CIE: {filled}/{total} campos</span>
          </div>
          <span className={`text-sm font-bold ${percent === 100 ? 'text-emerald-600' : percent > 50 ? 'text-amber-600' : 'text-red-600'}`}>{percent}%</span>
        </div>
        <div className="w-full bg-surface-100 rounded-full h-2"><div className={`h-2 rounded-full transition-all ${percent === 100 ? 'bg-emerald-500' : percent > 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${percent}%` }} /></div>
        {percent < 100 && <p className="text-xs text-surface-500 mt-2">Faltan {total - filled} campos obligatorios para generar el CIE. Los campos con <span className="text-red-600">*</span> son obligatorios.</p>}
        {sv.filter((s) => !s.ok).map((s) => <p key={s.field} className="text-xs text-amber-600 mt-1">⚠ {s.msg}</p>)}
      </div>

      {/* BANNER TIPO DE INSTALACIÓN */}
      {(installation as any).installationType && (() => {
        const instType = getInstallationType((installation as any).installationType);
        const Icon = instType?.icon;
        return (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 flex items-center gap-2 text-sm text-blue-700">
            {Icon ? <Icon className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            Tipo: {instType?.name || (installation as any).installationType}
            {instType?.sub && <span className="text-blue-500 text-xs">— {instType.sub}</span>}
          </div>
        );
      })()}

      {/* 1. AUTOR DE LA MEMORIA */}
      <Section title="Autor de la Memoria" num={1}>
        <SelectField label="Autor" field="tipoAutor" value={data.tipoAutor??''} onChange={set} options={TIPOS_AUTOR} className="w-64" rf={rf} />
      </Section>

      {/* 2. TITULAR */}
      <Section title="Datos del Titular" num={2}>
        <div className="grid grid-cols-3 gap-3">
          <TextField label="NIF / CIF" field="titularNif" value={data.titularNif??''} onChange={set} placeholder="12345678A" rf={rf} />
          <TextField label="Nombre / Razón Social" field="titularNombre" value={data.titularNombre??''} onChange={set} rf={rf} />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Primer apellido" field="titularApellido1" value={data.titularApellido1??''} onChange={set} rf={rf} />
          <TextField label="Segundo apellido" field="titularApellido2" value={data.titularApellido2??''} onChange={set} rf={rf} />
        </div>
        <DireccionFields prefix="titular" data={data} onChange={set} rf={rf} />
        <div className="grid grid-cols-3 gap-3">
          <TextField label="Correo-e" field="titularEmail" value={data.titularEmail??''} onChange={set} placeholder="titular@email.com" rf={rf} />
          <div><Label className="text-xs text-surface-700 mb-1 block">Teléfono fijo{telTH && <span className="text-red-600 ml-0.5">*</span>}</Label><input className={`${inputCls} ${telTH ? 'border-amber-300' : ''}`} value={data.titularTelefono??''} onChange={(e) => set('titularTelefono', e.target.value)} />{telTH && <p className="text-xs text-amber-500 mt-0.5">Fijo o móvil obligatorio</p>}</div>
          <div><Label className="text-xs text-surface-700 mb-1 block">Móvil{telTH && <span className="text-red-600 ml-0.5">*</span>}</Label><input className={`${inputCls} ${telTH ? 'border-amber-300' : ''}`} value={data.titularMovil??''} onChange={(e) => set('titularMovil', e.target.value)} /></div>
        </div>
        <div className="border-t border-surface-600 pt-3 mt-2">
          <p className="text-xs text-surface-400 mb-2">Representante (si el titular no es persona física)</p>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Nombre representante" field="representanteNombre" value={data.representanteNombre??''} onChange={set} rf={rf} />
            <TextField label="NIF representante" field="representanteNif" value={data.representanteNif??''} onChange={set} rf={rf} />
          </div>
        </div>
      </Section>

      {/* 3. EMPLAZAMIENTO */}
      <Section title="Emplazamiento de la Instalación" num={3}>
        <DireccionFields prefix="emplaz" data={data} onChange={set} rf={rf} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="CUPS" field="cups" value={data.cups??''} onChange={set} placeholder="ES0000000000000000XX" rf={rf} />
          <NumberField label="Superficie" field="superficieM2" value={data.superficieM2??''} onChange={set} placeholder="45" suffix="m²" rf={rf} />
        </div>
        <SelectField label="Ubicación contador" field="contadorUbicacion" value={data.contadorUbicacion??''} onChange={set} options={UBICACIONES_CONTADOR} className="w-48" rf={rf} />
      </Section>

      {/* 4. DATOS TÉCNICOS */}
      <Section title="Datos Técnicos" num={4}>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Tipo instalación (cálculo)" field="supplyType" value={data.supplyType??''} onChange={set} options={SUPPLY_TYPES} rf={rf} locked={isLocked('supplyType')} />
          <SelectField label="Tensión" field="supplyVoltage" value={data.supplyVoltage??'230'} onChange={set} options={[{value:'230',label:'230 V (Monofásica)'},{value:'400',label:'400 V (Trifásica)'}]} rf={rf} locked={isLocked('supplyVoltage')} />
          <SelectField label="Actuación" field="tipoActuacion" value={data.tipoActuacion??''} onChange={set} options={TIPOS_ACTUACION} rf={rf} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Tipo instalación (CIE)" field="tipoInstalacionCie" value={data.tipoInstalacionCie??''} onChange={(f, v) => { set(f, v); set('usoInstalacion', v); }} options={cieTypeOptions} rf={rf} />
          <TextField label="Uso de la instalación" field="usoInstalacion" value={data.usoInstalacion??''} onChange={set} placeholder="Se rellena automáticamente" rf={rf} />
          <TextField label="Aforo" field="aforo" value={data.aforo??''} onChange={set} placeholder="N/A" rf={rf} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Esquema de distribución" field="esquemaDistribucion" value={data.esquemaDistribucion??'TT'} onChange={set} options={ESQUEMAS_DISTRIBUCION} rf={rf} locked={isLocked('esquemaDistribucion')} />
          {getPotenciasRebt(data.supplyType, data.supplyVoltage) ? (
            <SelectField label="P. máx. admisible" field="potMaxAdmisible" value={data.potMaxAdmisible ? String(Math.round(Number(data.potMaxAdmisible) * 1000)) : ''} onChange={(f, v) => set(f, v ? Number(v) / 1000 : '')} options={getPotenciasRebt(data.supplyType, data.supplyVoltage)!} placeholder="Seleccionar potencia..." rf={rf} locked={isLocked('potMaxAdmisible')} />
          ) : (
            <NumberField label="P. máx. admisible" field="potMaxAdmisible" value={data.potMaxAdmisible??''} onChange={set} suffix="kW" step="0.01" rf={rf} locked={isLocked('potMaxAdmisible')} />
          )}
          <TextField label="Grado electrificación" field="gradoElectrificacion" value={data.gradoElectrificacion??''} onChange={set} placeholder="BASICO / ELEVADO" rf={rf} locked={isLocked('gradoElectrificacion')} />
        </div>
        {isModifAmpl && (
          <div className="grid grid-cols-3 gap-3 border-t border-surface-600 pt-3">
            <NumberField label="Pot. original" field="potOriginal" value={data.potOriginal??''} onChange={set} suffix="kW" step="0.01" rf={rf} />
            <NumberField label="Pot. ampliación/modif." field="potAmpliacion" value={data.potAmpliacion??''} onChange={set} suffix="kW" step="0.01" rf={rf} />
            <TextField label="Nº registro existente" field="numRegistroExistente" value={data.numRegistroExistente??''} onChange={set} rf={rf} />
          </div>
        )}
        {data.tipoInstalacionCie?.includes('TEMP') && (
          <NumberField label="Temporalidad" field="temporalidad" value={data.temporalidad??''} onChange={set} suffix="días" className="w-48" rf={rf} />
        )}
      </Section>

      {/* 5. ACOMETIDA */}
      <Section title="Acometida" num={5} defaultOpen={false}>
        <div className="grid grid-cols-4 gap-3">
          <SelectField label="Punto de conexión" field="puntoConexion" value={data.puntoConexion??''} onChange={set} options={PUNTOS_CONEXION} rf={rf} />
          <SelectField label="Tipo" field="tipoAcometida" value={data.tipoAcometida??''} onChange={set} options={TIPOS_ACOMETIDA} rf={rf} />
          <NumberField label="Sección" field="seccionAcometida" value={data.seccionAcometida??''} onChange={set} suffix="mm²" rf={rf} locked={isLocked('seccionAcometida')} />
          <SelectField label="Material" field="materialAcometida" value={data.materialAcometida??''} onChange={set} options={MATERIALES} rf={rf} locked={isLocked('materialAcometida')} />
        </div>
      </Section>

      {/* 6. CGP */}
      <Section title="C.G.P. o C/C de Seguridad" num={6} defaultOpen={false}>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Tipo" field="tipoCgp" value={data.tipoCgp??''} onChange={set} options={TIPOS_CGP} rf={rf} />
          <NumberField label="In. Base" field="inBaseCgp" value={data.inBaseCgp??''} onChange={set} suffix="A" rf={rf} />
          <NumberField label="In. Cartucho" field="inCartuchoCgp" value={data.inCartuchoCgp??''} onChange={set} suffix="A" rf={rf} />
        </div>
      </Section>

      {/* 7. LGA + DI */}
      <Section title="L.G.A. y Derivación Individual" num={7} defaultOpen={false}>
        <p className="text-xs text-surface-500 font-medium mb-1">Línea General de Alimentación</p>
        <div className="grid grid-cols-4 gap-3">
          <NumberField label="Sección LGA" field="seccionLga" value={data.seccionLga??''} onChange={set} suffix="mm²" rf={rf} locked={isLocked('seccionLga')} />
          <SelectField label="Material LGA" field="materialLga" value={data.materialLga??''} onChange={set} options={MATERIALES} rf={rf} locked={isLocked('materialLga')} />
          <NumberField label="Longitud LGA" field="longitudLga" value={data.longitudLga??''} onChange={set} suffix="m" step="0.1" rf={rf} locked={isLocked('longitudLga')} />
          <SelectField label="Aislamiento LGA" field="aislamientoLga" value={data.aislamientoLga??''} onChange={set} options={AISLAMIENTOS} rf={rf} locked={isLocked('aislamientoLga')} />
        </div>
        <p className="text-xs text-surface-500 font-medium mb-1 mt-3">Derivación Individual</p>
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Sección DI" field="seccionDi" value={data.seccionDi??''} onChange={set} suffix="mm²" rf={rf} locked={isLocked('seccionDi')} />
          <SelectField label="Material DI" field="materialDi" value={data.materialDi??''} onChange={set} options={MATERIALES} rf={rf} locked={isLocked('materialDi')} />
          <NumberField label="Longitud DI" field="longitudDi" value={data.longitudDi??''} onChange={set} suffix="m" step="0.1" rf={rf} locked={isLocked('longitudDi')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Nº Derivaciones" field="numDerivaciones" value={data.numDerivaciones??''} onChange={set} rf={rf} locked={isLocked('numDerivaciones')} />
          <SelectField label="Aislamiento DI" field="aislamientoDi" value={data.aislamientoDi??''} onChange={set} options={AISLAMIENTOS} rf={rf} locked={isLocked('aislamientoDi')} />
          <SelectField label="Tipo instalación DI" field="tipoInstalacionDi" value={data.tipoInstalacionDi??''} onChange={set} options={TIPOS_INSTALACION_DI} rf={rf} locked={isLocked('tipoInstalacionDi')} />
        </div>
      </Section>

      {/* 8. MÓDULO DE MEDIDA */}
      <Section title="Módulo de Medida" num={8} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Tipo" field="tipoModuloMedida" value={data.tipoModuloMedida??''} onChange={set} options={TIPOS_MODULO} rf={rf} />
          <SelectField label="Situación" field="situacionModulo" value={data.situacionModulo??''} onChange={set} options={SITUACIONES_MODULO} rf={rf} />
        </div>
      </Section>

      {/* 9. PROTECCIONES */}
      <Section title="Protecciones" num={9} defaultOpen={false}>
        <div className="grid grid-cols-4 gap-3">
          <NumberField label="IGA (A)" field="igaNominal" value={data.igaNominal??''} onChange={set} suffix="A" rf={rf} locked={isLocked('igaNominal')} />
          <NumberField label="IGA P. corte" field="igaPoderCorte" value={data.igaPoderCorte??''} onChange={set} suffix="kA" rf={rf} locked={isLocked('igaPoderCorte')} />
          <NumberField label="Diferencial (A)" field="diferencialNominal" value={data.diferencialNominal??''} onChange={set} suffix="A" rf={rf} locked={isLocked('diferencialNominal')} />
          <NumberField label="Sensibilidad" field="diferencialSensibilidad" value={data.diferencialSensibilidad??''} onChange={set} suffix="mA" rf={rf} locked={isLocked('diferencialSensibilidad')} />
        </div>
        <div className="flex items-center gap-2"><input type="checkbox" checked={data.protSobretensiones??false} onChange={(e) => set('protSobretensiones', e.target.checked)} className="rounded border-surface-300" /><Label className="text-xs text-surface-700">Protección contra sobretensiones</Label></div>
      </Section>

      {/* 10. PUESTA A TIERRA Y VERIFICACIONES */}
      <Section title="Puesta a Tierra y Verificaciones" num={10} defaultOpen={false}>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Tipo electrodos" field="tipoElectrodos" value={data.tipoElectrodos??''} onChange={set} options={TIPOS_ELECTRODO} rf={rf} />
          <NumberField label="Sección línea enlace" field="seccionLineaEnlace" value={data.seccionLineaEnlace??''} onChange={set} suffix="mm²" rf={rf} locked={isLocked('seccionLineaEnlace')} />
          <NumberField label="Conductor protección" field="seccionCondProteccion" value={data.seccionCondProteccion??''} onChange={set} suffix="mm²" rf={rf} locked={isLocked('seccionCondProteccion')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Resistencia tierra" field="resistenciaTierra" value={data.resistenciaTierra??''} onChange={set} suffix="Ω" step="0.1" rf={rf} />
          <NumberField label="Resistencia aislamiento" field="resistenciaAislamiento" value={data.resistenciaAislamiento??''} onChange={set} suffix="MΩ" step="0.1" rf={rf} />
        </div>
        <div><Label className="text-xs text-surface-700 mb-1 block">Otras verificaciones</Label><textarea className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[60px]" value={data.otrasVerificaciones??''} onChange={(e) => set('otrasVerificaciones', e.target.value)} /></div>
      </Section>

      {/* 11. EMPRESA INSTALADORA */}
      <Section title="Empresa Instaladora" num={11}>
        <div className="grid grid-cols-3 gap-3">
          <TextField label="NIF empresa" field="empresaNif" value={data.empresaNif??''} onChange={set} rf={rf} />
          <TextField label="Nombre / Razón Social" field="empresaNombre" value={data.empresaNombre??''} onChange={set} className="col-span-2" rf={rf} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Categoría" field="empresaCategoria" value={data.empresaCategoria??''} onChange={set} options={CATEGORIAS_EMPRESA} rf={rf} />
          <TextField label="Nº Registro Industrial" field="empresaRegNum" value={data.empresaRegNum??''} onChange={set} rf={rf} />
          <TextField label="Nº Certificado instalador" field="instaladorCertNum" value={data.instaladorCertNum??''} onChange={set} rf={rf} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Nombre instalador (persona)" field="instaladorNombre" value={data.instaladorNombre??''} onChange={set} rf={rf} />
          <TextField label="NIF instalador" field="instaladorNif" value={data.instaladorNif??''} onChange={set} rf={rf} />
        </div>
        <DireccionFields prefix="empresa" data={data} onChange={set} rf={rf} />
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-xs text-surface-700 mb-1 block">Teléfono{telEH && <span className="text-red-600 ml-0.5">*</span>}</Label><input className={`${inputCls} ${telEH ? 'border-amber-300' : ''}`} value={data.empresaTelefono??''} onChange={(e) => set('empresaTelefono', e.target.value)} />{telEH && <p className="text-xs text-amber-500 mt-0.5">Fijo o móvil obligatorio</p>}</div>
          <div><Label className="text-xs text-surface-700 mb-1 block">Móvil{telEH && <span className="text-red-600 ml-0.5">*</span>}</Label><input className={`${inputCls} ${telEH ? 'border-amber-300' : ''}`} value={data.empresaMovil??''} onChange={(e) => set('empresaMovil', e.target.value)} /></div>
          <TextField label="Correo-e" field="empresaEmail" value={data.empresaEmail??''} onChange={set} rf={rf} />
        </div>
      </Section>

      {/* 12. DISTRIBUIDORA */}
      <Section title="Empresa Distribuidora" num={12} defaultOpen={false}>
        <SelectField label="Distribuidora" field="distribuidora" value={data.distribuidora??''} onChange={set} options={DISTRIBUIDORAS.map((d) => ({value:d,label:d}))} rf={rf} />
      </Section>

      {/* 13. CERTIFICACIÓN (CIE) */}
      <Section title="Certificación (CIE)" num={13} defaultOpen={false}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><input type="checkbox" checked={data.aplicaReeae??false} onChange={(e) => set('aplicaReeae', e.target.checked)} className="rounded border-surface-300" /><Label className="text-xs text-surface-700">Aplica RD 1890/2008 (REEAE — Alumbrado)</Label></div>
          {data.aplicaReeae && <NumberField label="Pot. luminarias" field="potLuminariasReeae" value={data.potLuminariasReeae??''} onChange={set} suffix="kW" step="0.01" className="w-40" rf={rf} />}
        </div>
        <div className="flex items-center gap-2"><input type="checkbox" checked={data.aplicaItcBt51??false} onChange={(e) => set('aplicaItcBt51', e.target.checked)} className="rounded border-surface-300" /><Label className="text-xs text-surface-700">Aplica ITC-BT-51 (Domótica)</Label></div>
      </Section>

      {/* 14. PRESUPUESTO */}
      <Section title="Presupuesto" num={14} defaultOpen={false}>
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Materiales" field="presupuestoMateriales" value={data.presupuestoMateriales??''} onChange={set} suffix="€" step="0.01" rf={rf} />
          <NumberField label="Mano de obra" field="presupuestoManoObra" value={data.presupuestoManoObra??''} onChange={set} suffix="€" step="0.01" rf={rf} />
          <NumberField label="Total" field="presupuestoTotal" value={data.presupuestoTotal??''} onChange={set} suffix="€" step="0.01" rf={rf} />
        </div>
      </Section>

      {/* 15. INFO ADICIONAL + MEMORIA */}
      <Section title="Información Adicional y Memoria" num={15} defaultOpen={false}>
        <div><Label className="text-xs text-surface-700 mb-1 block">Descripción de los trabajos (CIE)</Label><textarea className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]" value={data.infoAdicional??''} onChange={(e) => set('infoAdicional', e.target.value)} /></div>
        <div><Label className="text-xs text-surface-700 mb-1 block">Memoria descriptiva (MTD pág. 6)</Label><textarea className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[120px]" value={data.memoriaDescriptiva??''} onChange={(e) => set('memoriaDescriptiva', e.target.value)} placeholder="Descripción detallada de la instalación..." /></div>
        <TextField label="Lugar de firma" field="firmaLugar" value={data.firmaLugar??''} onChange={set} placeholder="MADRID" className="w-48" rf={rf} />
      </Section>

      {/* GUARDAR */}
      <div className="flex items-center gap-3 border-t border-surface-200 pt-5">
        <Button type="button" onClick={handleSave} disabled={isSaving || !dirty}>
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando…</> : saved ? <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />Guardado</> : <><Save className="mr-2 h-4 w-4" />Guardar datos</>}
        </Button>
        {dirty && <span className="text-xs text-amber-600">Cambios sin guardar</span>}
        {!dirty && !saved && <span className="text-xs text-surface-400">Sin cambios</span>}
      </div>
    </div>
  );
}
