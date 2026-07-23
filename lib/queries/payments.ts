import { createClient } from '@/lib/supabase/server'
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
  Invoice,
  InvoiceItem,
} from '@/lib/types'
import type { TablesUpdate } from '@/lib/types/database.types'

type InvoiceUpdate = TablesUpdate<'invoices'>

// ============================================================================
// PAGOS
// ============================================================================

export async function getPaymentsForOrder(orderId: string): Promise<Payment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data
}

export async function getOrderPaymentSummary(orderId: string): Promise<{
  total: number
  paid: number
  remaining: number
}> {
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('total')
    .eq('id', orderId)
    .single()

  const payments = await getPaymentsForOrder(orderId)
  const paid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const total = Number(order?.total ?? 0)

  return { total, paid, remaining: Math.max(total - paid, 0) }
}

export async function recordPayment(
  businessId: string,
  orderId: string,
  amount: number,
  method: PaymentMethod,
  options?: {
    status?: PaymentStatus
    provider?: string
    providerReference?: string
  }
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('record_payment', {
    p_business_id: businessId,
    p_order_id: orderId,
    p_amount: amount,
    p_method: method,
    p_status: options?.status ?? 'paid',
    p_provider: options?.provider,
    p_provider_reference: options?.providerReference,
  })

  if (error || !data) {
    throw new Error(`Error registrando pago: ${error?.message}`)
  }
  return data
}

export async function updatePaymentStatus(
  paymentId: string,
  orderId: string,
  status: PaymentStatus
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('update_payment_status', {
    p_payment_id: paymentId,
    p_order_id: orderId,
    p_status: status,
  })

  if (error) {
    throw new Error(`Error actualizando estado del pago: ${error.message}`)
  }
}

// ============================================================================
// FACTURAS
// ============================================================================

export type InvoiceWithItems = Invoice & {
  items: InvoiceItem[]
}

export async function getInvoices(businessId: string): Promise<Invoice[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}

export async function getInvoiceById(invoiceId: string): Promise<InvoiceWithItems | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select('*, items:invoice_items(*)')
    .eq('id', invoiceId)
    .single()

  if (error || !data) return null
  return data as InvoiceWithItems
}

/**
 * Genera una factura a partir de un pedido — número de factura, creación
 * de la factura y copia de sus ítems, todo en una sola transacción
 * atómica vía la función RPC create_invoice_from_order. El número se
 * genera con bloqueo de fila (FOR UPDATE) para que dos facturas
 * concurrentes del mismo negocio nunca colisionen.
 */
export async function createInvoiceFromOrder(orderId: string): Promise<InvoiceWithItems> {
  const supabase = await createClient()

  const { data: invoiceId, error } = await supabase.rpc('create_invoice_from_order', {
    p_order_id: orderId,
  })

  if (error || !invoiceId) {
    throw new Error(`Error creando factura: ${error?.message}`)
  }

  const invoice = await getInvoiceById(invoiceId)
  if (!invoice) {
    throw new Error('Error obteniendo la factura creada')
  }
  return invoice
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: string,
  pdfUrl?: string
): Promise<Invoice> {
  const supabase = await createClient()

  const updates: InvoiceUpdate = { status }
  if (status === 'issued' && !pdfUrl) {
    updates.issued_at = new Date().toISOString()
  }
  if (pdfUrl) {
    updates.pdf_url = pdfUrl
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando factura: ${error?.message}`)
  }
  return data
}