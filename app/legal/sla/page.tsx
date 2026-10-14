

export default function SlaPage() {
  return (
    <>
    <h1 className="text-3xl font-semibold tracking-tight">
        Acuerdo de Nivel de Servicio (SLA)
      </h1>
      <p className="mt-2 text-sm text-black/40">Última actualización: [FECHA]</p>
    <article className="prose prose-sm prose-neutral mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-black/70 prose-li:text-black/70 prose-strong:text-black prose-table:text-sm">
      <p>
        Este Acuerdo de Nivel de Servicio (&quot;SLA&quot;) describe los compromisos de
        disponibilidad y soporte que Aurora ofrece a los Negocios con planes de pago activos. Este
        SLA se incorpora por referencia a los{' '}
        <a href="/legal/terminos">Términos y Condiciones</a>.
      </p>

      <h2>1. Disponibilidad objetivo</h2>
      <p>
        Aurora se compromete a mantener una disponibilidad mensual objetivo del{' '}
        <strong>[99% / 99.5% — a definir]</strong> de la Plataforma, excluyendo:
      </p>
      <ul>
        <li>
          Mantenimientos programados, notificados con anticipación razonable a través del aviso
          correspondiente dentro de la Plataforma;
        </li>
        <li>Causas de fuerza mayor o caso fortuito;</li>
        <li>
          Fallas de proveedores de infraestructura de terceros (Supabase, Vercel) fuera del
          control razonable de Aurora;
        </li>
        <li>
          Fallas atribuibles a la conexión a internet del Negocio o a su propio
          hardware/dispositivos;
        </li>
        <li>
          Fallas de proveedores externos integrados (Wompi, Factus, 360dialog, proveedores de IA)
          que Aurora no controla directamente.
        </li>
      </ul>

      <h2>2. Mantenimientos programados</h2>
      <p>
        Aurora podrá realizar mantenimientos programados, los cuales se anunciarán dentro de la
        Plataforma con la fecha, hora estimada y duración esperada, con la mayor anticipación
        razonable posible. Durante estas ventanas, el acceso general a la Plataforma puede
        restringirse temporalmente para usuarios distintos al personal autorizado de Aurora.
      </p>

      <h2>3. Soporte técnico</h2>
      <table>
        <thead>
          <tr>
            <th>Nivel de severidad</th>
            <th>Descripción</th>
            <th>Tiempo de primera respuesta objetivo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Crítico</td>
            <td>Caída total del servicio, imposibilidad de cobrar o tomar pedidos</td>
            <td>[ej. 2 horas hábiles]</td>
          </tr>
          <tr>
            <td>Alto</td>
            <td>Funcionalidad importante no disponible (ej. facturación, cocina)</td>
            <td>[ej. 4 horas hábiles]</td>
          </tr>
          <tr>
            <td>Medio</td>
            <td>Error que afecta una función específica sin bloquear la operación</td>
            <td>[ej. 1 día hábil]</td>
          </tr>
          <tr>
            <td>Bajo</td>
            <td>Consultas generales, solicitudes de mejora</td>
            <td>[ej. 2 días hábiles]</td>
          </tr>
        </tbody>
      </table>
      <p>
        Los canales de soporte disponibles y el horario de atención se publicarán dentro de la
        Plataforma y podrán actualizarse de tiempo en tiempo.
      </p>

      <h2>4. Respaldo de datos</h2>
      <p>
        Aurora realiza copias de respaldo periódicas de la información almacenada, con una
        frecuencia y retención que se definirán según la infraestructura utilizada (Supabase).
        Esto no exime al Negocio de mantener sus propios respaldos de información crítica cuando
        lo considere necesario.
      </p>

      <h2>5. Créditos por incumplimiento</h2>
      <p>
        <em>
          [Si Aurora decide ofrecer créditos de servicio por incumplimiento del SLA, definir aquí
          el mecanismo. Sección opcional, pendiente de decisión comercial.]
        </em>
      </p>

      <h2>6. Exclusiones</h2>
      <p>
        Este SLA no aplica durante el periodo de prueba gratuita de 14 días, ni a Negocios en mora
        más allá del periodo de gracia aplicable.
      </p>

      <h2>7. Cambios a este SLA</h2>
      <p>
        Aurora podrá ajustar los compromisos de este SLA con aviso razonable a los Negocios
        activos, especialmente a medida que la infraestructura y el volumen de la Plataforma
        evolucionen.
      </p>

      <h2>8. Contacto</h2>
      <p><strong>[correo de soporte]</strong></p>
      </article>
    </>
  );
}