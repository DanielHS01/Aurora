import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type CashRegisterSession = {
  id: string
  business_id: string
  opened_by: string
  opened_at: string
  starting_cash: number
  status: 'open' | 'closed'
  closed_by: string | null
  closed_at: string | null
  counted_cash: number | null
  notes: string | null
}

export async function getOpenCashSession(businessId: string): Promise<CashRegisterSession | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('cash_register_sessions')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'open')
    .maybeSingle()

  return data
}

export async function openCashRegisterSession(
  businessId: string,
  userId: string,
  startingCash: number
): Promise<CashRegisterSession> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cash_register_sessions')
    .insert({ business_id: businessId, opened_by: userId, starting_cash: startingCash })
    .select()
    .single()

  if (error) {
    // El índice único de la DB rechaza esto si ya hay una caja abierta
    // — se traduce a un mensaje claro en vez del error crudo de Postgres.
    if (error.message.includes('one_open_session_per_business')) {
      throw new Error('Ya hay una caja abierta para este negocio')
    }
    throw new Error(`Error abriendo caja: ${error.message}`)
  }

  return data
}

export type CashSessionSummary = CashRegisterSession & {
  salesByMethod: Record<string, number>
  totalSales: number
  transactionCount: number
  expectedCash: number
  variance: number | null
}

export async function getCashSessionSummary(sessionId: string): Promise<CashSessionSummary | null> {
  const supabase = await createClient()

  const [{ data: session }, { data: payments }] = await Promise.all([
    supabase.from('cash_register_sessions').select('*').eq('id', sessionId).single(),
    supabase.from('payments').select('amount, method').eq('cash_session_id', sessionId).eq('status', 'paid'),
  ])

  if (!session) return null

  const salesByMethod: Record<string, number> = {}
  let totalSales = 0
  for (const p of payments ?? []) {
    const amount = Number(p.amount)
    salesByMethod[p.method] = (salesByMethod[p.method] ?? 0) + amount
    totalSales += amount
  }

  const cashSales = salesByMethod['cash'] ?? 0
  const expectedCash = Number(session.starting_cash) + cashSales

  return {
    ...session,
    salesByMethod,
    totalSales,
    transactionCount: payments?.length ?? 0,
    expectedCash,
    variance: session.counted_cash !== null ? Number(session.counted_cash) - expectedCash : null,
  }
}

export async function closeCashRegisterSession(
  sessionId: string,
  userId: string,
  countedCash: number,
  notes: string | null
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cash_register_sessions')
    .update({
      status: 'closed',
      closed_by: userId,
      closed_at: new Date().toISOString(),
      counted_cash: countedCash,
      notes,
    })
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Error cerrando caja: ${error.message}`)
  }
}

export async function getCashSessionHistory(
  businessId: string,
  limit: number = 20
): Promise<CashRegisterSession[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('cash_register_sessions')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

/**
 * Adjunta un pago a la caja abierta en este momento — se llama justo
 * después de recordPayment(). Si no hay ninguna caja abierta, no hace
 * nada (el pago queda sin sesión, visible como "venta sin caja abierta"
 * para que el negocio corrija ese hábito operativo, sin bloquear el
 * cobro en sí — nunca queremos impedir que alguien cobre por un olvido
 * administrativo).
 */
export async function attachPaymentToCashSession(paymentId: string, businessId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: session } = await supabase
    .from('cash_register_sessions')
    .select('id')
    .eq('business_id', businessId)
    .eq('status', 'open')
    .maybeSingle()

  if (!session) return

  await supabase.from('payments').update({ cash_session_id: session.id }).eq('id', paymentId)
}