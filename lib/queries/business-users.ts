import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/session'
import type { BusinessUser, BusinessRole, Profile } from '@/lib/types'

/**
 * Un usuario dentro de un negocio, con su perfil ya incluido —
 * lo que normalmente necesitas para pintar una tabla de "miembros del equipo".
 */
export type BusinessMember = BusinessUser & {
  profile: Profile
}

/**
 * Roles que pueden gestionar otros usuarios (invitar, cambiar rol, desactivar).
 * Ajusta esta lista si tu lógica de negocio define otros permisos.
 */
const ROLES_THAT_MANAGE_USERS: BusinessRole[] = ['owner', 'admin']

/**
 * Trae todos los usuarios activos de un negocio, con su perfil.
 * Protegido por RLS normalmente (el usuario ya tiene acceso confirmado).
 */
export async function getBusinessUsers(businessId: string): Promise<BusinessMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_users')
    .select('*, profile:profiles(*)')
    .eq('business_id', businessId)
    .eq('is_active', true)

  if (error || !data) return []
  return data as BusinessMember[]
}

/**
 * Devuelve el rol del usuario actual dentro de un negocio específico,
 * o null si no pertenece a ese negocio. Útil para chequeos de permisos
 * en Server Actions y para mostrar/ocultar botones en la UI.
 */
export async function getCurrentUserRole(businessId: string): Promise<BusinessRole | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('business_users')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data.role
}

/**
 * Valida que el usuario actual tenga permiso para gestionar usuarios
 * (invitar, cambiar rol, desactivar) en un negocio. Lanza si no lo tiene.
 * Úsalo al inicio de cada función de este archivo que mute business_users.
 */
async function requireUserManagementPermission(businessId: string): Promise<void> {
  const role = await getCurrentUserRole(businessId)

  if (!role || !ROLES_THAT_MANAGE_USERS.includes(role)) {
    throw new Error('No tienes permiso para gestionar usuarios de este negocio')
  }
}

/**
 * Agrega un usuario existente (ya registrado en auth.users/profiles) a un
 * negocio con un rol específico. No crea el usuario — asume que ya existe
 * un profile con ese id (ej. porque ya se registró y solo falta vincularlo
 * a este negocio).
 *
 * Usa admin client porque no hay política de INSERT en business_users;
 * la validación de permiso ocurre aquí, en código.
 */
export async function addUserToBusiness(
  businessId: string,
  targetUserId: string,
  role: BusinessRole
): Promise<BusinessUser> {
  await requireUserManagementPermission(businessId)

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('business_users')
    .insert({
      business_id: businessId,
      user_id: targetUserId,
      role,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error agregando usuario al negocio: ${error?.message}`)
  }
  return data
}

/**
 * Cambia el rol de un usuario dentro de un negocio.
 * Evita dejar el negocio sin ningún "owner" activo.
 */
export async function updateUserRole(
  businessId: string,
  targetUserId: string,
  newRole: BusinessRole
): Promise<BusinessUser> {
  await requireUserManagementPermission(businessId)

  const supabase = createAdminClient()

  if (newRole !== 'owner') {
    const wasOnlyOwner = await isOnlyActiveOwner(businessId, targetUserId)
    if (wasOnlyOwner) {
      throw new Error('No puedes quitar el rol de owner al único owner del negocio')
    }
  }

  const { data, error } = await supabase
    .from('business_users')
    .update({ role: newRole })
    .eq('business_id', businessId)
    .eq('user_id', targetUserId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando rol: ${error?.message}`)
  }
  return data
}

/**
 * Desactiva a un usuario dentro de un negocio (soft-delete vía is_active).
 * No lo borra de business_users; solo revoca su acceso.
 */
export async function deactivateBusinessUser(
  businessId: string,
  targetUserId: string
): Promise<void> {
  await requireUserManagementPermission(businessId)

  const wasOnlyOwner = await isOnlyActiveOwner(businessId, targetUserId)
  if (wasOnlyOwner) {
    throw new Error('No puedes desactivar al único owner del negocio')
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('business_users')
    .update({ is_active: false })
    .eq('business_id', businessId)
    .eq('user_id', targetUserId)

  if (error) {
    throw new Error(`Error desactivando usuario: ${error.message}`)
  }
}

/**
 * Reactiva a un usuario previamente desactivado.
 */
export async function reactivateBusinessUser(
  businessId: string,
  targetUserId: string
): Promise<void> {
  await requireUserManagementPermission(businessId)

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('business_users')
    .update({ is_active: true })
    .eq('business_id', businessId)
    .eq('user_id', targetUserId)

  if (error) {
    throw new Error(`Error reactivando usuario: ${error.message}`)
  }
}

/**
 * Chequea si el usuario dado es el ÚNICO owner activo del negocio.
 * Se usa como salvaguarda antes de degradar o desactivar a alguien.
 */
async function isOnlyActiveOwner(businessId: string, userId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('business_users')
    .select('user_id')
    .eq('business_id', businessId)
    .eq('role', 'owner')
    .eq('is_active', true)

  if (error || !data) return false

  const owners = data.map((row) => row.user_id)
  return owners.length === 1 && owners[0] === userId
}