'use server'

import { revalidatePath } from 'next/cache'
import { requireBusinessAccess } from '@/lib/auth/session'
import { getCurrentUserRole } from '@/lib/queries/business-users'
import {
  createMenuCategory,
  updateMenuCategory,
  deactivateMenuCategory,
  createProduct,
  updateProduct,
  deactivateProduct,
  createProductOption,
  deleteProductOption,
  createProductOptionValue,
  deleteProductOptionValue,
  findInactiveProductByName,
  toggleProductSoldOut,
} from '@/lib/queries/menu'
import { TAX_PRESETS, type TaxPresetValue } from '@/lib/constants/taxPresets'
import { UserFacingError } from '@/lib/errors'
import { runAction, type ActionResult } from '@/lib/utils/actionResult'
import type { BusinessRole, Product } from '@/lib/types'

const MENU_ROLES: BusinessRole[] = ['owner', 'admin', 'manager']
const SOLD_OUT_ROLES: BusinessRole[] = ['owner', 'admin', 'manager', 'kitchen']

async function requireRole(businessId: string, allowed: BusinessRole[], message: string) {
  await requireBusinessAccess(businessId) // incluye el chequeo de mantenimiento

  const role = await getCurrentUserRole(businessId)
  if (!role || !allowed.includes(role)) {
    throw new UserFacingError(message)
  }
}

function requireMenuAccess(businessId: string) {
  return requireRole(businessId, MENU_ROLES, 'No tienes permiso para gestionar el menú')
}

// ============================================================================
// CATEGORÍAS
// ============================================================================

export async function createMenuCategoryAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const sortOrder = Number(formData.get('sortOrder') ?? 0)

  await requireMenuAccess(businessId)

  if (!name) {
    throw new UserFacingError('El nombre de la categoría es obligatorio')
  }

  await createMenuCategory({
    business_id: businessId,
    name,
    description,
    sort_order: sortOrder,
  })

  revalidatePath('/dashboard/menu')
}

export async function updateMenuCategoryAction(
  categoryId: string,
  businessId: string,
  formData: FormData
) {
  await requireMenuAccess(businessId)

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!name) {
    throw new UserFacingError('El nombre de la categoría es obligatorio')
  }

  await updateMenuCategory(categoryId, { name, description })
  revalidatePath('/dashboard/menu')
}

export async function deactivateMenuCategoryAction(categoryId: string, businessId: string) {
  await requireMenuAccess(businessId)
  await deactivateMenuCategory(categoryId)
  revalidatePath('/dashboard/menu')
}

// ============================================================================
// PRODUCTOS
// ============================================================================

function resolveTaxPreset(formData: FormData) {
  const preset = (formData.get('taxPreset') as TaxPresetValue) || ''
  const found = TAX_PRESETS.find((p) => p.value === preset)
  return {
    tax_code: found?.taxCode ?? null,
    tax_rate: found?.taxRate ?? null,
    tax_is_excluded: found?.taxIsExcluded ?? false,
  }
}

export async function createProductAction(
  formData: FormData
): Promise<ActionResult<Product>> {
  return runAction(async () => {
    const businessId = formData.get('businessId') as string
    await requireMenuAccess(businessId)

    const categoryId = (formData.get('categoryId') as string) || null
    const name = (formData.get('name') as string)?.trim()
    const description = (formData.get('description') as string)?.trim() || null
    const price = Number(formData.get('price'))
    const preparationTimeRaw = formData.get('preparationTime')
    const preparationTime = preparationTimeRaw ? Number(preparationTimeRaw) : null

    if (!name) {
      throw new UserFacingError('El nombre del producto es obligatorio')
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new UserFacingError('El precio debe ser un número válido mayor o igual a 0')
    }
    if (
      preparationTime !== null &&
      (!Number.isFinite(preparationTime) || preparationTime < 0)
    ) {
      throw new UserFacingError('El tiempo de preparación no es válido')
    }

    // Evita duplicados: un plato "eliminado" solo está desactivado y se reactiva
    const inactive = await findInactiveProductByName(businessId, name)
    if (inactive) {
      throw new UserFacingError(
        `Ya tienes un plato desactivado llamado "${inactive.name}". Reactívalo desde "Platos desactivados" en lugar de crearlo de nuevo. Si es un plato distinto, cámbiale el nombre a uno de los dos.`
      )
    }

    const { tax_code, tax_rate, tax_is_excluded } = resolveTaxPreset(formData)

    const product = await createProduct({
      business_id: businessId,
      category_id: categoryId,
      name,
      description,
      price,
      preparation_time_minutes: preparationTime,
      tax_code,
      tax_rate,
      tax_is_excluded,
    })

    revalidatePath('/dashboard/menu')
    return product
  })
}

