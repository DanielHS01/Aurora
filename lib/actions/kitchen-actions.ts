'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import {
  createKitchenTicket,
  updateKitchenTicketStatus,
  getKitchenTicketByOrderId,
  getActiveKitchenTicketByOrderId,
  markTicketChangesAcknowledged, 
  markTicketHasPendingChanges,
} from '@/lib/queries/kitchen'
import { updateOrderStatus } from '@/lib/queries/orders'
import type { KitchenTicketStatus } from '@/lib/types'
import type { OrderStatus } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/lib/queries/notifications'

// Mapea el avance del ticket de cocina al estado visible del pedido.
// "delivered" no está aquí a propósito — esa transición la dispara el
// mesero (markOrderServedAction), no cocina.
const TICKET_TO_ORDER_STATUS: Partial<Record<KitchenTicketStatus, OrderStatus>> = {
  in_progress: 'preparing',
  ready: 'ready',
}

export async function createKitchenTicketAction(businessId: string, orderId: string) {
  await requireBusinessAccess(businessId)

  // Si el pedido ya tiene un ticket activo (queued/in_progress/ready),
  // no crea uno nuevo — cocina ya está viendo este pedido, y como los
  // ítems se leen en vivo desde "orders" (no son una foto fija dentro
  // del ticket), cualquier cambio que agregues ya se refleja solo, sin
  // necesitar un segundo ticket.
  const existing = await getActiveKitchenTicketByOrderId(orderId)
  if (existing) {
    revalidatePath('/dashboard/kitchen')
    return existing
  }

  const ticket = await createKitchenTicket(businessId, orderId)
  revalidatePath('/dashboard/kitchen')
  return ticket
}

export async function updateKitchenTicketStatusAction(
  ticketId: string,
  businessId: string,
  status: KitchenTicketStatus
) {
  await requireBusinessAccess(businessId)
  const ticket = await updateKitchenTicketStatus(ticketId, status)

  const mappedOrderStatus = TICKET_TO_ORDER_STATUS[status]
  if (mappedOrderStatus) {
    await updateOrderStatus(ticket.order_id, mappedOrderStatus)
  }

  revalidatePath('/dashboard/kitchen')
  revalidatePath('/dashboard/tables')
}

/**
 * El mesero marca el pedido como recogido/entregado en la mesa. Cierra
 * el ticket de cocina (delivered) y avanza el pedido a "served" — el
 * siguiente paso después de esto es "completed" (cobro), que ya existe
 * como acción separada en order-actions.ts.
 */
export async function markOrderServedAction(orderId: string, businessId: string) {
  await requireBusinessAccess(businessId)

  const ticket = await getKitchenTicketByOrderId(orderId)
  if (ticket) {
    await updateKitchenTicketStatus(ticket.id, 'delivered')
  }

  await updateOrderStatus(orderId, 'served')

  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/kitchen')
}
export async function notifyKitchenOrderChangedAction(businessId: string, orderId: string) {
  await requireBusinessAccess(businessId)

  const ticket = await getActiveKitchenTicketByOrderId(orderId)
  if (ticket) {
    await markTicketHasPendingChanges(ticket.id, true)
  }

  await createNotification(
    businessId,
    '⚠️ Pedido modificado',
    `El pedido en preparación fue modificado — revisa los ítems actualizados en cocina.`
  )

  revalidatePath('/dashboard/kitchen')
}

/**
 * Se llama cuando cocina abre el detalle de un ticket marcado con
 * cambios pendientes — apaga el aviso visual, confirmando que ya lo
 * vieron. No cambia nada del pedido en sí, solo reconoce la alerta.
 */
export async function acknowledgeTicketChangeAction(ticketId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  await markTicketChangesAcknowledged(ticketId)
  revalidatePath('/dashboard/kitchen')
}