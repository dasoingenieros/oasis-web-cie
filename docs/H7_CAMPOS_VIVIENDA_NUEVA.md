# H7 — Investigacion de campos para flujo guiado

> Fecha: 2026-03-16
> Objetivo: Documentar TODOS los campos del modelo Installation, su uso en documentos, y clasificarlos para el flujo guiado de "Vivienda nueva en CAM".

---

## TAREA 1 — Campos completos del modelo Installation

Fuente: `oasis-api-cie/prisma/schema.prisma` (modelo Installation, lineas 138-343)

**Total: 145 campos escalares + 13 relaciones**

### Campos de identidad y estado

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| id | String | Si | cuid() auto |
| tenantId | String | Si | FK tenant |
| userId | String | Si | FK usuario creador |
| status | InstallationStatus | Si | Default DRAFT |
| panelVersion | String | Si | Default "v1" |
| createdAt | DateTime | Si | Auto now() |
| updatedAt | DateTime | Si | Auto @updatedAt |
| deletedAt | DateTime | Nullable | Soft delete |

### Titular (propietario/abonado)

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| holderDocType | String? | No | Tipo doc: NIF, NIE, CIF, Pasaporte. Default "NIF" |
| titularNif | String? | No | NIF/NIE/CIF del titular |
| titularNombre | String? | No | Nombre (o razon social si CIF) |
| titularApellido1 | String? | No | Primer apellido |
| titularApellido2 | String? | No | Segundo apellido |
| titularTipoVia | String? | No | Tipo via: Calle, Avenida, etc. |
| titularNombreVia | String? | No | Nombre de la via |
| titularNumero | String? | No | Numero |
| titularBloque | String? | No | Bloque |
| titularEscalera | String? | No | Escalera |
| titularPiso | String? | No | Piso |
| titularPuerta | String? | No | Puerta |
| titularLocalidad | String? | No | Municipio |
| titularProvincia | String? | No | Provincia |
| titularCp | String? | No | Codigo postal |
| titularEmail | String? | No | Email del titular |
| titularTelefono | String? | No | Telefono fijo |
| titularMovil | String? | No | Telefono movil |
| representanteNombre | String? | No | Nombre del representante legal |
| representanteNif | String? | No | NIF del representante |

### Emplazamiento (ubicacion de la instalacion)

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| emplazTipoVia | String? | No | Tipo via emplazamiento |
| emplazNombreVia | String? | No | Nombre via |
| emplazNumero | String? | No | Numero |
| emplazBloque | String? | No | Bloque |
| emplazEscalera | String? | No | Escalera |
| emplazPiso | String? | No | Piso |
| emplazPuerta | String? | No | Puerta |
| emplazLocalidad | String? | No | Municipio |
| emplazProvincia | String? | No | Provincia |
| emplazCp | String? | No | Codigo postal |
| superficieM2 | Float? | No | Superficie en m2 |
| cups | String? | No | Codigo CUPS del punto de suministro |

### Datos tecnicos generales

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| tipoDocumentacion | String? | No | MTD o PROYECTO |
| supplyType | SupplyType? | No | VIVIENDA_BASICA, VIVIENDA_ELEVADA, IRVE, LOCAL_COMERCIAL |
| supplyVoltage | Int? | No | Tension: 230 o 400V |
| tipoActuacion | String? | No | Nueva, Modificacion, Ampliacion con o sin modif. |
| tipoMemoria | String? | No | Tipo de memoria tecnica |
| usoInstalacion | String? | No | Uso (vivienda, local, etc.) |
| aforo | String? | No | Aforo (LPC) |
| tipoInstalacionCie | String? | No | Tipo instalacion segun CIE (79 tipos) |
| installationType | String? | No | Tipo de instalacion del wizard (vivienda, local, irve...) |
| expedienteType | String? | No | Tipo expediente (NUEVA, AMPLIACION, MODIFICACION...) |
| referencia | String? | No | Referencia interna del usuario |
| gradoElectrificacion | String? | No | BASICO o ELEVADO |
| potMaxAdmisible | Float? | No | Potencia maxima admisible (kW) |
| esquemaDistribucion | String? | No | TT, TN-S, TN-C, TN-C-S, IT |
| temporalidad | Int? | No | Dias (solo instalaciones temporales) |
| numRegistroExistente | String? | No | Num registro existente (modificaciones) |
| potAmpliacion | Float? | No | Potencia ampliada (kW) |
| potOriginal | Float? | No | Potencia original (kW) |
| contractedPower | Float? | No | Potencia contratada (campo legacy) |

### IRVE / Autoconsumo

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| puntosRecarga | Int? | No | Num puntos de recarga (IRVE) |
| esquemaIve | String? | No | Esquema IVE: 4a o 4b |
| potenciaPico | Float? | No | Potencia pico kWp (autoconsumo) |
| modalidadAutoconsumo | String? | No | sin_excedentes, con_excedentes_acogida, con_excedentes_no_acogida |

### Acometida

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| puntoConexion | String? | No | RBT, CT, IA |
| tipoAcometida | String? | No | AEREA o SUBTERRANEA |
| seccionAcometida | Float? | No | Seccion en mm2 |
| materialAcometida | String? | No | CU o AL |

### CGP (Caja General de Proteccion)

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| tipoCgp | String? | No | CGP, BTV, N/A |
| inBaseCgp | Float? | No | Corriente base fusible (A) |
| inCartuchoCgp | Float? | No | Corriente cartucho fusible (A) |