export async function updateProductAction(
  productId: string,
  businessId: string,
  formData: FormData
) {
  await requireMenuAccess(businessId)

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const price = Number(formData.get('price'))
  const categoryId = (formData.get('categoryId') as string) || null

  if (!name) {
    throw new UserFacingError('El nombre del producto es obligatorio')
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new UserFacingError('El precio debe ser un número válido mayor o igual a 0')
  }

  // El preset de impuesto solo se toca si el formulario lo incluyó
  // (el formulario del Plan Básico, sin Factus activo, no manda este
  // campo: así no se sobreescribe nada por accidente).
  const hasTaxPreset = formData.has('taxPreset')
  const taxFields = hasTaxPreset ? resolveTaxPreset(formData) : {}

  await updateProduct(productId, {
    name,
    description,
    price,
    category_id: categoryId,
    ...taxFields,
  })
  revalidatePath('/dashboard/menu')
}

/**
 * "Eliminar" un plato solo lo desactiva: conserva su historial y su
 * receta, y se puede reactivar desde "Platos desactivados".
 */
export async function deactivateProductAction(
  productId: string,
  businessId: string
): Promise<ActionResult> {
  return runAction(async () => {
    await requireMenuAccess(businessId)
    await deactivateProduct(productId)

    revalidatePath('/dashboard/menu')
    revalidatePath('/dashboard/inventory')
  })
}

export async function updateProductImageAction(
  productId: string,
  businessId: string,
  imageUrl: string
): Promise<ActionResult> {
  return runAction(async () => {
    await requireMenuAccess(businessId)
    await updateProduct(productId, { image_url: imageUrl })

    revalidatePath('/dashboard/menu')
  })
}

/** Cocina (y quienes gestionan el menú) marcan un plato como agotado o disponible. */
export async function toggleProductSoldOutAction(
  productId: string,
  businessId: string,
  isSoldOut: boolean
): Promise<ActionResult> {
  return runAction(async () => {
    await requireRole(
      businessId,
      SOLD_OUT_ROLES,
      'No tienes permiso para marcar disponibilidad de platos'
    )
    await toggleProductSoldOut(productId, isSoldOut)

    revalidatePath('/dashboard/kitchen')
    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard/menu')
  })
}

// ============================================================================
// OPCIONES DE PRODUCTO
// ============================================================================

export async function createProductOptionAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const productId = formData.get('productId') as string
  const name = (formData.get('name') as string)?.trim()
  const isRequired = formData.get('isRequired') === 'true'
  const minSelect = Number(formData.get('minSelect') ?? 0)
  const maxSelect = Number(formData.get('maxSelect') ?? 1)

  await requireMenuAccess(businessId)

  if (!name) {
    throw new UserFacingError('El nombre de la opción es obligatorio')
  }
  if (minSelect > maxSelect) {
    throw new UserFacingError('El mínimo de selección no puede ser mayor al máximo')
  }

  await createProductOption({
    business_id: businessId,
    product_id: productId,
    name,
    is_required: isRequired,
    min_select: minSelect,
    max_select: maxSelect,
  })

  revalidatePath('/dashboard/menu')
}

export async function deleteProductOptionAction(optionId: string, businessId: string) {
  await requireMenuAccess(businessId)
  await deleteProductOption(optionId)
  revalidatePath('/dashboard/menu')
}

export async function createProductOptionValueAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const optionId = formData.get('optionId') as string
  const name = (formData.get('name') as string)?.trim()
  const extraPrice = Number(formData.get('extraPrice') ?? 0)

  await requireMenuAccess(businessId)

  if (!name) {
    throw new UserFacingError('El nombre del valor es obligatorio')
  }

  await createProductOptionValue({
    business_id: businessId,
    option_id: optionId,
    name,
    extra_price: extraPrice,
  })

  revalidatePath('/dashboard/menu')
}

export async function deleteProductOptionValueAction(valueId: string, businessId: string) {
  await requireMenuAccess(businessId)
  await deleteProductOptionValue(valueId)
  revalidatePath('/dashboard/menu')
}