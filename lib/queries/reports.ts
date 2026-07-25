import { createClient } from '@/lib/supabase/server'

export type DailyRevenuePoint = {
  date: string // 'YYYY-MM-DD'
  total: number
}

/**
 * Ingresos por día de los últimos N días, basados en pagos con
 * status = 'paid'. Se agrupa en JS porque el volumen de un solo
 * negocio no justifica una función SQL aparte todavía.
 */
export async function getDailyRevenue(
  businessId: string,
  days: number = 7
): Promise<DailyRevenuePoint[]> {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (days - 1))
  startDate.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('payments')
    .select('amount, paid_at, created_at')
    .eq('business_id', businessId)
    .eq('status', 'paid')
    .gte('created_at', startDate.toISOString())

  if (error || !data) return []

  // Arma el rango completo de días (incluyendo los que tuvieron $0),
  // para que la gráfica no "salte" fechas sin ventas.
  const buckets = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    buckets.set(d.toISOString().slice(0, 10), 0)
  }

  for (const payment of data) {
    const dateKey = (payment.paid_at ?? payment.created_at ?? '').slice(0, 10)
    if (buckets.has(dateKey)) {
      buckets.set(dateKey, (buckets.get(dateKey) ?? 0) + Number(payment.amount))
    }
  }

  return Array.from(buckets.entries()).map(([date, total]) => ({ date, total }))
}

export type RevenueSummary = {
  today: number
  last7Days: number
  thisMonth: number
}

export async function getRevenueSummary(businessId: string): Promise<RevenueSummary> {
  const supabase = await createClient()

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data, error } = await supabase
    .from('payments')
    .select('amount, created_at')
    .eq('business_id', businessId)
    .eq('status', 'paid')
    .gte('created_at', startOfMonth.toISOString())

  if (error || !data) {
    return { today: 0, last7Days: 0, thisMonth: 0 }
  }

  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  let today = 0
  let last7Days = 0
  let thisMonth = 0

  for (const payment of data) {
    const paidAt = new Date(payment.created_at ?? '')
    const amount = Number(payment.amount)
    thisMonth += amount
    if (paidAt >= sevenDaysAgo) last7Days += amount
    if (paidAt >= startOfToday) today += amount
  }

  return { today, last7Days, thisMonth }
}

/**
 * Conteo de pedidos completados por día, últimos N días — para
 * comparar volumen de pedidos contra ingresos en Reportes.
 */
export async function getOrderCountsByDay(
  businessId: string,
  days: number = 7
): Promise<{ date: string; count: number }[]> {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (days - 1))
  startDate.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('orders')
    .select('created_at')
    .eq('business_id', businessId)
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())

  if (error || !data) return []

  const buckets = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    buckets.set(d.toISOString().slice(0, 10), 0)
  }

  for (const order of data) {
    const dateKey = (order.created_at ?? '').slice(0, 10)
    if (buckets.has(dateKey)) {
      buckets.set(dateKey, (buckets.get(dateKey) ?? 0) + 1)
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }))
}

/**
 * Reservas confirmadas próximas (hoy en adelante) — un vistazo rápido
 * para Reportes, sin construir todavía la gestión completa de reservas.
 */
export async function getUpcomingReservationsCount(businessId: string): Promise<number> {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { count, error } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'confirmed')
    .gte('reservation_date', today)

  if (error) return 0
  return count ?? 0
}