### LGA (Linea General de Alimentacion)

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| seccionLga | Float? | No | Seccion mm2 |
| materialLga | String? | No | CU o AL |
| longitudLga | Float? | No | Longitud en metros |
| aislamientoLga | String? | No | XLPE, PVC, EPR |

### DI (Derivacion Individual)

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| seccionDi | Float? | No | Seccion mm2 |
| cdtDi | Float? | No | Caida de tension % |
| materialDi | String? | No | CU o AL |
| longitudDi | Float? | No | Longitud en metros |
| numDerivaciones | Int? | No | Numero de derivaciones |
| aislamientoDi | String? | No | XLPE, PVC, EPR |
| tipoInstalacionDi | String? | No | Metodo instalacion: A1, B1, C, D, E, F |

### Modulo de medida

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| tipoModuloMedida | String? | No | PANELABLE, ENVOLVENTE, ARMARIO, INDEPENDIENTE |
| situacionModulo | String? | No | INTERIOR o FACHADA |
| contadorUbicacion | String? | No | ARMARIO, LOCAL, CPM |

### Protecciones

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| igaNominal | Float? | No | IGA corriente nominal (A) |
| igaPoderCorte | Float? | No | IGA poder de corte (kA) |
| diferencialNominal | Float? | No | Diferencial corriente nominal (A) |
| diferencialSensibilidad | Int? | No | Diferencial sensibilidad (mA) |
| protSobretensiones | Boolean? | No | Proteccion sobretensiones. Default false |

### Puesta a tierra y verificaciones

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| tipoElectrodos | String? | No | PICAS, PLACAS, MALLAS |
| seccionLineaEnlace | Float? | No | Seccion conductor enlace mm2 |
| seccionCondProteccion | Float? | No | Seccion conductor proteccion mm2 |
| resistenciaTierra | Float? | No | Resistencia tierra (ohm) |
| resistenciaAislamiento | Float? | No | Resistencia aislamiento (Mohm) |
| otrasVerificaciones | String? | No | Texto libre verificaciones adicionales |

### Empresa instaladora

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| empresaNif | String? | No | NIF/CIF empresa |
| empresaNombre | String? | No | Razon social |
| empresaCategoria | String? | No | IBTB (Basica) o IBTE (Especialista) |
| empresaRegNum | String? | No | Num registro industrial |
| empresaTipoVia | String? | No | Tipo via domicilio empresa |
| empresaNombreVia | String? | No | Nombre via |
| empresaNumero | String? | No | Numero |
| empresaLocalidad | String? | No | Localidad |
| empresaProvincia | String? | No | Provincia |
| empresaCp | String? | No | Codigo postal |
| empresaTelefono | String? | No | Telefono fijo |
| empresaMovil | String? | No | Movil |
| empresaEmail | String? | No | Email |

### Instalador / Tecnico

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| instaladorNombre | String? | No | Nombre completo instalador |
| instaladorNif | String? | No | NIF instalador |
| instaladorCertNum | String? | No | Num certificado instalador |
| tipoAutor | String? | No | INSTALADOR o TECNICO |
| installerId | String? | No | FK a tabla Installer |
| technicianId | String? | No | FK a tabla Technician |

### Distribuidora

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| distribuidora | String? | No | Empresa distribuidora (I-DE, UFD, E-Distribucion...) |

### Presupuesto

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| presupuestoMateriales | Float? | No | Coste materiales (EUR) |
| presupuestoManoObra | Float? | No | Coste mano de obra (EUR) |
| presupuestoTotal | Float? | No | Coste total (EUR) |

### Certificacion / Normativa

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| aplicaReeae | Boolean? | No | Aplica RD 1890/2008 REEAE. Default false |
| potLuminariasReeae | Float? | No | Potencia luminarias REEAE (kW) |
| aplicaItcBt51 | Boolean? | No | Aplica ITC-BT-51 domotica. Default false |

### Firma y cierre

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| firmaLugar | String? | No | Lugar de firma (default MADRID) |
| firmaFecha | DateTime? | No | Fecha de firma |
| signerId | String? | No | FK al firmante |

### Campos adicionales / metadata

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| identificadorCie | String? | No | Identificador CIE generado automaticamente |
| templateUsed | String? | No | Plantilla usada |
| reviewNotes | String? | No | Notas de revision |
| infoAdicional | String? | No | Texto libre info adicional para CIE |
| memoriaDescriptiva | String? | No | Texto memoria descriptiva para MTD pag 6 |

### Campos legacy (duplicados, del monorepo original)

| Campo | Tipo | Obligatorio | Descripcion |
|-------|------|-------------|-------------|
| titularName | String? | No | Legacy: nombre titular completo |
| titularAddress | String? | No | Legacy: direccion titular completa |
| address | String? | No | Legacy: direccion emplazamiento |
| installerName | String? | No | Legacy: nombre instalador |
| installerNif | String? | No | Legacy: NIF instalador |
| installerRegNum | String? | No | Legacy: num registro instalador |

### Enums referenciados

**InstallationStatus**: DRAFT, CALCULATED, PENDING_REVIEW, RETURNED, APPROVED, DOCUMENTED, SIGNED, SUBMITTED, COMPLETED

