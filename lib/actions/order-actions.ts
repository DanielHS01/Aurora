'use server'

import { revalidatePath } from 'next/cache'
import { requireBusinessAccess } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { UserFacingError } from '@/lib/errors'
import { runAction, type ActionResult } from '@/lib/utils/actionResult'
import {
  createOrder,
  addOrderItem,
  removeOrderItem,
  updateOrderItemQuantity,
  updateOrderStatus,
  cancelOrder,
  getActiveOrderForTable,
} from '@/lib/queries/orders'
import { updateTableStatus } from '@/lib/queries/tables'
import {
  getActiveKitchenTicketByOrderId,
  updateKitchenTicketStatus,
} from '@/lib/queries/kitchen'
import { assertCashRegisterOpen } from '@/lib/queries/cashRegister'
import { serveReadyItems } from '@/lib/queries/kitchenFlow'
import type { Order, OrderStatus, OrderType } from '@/lib/types'

/**
 * Una pantalla de pedido abierta antes de que eliminaran o agotaran un
 * plato podría seguir agregándolo: el servidor es quien decide.
 */
async function assertProductOrderable(productId: string, businessId: string) {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('is_available, is_sold_out')
    .eq('id', productId)
    .eq('business_id', businessId)
    .maybeSingle()

  if (!product || product.is_available === false) {
    throw new UserFacingError('Este plato ya no está en el menú. Recarga la página.')
  }
  if (product.is_sold_out) {
    throw new UserFacingError('Este plato está agotado.')
  }
}

export async function createOrderAction(formData: FormData): Promise<ActionResult<Order>> {
  return runAction(async () => {
    const businessId = formData.get('businessId') as string
    const tableId = (formData.get('tableId') as string) || null
    const customerId = (formData.get('customerId') as string) || null
    const orderType = (formData.get('orderType') as OrderType) || 'dine_in'

    await requireBusinessAccess(businessId)
    await assertCashRegisterOpen(businessId)

    // Solo evita duplicados si hay mesa: un pedido para llevar no tiene
    // "mesa activa" contra la cual comparar.
    if (tableId) {
      const existing = await getActiveOrderForTable(tableId)
      if (existing) return existing
    }

    const order = await createOrder({
      business_id: businessId,
      table_id: tableId,
      customer_id: customerId,
      order_type: orderType,
    })

    if (tableId) {
      await updateTableStatus(tableId, 'occupied')
    }

    revalidatePath('/dashboard/tables')
    return order
  })
}

export async function addOrderItemAction(businessId: string, formData: FormData) {
  const productId = (formData.get('productId') as string) || null

  // En paralelo para no sumar una espera más a cada plato que se agrega
  await Promise.all([
    requireBusinessAccess(businessId),
    productId ? assertProductOrderable(productId, businessId) : Promise.resolve(),
  ])

  const orderId = formData.get('orderId') as string
  const productName = (formData.get('productName') as string)?.trim()
  const quantity = Number(formData.get('quantity') ?? 1)
  const unitPrice = Number(formData.get('unitPrice'))
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!productName) {
    throw new Error('El nombre del producto es obligatorio')
  }
  if (isNaN(unitPrice) || unitPrice < 0) {
    throw new Error('El precio unitario debe ser un número válido')
  }
  if (quantity < 1) {
    throw new Error('La cantidad debe ser al menos 1')
  }

  const optionsRaw = formData.get('options') as string | null
  const options = optionsRaw ? JSON.parse(optionsRaw) : []

  const item = await addOrderItem(
    orderId,
    businessId,
    productId,
    productName,
    quantity,
    unitPrice,
    notes,
    options
  )

  revalidatePath(`/dashboard/orders/${orderId}`)
  return item
}

export async function removeOrderItemAction(
  orderItemId: string,
  orderId: string,
  businessId: string
) {
  await requireBusinessAccess(businessId)
  await removeOrderItem(orderItemId, orderId)
  revalidatePath(`/dashboard/orders/${orderId}`)
}

export async function updateOrderItemQuantityAction(
  orderItemId: string,
  orderId: string,
  businessId: string,
  quantity: number
) {
  await requireBusinessAccess(businessId)

  if (quantity < 1) {
    throw new Error('La cantidad debe ser al menos 1')
  }

  await updateOrderItemQuantity(orderItemId, orderId, quantity)
  revalidatePath(`/dashboard/orders/${orderId}`)
}

export async function updateOrderStatusAction(
  orderId: string,
  businessId: string,
  status: OrderStatus,
  tableId?: string | null
) {
  await requireBusinessAccess(businessId)
  await updateOrderStatus(orderId, status)

  // Al completar o cancelar el pedido, la mesa vuelve a estar libre.
  if (tableId && (status === 'completed' || status === 'cancelled')) {
    await updateTableStatus(tableId, 'available')
  }

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath('/dashboard/tables')
}

export async function cancelOrderAction(
  orderId: string,
  businessId: string,
  tableId?: string | null
) {
  await requireBusinessAccess(businessId)
  await cancelOrder(orderId)

  // El pedido cancelado no debe dejar un ticket de cocina activo colgado
  const ticket = await getActiveKitchenTicketByOrderId(orderId)
  if (ticket) {
    await updateKitchenTicketStatus(ticket.id, 'cancelled')
  }

  if (tableId) {
    await updateTableStatus(tableId, 'available')
  }

  revalidatePath(`/dashboard/orders/${orderId}`)
  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard/kitchen')
}

/**
 * Para llevar y domicilio: entrega los platos que están listos. Como el
 * pedido solo pasa a "ready" cuando TODO está listo, en la práctica entrega
 * todo de una vez.
 */
export async function markOrderPickedUpAction(orderId: string, businessId: string) {
  await requireBusinessAccess(businessId)

  const { servedItemIds } = await serveReadyItems(orderId, businessId)
  if (servedItemIds.length === 0) {
    throw new UserFacingError('No hay platos listos en este pedido')
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/kitchen')
}