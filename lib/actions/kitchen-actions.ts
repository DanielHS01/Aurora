'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import {
  createKitchenTicket,
  updateKitchenTicketStatus,
  getKitchenTicketByOrderId,
} from '@/lib/queries/kitchen'
import { updateOrderStatus } from '@/lib/queries/orders'
import type { KitchenTicketStatus } from '@/lib/types'
import type { OrderStatus } from '@/lib/types'
import { revalidatePath } from 'next/cache'

// Mapea el avance del ticket de cocina al estado visible del pedido.
// "delivered" no está aquí a propósito — esa transición la dispara el
// mesero (markOrderServedAction), no cocina.
const TICKET_TO_ORDER_STATUS: Partial<Record<KitchenTicketStatus, OrderStatus>> = {
  in_progress: 'preparing',
  ready: 'ready',
}

export async function createKitchenTicketAction(businessId: string, orderId: string) {
  await requireBusinessAccess(businessId)
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