**SupplyType**: VIVIENDA_BASICA, VIVIENDA_ELEVADA, IRVE, LOCAL_COMERCIAL

### Relaciones

| Relacion | Tipo | Descripcion |
|----------|------|-------------|
| tenant | Tenant | Multi-tenant |
| user | User | Creador |
| installer | Installer? | Instalador (equipo) |
| technician | Technician? | Tecnico (equipo) |
| circuits | Circuit[] | Circuitos del cuadro |
| calculations | CalculationResult[] | Resultados de calculo |
| documents | Document[] | Documentos generados |
| photos | Photo[] | Fotos |
| signingRequests | SigningRequest[] | Solicitudes de firma |
| panel | ElectricalPanel? | Cuadro electrico |
| unifilarLayout | UnifilarLayout? | Layout unifilar |
| tramitacionExpedientes | TramitacionExpediente[] | Expedientes tramitacion |
| feedbackReports | FeedbackReport[] | Reportes feedback |
| panelNodes | PanelNode[] | Nodos cuadro v2 |

---

## TAREA 2 — Campos que usa cada documento

### MTD (Memoria Tecnica de Diseno)

**Ficheros**: `src/documents/mtd-pdf-generator.ts`, `src/documents/mtd-field-mapping.ts`
**Salida**: PDF 6 paginas (pdf-lib)

| Seccion | Campos |
|---------|--------|
| Titular | titularNif, titularNombre, titularApellido1, titularApellido2, titularTipoVia, titularNombreVia, titularNumero, titularBloque, titularEscalera, titularPiso, titularPuerta, titularLocalidad, titularProvincia, titularCp |
| Emplazamiento | emplazTipoVia, emplazNombreVia, emplazNumero, emplazBloque, emplazEscalera, emplazPiso, emplazPuerta, emplazLocalidad, emplazProvincia, emplazCp, superficieM2 |
| Tipo suministro | supplyType, supplyVoltage, gradoElectrificacion, tipoActuacion, usoInstalacion, tipoInstalacionCie |
| Acometida | puntoConexion, tipoAcometida, seccionAcometida, materialAcometida |
| CGP | tipoCgp, inBaseCgp, inCartuchoCgp |
| LGA | seccionLga, materialLga, longitudLga, aislamientoLga |
| DI | seccionDi, materialDi, longitudDi, numDerivaciones, aislamientoDi, tipoInstalacionDi, cdtDi |
| Modulo medida | tipoModuloMedida, situacionModulo, contadorUbicacion |
| Protecciones | igaNominal, igaPoderCorte, diferencialNominal, diferencialSensibilidad |
| Tierra | tipoElectrodos, seccionLineaEnlace, seccionCondProteccion, esquemaDistribucion |
| Presupuesto | presupuestoMateriales, presupuestoManoObra, presupuestoTotal |
| Firma | firmaLugar, firmaFecha |
| Autor | tipoAutor, instaladorNombre, instaladorCertNum |
| Empresa | empresaTipoVia, empresaNombreVia, empresaNumero, empresaLocalidad, empresaCp, empresaTelefono, empresaEmail |
| Tecnico | technicianId (+ datos de tabla Technician: nombre, colegiado, direccion, etc.) |
| Memoria | memoriaDescriptiva |
| Circuitos | Datos de tabla Circuit + CalculationResult.resultSnapshot |

**Total campos Installation: ~73** (+ datos de Circuit, Technician, CalculationResult)

### CIE (Certificado de Instalacion Electrica)

**Ficheros**: `src/documents/cie-excel-generator.service.ts`, `src/documents/cie-field-mapping.ts`
**Salida**: Excel (.xls via LibreOffice) + PDF

| Seccion | Campos |
|---------|--------|
| TITULAR_FIELDS (19) | titularNif, titularApellido1, titularApellido2, titularNombre, titularEmail, titularTipoVia, titularNombreVia, titularNumero, titularBloque, titularEscalera, titularPiso, titularPuerta, titularLocalidad, titularProvincia, titularCp, titularTelefono, titularMovil, representanteNombre, representanteNif |
| EMPLAZAMIENTO_FIELDS (11) | emplazTipoVia, emplazNombreVia, emplazNumero, emplazCp, emplazBloque, emplazEscalera, emplazPiso, emplazPuerta, emplazLocalidad, emplazProvincia, contadorUbicacion |
| TECNICAS_FIELDS (21) | tipoActuacion, temporalidad, cups, superficieM2, potMaxAdmisible, tipoInstalacionCie, aforo, potAmpliacion, supplyVoltage, seccionDi, potOriginal, esquemaDistribucion, puntoConexion, tipoAcometida, tipoCgp, inBaseCgp, igaNominal, protSobretensiones, diferencialNominal (para flag SI/NO), distribuidora |
| INFO_FIELDS (1) | infoAdicional |
| EMPRESA_FIELDS (14) | empresaNif, empresaNombre, empresaCategoria, empresaRegNum, instaladorNombre, instaladorNif, empresaTipoVia, empresaNombreVia, empresaNumero, empresaCp, empresaLocalidad, empresaProvincia, empresaTelefono, empresaEmail |
| CERTIFICACION_FIELDS (5) | tipoDocumentacion, aplicaReeae, potLuminariasReeae, aplicaItcBt51, firmaFecha |
| VERIFICACIONES_FIELDS (3) | resistenciaTierra, resistenciaAislamiento, otrasVerificaciones |

