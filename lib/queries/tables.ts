import { createClient } from '@/lib/supabase/server'
import type { RestaurantTable, TableStatus, BusinessArea } from '@/lib/types'
import type { TablesInsert, TablesUpdate } from '@/lib/types/database.types'

type RestaurantTableInsert = TablesInsert<'restaurant_tables'>
type RestaurantTableUpdate = TablesUpdate<'restaurant_tables'>
type BusinessAreaInsert = TablesInsert<'business_areas'>

// ============================================================================
// ÁREAS (zonas del restaurante: terraza, salón, barra...)
// ============================================================================

export async function getBusinessAreas(businessId: string): Promise<BusinessArea[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_areas')
    .select('*')
    .eq('business_id', businessId)
    .order('name', { ascending: true })

  if (error || !data) return []
  return data
}

export async function createBusinessArea(area: BusinessAreaInsert): Promise<BusinessArea> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_areas')
    .insert(area)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error creando área: ${error?.message}`)
  }
  return data
}

// ============================================================================
// MESAS
// ============================================================================

/**
 * Trae todas las mesas de un negocio, opcionalmente filtradas por área.
 * Incluye el nombre del área ya resuelto (join), útil para pintar un plano
 * del restaurante agrupado por zona.
 */
export type RestaurantTableWithArea = RestaurantTable & {
  area: BusinessArea | null
}

export async function getRestaurantTables(
  businessId: string,
  areaId?: string
): Promise<RestaurantTableWithArea[]> {
  const supabase = await createClient()

  let query = supabase
    .from('restaurant_tables')
    .select('*, area:business_areas(*)')
    .eq('business_id', businessId)
    .order('table_number', { ascending: true })

  if (areaId) {
    query = query.eq('area_id', areaId)
  }

  const { data, error } = await query

  if (error || !data) return []
  return data as RestaurantTableWithArea[]
}

export async function getTableById(tableId: string): Promise<RestaurantTable | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('restaurant_tables')
    .select('*')
    .eq('id', tableId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Crea una mesa nueva. Si el number ya existe en el negocio, Postgres
 * rechaza el insert por el constraint único (business_id, table_number)
 * que agregamos en la migración — se traduce el error aquí.
 */
export async function createTable(table: RestaurantTableInsert): Promise<RestaurantTable> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('restaurant_tables')
    .insert(table)
    .select()
    .single()

  if (error) {
    if (error.message.includes('restaurant_tables_business_id_table_number_key')) {
      throw new Error(`Ya existe una mesa con el número "${table.table_number}"`)
    }
    throw new Error(`Error creando mesa: ${error.message}`)
  }
  if (!data) {
    throw new Error('Error creando mesa: no se recibió respuesta')
  }
  return data
}

export async function updateTable(
  tableId: string,
  updates: RestaurantTableUpdate
): Promise<RestaurantTable> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('restaurant_tables')
    .update(updates)
    .eq('id', tableId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando mesa: ${error?.message}`)
  }
  return data
}

/**
 * Cambia únicamente el estado de la mesa — la operación más frecuente en
 * el día a día del restaurante (sentar clientes, liberar mesa, reservarla).
 * Separarla de updateTable() deja explícito en el código de llamada qué
 * se está haciendo, en vez de un update genérico con un objeto parcial.
 */
export async function updateTableStatus(
  tableId: string,
  status: TableStatus
): Promise<RestaurantTable> {
  return updateTable(tableId, { status })
}

/**
 * Elimina una mesa. A diferencia de productos/categorías, no hay historial
 * que proteger a nivel de "qué mesa fue" — orders.table_id ya usa
 * ON DELETE SET NULL, así que pedidos pasados simplemente quedan sin mesa
 * asociada en vez de romperse. Aun así, evita borrar si tiene pedidos
 * activos (no completados/cancelados) para no perder el rastro de algo
 * en curso.
 */
export async function deleteTable(tableId: string): Promise<void> {
  const supabase = await createClient()

  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', tableId)
    .not('status', 'in', '(completed,cancelled)')
    .limit(1)

  if (activeOrders && activeOrders.length > 0) {
    throw new Error('No puedes eliminar una mesa con pedidos activos')
  }

  const { error } = await supabase.from('restaurant_tables').delete().eq('id', tableId)

  if (error) {
    throw new Error(`Error eliminando mesa: ${error.message}`)
  }
}

// ============================================================================
// VISTA RÁPIDA: mesas agrupadas por estado (para el plano del restaurante)
// ============================================================================

export type TablesByStatus = Record<TableStatus, RestaurantTableWithArea[]>

/**
 * Agrupa las mesas por su estado actual — pensado para pintar el plano
 * visual del restaurante (disponibles en verde, ocupadas en rojo, etc.)
 * sin que el frontend tenga que hacer el agrupamiento él mismo.
 */
export async function getTablesGroupedByStatus(businessId: string): Promise<TablesByStatus> {
  const tables = await getRestaurantTables(businessId)

  const grouped: TablesByStatus = {
    available: [],
    occupied: [],
    reserved: [],
    inactive: [],
  }

  for (const table of tables) {
    if (table.status) {
      grouped[table.status].push(table)
    }
  }

  return grouped
}