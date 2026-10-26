'use server'

import { revalidatePath } from 'next/cache'
import { requireBusinessAccess } from '@/lib/auth/session'
import { getCurrentUserRole } from '@/lib/queries/business-users'
import { UserFacingError } from '@/lib/errors'
import { runAction, type ActionResult } from '@/lib/utils/actionResult'
import {
  getInactiveProducts,
  reactivateProduct,
  type InactiveProduct,
  type ActiveCategoryOption,
} from '@/lib/queries/menu'
import type { BusinessRole } from '@/lib/types'

const MENU_ROLES: BusinessRole[] = ['owner', 'admin', 'manager']

async function requireMenuAccess(businessId: string) {
  await requireBusinessAccess(businessId) // incluye el chequeo de mantenimiento

  const role = await getCurrentUserRole(businessId)
  if (!role || !MENU_ROLES.includes(role)) {
    throw new UserFacingError('No tienes permiso para gestionar el menú')
  }
}

export async function listInactiveProductsAction(
  businessId: string
): Promise<
  ActionResult<{ products: InactiveProduct[]; activeCategories: ActiveCategoryOption[] }>
> {
  return runAction(async () => {
    await requireMenuAccess(businessId)
    return getInactiveProducts(businessId)
  })
}

export async function reactivateProductAction(
  productId: string,
  businessId: string,
  categoryId?: string
): Promise<ActionResult<{ removedArchivedIngredients: number }>> {
  return runAction(async () => {
    await requireMenuAccess(businessId)

    const result = await reactivateProduct(productId, businessId, categoryId)

    revalidatePath('/dashboard/menu')
    revalidatePath('/dashboard/inventory')
    return result
  })
}