**Campos computados en CIE**: `_tipoSuministro` (monofasico/trifasico desde supplyVoltage), `_intDiferencial` (SI/NO desde diferencialNominal), `_fechaFirma` (formato "MADRID A 15 DE MARZO 2025")

**Total campos Installation: ~82** (+ fallback a Tenant para empresa fields)

**Campos opcionales CIE** (no rompen el doc si faltan): titularBloque, titularEscalera, titularMovil, representanteNombre, representanteNif, emplazBloque, emplazEscalera, temporalidad, cups, aforo, potAmpliacion, potOriginal, potLuminariasReeae, tipoCgp, inBaseCgp, otrasVerificaciones, infoAdicional, contadorUbicacion

### Solicitud BT

**Fichero**: `src/documents/solicitud-bt-generator.service.ts`
**Salida**: Word (.docx via python-docx) + PDF (LibreOffice)

| Seccion | Campos |
|---------|--------|
| Titular (17) | titularNif, titularApellido1, titularApellido2, titularNombre, titularEmail, titularTipoVia, titularNombreVia, titularNumero, titularBloque, titularEscalera, titularPiso, titularPuerta, titularLocalidad, titularProvincia, titularCp, titularTelefono, titularMovil |
| Representante (2) | representanteNif, representanteNombre |
| Empresa (14) | empresaNif, empresaNombre, empresaEmail, empresaCategoria, empresaRegNum, instaladorNombre, empresaTipoVia, empresaNombreVia, empresaNumero, empresaLocalidad, empresaProvincia, empresaCp, empresaTelefono, empresaMovil |
| Emplazamiento (5) | emplazTipoVia, emplazNombreVia, emplazNumero, emplazCp, emplazLocalidad |
| Expediente (3) | tipoActuacion, numRegistroExistente, tipoInstalacionCie |
| Documentacion (1) | tipoDocumentacion |
| Firma (2) | firmaLugar, firmaFecha |

**Total campos Installation: ~39** (+ datos de Tenant como fallback)

---

## TAREA 3 — Campos del wizard actual

### 3.1 — Dialogo "Nueva Instalacion" (`new-installation-dialog.tsx`)

Wizard de 4 pasos al crear una instalacion:

| Paso | Campos recogidos |
|------|-----------------|
| 1 — Tipo instalacion | installationType (20 tipos disponibles) |
| 2 — Tipo documentacion | tipoDocumentacion (MTD o PROYECTO) |
| 3 — Tipo expediente | expedienteType (NUEVA, AMPLIACION, AMPLIACION_CAMBIO_TITULAR, AMPLIACION_SIN_INSTALACION, MODIFICACION, MODIFICACION_CAMBIO_TITULAR, MODIFICACION_SIN_INSTALACION) |
| 4 — Datos basicos | titularNombre, titularApellido1, titularApellido2, titularTipoVia, titularNombreVia, titularNumero, titularCp, titularLocalidad, referencia |
| 4 — Si vivienda | gradoElectrificacion (BASICO/ELEVADO) |
| 4 — Si IRVE | puntosRecarga, esquemaIve (4a/4b) |
| 4 — Si autoconsumo | potenciaPico, modalidadAutoconsumo |

**Defaults del wizard**: electrificacion=BASICO, puntosRecarga=1, esquemaIve=4a, modalidadAutoconsumo=sin_excedentes

### 3.2 — Onboarding (`/onboarding/page.tsx`)

Se ejecuta al primer login. Los datos se guardan en Tenant + User:

| Paso | Campos |
|------|--------|
| 1 — Empresa | empresaNif, empresaNombre, empresaNombreVia, empresaLocalidad, empresaProvincia, empresaTelefono, empresaEmail |
| 2 — Instalador | instaladorNombre, instaladorNif, instaladorCertNum, empresaCategoria |
| 3 — Plan | (solo informativo, sin input) |

### 3.3 — Auto-fill al crear instalacion (`installations.service.ts`)

Cuando se crea una instalacion, el backend auto-rellena:

| Origen | Campos auto-rellenados |
|--------|----------------------|
| Tenant | empresaNif, empresaNombre, empresaCategoria, empresaRegNum, empresaTipoVia, empresaNombreVia, empresaNumero, empresaLocalidad, empresaProvincia, empresaCp, empresaTelefono, empresaMovil, empresaEmail, distribuidora (de tenant.distribuidoraHab) |
| Installer default | installerId, instaladorNombre, instaladorNif, instaladorCertNum |
| User (fallback) | instaladorNombre, instaladorNif, instaladorCertNum |
| Wizard mapping | tipoActuacion (de expedienteType), supplyType (de installationType + gradoElectrificacion) |

### 3.4 — Tab Datos (`datos-form.tsx`)

15 secciones con 100+ campos. Es donde el usuario rellena TODO el detalle tecnico despues de crear la instalacion.

---

## TAREA 4 — Campos autocompletables

### 4.1 — Desde el perfil del Tenant (onboarding)

Estos campos se copian automaticamente al crear una instalacion:

