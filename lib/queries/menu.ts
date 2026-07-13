import { createClient } from '@/lib/supabase/server'
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
 * Soft-delete también aquí: is_available = false en vez de borrar.
 * Un producto borrado de verdad rompería el historial de order_items
 * pasados (aunque product_id usa ON DELETE SET NULL, perderías la
 * referencia al producto original en pedidos ya facturados).
 */
export async function deactivateProduct(productId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .update({ is_available: false })
    .eq('id', productId)

  if (error) {
    throw new Error(`Error desactivando producto: ${error.message}`)
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
// MENÚ COMPLETO (para pantallas de cliente / QR / vista pública)
// ============================================================================

export type CategoryWithProducts = MenuCategory & {
  products: (Product & { options: ProductOptionWithValues[] })[]
}

/**
 * Trae el menú completo de un negocio: categorías → productos → opciones →
 * valores, todo anidado en una sola llamada. Pensado para la vista pública
 * de un restaurante (menú digital), donde necesitas todo de una vez.
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
  return data as CategoryWithProducts[]
}