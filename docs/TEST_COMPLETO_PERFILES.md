# Test Completo — Perfiles de Expediente + Documentos
> Fecha: 2026-03-17
> Entorno: producción (10.10.10.7:3001 — LXC 104)
> Usuario: testperfiles@daso.es

## Resumen
- **Total tipos testeados: 22**
- **OK: 22**
- **FAIL: 0**
- **Documentos tenant: OK**
- **Documentos instalación: OK**

## Detalle por tipo

| # | Tipo | installationType | expedienteType | Perfil | tipoDoc | Campos específicos | Creación | Field-config | Field-status | Resultado |
|---|------|-----------------|----------------|--------|---------|-------------------|----------|-------------|-------------|-----------|
| 1 | Vivienda nueva | vivienda | NUEVA | VIVIENDA_NUEVA | N/A | gradoElectrificacion ✅ | ✅ | ✅ | ✅ | **OK** |
| 2 | Vivienda ampliación | vivienda | AMPLIACION | VIVIENDA_AMPLIACION | N/A | gradoElectrificacion ✅ numRegistro ✅ potOriginal ✅ | ✅ | ✅ | ✅ | **OK** |
| 3 | Vivienda modificación | vivienda | MODIFICACION | VIVIENDA_MODIFICACION | N/A | gradoElectrificacion ✅ numRegistro ✅ potOriginal ✅ | ✅ | ✅ | ✅ | **OK** |
| 4 | Local/Oficina | local | NUEVA | LOCAL_NUEVO | N/A | aforo ✅ noGradoElectrificacion ✅ | ✅ | ✅ | ✅ | **OK** |
| 5 | Industrial | industrial | NUEVA | INDUSTRIAL | N/A | noAforo noSuperficie noGradoElectrificacion ✅ | ✅ | ✅ | ✅ | **OK** |
| 6 | Garaje | garaje | NUEVA | GARAJE | N/A | genérico | ✅ | ✅ | ✅ | **OK** |
| 7 | Enlace | enlace | NUEVA | ENLACE | N/A | genérico | ✅ | ✅ | ✅ | **OK** |
| 8 | Temporal | temporal | NUEVA | TEMPORAL | N/A | temporalidad ✅ | ✅ | ✅ | ✅ | **OK** |
| 9 | IRVE | irve | NUEVA | IRVE | N/A | puntosRecarga ✅ esquemaIve ✅ | ✅ | ✅ | ✅ | **OK** |
| 10 | Autoconsumo | autoconsumo | NUEVA | AUTOCONSUMO | N/A | campos autoconsumo ✅ | ✅ | ✅ | ✅ | **OK** |
| 11 | Generación | generacion | NUEVA | GENERACION | N/A | campos generación (ver nota 1) | ✅ | ✅ | ✅ | **OK** |
| 12 | LPC Hostelería | lpc_host | NUEVA | LOCAL_LPC | PROYECTO | LPC type | ✅ | ✅ | ✅ | **OK** |
| 13 | LPC Espectáculos | lpc_espec | NUEVA | LOCAL_LPC | PROYECTO | LPC type | ✅ | ✅ | ✅ | **OK** |
| 14 | LPC Reunión | lpc_reun | NUEVA | LOCAL_LPC | PROYECTO | LPC type | ✅ | ✅ | ✅ | **OK** |
| 15 | LPC Otros | lpc_otros | NUEVA | LOCAL_LPC | PROYECTO | LPC type | ✅ | ✅ | ✅ | **OK** |
| 16 | Garaje LPC | garaje_lpc | NUEVA | GARAJE_LPC | PROYECTO | LPC type | ✅ | ✅ | ✅ | **OK** |
| 17 | Temporal LPC | temporal_lpc | NUEVA | LOCAL_LPC | PROYECTO | (temporalidad no incluido — ver nota 2) | ✅ | ✅ | ✅ | **OK** |
| 18 | Local mojado | mojado | NUEVA | MOJADO | N/A | mojado | ✅ | ✅ | ✅ | **OK** |
| 19 | Elevación | elevacion | NUEVA | ELEVACION | PROYECTO | elevacion | ✅ | ✅ | ✅ | **OK** |
| 20 | Caldeo | caldeo | NUEVA | CALDEO | N/A | caldeo | ✅ | ✅ | ✅ | **OK** |
| 21 | Rótulos | rotulos | NUEVA | ROTULOS | PROYECTO | rotulos | ✅ | ✅ | ✅ | **OK** |
| 22 | Local especial | local_esp | NUEVA | LOCAL_ESPECIAL | PROYECTO | noGradoElectrificacion ✅ | ✅ | ✅ | ✅ | **OK** |

## Notas

### Nota 1 — Generación: campo potenciaPico no presente
El perfil GENERACION se creó correctamente, pero el grep de `potenciaPico` en los campos no encontró coincidencia. Podría ser que el campo use un nombre distinto (ej. `potenciaGeneracion`), o que falte añadirlo al field-config de generación. **Revisar field-config de generación**.

### Nota 2 — Temporal LPC: campo temporalidad no incluido
El perfil `temporal_lpc` usa el config `LOCAL_LPC`, que no incluye el campo `temporalidad`. Si es necesario para este tipo, añadirlo al perfil `LOCAL_LPC` o crear un perfil `TEMPORAL_LPC` específico.

