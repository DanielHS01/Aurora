import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserFacingError } from '@/lib/errors'
import type {
  MenuCategory,
  Product,
  ProductOption,
  ProductOptionValue,
} from '@/lib/types'
import type { TablesInsert, TablesUpdate } from '@/lib/types/database.types'

type MenuCategoryInsert = TablesInsert<'menu_categories'>
type MenuCategoryUpdate = TablesUpdate<'menu_categories'>
type ProductInsert = TablesInsert<'products'>
type ProductUpdate = TablesUpdate<'products'>
type ProductOptionInsert = TablesInsert<'product_options'>
type ProductOptionUpdate = TablesUpdate<'product_options'>
type ProductOptionValueInsert = TablesInsert<'product_option_values'>
type ProductOptionValueUpdate = TablesUpdate<'product_option_values'>

// ============================================================================
// CATEGORÍAS
// ============================================================================

/**
 * Trae todas las categorías activas de un negocio, ordenadas por sort_order.
 */
export async function getMenuCategories(businessId: string): Promise<MenuCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return data
}

export async function createMenuCategory(
  category: MenuCategoryInsert
): Promise<MenuCategory> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('menu_categories')
    .insert(category)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error creando categoría: ${error?.message}`)
  }
  return data
}

export async function updateMenuCategory(
  categoryId: string,
  updates: MenuCategoryUpdate
): Promise<MenuCategory> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('menu_categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando categoría: ${error?.message}`)
  }
  return data
}

/**
 * Soft-delete: desactiva la categoría en vez de borrarla, para no perder
 * el historial de productos que la referencian (category_id usa
 * ON DELETE SET NULL, así que un borrado real dejaría productos huérfanos
 * de categoría sin que el usuario lo esperara).
 */
export async function deactivateMenuCategory(categoryId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('menu_categories')
    .update({ is_active: false })
    .eq('id', categoryId)

  if (error) {
    throw new Error(`Error desactivando categoría: ${error.message}`)
  }
}

// ============================================================================
// PRODUCTOS
// ============================================================================

/**
 * Trae productos de un negocio. Si se pasa categoryId, filtra por esa
 * categoría; si no, trae todos los productos disponibles del negocio.
 */
export async function getProducts(
  businessId: string,
  categoryId?: string
): Promise<Product[]> {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_available', true)
    .order('sort_order', { ascending: true })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error || !data) return []
  return data
}

export async function getProductById(productId: string): Promise<Product | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error || !data) return null
  return data
}

export async function createProduct(product: ProductInsert): Promise<Product> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error creando producto: ${error?.message}`)
  }
  return data
}

export async function updateProduct(
  productId: string,
  updates: ProductUpdate
): Promise<Product> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando producto: ${error?.message}`)
  }
  return data
}

/**
 * "Eliminar" un plato = is_available = false (soft-delete). Un borrado
 * real dejaría los pedidos ya facturados sin referencia al producto
 * original. getFullMenu y getProducts ocultan los platos con esta marca,
 * y se pueden reactivar desde "Platos desactivados". La receta se conserva.
 */
export async function deactivateProduct(productId: string): Promise<void> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .update({ is_available: false })
    .eq('id', productId)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(`Error desactivando producto: ${error.message}`)
  }

  // Sin fila actualizada: el producto no existe o no es del usuario (RLS)
  if (!data) {
    throw new UserFacingError('Producto no encontrado')
  }
}

// ============================================================================
// OPCIONES DE PRODUCTO (ej. "Término de la carne", "Tamaño")
// ============================================================================

export type ProductOptionWithValues = ProductOption & {
  values: ProductOptionValue[]
}

/**
 * Trae las opciones de un producto, cada una con sus valores posibles ya
 * anidados. Esto es lo que normalmente necesitas para pintar el selector
 * de modificadores al armar un pedido.
 */
export async function getProductOptions(
  productId: string
): Promise<ProductOptionWithValues[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_options')
    .select('*, values:product_option_values(*)')
    .eq('product_id', productId)

  if (error || !data) return []
  return data as ProductOptionWithValues[]
}

