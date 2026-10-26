'use server'

import { requireBusinessAccess, getCurrentUser } from '@/lib/auth/session'
import { getCurrentUserRole } from '@/lib/queries/business-users'
import {
  adjustInventoryStock,
  createInventoryItem,
  updateInventoryItem,
  archiveInventoryItem,
  saveProductComponents,
  type InventoryItem,
  getInventoryItems,
} from '@/lib/queries/inventory'
import type { InventoryUnit } from '@/lib/utils/inventory'
import type { BusinessRole } from '@/lib/types'
import { UserFacingError } from '@/lib/errors'
import { runAction, type ActionResult } from '@/lib/utils/actionResult'

const ROLES_THAT_CAN_MANAGE_INVENTORY: BusinessRole[] = ['owner', 'admin', 'manager']

async function requireInventoryAccess(businessId: string): Promise<string> {
  await requireBusinessAccess(businessId) // incluye el chequeo de mantenimiento

  const role = await getCurrentUserRole(businessId)
  if (!role || !ROLES_THAT_CAN_MANAGE_INVENTORY.includes(role)) {
    throw new UserFacingError('No tienes permiso para gestionar el inventario')
  }

  const user = await getCurrentUser()
  if (!user) throw new UserFacingError('No autenticado')
  return user.id
}

export async function createInventoryItemAction(formData: FormData): Promise<InventoryItem> {
  const businessId = formData.get('businessId') as string
  const userId = await requireInventoryAccess(businessId)

  const name = (formData.get('name') as string)?.trim()
  const unit = formData.get('unit') as InventoryUnit
  const initialStock = Number(formData.get('initialStock') ?? 0)
  const minStock = Number(formData.get('minStock') ?? 0)

  if (!name) throw new Error('El nombre es obligatorio')
  if (!['g', 'ml', 'und'].includes(unit)) throw new Error('Unidad inválida')
  if (isNaN(initialStock) || initialStock < 0) throw new Error('El stock inicial no es válido')
  if (isNaN(minStock) || minStock < 0) throw new Error('El stock mínimo no es válido')

  return createInventoryItem({ businessId, name, unit, initialStock, minStock, userId })
}

export async function updateInventoryItemAction(
  itemId: string,
  businessId: string,
  name: string,
  minStock: number
) {
  await requireInventoryAccess(businessId)

  if (!name.trim()) throw new Error('El nombre es obligatorio')
  if (isNaN(minStock) || minStock < 0) throw new Error('El stock mínimo no es válido')

  await updateInventoryItem(itemId, businessId, name.trim(), minStock)
}

export async function adjustInventoryStockAction(
  itemId: string,
  businessId: string,
  mode: 'add' | 'remove' | 'set',
  quantity: number,
  note: string
): Promise<number> {
  const userId = await requireInventoryAccess(businessId)

  if (isNaN(quantity) || quantity < 0) throw new Error('La cantidad no es válida')
  if (mode !== 'set' && quantity === 0) throw new Error('La cantidad debe ser mayor a 0')

  return adjustInventoryStock({
    itemId,
    businessId,
    mode,
    quantity,
    note: note.trim() || null,
    userId,
  })
}

export async function archiveInventoryItemAction(itemId: string, businessId: string) {
  await requireInventoryAccess(businessId)
  await archiveInventoryItem(itemId, businessId)
}

export async function saveProductComponentsAction(
  productId: string,
  businessId: string,
  lines: { item_id: string; quantity: number }[]
): Promise<ActionResult> {
  return runAction(async () => {
    await requireInventoryAccess(businessId)

    if (lines.some((l) => !(l.quantity > 0))) {
      throw new UserFacingError('Todas las cantidades deben ser mayores a 0')
    }

    await saveProductComponents(productId, businessId, lines)
  })
}

/** Para mostrar el selector de insumos dentro del alta de productos. */
export async function listInventoryItemsAction(businessId: string): Promise<InventoryItem[]> {
  await requireInventoryAccess(businessId)
  return getInventoryItems(businessId) 
}