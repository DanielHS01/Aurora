import { createAdminClient } from '@/lib/supabase/admin'
import { createKitchenTicket } from '@/lib/queries/kitchen'
import { removeOrderItem } from '@/lib/queries/orders'
import { deriveOrderStatus, deriveTicketStatus, isNotStarted } from '@/lib/utils/kitchenFlow'
import type { TablesUpdate } from '@/lib/types/database.types'

export type ItemSubstitution = {
  orderItemId: string
  originalItemId: string // insumo de la receta que falta
  substituteItemId: string
  quantity: number // cantidad TOTAL del sustituto para ese plato, en su unidad base
}

export type Shortage = {
  item_id: string
  name: string
  unit: 'g' | 'ml' | 'und'
  required: number
  available: number
  replaces_item_id: string | null // si el faltante es un sustituto ya elegido, a quién reemplazaba
}

export type BlockedItem = {
  orderItemId: string
  productId: string | null
  productName: string
  shortages: Shortage[]
}

export type LowStockEntry = { name: string; unit: string; stock: number }

export type AdvanceResult = {
  updated: { id: string; status: 'preparing' | 'ready' }[]
  blocked: BlockedItem[]
  lowStock: LowStockEntry[]
}

type ConsumeResult =
  | { status: 'consumed'; low_stock: LowStockEntry[] }
  | { status: 'insufficient'; shortages: Omit<Shortage, 'replaces_item_id'>[] }
  | { status: 'already_consumed' | 'no_recipe' | 'not_found' }

type LoadedItem = {
  id: string
  order_id: string
  status: string | null
  product_id: string | null
  product_name: string
  quantity: number
}

/** Trae los platos y confirma que TODOS pertenecen al negocio. */
async function loadVerifiedItems(businessId: string, itemIds: string[]): Promise<LoadedItem[]> {
  const supabase = createAdminClient()

  const { data: items } = await supabase
    .from('order_items')
    .select('id, order_id, status, product_id, product_name, quantity')
    .in('id', itemIds)

  if (!items || items.length !== itemIds.length) {
    throw new Error('Algunos platos ya no existen en el pedido. Recarga la pantalla.')
  }

  const orderIds = [...new Set(items.map((i) => i.order_id))]
  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .eq('business_id', businessId)
    .in('id', orderIds)

  if ((orders?.length ?? 0) !== orderIds.length) throw new Error('Pedido no encontrado')

  return items as LoadedItem[]
}

/**
 * Recalcula el estado del ticket y del pedido a partir de sus platos.
 * Siempre escribe el ticket (aunque su estado no cambie) para que las
 * demás pantallas se enteren por Realtime.
 */
export async function recomputeOrderFlow(orderId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, table_id')
    .eq('id', orderId)
    .single()
  if (!order) return

  const { data: items } = await supabase.from('order_items').select('status').eq('order_id', orderId)
  const statuses = (items ?? []).map((i) => i.status as string | null)

  const { data: tickets } = await supabase
    .from('kitchen_tickets')
    .select('id, started_at')
    .eq('order_id', orderId)
    .not('status', 'in', '(delivered,cancelled)')
    .order('sent_at', { ascending: false })
    .limit(1)

  const ticket = tickets?.[0]
  if (ticket) {
    const ticketStatus = deriveTicketStatus(statuses)
    const now = new Date().toISOString()
    const updates: TablesUpdate<'kitchen_tickets'> = { status: ticketStatus }
    if (ticketStatus === 'in_progress' && !ticket.started_at) updates.started_at = now
    if (ticketStatus === 'ready' || ticketStatus === 'delivered') updates.completed_at = now

    await supabase.from('kitchen_tickets').update(updates).eq('id', ticket.id)
  }

  if (['confirmed', 'preparing', 'ready', 'served'].includes(order.status ?? '')) {
    const derived = deriveOrderStatus(statuses, order.table_id ? 'dine_in' : 'takeaway')
    if (derived && derived !== order.status) {
      await supabase.from('orders').update({ status: derived }).eq('id', orderId)
    }
  }
}

/**
 * Avanza platos a "preparing" o "ready". Al salir de "sin empezar"
 * descuenta inventario (una sola vez por plato). Si falta un insumo, el
 * plato queda bloqueado y se devuelve para que cocina decida.
 */
