// lib/queries/factusCredentials.ts

import { createAdminClient } from '@/lib/supabase/admin';
import { encryptCredentials, decryptCredentials } from '@/lib/utils/encryption';
import type { FactusCredentials } from '@/lib/factus/client';

type StoredFactusCredentials = {
  username: string;
  password: string;
  client_id: string;
  client_secret: string;
};

/**
 * Guarda las credenciales de un negocio recién activado en Factus.
 * Aurora es quien gestiona todo el proceso de activación (envío de
 * documentos, etc.) — el negocio nunca pega sus propias credenciales
 * (a diferencia de Wompi), así que esta función solo la debe llamar
 * un flujo interno/admin, nunca una Server Action expuesta al dueño
 * del negocio.
 */
export async function saveFactusCredentials(
  businessId: string,
  credentials: StoredFactusCredentials,
  numberingRangeId: number | null,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('business_factus_credentials').upsert(
    {
      business_id: businessId,
      credentials_encrypted: encryptCredentials(credentials),
      numbering_range_id: numberingRangeId,
      status: 'active',
      activated_at: new Date().toISOString(),
    },
    { onConflict: 'business_id' },
  );

  if (error) {
    throw new Error(`Error guardando credenciales de Factus: ${error.message}`);
  }
}

/**
 * Recupera y descifra las credenciales de un negocio, listas para
 * usar con el cliente de lib/factus/client.ts. Devuelve null si el
 * negocio no tiene Factus activado todavía (status !== 'active') — el
 * llamador debe manejar ese caso (ej. "facturación electrónica no
 * disponible para este negocio").
 */
export async function getFactusCredentialsForBusiness(
  businessId: string,
): Promise<FactusCredentials | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('business_factus_credentials')
    .select('credentials_encrypted, status')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .maybeSingle();

  if (!data?.credentials_encrypted) return null;

  const decrypted = decryptCredentials(data.credentials_encrypted) as StoredFactusCredentials;

  return {
    baseUrl:
      process.env.FACTUS_ENV === 'production'
        ? 'https://api.factus.com.co'
        : 'https://api-sandbox.factus.com.co',
    username: decrypted.username,
    password: decrypted.password,
    clientId: decrypted.client_id,
    clientSecret: decrypted.client_secret,
  };
}

/**
 * Estado de Factus de TODOS los negocios a la vez, como mapa
 * businessId -> status — pensado para la tabla de superadmin, para no
 * hacer una consulta por negocio.
 */
export async function getFactusStatusMap(): Promise<
  Record<string, 'pending_activation' | 'active' | 'suspended'>
> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('business_factus_credentials')
    .select('business_id, status')

  const map: Record<string, 'pending_activation' | 'active' | 'suspended'> = {}
  for (const row of data ?? []) {
    map[row.business_id] = row.status
  }
  return map
}
export async function getFactusActivationStatus(
  businessId: string,
): Promise<'pending_activation' | 'active' | 'suspended' | 'not_requested'> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('business_factus_credentials')
    .select('status')
    .eq('business_id', businessId)
    .maybeSingle();

  return data?.status ?? 'not_requested';
}