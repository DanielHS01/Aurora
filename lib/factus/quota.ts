// lib/factus/quota.ts

import { createAdminClient } from '@/lib/supabase/admin';

export type QuotaCheck = {
  allowed: boolean;
  used: number;
  limit: number | null; // null = ilimitado
  remaining: number | null;
};

/**
 * Cuenta las facturas DIAN emitidas en el periodo de facturación
 * actual del negocio (current_period_start → current_period_end de su
 * suscripción) contra el cupo incluido en su plan. No usa una tabla de
 * conteo aparte — cuenta directo sobre `invoices`, que ya guarda
 * cuándo se emitió cada una.
 */
export async function checkInvoiceQuota(businessId: string): Promise<QuotaCheck> {
  const supabase = createAdminClient();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('current_period_start, current_period_end, plan:plans!subscriptions_plan_id_fkey(included_invoices)')
    .eq('business_id', businessId)
    .single();

  const limit = subscription?.plan?.included_invoices ?? null;

  // Sin límite configurado en el plan = ilimitado, no hace falta
  // contar nada.
  if (limit === null) {
    return { allowed: true, used: 0, limit: null, remaining: null };
  }

  const { count: invoiceCount } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .not('cufe', 'is', null)
    .gte('created_at', subscription?.current_period_start ?? '1970-01-01')
    .lte('created_at', subscription?.current_period_end ?? '2999-12-31');

  // Las notas crédito también consumen un documento del cupo de
  // Factus (confirmado directamente con ellos) — se cuentan junto con
  // las facturas, no aparte.
  const { count: creditNoteCount } = await supabase
    .from('credit_notes')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .not('cufe', 'is', null)
    .gte('created_at', subscription?.current_period_start ?? '1970-01-01')
    .lte('created_at', subscription?.current_period_end ?? '2999-12-31');

  const used = (invoiceCount ?? 0) + (creditNoteCount ?? 0);
  const remaining = Math.max(0, limit - used);

  return { allowed: used < limit, used, limit, remaining };
}