
export default function ReembolsosPage() {
  return (
    <>
    <h1 className="text-3xl font-semibold tracking-tight">
        Política de Reembolsos y Cancelaciones
      </h1>
      <p className="mt-2 text-sm text-black/40">Última actualización: [FECHA]</p>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        ⚠️ Documento en revisión legal — puede actualizarse antes del lanzamiento oficial.
      </div>
    
    <article className="prose prose-sm prose-neutral mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-black/70 prose-li:text-black/70 prose-strong:text-black prose-table:text-sm">
      <h2>1. Periodo de prueba gratuita</h2>
      <p>
        Todo Negocio nuevo accede a 14 días calendario de prueba gratuita, sin necesidad de
        registrar tarjeta ni medio de pago alguno. Al finalizar este periodo, si el Negocio no ha
        activado un plan de pago, el acceso a la Plataforma se bloquea inmediatamente al finalizar
        el último día — sin periodo de gracia adicional para el trial.
      </p>

      <h2>2. Modalidades de pago</h2>
      <p>
        El Negocio puede elegir entre pago <strong>manual</strong> (genera un enlace de pago cada
        periodo, que debe confirmar activamente) o pago <strong>automático</strong> (tarjeta
        guardada de forma segura a través de Wompi, cobrada automáticamente al vencer cada
        periodo). El Negocio puede cambiar entre estas modalidades en cualquier momento desde su
        cuenta.
      </p>

      <h2>3. Periodicidad y fecha de corte</h2>
      <p>
        El Negocio puede elegir facturación mensual o anual. La fecha de corte de cada periodo es{' '}
        <strong>fija</strong> desde el primer pago exitoso y no se adelanta ni se retrasa por
        pagos realizados antes o después de dicha fecha (dentro de los límites de la ventana de
        pago permitida y del periodo de gracia).
      </p>

      <h2>4. Cambios de plan</h2>
      <p>
        Un cambio de plan (mejora o reducción de plan) programado por el Negocio en mitad de un
        periodo ya pagado <strong>no se aplica de inmediato</strong> — el Negocio conserva las
        características de su plan actual hasta el siguiente corte, momento en el cual, si el
        cambio fue confirmado y pagado, se activa el nuevo plan.
      </p>

      <h2>5. Mora y periodo de gracia</h2>
      <p>
        Si un Negocio con un plan de pago ya activo no renueva al vencer su periodo, dispone de un{' '}
        <strong>periodo de gracia de 3 días calendario</strong> desde la fecha de corte para
        regularizar el pago, durante el cual conserva acceso completo a la Plataforma. Vencido
        este plazo sin pago, el acceso se bloquea hasta que se regularice la situación — el
        bloqueo afecta la operación general de la Plataforma, pero nunca borra la información
        histórica del Negocio.
      </p>

      <h2>6. Política de reembolsos</h2>
      <p>
        Dada la naturaleza del servicio (acceso digital continuo, sin consumo de inventario
        físico), los pagos de membresía <strong>no son reembolsables</strong> una vez procesados,
        salvo:
      </p>
      <ul>
        <li>
          Error comprobado de cobro (cobro duplicado, cobro por un monto distinto al pactado, cobro
          posterior a una cancelación ya efectiva);
        </li>
        <li>
          Indisponibilidad prolongada de la Plataforma atribuible a Aurora, que exceda
          sustancialmente los compromisos del{' '}
          <a href="/legal/sla">Acuerdo de Nivel de Servicio</a>, evaluada caso por caso;
        </li>
        <li>Los demás casos que la ley colombiana establezca como irrenunciables para el consumidor, conforme a la Ley 1480 de 2011.</li>
      </ul>
      <p>
        Las solicitudes de reembolso deben enviarse a <strong>[correo de soporte]</strong> dentro
        de los 10 días calendario siguientes al cobro en disputa, indicando el motivo.
      </p>

      <h2>7. Cupo adicional de facturación electrónica</h2>
      <p>
        El cupo de facturas electrónicas incluido en el plan del Negocio se renueva cada periodo y{' '}
        <strong>no se acumula</strong> si no se usa completamente. El cupo adicional comprado por
        separado <strong>sí tiene vigencia extendida</strong> (no vence a fin de mes) y se consume
        únicamente después de agotado el cupo incluido en el plan. Los pagos de cupo adicional
        siguen las mismas reglas generales de no reembolso descritas en la sección 6.
      </p>

      <h2>8. Cancelación por el Negocio</h2>
      <p>
        El Negocio puede cancelar su suscripción en cualquier momento desde su cuenta. La
        cancelación detiene la renovación futura, pero no genera reembolso proporcional del
        periodo ya pagado y en curso — el Negocio conserva acceso hasta el final de dicho periodo.
      </p>

      <h2>9. Cancelación o suspensión por Aurora</h2>
      <p>
        Aurora podrá suspender o cancelar una cuenta por incumplimiento de los{' '}
        <a href="/legal/terminos">Términos y Condiciones</a>, sin que ello genere derecho a
        reembolso de los periodos ya pagados.
      </p>

      <h2>10. Cambios a esta política</h2>
      <p>
        Esta Política podrá actualizarse con aviso razonable a los Negocios con plan activo.
      </p>

      <h2>11. Contacto</h2>
      <p><strong>[correo de soporte]</strong></p>
      </article>
    </>
  );
}