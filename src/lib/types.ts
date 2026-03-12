// ─── User & Auth ─────────────────────────────────────────────

export type UserRole = 'VIEWER' | 'OPERATOR' | 'SIGNER' | 'ADMIN' | 'SUPERADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
  signerRegNum?: string | null;
  signerCategory?: string | null;
  signerInsurance: boolean;
  signerVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  tenantName?: string;
  acceptedPrivacy: boolean;
}

// ─── Installation ────────────────────────────────────────────

export type InstallationStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'PENDING_REVIEW'
  | 'RETURNED'
  | 'APPROVED'
  | 'DOCUMENTED'
  | 'SIGNED'
  | 'SUBMITTED'
  | 'COMPLETED';

export type SupplyType =
  | 'VIVIENDA_BASICA'
  | 'VIVIENDA_ELEVADA'
  | 'IRVE'
  | 'LOCAL_COMERCIAL';

export type TipoDocumentacion = 'MTD' | 'PROYECTO';

export interface Installation {
  id: string;
  tenantId: string;
  userId: string;
  tipoDocumentacion?: TipoDocumentacion | null;
  installationType?: string | null;
  expedienteType?: string | null;
  referencia?: string | null;
  puntosRecarga?: number | null;
  esquemaIve?: string | null;
  potenciaPico?: number | null;
  modalidadAutoconsumo?: string | null;
  titularName?: string | null;
  titularNif?: string | null;
  titularAddress?: string | null;
  address?: string | null;
  cups?: string | null;
  supplyType?: SupplyType | null;
  contractedPower?: number | null;
  supplyVoltage?: number | null;
  signerId?: string | null;
  installerId?: string | null;
  technicianId?: string | null;
  installerName?: string | null;
  installerNif?: string | null;
  installerRegNum?: string | null;
  seccionDi?: number | null;
  materialDi?: string | null;
  longitudDi?: number | null;
  aislamientoDi?: string | null;
  tipoInstalacionDi?: string | null;
  status: InstallationStatus;
  templateUsed?: string | null;
  reviewNotes?: string | null;
  circuits?: Circuit[];
  calculations?: CalculationResult[];
  documents?: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstallationDto {
  titularName?: string;
  titularNombre?: string;
  titularApellido1?: string;
  titularApellido2?: string;
  titularNif?: string;
  titularTipoVia?: string;
  titularNombreVia?: string;
  titularNumero?: string;
  titularCp?: string;
  titularLocalidad?: string;
  titularAddress?: string;
  address?: string;
  // Emplazamiento (dirección separada)
  emplazTipoVia?: string;
  emplazNombreVia?: string;
  emplazNumero?: string;
  emplazPiso?: string;
  emplazPuerta?: string;
  emplazCp?: string;
  emplazLocalidad?: string;
  emplazProvincia?: string;
  cups?: string;
  supplyType?: SupplyType;
  contractedPower?: number;
  supplyVoltage?: number;
  installerName?: string;
  installerNif?: string;
  installerRegNum?: string;
  tipoDocumentacion?: TipoDocumentacion;
  installationType?: string;
  expedienteType?: string;
  referencia?: string;
  puntosRecarga?: number;
  esquemaIve?: string;
  potenciaPico?: number;
  modalidadAutoconsumo?: string;
  gradoElectrificacion?: string;
  installerId?: string;
  technicianId?: string;
}

export interface WaitlistDto {
  email: string;
  installationType: string;
}

export type UpdateInstallationDto = Partial<CreateInstallationDto> & Record<string, any>;

// ─── Circuit ─────────────────────────────────────────────────

export interface Circuit {
  id: string;
  installationId: string;
  differentialId?: string | null;
  name: string;
  code?: string | null;
  order: number;
  power: number;
  voltage: number;
  phases: number;
  length: number;
  cableType: string;
  insulationType: string;
  installMethod: string;
  cosPhi: number;
  tempCorrFactor: number;
  groupCorrFactor: number;
  breakerCurve?: string;
  breakerCutKa?: number;
  installedPowerW?: number | null;
  calculatedSection?: number | null;
  assignedBreaker?: string | null;
  assignedRCD?: string | null;
  voltageDrop?: number | null;
  voltageDropAcc?: number | null;
  shortCircuit?: number | null;
  compliance?: boolean | null;
  justification?: Record<string, unknown> | null;
  loadType?: string;
  maniobraType?: string | null;
  maniobraCalibreA?: number | null;
  maniobraExtra?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export type LoadType = 'FUERZA' | 'ALUMBRADO' | 'ALUMBRADO_EMERGENCIA' | 'MOTOR' | 'RESISTIVO' | 'IRVE' | 'DOMOTICA';

export interface CreateCircuitDto {
  name: string;
  code?: string;
  order: number;
  power: number;
  voltage: number;
  phases: number;
  length: number;
  cableType: string;
  insulationType: string;
  installMethod: string;
  cosPhi?: number;
  tempCorrFactor?: number;
  groupCorrFactor?: number;
  loadType?: string;
  maniobraType?: string;
  maniobraCalibreA?: number;
  maniobraExtra?: Record<string, unknown>;
}

// ─── Electrical Panel (IGA + Diferenciales) ──────────────────

export interface ElectricalPanel {
  id: string;
  installationId: string;
  igaCalibreA: number;
  igaCurve: string;
  igaPowerCutKa: number;
  igaPoles: number;
  voltage: number;
  maxPowerW?: number | null;
  maxPowerKw?: number;
  differentials: Differential[];
  createdAt: string;
  updatedAt: string;
}

export interface Differential {
  id: string;
  panelId: string;
  name: string;
  order: number;
  calibreA: number;
  sensitivityMa: number;
  type: string;         // AC, A, F, B
  poles: number;
  isProtected?: boolean | null;
  protectionNote?: string | null;
  circuits: CircuitSummary[];
  createdAt: string;
  updatedAt: string;
}

/** Resumen de circuito dentro de un diferencial */
export interface CircuitSummary {
  id: string;
  name: string;
  code?: string | null;
  order: number;
  power: number;
  assignedBreaker?: string | null;
}

export interface UpsertPanelDto {
  igaCalibreA?: number;
  igaCurve?: string;
  igaPowerCutKa?: number;
  igaPoles?: number;
  voltage?: number;
}

export interface UpsertDifferentialDto {
  id?: string;
  name?: string;
  order?: number;
  calibreA?: number;
  sensitivityMa?: number;
  type?: string;
  poles?: number;
  circuitIds?: string[];
}

export interface SavePanelWithDifferentialsDto {
  panel: UpsertPanelDto;
  differentials: UpsertDifferentialDto[];
}

// ─── Calculation ─────────────────────────────────────────────

export interface CalculationResult {
  id: string;
  installationId: string;
  version: number;
  engineVersion: string;
  normVersion: string;
  inputSnapshot: Record<string, unknown>;
  resultSnapshot: Record<string, unknown>;
  allCompliant: boolean;
  calculatedAt: string;
}

// ─── Document ────────────────────────────────────────────────

export interface Document {
  id: string;
  installationId: string;
  type: 'CERTIFICADO' | 'MEMORIA_TECNICA' | 'SOLICITUD' | 'UNIFILAR';
  filename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  isDraft: boolean;
  generatedAt: string;
  version?: number;
}

// ─── API Response wrappers ───────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Usage / Plan ───────────────────────────────────────────

export interface UsageData {
  certsGenerated: number;
  maxCerts: number;
  plan: string;
  isLimited: boolean;
  remaining: number;
}

// ─── Dashboard stats ─────────────────────────────────────────

export interface DashboardStats {
  total: number;
  draft: number;
  calculated: number;
  pendingReview: number;
  completed: number;
  thisMonth: number;
}

// ─── Justification (output del motor eléctrico) ─────────────

export interface JustificationStep {
  title: string;
  description: string;
  formula?: string;
  result?: string;
  reference?: string;   // e.g. "ITC-BT-19, Tabla 1"
  compliant?: boolean;
}

export interface CircuitJustification {
  steps: JustificationStep[];
  summary?: string;
  normVersion?: string;
}

// ─── Installation Summary (calculado en frontend) ────────────

export interface InstallationSummary {
  totalPower: number;           // W
  maxSection: number;           // mm²
  maxVoltageDrop: number;       // %
  maxVoltageDropAcc: number;    // %
  totalCircuits: number;
  compliantCircuits: number;
  nonCompliantCircuits: number;
}

// ─── Installer & Technician ──────────────────────────────────

export interface Installer {
  id: string;
  tenantId: string;
  nombre: string;
  nif?: string | null;
  certNum?: string | null;
  categoria?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Technician {
  id: string;
  tenantId: string;
  nombre: string;
  nif?: string | null;
  titulacion?: string | null;
  numColegiado?: string | null;
  colegioOficial?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  cp?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstallerDto {
  nombre: string;
  nif?: string;
  certNum?: string;
  categoria?: string;
  isDefault?: boolean;
}

export interface CreateTechnicianDto {
  nombre: string;
  nif?: string;
  titulacion?: string;
  numColegiado?: string;
  colegioOficial?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  cp?: string;
  isDefault?: boolean;
}

// ─── Helpers de formato ──────────────────────────────────────

export function formatPower(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(2)} kW`;
  return `${watts} W`;
}

export function formatSection(mm2: number | null | undefined): string {
  if (mm2 == null) return '–';
  return `${mm2} mm²`;
}

export function formatVoltageDrop(pct: number | null | undefined): string {
  if (pct == null) return '–';
  return `${pct.toFixed(2)}%`;
}

export function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '–';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CERTIFICADO: 'Certificado de Instalación Eléctrica',
  MEMORIA_TECNICA: 'Memoria Técnica de Diseño',
  SOLICITUD: 'Solicitud BT',
  UNIFILAR: 'Esquema Unifilar',
};
