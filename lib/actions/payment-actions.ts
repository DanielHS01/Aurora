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
import { attachPaymentToCashSession } from '@/lib/queries/cashRegister'
import { getFactusActivationStatus } from '@/lib/queries/factusCredentials'
import { generateInvoiceForOrder, cancelInvoice } from '@/lib/factus/invoicing'



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
 * Flujo completo de cobro: registra el pago (UNA sola vez), genera la
 * factura local, la asocia a la caja abierta, y — si el negocio tiene
 * facturación electrónica activa — genera también el documento DIAN
 * vía Factus. Si el pago se registra pero algo falla después (ej.
 * Factus no responde), el pedido queda marcado como pagado pero el
 * documento DIAN queda pendiente; no revertimos el pago automáticamente
 * para evitar descuadres de caja silenciosos — un fallo aquí debe
 * resolverse manualmente, no reintentarse solo.
 */
export async function checkoutOrderAction(
  businessId: string,
  orderId: string,
  tableId: string | null,
  formData: FormData
): Promise<{
  invoice: InvoiceWithItems
  factus: { cufe: string; number: string; publicUrl: string; qrUrl: string } | null
}> {
  await requireBusinessAccess(businessId)

  const amount = Number(formData.get('amount'))
  const method = formData.get('method') as PaymentMethod
  const provider = (formData.get('provider') as string)?.trim() || undefined
  const customerDocType = (formData.get('customerDocType') as string)?.trim() || undefined
  const customerDocNumber = (formData.get('customerDocNumber') as string)?.trim() || undefined
  const customerName = (formData.get('customerName') as string)?.trim() || undefined

  if (isNaN(amount) || amount <= 0) {
    throw new Error('El monto debe ser un número mayor a 0')
  }
  if (!method) {
    throw new Error('El método de pago es obligatorio')
  }

  // Esta cadena SÍ tiene dependencias reales (la factura necesita el
  // pago registrado; actualizar su estado necesita el id de la factura
  // recién creada) — se queda secuencial a propósito. Un solo
  // recordPayment: antes se llamaba dos veces por error, duplicando
  // el monto en cada cobro.
  const paymentId = await recordPayment(businessId, orderId, amount, method, { provider })
  const invoiceDraft = await createInvoiceFromOrder(orderId)
  const invoice = await updateInvoiceStatus(invoiceDraft.id, 'issued')
  await attachPaymentToCashSession(paymentId, businessId)

  // Estos tres pasos NO dependen entre sí ni de lo anterior una vez el
  // pago ya está confirmado.
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

  // Facturación electrónica: solo si el negocio la tiene activa. Un
  // fallo aquí NO revierte el pago ya confirmado — el pedido queda
  // pagado y completado igual; el documento DIAN se puede reintentar
  // manualmente después sin tocar el dinero ya cobrado.
  let factus: { cufe: string; number: string; publicUrl: string; qrUrl: string } | null = null
  const factusStatus = await getFactusActivationStatus(businessId)
  if (factusStatus === 'active') {
    const customerOverride =
      customerDocType && customerDocNumber && customerName
        ? {
            identification_document_code: customerDocType,
            identification: customerDocNumber,
            legal_organization_code: customerDocType === '31' ? '1' : '2',
            ...(customerDocType === '31' ? { company: customerName } : { names: customerName }),
          }
        : undefined

    const result = await generateInvoiceForOrder(orderId, customerOverride)
    if (result.ok) {
      factus = {
        cufe: result.cufe,
        number: result.number,
        publicUrl: result.publicUrl,
        qrUrl: result.qrUrl,
      }
    } else {
      console.error(`Factus no generó factura para el pedido ${orderId}:`, result.message)
    }
  }

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/kitchen')
  revalidatePath('/dashboard/reports')

  return {
    invoice: invoiceDraft.items ? { ...invoice, items: invoiceDraft.items } : invoiceDraft,
    factus,
  }
}

export async function getInvoiceDetailAction(invoiceId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  return getInvoiceById(invoiceId)
}

export async function cancelInvoiceAction(
  invoiceId: string,
  businessId: string,
  reason: string,
) {
  await requireBusinessAccess(businessId)

  if (!reason.trim()) {
    throw new Error('Debes indicar el motivo de la anulación')
  }

  const result = await cancelInvoice(invoiceId, reason.trim())

  if (!result.ok) {
    throw new Error(result.message)
  }

  revalidatePath('/dashboard/invoices')

  return result
}