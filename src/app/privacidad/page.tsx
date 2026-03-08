import { Zap } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad — CIE Platform',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center gap-3">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900">CIE Platform</span>
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Política de Privacidad</h1>
        <p className="text-sm text-slate-500 mb-8">Última actualización: febrero 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">1. Responsable del tratamiento</h2>
            <p>
              DASO Ingenieros (en adelante, &quot;el Responsable&quot;), con domicilio en Madrid, España,
              es el responsable del tratamiento de los datos personales recogidos a través de la plataforma
              CIE Platform, accesible en <strong>oasisplatform.es</strong>.
            </p>
            <p>Email de contacto: <strong>privacidad@oasisplatform.es</strong></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">2. Datos que recopilamos</h2>
            <p>Recopilamos los siguientes datos personales:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Datos de cuenta:</strong> nombre, email, contraseña (hash cifrado), nombre de empresa.</li>
              <li><strong>Datos profesionales:</strong> NIF/CIF, número de registro industrial, categoría de instalador, datos de empresa instaladora.</li>
              <li><strong>Datos de instalaciones:</strong> datos del titular (NIF, dirección, teléfono, email), datos del emplazamiento, datos técnicos de la instalación eléctrica.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, fecha y hora de acceso (logs del servidor).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">3. Finalidad del tratamiento</h2>
            <p>Tratamos sus datos con las siguientes finalidades:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Prestación del servicio:</strong> generación de Certificados de Instalación Eléctrica (CIE), Memorias Técnicas de Diseño (MTD) y Solicitudes de Baja Tensión conforme al REBT.</li>
              <li><strong>Gestión de la cuenta:</strong> autenticación, autorización y administración del usuario.</li>
              <li><strong>Comunicaciones:</strong> notificaciones relacionadas con el servicio (nunca comerciales sin consentimiento).</li>
              <li><strong>Cumplimiento legal:</strong> obligaciones fiscales, mercantiles y regulatorias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">4. Base legal del tratamiento</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Consentimiento</strong> (Art. 6.1.a RGPD): otorgado al aceptar esta política durante el registro.</li>
              <li><strong>Ejecución del contrato</strong> (Art. 6.1.b RGPD): necesario para prestar el servicio contratado.</li>
              <li><strong>Obligación legal</strong> (Art. 6.1.c RGPD): cumplimiento de normativa eléctrica (REBT) y fiscal.</li>
              <li><strong>Interés legítimo</strong> (Art. 6.1.f RGPD): seguridad del sistema y prevención de fraude.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">5. Conservación de datos</h2>
            <p>
              Los datos se conservarán mientras exista una relación contractual activa.
              Tras la baja del servicio, los datos se conservarán bloqueados durante los plazos
              legalmente exigidos (5 años para obligaciones fiscales, según la Ley General Tributaria).
            </p>
            <p>
              Los certificados eléctricos generados se conservan durante un mínimo de 5 años conforme
              a la normativa del REBT y requisitos de las administraciones autonómicas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">6. Destinatarios de los datos</h2>
            <p>Sus datos podrán ser comunicados a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Administraciones públicas:</strong> cuando sea necesario para la tramitación de certificados ante organismos como ASEICAM, EICI o la Comunidad de Madrid.</li>
              <li><strong>Proveedores de infraestructura:</strong> servicios de alojamiento (OVH) y bases de datos, bajo acuerdos de tratamiento de datos.</li>
              <li><strong>No se venden ni ceden datos a terceros con fines comerciales.</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">7. Derechos del interesado</h2>
            <p>Conforme al RGPD, puede ejercer los siguientes derechos:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Acceso:</strong> conocer qué datos suyos tratamos.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
              <li><strong>Supresión</strong> (derecho al olvido): solicitar el borrado de sus datos.</li>
              <li><strong>Limitación:</strong> solicitar la restricción del tratamiento.</li>
              <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado.</li>
              <li><strong>Oposición:</strong> oponerse al tratamiento en determinadas circunstancias.</li>
            </ul>
            <p>
              Para ejercer estos derechos, contacte con <strong>privacidad@oasisplatform.es</strong> indicando
              su nombre, email de registro y el derecho que desea ejercer.
            </p>
            <p>
              También puede eliminar su cuenta y todos sus datos directamente desde la configuración
              de su perfil en la plataforma (botón &quot;Eliminar cuenta&quot;).
            </p>
            <p>
              Tiene derecho a presentar una reclamación ante la{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 underline">
                Agencia Española de Protección de Datos (AEPD)
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">8. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger sus datos:
              cifrado de contraseñas (bcrypt), comunicaciones HTTPS/TLS, tokens de acceso con
              expiración, aislamiento de datos por empresa (multi-tenant), copias de seguridad
              automatizadas y control de acceso basado en roles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">9. Transferencias internacionales</h2>
            <p>
              Los datos se almacenan en servidores ubicados en la Unión Europea (OVH, Francia/España).
              No se realizan transferencias de datos fuera del Espacio Económico Europeo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900">10. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de actualizar esta política. En caso de cambios sustanciales,
              notificaremos a los usuarios registrados por email. La fecha de última actualización
              aparece al inicio del documento.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <a href="/register" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            ← Volver al registro
          </a>
        </div>
      </main>
    </div>
  );
}
