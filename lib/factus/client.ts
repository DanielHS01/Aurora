// lib/factus/client.ts
//
// Cliente de la API de Factus. Las credenciales se reciben como
// parámetro en cada función (nunca hardcodeadas) porque, según la
// arquitectura confirmada, cada negocio ("facturador") activado tiene
// sus PROPIAS credenciales — este archivo no asume una sola cuenta
// global.

export type FactusCredentials = {
  baseUrl: string; // sandbox o producción, según el negocio/entorno
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
};

type FactusTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // en segundos — NUNCA asumir un valor fijo, la
                       // propia documentación de Factus es inconsistente
                       // entre "1 hora" (texto) y 600s (ejemplo real).
  token_type: string;
};

// Caché en memoria por set de credenciales (identificado por client_id),
// para no pedir token nuevo en cada request dentro de la misma ventana
// de expiración. Vive mientras la instancia del proceso esté "caliente"
// — igual de simple que la caché de mantenimiento que ya usan en proxy.ts.
const tokenCache = new Map<string, { accessToken: string; expiresAt: number }>();

async function getAccessToken(creds: FactusCredentials): Promise<string> {
  const cacheKey = creds.clientId;
  const cached = tokenCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.accessToken;
  }

  const res = await fetch(`${creds.baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      username: creds.username,
      password: creds.password,
    }),
  });

  if (!res.ok) {
    throw new Error(`Error autenticando con Factus: ${await res.text()}`);
  }

  const data: FactusTokenResponse = await res.json();

  // Restamos 30s de margen de seguridad, para no usar un token que
  // expire literalmente en medio de la siguiente petición.
  const expiresAt = now + data.expires_in * 1000 - 30_000;
  tokenCache.set(cacheKey, { accessToken: data.access_token, expiresAt });

  return data.access_token;
}

async function factusFetch<T>(
  creds: FactusCredentials,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getAccessToken(creds);

  const res = await fetch(`${creds.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Error en Factus (${path}): ${await res.text()}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------
// Facturación
// ---------------------------------------------------------------------

export type FactusInvoicePayload = {
  reference_code: string; // idempotencia — usar el id del pedido/venta
  document?: string; // default "01"
  numbering_range_id?: number;
  operation_type?: string; // default "10"
  send_email?: boolean;
  observation?: string;
  cash_rounding_amount?: string;
  payment_details: Array<{
    payment_form: string;
    payment_method_code: string;
    reference_code?: string;
    amount: string;
    due_date?: string;
  }>;
  customer: {
    identification_document_code: string;
    identification: string;
    dv?: string;
    legal_organization_code: string;
    tribute_code?: string;
    responsibilities?: string[];
    company?: string;
    trade_name?: string;
    names?: string;
    address?: string;
    email?: string;
    phone?: string;
    country_code?: string;
    municipality_code?: string;
  };
  items: Array<{
    code_reference: string;
    name: string;
    quantity: string;
    discount_rate?: string;
    discount_amount?: string;
    price: string;
    unit_measure_code: string;
    standard_code: string;
    note?: string;
    taxes: Array<{ code: string; rate: string; is_excluded?: boolean }>;
    withholding_taxes?: Array<{ code: string; rate: string }>;
  }>;
};

export type FactusInvoiceResponse = {
  status: string;
  message: string;
  data: {
    reference_code: string;
    number: string;
    document_type: { code: string; name: string };
    operation_type: { code: string; name: string };
    is_validated: boolean;
    validated_at: string;
    errors: Record<string, unknown>;
    cufe: string;
    links: { qr: string; public_url: string };
    totals: {
      prepayment_amount: string;
      gross_amount: string;
      taxable_amount: string;
      tax_amount: string;
      surcharge_amount: string;
      total: string;
    };
  };
};

/**
 * Crea y valida una factura electrónica estándar. Lanza error si
 * discount_rate y discount_amount vienen ambos en un mismo item — la
 * documentación de Factus dice explícitamente "uno u otro, no ambos",
 * sin aclarar qué hace su API si se envían juntos, así que lo
 * validamos nosotros antes de arriesgarnos.
 */
export async function createFactusInvoice(
  creds: FactusCredentials,
  payload: FactusInvoicePayload,
): Promise<FactusInvoiceResponse> {
  for (const item of payload.items) {
    if (item.discount_rate !== undefined && item.discount_amount !== undefined) {
      throw new Error(
        `Item "${item.code_reference}": no se puede enviar discount_rate y discount_amount a la vez.`,
      );
    }
  }

  return factusFetch<FactusInvoiceResponse>(creds, '/v2/bills/validate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------
// Notas crédito (anulación de facturas)
// ---------------------------------------------------------------------

export type FactusCreditNoteResponse = {
  status: string;
  message: string;
  data: {
    reference_code: string;
    number: string;
    is_validated: boolean;
    cufe: string;
    links: { qr: string; public_url: string };
    [key: string]: unknown;
  };
};

export type FactusCreditNotePayload = {
  reference_code: string;
  bill_number: string; // el "number" de la factura que se corrige, ej. SETP990019067
  numbering_range_id?: number;
  correction_concept_code: string; // "1" = anulación de factura, PENDIENTE DE CONFIRMAR el catálogo completo
  payment_details: FactusInvoicePayload['payment_details'];
  customer: FactusInvoicePayload['customer'];
  items: FactusInvoicePayload['items'];
  observation?: string;
};

/**
 * Anula una factura ya emitida, mediante una Nota Crédito — nunca se
 * "borra" ni edita la factura original (no es posible ante la DIAN),
 * se crea un documento nuevo que la referencia y la deja sin efecto.
 *
 * PENDIENTE DE CONFIRMAR con Factus antes de usar en producción:
 * - El código exacto de correction_concept para "anulación total"
 *   (usamos "1" como suposición razonable, no confirmado).
 * - Si esto consume un documento adicional del cupo de la suscripción.
 * - El endpoint exacto (asumido /v2/credit-notes/validate, mismo
 *   patrón que /v2/bills/validate, pero no probado contra la API real).
 */
export async function createFactusCreditNote(
  creds: FactusCredentials,
  payload: FactusCreditNotePayload,
): Promise<FactusCreditNoteResponse> {
  return factusFetch<FactusCreditNoteResponse>(creds, '/v2/credit-notes/validate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------
// Rangos de numeración
// ---------------------------------------------------------------------

export type FactusNumberingRange = {
  id: number;
  // La respuesta trae más campos (resolución DIAN, vigencia, etc.) —
  // se tipa el mínimo necesario por ahora; ampliar si se necesita.
  [key: string]: unknown;
};

export async function getFactusNumberingRanges(
  creds: FactusCredentials,
): Promise<FactusNumberingRange[]> {
  // La respuesta real viene doblemente anidada:
  // { status, message, data: { data: [...], pagination: {...} } }
  // — confirmado con la prueba real contra sandbox, no es un supuesto.
  const res = await factusFetch<{ data: { data: FactusNumberingRange[]; pagination?: unknown } }>(
    creds,
    '/v2/numbering-ranges',
  );
  return res.data.data;
}

// ---------------------------------------------------------------------
// Cuota de documentos (para el contador del panel de superadmin)
// ---------------------------------------------------------------------

export type FactusSubscription = {
  id: number;
  is_active: boolean;
  has_unlimited_quota: boolean;
  documents_total: number;
  documents_consumed: number;
  documents_available: number;
  activated_at: string;
  expires_at: string;
  [key: string]: unknown;
};

export async function getFactusSubscriptions(
  creds: FactusCredentials,
): Promise<FactusSubscription[]> {
  const res = await factusFetch<{ data: FactusSubscription[] }>(
    creds,
    '/v2/subscriptions',
  );
  return res.data;
}