
export default function AuditoriasFiscalPage() {
  return (
    <article className="prose prose-sm prose-neutral mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-black/70 prose-li:text-black/70 prose-strong:text-black prose-table:text-sm">
      <h1 className="text-3xl font-semibold tracking-tight">
        Auditorías y Cumplimiento Fiscal
      </h1>
      <p className="mt-2 text-sm text-black/40">Última actualización: [FECHA]</p>
      <h2>1. Naturaleza del servicio de facturación electrónica</h2>
      <p>
        Cuando el Negocio activa la funcionalidad de facturación electrónica dentro de Aurora,
        esta opera a través de <strong>Factus</strong>, proveedor tecnológico autorizado por la
        DIAN. Aurora gestiona de forma centralizada la relación comercial y técnica con Factus,
        incluyendo la activación individual de cada Negocio bajo su propio NIT, para que los
        documentos (factura electrónica o documento equivalente POS) se emitan válidamente a
        nombre del Negocio, nunca a nombre de Aurora.
      </p>

      <h2>2. Responsabilidad tributaria</h2>
      <p>
        <strong>
          El Negocio es el único responsable de determinar si está legalmente obligado a facturar
          electrónicamente
        </strong>{' '}
        (según su condición de responsable de IVA, régimen tributario, o volumen de ingresos,
        conforme a la normativa de la DIAN vigente), de la veracidad de los datos fiscales que
        registra en la Plataforma (NIT, razón social, régimen), y del cumplimiento de sus demás
        obligaciones tributarias. Aurora actúa únicamente como proveedor de la herramienta
        tecnológica que facilita la transmisión de documentos — no como asesor tributario ni
        contable del Negocio.
      </p>

      <h2>3. Selección automática del tipo de documento</h2>
      <p>
        La Plataforma determina automáticamente, con base en el monto de cada transacción y los
        umbrales vigentes establecidos por la DIAN (actualmente, 5 UVT), si corresponde emitir un
        Documento Equivalente Electrónico POS o una Factura Electrónica de Venta completa. Esta
        determinación se basa en parámetros públicos vigentes al momento de la transacción, y el
        Negocio es responsable de verificar que dicha configuración siga siendo correcta frente a
        cambios normativos futuros.
      </p>

      <h2>4. Cupos de facturación electrónica</h2>
      <p>
        El cupo mensual/anual de documentos incluido en el plan del Negocio, y el cupo adicional
        que pueda comprar, se rigen por la{' '}
        <a href="/legal/reembolsos-cancelaciones">Política de Reembolsos y Cancelaciones</a>.
        Aurora no garantiza la emisión de documentos cuando el cupo disponible del Negocio se haya
        agotado y no se haya adquirido cupo adicional — en dicho caso, el resto de la Plataforma
        continúa operando con normalidad, pero la generación de nuevos documentos ante la DIAN
        queda temporalmente suspendida hasta que se regularice el cupo.
      </p>

      <h2>5. Disponibilidad de documentos y auditoría</h2>
      <p>
        El Negocio puede acceder, dentro de la Plataforma, al historial de documentos emitidos, su
        estado de validación ante la DIAN, y la información asociada (CUFE, enlaces públicos del
        documento). Esta información debe conservarse por el Negocio según los plazos legales de
        retención documental y contable aplicables en Colombia.
      </p>

      <h2>6. Errores en la transmisión de documentos</h2>
      <p>
        Si un documento no logra transmitirse o validarse correctamente ante la DIAN por una falla
        técnica (de Aurora, de Factus, o de la propia infraestructura de la DIAN), el Negocio será
        notificado dentro de la Plataforma, y deberá regularizar la situación conforme a sus
        obligaciones legales (por ejemplo, generando el documento correspondiente por otro medio
        si la urgencia lo requiere). Aurora hará esfuerzos razonables para resolver fallas técnicas
        de su parte dentro de los compromisos del{' '}
        <a href="/legal/sla">Acuerdo de Nivel de Servicio</a>.
      </p>

      <h2>7. Derecho de auditoría</h2>
      <p>
        Aurora podrá realizar revisiones periódicas del uso que los Negocios hacen de la
        funcionalidad de facturación electrónica, con el fin de prevenir fraude, abuso del cupo
        compartido con Factus, o incumplimientos de estos Términos. El Negocio se compromete a
        proporcionar la información razonablemente solicitada para dichas revisiones.
      </p>

      <h2>8. No asesoría fiscal</h2>
      <p>
        Nada en esta Plataforma ni en esta Política constituye asesoría contable, tributaria o
        legal. Se recomienda a todo Negocio contar con asesoría profesional propia para sus
        obligaciones fiscales.
      </p>

      <h2>9. Contacto</h2>
      <p><strong>[correo de contacto]</strong></p>
    </article>
  );
}