'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserBusiness } from '@/lib/queries/businesses'
import { getCurrentUserRole } from '@/lib/queries/business-users'
import { replaceBusinessHours, type BusinessHourRange } from '@/lib/queries/businessHours'
import type { BusinessRole } from '@/lib/types'
import { assertNotInMaintenance } from '@/lib/utils/maintenanceGuard'

const ROLES_THAT_CAN_EDIT_HOURS: BusinessRole[] = ['owner', 'admin']

export async function updateBusinessHoursAction(ranges: BusinessHourRange[]) {
  const business = await getCurrentUserBusiness()
  if (!business) throw new Error('No se encontró tu negocio')

  await assertNotInMaintenance()

  const role = await getCurrentUserRole(business.id)
  if (!role || !ROLES_THAT_CAN_EDIT_HOURS.includes(role)) {
    throw new Error('No tienes permiso para editar el horario')
  }

  for (const r of ranges) {
    if (r.open_time >= r.close_time) {
      throw new Error('La hora de apertura debe ser antes que la de cierre')
    }
  }

  await replaceBusinessHours(business.id, ranges)
  revalidatePath('/dashboard/account')
}