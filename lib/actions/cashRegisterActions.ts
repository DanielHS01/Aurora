'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserBusiness } from '@/lib/queries/businesses'
import { getCurrentUserRole } from '@/lib/queries/business-users'
import { getCurrentUser } from '@/lib/auth/session'
import { assertNotInMaintenance } from '@/lib/utils/maintenanceGuard'
import { openCashRegisterSession, closeCashRegisterSession } from '@/lib/queries/cashRegister'
import type { BusinessRole } from '@/lib/types'

const ROLES_THAT_CAN_MANAGE_CASH: BusinessRole[] = ['owner', 'admin', 'manager', 'cashier']

async function requireCashRegisterAccess(businessId: string) {
  await assertNotInMaintenance()
  const role = await getCurrentUserRole(businessId)
  if (!role || !ROLES_THAT_CAN_MANAGE_CASH.includes(role)) {
    throw new Error('No tienes permiso para gestionar la caja')
  }
}

export async function openCashRegisterAction(formData: FormData) {
  const business = await getCurrentUserBusiness()
  if (!business) throw new Error('No se encontró tu negocio')

  await requireCashRegisterAccess(business.id)

  const user = await getCurrentUser()
  if (!user) throw new Error('No autenticado')

  const startingCash = Number(formData.get('startingCash'))
  if (isNaN(startingCash) || startingCash < 0) {
    throw new Error('El monto inicial debe ser un número válido')
  }

  await openCashRegisterSession(business.id, user.id, startingCash)
  revalidatePath('/dashboard/cash-register')
}

export async function closeCashRegisterAction(sessionId: string, formData: FormData) {
  const business = await getCurrentUserBusiness()
  if (!business) throw new Error('No se encontró tu negocio')

  await requireCashRegisterAccess(business.id)

  const user = await getCurrentUser()
  if (!user) throw new Error('No autenticado')

  const countedCash = Number(formData.get('countedCash'))
  if (isNaN(countedCash) || countedCash < 0) {
    throw new Error('El monto contado debe ser un número válido')
  }

  const notes = (formData.get('notes') as string)?.trim() || null

  await closeCashRegisterSession(sessionId, user.id, countedCash, notes)
  revalidatePath('/dashboard/cash-register')
}