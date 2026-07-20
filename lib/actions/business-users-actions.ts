'use server'

import { revalidatePath } from 'next/cache'
import {
  addUserToBusiness,
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

export async function inviteEmployeeAction(formData: FormData) {
  const business = await getCurrentUserBusiness()
  if (!business) {
    throw new Error('No se encontró tu negocio')
  }

  const role = await getCurrentUserRole(business.id)
  if (!role || !ROLES_THAT_CAN_MANAGE_USERS.includes(role)) {
    throw new Error('No tienes permiso para invitar empleados')
  }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const fullName = (formData.get('fullName') as string)?.trim()
  const employeeRole = formData.get('role') as BusinessRole

  if (!email) {
    throw new Error('El correo es obligatorio')
  }
  if (!fullName) {
    throw new Error('El nombre es obligatorio')
  }
  if (!ALLOWED_EMPLOYEE_ROLES.includes(employeeRole)) {
    throw new Error('Selecciona un rol válido')
  }

  await inviteBusinessUser(business.id, email, fullName, employeeRole)

  revalidatePath('/dashboard/team')
}

export async function updateEmployeeRoleAction(
  targetUserId: string,
  newRole: BusinessRole
) {
  const business = await getCurrentUserBusiness()
  if (!business) {
    throw new Error('No se encontró tu negocio')
  }

  await updateUserRole(business.id, targetUserId, newRole)
  revalidatePath('/dashboard/team')
}

export async function deactivateEmployeeAction(targetUserId: string) {
  const business = await getCurrentUserBusiness()
  if (!business) {
    throw new Error('No se encontró tu negocio')
  }

  await deactivateBusinessUser(business.id, targetUserId)
  revalidatePath('/dashboard/team')
}

export async function reactivateEmployeeAction(targetUserId: string) {
  const business = await getCurrentUserBusiness()
  if (!business) {
    throw new Error('No se encontró tu negocio')
  }

  await reactivateBusinessUser(business.id, targetUserId)
  revalidatePath('/dashboard/team')
}