| Campo Installation | Origen en Tenant |
|-------------------|-----------------|
| empresaNif | tenant.empresaNif |
| empresaNombre | tenant.empresaNombre |
| empresaCategoria | tenant.empresaCategoria |
| empresaRegNum | tenant.empresaRegNum |
| empresaTipoVia | tenant.empresaTipoVia |
| empresaNombreVia | tenant.empresaNombreVia |
| empresaNumero | tenant.empresaNumero |
| empresaLocalidad | tenant.empresaLocalidad |
| empresaProvincia | tenant.empresaProvincia |
| empresaCp | tenant.empresaCp |
| empresaTelefono | tenant.empresaTelefono |
| empresaMovil | tenant.empresaMovil |
| empresaEmail | tenant.empresaEmail |
| distribuidora | tenant.distribuidoraHab |

| Campo Installation | Origen en Installer/User |
|-------------------|-------------------------|
| installerId | installer.id (si hay default) |
| instaladorNombre | installer.nombre o user.instaladorNombre |
| instaladorNif | installer.nif o user.instaladorNif |
| instaladorCertNum | installer.certNum o user.instaladorCertNum |

### 4.2 — Calculados por el motor electrico (electrical-engine)

Estos campos se calculan automaticamente tras definir el cuadro electrico:

| Campo | Formula / Logica |
|-------|-----------------|
| igaNominal | In = P / (V x cosfi) → selecciona calibre normalizado [10,16,20,25,32,40,50,63,80,100,125...] |
| igaPoderCorte | Standard 6kA vivienda |
| diferencialNominal | Desde potencia + circuitos (agrupacion automatica) |
| diferencialSensibilidad | 30mA residencial, 300mA industrial |
| seccionDi | max(tabla ITC-BT-15, CdT <= 1%, usuario) → normalizada [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50...] |
| cdtDi | CdT = (2 x I x L x R) / (V x S) monofasico |
| seccionCondProteccion | Derivado de seccionDi: si DI <= 16mm2 → PE = DI; si DI > 16 → PE = 16mm2 min |
| seccionLineaEnlace | = seccionCondProteccion |
| seccionAcometida | Desde motor de calculo |
| seccionLga | Desde motor de calculo |
| longitudLga | Desde motor de calculo |
| aislamientoLga | Desde motor de calculo |
| materialLga | Desde motor de calculo |
| inBaseCgp | Desde potencia |
| inCartuchoCgp | Desde potencia |
| potMaxAdmisible | V x IGA x sqrt(3) trifasico, V x IGA monofasico |
| gradoElectrificacion | Desde superficie + calefaccion + climatizacion: BASICO (>=5.75kW) o ELEVADO (>=9.2kW) |

### 4.3 — Defaults inteligentes para vivienda nueva en CAM

| Campo | Default | Razon |
|-------|---------|-------|
| supplyVoltage | 230 | Vivienda siempre monofasica 230V |
| esquemaDistribucion | TT | Unico esquema en BT distribucion publica Espana |
| tipoActuacion | Nueva | Seleccionado en wizard |
| supplyType | VIVIENDA_BASICA o VIVIENDA_ELEVADA | Desde wizard |
| titularProvincia | MADRID | Solo operamos en CAM |
| emplazProvincia | MADRID | Solo operamos en CAM |
| puntoConexion | RBT | Lo mas comun en vivienda urbana |
| tipoAcometida | SUBTERRANEA | Predominante en zona urbana Madrid |
| tipoCgp | CGP | Lo mas comun |
| tipoElectrodos | PICAS | Lo mas comun en vivienda |
| tipoModuloMedida | PANELABLE | Vivienda colectiva tipica |
| situacionModulo | FACHADA | Mas comun en CAM |
| contadorUbicacion | CPM | Centralizado en portal |
| firmaLugar | MADRID | Default ya implementado en documents.service |
| holderDocType | NIF | Default en schema |
| protSobretensiones | false | Default en schema |
| aplicaReeae | false | No aplica en vivienda estandar |
| aplicaItcBt51 | false | No aplica normalmente |
| tipoAutor | INSTALADOR | Lo mas habitual |
| materialAcometida | CU | Cobre es lo estandar |
| materialDi | CU | Cobre es lo estandar |
| tipoDocumentacion | MTD | Vivienda siempre MTD (< 100kW) |
| panelVersion | v1 | Default en schema |

### 4.4 — Campos que NO se pueden autocompletar (requieren input del usuario)

| Campo | Razon |
|-------|-------|
| titularNif | Unico por instalacion |
| titularNombre | Unico por instalacion |
| titularApellido1, titularApellido2 | Unico por instalacion |
| titularTipoVia, titularNombreVia, titularNumero | Direccion particular del titular |
| titularLocalidad, titularCp | Puede no ser Madrid capital |
| titularEmail | Unico por titular |
| titularTelefono / titularMovil | Unico por titular |
| emplazTipoVia, emplazNombreVia, emplazNumero | Ubicacion de la obra |
| emplazLocalidad, emplazCp | Ubicacion de la obra |
| emplazPiso, emplazPuerta | Ubicacion exacta |
| cups | Unico por punto de suministro |
| superficieM2 | Especifico de cada vivienda |
| resistenciaTierra | Medicion in situ |
| resistenciaAislamiento | Medicion in situ |
| presupuestoMateriales | Especifico de cada obra |
| presupuestoManoObra | Especifico de cada obra |

---

## TAREA 5 — Clasificacion completa para "Vivienda nueva en CAM"

### Tabla completa