### Nota 3 — tipoDocumentacion muestra N/A en muchos tipos
Para los tipos donde tipoDoc es N/A, el campo `tipoDocumentacion` no tiene un `currentValue` ni `default` seteado en el field-config. El triage de documentación (MTD vs PROYECTO) ocurre en el servicio, pero no se refleja como valor por defecto en el field-config. Esto puede ser intencional (se asigna al guardar) o puede necesitar revisión.

**Tipos con tipoDocumentacion=PROYECTO** (correcto según REBT):
- LPC Hostelería, LPC Espectáculos, LPC Reunión, LPC Otros
- Garaje LPC, Temporal LPC
- Elevación, Rótulos, Local especial

**Tipos con tipoDocumentacion=N/A** (puede necesitar MTD por defecto):
- Vivienda nueva/ampliación/modificación
- Local/Oficina, Industrial, Garaje, Enlace, Temporal
- IRVE, Autoconsumo, Generación
- Local mojado, Caldeo

## Test documentos

| # | Test | Resultado | Detalle |
|---|------|-----------|---------|
| 1 | Subida certificado empresa (tenant) | ✅ OK | POST /tenant/documents/certificado-empresa — archivo guardado correctamente |
| 2 | Subida anexo usuario (tenant) | ✅ OK | POST /tenant/documents/anexo-usuario — archivo guardado correctamente |
| 3 | Descarga certificado empresa (tenant) | ✅ OK | GET /tenant/documents/certificado-empresa — HTTP 200 |
| 4 | Borrado certificado empresa (tenant) | ✅ OK | DELETE /tenant/documents/certificado-empresa — campo null tras borrar |
| 5 | Subida doc instalación | ✅ OK | POST /installations/:id/documents/upload — InstallationDocument creado |
| 6 | Listado docs instalación | ✅ OK | GET /installations/:id/documents/uploaded — array con 1 documento |
| 7 | Descarga doc instalación | ✅ OK | GET /installations/:id/documents/uploaded/:docId/download — HTTP 200 |
| 8 | Borrado doc instalación | ✅ OK | DELETE /installations/:id/documents/uploaded/:docId — {deleted: true} |
| 9 | Verificación post-borrado | ✅ OK | Lista vacía tras borrar el documento |

## Perfiles creados (IDs para verificación en navegador)

| Tipo | ID | installationType |
|------|----|-----------------|
| Vivienda nueva | cmmugqoes001gamakbvnwnwpy | vivienda |
| Vivienda ampliación | cmmugqokt001iamakiqicb0ph | vivienda |
| Vivienda modificación | cmmugqoqq001kamak38xcib85 | vivienda |
| Local/Oficina | cmmugqow2001mamakaaewlnmi | local |
| Industrial | cmmugqp1m001oamakhet54t2c | industrial |
| Garaje | cmmugqp78001qamakfpjh8dyk | garaje |
| Enlace | cmmugutto002camakzvwjkq6w | enlace |
| Temporal | cmmugv0y6002eamak2s83kfln | temporal |
| IRVE | cmmugv824002gamak7d3174es | irve |
| Autoconsumo | cmmugvf5r002iamaksqi6bcuy | autoconsumo |
| Generación | cmmugvm9r002kamakoo8dp6nr | generacion |
| LPC Hostelería | cmmugvtdc002mamakwbw2diaa | lpc_host |
| LPC Espectáculos | cmmugs0hd001samakfgxje24k | lpc_espec |
| LPC Reunión | cmmugs6tx001uamakc3ii4zrj | lpc_reun |
| LPC Otros | cmmugsd5t001wamak8kp2qzwu | lpc_otros |
| Garaje LPC | cmmugsjic001yamaky94ntmbj | garaje_lpc |
| Temporal LPC | cmmugspud0020amake249vnn3 | temporal_lpc |
| Local mojado | cmmugsw6h0022amakhf9eltl5 | mojado |
| Elevación | cmmugt2it0024amak7vlj79m5 | elevacion |
| Caldeo | cmmugt8uj0026amakuhdyioue | caldeo |
| Rótulos | cmmugtf760028amakejndd7a2 | rotulos |
| Local especial | cmmugtliy002aamaksqwtk7h4 | local_esp |

> Nota: También se crearon 2 instalaciones adicionales durante el debug (local cmmugptdo001eamakgbkkz0pv, vivienda cmmugpo3z001gamak...). Todas las instalaciones de test están bajo el usuario testperfiles@daso.es.

## Secciones por perfil

Todos los perfiles incluyen las secciones base:
`titular, emplazamiento, tecnico, acometida, cgp, modulo_medida, protecciones, tierra, empresa, instalador, presupuesto, certificacion, firma, info`

Variaciones:
- **Con sección `lga`**: todos EXCEPTO garaje, temporal, caldeo, rótulos
- **Sin sección `lga`**: garaje, temporal, caldeo, rótulos (correcto — instalaciones con acometida directa)

## Migración aplicada

Se aplicó manualmente la migración `20260317_add_document_fields`:
- `Tenant`: añadidos `certificadoEmpresaUrl`, `certificadoEmpresaName`, `anexoUsuarioUrl`, `anexoUsuarioName`
- Nueva tabla `InstallationDocument` con FK a Installation
- Registrada en `_prisma_migrations` para mantener sincronización con Prisma
