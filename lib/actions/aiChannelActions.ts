'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import { getCurrentUserRole } from '@/lib/queries/business-users'
import { createAiChannel } from '@/lib/queries/aiChannels'
import type { BusinessRole } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { assertNotInMaintenance } from '@/lib/utils/maintenanceGuard'

const ROLES_THAT_CAN_MANAGE_AI: BusinessRole[] = ['owner', 'admin']

export async function connectAiChannelAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const channelType = formData.get('channelType') as 'whatsapp' | 'call' | 'web_chat'
  const externalIdentifier = (formData.get('externalIdentifier') as string)?.trim()
  const apiKey = (formData.get('apiKey') as string)?.trim()
  const agentId = (formData.get('agentId') as string)?.trim() || undefined
  const isSandbox = formData.get('isSandbox') === 'true'

  await requireBusinessAccess(businessId)

  await assertNotInMaintenance()

  const role = await getCurrentUserRole(businessId)
  if (!role || !ROLES_THAT_CAN_MANAGE_AI.includes(role)) {
    throw new Error('No tienes permiso para conectar canales de IA')
  }

  if (!externalIdentifier || !apiKey) {
    throw new Error('Completa todos los campos obligatorios')
  }

  const credentials: Record<string, string> = { api_key: apiKey }
  if (agentId) credentials.agent_id = agentId

  await createAiChannel(businessId, channelType, externalIdentifier, credentials, isSandbox)

  revalidatePath('/dashboard/ai-channels')
}