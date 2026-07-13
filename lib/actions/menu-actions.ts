'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import {
  createMenuCategory,
  updateMenuCategory,
  deactivateMenuCategory,
  createProduct,
  updateProduct,
  deactivateProduct,
  createProductOption,
  updateProductOption,
  deleteProductOption,
  createProductOptionValue,
  updateProductOptionValue,
  deleteProductOptionValue,
} from '@/lib/queries/menu'
import { revalidatePath } from 'next/cache'

// ============================================================================
// CATEGORÍAS
// ============================================================================

export async function createMenuCategoryAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const sortOrder = Number(formData.get('sortOrder') ?? 0)

  await requireBusinessAccess(businessId)

  if (!name) {
    throw new Error('El nombre de la categoría es obligatorio')
  }

  await createMenuCategory({
    business_id: businessId,
    name,
    description,
    sort_order: sortOrder,
  })

  revalidatePath('/menu')
}

export async function updateMenuCategoryAction(
  categoryId: string,
  businessId: string,
  formData: FormData
) {
  await requireBusinessAccess(businessId)

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!name) {
    throw new Error('El nombre de la categoría es obligatorio')
  }

  await updateMenuCategory(categoryId, { name, description })
  revalidatePath('/menu')
}

export async function deactivateMenuCategoryAction(categoryId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  await deactivateMenuCategory(categoryId)
  revalidatePath('/menu')
}

// ============================================================================
// PRODUCTOS
// ============================================================================

export async function createProductAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const categoryId = (formData.get('categoryId') as string) || null
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const price = Number(formData.get('price'))
  const preparationTime = formData.get('preparationTime')
    ? Number(formData.get('preparationTime'))
    : null

  await requireBusinessAccess(businessId)

  if (!name) {
    throw new Error('El nombre del producto es obligatorio')
  }
  if (isNaN(price) || price < 0) {
    throw new Error('El precio debe ser un número válido mayor o igual a 0')
  }

  await createProduct({
    business_id: businessId,
    category_id: categoryId,
    name,
    description,
    price,
    preparation_time_minutes: preparationTime,
  })

  revalidatePath('/menu')
}

export async function updateProductAction(
  productId: string,
  businessId: string,
  formData: FormData
) {
  await requireBusinessAccess(businessId)

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const price = Number(formData.get('price'))
  const categoryId = (formData.get('categoryId') as string) || null

  if (!name) {
    throw new Error('El nombre del producto es obligatorio')
  }
  if (isNaN(price) || price < 0) {
    throw new Error('El precio debe ser un número válido mayor o igual a 0')
  }

  await updateProduct(productId, { name, description, price, category_id: categoryId })
  revalidatePath('/menu')
}

export async function deactivateProductAction(productId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  await deactivateProduct(productId)
  revalidatePath('/menu')
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

  await requireBusinessAccess(businessId)

  if (!name) {
    throw new Error('El nombre de la opción es obligatorio')
  }
  if (minSelect > maxSelect) {
    throw new Error('El mínimo de selección no puede ser mayor al máximo')
  }

  await createProductOption({
    business_id: businessId,
    product_id: productId,
    name,
    is_required: isRequired,
    min_select: minSelect,
    max_select: maxSelect,
  })

  revalidatePath('/menu')
}

export async function deleteProductOptionAction(optionId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  await deleteProductOption(optionId)
  revalidatePath('/menu')
}

export async function createProductOptionValueAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const optionId = formData.get('optionId') as string
  const name = (formData.get('name') as string)?.trim()
  const extraPrice = Number(formData.get('extraPrice') ?? 0)

  await requireBusinessAccess(businessId)

  if (!name) {
    throw new Error('El nombre del valor es obligatorio')
  }

  await createProductOptionValue({
    business_id: businessId,
    option_id: optionId,
    name,
    extra_price: extraPrice,
  })

  revalidatePath('/menu')
}

export async function deleteProductOptionValueAction(valueId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  await deleteProductOptionValue(valueId)
  revalidatePath('/menu')
}