import { createAdminClient } from '@/lib/supabase/admin'
import { encryptCredentials, decryptCredentials } from '@/lib/utils/encryption'
import type { AiChannel } from '@/lib/types'

export type ResolvedChannel = {
  businessId: string
  isSandbox: boolean
  credentials: Record<string, string>
}

/**
 * Resuelve a qué negocio y con qué credenciales corresponde un mensaje
 * entrante, a partir del identificador externo (phone_number_id de
 * WhatsApp, número de voz, etc). Usa admin client porque este código
 * corre en un webhook — no hay ningún usuario autenticado, es 360dialog
 * (o Retell, cuando llegue) llamándonos directamente.
 */
export async function getChannelByExternalId(
  channelType: AiChannel,
  externalIdentifier: string
): Promise<ResolvedChannel | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('business_ai_channels')
    .select('business_id, credentials_encrypted, is_sandbox')
    .eq('channel_type', channelType)
    .eq('external_identifier', externalIdentifier)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null

  return {
    businessId: data.business_id,
    isSandbox: data.is_sandbox,
    credentials: decryptCredentials(data.credentials_encrypted),
  }
}

/**
 * Registra un canal nuevo para un negocio (ej. su número de WhatsApp,
 * o el de sandbox mientras prueban). Las credenciales se cifran antes
 * de guardarse — nunca quedan en texto plano en la base de datos.
 */
export async function createAiChannel(
  businessId: string,
  channelType: AiChannel,
  externalIdentifier: string,
  credentials: Record<string, string>,
  isSandbox: boolean = false
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('business_ai_channels').insert({
    business_id: businessId,
    channel_type: channelType,
    external_identifier: externalIdentifier,
    credentials_encrypted: encryptCredentials(credentials),
    is_sandbox: isSandbox,
  })

  if (error) {
    throw new Error(`Error registrando canal de IA: ${error.message}`)
  }
}
export async function getChannelsForBusiness(businessId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('business_ai_channels')
    .select('id, channel_type, external_identifier, is_sandbox')
    .eq('business_id', businessId)
    .eq('is_active', true)

  if (error || !data) return []
  return data
}