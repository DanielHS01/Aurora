'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import {
  createOrder,
  addOrderItem,
  removeOrderItem,
  updateOrderItemQuantity,
  updateOrderStatus,
  cancelOrder,
  getActiveOrderForTable,
} from '@/lib/queries/orders'
import { getKitchenTicketByOrderId, updateKitchenTicketStatus } from '@/lib/queries/kitchen'
import { updateTableStatus } from '@/lib/queries/tables'
import type { OrderStatus, OrderType } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function createOrderAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const tableId = (formData.get('tableId') as string) || null
  const customerId = (formData.get('customerId') as string) || null
  const orderType = (formData.get('orderType') as OrderType) || 'dine_in'

  await requireBusinessAccess(businessId)

  // Solo evita duplicados si hay mesa — un pedido para llevar sin mesa
  // no tiene "mesa activa" contra la cual comparar, así que este chequeo
  // no aplica en ese caso.
  if (tableId) {
    const existing = await getActiveOrderForTable(tableId)
    if (existing) {
      return existing
    }
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
}

export async function addOrderItemAction(businessId: string, formData: FormData) {
  await requireBusinessAccess(businessId)

  const orderId = formData.get('orderId') as string
  const productId = (formData.get('productId') as string) || null
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

  // El pedido cancelado no debe dejar un ticket de cocina activo
  // colgado — si existe, se cancela junto con el pedido.
  const ticket = await getKitchenTicketByOrderId(orderId)
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
export async function markOrderPickedUpAction(orderId: string, businessId: string) {
  await requireBusinessAccess(businessId)

  const ticket = await getKitchenTicketByOrderId(orderId)
  if (ticket) {
    await updateKitchenTicketStatus(ticket.id, 'delivered')
  }

  await updateOrderStatus(orderId, 'served')

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/kitchen')
}