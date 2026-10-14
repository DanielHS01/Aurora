export default function CookiesPage() {
  return (
    <article className="prose prose-sm prose-neutral mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-black/70 prose-li:text-black/70 prose-strong:text-black prose-table:text-sm">
      <h1 className="text-3xl font-semibold tracking-tight">
        Política de Cookies
      </h1>
      <p className="mt-2 text-sm text-black/40">Última actualización: [FECHA]</p>
      <h2>1. Qué son las cookies</h2>
      <p>
        Las cookies son pequeños archivos de texto que se almacenan en su navegador o dispositivo
        cuando visita la Plataforma Aurora. Permiten que el sitio recuerde información sobre su
        visita, lo que facilita su próxima visita y hace que el sitio sea más útil.
      </p>

      <h2>2. Tipos de cookies que usamos</h2>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Propósito</th>
            <th>¿Se puede desactivar?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Estrictamente necesarias</td>
            <td>
              Mantener la sesión iniciada, recordar su autenticación, seguridad del sitio
            </td>
            <td>No — indispensables para el funcionamiento básico</td>
          </tr>
          <tr>
            <td>Funcionales</td>
            <td>Recordar preferencias (ej. tema visual, última pestaña usada)</td>
            <td>Sí, aunque puede afectar la experiencia</td>
          </tr>
          <tr>
            <td>Analíticas [si se implementan]</td>
            <td>Entender cómo se usa la Plataforma para mejorarla</td>
            <td>Sí</td>
          </tr>
        </tbody>
      </table>
      <p>
        A la fecha de este documento, Aurora <strong>no utiliza cookies de publicidad ni de
        seguimiento de terceros con fines de mercadeo</strong>. Si en el futuro se incorporan
        herramientas de analítica o mercadeo que usen cookies, esta política se actualizará y se
        solicitará el consentimiento correspondiente antes de activarlas.
      </p>

      <h2>3. Cookies de terceros</h2>
      <p>
        Algunos proveedores que usamos para operar la Plataforma (por ejemplo, Wompi durante el
        proceso de pago) pueden establecer sus propias cookies cuando usted interactúa con sus
        servicios integrados en Aurora. Estas cookies se rigen por las políticas de privacidad de
        dichos terceros.
      </p>

      <h2>4. Cómo gestionar las cookies</h2>
      <p>
        Usted puede configurar su navegador para bloquear o eliminar cookies. Tenga en cuenta que
        deshabilitar las cookies estrictamente necesarias puede impedir el funcionamiento correcto
        de la Plataforma (por ejemplo, no podrá mantener su sesión iniciada).
      </p>

      <h2>5. Cambios a esta política</h2>
      <p>
        Esta Política de Cookies podrá actualizarse. Los cambios relevantes se notificarán a
        través de la Plataforma.
      </p>

      <h2>6. Contacto</h2>
      <p><strong>[correo de contacto]</strong></p>
    </article>
  );
}