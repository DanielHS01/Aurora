import { createClient } from '@/lib/supabase/server'

let maintenanceCache: { value: boolean; expiresAt: number } | null = null
const CACHE_TTL_MS = 15000

async function checkMaintenanceActive(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<boolean> {
  const now = Date.now()
  if (maintenanceCache && maintenanceCache.expiresAt > now) {
    return maintenanceCache.value
  }
  const { data } = await supabase.rpc('is_maintenance_active')
  const value = Boolean(data)
  maintenanceCache = { value, expiresAt: now + CACHE_TTL_MS }
  return value
}

export async function assertNotInMaintenance(): Promise<void> {
  const supabase = await createClient()

  const maintenanceActive = await checkMaintenanceActive(supabase)
  if (!maintenanceActive) return

  const { data: isPlatformAdmin } = await supabase.rpc('is_current_user_platform_admin')
  if (isPlatformAdmin) return

  throw new Error('El sistema está en mantenimiento. Los cambios están deshabilitados temporalmente.')
}