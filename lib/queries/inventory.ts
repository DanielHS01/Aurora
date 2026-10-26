import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { InventoryUnit } from '@/lib/utils/inventory'
import { UserFacingError } from '@/lib/errors'

export type InventoryItem = {
  id: string
  business_id: string
  name: string
  unit: InventoryUnit
  stock_quantity: number
  min_stock: number
}

export type ComponentLine = { product_id: string; item_id: string; quantity: number }

const ITEM_COLUMNS = 'id, business_id, name, unit, stock_quantity, min_stock'

function toItem(row: {
  id: string
  business_id: string
  name: string
  unit: string
  stock_quantity: number
  min_stock: number
}): InventoryItem {
  return {
    ...row,
    unit: row.unit as InventoryUnit,
    stock_quantity: Number(row.stock_quantity),
    min_stock: Number(row.min_stock),
  }
}

export async function getInventoryItems(businessId: string): Promise<InventoryItem[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('inventory_items')
    .select(ITEM_COLUMNS)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (data ?? []).map(toItem)
}

export async function getProductComponents(businessId: string): Promise<ComponentLine[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('product_components')
    .select('product_id, item_id, quantity')
    .eq('business_id', businessId)

  return (data ?? []).map((l) => ({ ...l, quantity: Number(l.quantity) }))
}

// ---------------------------------------------------------------
// Escrituras — siempre con admin client, DESPUÉS de validar rol y
// pertenencia al negocio en la Server Action.
// ---------------------------------------------------------------

export async function adjustInventoryStock(params: {
  itemId: string
  businessId: string
  mode: 'add' | 'remove' | 'set'
  quantity: number
  note: string | null
  userId: string
}): Promise<number> {
  const supabase = createAdminClient()

  const { data: item } = await supabase
    .from('inventory_items')
    .select('id')
    .eq('id', params.itemId)
    .eq('business_id', params.businessId)
    .maybeSingle()

  if (!item) throw new Error('Insumo no encontrado')

  const { data, error } = await supabase.rpc('adjust_inventory_stock', {
    p_item_id: params.itemId,
    p_quantity: params.quantity,
    p_mode: params.mode,
    p_note: params.note,
    p_user_id: params.userId,
  })

  if (error) throw new Error(error.message)
  return Number(data)
}

export async function createInventoryItem(params: {
  businessId: string
  name: string
  unit: InventoryUnit
  initialStock: number
  minStock: number
  userId: string
}): Promise<InventoryItem> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      business_id: params.businessId,
      name: params.name,
      unit: params.unit,
      min_stock: params.minStock,
    })
    .select(ITEM_COLUMNS)
    .single()

  if (error || !data) {
    if (error?.code === '23505') throw new Error('Ya existe un insumo con ese nombre')
    throw new Error(`Error creando insumo: ${error?.message}`)
  }

  const item = toItem(data)

  if (params.initialStock > 0) {
    item.stock_quantity = await adjustInventoryStock({
      itemId: item.id,
      businessId: params.businessId,
      mode: 'add',
      quantity: params.initialStock,
      note: 'Stock inicial',
      userId: params.userId,
    })
  }

  return item
}

export async function updateInventoryItem(
  itemId: string,
  businessId: string,
  name: string,
  minStock: number
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('inventory_items')
    .update({ name, min_stock: minStock })
    .eq('id', itemId)
    .eq('business_id', businessId)

  if (error) {
    if (error.code === '23505') throw new Error('Ya existe un insumo con ese nombre')
    throw new Error(`Error actualizando insumo: ${error.message}`)
  }
}

export async function archiveInventoryItem(itemId: string, businessId: string): Promise<void> {
  const supabase = createAdminClient()

  // Solo cuentan las recetas de platos activos: un plato desactivado no
  // debe impedir archivar un insumo (al reactivarlo se limpia su receta).
  const { data: lines } = await supabase
    .from('product_components')
    .select('product_id')
    .eq('item_id', itemId)
    .eq('business_id', businessId)

  const productIds = [...new Set((lines ?? []).map((l) => l.product_id))]

  let activeRecipes = 0
  if (productIds.length > 0) {
    const { data: activeProducts } = await supabase
      .from('products')
      .select('id')
      .in('id', productIds)
      .or('is_available.is.null,is_available.eq.true')
    activeRecipes = activeProducts?.length ?? 0
  }

  if (activeRecipes > 0) {
    throw new UserFacingError(
      `Este insumo se usa en ${activeRecipes} receta(s) de platos activos. Quítalo de ellas antes de archivarlo.`
    )
  }

  const { error } = await supabase
    .from('inventory_items')
    .update({ is_active: false })
    .eq('id', itemId)
    .eq('business_id', businessId)

  if (error) throw new Error(`Error archivando insumo: ${error.message}`)
}

export async function saveProductComponents(
  productId: string,
  businessId: string,
  lines: { item_id: string; quantity: number }[]
): Promise<void> {
  const supabase = createAdminClient()

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('business_id', businessId)
    .maybeSingle()

  if (!product) throw new UserFacingError('Producto no encontrado')

  const ids = lines.map((l) => l.item_id)
  if (new Set(ids).size !== ids.length) {
    throw new UserFacingError('Hay un insumo repetido en la receta')
  }

  if (lines.length > 0) {
    const { data: valid } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .in('id', ids)

    if ((valid?.length ?? 0) !== ids.length) throw new UserFacingError('La receta tiene insumos inválidos')

    // Primero se guardan los valores nuevos: si algo falla, la receta anterior no se pierde
    const { error: upsertError } = await supabase.from('product_components').upsert(
      lines.map((l) => ({
        business_id: businessId,
        product_id: productId,
        item_id: l.item_id,
        quantity: l.quantity,
      })),
      { onConflict: 'product_id,item_id' }
    )
    if (upsertError) throw new Error(`Error guardando receta: ${upsertError.message}`)
  }

  let removal = supabase.from('product_components').delete().eq('product_id', productId)
  if (ids.length > 0) {
    removal = removal.not('item_id', 'in', `(${ids.join(',')})`)
  }
  const { error: deleteError } = await removal
  if (deleteError) throw new Error(`Error actualizando receta: ${deleteError.message}`)
}