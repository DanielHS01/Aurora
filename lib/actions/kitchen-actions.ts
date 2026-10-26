'use server'

import { revalidatePath } from 'next/cache'
import { requireBusinessAccess, getCurrentUser } from '@/lib/auth/session'
import { getCurrentUserRole } from '@/lib/queries/business-users'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createKitchenTicket,
  getActiveKitchenTicketByOrderId,
  markTicketChangesAcknowledged,
  markTicketHasPendingChanges,
} from '@/lib/queries/kitchen'
import {
  advanceOrderItems,
  serveReadyItems,
  soldOutAndRemoveItem,
  reopenKitchenForNewItems,
  type ItemSubstitution,
  type LowStockEntry,
} from '@/lib/queries/kitchenFlow'
import { getInventoryItems, type InventoryItem } from '@/lib/queries/inventory'
import { createNotification } from '@/lib/queries/notifications'
import { formatQuantity, type InventoryUnit } from '@/lib/utils/inventory'
import type { BusinessRole } from '@/lib/types'

const SOLD_OUT_ROLES: BusinessRole[] = ['owner', 'admin', 'manager', 'kitchen']

function revalidateKitchenViews() {
  revalidatePath('/dashboard/kitchen')
  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/orders')
}

/** Cualquier miembro puede avanzar platos, salvo los roles de solo lectura. */
async function requireKitchenAccess(businessId: string): Promise<string> {
  await requireBusinessAccess(businessId) // incluye el chequeo de mantenimiento

  const role = await getCurrentUserRole(businessId)
  if (!role || role === 'viewer' || role === 'ai_agent') {
    throw new Error('No tienes permiso para gestionar la cocina')
  }

  const user = await getCurrentUser()
  if (!user) throw new Error('No autenticado')
  return user.id
}

export async function createKitchenTicketAction(businessId: string, orderId: string) {
  await requireBusinessAccess(businessId)

  // Si el pedido ya tiene un ticket activo no se crea otro: cocina ya lo
  // ve y los platos se leen en vivo desde el pedido.
  const existing = await getActiveKitchenTicketByOrderId(orderId)
  if (existing) {
    revalidatePath('/dashboard/kitchen')
    return existing
  }

  const ticket = await createKitchenTicket(businessId, orderId)
  revalidatePath('/dashboard/kitchen')
  return ticket
}

/** Notifica stock bajo sin repetir si ya hay una alerta sin leer del mismo insumo. */
async function notifyLowStock(businessId: string, low: LowStockEntry[]) {
  if (low.length === 0) return

  const supabase = createAdminClient()
  const seen = new Set<string>()

  for (const entry of low) {
    if (seen.has(entry.name)) continue
    seen.add(entry.name)

    const title = `📦 Stock bajo: ${entry.name}`
    const { data: existing } = await supabase
      .from('business_notifications')
      .select('id')
      .eq('business_id', businessId)
      .eq('title', title)
      .eq('is_read', false)
      .limit(1)

    if (existing && existing.length > 0) continue

    await createNotification(
      businessId,
      title,
      entry.stock <= 0
        ? `Se agotó ${entry.name}. Registra una compra en Inventario.`
        : `Quedan ${formatQuantity(entry.stock, entry.unit as InventoryUnit)} de ${entry.name}.`
    )
  }
}

/**
 * Cocina avanza uno o varios platos (un plato, un grupo o todo el ticket).
 * - 'preparing': empieza los platos que están sin empezar.
 * - 'ready': los deja listos (si alguno no se había empezado, lo empieza antes).
 * Devuelve los platos bloqueados por falta de insumos para que cocina decida.
 */
export async function advanceOrderItemsAction(
  businessId: string,
  itemIds: string[],
  target: 'preparing' | 'ready',
  substitutions: ItemSubstitution[] = []
) {
  const userId = await requireKitchenAccess(businessId)

  if (itemIds.length === 0) return { updated: [], blocked: [] }
  if (itemIds.length > 100) throw new Error('Demasiados platos en una sola acción')
  if (substitutions.some((s) => !Number.isFinite(s.quantity) || s.quantity <= 0)) {
    throw new Error('La cantidad del sustituto no es válida')
  }

  const result = await advanceOrderItems({ businessId, userId, itemIds, target, substitutions })

  await notifyLowStock(businessId, result.lowStock)
  revalidateKitchenViews()

  return { updated: result.updated, blocked: result.blocked }
}

/** Cocina decide que el plato no sale: se bloquea en el menú y se retira del pedido. */
export async function markItemSoldOutAction(businessId: string, orderItemId: string) {
  await requireBusinessAccess(businessId)

  const role = await getCurrentUserRole(businessId)
  if (!role || !SOLD_OUT_ROLES.includes(role)) {
    throw new Error('No tienes permiso para marcar platos agotados')
  }

  const result = await soldOutAndRemoveItem(businessId, orderItemId)

  await createNotification(
    businessId,
    `🚫 Plato agotado: ${result.productName}`,
    `Se retiró del pedido de ${result.label}. Avisa al cliente y ofrécele otra opción.`
  )

  revalidatePath('/dashboard/menu')
  revalidateKitchenViews()
}

/** Para el selector de sustitutos en cocina. */
export async function listInventoryItemsForKitchenAction(
  businessId: string
): Promise<InventoryItem[]> {
  await requireKitchenAccess(businessId)
  return getInventoryItems(businessId)
}

/**
 * El mesero recoge: marca como entregados SOLO los platos listos. Los que
 * siguen en cocina quedan como están.
 */
export async function markOrderServedAction(orderId: string, businessId: string) {
  await requireBusinessAccess(businessId)

  const { servedItemIds } = await serveReadyItems(orderId, businessId)
  if (servedItemIds.length === 0) {
    throw new Error('No hay platos listos para recoger en este pedido')
  }

  revalidateKitchenViews()
  return { servedItemIds }
}

export async function notifyKitchenOrderChangedAction(businessId: string, orderId: string) {
  await requireBusinessAccess(businessId)

  const ticket = await getActiveKitchenTicketByOrderId(orderId)
  if (ticket) {
    await markTicketHasPendingChanges(ticket.id, true)
  } else {
    // Todo lo anterior ya se había entregado: si hay platos nuevos, se reabre la comanda
    await reopenKitchenForNewItems(orderId, businessId)
  }

  await createNotification(
    businessId,
    '⚠️ Pedido modificado',
    'El pedido en preparación fue modificado. Revisa los platos actualizados en cocina.'
  )

  revalidateKitchenViews()
}

/** Cocina abrió un ticket con cambios pendientes: apaga el aviso visual. */
export async function acknowledgeTicketChangeAction(ticketId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  await markTicketChangesAcknowledged(ticketId)
  revalidatePath('/dashboard/kitchen')
}