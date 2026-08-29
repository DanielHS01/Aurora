import { createAdminClient } from '@/lib/supabase/admin'
import { isAnnouncementVisible } from '@/lib/utils/maintenanceWindow'

export type BusinessOverview = {
  id: string
  name: string
  business_type: string | null
  is_active: boolean
  created_at: string | null
  subscriptionStatus: string | null
  daysUntilRenewal: number | null
}

export async function getAllBusinessesOverview(): Promise<BusinessOverview[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('businesses')
    .select(
      'id, name, business_type, is_active, created_at, subscriptions(status, current_period_end)'
    )
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((b) => {
    const sub = Array.isArray(b.subscriptions) ? b.subscriptions[0] : b.subscriptions
    let daysUntilRenewal: number | null = null

    if (sub?.current_period_end) {
      const diffMs = new Date(sub.current_period_end).getTime() - Date.now()
      daysUntilRenewal = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    }

    return {
      id: b.id,
      name: b.name,
      business_type: b.business_type,
      is_active: b.is_active ?? false,
      created_at: b.created_at,
      subscriptionStatus: sub?.status ?? null,
      daysUntilRenewal,
    }
  })
}

// ============================================================
// Mantenimiento
// ============================================================

export type MaintenanceAnnouncement = {
  id: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: number
  extra_message: string | null
  is_active: boolean
}

export async function getActiveMaintenanceAnnouncement(): Promise<MaintenanceAnnouncement | null> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('maintenance_announcements')
    .select('id, scheduled_date, scheduled_time, duration_minutes, extra_message, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Ya no devuelve el aviso si la ventana de mantenimiento ya pasó —
  // "se desactiva solo" sin que nadie tenga que tocar la base de datos.
  return data && isAnnouncementVisible(data) ? data : null
}

export async function createMaintenanceAnnouncement(
  createdBy: string,
  scheduledDate: string,
  scheduledTime: string,
  durationMinutes: number,
  extraMessage: string | null
): Promise<void> {
  const supabase = createAdminClient()

  // Desactiva cualquier aviso anterior — solo debe haber uno activo a
  // la vez, para no mostrar dos banners contradictorios.
  await supabase
    .from('maintenance_announcements')
    .update({ is_active: false })
    .eq('is_active', true)

  const { error } = await supabase.from('maintenance_announcements').insert({
    scheduled_date: scheduledDate,
    scheduled_time: scheduledTime,
    duration_minutes: durationMinutes,
    extra_message: extraMessage,
    created_by: createdBy,
  })

  if (error) {
    throw new Error(`Error creando aviso de mantenimiento: ${error.message}`)
  }
}

export async function deactivateMaintenanceAnnouncement(id: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('maintenance_announcements')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    throw new Error(`Error desactivando aviso: ${error.message}`)
  }
}