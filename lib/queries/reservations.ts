import { createClient } from '@/lib/supabase/server'
import type { Reservation, ReservationStatus, Customer, RestaurantTable } from '@/lib/types'
import type { TablesInsert, TablesUpdate } from '@/lib/types/database.types'

type ReservationInsert = TablesInsert<'reservations'>
type ReservationUpdate = TablesUpdate<'reservations'>

export type ReservationWithDetails = Reservation & {
  customer: Customer | null
  table: RestaurantTable | null
}

export async function getReservations(
  businessId: string,
  filters?: { date?: string; status?: ReservationStatus }
): Promise<ReservationWithDetails[]> {
  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select('*, customer:customers(*), table:restaurant_tables(*)')
    .eq('business_id', businessId)
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })

  if (filters?.date) query = query.eq('reservation_date', filters.date)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query

  if (error || !data) return []
  return data as ReservationWithDetails[]
}

export async function getReservationById(
  reservationId: string
): Promise<ReservationWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .select('*, customer:customers(*), table:restaurant_tables(*)')
    .eq('id', reservationId)
    .single()

  if (error || !data) return null
  return data as ReservationWithDetails
}

export async function createReservation(reservation: ReservationInsert): Promise<Reservation> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .insert(reservation)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error creando reserva: ${error?.message}`)
  }
  return data
}

export async function updateReservation(
  reservationId: string,
  updates: ReservationUpdate
): Promise<Reservation> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', reservationId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando reserva: ${error?.message}`)
  }
  return data
}

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus
): Promise<Reservation> {
  return updateReservation(reservationId, { status })
}

export async function cancelReservation(reservationId: string): Promise<Reservation> {
  return updateReservationStatus(reservationId, 'cancelled')
}

/**
 * Convierte una reserva confirmada en un pedido real — se usa cuando el
 * cliente llega al restaurante. Crea el pedido vinculado a la reserva
 * (vía reservation_id), copiando mesa y cliente, y marca la reserva
 * como completada. También ocupa la mesa correspondiente.
 *
 * Esto es exactamente lo que resolvimos al agregar orders.reservation_id
 * en la migración — antes no había forma de conectar ambos registros.
 */
export async function convertReservationToOrder(reservationId: string): Promise<{
  orderId: string
}> {
  const supabase = await createClient()

  const reservation = await getReservationById(reservationId)
  if (!reservation) {
    throw new Error('Reserva no encontrada')
  }
  if (reservation.status !== 'confirmed') {
    throw new Error('Solo se pueden convertir reservas confirmadas')
  }

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      business_id: reservation.business_id,
      table_id: reservation.table_id,
      customer_id: reservation.customer_id,
      reservation_id: reservation.id,
      order_type: 'dine_in',
      source: reservation.source,
      subtotal: 0,
      tax_amount: 0,
      service_fee: 0,
      total: 0,
    })
    .select('id')
    .single()

  if (orderError || !newOrder) {
    throw new Error(`Error creando pedido desde reserva: ${orderError?.message}`)
  }

  await supabase
    .from('reservations')
    .update({ status: 'completed' })
    .eq('id', reservationId)

  if (reservation.table_id) {
    await supabase
      .from('restaurant_tables')
      .update({ status: 'occupied' })
      .eq('id', reservation.table_id)
  }

  return { orderId: newOrder.id }
}