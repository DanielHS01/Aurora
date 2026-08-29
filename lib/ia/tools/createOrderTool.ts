import { createOrder, addOrderItem } from '@/lib/queries/orders'
import { getFullMenu, type CategoryWithProducts } from '@/lib/queries/menu'
import { createNotification } from '@/lib/queries/notifications'
import type { AiTool } from '../core/types'

type OrderItemInput = {
  productName: string
  quantity: number
}

// Caché en memoria por negocio — el menú no cambia cada pocos segundos,
// así que si el mismo negocio recibe varios mensajes seguidos (una
// conversación normal), no hace falta volver a consultarlo cada vez.
const menuCache = new Map<string, { menu: CategoryWithProducts[]; expiresAt: number }>()
const MENU_CACHE_TTL_MS = 30000

async function getCachedMenu(businessId: string): Promise<CategoryWithProducts[]> {
  const cached = menuCache.get(businessId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.menu
  }
  const menu = await getFullMenu(businessId)
  menuCache.set(businessId, { menu, expiresAt: Date.now() + MENU_CACHE_TTL_MS })
  return menu
}

export async function buildCreateOrderTool(businessId: string): Promise<AiTool> {
  const menu = await getCachedMenu(businessId)
  const allProducts = menu.flatMap((c) => c.products)

  const menuSummary = allProducts
    .filter((p) => !p.is_sold_out)
    .map((p) => `${p.name} ($${p.price})`)
    .join(', ')

  return {
    name: 'create_order',
    description: `Crea un pedido para llevar (el cliente lo recoge, no es en el restaurante). Usa exactamente los nombres del menú disponible: ${menuSummary}. Confirma con el cliente el pedido completo antes de crearlo.`,
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Ítems del pedido',
          items: {
            type: 'object',
            properties: {
              productName: { type: 'string', description: 'Nombre exacto del producto en el menú' },
              quantity: { type: 'number', description: 'Cantidad' },
            },
            required: ['productName', 'quantity'],
          },
        },
      },
      required: ['items'],
    },
    handler: async (context, input) => {
      const items = input.items as OrderItemInput[]

      if (!items || items.length === 0) {
        return { error: 'No se especificaron productos para el pedido' }
      }

      const resolvedItems: { product: (typeof allProducts)[number]; quantity: number }[] = []
      for (const item of items) {
        const product = allProducts.find(
          (p) => p.name.toLowerCase() === item.productName.toLowerCase()
        )
        if (!product) {
          return { error: `No encontramos "${item.productName}" en el menú. Pídele al cliente que confirme el nombre exacto.` }
        }
        if (product.is_sold_out) {
          return { error: `"${product.name}" está agotado en este momento. Ofrece otra opción al cliente.` }
        }
        resolvedItems.push({ product, quantity: item.quantity })
      }

      const order = await createOrder({
        business_id: context.businessId,
        customer_id: context.customerId,
        table_id: null,
        order_type: 'takeaway',
      })

      for (const { product, quantity } of resolvedItems) {
        await addOrderItem(
          order.id,
          context.businessId,
          product.id,
          product.name,
          quantity,
          product.price,
          null,
          []
        )
      }

      const summary = resolvedItems
        .map((i) => `${i.quantity}x ${i.product.name}`)
        .join(', ')

      await createNotification(
        context.businessId,
        '🥡 Nuevo pedido para llevar (WhatsApp)',
        `${summary}. El cliente pasará a recogerlo.`
      )

      return {
        success: true,
        message: `Pedido creado: ${summary}. En breve el restaurante lo confirma.`,
        orderId: order.id,
      }
    },
  }
}