export async function advanceOrderItems(params: {
  businessId: string
  userId: string
  itemIds: string[]
  target: 'preparing' | 'ready'
  substitutions: ItemSubstitution[]
}): Promise<AdvanceResult> {
  const supabase = createAdminClient()
  const items = await loadVerifiedItems(params.businessId, params.itemIds)

  const updated: AdvanceResult['updated'] = []
  const blocked: BlockedItem[] = []
  const lowStock: LowStockEntry[] = []

  for (const item of items) {
    const current = item.status
    if (['ready', 'served', 'completed', 'cancelled'].includes(current ?? '')) continue
    if (params.target === 'preparing' && current === 'preparing') continue

    if (isNotStarted(current)) {
      const subs = params.substitutions
        .filter((s) => s.orderItemId === item.id)
        .map((s) => ({
          original_item_id: s.originalItemId,
          substitute_item_id: s.substituteItemId,
          quantity: s.quantity,
        }))

      const { data, error } = await supabase.rpc('consume_inventory_for_order_item', {
        p_order_item_id: item.id,
        p_user_id: params.userId,
        p_substitutions: subs,
      })
      if (error) throw new Error(error.message)

      const result = data as unknown as ConsumeResult

      if (result.status === 'not_found') throw new Error('El plato ya no existe en el pedido')

      if (result.status === 'insufficient') {
        const replaces = new Map(subs.map((s) => [s.substitute_item_id, s.original_item_id]))
        blocked.push({
          orderItemId: item.id,
          productId: item.product_id,
          productName: item.product_name,
          shortages: result.shortages.map((s) => ({
            ...s,
            replaces_item_id: replaces.get(s.item_id) ?? null,
          })),
        })
        continue
      }

      if (result.status === 'consumed') lowStock.push(...result.low_stock)
      // 'no_recipe' y 'already_consumed' avanzan sin tocar inventario
    }

    const { error: updateError } = await supabase
      .from('order_items')
      .update({ status: params.target })
      .eq('id', item.id)
    if (updateError) throw new Error(`Error actualizando el plato: ${updateError.message}`)

    updated.push({ id: item.id, status: params.target })
  }

  for (const orderId of new Set(items.map((i) => i.order_id))) {
    await recomputeOrderFlow(orderId)
  }

  return { updated, blocked, lowStock }
}

/** El mesero recoge: entrega SOLO los platos que ya están listos. */
export async function serveReadyItems(
  orderId: string,
  businessId: string
): Promise<{ servedItemIds: string[] }> {
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('business_id', businessId)
    .maybeSingle()
  if (!order) throw new Error('Pedido no encontrado')

  const { data: served, error } = await supabase
    .from('order_items')
    .update({ status: 'served' })
    .eq('order_id', orderId)
    .eq('status', 'ready')
    .select('id')
  if (error) throw new Error(`Error entregando platos: ${error.message}`)

  if (served && served.length > 0) await recomputeOrderFlow(orderId)

  return { servedItemIds: (served ?? []).map((s) => s.id) }
}

/** Bloquea el producto en el menú y lo retira del pedido (recalcula el total). */
export async function soldOutAndRemoveItem(
  businessId: string,
  orderItemId: string
): Promise<{ productName: string; label: string }> {
  const supabase = createAdminClient()

  const item = (await loadVerifiedItems(businessId, [orderItemId]))[0]
  if (!item) throw new Error('El plato ya no existe en el pedido')
  if (!isNotStarted(item.status)) {
    throw new Error('Este plato ya fue empezado y no se puede retirar desde aquí')
  }
  if (!item.product_id) throw new Error('Este plato no está ligado a un producto del menú')

  const { error } = await supabase
    .from('products')
    .update({ is_sold_out: true })
    .eq('id', item.product_id)
    .eq('business_id', businessId)
  if (error) throw new Error(`Error marcando el producto agotado: ${error.message}`)

  const { data: order } = await supabase
    .from('orders')
    .select('table_id')
    .eq('id', item.order_id)
    .single()

  let label = 'Para llevar'
  if (order?.table_id) {
    const { data: table } = await supabase
      .from('restaurant_tables')
      .select('table_number')
      .eq('id', order.table_id)
      .single()
    if (table) label = `Mesa ${table.table_number}`
  }

  await removeOrderItem(item.id, item.order_id)
  await recomputeOrderFlow(item.order_id)

  return { productName: item.product_name, label }
}

/**
 * Si todo lo anterior ya se entregó y se agregaron platos nuevos, abre
 * una comanda nueva para ellos. Devuelve si hubo algo que reabrir.
 */
export async function reopenKitchenForNewItems(
  orderId: string,
  businessId: string
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('business_id', businessId)
    .maybeSingle()
  if (!order) throw new Error('Pedido no encontrado')

  const { count } = await supabase
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .in('status', ['pending', 'confirmed'])

  if ((count ?? 0) === 0) return false

  await createKitchenTicket(businessId, orderId)
  await recomputeOrderFlow(orderId)
  return true
}