import { createAdminClient } from '@/lib/supabase/admin'
import { getReservations } from '@/lib/queries/reservations'
import { createNotification } from '@/lib/queries/notifications'
import { getChannelByExternalId } from '@/lib/queries/aiChannels'
import { sendWhatsappMessage } from '@/lib/whatsapp/client'

function getTodayInColombia(): string {
  // Colombia es UTC-5 fijo, sin horario de verano — restamos 5 horas
  // para obtener la fecha local correcta sin depender de Intl/timezone.
  const now = new Date()
  const colombiaTime = new Date(now.getTime() - 5 * 60 * 60 * 1000)
  return colombiaTime.toISOString().slice(0, 10)
}

function buildDigestMessage(
  businessName: string,
  reservations: { reservation_time: string; people_count: number; customer: { full_name: string | null; phone: string | null } | null }[]
): string {
  const lines = reservations
    .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
    .map((r) => {
      const time = r.reservation_time.slice(0, 5)
      const name = r.customer?.full_name ?? r.customer?.phone ?? 'Sin nombre'
      return `- ${time} · ${name} · ${r.people_count} persona(s)`
    })
    .join('\n')

  return `📋 Reservas de hoy en ${businessName}:\n\n${lines}\n\nRecuerda apartar mesa para cada horario a tiempo.`
}

export async function runDailyReservationsDigest(): Promise<{ processed: number }> {
  const supabase = createAdminClient()
  const today = getTodayInColombia()

  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, phone')
    .eq('is_active', true)

  if (!businesses) return { processed: 0 }

  let processed = 0

  for (const business of businesses) {
    const reservations = await getReservations(business.id, {
      date: today,
      status: 'confirmed',
    })

    if (reservations.length === 0) continue

    const message = buildDigestMessage(business.name, reservations)

    // 1. Notificación dentro del dashboard — siempre se crea
    await createNotification(
      business.id,
      `${reservations.length} reserva(s) para hoy`,
      message
    )

    // 2. WhatsApp al negocio — solo si tiene canal conectado y teléfono
    if (business.phone) {
      const channel = await getChannelByExternalId('whatsapp', business.phone)
      if (channel) {
        try {
          await sendWhatsappMessage(
            channel.credentials.api_key,
            channel.isSandbox,
            business.phone,
            message
          )
        } catch (err) {
          console.error(`Error enviando digest de WhatsApp a ${business.id}:`, err)
        }
      }
    }

    processed++
  }

  return { processed }
}