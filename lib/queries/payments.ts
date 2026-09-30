import { createClient } from '@/lib/supabase/server'
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
  Invoice,
  InvoiceItem,
  Customer,
  OrderType,
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
export type InvoiceWithDetails = Invoice & {
  customer: Customer | null
  order: {
    order_type: OrderType
    notes: string | null
    table: { table_number: string } | null
  } | null
}

/**
 * Trae las facturas de un negocio con el contexto necesario para
 * mostrarlas en una tabla legible: cliente, tipo de operación y notas
 * del pedido asociado — pensado para /dashboard/invoices.
 */
export async function getInvoicesWithDetails(
  businessId: string
): Promise<InvoiceWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select(
      '*, customer:customers(*), order:orders(order_type, notes, table:restaurant_tables(table_number))'
    )
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as InvoiceWithDetails[]
}
export type InvoiceSortOption =
  | 'recent'
  | 'oldest'
  | 'customer_asc'
  | 'customer_desc'
  | 'total_desc'
  | 'total_asc'

export type InvoiceFilters = {
  page: number
  pageSize: number
  search?: string
  orderType?: OrderType
  sort?: InvoiceSortOption
  // 'electronic' = tiene CUFE (se emitió ante la DIAN vía Factus)
  // 'local' = solo comprobante interno, sin CUFE todavía/nunca
  documentType?: 'all' | 'electronic' | 'local'
}

export async function getInvoicesPaginated(
  businessId: string,
  filters: InvoiceFilters
): Promise<{ invoices: InvoiceWithDetails[]; totalCount: number }> {
  const supabase = await createClient()
  const { page, pageSize, search, orderType, sort = 'recent', documentType = 'all' } = filters

  // Búsqueda por nombre de cliente: como el nombre vive en otra tabla,
  // primero resolvemos qué customer_id coinciden, y filtramos por eso.
  let matchingCustomerIds: string[] = []
  if (search) {
    const { data } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', businessId)
      .ilike('full_name', `%${search}%`)
    matchingCustomerIds = (data ?? []).map((c) => c.id)
  }

  // Filtro por tipo de operación: mismo caso, order_type vive en "orders".
  let matchingOrderIds: string[] | null = null
  if (orderType) {
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('business_id', businessId)
      .eq('order_type', orderType)
    matchingOrderIds = (data ?? []).map((o) => o.id)
  }

  let query = supabase
    .from('invoices')
    .select(
      '*, customer:customers(*), order:orders(order_type, notes, table:restaurant_tables(table_number))',
      { count: 'exact' }
    )
    .eq('business_id', businessId)

  if (matchingOrderIds) {
    query = query.in(
      'order_id',
      matchingOrderIds.length > 0
        ? matchingOrderIds
        : ['00000000-0000-0000-0000-000000000000'] // fuerza 0 resultados si no hay match
    )
  }

  if (search) {
    const conditions = [`invoice_number.ilike.%${search}%`]
    if (matchingCustomerIds.length > 0) {
      conditions.push(`customer_id.in.(${matchingCustomerIds.join(',')})`)
    }
    query = query.or(conditions.join(','))
  }

  if (documentType === 'electronic') {
    query = query.not('cufe', 'is', null)
  } else if (documentType === 'local') {
    query = query.is('cufe', null)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'total_desc':
      query = query.order('total', { ascending: false })
      break
    case 'total_asc':
      query = query.order('total', { ascending: true })
      break
    // 'customer_asc'/'customer_desc' y 'recent' comparten el mismo
    // order() base — el reordenamiento por cliente pasa DESPUÉS,
    // en memoria, solo dentro de la página ya traída (ver nota abajo).
    default:
      query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error || !data) return { invoices: [], totalCount: 0 }

  let invoices = data as InvoiceWithDetails[]

  if (sort === 'customer_asc' || sort === 'customer_desc') {
    invoices = [...invoices].sort((a, b) => {
      const nameA = (a.customer?.full_name ?? '').toLowerCase()
      const nameB = (b.customer?.full_name ?? '').toLowerCase()
      return sort === 'customer_asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
    })
  }

  return { invoices, totalCount: count ?? 0 }
}