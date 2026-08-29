import { createAdminClient } from '@/lib/supabase/admin'
import type { AiChannel, AiSender } from '@/lib/types'

/**
 * Busca un cliente por teléfono dentro del negocio; si no existe, lo
 * crea. Así cada conversación por WhatsApp queda ligada a un registro
 * real en "customers", reutilizable después para pedidos o reservas.
 */
export async function getOrCreateCustomerByPhone(
  businessId: string,
  phone: string,
  name?: string
): Promise<string> {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('customers')
    .insert({ business_id: businessId, phone, full_name: name ?? null })
    .select('id')
    .single()

  if (error || !created) {
    throw new Error(`Error creando cliente: ${error?.message}`)
  }

  return created.id
}

/**
 * Busca una conversación activa para este cliente en este canal; si no
 * hay ninguna abierta, crea una nueva. Evita que cada mensaje nuevo
 * abra una conversación distinta — mientras el cliente siga escribiendo,
 * es la misma conversación.
 */
export async function getOrCreateActiveConversation(
  businessId: string,
  customerId: string,
  channel: AiChannel
): Promise<string> {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .eq('channel', channel)
    .eq('status', 'active')
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('ai_conversations')
    .insert({ business_id: businessId, customer_id: customerId, channel })
    .select('id')
    .single()

  if (error || !created) {
    throw new Error(`Error creando conversación: ${error?.message}`)
  }

  return created.id
}

export async function logAiMessage(
  conversationId: string,
  businessId: string,
  sender: AiSender,
  message: string
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('ai_messages').insert({
    conversation_id: conversationId,
    business_id: businessId,
    sender,
    message,
  })

  if (error) {
    throw new Error(`Error guardando mensaje: ${error.message}`)
  }
}
export async function getRecentConversationHistory(
  conversationId: string,
  limit: number = 10
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('ai_messages')
    .select('sender, message')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (!data) return []

  return data
    .filter((m) => m.sender === 'user' || m.sender === 'assistant')
    .map((m) => ({ role: m.sender as 'user' | 'assistant', content: m.message }))
}