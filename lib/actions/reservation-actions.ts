'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import {
  createReservation,
  updateReservation,
  updateReservationStatus,
  cancelReservation,
  convertReservationToOrder,
} from '@/lib/queries/reservations'
import type { ReservationStatus, OrderSource } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function createReservationAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const customerId = (formData.get('customerId') as string) || null
  const tableId = (formData.get('tableId') as string) || null
  const reservationDate = formData.get('reservationDate') as string
  const reservationTime = formData.get('reservationTime') as string
  const peopleCount = Number(formData.get('peopleCount') ?? 1)
  const notes = (formData.get('notes') as string)?.trim() || null
  const source = (formData.get('source') as OrderSource) || 'web'

  await requireBusinessAccess(businessId)

  if (!reservationDate || !reservationTime) {
    throw new Error('La fecha y hora de la reserva son obligatorias')
  }
  if (peopleCount < 1) {
    throw new Error('El número de personas debe ser al menos 1')
  }

  const reservation = await createReservation({
    business_id: businessId,
    customer_id: customerId,
    table_id: tableId,
    reservation_date: reservationDate,
    reservation_time: reservationTime,
    people_count: peopleCount,
    notes,
    source,
  })

  revalidatePath('/reservations')
  return reservation
}

export async function updateReservationAction(
  reservationId: string,
  businessId: string,
  formData: FormData
) {
  await requireBusinessAccess(businessId)

  const reservationDate = formData.get('reservationDate') as string
  const reservationTime = formData.get('reservationTime') as string
  const peopleCount = Number(formData.get('peopleCount'))
  const tableId = (formData.get('tableId') as string) || null
  const notes = (formData.get('notes') as string)?.trim() || null

  if (peopleCount < 1) {
    throw new Error('El número de personas debe ser al menos 1')
  }

  await updateReservation(reservationId, {
    reservation_date: reservationDate,
    reservation_time: reservationTime,
    people_count: peopleCount,
    table_id: tableId,
    notes,
  })

  revalidatePath('/reservations')
}

export async function updateReservationStatusAction(
  reservationId: string,
  businessId: string,
  status: ReservationStatus
) {
  await requireBusinessAccess(businessId)
  await updateReservationStatus(reservationId, status)
  revalidatePath('/reservations')
}

export async function cancelReservationAction(reservationId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  await cancelReservation(reservationId)
  revalidatePath('/reservations')
}

/**
 * Convierte una reserva confirmada en un pedido real cuando el cliente
 * llega al restaurante. Redirige a la página del pedido recién creado.
 */
export async function convertReservationToOrderAction(
  reservationId: string,
  businessId: string
) {
  await requireBusinessAccess(businessId)
  const { orderId } = await convertReservationToOrder(reservationId)
  revalidatePath('/reservations')
  revalidatePath('/orders')
  return { orderId }
}