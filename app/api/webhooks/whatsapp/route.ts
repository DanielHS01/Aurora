import { NextResponse } from 'next/server'
import { sendWhatsappMessage } from '@/lib/whatsapp/client'
import { getChannelByExternalId } from '@/lib/queries/aiChannels'
import { getBusinessById } from '@/lib/queries/businesses'
import {
  getOrCreateCustomerByPhone,
  getOrCreateActiveConversation,
  logAiMessage,
  getRecentConversationHistory,
} from '@/lib/queries/aiConversations'
import { getAiAgentConfig } from '@/lib/queries/aiAgents'
import { getToolsForBusiness } from '@/lib/ia/registry'
import { runAiEngine } from '@/lib/ia/core/engine'

export async function POST(request: Request) {
  const payload = await request.json()

  const value = payload?.entry?.[0]?.changes?.[0]?.value
  const message = value?.messages?.[0]
  const phoneNumberId = value?.metadata?.phone_number_id
  const contactName = value?.contacts?.[0]?.profile?.name

  const incomingText = message?.text?.body
  const fromNumber = message?.from

  if (!incomingText || !fromNumber || !phoneNumberId) {
    return NextResponse.json({ ok: true })
  }

  const channel = await getChannelByExternalId('whatsapp', phoneNumberId)
  if (!channel) {
    console.warn(`⚠️ No hay negocio registrado para phone_number_id: ${phoneNumberId}`)
    return NextResponse.json({ ok: true })
  }

  // business y customerId no dependen entre sí — solo dependen de
  // channel.businessId, que ya tenemos. Antes iban uno detrás del otro.
  const [business, customerId] = await Promise.all([
    getBusinessById(channel.businessId),
    getOrCreateCustomerByPhone(channel.businessId, fromNumber, contactName),
  ])

  if (!business) {
    return NextResponse.json({ ok: true })
  }

  // getOrCreateActiveConversation sí depende de customerId, así que
  // este paso se queda secuencial por necesidad real.
  const conversationId = await getOrCreateActiveConversation(channel.businessId, customerId, 'whatsapp')

  await logAiMessage(conversationId, channel.businessId, 'user', incomingText)

  // Estas tres consultas son completamente independientes entre sí —
  // antes se pedían una detrás de otra, ahora en paralelo.
  const [history, agentConfig, tools] = await Promise.all([
    getRecentConversationHistory(conversationId, 10),
    getAiAgentConfig(channel.businessId),
    getToolsForBusiness(channel.businessId, business.business_type),
  ])

  const reply = await runAiEngine(
    { businessId: channel.businessId, customerId, conversationId },
    business.name,
    agentConfig?.instructions ?? null,
    tools,
    history,
    incomingText
  )

  await logAiMessage(conversationId, channel.businessId, 'assistant', reply)
  await sendWhatsappMessage(channel.credentials.api_key, channel.isSandbox, fromNumber, reply)

  return NextResponse.json({ ok: true })
}