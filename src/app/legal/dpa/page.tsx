export default function DpaPage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-table:text-sm">
      <h1>CONTRATO DE ENCARGADO DEL TRATAMIENTO (DPA)</h1>
      <p className="text-sm text-slate-500"><strong>Referencia:</strong> LEGAL-CIE-DPA-v1.0 | <strong>Fecha:</strong> Marzo 2026</p>

      <h2>1. Partes</h2>
      <ul>
        <li><strong>Responsable del Tratamiento (&quot;el Responsable&quot;):</strong> El Usuario de CIE Platform, en su condicion de profesional o empresa instaladora que recoge y trata datos personales de los titulares de las instalaciones electricas.</li>
        <li><strong>Encargado del Tratamiento (&quot;el Encargado&quot;):</strong> DASO Ingenieros S.L.P., con CIF B85071512 y domicilio en Paseo Joaquin Ruiz Gimenez 14, 2oA, 28250 Torrelodones, Madrid, en su condicion de prestador del servicio CIE Platform.</li>
      </ul>

      <h2>2. Objeto del encargo</h2>
      <p>El presente contrato tiene por objeto regular las condiciones en las que el Encargado trata datos personales por cuenta del Responsable, en cumplimiento del articulo 28 del Reglamento (UE) 2016/679 (RGPD) y del articulo 33 de la Ley Organica 3/2018 (LOPD-GDD).</p>
      <p>El Encargado tratara los datos personales unicamente para la prestacion del servicio CIE Platform, conforme a las instrucciones documentadas del Responsable y en los terminos establecidos en el presente contrato.</p>

      <h2>3. Datos objeto del tratamiento</h2>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Categoria de datos</th><th>Tipos de datos</th><th>Categorias de interesados</th></tr></thead>
          <tbody>
            <tr><td>Datos de identificacion del titular</td><td>Nombre, direccion, NIF</td><td>Titulares de instalaciones electricas (clientes del Responsable)</td></tr>
            <tr><td>Datos tecnicos de la instalacion</td><td>Potencia, circuitos, protecciones, caracteristicas tecnicas</td><td>No aplica (datos no personales)</td></tr>
          </tbody>
        </table>
      </div>
      <p>La naturaleza del tratamiento consiste en: almacenamiento, organizacion, consulta, generacion de documentos (certificados) y exportacion, exclusivamente en el marco del servicio CIE Platform.</p>

      <h2>4. Obligaciones del Encargado</h2>
      <p>El Encargado se compromete a:</p>
      <p>a) Tratar los datos personales unicamente conforme a las instrucciones documentadas del Responsable, incluidas las relativas a transferencias internacionales de datos, salvo que este obligado a ello en virtud del Derecho de la Union o del Estado miembro.</p>
      <p>b) Garantizar que las personas autorizadas para tratar los datos se hayan comprometido a respetar la confidencialidad o esten sujetas a una obligacion legal de confidencialidad.</p>
      <p>c) Aplicar las medidas tecnicas y organizativas apropiadas para garantizar un nivel de seguridad adecuado al riesgo, incluyendo:</p>
      <ul>
        <li>Cifrado de datos en transito y en reposo.</li>
        <li>Control de acceso basado en roles.</li>
        <li>Copias de seguridad periodicas y cifradas.</li>
        <li>Registros de acceso y auditoria.</li>
      </ul>

      <p>d) No recurrir a otro encargado (subencargado) sin la autorizacion previa del Responsable. El Responsable autoriza expresamente los siguientes subencargados:</p>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Subencargado</th><th>Servicio</th><th>Ubicacion</th><th>Garantias</th></tr></thead>
          <tbody>
            <tr><td>Hetzner Online GmbH</td><td>Alojamiento y almacenamiento</td><td>Helsinki, Finlandia (UE)</td><td>Intra-UE</td></tr>
          </tbody>
        </table>
      </div>
      <p>Si el Encargado necesita recurrir a un nuevo subencargado, informara al Responsable con un preaviso de treinta (30) dias, permitiendole oponerse. El Encargado garantizara contractualmente que el subencargado cumple las mismas obligaciones de proteccion de datos.</p>

      <p>e) Asistir al Responsable en el cumplimiento de sus obligaciones de atender las solicitudes de ejercicio de derechos de los interesados (acceso, rectificacion, supresion, oposicion, limitacion, portabilidad).</p>
      <p>f) Asistir al Responsable en el cumplimiento de las obligaciones relativas a la seguridad del tratamiento, la notificacion de violaciones de seguridad y las evaluaciones de impacto.</p>
      <p>g) A eleccion del Responsable, suprimir o devolver todos los datos personales una vez finalizada la prestacion del servicio, y suprimir las copias existentes salvo que la legislacion aplicable exija su conservacion. El Responsable dispondra de un plazo de treinta (30) dias tras la cancelacion de la suscripcion para solicitar la exportacion de sus datos.</p>
      <p>h) Poner a disposicion del Responsable toda la informacion necesaria para demostrar el cumplimiento de las obligaciones establecidas en el articulo 28 del RGPD, asi como para permitir y contribuir a la realizacion de auditorias, incluidas inspecciones, por parte del Responsable o de un auditor autorizado por este.</p>

      <h2>5. Notificacion de violaciones de seguridad</h2>
      <p>Si el Encargado tiene conocimiento de una violacion de la seguridad de los datos personales tratados por cuenta del Responsable, lo notificara al Responsable sin dilacion indebida y, en cualquier caso, en un plazo maximo de 48 horas desde que tenga conocimiento de la misma.</p>
      <p>La notificacion incluira, como minimo:</p>
      <ul>
        <li>Descripcion de la naturaleza de la violacion.</li>
        <li>Categorias y numero aproximado de interesados afectados.</li>
        <li>Posibles consecuencias de la violacion.</li>
        <li>Medidas adoptadas o propuestas para remediar la violacion.</li>
      </ul>
      <p>Esta notificacion no exime al Responsable de su obligacion de notificar a la AEPD en el plazo de 72 horas (Art. 33 RGPD) cuando la violacion pueda entranar un riesgo para los derechos y libertades de los interesados.</p>

      <h2>6. Duracion</h2>
      <p>El presente contrato de encargo del tratamiento estara vigente durante toda la duracion de la relacion contractual entre el Responsable y el Encargado (suscripcion a CIE Platform) y se extendera hasta la completa devolucion o supresion de los datos, incluido el periodo de portabilidad de treinta (30) dias.</p>

      <h2>7. Legislacion aplicable</h2>
      <p>El presente contrato se rige por el Reglamento (UE) 2016/679 (RGPD), la Ley Organica 3/2018 (LOPD-GDD) y la legislacion espanola. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Madrid.</p>

      <h2>8. Contacto</h2>
      <p>Para cualquier cuestion relacionada con el presente contrato de encargo del tratamiento: privacidad@oasisplatform.es</p>

      <hr />
      <p className="text-xs text-slate-400 italic">Este documento es un borrador generado por IA. Debe ser revisado y validado por un profesional juridico antes de su publicacion.</p>
    </article>
  );
}
