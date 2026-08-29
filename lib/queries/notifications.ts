import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getUnreadNotifications(businessId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_notifications')
    .select('id, title, message, created_at')
    .eq('business_id', businessId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  await supabase
    .from('business_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
}

// Usa admin client porque la llama el cron job, sin usuario autenticado
export async function createNotification(
  businessId: string,
  title: string,
  message: string
) {
  const supabase = createAdminClient()
  await supabase.from('business_notifications').insert({
    business_id: businessId,
    title,
    message,
  })
}