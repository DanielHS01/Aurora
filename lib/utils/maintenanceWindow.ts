import type { MaintenanceAnnouncement } from '@/lib/queries/platformAdmin'

// La hora del aviso es hora de Colombia: UTC-5 fijo, sin horario de verano.
// Se fija el desfase explícito para no depender de la zona del servidor.
const COLOMBIA_OFFSET = '-05:00'

export function getMaintenanceWindow(announcement: MaintenanceAnnouncement) {
  const time = announcement.scheduled_time.slice(0, 8)
  const start = new Date(`${announcement.scheduled_date}T${time}${COLOMBIA_OFFSET}`)
  const end = new Date(start.getTime() + announcement.duration_minutes * 60000)
  return { start, end }
}

export function isAnnouncementVisible(announcement: MaintenanceAnnouncement | null): boolean {
  if (!announcement || !announcement.is_active) return false
  return Date.now() <= getMaintenanceWindow(announcement).end.getTime()
}

export function isMaintenanceActive(announcement: MaintenanceAnnouncement | null): boolean {
  if (!announcement || !announcement.is_active) return false
  const { start, end } = getMaintenanceWindow(announcement)
  const now = Date.now()
  return now >= start.getTime() && now <= end.getTime()
}