| Campo | Tipo | MTD | CIE | Sol.BT | Grupo | Default / Autocompletado |
|-------|------|:---:|:---:|:------:|-------|--------------------------|
| **TITULAR** | | | | | | |
| holderDocType | String? | -- | -- | -- | B | NIF |
| titularNif | String? | SI | SI | SI | **A** | — |
| titularNombre | String? | SI | SI | SI | **A** | — |
| titularApellido1 | String? | SI | SI | SI | **A** | — (obligatorio si NIF espanol) |
| titularApellido2 | String? | SI | SI | SI | **A** | — |
| titularTipoVia | String? | SI | SI | SI | **A** | — |
| titularNombreVia | String? | SI | SI | SI | **A** | — |
| titularNumero | String? | SI | SI | SI | **A** | — |
| titularBloque | String? | SI | SI | SI | **A** | — (opcional) |
| titularEscalera | String? | SI | SI | SI | **A** | — (opcional) |
| titularPiso | String? | SI | SI | SI | **A** | — (opcional) |
| titularPuerta | String? | SI | SI | SI | **A** | — (opcional) |
| titularLocalidad | String? | SI | SI | SI | **A** | — |
| titularProvincia | String? | SI | SI | SI | B | MADRID |
| titularCp | String? | SI | SI | SI | **A** | — |
| titularEmail | String? | -- | SI | SI | **A** | — |
| titularTelefono | String? | -- | SI | SI | **A** | — (al menos 1 telefono) |
| titularMovil | String? | -- | SI | SI | **A** | — (al menos 1 telefono) |
| representanteNombre | String? | -- | SI | SI | D | No aplica si titular es persona fisica |
| representanteNif | String? | -- | SI | SI | D | No aplica si titular es persona fisica |
| **EMPLAZAMIENTO** | | | | | | |
| emplazTipoVia | String? | SI | SI | SI | **A** | — |
| emplazNombreVia | String? | SI | SI | SI | **A** | — |
| emplazNumero | String? | SI | SI | SI | **A** | — |
| emplazBloque | String? | SI | SI | -- | **A** | — (opcional) |
| emplazEscalera | String? | SI | SI | -- | **A** | — (opcional) |
| emplazPiso | String? | SI | -- | -- | **A** | — |
| emplazPuerta | String? | SI | SI | -- | **A** | — |
| emplazLocalidad | String? | SI | SI | SI | **A** | — |
| emplazProvincia | String? | SI | SI | -- | B | MADRID |
| emplazCp | String? | SI | SI | SI | **A** | — |
| superficieM2 | Float? | SI | SI | -- | **A** | — |
| cups | String? | -- | SI | -- | **A** | — (opcional pero recomendado) |
| contadorUbicacion | String? | SI | SI | -- | B | CPM (centralizado) |
| **DATOS TECNICOS** | | | | | | |
| tipoDocumentacion | String? | -- | SI | SI | B | MTD (vivienda < 100kW siempre) |
| supplyType | SupplyType? | SI | -- | -- | B | VIVIENDA_BASICA (desde wizard) |
| supplyVoltage | Int? | SI | SI | -- | B | 230 |
| tipoActuacion | String? | SI | SI | SI | B | Nueva (desde wizard) |
| tipoMemoria | String? | -- | -- | -- | D | No se usa activamente |
| usoInstalacion | String? | SI | -- | SI | B | Vivienda (auto desde tipoInstalacionCie) |
| aforo | String? | -- | SI | -- | D | No aplica en vivienda |
| tipoInstalacionCie | String? | SI | SI | SI | B | Se mapea desde installationType |
| installationType | String? | -- | -- | -- | B | vivienda (desde wizard) |
| expedienteType | String? | -- | -- | -- | B | NUEVA (desde wizard) |
| referencia | String? | -- | -- | -- | **A** | — (opcional, ref interna usuario) |
| gradoElectrificacion | String? | SI | SI | -- | C | Calculado: superficie + cargas |
| potMaxAdmisible | Float? | -- | SI | -- | C | V x IGA |
| esquemaDistribucion | String? | SI | SI | -- | B | TT |
| temporalidad | Int? | -- | SI | -- | D | No aplica (no es temporal) |
| numRegistroExistente | String? | -- | -- | SI | D | No aplica (es nueva) |
| potAmpliacion | Float? | -- | SI | -- | D | No aplica (es nueva) |
| potOriginal | Float? | -- | SI | -- | D | No aplica (es nueva) |
| contractedPower | Float? | -- | -- | -- | D | Campo legacy, no se usa |
| **IRVE / AUTOCONSUMO** | | | | | | |
| puntosRecarga | Int? | -- | -- | -- | D | No aplica (no es IRVE) |
| esquemaIve | String? | -- | -- | -- | D | No aplica (no es IRVE) |
| potenciaPico | Float? | -- | -- | -- | D | No aplica (no es autoconsumo) |
| modalidadAutoconsumo | String? | -- | -- | -- | D | No aplica (no es autoconsumo) |
| **ACOMETIDA** | | | | | | |
| puntoConexion | String? | SI | SI | -- | B | RBT |
| tipoAcometida | String? | SI | SI | -- | B | SUBTERRANEA |
| seccionAcometida | Float? | SI | -- | -- | C | Motor de calculo |
| materialAcometida | String? | SI | -- | -- | B | CU |
| **CGP** | | | | | | |
| tipoCgp | String? | SI | SI | -- | B | CGP |
| inBaseCgp | Float? | SI | SI | -- | C | Desde potencia |
| inCartuchoCgp | Float? | SI | -- | -- | C | Desde potencia |
| **LGA** | | | | | | |
| seccionLga | Float? | SI | -- | -- | C | Motor de calculo |
| materialLga | String? | SI | -- | -- | B | CU |
| longitudLga | Float? | SI | -- | -- | C | Motor de calculo |
| aislamientoLga | String? | SI | -- | -- | C | Motor de calculo |
| **DI** | | | | | | |
| seccionDi | Float? | SI | SI | -- | C | Motor de calculo (max tabla/CdT/usuario) |
| cdtDi | Float? | SI | -- | -- | C | Calculado: (2xIxLxR)/(VxS) |
| materialDi | String? | SI | -- | -- | B | CU |
| longitudDi | Float? | SI | -- | -- | **A** | — (longitud real de la DI) |
| numDerivaciones | Int? | SI | -- | -- | C | Motor de calculo |
| aislamientoDi | String? | SI | -- | -- | C | Motor de calculo |
| tipoInstalacionDi | String? | SI | -- | -- | C | Motor de calculo |
| **MODULO DE MEDIDA** | | | | | | |
| tipoModuloMedida | String? | SI | -- | -- | B | PANELABLE |
| situacionModulo | String? | SI | -- | -- | B | FACHADA |
| **PROTECCIONES** | | | | | | |
| igaNominal | Float? | SI | SI | -- | C | Motor: P/(V x cosfi) → calibre normalizado |
| igaPoderCorte | Float? | SI | -- | -- | C | 6kA (vivienda estandar) |
| diferencialNominal | Float? | SI | SI | -- | C | Motor: agrupacion circuitos |
| diferencialSensibilidad | Int? | SI | -- | -- | C | 30mA (residencial) |
| protSobretensiones | Boolean? | SI | SI | -- | B | false |
| **PUESTA A TIERRA** | | | | | | |
| tipoElectrodos | String? | SI | -- | -- | B | PICAS |
| seccionLineaEnlace | Float? | SI | -- | -- | C | = seccionCondProteccion |
| seccionCondProteccion | Float? | SI | -- | -- | C | Desde DI: si DI<=16 → PE=DI, si DI>16 → 16mm2 |
| resistenciaTierra | Float? | -- | SI | -- | **A** | — (medicion in situ) |
| resistenciaAislamiento | Float? | -- | SI | -- | **A** | — (medicion in situ) |
| otrasVerificaciones | String? | -- | SI | -- | **A** | — (texto libre, opcional) |
| **EMPRESA INSTALADORA** | | | | | | |
| empresaNif | String? | SI | SI | SI | E | Tenant.empresaNif |
| empresaNombre | String? | SI | SI | SI | E | Tenant.empresaNombre |
| empresaCategoria | String? | -- | SI | SI | E | Tenant.empresaCategoria |
| empresaRegNum | String? | -- | SI | SI | E | Tenant.empresaRegNum |
| empresaTipoVia | String? | SI | SI | SI | E | Tenant.empresaTipoVia |
| empresaNombreVia | String? | SI | SI | SI | E | Tenant.empresaNombreVia |
| empresaNumero | String? | SI | SI | SI | E | Tenant.empresaNumero |
| empresaLocalidad | String? | SI | SI | SI | E | Tenant.empresaLocalidad |
| empresaProvincia | String? | -- | SI | SI | E | Tenant.empresaProvincia |
| empresaCp | String? | SI | SI | SI | E | Tenant.empresaCp |
| empresaTelefono | String? | SI | SI | SI | E | Tenant.empresaTelefono |
| empresaMovil | String? | -- | -- | SI | E | Tenant.empresaMovil |
| empresaEmail | String? | SI | SI | SI | E | Tenant.empresaEmail |
| **INSTALADOR / TECNICO** | | | | | | |
| instaladorNombre | String? | SI | SI | SI | E | Installer.nombre o User.instaladorNombre |
| instaladorNif | String? | -- | SI | -- | E | Installer.nif o User.instaladorNif |
| instaladorCertNum | String? | SI | -- | -- | E | Installer.certNum o User.instaladorCertNum |
| tipoAutor | String? | SI | -- | -- | B | INSTALADOR |
| installerId | String? | -- | -- | -- | E | Installer default del tenant |
| technicianId | String? | SI | -- | -- | D | Solo si tipoAutor=TECNICO |
| **DISTRIBUIDORA** | | | | | | |
| distribuidora | String? | -- | SI | -- | E | Tenant.distribuidoraHab |
| **PRESUPUESTO** | | | | | | |
| presupuestoMateriales | Float? | SI | -- | -- | **A** | — |
| presupuestoManoObra | Float? | SI | -- | -- | **A** | — |
| presupuestoTotal | Float? | SI | -- | -- | C | Suma materiales + mano obra |
| **CERTIFICACION** | | | | | | |
| aplicaReeae | Boolean? | -- | SI | -- | B | false (no aplica vivienda) |
| potLuminariasReeae | Float? | -- | SI | -- | D | No aplica vivienda |
| aplicaItcBt51 | Boolean? | -- | SI | -- | B | false |
| **FIRMA** | | | | | | |
| firmaLugar | String? | SI | SI | SI | B | MADRID |
| firmaFecha | DateTime? | SI | SI | SI | C | Fecha actual al generar |
| signerId | String? | -- | -- | -- | D | Firma digital (fase futura) |
| **INFO ADICIONAL** | | | | | | |
| infoAdicional | String? | -- | SI | -- | **A** | — (descripcion obras para CIE, opcional) |
| memoriaDescriptiva | String? | SI | -- | -- | **A** | — (memoria tecnica MTD pag 6, opcional) |
| **METADATA / SISTEMA** | | | | | | |
| id | String | -- | -- | -- | — | Auto (cuid) |
| tenantId | String | -- | -- | -- | — | Auto (JWT) |
| userId | String | -- | -- | -- | — | Auto (JWT) |
| status | Enum | -- | -- | -- | — | Auto (DRAFT) |
| panelVersion | String | -- | -- | -- | — | Auto (v1) |
| identificadorCie | String? | -- | -- | -- | — | Auto (generado por Excel) |
| templateUsed | String? | -- | -- | -- | — | Auto (sistema) |
| reviewNotes | String? | -- | -- | -- | — | Interno revision |
| createdAt | DateTime | -- | -- | -- | — | Auto |
| updatedAt | DateTime | -- | -- | -- | — | Auto |
| deletedAt | DateTime? | -- | -- | -- | — | Soft delete |
| **CAMPOS LEGACY** | | | | | | |
| titularName | String? | -- | -- | -- | D | Legacy, no usar |
| titularAddress | String? | -- | -- | -- | D | Legacy, no usar |
| address | String? | -- | -- | -- | D | Legacy, no usar |
| installerName | String? | -- | -- | -- | D | Legacy, no usar |
| installerNif | String? | -- | -- | -- | D | Legacy, no usar |
| installerRegNum | String? | -- | -- | -- | D | Legacy, no usar |

