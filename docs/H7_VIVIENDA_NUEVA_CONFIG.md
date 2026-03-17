# H7 — Configuracion de campos: VIVIENDA_NUEVA (CAM)

> Generado: 2026-03-16
> Fuente: `oasis-api-cie/src/installations/field-config/vivienda-nueva.ts`
> Basado en: `docs/H7_CAMPOS_VIVIENDA_NUEVA.md`

---

## Resumen

| Grupo | Descripcion | Cantidad |
|-------|-------------|----------|
| **A** | Obligatorio — el usuario DEBE rellenar | 30 |
| **B** | Default inteligente — modificable | 25 |
| **C** | Calculado automaticamente — no se toca | 20 |
| **D** | No aplica vivienda nueva — oculto (no en array) | ~20 |
| **E** | Desde perfil tenant/installer — auto-fill | 18 |

---

## Campos incluidos (grupos A, B, C, E)

### TITULAR (seccion: titular)

| Campo | Grupo | Default | Docs | Input |
|-------|-------|---------|------|-------|
| holderDocType | B | NIF | — | select: NIF, NIE, CIF, PASAPORTE |
| titularNif | A | — | MTD, CIE, SOL | text |
| titularNombre | A | — | MTD, CIE, SOL | text |
| titularApellido1 | A | — | MTD, CIE, SOL | text |
| titularApellido2 | A | — | MTD, CIE, SOL | text |
| titularTipoVia | A | — | MTD, CIE, SOL | select |
| titularNombreVia | A | — | MTD, CIE, SOL | text |
| titularNumero | A | — | MTD, CIE, SOL | text |
| titularBloque | A | — (opcional) | MTD, CIE, SOL | text |
| titularEscalera | A | — (opcional) | MTD, CIE, SOL | text |
| titularPiso | A | — (opcional) | MTD, CIE, SOL | text |
| titularPuerta | A | — (opcional) | MTD, CIE, SOL | text |
| titularLocalidad | A | — | MTD, CIE, SOL | text |
| titularProvincia | B | MADRID | MTD, CIE, SOL | text |
| titularCp | A | — | MTD, CIE, SOL | text |
| titularEmail | A | — | CIE, SOL | text |
| titularTelefono | A | — (opcional) | CIE, SOL | text |
| titularMovil | A | — (opcional) | CIE, SOL | text |

### EMPLAZAMIENTO (seccion: emplazamiento)

| Campo | Grupo | Default | Docs | Input |
|-------|-------|---------|------|-------|
| emplazTipoVia | A | — | MTD, CIE, SOL | select |
| emplazNombreVia | A | — | MTD, CIE, SOL | text |
| emplazNumero | A | — | MTD, CIE, SOL | text |
| emplazBloque | A | — (opcional) | MTD, CIE | text |
| emplazEscalera | A | — (opcional) | MTD, CIE | text |
| emplazPiso | A | — (opcional) | MTD | text |
| emplazPuerta | A | — (opcional) | MTD, CIE | text |
| emplazLocalidad | A | — | MTD, CIE, SOL | text |
| emplazProvincia | B | MADRID | MTD, CIE | text |
| emplazCp | A | — | MTD, CIE, SOL | text |
| superficieM2 | A | — | MTD, CIE | number |
| cups | A | — (opcional) | CIE | text |
| contadorUbicacion | B | CPM | MTD, CIE | select: ARMARIO, LOCAL, CPM |

### DATOS TECNICOS (seccion: tecnico)

