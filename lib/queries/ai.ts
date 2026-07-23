import { createClient } from '@/lib/supabase/server'
import type {
  AiAgent,
  AiConversation,
  AiMessage,
  AiAction,
  AiChannel,
  AiSender,
} from '@/lib/types'
import type { Json, TablesInsert, TablesUpdate } from '@/lib/types/database.types'

type AiAgentInsert = TablesInsert<'ai_agents'>
type AiAgentUpdate = TablesUpdate<'ai_agents'>
type AiConversationUpdate = TablesUpdate<'ai_conversations'>
type AiActionUpdate = TablesUpdate<'ai_actions'>

// ============================================================================
// AGENTES
// ============================================================================

/**
 * Trae todos los agentes configurados para un negocio (puede haber más
 * de uno, ej. uno por canal).
 */
export async function getAiAgents(businessId: string): Promise<AiAgent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data
}

/**
 * Trae el primer agente activo de un negocio — útil cuando el negocio
 * solo tiene un agente configurado (el caso más común hoy).
 */
export async function getActiveAiAgent(businessId: string): Promise<AiAgent | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data
}

export async function createAiAgent(agent: AiAgentInsert): Promise<AiAgent> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_agents')
    .insert(agent)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error creando agente: ${error?.message}`)
  }
  return data
}

export async function updateAiAgent(agentId: string, updates: AiAgentUpdate): Promise<AiAgent> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_agents')
    .update(updates)
    .eq('id', agentId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando agente: ${error?.message}`)
  }
  return data
}

// ============================================================================
// CONVERSACIONES
// ============================================================================

export type ConversationWithMessages = AiConversation & {
  messages: AiMessage[]
}

export async function getActiveConversations(businessId: string): Promise<AiConversation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })

  if (error || !data) return []
  return data
}

export async function getConversationById(
  conversationId: string
): Promise<ConversationWithMessages | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*, messages:ai_messages(*)')
    .eq('id', conversationId)
    .single()

  if (error || !data) return null
  return data as ConversationWithMessages
}

/**
 * Busca (o crea) la conversación activa de un cliente en un canal
 * específico. Pensado para el flujo típico de WhatsApp: cuando llega un
 * mensaje nuevo, primero se revisa si ya hay una conversación abierta
 * con ese número antes de crear una desde cero.
 */
export async function findOrCreateActiveConversation(
  businessId: string,
  channel: AiChannel,
  customerId: string | null
): Promise<AiConversation> {
  const supabase = await createClient()

  if (customerId) {
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('business_id', businessId)
      .eq('channel', channel)
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .maybeSingle()

    if (existing) return existing
  }

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ business_id: businessId, channel, customer_id: customerId })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error creando conversación: ${error?.message}`)
  }
  return data
}

export async function endConversation(conversationId: string): Promise<AiConversation> {
  const supabase = await createClient()

  const updates: AiConversationUpdate = {
    status: 'ended',
    ended_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('ai_conversations')
    .update(updates)
    .eq('id', conversationId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error finalizando conversación: ${error?.message}`)
  }
  return data
}

// ============================================================================
// MENSAJES
// ============================================================================

export async function getMessagesForConversation(conversationId: string): Promise<AiMessage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data
}

export async function addMessage(
  businessId: string,
  conversationId: string,
  sender: AiSender,
  message: string,
  metadata?: Record<string, unknown>
): Promise<AiMessage> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_messages')
    .insert({
      business_id: businessId,
      conversation_id: conversationId,
      sender,
      message,
      metadata: (metadata ?? {}) as Json,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error guardando mensaje: ${error?.message}`)
  }
  return data
}

// ============================================================================
// ACCIONES DEL AGENTE
// ============================================================================

export async function getActionsForConversation(conversationId: string): Promise<AiAction[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ai_actions')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data
}

/**
 * Registra una acción concreta que el agente ejecutó (crear pedido, crear
 * reserva). Debe estar ligada a UN pedido O UNA reserva, nunca ambos —
 * misma regla que el CHECK constraint de la tabla, validada aquí también
 * para dar un mensaje claro antes de que Postgres la rechace.
 */
export async function logAiAction(params: {
  businessId: string
  conversationId?: string
  actionType: string
  relatedOrderId?: string
  relatedReservationId?: string
}): Promise<AiAction> {
  const supabase = await createClient()

  if (params.relatedOrderId && params.relatedReservationId) {
    throw new Error('Una acción no puede estar ligada a un pedido y una reserva a la vez')
  }

  const { data, error } = await supabase
    .from('ai_actions')
    .insert({
      business_id: params.businessId,
      conversation_id: params.conversationId ?? null,
      action_type: params.actionType,
      related_order_id: params.relatedOrderId ?? null,
      related_reservation_id: params.relatedReservationId ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error registrando acción del agente: ${error?.message}`)
  }
  return data
}

/**
 * Marca una acción como completada (o fallida), registrando completed_at
 * automáticamente — esto es lo que permite medir después cuánto tarda el
 * agente en resolver una acción, como identificamos que faltaba.
 */
export async function updateAiActionStatus(
  actionId: string,
  status: 'completed' | 'failed'
): Promise<AiAction> {
  const supabase = await createClient()

  const updates: AiActionUpdate = {
    status,
    completed_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('ai_actions')
    .update(updates)
    .eq('id', actionId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando acción del agente: ${error?.message}`)
  }
  return data
}