---

### Resumen por grupo

| Grupo | Descripcion | Cantidad | Ejemplo |
|-------|-------------|----------|---------|
| **A** | Imprescindible — el usuario DEBE rellenar | ~30 | titularNif, emplazNombreVia, resistenciaTierra |
| **B** | Default inteligente — modificable | ~25 | supplyVoltage=230, esquemaDistribucion=TT, firmaLugar=MADRID |
| **C** | Calculado automaticamente — no se toca | ~20 | igaNominal, seccionDi, potMaxAdmisible, gradoElectrificacion |
| **D** | No aplica vivienda nueva — se oculta | ~20 | aforo, temporalidad, puntosRecarga, campos legacy |
| **E** | Desde perfil tenant — onboarding ya hecho | ~18 | empresaNif, instaladorNombre, distribuidora |
| — | Sistema / auto | ~11 | id, tenantId, status, createdAt |

### Campos grupo A desagregados por momento de entrada

**En el wizard (ya se piden):**
- titularNombre, titularApellido1, titularApellido2
- titularTipoVia, titularNombreVia, titularNumero, titularCp, titularLocalidad
- referencia (opcional)

**Tras el wizard (tab Datos — imprescindibles):**
- titularNif, titularEmail, titularTelefono/titularMovil
- titularPiso, titularPuerta (si aplica)
- emplazTipoVia, emplazNombreVia, emplazNumero, emplazLocalidad, emplazCp
- emplazPiso, emplazPuerta (si aplica)
- superficieM2, cups
- longitudDi (longitud real de la derivacion individual)
- resistenciaTierra, resistenciaAislamiento (mediciones)
- presupuestoMateriales, presupuestoManoObra