| Campo | Grupo | Default | Docs | Input |
|-------|-------|---------|------|-------|
| tipoDocumentacion | B | MTD | CIE, SOL | select: MTD, PROYECTO |
| supplyType | B | VIVIENDA_BASICA | MTD | select |
| supplyVoltage | B | 230 | MTD, CIE | select: 230, 400 |
| tipoActuacion | B | Nueva | MTD, CIE, SOL | select |
| usoInstalacion | B | Vivienda | MTD, SOL | text |
| tipoInstalacionCie | B | — | MTD, CIE, SOL | text |
| installationType | B | vivienda | — | text |
| expedienteType | B | NUEVA | — | text |
| referencia | A | — (opcional) | — | text |
| esquemaDistribucion | B | TT | MTD, CIE | select |
| gradoElectrificacion | C | Motor | MTD, CIE | — |
| potMaxAdmisible | C | Formula | CIE | — |

### ACOMETIDA (seccion: acometida)

| Campo | Grupo | Default | Docs |
|-------|-------|---------|------|
| puntoConexion | B | RBT | MTD, CIE |
| tipoAcometida | B | SUBTERRANEA | MTD, CIE |
| seccionAcometida | C | Motor | MTD |
| materialAcometida | B | CU | MTD |

### CGP (seccion: cgp)

| Campo | Grupo | Default | Docs |
|-------|-------|---------|------|
| tipoCgp | B | CGP | MTD, CIE |
| inBaseCgp | C | Motor | MTD, CIE |
| inCartuchoCgp | C | Motor | MTD |

### LGA (seccion: lga)

| Campo | Grupo | Default | Docs |
|-------|-------|---------|------|
| seccionLga | C | Motor | MTD |
| materialLga | B | CU | MTD |
| longitudLga | C | Motor | MTD |
| aislamientoLga | C | Motor | MTD |

### DERIVACION INDIVIDUAL (seccion: di)

| Campo | Grupo | Default | Docs |
|-------|-------|---------|------|
| seccionDi | C | Motor | MTD, CIE |
| cdtDi | C | Formula | MTD |
| materialDi | B | CU | MTD |
| longitudDi | A | — | MTD |
| numDerivaciones | C | Motor | MTD |
| aislamientoDi | C | Motor | MTD |
| tipoInstalacionDi | C | Motor | MTD |

### MODULO DE MEDIDA (seccion: modulo_medida)

| Campo | Grupo | Default | Docs |
|-------|-------|---------|------|
| tipoModuloMedida | B | PANELABLE | MTD |
| situacionModulo | B | FACHADA | MTD |

### PROTECCIONES (seccion: protecciones)

| Campo | Grupo | Default | Docs |
|-------|-------|---------|------|
| igaNominal | C | Motor | MTD, CIE |
| igaPoderCorte | C | Motor | MTD |
| diferencialNominal | C | Motor | MTD, CIE |
| diferencialSensibilidad | C | Motor | MTD |
| protSobretensiones | B | false | MTD, CIE |

### PUESTA A TIERRA (seccion: tierra)

| Campo | Grupo | Default | Docs |
|-------|-------|---------|------|
| tipoElectrodos | B | PICAS | MTD |
| seccionLineaEnlace | C | Formula | MTD |
| seccionCondProteccion | C | Formula | MTD |
| resistenciaTierra | A | — | CIE |
| resistenciaAislamiento | A | — | CIE |
| otrasVerificaciones | A | — (opcional) | CIE |

### EMPRESA INSTALADORA (seccion: empresa)

| Campo | Grupo | AutoFrom | Docs |
|-------|-------|----------|------|
| empresaNif | E | tenant.empresaNif | MTD, CIE, SOL |
| empresaNombre | E | tenant.empresaNombre | MTD, CIE, SOL |
| empresaCategoria | E | tenant.empresaCategoria | CIE, SOL |
| empresaRegNum | E | tenant.empresaRegNum | CIE, SOL |
| empresaTipoVia | E | tenant.empresaTipoVia | MTD, CIE, SOL |
| empresaNombreVia | E | tenant.empresaNombreVia | MTD, CIE, SOL |
| empresaNumero | E | tenant.empresaNumero | MTD, CIE, SOL |
| empresaLocalidad | E | tenant.empresaLocalidad | MTD, CIE, SOL |
| empresaProvincia | E | tenant.empresaProvincia | CIE, SOL |
| empresaCp | E | tenant.empresaCp | MTD, CIE, SOL |
| empresaTelefono | E | tenant.empresaTelefono | MTD, CIE, SOL |
| empresaMovil | E | tenant.empresaMovil | SOL |
| empresaEmail | E | tenant.empresaEmail | MTD, CIE, SOL |

