import { createClient } from '@/lib/supabase/server'
import type { Order, OrderItem, OrderItemOption, OrderStatus } from '@/lib/types'
import type { TablesInsert, TablesUpdate } from '@/lib/types/database.types'

type OrderInsert = TablesInsert<'orders'>
type OrderUpdate = TablesUpdate<'orders'>

export type OrderItemWithOptions = OrderItem & {
  options: OrderItemOption[]
}

export type OrderWithItems = Order & {
  items: OrderItemWithOptions[]
}

// ============================================================================
// LECTURA
// ============================================================================

export async function getOrders(
  businessId: string,
  filters?: { status?: OrderStatus; tableId?: string }
): Promise<Order[]> {
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.tableId) query = query.eq('table_id', filters.tableId)

  const { data, error } = await query

  if (error || !data) return []
  return data
}

export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*, options:order_item_options(*))')
    .eq('id', orderId)
    .single()

  if (error || !data) return null
  return data as OrderWithItems
}

export async function getActiveOrderForTable(tableId: string): Promise<Order | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('table_id', tableId)
    .not('status', 'in', '(completed,cancelled)')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data
}

// ============================================================================
// CREACIÓN
// ============================================================================

export async function createOrder(order: OrderInsert): Promise<Order> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .insert({ ...order, subtotal: 0, tax_amount: 0, service_fee: 0, total: 0 })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error creando pedido: ${error?.message}`)
  }
  return data
}

/**
 * Agrega un ítem con sus opciones a un pedido, y recalcula los totales —
 * todo dentro de una sola transacción de Postgres vía la función RPC
 * add_order_item_with_options. Si cualquier paso falla adentro, no queda
 * nada a medio insertar.
 */
export async function addOrderItem(
  orderId: string,
  businessId: string,
  productId: string | null,
  productName: string,
  quantity: number,
  unitPrice: number,
  notes: string | null,
  options: { option_name: string; option_value: string; extra_price?: number }[] = []
): Promise<OrderItemWithOptions> {
  const supabase = await createClient()

  const { data: newItemId, error } = await supabase.rpc('add_order_item_with_options', {
    p_business_id: businessId,
    p_order_id: orderId,
    p_product_id: productId,
    p_product_name: productName,
    p_quantity: quantity,
    p_unit_price: unitPrice,
    p_notes: notes,
    p_options: options,
  })

  if (error || !newItemId) {
    throw new Error(`Error agregando ítem: ${error?.message}`)
  }

  const { data, error: fetchError } = await supabase
    .from('order_items')
    .select('*, options:order_item_options(*)')
    .eq('id', newItemId)
    .single()

  if (fetchError || !data) {
    throw new Error(`Error obteniendo ítem creado: ${fetchError?.message}`)
  }

  return data as OrderItemWithOptions
}

/**
 * Elimina un ítem del pedido y recalcula totales — una sola transacción
 * vía la función RPC remove_order_item.
 */
export async function removeOrderItem(orderItemId: string, orderId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('remove_order_item', {
    p_order_item_id: orderItemId,
    p_order_id: orderId,
  })

  if (error) {
    throw new Error(`Error eliminando ítem: ${error.message}`)
  }
}

/**
 * Actualiza la cantidad de un ítem y recalcula totales — una sola
 * transacción vía la función RPC update_order_item_quantity.
 */
export async function updateOrderItemQuantity(
  orderItemId: string,
  orderId: string,
  quantity: number
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('update_order_item_quantity', {
    p_order_item_id: orderItemId,
    p_order_id: orderId,
    p_quantity: quantity,
  })

  if (error) {
    throw new Error(`Error actualizando cantidad: ${error.message}`)
  }
}

// ============================================================================
// ESTADO DEL PEDIDO
// ============================================================================

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando estado del pedido: ${error?.message}`)
  }
  return data
}

export async function cancelOrder(orderId: string): Promise<Order> {
  return updateOrderStatus(orderId, 'cancelled')
}