

export default function PrivacidadPage() {
  return (
    <>
    <h1 className="text-3xl font-semibold tracking-tight">
        Política de Privacidad y Tratamiento de Datos Personales
      </h1>
      <p className="mt-2 text-sm text-black/40">Última actualización: [FECHA]</p>
    
    <article className="prose prose-sm prose-neutral mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-black/70 prose-li:text-black/70 prose-strong:text-black prose-table:text-sm">
      <p>
        Esta Política describe cómo <strong>[RAZÓN SOCIAL]</strong>, NIT <strong>[NIT]</strong> (en
        adelante, &quot;Aurora&quot;, &quot;nosotros&quot;), recolecta, usa, almacena y protege los
        datos personales, de conformidad con la <strong>Ley Estatutaria 1581 de 2012</strong>, el{' '}
        <strong>Decreto 1377 de 2013</strong> (compilado en el Decreto Único Reglamentario 1074 de
        2015), y demás normas concordantes, bajo la supervisión de la{' '}
        <strong>Superintendencia de Industria y Comercio (SIC)</strong>.
      </p>

      <h2>1. Responsable y Encargado del Tratamiento</h2>
      <p>Según el rol que ocupe en cada caso:</p>
      <ul>
        <li>
          <strong>Aurora actúa como Responsable del Tratamiento</strong> respecto de los datos
          personales de los dueños y empleados de los Negocios que usan la Plataforma (nombre,
          correo, teléfono, credenciales de acceso) — los datos de quienes directamente contratan
          y usan Aurora.
        </li>
        <li>
          <strong>Aurora actúa como Encargado del Tratamiento</strong> respecto de los datos
          personales de los clientes finales de cada Negocio (por ejemplo, el nombre y teléfono de
          un comensal que reserva mesa, o de un cliente que habla con el agente de IA por
          WhatsApp) — cada Negocio es el Responsable de esos datos, y Aurora los trata únicamente
          siguiendo sus instrucciones, en los términos del Acuerdo de Procesamiento de Datos.
        </li>
      </ul>

      <h2>2. Datos que recolectamos</h2>
      <h3>2.1. Datos del Negocio y sus usuarios</h3>
      <p>
        Nombre completo, correo electrónico, número de teléfono, cargo/rol dentro del Negocio,
        información del negocio (nombre comercial, NIT, tipo de negocio, dirección), credenciales
        de acceso (contraseña almacenada de forma cifrada), y registros de uso de la Plataforma.
      </p>
      <h3>2.2. Datos de clientes finales de cada Negocio</h3>
      <p>
        Nombre, número de teléfono (especialmente cuando interactúan vía WhatsApp con el agente de
        IA), historial de pedidos o reservas, y contenido de las conversaciones mantenidas con el
        agente de inteligencia artificial.
      </p>
      <h3>2.3. Datos de pago</h3>
      <p>
        Aurora no almacena directamente números completos de tarjetas de crédito/débito. Estos son
        procesados por <strong>Wompi</strong>, nuestra pasarela de pagos autorizada, bajo sus
        propios estándares de seguridad (PCI-DSS). Cuando el Negocio activa el cobro automático de
        su membresía, Aurora almacena únicamente un token de pago y los últimos cuatro dígitos,
        con fines de identificación visual.
      </p>
      <h3>2.4. Datos técnicos</h3>
      <p>
        Dirección IP, tipo de navegador/dispositivo, registros de actividad (logs) con fines de
        seguridad, soporte técnico y mejora del servicio.
      </p>

      <h2>3. Finalidades del tratamiento</h2>
      <p>Los datos personales se tratan para:</p>
      <ul>
        <li>Crear y administrar la cuenta del Negocio y permitir el uso de la Plataforma;</li>
        <li>
          Procesar pagos de la membresía y, cuando aplica, generar documentos de facturación
          electrónica ante la DIAN;
        </li>
        <li>
          Permitir que el agente de inteligencia artificial del Negocio atienda a sus clientes
          finales por WhatsApp, llamada telefónica o chat web, según lo configure cada Negocio;
        </li>
        <li>
          Enviar comunicaciones operativas (confirmaciones, avisos de mantenimiento, avisos de
          facturación, notificaciones de la Plataforma);
        </li>
        <li>Brindar soporte técnico;</li>
        <li>
          Cumplir obligaciones legales y regulatorias, incluidas las relacionadas con facturación
          electrónica y prevención de fraude;
        </li>
        <li>
          Generar estadísticas agregadas y anonimizadas para mejorar el producto — estas nunca
          identifican a una persona natural específica;
        </li>
        <li>
          Con autorización previa y expresa, enviar comunicaciones comerciales sobre nuevas
          funcionalidades de Aurora.
        </li>
      </ul>

      <h2>4. Base legal y autorización</h2>
      <p>
        El tratamiento se fundamenta en la autorización previa, expresa e informada del Titular,
        otorgada al momento del registro mediante la aceptación de esta Política. Aurora no está
        dirigida a menores de edad como usuarios registrados.
      </p>

      <h2>5. A quién compartimos los datos</h2>
      <p>
        Para poder prestar el servicio, Aurora comparte datos con los siguientes terceros,
        actuando estos como Encargados del Tratamiento o proveedores de infraestructura:
      </p>
      <table>
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Propósito</th>
            <th>Ubicación</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase</td>
            <td>Base de datos y autenticación</td>
            <td>Infraestructura en la nube (fuera de Colombia)</td>
          </tr>
          <tr>
            <td>Vercel</td>
            <td>Hospedaje de la aplicación</td>
            <td>Infraestructura en la nube (fuera de Colombia)</td>
          </tr>
          <tr>
            <td>Cloudinary</td>
            <td>Almacenamiento y optimización de imágenes</td>
            <td>Infraestructura en la nube (fuera de Colombia)</td>
          </tr>
          <tr>
            <td>Wompi</td>
            <td>Procesamiento de pagos</td>
            <td>Colombia</td>
          </tr>
          <tr>
            <td>Factus</td>
            <td>Transmisión de documentos electrónicos a la DIAN</td>
            <td>Colombia</td>
          </tr>
          <tr>
            <td>360dialog</td>
            <td>Infraestructura de mensajería WhatsApp Business</td>
            <td>Infraestructura en la nube</td>
          </tr>
          <tr>
            <td>Anthropic</td>
            <td>Procesamiento de lenguaje natural para los agentes de IA</td>
            <td>Infraestructura en la nube (fuera de Colombia)</td>
          </tr>
          <tr>
            <td>[Proveedor de voz, cuando se active]</td>
            <td>Atención telefónica automatizada</td>
            <td>Infraestructura en la nube (fuera de Colombia)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Todos estos proveedores están sujetos a obligaciones contractuales de confidencialidad y
        seguridad, y solo tratan los datos para los fines estrictamente necesarios para prestar su
        servicio a Aurora.
      </p>

      <h2>6. Transferencia internacional de datos</h2>
      <p>
        Algunos de los proveedores listados procesan información en servidores fuera de Colombia.
        De conformidad con el artículo 26 de la Ley 1581 de 2012, estas transferencias se realizan
        únicamente hacia países o entidades que ofrezcan niveles adecuados de protección de datos,
        o mediante cláusulas contractuales que garanticen dicha protección, siempre en el marco de
        la ejecución del servicio contratado por el Titular.{' '}
        <em>
          [Esta sección requiere validación legal específica antes de publicación.]
        </em>
      </p>

      <h2>7. Derechos del Titular (Habeas Data)</h2>
      <p>Conforme a la Ley 1581 de 2012, todo Titular de datos personales tiene derecho a:</p>
      <ul>
        <li>Conocer, actualizar y rectificar sus datos personales;</li>
        <li>Solicitar prueba de la autorización otorgada para el tratamiento;</li>
        <li>Ser informado sobre el uso que se le ha dado a sus datos;</li>
        <li>Presentar quejas ante la SIC por infracciones a la ley;</li>
        <li>
          Revocar la autorización y/o solicitar la supresión de sus datos, cuando no exista un
          deber legal o contractual que lo impida;
        </li>
        <li>Acceder gratuitamente a sus datos personales que hayan sido objeto de tratamiento.</li>
      </ul>
      <p>
        Para ejercer estos derechos, escriba a <strong>[correo de privacidad]</strong>. Responderemos
        dentro de los plazos establecidos por la ley (15 días hábiles para consultas, 2 días
        hábiles para quejas, con posibilidad de prórroga).
      </p>

      <h2>8. Conservación de los datos</h2>
      <p>
        Los datos personales se conservarán mientras exista una relación contractual activa con el
        Negocio, y posteriormente durante los plazos exigidos por la normativa aplicable (por
        ejemplo, documentos contables y tributarios), o hasta que el Titular ejerza su derecho de
        supresión cuando legalmente proceda.
      </p>

      <h2>9. Seguridad de la información</h2>
      <p>
        Aurora implementa medidas técnicas, humanas y administrativas razonables para proteger los
        datos personales, incluyendo cifrado de contraseñas y credenciales sensibles, control de
        acceso basado en roles, y separación de datos entre distintos Negocios mediante controles
        de seguridad a nivel de base de datos.
      </p>

      <h2>10. Registro Nacional de Bases de Datos (RNBD)</h2>
      <p>
        Conforme al Decreto 90 de 2018, están obligadas a inscribir sus bases de datos ante el
        RNBD de la SIC las personas jurídicas con más de 100.000 UVT en activos totales.{' '}
        <em>
          [El Proveedor debe verificar con su asesor legal/contable si se encuentra obligado a
          este registro a la fecha de lanzamiento.]
        </em>
      </p>

      <h2>11. Uso de cookies</h2>
      <p>
        El uso de cookies y tecnologías similares se describe en detalle en nuestra{' '}
        <a href="/legal/cookies">Política de Cookies</a>.
      </p>

      <h2>12. Cambios a esta política</h2>
      <p>
        Esta Política podrá actualizarse de tiempo en tiempo. Los cambios sustanciales se
        notificarán a través de la Plataforma o por correo electrónico, con antelación razonable.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Para preguntas sobre esta Política o el tratamiento de sus datos personales:{' '}
        <strong>[correo de contacto]</strong>.
      </p>
      </article>
    </>
  );
}