### INSTALADOR (seccion: instalador)

| Campo | Grupo | AutoFrom | Docs |
|-------|-------|----------|------|
| instaladorNombre | E | installer.nombre | MTD, CIE, SOL |
| instaladorNif | E | installer.nif | CIE |
| instaladorCertNum | E | installer.certNum | MTD |
| tipoAutor | B | INSTALADOR | MTD |
| installerId | E | installer.id | — |

### DISTRIBUIDORA (seccion: distribuidora)

| Campo | Grupo | AutoFrom | Docs |
|-------|-------|----------|------|
| distribuidora | E | tenant.distribuidoraHab | CIE |

### PRESUPUESTO (seccion: presupuesto)

| Campo | Grupo | Default | Docs |
|-------|-------|---------|------|
| presupuestoMateriales | A | — | MTD |
| presupuestoManoObra | A | — | MTD |
| presupuestoTotal | C | Suma | MTD |

### CERTIFICACION (seccion: certificacion)

| Campo | Grupo | Default | Docs |
|-------|-------|---------|------|
| aplicaReeae | B | false | CIE |
| aplicaItcBt51 | B | false | CIE |

### FIRMA (seccion: firma)

| Campo | Grupo | Default | Docs |
|-------|-------|---------|------|
| firmaLugar | B | MADRID | MTD, CIE, SOL |
| firmaFecha | C | Auto | MTD, CIE, SOL |

### INFO ADICIONAL (seccion: info)

| Campo | Grupo | Default | Docs |
|-------|-------|---------|------|
| infoAdicional | A | — (opcional) | CIE |
| memoriaDescriptiva | A | — (opcional) | MTD |

---

## Campos OCULTOS (grupo D — no incluidos en el array)

| Campo | Razon |
|-------|-------|
| representanteNombre | No aplica si titular es persona fisica |
| representanteNif | No aplica si titular es persona fisica |
| tipoMemoria | No se usa activamente |
| aforo | No aplica en vivienda |
| temporalidad | No es instalacion temporal |
| numRegistroExistente | Es nueva (no modificacion) |
| potAmpliacion | Es nueva (no ampliacion) |
| potOriginal | Es nueva (no ampliacion) |
| contractedPower | Campo legacy |
| puntosRecarga | No es IRVE |
| esquemaIve | No es IRVE |
| potenciaPico | No es autoconsumo |
| modalidadAutoconsumo | No es autoconsumo |
| potLuminariasReeae | No aplica vivienda |
| technicianId | Solo si tipoAutor=TECNICO |
| signerId | Firma digital (fase futura) |
| titularName | Legacy |
| titularAddress | Legacy |
| address | Legacy |
| installerName | Legacy |
| installerNif | Legacy |
| installerRegNum | Legacy |

---

## Endpoints implementados

- `GET /api/v1/installations/:id/field-status` — Estado de completitud, campos faltantes por seccion, readiness por documento
- `GET /api/v1/installations/:id/field-config` — Configuracion completa de campos para el frontend (secciones, valores actuales, tipos de input)

## Auto-fill implementado

Al crear una instalacion (`POST /api/v1/installations`):

1. **Grupo B defaults** se aplican primero (prioridad mas baja)
2. **Grupo E auto-fill** (tenant + installer) se aplica encima
3. **Wizard mappings** (expedienteType→tipoActuacion, installationType→supplyType) se aplican encima
4. **DTO del usuario** se aplica ultimo (prioridad mas alta)
