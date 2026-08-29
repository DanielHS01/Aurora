import { createAdminClient } from '@/lib/supabase/admin'
import type { AiTool } from '../core/types'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]

function formatTime12h(time24: string): string {
  const [hourStr, minuteStr] = time24.slice(0, 5).split(':')
  const hour = parseInt(hourStr, 10)
  const period = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${String(hour12).padStart(2, '0')}:${minuteStr} ${period}`
}

async function getBusinessHoursMessage(businessId: string): Promise<string> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('business_hours')
    .select('day_of_week, open_time, close_time')
    .eq('business_id', businessId)
    .order('open_time', { ascending: true })

  if (!data || data.length === 0) {
    return 'Aún no tenemos el horario configurado.'
  }

  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = now.toTimeString().slice(0, 5)
  const todayRanges = data.filter((r) => r.day_of_week === currentDay)
  const isOpenNow = todayRanges.some(
    (r) => currentTime >= r.open_time.slice(0, 5) && currentTime <= r.close_time.slice(0, 5)
  )

  const grouped = new Map<number, string[]>()
  for (const day of ORDERED_DAYS) {
    const ranges = data
      .filter((r) => r.day_of_week === day)
      .map((r) => `${formatTime12h(r.open_time)} - ${formatTime12h(r.close_time)}`)
    if (ranges.length > 0) grouped.set(day, ranges)
  }

  const scheduleLines = Array.from(grouped.entries())
    .map(([day, ranges]) => `- ${DAY_NAMES[day]}: ${ranges.join(' y ')}`)
    .join('\n')

  const status = isOpenNow ? 'Sí, estamos abiertos ahora mismo.' : 'En este momento estamos cerrados.'
  return `${status}\n\nNuestro horario de atención es:\n${scheduleLines}`
}

export const checkBusinessHoursTool: AiTool = {
  name: 'check_business_hours',
  description: 'Consulta el horario de atención del negocio y si está abierto en este momento.',
  input_schema: { type: 'object', properties: {}, required: [] },
  handler: async (context) => {
    return { message: await getBusinessHoursMessage(context.businessId) }
  },
}