export async function createProductOption(
  option: ProductOptionInsert
): Promise<ProductOption> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_options')
    .insert(option)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error creando opción: ${error?.message}`)
  }
  return data
}

export async function updateProductOption(
  optionId: string,
  updates: ProductOptionUpdate
): Promise<ProductOption> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_options')
    .update(updates)
    .eq('id', optionId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando opción: ${error?.message}`)
  }
  return data
}

/**
 * Borrado real aquí (no soft-delete) — a diferencia de productos y
 * categorías, una opción sin selección hecha aún no tiene historial que
 * proteger, y "product_options" tiene ON DELETE CASCADE hacia sus
 * "product_option_values", así que se limpia todo junto correctamente.
 */
export async function deleteProductOption(optionId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('product_options').delete().eq('id', optionId)

  if (error) {
    throw new Error(`Error eliminando opción: ${error.message}`)
  }
}

export async function createProductOptionValue(
  value: ProductOptionValueInsert
): Promise<ProductOptionValue> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_option_values')
    .insert(value)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error creando valor de opción: ${error?.message}`)
  }
  return data
}

export async function updateProductOptionValue(
  valueId: string,
  updates: ProductOptionValueUpdate
): Promise<ProductOptionValue> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_option_values')
    .update(updates)
    .eq('id', valueId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando valor de opción: ${error?.message}`)
  }
  return data
}

export async function deleteProductOptionValue(valueId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('product_option_values')
    .delete()
    .eq('id', valueId)

  if (error) {
    throw new Error(`Error eliminando valor de opción: ${error.message}`)
  }
}

// ============================================================================
// MENÚ COMPLETO (pantallas de pedidos, cocina, inventario, bot de IA)
// ============================================================================

export type CategoryWithProducts = MenuCategory & {
  products: (Product & { options: ProductOptionWithValues[] })[]
}

/**
 * Trae el menú completo de un negocio: categorías → productos → opciones →
 * valores, todo anidado en una sola llamada.
 *
 * Los productos eliminados (is_available = false) no se incluyen, así que
 * desaparecen de todas las pantallas que usan el menú y el bot de IA no los
 * ofrece.
 *
 * Nota de rendimiento: hace 1 query con joins anidados de Supabase en vez
 * de N+1 consultas manuales. Si el menú crece mucho (cientos de productos
 * con muchas opciones), vale la pena revisar el tamaño del payload luego.
 */
export async function getFullMenu(businessId: string): Promise<CategoryWithProducts[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('menu_categories')
    .select(
      `*,
      products (
        *,
        options:product_options (
          *,
          values:product_option_values (*)
        )
      )`
    )
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !data) return []

  const categories = data as CategoryWithProducts[]

  return categories.map((category) => ({
    ...category,
    products: (category.products ?? []).filter((p) => p.is_available !== false),
  }))
}

export async function toggleProductSoldOut(
  productId: string,
  isSoldOut: boolean
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .update({ is_sold_out: isSoldOut })
    .eq('id', productId)

  if (error) {
    throw new Error(`Error actualizando disponibilidad: ${error.message}`)
  }
}
// ============================================================================
// PLATOS DESACTIVADOS (el botón "Eliminar" solo los oculta; aquí se reactivan)
// ============================================================================

export type InactiveProduct = {
  id: string
  name: string
  price: number
  image_url: string | null
  category_id: string | null
  category_name: string | null
  category_active: boolean
}

export type ActiveCategoryOption = { id: string; name: string }

