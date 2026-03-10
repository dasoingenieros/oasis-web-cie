import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-table:text-sm">
      <h1>POLITICA DE PRIVACIDAD DE CIE PLATFORM</h1>
      <p className="text-sm text-slate-500">
        <strong>Referencia:</strong> LEGAL-CIE-PRIV-v1.0 | <strong>Fecha:</strong> Marzo 2026<br />
        <strong>Responsable del tratamiento:</strong> DASO Ingenieros S.L.P.<br />
        <strong>CIF:</strong> B85071512 | <strong>Domicilio:</strong> Paseo Joaquin Ruiz Gimenez 14, 2oA, 28250 Torrelodones, Madrid<br />
        <strong>Contacto privacidad:</strong> privacidad@oasisplatform.es
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>DASO Ingenieros S.L.P. (en adelante, &quot;DASO&quot;) es responsable del tratamiento de los datos personales recogidos directamente del Usuario (instalador o empresa instaladora) a traves de CIE Platform (en adelante, &quot;la Plataforma&quot;).</p>
      <p>Respecto a los datos de terceros (titulares de instalaciones electricas y datos tecnicos de instalaciones) que el Usuario introduzca en la Plataforma en el ejercicio de su actividad profesional, DASO actua como <strong>Encargado del Tratamiento</strong> por cuenta del Usuario, que ostenta la condicion de Responsable de dichos datos. Las condiciones de este encargo se regulan en el Contrato de Encargado del Tratamiento (DPA), disponible en <Link href="/legal/dpa" className="text-blue-600 hover:underline">/legal/dpa</Link>.</p>

      <h2>2. Datos que recogemos y finalidades</h2>

      <h3>2.1. Datos del Usuario (instalador / empresa instaladora)</h3>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Dato</th><th>Finalidad</th><th>Base legal (RGPD)</th></tr></thead>
          <tbody>
            <tr><td>Nombre y apellidos</td><td>Identificacion del Usuario, generacion de certificados, facturacion</td><td>Art. 6.1.b — Ejecucion contractual</td></tr>
            <tr><td>NIF</td><td>Facturacion, cumplimiento de obligaciones fiscales</td><td>Art. 6.1.c — Obligacion legal</td></tr>
            <tr><td>Correo electronico</td><td>Acceso a la Plataforma, comunicaciones del servicio</td><td>Art. 6.1.b — Ejecucion contractual</td></tr>
            <tr><td>Telefono</td><td>Soporte tecnico, comunicaciones del servicio</td><td>Art. 6.1.b — Ejecucion contractual</td></tr>
            <tr><td>No de habilitacion profesional / titulo habilitante</td><td>Acreditacion de la condicion de tecnico competente</td><td>Art. 6.1.f — Interes legitimo</td></tr>
            <tr><td>Razon social de la empresa instaladora</td><td>Generacion de certificados, facturacion</td><td>Art. 6.1.b — Ejecucion contractual</td></tr>
            <tr><td>CIF de la empresa instaladora</td><td>Generacion de certificados, facturacion</td><td>Art. 6.1.c — Obligacion legal</td></tr>
            <tr><td>REIE (Registro de Empresa Instaladora)</td><td>Generacion de certificados</td><td>Art. 6.1.b — Ejecucion contractual</td></tr>
            <tr><td>Identificador de cliente en Stripe</td><td>Gestion del cobro de la suscripcion</td><td>Art. 6.1.b — Ejecucion contractual</td></tr>
            <tr><td>Registros de uso de la Plataforma (logs)</td><td>Seguridad, deteccion de uso indebido, mejora del servicio</td><td>Art. 6.1.f — Interes legitimo</td></tr>
            <tr><td>Registros de consentimientos otorgados</td><td>Demostracion del cumplimiento normativo (accountability)</td><td>Art. 6.1.c — Obligacion legal</td></tr>
          </tbody>
        </table>
      </div>
      <p><strong>Sobre el interes legitimo:</strong> Cuando la base legal es el interes legitimo de DASO (Art. 6.1.f), se ha realizado una ponderacion previa que garantiza que dicho interes no prevalece sobre los derechos y libertades del Usuario. El Usuario puede oponerse a estos tratamientos en cualquier momento.</p>

      <h3>2.2. Datos de terceros introducidos por el Usuario (datos de instalaciones)</h3>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Dato</th><th>Finalidad</th><th>Rol de DASO</th></tr></thead>
          <tbody>
            <tr><td>Nombre del titular de la instalacion</td><td>Generacion del certificado</td><td>Encargado del Tratamiento</td></tr>
            <tr><td>Direccion de la instalacion</td><td>Generacion del certificado</td><td>Encargado del Tratamiento</td></tr>
            <tr><td>NIF del titular de la instalacion</td><td>Generacion del certificado</td><td>Encargado del Tratamiento</td></tr>
            <tr><td>Datos tecnicos de la instalacion (potencia, circuitos, protecciones, etc.)</td><td>Calculos y generacion del certificado</td><td>Encargado del Tratamiento</td></tr>
          </tbody>
        </table>
      </div>
      <p>DASO trata estos datos exclusivamente conforme a las instrucciones del Usuario y para la prestacion del servicio contratado. Las condiciones detalladas se recogen en el Contrato de Encargado del Tratamiento.</p>

      <h3>2.3. Datos que NO recogemos</h3>
      <p>DASO <strong>no almacena</strong> datos de tarjetas de credito, debito ni datos bancarios del Usuario. El cobro de la suscripcion se gestiona directamente a traves de Stripe, que actua como procesador de pagos independiente bajo sus propias politicas de privacidad y seguridad.</p>

      <h2>3. Plazos de conservacion</h2>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Categoria de datos</th><th>Plazo de conservacion</th><th>Motivo</th></tr></thead>
          <tbody>
            <tr><td>Datos del Usuario (identificacion, contacto)</td><td>Duracion de la suscripcion + 5 anos</td><td>Obligaciones fiscales y mercantiles (Art. 30 Codigo de Comercio)</td></tr>
            <tr><td>Datos de facturacion</td><td>5 anos desde la ultima factura</td><td>Obligacion legal fiscal</td></tr>
            <tr><td>Datos de instalaciones (como encargado)</td><td>Duracion de la suscripcion + 30 dias de portabilidad</td><td>Ejecucion contractual. Tras la baja, el Usuario puede exportar sus datos durante 30 dias. Posteriormente se eliminan, salvo obligacion legal de conservacion</td></tr>
            <tr><td>Registros de uso (logs de seguridad)</td><td>12 meses</td><td>Seguridad y deteccion de incidentes</td></tr>
            <tr><td>Registros de consentimientos</td><td>Duracion de la suscripcion + 5 anos</td><td>Demostracion de cumplimiento (accountability)</td></tr>
          </tbody>
        </table>
      </div>

      <h2>4. Destinatarios de los datos</h2>
      <p>DASO podra comunicar los datos del Usuario a los siguientes terceros, exclusivamente para las finalidades indicadas:</p>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Destinatario</th><th>Finalidad</th><th>Ubicacion</th><th>Garantias</th></tr></thead>
          <tbody>
            <tr><td>Hetzner Online GmbH</td><td>Alojamiento de la Plataforma y almacenamiento de datos</td><td>Helsinki, Finlandia (UE)</td><td>Tratamiento intra-UE. RGPD aplicable directamente</td></tr>
            <tr><td>Stripe Payments Europe Ltd.</td><td>Procesamiento de pagos de la suscripcion</td><td>Irlanda (UE). Posibles transferencias a Stripe Inc. (EE.UU.)</td><td>Clausulas Contractuales Tipo (SCCs) + Data Privacy Framework (DPF) UE-EE.UU.</td></tr>
          </tbody>
        </table>
      </div>
      <p>DASO no comunica datos personales a terceros distintos de los indicados, salvo que exista obligacion legal de hacerlo (requerimiento judicial, Agencia Tributaria, etc.).</p>

      <h2>5. Transferencias internacionales de datos</h2>
      <p>Los datos de la Plataforma se alojan en servidores de Hetzner Online GmbH ubicados en Helsinki (Finlandia), dentro del Espacio Economico Europeo (EEE). No existe transferencia internacional por este concepto.</p>
      <p>La unica transferencia de datos fuera del EEE se produce a traves de Stripe para el procesamiento de pagos. Stripe Payments Europe Ltd. (Irlanda) puede transferir datos a Stripe Inc. (EE.UU.) bajo las garantias de las Clausulas Contractuales Tipo (SCCs) aprobadas por la Comision Europea (Decision 2021/914) y el Data Privacy Framework (DPF) UE-EE.UU.</p>

      <h2>6. Derechos del Usuario</h2>
      <p>El Usuario puede ejercer los siguientes derechos reconocidos por el RGPD y la LOPD-GDD:</p>
      <ul>
        <li><strong>Acceso:</strong> Conocer que datos personales tratamos sobre usted.</li>
        <li><strong>Rectificacion:</strong> Solicitar la correccion de datos inexactos o incompletos.</li>
        <li><strong>Supresion:</strong> Solicitar la eliminacion de sus datos cuando ya no sean necesarios.</li>
        <li><strong>Oposicion:</strong> Oponerse al tratamiento de sus datos en determinadas circunstancias.</li>
        <li><strong>Limitacion del tratamiento:</strong> Solicitar que se restrinja el tratamiento de sus datos.</li>
        <li><strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado, de uso comun y lectura mecanica, y transmitirlos a otro responsable.</li>
      </ul>
      <p>Para ejercer cualquiera de estos derechos, envie una comunicacion a <strong>privacidad@oasisplatform.es</strong> indicando el derecho que desea ejercer y acompanando copia de su documento de identidad.</p>
      <p>Plazo de respuesta: un (1) mes desde la recepcion de la solicitud, ampliable a tres (3) meses en casos de especial complejidad, previa comunicacion al interesado.</p>
      <p>Si considera que el tratamiento de sus datos no se ajusta a la normativa vigente, tiene derecho a presentar una reclamacion ante la Agencia Espanola de Proteccion de Datos (AEPD): www.aepd.es.</p>

      <h2>7. Medidas de seguridad</h2>
      <p>DASO aplica las medidas tecnicas y organizativas adecuadas para garantizar la seguridad de los datos personales, incluyendo:</p>
      <ul>
        <li>Cifrado de datos en transito (TLS/HTTPS).</li>
        <li>Control de acceso basado en roles (RBAC) con autenticacion JWT.</li>
        <li>Copias de seguridad periodicas y cifradas.</li>
        <li>Registro de accesos y actividad (logs de auditoria).</li>
        <li>Revision periodica de las medidas de seguridad.</li>
      </ul>

      <h2>8. Datos de menores</h2>
      <p>La Plataforma no esta dirigida a menores de edad. DASO no recoge intencionadamente datos personales de menores de 18 anos. Si tiene conocimiento de que un menor ha proporcionado datos personales a traves de la Plataforma, contacte con nosotros en privacidad@oasisplatform.es para proceder a su eliminacion.</p>

      <h2>9. Modificacion de la Politica de Privacidad</h2>
      <p>DASO se reserva el derecho de modificar la presente Politica de Privacidad para adaptarla a novedades legislativas o jurisprudenciales, asi como a cambios en la Plataforma. Las modificaciones seran notificadas al Usuario con un preaviso razonable y publicadas en la Plataforma.</p>

      <h2>10. Encargado del Tratamiento</h2>
      <p>El uso de la Plataforma por parte del Usuario implica que DASO actua como Encargado del Tratamiento respecto a los datos de terceros (titulares de instalaciones y datos tecnicos) introducidos por el Usuario. Las condiciones de este encargo se regulan en el Contrato de Encargado del Tratamiento, disponible en <Link href="/legal/dpa" className="text-blue-600 hover:underline">/legal/dpa</Link>.</p>

      <hr />
      <p className="text-xs text-slate-400 italic">Este documento es un borrador generado por IA. Debe ser revisado y validado por un profesional juridico antes de su publicacion.</p>
    </article>
  );
}
