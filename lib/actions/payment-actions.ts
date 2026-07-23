'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import {
  recordPayment,
  updatePaymentStatus,
  createInvoiceFromOrder,
  updateInvoiceStatus,
} from '@/lib/queries/payments'
import type { PaymentMethod, PaymentStatus } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function recordPaymentAction(businessId: string, formData: FormData) {
  await requireBusinessAccess(businessId)

  const orderId = formData.get('orderId') as string
  const amount = Number(formData.get('amount'))
  const method = formData.get('method') as PaymentMethod
  const provider = (formData.get('provider') as string)?.trim() || undefined
  const providerReference = (formData.get('providerReference') as string)?.trim() || undefined

  if (isNaN(amount) || amount <= 0) {
    throw new Error('El monto debe ser un número mayor a 0')
  }
  if (!method) {
    throw new Error('El método de pago es obligatorio')
  }

  const paymentId = await recordPayment(businessId, orderId, amount, method, {
    provider,
    providerReference,
  })

  revalidatePath(`/orders/${orderId}`)
  return paymentId
}

export async function updatePaymentStatusAction(
  paymentId: string,
  orderId: string,
  businessId: string,
  status: PaymentStatus
) {
  await requireBusinessAccess(businessId)
  await updatePaymentStatus(paymentId, orderId, status)
  revalidatePath(`/orders/${orderId}`)
}

export async function createInvoiceFromOrderAction(orderId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  const invoice = await createInvoiceFromOrder(orderId)
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/invoices')
  return invoice
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  businessId: string,
  status: string,
  pdfUrl?: string
) {
  await requireBusinessAccess(businessId)
  await updateInvoiceStatus(invoiceId, status, pdfUrl)
  revalidatePath('/invoices')
}