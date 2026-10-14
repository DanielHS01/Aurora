export default function PoliticaIaPage() {
  return (
    <article className="prose prose-sm prose-neutral mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-black/70 prose-li:text-black/70 prose-strong:text-black prose-table:text-sm">
      <h1 className="text-3xl font-semibold tracking-tight">
        Política de Uso de Inteligencia Artificial
      </h1>
      <p className="mt-2 text-sm text-black/40">Última actualización: [FECHA]</p>

      <p>
        Aurora ofrece a los Negocios la posibilidad de activar un agente de inteligencia
        artificial que atiende a sus clientes finales por WhatsApp, llamada telefónica y/o chat
        web, respondiendo preguntas, tomando pedidos y gestionando reservas de forma automatizada.
        Esta Política describe cómo funciona esa funcionalidad y qué deben saber tanto el Negocio
        como sus clientes finales.
      </p>

      <h2>1. Transparencia frente al cliente final</h2>
      <p>
        Cuando un cliente final interactúa con el agente de inteligencia artificial de un Negocio
        por cualquiera de los canales habilitados, se le informará, de forma razonablemente clara
        al inicio de la conversación, que está interactuando con un asistente automatizado y no
        con una persona, salvo que ya esté implícito por el contexto del canal.
      </p>

      <h2>2. Qué hace el agente de IA</h2>
      <p>Según la configuración que cada Negocio active, el agente puede:</p>
      <ul>
        <li>Responder preguntas sobre horarios de atención y disponibilidad;</li>
        <li>Tomar pedidos para llevar o a domicilio, consultando el menú real y disponibilidad del Negocio;</li>
        <li>Agendar reservas, verificando información básica necesaria (fecha, hora, número de personas);</li>
        <li>Transferir la conversación o notificar al personal del Negocio cuando no puede resolver una solicitud.</li>
      </ul>

      <h2>3. Limitaciones</h2>
      <p>
        El agente de inteligencia artificial puede cometer errores de interpretación, ofrecer
        información incompleta, o no comprender solicitudes ambiguas o fuera de su alcance
        configurado. <strong>Ni Aurora ni el Negocio garantizan que las respuestas del agente sean
        siempre exactas o completas.</strong> El Negocio es responsable de supervisar
        razonablemente la operación de su agente de IA y de corregir configuraciones que generen
        respuestas inadecuadas de forma recurrente.
      </p>

      <h2>4. Tratamiento de datos por el agente de IA</h2>
      <p>
        Las conversaciones mantenidas con el agente de IA (incluyendo mensajes de texto, y cuando
        aplique, transcripciones de llamadas de voz) se procesan a través de proveedores
        especializados de inteligencia artificial (actualmente, Anthropic) y, para el canal de
        WhatsApp, a través de 360dialog como infraestructura de mensajería. Estas conversaciones
        se almacenan para dar continuidad al servicio, generar los pedidos/reservas
        correspondientes, y permitir que el Negocio revise el historial de atención a sus
        clientes. El tratamiento de estos datos se rige por la{' '}
        <a href="/legal/privacidad">Política de Privacidad</a> y el{' '}
        <a href="/legal/dpa">Acuerdo de Procesamiento de Datos</a>.
      </p>

      <h2>5. Llamadas telefónicas automatizadas [cuando se active]</h2>
      <p>
        Cuando el Negocio active atención por llamada telefónica automatizada, las llamadas podrán
        ser grabadas y transcritas con el propósito de generar pedidos/reservas y mejorar el
        servicio. Al inicio de la llamada se informará al cliente sobre la naturaleza automatizada
        de la atención, conforme a las normas aplicables sobre grabación de comunicaciones en
        Colombia. <em>[Sección a validar legalmente antes de activar este canal — la grabación de
        llamadas tiene requisitos específicos de aviso/consentimiento bajo la legislación
        colombiana.]</em>
      </p>

      <h2>6. Decisiones que el agente de IA no toma</h2>
      <p>
        El agente de inteligencia artificial no toma decisiones que generen obligaciones legales o
        financieras más allá de las expresamente configuradas por el Negocio (como registrar un
        pedido a un precio ya definido en el menú del Negocio). El agente no está autorizado a
        negociar precios, otorgar descuentos no configurados, ni comprometer al Negocio en
        condiciones distintas a las que el propio Negocio haya parametrizado en la Plataforma.
      </p>

      <h2>7. Responsabilidad del Negocio sobre el contenido del agente</h2>
      <p>
        El Negocio es responsable de la configuración, instrucciones y tono que define para su
        agente de IA, así como de la veracidad del menú, precios y disponibilidad que el agente
        comunica a sus clientes, en los mismos términos que sería responsable si dicha información
        fuera comunicada por un empleado humano.
      </p>

      <h2>8. Derecho del cliente final a hablar con una persona</h2>
      <p>
        Los Negocios deben proveer, dentro de sus propios canales habituales de atención, una
        forma razonable de que sus clientes finales puedan comunicarse con personal humano cuando
        lo requieran, sin depender exclusivamente del agente de IA.
      </p>

      <h2>9. Cambios a esta política</h2>
      <p>
        Esta Política se actualizará a medida que se incorporen nuevas capacidades de inteligencia
        artificial a la Plataforma (por ejemplo, nuevos canales o funcionalidades).
      </p>

      <h2>10. Contacto</h2>
      <p><strong>[correo de contacto]</strong></p>
    </article>
  );
}