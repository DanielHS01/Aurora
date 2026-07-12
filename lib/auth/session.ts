import { createClient } from '@/lib/supabase/server'
import type { Business, BusinessRole } from '@/lib/types'

/**
 * Devuelve el usuario autenticado actual, o null si no hay sesión.
 * Úsalo al inicio de cualquier Server Component/Action que necesite saber
 * "quién está pidiendo esto".
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

/**
 * Un negocio al que el usuario tiene acceso, junto con su rol en ese negocio.
 */
export type UserBusiness = {
  business: Business
  role: BusinessRole
}

/**
 * Devuelve TODOS los negocios a los que el usuario autenticado tiene acceso,
 * cada uno con su rol. Un usuario puede pertenecer a varios negocios
 * (soportado por business_users), así que esto SIEMPRE devuelve un array,
 * nunca un solo negocio — incluso si hoy el usuario solo tiene uno.
 *
 * Esto alimenta un selector de negocio si el usuario administra más de uno.
 */
export async function getActiveBusinessForUser(): Promise<UserBusiness[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('business_users')
    .select('role, businesses(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error || !data) return []

  return data
    .filter((row) => row.businesses !== null)
    .map((row) => ({
      business: row.businesses as Business,
      role: row.role,
    }))
}

/**
 * Resuelve un negocio a partir de su slug (el que va en la URL,
 * ej. /mi-restaurante/dashboard → slug = "mi-restaurante").
 * Devuelve null si el slug no existe o el negocio está inactivo.
 */
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Verifica que el usuario autenticado tenga acceso a un business_id específico.
 * Úsalo como guard al INICIO de cada Server Action que mute datos, antes de
 * tocar la base de datos. RLS ya bloquea esto a nivel de Postgres, pero
 * validar aquí evita queries innecesarias y te permite dar un error claro
 * ("no tienes acceso a este negocio") en vez de un error genérico de RLS.
 */
export async function requireBusinessAccess(businessId: string): Promise<void> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data, error } = await supabase.rpc('user_has_business_access', {
    target_business_id: businessId,
  })

  if (error || !data) {
    throw new Error('No tienes acceso a este negocio')
  }
}