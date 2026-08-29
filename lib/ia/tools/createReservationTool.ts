import { createReservation } from '@/lib/queries/reservations'
import { getBusinessAreas } from '@/lib/queries/tables'
import { createNotification } from '@/lib/queries/notifications'
import type { AiTool } from '../core/types'

export async function buildCreateReservationTool(businessId: string): Promise<AiTool> {
  const areas = await getBusinessAreas(businessId)

  // Solo se menciona la opción de zona si el negocio realmente tiene
  // más de una — preguntar con una sola zona (o ninguna) desperdicia
  // tokens y confunde al cliente sin necesidad.
  const description =
    areas.length > 1
      ? `Crea una reserva con fecha, hora y número de personas. Si el cliente no menciona preferencia de zona, puedes preguntar cuál prefiere entre: ${areas
          .map((a) => a.name)
          .join(', ')}. No es obligatorio que el cliente elija una.`
      : 'Crea una reserva con fecha, hora y número de personas. No preguntes por zona ni mesa — eso se asigna internamente por el negocio.'

  return {
    name: 'create_reservation',
    description,
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
        time: { type: 'string', description: 'Hora en formato HH:MM (24 horas)' },
        peopleCount: { type: 'number', description: 'Número de personas' },
        areaPreference: {
          type: 'string',
          description:
            'Nombre del área preferida, solo si el cliente la mencionó y el negocio tiene más de una zona.',
        },
        notes: { type: 'string', description: 'Notas adicionales que el cliente haya mencionado' },
      },
      required: ['date', 'time', 'peopleCount'],
    },
    handler: async (context, input) => {
      const matchedArea = input.areaPreference
        ? areas.find(
            (a) => a.name.toLowerCase() === String(input.areaPreference).toLowerCase()
          )
        : null

      const notes = matchedArea
        ? `${(input.notes as string) ?? ''} (Prefiere zona: ${matchedArea.name})`.trim()
        : (input.notes as string) ?? null

      const reservation = await createReservation({
        business_id: context.businessId,
        customer_id: context.customerId,
        table_id: null,
        reservation_date: input.date as string,
        reservation_time: input.time as string,
        people_count: input.peopleCount as number,
        notes,
        source: 'whatsapp',
      })

      // Notificación instantánea en el dashboard — el recordatorio de
      // las 7am es aparte, este aviso es apenas se crea la reserva.
      await createNotification(
        context.businessId,
        'Nueva reserva por WhatsApp',
        `Reserva para el ${input.date} a las ${input.time}, ${input.peopleCount} persona(s).${
          matchedArea ? ` Zona preferida: ${matchedArea.name}.` : ''
        }`
      )

      return {
        success: true,
        message: `Reserva creada para el ${input.date} a las ${input.time}, ${input.peopleCount} personas.`,
        reservationId: reservation.id,
      }
    },
  }
}