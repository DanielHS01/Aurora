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
// ============================================================================
// COMPARACIÓN DE PERIODOS
// ============================================================================

export type PeriodComparison = {
  current: { revenue: number; orderCount: number }
  previous: { revenue: number; orderCount: number }
  revenueChangePercent: number | null
  orderChangePercent: number | null
}

function getPeriodRange(period: 'day' | 'week' | 'month') {
  const now = new Date()
  let currentStart: Date
  let previousStart: Date
  let previousEnd: Date

  if (period === 'day') {
    currentStart = new Date(now)
    currentStart.setHours(0, 0, 0, 0)
    previousStart = new Date(currentStart)
    previousStart.setDate(previousStart.getDate() - 1)
    previousEnd = new Date(currentStart)
  } else if (period === 'week') {
    const dayOfWeek = now.getDay()
    currentStart = new Date(now)
    currentStart.setDate(now.getDate() - dayOfWeek)
    currentStart.setHours(0, 0, 0, 0)
    previousStart = new Date(currentStart)
    previousStart.setDate(previousStart.getDate() - 7)
    previousEnd = new Date(currentStart)
  } else {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    previousEnd = new Date(currentStart)
  }

  return { currentStart, previousStart, previousEnd }
}

async function getRevenueAndOrders(
  businessId: string,
  from: Date,
  to: Date
): Promise<{ revenue: number; orderCount: number }> {
  const supabase = await createClient()

  const [{ data: payments }, { count }] = await Promise.all([
    supabase
      .from('payments')
      .select('amount')
      .eq('business_id', businessId)
      .eq('status', 'paid')
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString()),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString()),
  ])

  const revenue = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
  return { revenue, orderCount: count ?? 0 }
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

export async function getPeriodComparison(
  businessId: string,
  period: 'day' | 'week' | 'month'
): Promise<PeriodComparison> {
  const { currentStart, previousStart, previousEnd } = getPeriodRange(period)
  const now = new Date()

  const [current, previous] = await Promise.all([
    getRevenueAndOrders(businessId, currentStart, now),
    getRevenueAndOrders(businessId, previousStart, previousEnd),
  ])

  return {
    current,
    previous,
    revenueChangePercent: percentChange(current.revenue, previous.revenue),
    orderChangePercent: percentChange(current.orderCount, previous.orderCount),
  }
}

// ============================================================================
// PLATOS MÁS PEDIDOS
// ============================================================================

export type TopProduct = {
  productName: string
  quantitySold: number
  revenue: number
}

export async function getTopProducts(
  businessId: string,
  days: number = 30,
  limit: number = 10
): Promise<TopProduct[]> {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('order_items')
    .select('product_name, quantity, total_price, orders!inner(business_id, created_at, status)')
    .eq('orders.business_id', businessId)
    .neq('orders.status', 'cancelled')
    .gte('orders.created_at', startDate.toISOString())

  if (error || !data) return []

  const grouped = new Map<string, { quantitySold: number; revenue: number }>()
  for (const item of data) {
    const existing = grouped.get(item.product_name) ?? { quantitySold: 0, revenue: 0 }
    existing.quantitySold += item.quantity
    existing.revenue += Number(item.total_price ?? 0)
    grouped.set(item.product_name, existing)
  }

  return Array.from(grouped.entries())
    .map(([productName, stats]) => ({ productName, ...stats }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, limit)
}

// ============================================================================
// VENTAS POR HORA DEL DÍA
// ============================================================================

export type HourlyRevenue = { hour: number; revenue: number }

export async function getRevenueByHour(
  businessId: string,
  days: number = 30
): Promise<HourlyRevenue[]> {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('payments')
    .select('amount, created_at')
    .eq('business_id', businessId)
    .eq('status', 'paid')
    .gte('created_at', startDate.toISOString())

  if (error || !data) return []

  const buckets = new Map<number, number>()
  for (let h = 0; h < 24; h++) buckets.set(h, 0)

  for (const payment of data) {
    const hour = new Date(payment.created_at ?? '').getHours()
    buckets.set(hour, (buckets.get(hour) ?? 0) + Number(payment.amount))
  }

  return Array.from(buckets.entries()).map(([hour, revenue]) => ({ hour, revenue }))
}

// ============================================================================
// VENTAS POR DÍA DE LA SEMANA
// ============================================================================

export type DayOfWeekRevenue = { dayIndex: number; dayName: string; revenue: number }

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export async function getRevenueByDayOfWeek(
  businessId: string,
  days: number = 30
): Promise<DayOfWeekRevenue[]> {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('payments')
    .select('amount, created_at')
    .eq('business_id', businessId)
    .eq('status', 'paid')
    .gte('created_at', startDate.toISOString())

  if (error || !data) return []

  const buckets = new Map<number, number>()
  for (let d = 0; d < 7; d++) buckets.set(d, 0)

  for (const payment of data) {
    const dayIndex = new Date(payment.created_at ?? '').getDay()
    buckets.set(dayIndex, (buckets.get(dayIndex) ?? 0) + Number(payment.amount))
  }

  return Array.from(buckets.entries()).map(([dayIndex, revenue]) => ({
    dayIndex,
    dayName: DAY_NAMES[dayIndex],
    revenue,
  }))
}