import { createClient } from '@/lib/supabase/server'
import type { KitchenTicket, KitchenTicketStatus, Order } from '@/lib/types'
import type { TablesInsert, TablesUpdate } from '@/lib/types/database.types'

type KitchenTicketInsert = TablesInsert<'kitchen_tickets'>
type KitchenTicketUpdate = TablesUpdate<'kitchen_tickets'>

export type KitchenTicketWithOrder = KitchenTicket & {
  order: Order
}

/**
 * Trae los tickets de cocina activos (no entregados ni cancelados),
 * con el pedido asociado — pensado para la pantalla de cocina, donde
 * se necesita ver qué hay pendiente en tiempo real.
 */
export async function getActiveKitchenTickets(
  businessId: string
): Promise<KitchenTicketWithOrder[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kitchen_tickets')
    .select('*, order:orders(*)')
    .eq('business_id', businessId)
    .not('status', 'in', '(delivered,cancelled)')
    .order('sent_at', { ascending: true })

  if (error || !data) return []
  return data as KitchenTicketWithOrder[]
}

export async function getKitchenTicketByOrderId(orderId: string): Promise<KitchenTicket | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kitchen_tickets')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()

  if (error || !data) return null
  return data
}

/**
 * Crea el ticket de cocina para un pedido — normalmente se llama cuando
 * el pedido pasa de "armándose" a "enviado a cocina" (ej. el mesero
 * confirma el pedido completo).
 */
export async function createKitchenTicket(
  businessId: string,
  orderId: string
): Promise<KitchenTicket> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kitchen_tickets')
    .insert({ business_id: businessId, order_id: orderId })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error creando ticket de cocina: ${error?.message}`)
  }
  return data
}

/**
 * Cambia el estado del ticket, registrando automáticamente started_at
 * (al pasar a in_progress) y completed_at (al pasar a ready o delivered)
 * — así cocina no tiene que marcar esas marcas de tiempo manualmente,
 * y quedan disponibles para medir tiempos de preparación después.
 */
export async function updateKitchenTicketStatus(
  ticketId: string,
  status: KitchenTicketStatus
): Promise<KitchenTicket> {
  const supabase = await createClient()

  const updates: KitchenTicketUpdate = { status }

  if (status === 'in_progress') {
    updates.started_at = new Date().toISOString()
  }
  if (status === 'ready' || status === 'delivered') {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('kitchen_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando ticket de cocina: ${error?.message}`)
  }
  return data
}