export default function CookiesPage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-table:text-sm">
      <h1>POLITICA DE COOKIES DE CIE PLATFORM</h1>
      <p className="text-sm text-slate-500">
        <strong>Referencia:</strong> LEGAL-CIE-COOK-v1.0 | <strong>Fecha:</strong> Marzo 2026<br />
        <strong>Titular:</strong> DASO Ingenieros S.L.P. | <strong>CIF:</strong> B85071512
      </p>

      <h2>1. ¿Que son las cookies?</h2>
      <p>Las cookies son pequenos archivos de texto que los sitios web almacenan en el dispositivo del usuario (ordenador, tablet o telefono movil) al visitarlos. Permiten que el sitio recuerde informacion sobre la visita, como las preferencias de idioma u otros ajustes, facilitando la siguiente visita y haciendo que el sitio sea mas util.</p>

      <h2>2. ¿Que cookies utiliza CIE Platform?</h2>

      <h3>2.1. Cookies estrictamente necesarias (tecnicas)</h3>
      <p>Estas cookies son esenciales para el funcionamiento de la Plataforma. No requieren consentimiento del usuario.</p>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Cookie</th><th>Finalidad</th><th>Duracion</th><th>Tipo</th></tr></thead>
          <tbody>
            <tr><td>session_token</td><td>Autenticacion y mantenimiento de la sesion del usuario</td><td>Sesion (se elimina al cerrar el navegador) o segun configuracion de &quot;recordar sesion&quot;</td><td>Propia</td></tr>
            <tr><td>csrf_token</td><td>Proteccion contra ataques de falsificacion de solicitudes (CSRF)</td><td>Sesion</td><td>Propia</td></tr>
            <tr><td>cookie_consent</td><td>Almacenar la preferencia de cookies del usuario</td><td>12 meses</td><td>Propia</td></tr>
          </tbody>
        </table>
      </div>

      <h3>2.2. Cookies analiticas (opcional, requieren consentimiento)</h3>
      <p>CIE Platform no utiliza cookies analiticas en este momento. Si en el futuro se incorporan, esta Politica sera actualizada y se solicitara el consentimiento del Usuario antes de su activacion.</p>

      <h3>2.3. Cookies de terceros</h3>
      <p>La pasarela de pago Stripe puede instalar sus propias cookies durante el proceso de pago. Estas cookies estan sujetas a la politica de privacidad y cookies de Stripe (https://stripe.com/privacy).</p>

      <h2>3. ¿Como gestionar las cookies?</h2>
      <p>El Usuario puede configurar sus preferencias de cookies a traves del banner de cookies que aparece en su primera visita a la Plataforma. Ademas, puede modificar sus preferencias en cualquier momento accediendo a la configuracion de cookies desde el enlace disponible en el pie de pagina de la Plataforma.</p>
      <p>El Usuario tambien puede gestionar las cookies a traves de la configuracion de su navegador:</p>
      <ul>
        <li><strong>Chrome:</strong> chrome://settings/cookies</li>
        <li><strong>Firefox:</strong> about:preferences#privacy</li>
        <li><strong>Safari:</strong> Preferencias &gt; Privacidad</li>
        <li><strong>Edge:</strong> edge://settings/privacy</li>
      </ul>
      <p>La desactivacion de las cookies estrictamente necesarias puede impedir el correcto funcionamiento de la Plataforma.</p>

      <h2>4. Actualizaciones de esta politica</h2>
      <p>DASO se reserva el derecho de actualizar esta Politica de Cookies para reflejar cambios en las cookies utilizadas o en la normativa aplicable. Cualquier modificacion sera publicada en la Plataforma.</p>

      <h2>5. Mas informacion</h2>
      <p>Para cualquier consulta sobre el uso de cookies en CIE Platform, puede contactar con nosotros en: privacidad@oasisplatform.es</p>

      <hr />
      <p className="text-xs text-slate-400 italic">Este documento es un borrador generado por IA. Debe ser revisado y validado por un profesional juridico antes de su publicacion.</p>
    </article>
  );
}
