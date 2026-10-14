export default function ConfidencialidadPage() {
  return (
    <article className="prose prose-sm prose-neutral mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-black/70 prose-li:text-black/70 prose-strong:text-black prose-table:text-sm">
      <h1 className="text-3xl font-semibold tracking-tight">
        Acuerdo de Confidencialidad
      </h1>
      <p className="mt-2 text-sm text-black/40">Última actualización: [FECHA]</p>
      <p>
        Este Acuerdo regula el tratamiento confidencial de la información que el Negocio comparte
        con Aurora al usar la Plataforma, y que Aurora pueda conocer en el curso de la prestación
        del servicio.
      </p>

      <h2>1. Información confidencial</h2>
      <p>Se considera &quot;Información Confidencial&quot; del Negocio, entre otra:</p>
      <ul>
        <li>Datos de sus clientes, proveedores y empleados;</li>
        <li>Información financiera y de ventas registrada en la Plataforma (reportes, cierres de caja, facturación);</li>
        <li>Recetas, precios, estrategias comerciales, y demás información operativa cargada en Aurora;</li>
        <li>Credenciales de acceso y configuraciones específicas del Negocio.</li>
      </ul>

      <h2>2. Obligaciones de Aurora</h2>
      <p>Aurora se compromete a:</p>
      <ul>
        <li>No divulgar la Información Confidencial de un Negocio a terceros no autorizados, ni a otros Negocios usuarios de la Plataforma;</li>
        <li>Limitar el acceso interno a dicha información al personal que razonablemente lo requiera para prestar el servicio o brindar soporte;</li>
        <li>No usar la Información Confidencial de un Negocio para beneficio de otro Negocio competidor;</li>
        <li>Usar la Información Confidencial únicamente para los fines descritos en los <a href="/legal/terminos">Términos y Condiciones</a> y el <a href="/legal/dpa">Acuerdo de Procesamiento de Datos</a>.</li>
      </ul>

      <h2>3. Excepciones</h2>
      <p>Esta obligación de confidencialidad no aplica a información que:</p>
      <ul>
        <li>Ya sea de dominio público sin incumplimiento de este Acuerdo;</li>
        <li>Deba divulgarse por requerimiento de autoridad judicial, administrativa o tributaria competente;</li>
        <li>Corresponda a datos agregados y anonimizados, en los términos descritos en los Términos y Condiciones.</li>
      </ul>

      <h2>4. Duración</h2>
      <p>
        Las obligaciones de confidencialidad aquí descritas permanecen vigentes durante la relación
        contractual y por un periodo adicional de <strong>[2 años — a definir]</strong> tras su
        terminación.
      </p>

      <h2>5. Confidencialidad reciproca</h2>
      <p>
        El Negocio se compromete, a su vez, a no divulgar información técnica confidencial de
        Aurora a la que pueda tener acceso incidental (por ejemplo, detalles de arquitectura o
        seguridad compartidos durante soporte técnico avanzado).
      </p>

      <h2>6. Contacto</h2>
      <p><strong>[correo de contacto]</strong></p>
    </article>
  );
}