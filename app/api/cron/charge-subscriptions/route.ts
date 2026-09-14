import { NextResponse } from 'next/server'
import {
  getSubscriptionsDueForAutoCharge,
  calculateAmountDue,
  createPendingSubscriptionPayment,
  markSubscriptionPaymentResult,
} from '@/lib/queries/subscriptionBilling'
import { chargeWithSavedToken } from '@/lib/wompi/client'
import { decryptCredentials } from '@/lib/utils/encryption'
import { createNotification } from '@/lib/queries/notifications'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const dueSubscriptions = await getSubscriptionsDueForAutoCharge()
  let charged = 0
  let failed = 0
  let skipped = 0

  for (const sub of dueSubscriptions) {
    // Una suscripción sin plan asignado no tiene precio que cobrar — no es
    // un error de red/pasarela (eso cuenta como "failed"), es un dato
    // inconsistente que hay que resolver a mano, así que lo separamos
    // como "skipped" y avisamos, en vez de dejar que el tipo `null` se
    // cuele silenciosamente a calculateAmountDue.
    //
    // Si hay un cambio de plan programado (pending_plan), este es
    // exactamente el momento en que debe tomar efecto — el cron solo
    // selecciona suscripciones que ya llegaron a su corte, así que no
    // tiene sentido seguir cobrando el plan viejo si hay uno esperando.
    const effectivePlan = sub.pending_plan ?? sub.plan
    const effectiveBillingPeriod = (sub.pending_billing_period ?? sub.billing_period) as
      | 'monthly'
      | 'annual'

    if (!effectivePlan) {
      skipped++
      console.error(`Suscripción ${sub.id} (negocio ${sub.business_id}) sin plan asignado — se omite el cobro.`)
      await createNotification(
        sub.business_id,
        '⚠️ No se pudo procesar tu membresía',
        'Tu suscripción no tiene un plan asignado. Contacta a soporte.'
      )
      continue
    }

    try {
      const amount = calculateAmountDue(effectivePlan, effectiveBillingPeriod)
      const paymentId = await createPendingSubscriptionPayment(
        sub.business_id,
        sub.id,
        effectivePlan.id,
        amount,
        effectiveBillingPeriod,
        'automatic'
      )

      const { token } = decryptCredentials(sub.card_token_encrypted!) as { token: string }

      const result = await chargeWithSavedToken({
        amountInCents: Math.round(amount * 100),
        reference: paymentId,
        cardToken: token,
        customerEmail: sub.business.email ?? '',
      })

      const status = result.status === 'APPROVED' ? 'approved' : 'declined'
      await markSubscriptionPaymentResult(paymentId, result.wompiId, status)

      if (status === 'approved') {
        charged++
      } else {
        failed++
        await createNotification(
          sub.business_id,
          '⚠️ No se pudo renovar tu membresía',
          'El cobro automático fue rechazado. Por favor actualiza tu método de pago.'
        )
      }
    } catch (err) {
      failed++
      console.error(`Error cobrando suscripción ${sub.id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, charged, failed, skipped })
}