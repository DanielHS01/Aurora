// lib/factus/invoicing.ts

import { createAdminClient } from '@/lib/supabase/admin';
import { getFactusCredentialsForBusiness } from '@/lib/queries/factusCredentials';
import { checkInvoiceQuota } from './quota';
import {
  createFactusInvoice,
  createFactusCreditNote,
  getFactusNumberingRanges,
  type FactusInvoicePayload,
} from './client';
import { mapOrderToFactusInvoice } from './mapOrderToInvoice';

export type GenerateInvoiceResult =
  | { ok: true; cufe: string; number: string; publicUrl: string; qrUrl: string; isValidated: boolean }
  | { ok: false; reason: 'no_factus_activation' | 'order_not_found' | 'quota_exceeded' | 'factus_error'; message: string };

export type CancelInvoiceResult =
  | { ok: true; creditNoteNumber: string; cufe: string; publicUrl: string }
  | { ok: false; reason: 'invoice_not_found' | 'not_electronic' | 'already_cancelled' | 'no_factus_activation' | 'factus_error'; message: string };

/**
 * Reconstruye el payload de Factus (customer/items/payment_details) a
 * partir de un pedido — lo usan tanto crear la factura original como
 * armar la nota crédito que la corrige (Factus exige los mismos datos
 * completos en ambos casos, no solo una referencia a la factura).
 *
 * LIMITACIÓN CONOCIDA: si la factura original se generó con un
 * "cliente identificado" capturado ad-hoc en el checkout
 * (customerOverride, no ligado a un registro guardado en `customers`),
 * esa identificación NO queda persistida en ningún lado — al anular
 * después, la nota crédito se reconstruye con consumidor final (o el
 * customer de la tabla `customers` si el pedido tiene uno vinculado),
 * no con los datos exactos que se usaron en el momento del cobro. Si
 * esto importa en la práctica, habría que persistir ese override en
 * el pedido o la factura para poder reconstruirlo fielmente.
 */
async function buildFactusPayloadForOrder(
  orderId: string,
  customerOverride?: {
    identification_document_code: string;
    identification: string;
    legal_organization_code: string;
    names?: string;
    company?: string;
  },
): Promise<FactusInvoicePayload | null> {
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      `id, business_id, customer_id,
       order_items(product_name, product_id, quantity, unit_price, total_price),
       customer:customers(full_name, phone, email, address)`,
    )
    .eq('id', orderId)
    .single();

  if (!order) return null;

  const { data: business } = await supabase
    .from('businesses')
    .select('dian_municipality_code, tax_responsibility')
    .eq('id', order.business_id)
    .single();

  const { data: payments } = await supabase
    .from('payments')
    .select('method, amount')
    .eq('order_id', orderId)
    .eq('status', 'paid');

  const productIds = order.order_items
    .map((i) => i.product_id)
    .filter((id): id is string => Boolean(id));

  const { data: products } = productIds.length
    ? await supabase
        .from('products')
        .select('id, unit_measure_code, standard_code, tax_code, tax_rate, tax_is_excluded')
        .in('id', productIds)
    : { data: [] };

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  function resolveTax(product: { tax_code: string | null; tax_rate: number | null; tax_is_excluded: boolean } | undefined) {
    if (product?.tax_code && product.tax_rate !== null) {
      return {
        tax_code: product.tax_code,
        tax_rate: product.tax_rate,
        tax_is_excluded: product.tax_is_excluded,
      };
    }

    switch (business?.tax_responsibility) {
      case 'iva':
        return { tax_code: '01', tax_rate: 19, tax_is_excluded: false };
      case 'inc':
        return { tax_code: '04', tax_rate: 8, tax_is_excluded: false };
      case 'exento':
      default:
        return { tax_code: '01', tax_rate: 0, tax_is_excluded: true };
    }
  }

  return mapOrderToFactusInvoice({
    id: order.id,
    customer: customerOverride
      ? {
          identification: customerOverride.identification,
          identification_document_code: customerOverride.identification_document_code,
          legal_organization_code: customerOverride.legal_organization_code,
          names: customerOverride.names,
          company: customerOverride.company,
          email: order.customer?.email,
          phone: order.customer?.phone,
          address: order.customer?.address,
        }
      : null,
    items: order.order_items.map((item) => {
      const product = item.product_id ? productMap.get(item.product_id) : undefined;
      const tax = resolveTax(product);
      return {
        product_name: item.product_name,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        unit_measure_code: product?.unit_measure_code ?? '94',
        standard_code: product?.standard_code ?? '999',
        tax_code: tax.tax_code,
        tax_rate: tax.tax_rate,
        tax_is_excluded: tax.tax_is_excluded,
      };
    }),
    payments: (payments ?? []).map((p) => ({ method: p.method, amount: p.amount })),
    businessMunicipalityCode: business?.dian_municipality_code ?? null,
  });
}

/**
 * Anula una factura electrónica ya emitida, mediante una Nota Crédito.
 * Factus exige customer/items/payment_details COMPLETOS en la nota
 * crédito (no solo una referencia al número de factura) — se
 * reconstruyen a partir del mismo pedido, vía buildFactusPayloadForOrder.
 */
