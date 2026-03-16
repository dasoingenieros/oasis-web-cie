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
  panelVersion?: string;
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

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'NEEDS_REVIEW' | 'REPORTED';

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
  signedAt?: string | null;
  signedFileUrl?: string | null;
  signerName?: string | null;
  reviewStatus?: ReviewStatus;
  reviewedAt?: string | null;
  reviewNote?: string | null;
}

export interface FeedbackReport {
  id: string;
  tenantId: string;
  installationId: string;
  documentId?: string | null;
  documentType?: string | null;
  description: string;
  screenshotKey?: string | null;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING: 'Pendiente revisión',
  APPROVED: 'Pendiente firma',
  NEEDS_REVIEW: 'Datos incorrectos',
  REPORTED: 'Error reportado',
};

// ─── Field Config / Field Status ─────────────────────────────

export interface DocumentReadiness {
  ready: boolean;
  missingCount: number;
  missingFields: string[];
}

export interface FieldStatusResponse {
  profile: string;
  totalFields: number;
  completedFields: number;
  completionPct: number;
  missingSections: {
    section: string;
    label: string;
    fields: { name: string; label: string; requiredForDocs?: string[] }[];
  }[];
  documentReadiness: {
    MTD: DocumentReadiness;
    CIE: DocumentReadiness;
    SOLICITUD_BT: DocumentReadiness;
  };
}

export interface FieldConfigField {
  name: string;
  label: string;
  group: string;
  inputType?: string;
  options?: string[];
  currentValue: any;
  defaultValue?: any;
  isComplete: boolean;
  requiredForDocs?: string[];
  calculatedBy?: string;
  optional?: boolean;
}

export interface FieldConfigSection {
  id: string;
  label: string;
  fields: FieldConfigField[];
}

export interface FieldConfigResponse {
  profile: string;
  sections: FieldConfigSection[];
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

// ─── Panel Node (Cuadro v2) ──────────────────────────────────

export type PanelNodeType =
  | 'IGA'
  | 'PROTECTOR_SOBRETENSIONES'
  | 'AUTOMATICO'
  | 'DIFERENCIAL'
  | 'GUARDAMOTOR'
  | 'CONTACTOR'
  | 'SUBCUADRO'
  | 'CIRCUITO';

export type ContactorType = 'HORARIO' | 'MANIOBRA' | 'POTENCIA';
export type DiffType = 'AC' | 'A' | 'B' | 'F';

export interface PanelNode {
  id: string;
  tenantId: string;
  installationId: string;
  parentId: string | null;
  position: number;
  nodeType: PanelNodeType;
  name: string | null;
  // Protection fields
  calibreA: number | null;
  polos: number | null;
  curva: string | null;
  poderCorteKa: number | null;
  // Differential fields
  sensitivityMa: number | null;
  diffType: string | null;
  // Circuit fields
  loadType: string | null;
  power: number | null;
  voltage: number | null;
  phases: number | null;
  cosPhi: number | null;
  length: number | null;
  section: number | null;
  cableType: string | null;
  material: string | null;
  installMethod: string | null;
  quantity: number | null;
  // Subcuadro
  subcuadroName: string | null;
  // Contactor
  contactorType: string | null;
  // Calculated
  calcResults: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePanelNodeDto {
  nodeType: PanelNodeType;
  parentId?: string | null;
  position?: number;
  name?: string;
  calibreA?: number;
  polos?: number;
  curva?: string;
  poderCorteKa?: number;
  sensitivityMa?: number;
  diffType?: string;
  loadType?: string;
  power?: number;
  voltage?: number;
  phases?: number;
  cosPhi?: number;
  length?: number;
  section?: number;
  cableType?: string;
  material?: string;
  installMethod?: string;
  quantity?: number;
  subcuadroName?: string;
  contactorType?: string;
}

// ─── Validación del cuadro ──────────────────────────────────
export interface TreeValidationItem {
  nodeId: string | null;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface TreeValidation {
  errors: TreeValidationItem[];
  warnings: TreeValidationItem[];
  info: TreeValidationItem[];
}

export interface CalculateTreeResponse {
  nodes: PanelNode[];
  validation: TreeValidation;
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

// ─── Tramitación ASEICAM ─────────────────────────────────────

export type TramitacionStatus =
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'NEEDS_INPUT'
  | 'SAVED'
  | 'DOCUMENTS_UPLOADED'
  | 'SENT'
  | 'REGISTERED'
  | 'ERROR';

export interface TramitacionExpediente {
  id: string;
  tenantId: string;
  installationId: string;
  portalExpediente: string | null;
  eiciId: string | null;
  eiciNombre: string | null;
  status: TramitacionStatus;
  currentStep: string | null;
  progress: number;
  errorMessage: string | null;
  needsInputData: {
    field: string;
    candidates: { uuid: string; label: string; confidence: number }[];
    searchTerm?: string;
    resolvedInputs?: Record<string, { value: string; label: string }>;
  } | null;
  attempts: number;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TramitacionConfig {
  hasCredentials: boolean;
  portalEiciId: string | null;
  portalEiciName: string | null;
}

export const TRAMITACION_STATUS_LABELS: Record<TramitacionStatus, string> = {
  QUEUED: 'En cola',
  IN_PROGRESS: 'En curso',
  NEEDS_INPUT: 'Requiere acción',
  SAVED: 'Guardado',
  DOCUMENTS_UPLOADED: 'Documentos subidos',
  SENT: 'Enviado',
  REGISTERED: 'Registrado',
  ERROR: 'Error',
};

export const TRAMITACION_STEP_LABELS: Record<string, string> = {
  LOGIN: 'Conectando al portal...',
  CREATE_SOLICITUD: 'Creando solicitud...',
  FILL_OCA_EICI: 'Seleccionando EICI...',
  FILL_EMPLAZAMIENTO: 'Rellenando emplazamiento...',
  FILL_TITULAR: 'Rellenando titular...',
  FILL_DATOS_TECNICOS: 'Rellenando datos técnicos...',
  SAVE: 'Guardando solicitud...',
  UPLOAD_DOCUMENTS: 'Subiendo documentos...',
  SEND: 'Enviando solicitud...',
  VERIFY: 'Verificando envío...',
};

export const OCA_EICI_OPTIONS = [
  { value: 'f2164508-5d30-49f7-a721-084039a78c0e', label: 'Ingeniería de Gestión Industrial (INGEIN)' },
  { value: '3b424b82-2261-45d3-965e-bda0282e1669', label: 'Bureau Veritas (ECA)' },
  { value: '26d7c29e-149e-4e87-b7ce-ca5a8130e40d', label: 'Inspecciones del Sureste (ISPEN)' },
  { value: 'c5036225-0c3f-49c0-9301-3a237a629238', label: 'TÜV Rheinland' },
  { value: 'cedba94d-96f3-41bf-9d87-394f54fcc2fd', label: 'NOVOCONTROL' },
  { value: 'e1280b5b-06bb-472c-8dc5-dbbd9c3c4d0a', label: 'PROTEX' },
  { value: '7de580e8-9f7b-48ae-9320-1a5c5e5441fc', label: 'ALDEC' },
  { value: 'b5d36aeb-5de9-453f-b4de-45bbc395a0a5', label: 'ADDIENT' },
  { value: '5eb2e755-0251-4565-8e97-1e84b2b2cd41', label: 'Tüv Süd ATISAE' },
];
