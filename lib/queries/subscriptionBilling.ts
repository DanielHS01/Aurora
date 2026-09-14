import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptCredentials } from '@/lib/utils/encryption'

export async function getSubscriptionWithPlan(businessId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('subscriptions')
    .select('*, plan:plans!subscriptions_plan_id_fkey(*), pending_plan:plans!subscriptions_pending_plan_id_fkey(*)')
    .eq('business_id', businessId)
    .maybeSingle()

  if (!data) return null

  const daysLeft = data.current_period_end
    ? Math.ceil((new Date(data.current_period_end).getTime() - Date.now()) / 86400000)
    : null

  // Se puede pagar desde el último día del periodo actual en
  // adelante — SIN tope superior, siempre se debe poder pagar aunque
  // esté muy atrasado (si no, jamás podría desbloquearse).
  const periodEndMs = data.current_period_end ? new Date(data.current_period_end).getTime() : null
  const canPayNow = periodEndMs ? Date.now() >= periodEndMs - 24 * 60 * 60 * 1000 : true

  return { ...data, daysLeft, canPayNow }
}

export function calculateAmountDue(
  plan: { price_monthly: number | null; price_annual: number | null },
  billingPeriod: 'monthly' | 'annual'
): number {
  const price = billingPeriod === 'annual' ? plan.price_annual : plan.price_monthly
  if (price === null) {
    throw new Error('El plan no tiene un precio configurado para este periodo')
  }
  return price
}

export async function createPendingSubscriptionPayment(
  businessId: string,
  subscriptionId: string,
  planId: string,
  amount: number,
  billingPeriod: string,
  paymentMode: string
): Promise<string> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('subscription_payments')
    .insert({
      business_id: businessId,
      subscription_id: subscriptionId,
      plan_id: planId,
      amount,
      billing_period: billingPeriod,
      payment_mode: paymentMode,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Error creando intento de pago: ${error?.message}`)
  return data.id
}

/**
 * Confirma un pago y, SOLO en ese momento, aplica el cambio de plan
 * (si lo había) y avanza el corte — nunca antes de la confirmación
 * real del webhook. El nuevo periodo siempre arranca exactamente
 * donde terminaba el anterior (corte fijo), sin importar qué día
 * dentro de la ventana permitida se haya pagado realmente.
 */
export async function markSubscriptionPaymentResult(
  subscriptionPaymentId: string,
  wompiTransactionId: string,
  status: 'approved' | 'declined' | 'error'
): Promise<{ businessId: string; subscriptionId: string; billingPeriod: string } | null> {
  const supabase = createAdminClient()

  const { data: payment } = await supabase
    .from('subscription_payments')
    .update({
      wompi_transaction_id: wompiTransactionId,
      status,
      paid_at: status === 'approved' ? new Date().toISOString() : null,
    })
    .eq('id', subscriptionPaymentId)
    .select('business_id, subscription_id, billing_period, plan_id')
    .single()

  if (!payment) {
    console.error(`⚠️ No se encontró subscription_payment con id: ${subscriptionPaymentId}`)
    return null
  }

  if (status === 'approved') {
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('current_period_end')
      .eq('id', payment.subscription_id)
      .single()

    const periodMs =
      payment.billing_period === 'annual' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000

    // Corte fijo: el nuevo periodo arranca donde terminaba el
    // anterior — NUNCA desde "ahora". Si nunca hubo un periodo previo
    // (primera vez), arranca desde ahora, único caso donde sí aplica.
    const previousEnd = currentSub?.current_period_end
      ? new Date(currentSub.current_period_end).getTime()
      : Date.now()

    const newPeriodEnd = new Date(previousEnd + periodMs).toISOString()

    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        plan_id: payment.plan_id, // el cambio de plan se aplica AQUÍ, no antes
        billing_period: payment.billing_period,
        pending_plan_id: null,
        pending_billing_period: null,
        current_period_start: new Date(previousEnd).toISOString(),
        current_period_end: newPeriodEnd,
      })
      .eq('id', payment.subscription_id)
  } else {
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('id', payment.subscription_id)
  }

  return {
    businessId: payment.business_id,
    subscriptionId: payment.subscription_id,
    billingPeriod: payment.billing_period,
  }
}

/**
 * Programa un cambio de plan sin cobrar nada — solo válido para
 * "reservar" qué plan aplicará en el próximo corte. No mueve ninguna
 * fecha ni cobra hasta que se pague dentro de la ventana permitida.
 */
export async function schedulePlanChange(
  subscriptionId: string,
  planId: string,
  billingPeriod: 'monthly' | 'annual'
): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('subscriptions')
    .update({ pending_plan_id: planId, pending_billing_period: billingPeriod })
    .eq('id', subscriptionId)
}

export async function cancelPendingPlanChange(subscriptionId: string): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('subscriptions')
    .update({ pending_plan_id: null, pending_billing_period: null })
    .eq('id', subscriptionId)
}

export async function attachPaymentLinkId(
  subscriptionPaymentId: string,
  wompiPaymentLinkId: string
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('subscription_payments')
    .update({ wompi_payment_link_id: wompiPaymentLinkId })
    .eq('id', subscriptionPaymentId)

  if (error) {
    console.error(
      `attachPaymentLinkId: no se pudo asociar el link ${wompiPaymentLinkId} al pago ${subscriptionPaymentId}`,
      error.message
    )
  }
}

export async function saveCardToken(
  subscriptionId: string,
  cardToken: string,
  lastFour: string
): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('subscriptions')
    .update({
      payment_mode: 'automatic',
      card_token_encrypted: encryptCredentials({ token: cardToken }),
      card_last_four: lastFour,
    })
    .eq('id', subscriptionId)
}

export async function disableAutomaticPayment(subscriptionId: string): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('subscriptions')
    .update({ payment_mode: 'manual', card_token_encrypted: null, card_last_four: null })
    .eq('id', subscriptionId)
}

export async function getSubscriptionsDueForAutoCharge() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('subscriptions')
    .select(
      '*, plan:plans!subscriptions_plan_id_fkey(*), pending_plan:plans!subscriptions_pending_plan_id_fkey(*), business:businesses(id, name, email)'
    )
    .eq('payment_mode', 'automatic')
    .not('card_token_encrypted', 'is', null)
    .lte('current_period_end', new Date().toISOString())
    .in('status', ['active', 'past_due'])

  return data ?? []
}

export async function getPlansForBusinessType(businessType: string | null) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('plans')
    .select('*')
    .or(`business_type.eq.${businessType},business_type.is.null`)
    .not('name', 'eq', 'Prueba gratuita') // no se muestra como "elegible" en el catálogo de pago
    .order('price_monthly', { ascending: true })

  return data ?? []
}