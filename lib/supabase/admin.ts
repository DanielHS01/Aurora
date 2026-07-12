import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

/**
 * Cliente con privilegios de service_role — IGNORA POR COMPLETO las
 * políticas de RLS. Úsalo únicamente para operaciones administrativas
 * controladas por tu propio código (crear negocio + owner, procesos de
 * onboarding, webhooks de pagos, etc.).
 *
 * NUNCA:
 * - lo importes en un Client Component ('use client')
 * - lo expongas en una Route Handler sin validar antes quién hace la
 *   petición (este cliente no sabe quién es el usuario, confía en que
 *   TÚ ya validaste eso antes de llamarlo)
 *
 * Solo se usa desde Server Actions o Route Handlers, y siempre después
 * de verificar auth con getCurrentUser() de lib/auth/session.ts.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}