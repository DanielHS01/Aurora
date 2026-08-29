import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/session'

export async function isPlatformAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = createAdminClient()

  const { data } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  return Boolean(data)
}