export async function cancelInvoice(
  invoiceId: string,
  reason: string,
): Promise<CancelInvoiceResult> {
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, business_id, order_id, cufe, factus_number, status')
    .eq('id', invoiceId)
    .single();

  if (!invoice) {
    return { ok: false, reason: 'invoice_not_found', message: 'Factura no encontrada.' };
  }
  if (!invoice.cufe || !invoice.factus_number) {
    return {
      ok: false,
      reason: 'not_electronic',
      message: 'Esta factura no es electrónica — no requiere nota crédito, se puede anular localmente.',
    };
  }
  if (invoice.status === 'cancelled') {
    return { ok: false, reason: 'already_cancelled', message: 'Esta factura ya fue anulada.' };
  }
  if (!invoice.order_id) {
    return { ok: false, reason: 'factus_error', message: 'La factura no tiene un pedido asociado.' };
  }

  const credentials = await getFactusCredentialsForBusiness(invoice.business_id);
  if (!credentials) {
    return { ok: false, reason: 'no_factus_activation', message: 'Negocio sin Factus activo.' };
  }

  const payload = await buildFactusPayloadForOrder(invoice.order_id);
  if (!payload) {
    return { ok: false, reason: 'factus_error', message: 'No se pudo reconstruir los datos del pedido original.' };
  }

  const ranges = await getFactusNumberingRanges(credentials);
  const creditNoteRange = ranges.find((r) => r.document === 'Nota Crédito' && r.is_active);
  if (!creditNoteRange) {
    return {
      ok: false,
      reason: 'factus_error',
      message: 'El negocio no tiene un rango de numeración de Nota Crédito activo en Factus.',
    };
  }

  let response;
  try {
    response = await createFactusCreditNote(credentials, {
      reference_code: `CN-${invoice.id}`,
      bill_number: invoice.factus_number,
      numbering_range_id: creditNoteRange.id as number,
      correction_concept_code: '1', // PENDIENTE DE CONFIRMAR el catálogo completo con Factus
      payment_details: payload.payment_details,
      customer: payload.customer,
      items: payload.items,
      observation: reason,
    });
  } catch (err) {
    return {
      ok: false,
      reason: 'factus_error',
      message: err instanceof Error ? err.message : 'Error desconocido llamando a Factus.',
    };
  }

  await supabase.from('credit_notes').insert({
    business_id: invoice.business_id,
    invoice_id: invoice.id,
    factus_reference_code: response.data.reference_code,
    factus_number: response.data.number,
    cufe: response.data.cufe,
    qr_url: response.data.links.qr,
    public_url: response.data.links.public_url,
    is_dian_validated: response.data.is_validated,
    reason,
  });

  await supabase.from('invoices').update({ status: 'cancelled' }).eq('id', invoiceId);

  return {
    ok: true,
    creditNoteNumber: response.data.number,
    cufe: response.data.cufe,
    publicUrl: response.data.links.public_url,
  };
}

/**
 * Genera la factura electrónica de un pedido ya cerrado/pagado.
 *
 * IMPORTANTE — lo que este archivo NO hace todavía, a propósito:
 * - No maneja reintentos automáticos si Factus está caído — un error
 *   de Factus simplemente se devuelve como resultado "factus_error"
 *   para que el llamador decida (reintentar, avisar al usuario, etc.).
 */
export async function generateInvoiceForOrder(
  orderId: string,
  customerOverride?: {
    identification_document_code: string;
    identification: string;
    legal_organization_code: string;
    names?: string;
    company?: string;
  },
): Promise<GenerateInvoiceResult> {
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, business_id')
    .eq('id', orderId)
    .single();

  if (!order) {
    return { ok: false, reason: 'order_not_found', message: `Pedido ${orderId} no encontrado.` };
  }

  const credentials = await getFactusCredentialsForBusiness(order.business_id);
  if (!credentials) {
    return {
      ok: false,
      reason: 'no_factus_activation',
      message: 'Este negocio no tiene facturación electrónica activa.',
    };
  }

  const quota = await checkInvoiceQuota(order.business_id);
  if (!quota.allowed) {
    return {
      ok: false,
      reason: 'quota_exceeded',
      message: `Se agotó el cupo de facturas del plan (${quota.used}/${quota.limit} usadas este periodo).`,
    };
  }

  const payload = await buildFactusPayloadForOrder(orderId, customerOverride);
  if (!payload) {
    return { ok: false, reason: 'order_not_found', message: `Pedido ${orderId} no encontrado.` };
  }

  let response;
  try {
    response = await createFactusInvoice(credentials, payload);
  } catch (err) {
    return {
      ok: false,
      reason: 'factus_error',
      message: err instanceof Error ? err.message : 'Error desconocido llamando a Factus.',
    };
  }

  await supabase
    .from('invoices')
    .update({
      factus_reference_code: response.data.reference_code,
      factus_number: response.data.number,
      cufe: response.data.cufe,
      qr_url: response.data.links.qr,
      public_url: response.data.links.public_url,
      is_dian_validated: response.data.is_validated,
      dian_errors: response.data.errors as unknown as import('@/lib/types/database.types').Json,
      status: response.data.is_validated ? 'issued' : 'pending_validation',
    })
    .eq('order_id', orderId);

  return {
    ok: true,
    cufe: response.data.cufe,
    number: response.data.number,
    publicUrl: response.data.links.public_url,
    qrUrl: response.data.links.qr,
    isValidated: response.data.is_validated,
  };
}