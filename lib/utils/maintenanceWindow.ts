import type { MaintenanceAnnouncement } from '@/lib/queries/platformAdmin'

export function getMaintenanceWindow(announcement: MaintenanceAnnouncement) {
  const start = new Date(`${announcement.scheduled_date}T${announcement.scheduled_time}`)
  const end = new Date(start.getTime() + announcement.duration_minutes * 60000)
  return { start, end }
}

/**
 * El aviso debe seguir VISIBLE (banner informativo) desde que se crea
 * hasta que termina la ventana de mantenimiento — incluye el "antes"
 * (avisando con anticipación) y el "durante".
 */
export function isAnnouncementVisible(announcement: MaintenanceAnnouncement | null): boolean {
  if (!announcement || !announcement.is_active) return false
  const { end } = getMaintenanceWindow(announcement)
  return Date.now() <= end.getTime()
}

/**
 * El sistema debe BLOQUEARSE solo durante la ventana real — no antes,
 * no después. Como se calcula con la hora actual en cada verificación,
 * nunca requiere que nadie "apague" nada manualmente: en cuanto pasa
 * la hora de fin, esto empieza a devolver false por sí solo.
 */
export function isMaintenanceActive(announcement: MaintenanceAnnouncement | null): boolean {
  if (!announcement || !announcement.is_active) return false
  const { start, end } = getMaintenanceWindow(announcement)
  const now = Date.now()
  return now >= start.getTime() && now <= end.getTime()
}