import type { KitchenTicketStatus, OrderStatus } from '@/lib/types'

type ItemStatus = string | null

export function isNotStarted(status: ItemStatus): boolean {
  return status === null || status === 'pending' || status === 'confirmed'
}

function isDone(status: ItemStatus): boolean {
  return status === 'served' || status === 'completed'
}

/** Estado del ticket de cocina según sus platos. */
export function deriveTicketStatus(statuses: ItemStatus[]): KitchenTicketStatus {
  const active = statuses.filter((s) => s !== 'cancelled')
  if (active.length === 0) return 'cancelled'

  const remaining = active.filter((s) => !isDone(s))
  if (remaining.length === 0) return 'delivered'
  if (remaining.every((s) => s === 'ready')) return 'ready'
  if (remaining.some((s) => s === 'preparing' || s === 'ready')) return 'in_progress'
  return 'queued'
}

/**
 * Estado del pedido según sus platos. En mesa, "ready" significa que hay
 * algo para recoger. Para llevar / domicilio, solo cuando TODO está listo.
 */
export function deriveOrderStatus(
  statuses: ItemStatus[],
  mode: 'dine_in' | 'takeaway'
): OrderStatus | null {
  const active = statuses.filter((s) => s !== 'cancelled')
  if (active.length === 0) return null

  const remaining = active.filter((s) => !isDone(s))
  if (remaining.length === 0) return 'served'

  const ready = remaining.filter((s) => s === 'ready').length
  const preparing = remaining.filter((s) => s === 'preparing').length

  if (mode === 'takeaway') {
    if (ready === remaining.length) return 'ready'
    return ready + preparing > 0 ? 'preparing' : 'confirmed'
  }

  if (ready > 0) return 'ready'
  if (preparing > 0) return 'preparing'
  return 'confirmed'
}