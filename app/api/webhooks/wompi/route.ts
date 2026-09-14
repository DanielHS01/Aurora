import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { markSubscriptionPaymentResult } from '@/lib/queries/subscriptionBilling'
import { verifyWompiSignature } from '@/lib/wompi/client'

export async function POST(request: Request) {
  const payload = await request.json()

  const transaction = payload?.data?.transaction
  const paymentLinkId = transaction?.payment_link_id

  if (!transaction || !paymentLinkId) {
    return NextResponse.json({ ok: true })
  }

  const isValid = verifyWompiSignature(
    payload.signature.properties,
    payload.data,
    payload.timestamp,
    payload.signature.checksum
  )

  if (!isValid) {
    console.warn('⚠️ Firma de webhook de Wompi inválida')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Wompi no permite definir nuestra propia "reference" — la que trae la
  // transacción es autogenerada por ellos. La correlación real es vía
  // payment_link_id, que guardamos nosotros mismos al crear el link
  // (ver attachPaymentLinkId en subscriptionBillingActions.ts).
  const supabase = createAdminClient()
  const { data: payment } = await supabase
    .from('subscription_payments')
    .select('id')
    .eq('wompi_payment_link_id', paymentLinkId)
    .maybeSingle()

  if (!payment) {
    console.error(`Webhook Wompi: no se encontró subscription_payments para payment_link_id=${paymentLinkId}`)
    return NextResponse.json({ ok: true })
  }

  const status =
    transaction.status === 'APPROVED'
      ? 'approved'
      : transaction.status === 'DECLINED'
      ? 'declined'
      : 'error'

  await markSubscriptionPaymentResult(payment.id, transaction.id, status)

  return NextResponse.json({ ok: true })
}