export async function getInactiveProducts(businessId: string): Promise<{
  products: InactiveProduct[]
  activeCategories: ActiveCategoryOption[]
}> {
  const supabase = await createClient()

  // Dos consultas en paralelo en vez de un join: las categorías son pocas
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price, image_url, category_id')
      .eq('business_id', businessId)
      .eq('is_available', false)
      .order('name', { ascending: true }),
    supabase
      .from('menu_categories')
      .select('id, name, is_active, sort_order')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true }),
  ])

  const byId = new Map((categories ?? []).map((c) => [c.id, c]))

  return {
    products: (products ?? []).map((p) => {
      const category = p.category_id ? byId.get(p.category_id) : undefined
      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image_url: p.image_url,
        category_id: p.category_id,
        category_name: category?.name ?? null,
        category_active: category ? category.is_active !== false : false,
      }
    }),
    activeCategories: (categories ?? [])
      .filter((c) => c.is_active !== false)
      .map((c) => ({ id: c.id, name: c.name })),
  }
}

/**
 * Vuelve a activar un plato. Si su categoría fue desactivada (o ya no
 * existe), hay que indicar una categoría activa: si no, quedaría activo
 * pero invisible, porque el menú solo muestra categorías activas.
 */
export async function reactivateProduct(
  productId: string,
  businessId: string,
  newCategoryId?: string
): Promise<{ removedArchivedIngredients: number }> {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, category_id, is_available')
    .eq('id', productId)
    .eq('business_id', businessId)
    .maybeSingle()

  if (!product) throw new UserFacingError('Producto no encontrado')
  // Ya estaba activo (doble clic, otra pestaña): no hay nada que hacer
  if (product.is_available !== false) return { removedArchivedIngredients: 0 }

  let categoryId = product.category_id
  let currentCategoryActive = false

  if (product.category_id) {
    const { data: category } = await supabase
      .from('menu_categories')
      .select('is_active')
      .eq('id', product.category_id)
      .eq('business_id', businessId)
      .maybeSingle()
    currentCategoryActive = Boolean(category && category.is_active !== false)
  }

  if (!currentCategoryActive) {
    if (!newCategoryId) {
      throw new UserFacingError(
        'La categoría de este plato fue desactivada. Elige una categoría para reactivarlo.'
      )
    }

    const { data: chosen } = await supabase
      .from('menu_categories')
      .select('id, is_active')
      .eq('id', newCategoryId)
      .eq('business_id', businessId)
      .maybeSingle()

    if (!chosen || chosen.is_active === false) {
      throw new UserFacingError('La categoría elegida no es válida')
    }
    categoryId = newCategoryId
  }

  const { error } = await supabase
    .from('products')
    .update({ is_available: true, category_id: categoryId })
    .eq('id', productId)
    .eq('business_id', businessId)

  if (error) throw new Error(`Error reactivando producto: ${error.message}`)

  // Insumos archivados mientras el plato estuvo desactivado: se quitan de
  // su receta para que no quede apuntando a algo que ya no se usa.
  const admin = createAdminClient()

  const { data: lines } = await admin
    .from('product_components')
    .select('id, item_id')
    .eq('product_id', productId)
    .eq('business_id', businessId)

  if (!lines || lines.length === 0) return { removedArchivedIngredients: 0 }

  const { data: archived } = await admin
    .from('inventory_items')
    .select('id')
    .in('id', lines.map((l) => l.item_id))
    .eq('is_active', false)

  const archivedIds = new Set((archived ?? []).map((a) => a.id))
  const toRemove = lines.filter((l) => archivedIds.has(l.item_id)).map((l) => l.id)

  if (toRemove.length > 0) {
    await admin.from('product_components').delete().in('id', toRemove)
  }

  return { removedArchivedIngredients: toRemove.length }
}

/**
 * Para evitar duplicados al crear: ¿ya hay un plato DESACTIVADO con este nombre?
 */
export async function findInactiveProductByName(
  businessId: string,
  name: string
): Promise<{ id: string; name: string } | null> {
  const supabase = await createClient()

  // Se escapan % y _ para que el nombre se compare tal cual y no como patrón
  const escaped = name.trim().replace(/[\\%_]/g, '\\$&')

  const { data } = await supabase
    .from('products')
    .select('id, name')
    .eq('business_id', businessId)
    .eq('is_available', false)
    .ilike('name', escaped)
    .limit(1)

  return data && data.length > 0 ? data[0] : null
}