**Opcionales (mejoran el doc pero no son bloqueantes):**
- titularBloque, titularEscalera, emplazBloque, emplazEscalera
- otrasVerificaciones
- infoAdicional, memoriaDescriptiva

---

### Flujo optimo propuesto para vivienda nueva CAM

```
WIZARD (4 pasos actuales)
  → Tipo: vivienda
  → Doc: MTD (auto)
  → Expediente: Nueva (auto)
  → Titular basico: nombre, apellidos, direccion

AUTO-FILL (al crear)
  → Empresa instaladora: 13 campos desde Tenant
  → Instalador: 3 campos desde Installer/User
  → Distribuidora: desde Tenant
  → Defaults: 230V, TT, MADRID, CGP, RBT, CU, PICAS, etc.

TAB DATOS (campos que faltan, agrupados)
  → Paso 1: Completar titular (NIF, email, telefono)
  → Paso 2: Emplazamiento (direccion obra, superficie, CUPS)
  → Paso 3: Mediciones (resistencia tierra, aislamiento)
  → Paso 4: Presupuesto (materiales, mano obra)
  → Paso 5: Textos opcionales (info adicional, memoria)

CALCULO (boton)
  → Motor electrico calcula: IGA, DI, PE, CdT, diferenciales...
  → Se rellenan automaticamente ~20 campos tecnicos

DOCUMENTOS
  → Generar MTD, CIE, Solicitud BT con todos los campos
```

---

### Constantes Madrid disponibles en el sistema

| Dato | Valor | Fuente |
|------|-------|--------|
| Provincia | MADRID (codigo 31) | portal-field-mapping.ts |
| Municipios | 180 mapeados con codigos portal | portal-field-mapping.ts |
| Distribuidoras | I-DE, UFD, E-Distribucion, etc. con codigos | portal-field-mapping.ts |
| OCAs/EICIs | 9 organizaciones con UUIDs | portal-field-mapping.ts |
| Tipos via | 78 tipos normalizados | portal-field-mapping.ts |
| Firma default | MADRID | documents.service.ts |
