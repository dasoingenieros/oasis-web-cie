import Link from 'next/link';

export default function TerminosPage() {
  return (
    <article className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700">
      <h1>TERMINOS Y CONDICIONES DE USO DE CIE PLATFORM</h1>
      <p className="text-sm text-slate-500"><strong>Referencia:</strong> LEGAL-CIE-TOS-v1.0 | <strong>Fecha:</strong> Marzo 2026<br /><strong>Titular:</strong> DASO Ingenieros S.L.P. | <strong>CIF:</strong> B85071512</p>

      <h2>1. Objeto</h2>
      <p>Los presentes Terminos y Condiciones de Uso (en adelante, &quot;los Terminos&quot;) regulan el acceso, registro y uso de CIE Platform (en adelante, &quot;la Plataforma&quot;), una herramienta SaaS de asistencia al calculo electrico y gestion de certificados de instalacion electrica, titularidad de DASO Ingenieros S.L.P. (en adelante, &quot;DASO&quot;).</p>
      <p>El acceso y uso de la Plataforma implica la aceptacion integra de los presentes Terminos. Si el Usuario no esta de acuerdo con alguna de las condiciones aqui establecidas, debera abstenerse de utilizar la Plataforma.</p>

      <h2>2. Definiciones</h2>
      <ul>
        <li><strong>Plataforma:</strong> El software CIE Platform, accesible en linea a traves del dominio web correspondiente.</li>
        <li><strong>Usuario:</strong> Persona fisica o juridica que accede y utiliza la Plataforma tras completar el proceso de registro.</li>
        <li><strong>Tecnico Competente:</strong> Persona fisica con la habilitacion profesional exigida por el articulo 12 del REBT (RD 842/2002) para suscribir certificados de instalacion electrica en baja tension.</li>
        <li><strong>Certificado:</strong> Documento de instalacion electrica generado mediante la Plataforma, que requiere la verificacion y firma del Tecnico Competente para su validez.</li>
        <li><strong>Motor de Calculo:</strong> Conjunto de algoritmos de calculo electrico integrados en la Plataforma, basados en el REBT e ITC-BT.</li>
        <li><strong>Empresa Instaladora:</strong> Entidad inscrita en el REIE (Registro de Empresas Instaladoras de Electricidad) para la que trabaja o actua el Usuario.</li>
      </ul>

      <h2>3. Naturaleza del servicio — Clausula de herramienta</h2>
      <p>3.1. La Plataforma es exclusivamente una <strong>herramienta de asistencia</strong> al calculo electrico y a la gestion documental de certificados de instalacion.</p>
      <p>3.2. La Plataforma <strong>no constituye</strong> un servicio de ingenieria, consultoria tecnica, asesoramiento profesional ni verificacion de instalaciones.</p>
      <p>3.3. La Plataforma <strong>no verifica, valida ni certifica</strong> la conformidad normativa de ninguna instalacion electrica.</p>
      <p>3.4. Los resultados de calculo proporcionados por la Plataforma son <strong>orientativos</strong> y estan basados en los datos introducidos por el Usuario y en las formulas del REBT e ITC-BT vigentes en la fecha de la ultima actualizacion del Motor de Calculo. Dichos resultados estan sujetos a la verificacion obligatoria del Tecnico Competente.</p>
      <p>3.5. DASO <strong>no actua en ningun caso</strong> como Tecnico Competente ni asume las responsabilidades inherentes a dicha condicion profesional.</p>
      <p>3.6. La Plataforma mostrara en todo momento la fecha de la ultima actualizacion del Motor de Calculo y la version de la normativa incorporada.</p>

      <h2>4. Requisitos de acceso y registro</h2>
      <p>4.1. Para utilizar la Plataforma, el Usuario debe completar el proceso de registro proporcionando datos veraces y actualizados.</p>
      <p>4.2. En el proceso de registro, el Usuario declarara si ostenta la condicion de Tecnico Competente conforme al articulo 12 del REBT. Esta declaracion constituye una manifestacion de diligencia a efectos legales y no implica que DASO verifique o acredite la habilitacion profesional del Usuario.</p>
      <p>4.3. El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que se realicen bajo su cuenta.</p>
      <p>4.4. DASO se reserva el derecho de suspender o cancelar cuentas que proporcionen informacion falsa o que hagan un uso indebido de la Plataforma.</p>

      <h2>5. Obligaciones del Usuario</h2>
      <p>El Usuario se compromete a:</p>
      <p>a) Proporcionar datos veraces, exactos y actualizados tanto en el registro como en el uso de la Plataforma.</p>
      <p>b) Utilizar la Plataforma conforme a la legislacion vigente, los presentes Terminos y la buena fe.</p>
      <p>c) Verificar personalmente los resultados de calculo generados por la Plataforma antes de incorporarlos a cualquier documento o certificado.</p>
      <p>d) Asumir la responsabilidad exclusiva sobre la veracidad, exactitud y conformidad normativa de los certificados que genere, firme y presente mediante la Plataforma.</p>
      <p>e) No utilizar la Plataforma para generar documentacion falsa, fraudulenta o que induzca a error.</p>
      <p>f) Notificar a DASO cualquier error o desfase normativo que detecte en el Motor de Calculo a traves de los canales de soporte de la Plataforma.</p>

      <h2>6. Responsabilidad</h2>
      <h3>6.1. Responsabilidad del Usuario</h3>
      <p>El Usuario es el unico y exclusivo responsable de:</p>
      <p>a) La veracidad y exactitud de los datos introducidos en la Plataforma.</p>
      <p>b) La verificacion profesional de todos los resultados de calculo obtenidos.</p>
      <p>c) La conformidad normativa de la instalacion electrica objeto del certificado.</p>
      <p>d) La firma y presentacion del certificado ante la administracion competente y/o el Organismo de Control Autorizado (OCA).</p>
      <p>e) Cualquier consecuencia, dano o perjuicio derivado del uso de los certificados generados mediante la Plataforma, incluyendo danos a terceros, sanciones administrativas o responsabilidad civil o penal.</p>

      <h3>6.2. Limitacion de responsabilidad de DASO</h3>
      <p>DASO no sera responsable de:</p>
      <p>a) Errores en los resultados de calculo derivados de datos incorrectos, incompletos o desactualizados introducidos por el Usuario.</p>
      <p>b) Interpretaciones normativas que difieran de las implementadas en el Motor de Calculo.</p>
      <p>c) Cambios normativos (REBT, ITC-BT u otras disposiciones aplicables) publicados con posterioridad a la ultima actualizacion del Motor de Calculo.</p>
      <p>d) Decisiones profesionales del Tecnico Competente basadas, total o parcialmente, en los resultados de la Plataforma.</p>
      <p>e) Danos indirectos, lucro cesante, perdida de datos, danos consecuenciales o cualquier otro dano que no sea directo y previsible.</p>
      <p>f) Interrupciones del servicio debidas a mantenimiento programado, actualizaciones, fallos tecnicos o causas de fuerza mayor.</p>

      <h3>6.3. Limite cuantitativo de responsabilidad</h3>
      <p>En todo caso, la responsabilidad total acumulada de DASO frente al Usuario, por cualquier concepto derivado del uso de la Plataforma, no excedera del importe total de las cuotas efectivamente abonadas por el Usuario durante los doce (12) meses inmediatamente anteriores al hecho generador de la responsabilidad.</p>

      <h2>7. Propiedad intelectual</h2>
      <p>7.1. La Plataforma, su codigo fuente, diseno, logotipos, Motor de Calculo, algoritmos, bases de datos y demas elementos son propiedad exclusiva de DASO y estan protegidos por la legislacion vigente en materia de propiedad intelectual e industrial.</p>
      <p>7.2. La suscripcion a la Plataforma otorga al Usuario una licencia de uso no exclusiva, intransferible y revocable, limitada a la duracion de la suscripcion y al uso conforme a los presentes Terminos.</p>
      <p>7.3. Los certificados y documentos generados por el Usuario mediante la Plataforma son propiedad del Usuario.</p>

      <h2>8. Precio y forma de pago</h2>
      <p>8.1. El acceso a la Plataforma requiere el pago de una suscripcion cuyo precio sera el vigente en el momento de la contratacion, publicado en la Plataforma. Los precios se expresan en euros y no incluyen IVA salvo indicacion expresa.</p>
      <p>8.2. El pago se gestiona a traves de la pasarela de pago Stripe (Stripe Payments Europe Ltd.). DASO no almacena datos de tarjeta de credito ni datos bancarios del Usuario.</p>
      <p>8.3. El impago de cualquier cuota faculta a DASO para suspender el acceso del Usuario a la Plataforma hasta la regularizacion del pago.</p>

      <h2>9. Duracion, cancelacion y portabilidad</h2>
      <p>9.1. La suscripcion se contrata por periodos mensuales y se renueva automaticamente salvo cancelacion por cualquiera de las partes.</p>
      <p>9.2. El Usuario puede cancelar su suscripcion en cualquier momento a traves de la Plataforma. La cancelacion sera efectiva al termino del periodo de facturacion en curso, sin derecho a reembolso de la cuota del periodo corriente.</p>
      <p>9.3. <strong>Portabilidad de datos.</strong> Tras la cancelacion, el Usuario podra solicitar la exportacion de sus datos y de los certificados generados durante la vigencia de la suscripcion, en un formato estandar y legible por maquina, durante un plazo de treinta (30) dias desde la fecha de cancelacion efectiva.</p>
      <p>9.4. Transcurrido el plazo de portabilidad, DASO procedera a la eliminacion de los datos del Usuario conforme a lo previsto en la Politica de Privacidad, sin perjuicio de los plazos de conservacion legalmente exigidos.</p>

      <h2>10. Actualizacion de la Plataforma y normativa</h2>
      <p>10.1. DASO realizara esfuerzos razonables para mantener actualizado el Motor de Calculo conforme a las modificaciones del REBT, ITC-BT y demas normativa tecnica aplicable.</p>
      <p>10.2. DASO <strong>no garantiza</strong> la actualizacion inmediata del Motor de Calculo tras la publicacion oficial de cambios normativos. Podra existir un periodo de desfase entre la publicacion de una modificacion normativa y su incorporacion al Motor de Calculo.</p>
      <p>10.3. La Plataforma indicara en todo momento la fecha de la ultima actualizacion del Motor de Calculo y la version de la normativa incorporada.</p>
      <p>10.4. El Usuario es responsable de verificar que los calculos y documentos generados se ajustan a la normativa vigente en el momento de la firma del certificado, con independencia de la version normativa implementada en el Motor de Calculo.</p>

      <h2>11. Proteccion de datos</h2>
      <p>El tratamiento de los datos personales del Usuario se rige por la Politica de Privacidad de la Plataforma, disponible en <Link href="/legal/privacidad" className="text-blue-600 hover:underline">/legal/privacidad</Link>, que forma parte integrante de los presentes Terminos.</p>

      <h2>12. Modificacion de los Terminos</h2>
      <p>12.1. DASO se reserva el derecho de modificar los presentes Terminos en cualquier momento.</p>
      <p>12.2. Las modificaciones seran notificadas al Usuario con un preaviso minimo de treinta (30) dias, mediante comunicacion por correo electronico y/o aviso en la Plataforma.</p>
      <p>12.3. Si el Usuario no esta de acuerdo con los nuevos Terminos, podra cancelar su suscripcion antes de la entrada en vigor de las modificaciones, sin penalizacion alguna. El uso continuado de la Plataforma tras la entrada en vigor de los nuevos Terminos implica su aceptacion.</p>

      <h2>13. Resolucion por incumplimiento</h2>
      <p>DASO podra resolver la relacion contractual de forma inmediata y sin preaviso en caso de incumplimiento grave de los presentes Terminos por parte del Usuario, incluyendo, sin limitacion: proporcionar datos falsos en el registro, generar documentacion fraudulenta, o hacer un uso de la Plataforma contrario a la legislacion vigente.</p>

      <h2>14. Legislacion aplicable y jurisdiccion</h2>
      <p>Los presentes Terminos se rigen por la legislacion espanola. Para la resolucion de cualquier controversia derivada de la interpretacion o ejecucion de los presentes Terminos, las partes se someten a los Juzgados y Tribunales de Madrid, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.</p>

      <h2>15. Nulidad parcial</h2>
      <p>Si alguna clausula de los presentes Terminos fuera declarada nula o ineficaz, total o parcialmente, dicha nulidad afectara exclusivamente a la disposicion en cuestion, manteniendose la validez de los restantes Terminos.</p>

      <h2>16. Contacto</h2>
      <p>Para cualquier consulta relacionada con los presentes Terminos, el Usuario puede dirigirse a: privacidad@oasisplatform.es</p>

      <hr />
      <p className="text-xs text-slate-400 italic">Este documento es un borrador generado por IA. Debe ser revisado y validado por un profesional juridico antes de su publicacion.</p>
    </article>
  );
}
