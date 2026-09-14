'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserBusiness } from '@/lib/queries/businesses'
import { getCurrentUserRole } from '@/lib/queries/business-users'
import {
  getSubscriptionWithPlan,
  calculateAmountDue,
  createPendingSubscriptionPayment,
  schedulePlanChange,
  cancelPendingPlanChange,
} from '@/lib/queries/subscriptionBilling'
import { createSubscriptionPaymentLink } from '@/lib/wompi/client'
import { attachPaymentLinkId } from '@/lib/queries/subscriptionBilling'
import type { BusinessRole } from '@/lib/types'

const ROLES_THAT_CAN_MANAGE_BILLING: BusinessRole[] = ['owner']

async function requireBillingAccess() {
  const business = await getCurrentUserBusiness()
  if (!business) throw new Error('No se encontró tu negocio')
  if (business.is_internal) throw new Error('Esta es una cuenta interna, no requiere pago')

  const role = await getCurrentUserRole(business.id)
  if (!role || !ROLES_THAT_CAN_MANAGE_BILLING.includes(role)) {
    throw new Error('Solo el dueño puede gestionar la facturación')
  }

  return business
}

/**
 * Paga (renovando el plan actual, o cambiando a uno nuevo si se
 * indica) — solo permitido dentro de la ventana de pago. El cambio de
 * plan real ocurre después, cuando el webhook confirma el pago, no
 * aquí de inmediato.
 */
export async function initiateManualPaymentAction(billingPeriod: 'monthly' | 'annual', planId: string) {
  const business = await requireBillingAccess()

  const subscription = await getSubscriptionWithPlan(business.id)
  if (!subscription) throw new Error('No tienes suscripción activa')

  // Defensa en servidor — no confiar solo en que el botón esté
  // deshabilitado del lado del cliente.
  if (!subscription.canPayNow) {
    throw new Error('Aún no puedes pagar — se habilita desde el último día de tu periodo actual')
  }

  const supabase = await createClient()
  const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single()
  if (!plan) throw new Error('Plan no encontrado')

  const amount = calculateAmountDue(plan, billingPeriod)

  const subscriptionPaymentId = await createPendingSubscriptionPayment(
    business.id,
    subscription.id,
    planId,
    amount,
    billingPeriod,
    'manual'
  )

  const { paymentLinkUrl, wompiId } = await createSubscriptionPaymentLink({
    amountInCents: Math.round(amount * 100),
    reference: subscriptionPaymentId,
    redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/account?payment=pending`,
  })

  await attachPaymentLinkId(subscriptionPaymentId, wompiId)

  return { paymentLinkUrl }
}

/**
 * Reserva un plan distinto para aplicarse en el próximo corte —
 * gratis, no cobra nada, solo cambia una preferencia.
 */
export async function schedulePlanChangeAction(planId: string, billingPeriod: 'monthly' | 'annual') {
  const business = await requireBillingAccess()

  const subscription = await getSubscriptionWithPlan(business.id)
  if (!subscription) throw new Error('No tienes suscripción activa')

  await schedulePlanChange(subscription.id, planId, billingPeriod)
  revalidatePath('/dashboard/account')
}

export async function cancelPendingPlanChangeAction() {
  const business = await requireBillingAccess()

  const subscription = await getSubscriptionWithPlan(business.id)
  if (!subscription) throw new Error('No tienes suscripción activa')

  await cancelPendingPlanChange(subscription.id)
  revalidatePath('/dashboard/account')
}