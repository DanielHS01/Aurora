'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import {
  recordPayment,
  updatePaymentStatus,
  createInvoiceFromOrder,
  updateInvoiceStatus,
  getInvoiceById,
} from '@/lib/queries/payments'
import type { PaymentMethod, PaymentStatus } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { updateOrderStatus } from '@/lib/queries/orders'
import { updateTableStatus } from '@/lib/queries/tables'
import type { InvoiceWithItems } from '@/lib/queries/payments'
import { getKitchenTicketByOrderId, updateKitchenTicketStatus } from '@/lib/queries/kitchen'


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
  revalidatePath(`/dashboard/orders/${orderId}`)
revalidatePath('/dashboard/tables')
}

export async function createInvoiceFromOrderAction(orderId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  const invoice = await createInvoiceFromOrder(orderId)
  revalidatePath(`/dashboard/orders/${orderId}`)
revalidatePath('/dashboard/invoices')
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
  revalidatePath('/dashboard/invoices')
}
/**
 * Flujo completo de cobro: registra el pago, genera la factura, cierra
 * el pedido y libera la mesa — en ese orden. Si el pago se registra
 * pero algo falla después (ej. generar factura), el pedido queda
 * marcado como pagado pero no completado; no revertimos el pago
 * automáticamente para evitar descuadres de caja silenciosos — un
 * fallo aquí debe resolverse manualmente, no reintentarse solo.
 */


export async function checkoutOrderAction(
  businessId: string,
  orderId: string,
  tableId: string | null,
  formData: FormData
): Promise<{ invoice: InvoiceWithItems }> {
  await requireBusinessAccess(businessId)

  const amount = Number(formData.get('amount'))
  const method = formData.get('method') as PaymentMethod

  if (isNaN(amount) || amount <= 0) {
    throw new Error('El monto debe ser un número mayor a 0')
  }
  if (!method) {
    throw new Error('El método de pago es obligatorio')
  }

  // Esta cadena SÍ tiene dependencias reales (la factura necesita el
  // pago registrado; actualizar su estado necesita el id de la factura
  // recién creada) — se queda secuencial a propósito.
  await recordPayment(businessId, orderId, amount, method)
  const invoiceDraft = await createInvoiceFromOrder(orderId)
  const invoice = await updateInvoiceStatus(invoiceDraft.id, 'issued')

  // Estos tres pasos NO dependen entre sí ni de lo anterior una vez el
  // pago ya está confirmado — antes iban uno detrás de otro.
  await Promise.all([
    updateOrderStatus(orderId, 'completed'),
    (async () => {
      const ticket = await getKitchenTicketByOrderId(orderId)
      if (ticket && ticket.status !== 'delivered' && ticket.status !== 'cancelled') {
        await updateKitchenTicketStatus(ticket.id, 'delivered')
      }
    })(),
    tableId ? updateTableStatus(tableId, 'available') : Promise.resolve(),
  ])

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/kitchen')
  revalidatePath('/dashboard/reports')

  return { invoice: invoiceDraft.items ? { ...invoice, items: invoiceDraft.items } : invoiceDraft }
}

export async function getInvoiceDetailAction(invoiceId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  return getInvoiceById(invoiceId)
}