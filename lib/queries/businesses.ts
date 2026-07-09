import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/session'
import type { Business, BusinessSettings } from '@/lib/types'
import type { TablesInsert, TablesUpdate } from '@/lib/types/database.types'

type BusinessInsert = TablesInsert<'businesses'>
type BusinessUpdate = TablesUpdate<'businesses'>
type BusinessSettingsUpdate = TablesUpdate<'business_settings'>

/**
 * Trae un negocio por su id. Devuelve null si no existe o RLS lo bloquea
 * (el usuario no tiene acceso).
 */
export async function getBusinessById(businessId: string): Promise<Business | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Trae la configuración (business_settings) de un negocio.
 * Puede no existir todavía si el negocio se creó sin settings iniciales.
 */
export async function getBusinessSettings(
  businessId: string
): Promise<BusinessSettings | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', businessId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Crea un negocio nuevo junto con su configuración inicial y agrega al
 * usuario actual como "owner" en business_users, todo en un solo flujo.
 *
 * Usa service_role porque el usuario aún no tiene fila en business_users
 * para el negocio que está creando (RLS lo bloquearía con el cliente normal
 * por el problema de huevo y gallina). La validación de "quién puede hacer
 * esto" pasa aquí, en código, no en RLS.
 *
 * El owner se resuelve internamente vía getCurrentUser() — nunca recibas
 * el ownerId como parámetro desde el cliente, o alguien podría asignar
 * el negocio a otro usuario.
 */
export async function createBusinessWithOwner(
  business: BusinessInsert
): Promise<Business> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('No autenticado')
  }

  const supabase = createAdminClient()

  const { data: newBusiness, error: businessError } = await supabase
    .from('businesses')
    .insert(business)
    .select()
    .single()

  if (businessError || !newBusiness) {
    throw new Error(`Error creando negocio: ${businessError?.message}`)
  }

  const { error: settingsError } = await supabase
    .from('business_settings')
    .insert({ business_id: newBusiness.id })

  if (settingsError) {
    throw new Error(`Error creando settings: ${settingsError.message}`)
  }

  const { error: ownerError } = await supabase.from('business_users').insert({
    business_id: newBusiness.id,
    user_id: user.id,
    role: 'owner',
  })

  if (ownerError) {
    throw new Error(`Error asignando owner: ${ownerError.message}`)
  }

  return newBusiness
}

/**
 * Actualiza datos generales del negocio (nombre, branding, contacto).
 * Corre con el cliente normal — RLS ya permite esto porque el usuario
 * tiene acceso confirmado al negocio (existe en business_users).
 */
export async function updateBusiness(
  businessId: string,
  updates: BusinessUpdate
): Promise<Business> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', businessId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando negocio: ${error?.message}`)
  }
  return data
}

/**
 * Actualiza configuración (impuestos, fees, canales habilitados).
 */
export async function updateBusinessSettings(
  businessId: string,
  updates: BusinessSettingsUpdate
): Promise<BusinessSettings> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_settings')
    .update(updates)
    .eq('business_id', businessId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando settings: ${error?.message}`)
  }
  return data
}