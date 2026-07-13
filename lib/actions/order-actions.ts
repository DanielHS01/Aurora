'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import {
  createOrder,
  addOrderItem,
  removeOrderItem,
  updateOrderItemQuantity,
  updateOrderStatus,
  cancelOrder,
} from '@/lib/queries/orders'
import type { OrderStatus, OrderType } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function createOrderAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const tableId = (formData.get('tableId') as string) || null
  const customerId = (formData.get('customerId') as string) || null
  const orderType = (formData.get('orderType') as OrderType) || 'dine_in'

  await requireBusinessAccess(businessId)

  const order = await createOrder({
    business_id: businessId,
    table_id: tableId,
    customer_id: customerId,
    order_type: orderType,
  })

  revalidatePath('/orders')
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

  // Las opciones seleccionadas se esperan como JSON serializado en el form
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

  revalidatePath(`/orders/${orderId}`)
  return item
}

export async function removeOrderItemAction(
  orderItemId: string,
  orderId: string,
  businessId: string
) {
  await requireBusinessAccess(businessId)
  await removeOrderItem(orderItemId, orderId)
  revalidatePath(`/orders/${orderId}`)
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
  revalidatePath(`/orders/${orderId}`)
}

export async function updateOrderStatusAction(
  orderId: string,
  businessId: string,
  status: OrderStatus
) {
  await requireBusinessAccess(businessId)
  await updateOrderStatus(orderId, status)
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
}

export async function cancelOrderAction(orderId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  await cancelOrder(orderId)
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
}