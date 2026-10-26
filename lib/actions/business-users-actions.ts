'use server'

import { revalidatePath } from 'next/cache'
import { UserFacingError } from '@/lib/errors'
import { runAction, type ActionResult } from '@/lib/utils/actionResult'
import { assertNotInMaintenance } from '@/lib/utils/maintenanceGuard'
import { translateAuthError } from '@/lib/utils/auth-errors'
import { getCurrentUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  updateUserRole,
  deactivateBusinessUser,
  reactivateBusinessUser,
  getCurrentUserRole,
  inviteBusinessUser,
} from '@/lib/queries/business-users'
import { getCurrentUserBusiness } from '@/lib/queries/businesses'
import type { BusinessRole } from '@/lib/types'

const ROLES_THAT_CAN_MANAGE_USERS: BusinessRole[] = ['owner', 'admin']
const ALLOWED_EMPLOYEE_ROLES: BusinessRole[] = [
  'admin',
  'manager',
  'waiter',
  'kitchen',
  'cashier',
  'viewer',
]

async function requireTeamManagement() {
  await assertNotInMaintenance()

  const business = await getCurrentUserBusiness()
  if (!business) throw new UserFacingError('No se encontró tu negocio')

  const role = await getCurrentUserRole(business.id)
  if (!role || !ROLES_THAT_CAN_MANAGE_USERS.includes(role)) {
    throw new UserFacingError('No tienes permiso para gestionar el equipo')
  }

  return business
}

/** El objetivo debe ser miembro del negocio, no ser quien llama y no ser el dueño. */
async function assertManageableMember(businessId: string, targetUserId: string) {
  const user = await getCurrentUser()
  if (user && user.id === targetUserId) {
    throw new UserFacingError('No puedes modificar tu propio acceso')
  }

  const supabase = createAdminClient()
  const { data: target } = await supabase
    .from('business_users')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', targetUserId)
    .maybeSingle()

  if (!target) throw new UserFacingError('Ese usuario no pertenece a tu negocio')
  if (target.role === 'owner') {
    throw new UserFacingError('No se puede modificar al dueño del negocio')
  }
}

export async function inviteEmployeeAction(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const business = await requireTeamManagement()

    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const fullName = (formData.get('fullName') as string)?.trim()
    const employeeRole = formData.get('role') as BusinessRole

    if (!email) throw new UserFacingError('El correo es obligatorio')
    if (!fullName) throw new UserFacingError('El nombre es obligatorio')
    if (!ALLOWED_EMPLOYEE_ROLES.includes(employeeRole)) {
      throw new UserFacingError('Selecciona un rol válido')
    }

    try {
      await inviteBusinessUser(business.id, email, fullName, employeeRole)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''

      if (/already|registered/i.test(message)) {
        throw new UserFacingError(
          'Ese correo ya tiene una cuenta en Aurora. Si es un empleado que desactivaste, reactívalo desde esta tabla.'
        )
      }
      if (/rate limit|once every/i.test(message)) {
        throw new UserFacingError(translateAuthError(message))
      }
      throw err
    }

    revalidatePath('/dashboard/team')
  })
}

export async function updateEmployeeRoleAction(
  targetUserId: string,
  newRole: BusinessRole
): Promise<ActionResult> {
  return runAction(async () => {
    const business = await requireTeamManagement()

    if (!ALLOWED_EMPLOYEE_ROLES.includes(newRole)) {
      throw new UserFacingError('Selecciona un rol válido')
    }
    await assertManageableMember(business.id, targetUserId)

    await updateUserRole(business.id, targetUserId, newRole)
    revalidatePath('/dashboard/team')
  })
}

export async function deactivateEmployeeAction(targetUserId: string): Promise<ActionResult> {
  return runAction(async () => {
    const business = await requireTeamManagement()
    await assertManageableMember(business.id, targetUserId)

    await deactivateBusinessUser(business.id, targetUserId)
    revalidatePath('/dashboard/team')
  })
}

export async function reactivateEmployeeAction(targetUserId: string): Promise<ActionResult> {
  return runAction(async () => {
    const business = await requireTeamManagement()
    await assertManageableMember(business.id, targetUserId)

    await reactivateBusinessUser(business.id, targetUserId)
    revalidatePath('/dashboard/team')
  })
}