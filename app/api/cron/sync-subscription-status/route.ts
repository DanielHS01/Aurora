// app/api/cron/sync-subscription-status/route.ts (nuevo)
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Cualquier suscripción "active" cuyo periodo ya venció, sin que
  // nadie haya pagado, pasa a "past_due" — refleja la realidad, no
  // ejecuta el bloqueo en sí (eso ya lo hace get_business_lock_status
  // por fecha, de forma independiente a este campo).
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('status', 'active')
    .lt('current_period_end', new Date().toISOString())
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, updated: data?.length ?? 0 })
}