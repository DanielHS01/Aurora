
export default function DpaPage() {
  return (
    <article className="prose prose-sm prose-neutral mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-black/70 prose-li:text-black/70 prose-strong:text-black prose-table:text-sm">
      <h1 className="text-3xl font-semibold tracking-tight">
        Acuerdo de Procesamiento de Datos (DPA)
      </h1>
      <p className="mt-2 text-sm text-black/40">Última actualización: [FECHA]</p>
      <p>
        Este Acuerdo de Procesamiento de Datos (&quot;DPA&quot;) regula el tratamiento de datos
        personales que <strong>[RAZÓN SOCIAL]</strong> (&quot;Aurora&quot;, el &quot;Encargado&quot;)
        realiza por cuenta del Negocio (el &quot;Responsable&quot;) al prestar la Plataforma, en los
        términos de la Ley 1581 de 2012 y su decreto reglamentario. Este DPA se incorpora por
        referencia a los <a href="/legal/terminos">Términos y Condiciones</a>.
      </p>

      <h2>1. Roles de las partes</h2>
      <p>
        Respecto de los datos personales de los clientes finales del Negocio (nombres, teléfonos,
        historial de pedidos/reservas, conversaciones con el agente de IA), el Negocio actúa como{' '}
        <strong>Responsable del Tratamiento</strong>, y Aurora actúa exclusivamente como{' '}
        <strong>Encargado del Tratamiento</strong>, procesando dichos datos únicamente siguiendo
        las instrucciones del Negocio, plasmadas en la configuración y uso de la Plataforma.
      </p>

      <h2>2. Instrucciones del Responsable</h2>
      <p>
        El Negocio instruye a Aurora para tratar los datos personales de sus clientes finales
        únicamente con el propósito de: operar las funcionalidades contratadas (gestión de
        pedidos, reservas, facturación, atención por agente de IA), generar reportes para el
        propio Negocio, y cumplir obligaciones legales aplicables. Cualquier instrucción adicional
        deberá constar por escrito.
      </p>

      <h2>3. Subencargados (Subprocesadores)</h2>
      <p>
        El Negocio autoriza a Aurora a valerse de los siguientes subencargados para la prestación
        del servicio, cada uno sujeto a obligaciones contractuales de confidencialidad y
        seguridad equivalentes a las aquí descritas:
      </p>
      <table>
        <thead>
          <tr>
            <th>Subencargado</th>
            <th>Función</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Supabase</td><td>Almacenamiento de base de datos y autenticación</td></tr>
          <tr><td>Vercel</td><td>Hospedaje de la aplicación</td></tr>
          <tr><td>Cloudinary</td><td>Almacenamiento de imágenes</td></tr>
          <tr><td>Wompi</td><td>Procesamiento de pagos de la membresía</td></tr>
          <tr><td>Factus</td><td>Transmisión de documentos a la DIAN (cuando el Negocio activa facturación electrónica)</td></tr>
          <tr><td>360dialog</td><td>Infraestructura de mensajería WhatsApp Business</td></tr>
          <tr><td>Anthropic</td><td>Procesamiento de lenguaje natural para el agente de IA</td></tr>
          <tr><td>[Proveedor de voz, cuando se active]</td><td>Atención telefónica automatizada</td></tr>
        </tbody>
      </table>
      <p>
        Aurora notificará al Negocio con antelación razonable cualquier cambio en esta lista que
        implique la incorporación de un nuevo subencargado, otorgando al Negocio la posibilidad de
        objetar dentro de un plazo razonable por motivos justificados relacionados con la
        protección de datos.
      </p>

      <h2>4. Medidas de seguridad</h2>
      <p>Aurora implementa, entre otras, las siguientes medidas:</p>
      <ul>
        <li>Cifrado de contraseñas y credenciales sensibles de terceros (API keys, tokens de pago);</li>
        <li>Separación lógica de datos entre Negocios mediante controles de seguridad a nivel de base de datos (Row Level Security), de forma que un Negocio no pueda acceder a los datos de otro;</li>
        <li>Control de acceso basado en roles dentro de cada cuenta de Negocio;</li>
        <li>Revisión periódica de advertencias de seguridad sobre la infraestructura utilizada.</li>
      </ul>

      <h2>5. Confidencialidad del personal</h2>
      <p>
        Aurora garantiza que el personal autorizado para acceder a los datos personales está
        sujeto a obligaciones de confidencialidad, ya sea por contrato laboral, acuerdo de
        confidencialidad, o disposición legal.
      </p>

      <h2>6. Notificación de incidentes de seguridad</h2>
      <p>
        En caso de un incidente de seguridad que comprometa la confidencialidad, integridad o
        disponibilidad de los datos personales tratados, Aurora notificará al Negocio sin demora
        injustificada, y en todo caso dentro de los plazos que permitan al Negocio cumplir con sus
        propias obligaciones de reporte ante la SIC u otras autoridades, cuando aplique.
      </p>

      <h2>7. Asistencia al Responsable</h2>
      <p>
        Aurora pondrá a disposición del Negocio las funcionalidades razonablemente necesarias para
        que este pueda atender solicitudes de sus clientes finales relacionadas con sus derechos
        de Habeas Data (acceso, rectificación, supresión), dentro de las capacidades técnicas de
        la Plataforma.
      </p>

      <h2>8. Transferencia internacional</h2>
      <p>
        Dado que varios subencargados procesan información fuera de Colombia, el Negocio autoriza
        dichas transferencias internacionales como necesarias para la prestación del servicio, en
        los términos descritos en la <a href="/legal/privacidad">Política de Privacidad</a>.
      </p>

      <h2>9. Devolución o eliminación de datos</h2>
      <p>
        Al terminar la relación contractual, y salvo obligación legal de conservación (por ejemplo,
        documentos contables), Aurora eliminará o anonimizará los datos personales del Negocio
        dentro de un plazo razonable, o los pondrá a disposición del Negocio para su exportación si
        así se solicita antes de la eliminación.
      </p>

      <h2>10. Contacto</h2>
      <p><strong>[correo de privacidad]</strong></p>
    </article>
  );
}