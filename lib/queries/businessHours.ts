import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type BusinessHourRange = {
  day_of_week: number
  open_time: string
  close_time: string
}

export type WeeklyHours = Record<number, BusinessHourRange[]>

export async function getBusinessHours(businessId: string): Promise<WeeklyHours> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('business_hours')
    .select('day_of_week, open_time, close_time')
    .eq('business_id', businessId)
    .order('open_time', { ascending: true })

  if (error || !data) return {}

  const grouped: WeeklyHours = {}
  for (const row of data) {
    if (!grouped[row.day_of_week]) grouped[row.day_of_week] = []
    grouped[row.day_of_week].push(row)
  }
  return grouped
}

/**
 * Reemplaza todo el horario del negocio de una vez — más simple que
 * calcular diffs entre rangos viejos y nuevos, y el volumen (máximo
 * ~14 filas por negocio) hace que el costo sea insignificante.
 */
export async function replaceBusinessHours(
  businessId: string,
  ranges: BusinessHourRange[]
): Promise<void> {
  const supabase = createAdminClient()

  const { error: deleteError } = await supabase
    .from('business_hours')
    .delete()
    .eq('business_id', businessId)

  if (deleteError) {
    throw new Error(`Error limpiando horario anterior: ${deleteError.message}`)
  }

  if (ranges.length === 0) return

  const { error: insertError } = await supabase
    .from('business_hours')
    .insert(ranges.map((r) => ({ business_id: businessId, ...r })))

  if (insertError) {
    throw new Error(`Error guardando horario: ${insertError.message}`)
  }
}