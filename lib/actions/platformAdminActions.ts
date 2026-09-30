'use server'

import { revalidatePath } from 'next/cache'
import { isPlatformAdmin } from '@/lib/auth/platform'
import { getCurrentUser } from '@/lib/auth/session'
import {
  createMaintenanceAnnouncement,
  deactivateMaintenanceAnnouncement,
} from '@/lib/queries/platformAdmin'
import { saveFactusCredentials } from '@/lib/queries/factusCredentials'

export async function createMaintenanceAnnouncementAction(formData: FormData) {
  const isAdmin = await isPlatformAdmin()
  if (!isAdmin) {
    throw new Error('No tienes permiso para esta acción')
  }

  const user = await getCurrentUser()
  if (!user) throw new Error('No autenticado')

  const scheduledDate = formData.get('scheduledDate') as string
  const scheduledTime = formData.get('scheduledTime') as string
  const durationMinutes = Number(formData.get('durationMinutes'))
  const extraMessage = (formData.get('extraMessage') as string)?.trim() || null

  if (!scheduledDate || !scheduledTime) {
    throw new Error('La fecha y hora son obligatorias')
  }
  if (!durationMinutes || durationMinutes < 1) {
    throw new Error('La duración debe ser mayor a 0 minutos')
  }

  await createMaintenanceAnnouncement(
    user.id,
    scheduledDate,
    scheduledTime,
    durationMinutes,
    extraMessage
  )

  revalidatePath('/admin/maintenance')
  revalidatePath('/dashboard')
}

export async function deactivateMaintenanceAnnouncementAction(id: string) {
  const isAdmin = await isPlatformAdmin()
  if (!isAdmin) {
    throw new Error('No tienes permiso para esta acción')
  }

  await deactivateMaintenanceAnnouncement(id)
  revalidatePath('/admin/maintenance')
  revalidatePath('/dashboard')
}

/**
 * Guarda las credenciales de Factus de un negocio — solo superadmin.
 * A diferencia de Wompi, el negocio NUNCA pega sus propias
 * credenciales, las gestiona Aurora internamente (modelo de "aliado"
 * confirmado con Factus).
 */
export async function saveFactusCredentialsAdminAction(
  businessId: string,
  formData: FormData,
) {
  const isAdmin = await isPlatformAdmin()
  if (!isAdmin) {
    throw new Error('No tienes permiso para gestionar credenciales de Factus')
  }

  const username = (formData.get('username') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()
  const clientId = (formData.get('clientId') as string)?.trim()
  const clientSecret = (formData.get('clientSecret') as string)?.trim()
  const numberingRangeIdRaw = (formData.get('numberingRangeId') as string)?.trim()

  if (!username || !password || !clientId || !clientSecret) {
    throw new Error('Completa usuario, contraseña, client ID y client secret')
  }

  const numberingRangeId = numberingRangeIdRaw ? Number(numberingRangeIdRaw) : null
  if (numberingRangeIdRaw && Number.isNaN(numberingRangeId)) {
    throw new Error('El rango de numeración debe ser un número')
  }

  await saveFactusCredentials(
    businessId,
    { username, password, client_id: clientId, client_secret: clientSecret },
    numberingRangeId,
  )

  revalidatePath('/admin')
}