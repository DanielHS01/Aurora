'use server'

import { revalidatePath } from 'next/cache'
import { isPlatformAdmin } from '@/lib/auth/platform'
import { getCurrentUser } from '@/lib/auth/session'
import {
  createMaintenanceAnnouncement,
  deactivateMaintenanceAnnouncement,
} from '@/lib/queries/platformAdmin'

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