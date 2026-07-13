import { createClient } from '@/lib/supabase/server'
import type { Customer, CustomerAddress } from '@/lib/types'
import type { TablesInsert, TablesUpdate } from '@/lib/types/database.types'

type CustomerInsert = TablesInsert<'customers'>
type CustomerUpdate = TablesUpdate<'customers'>
type CustomerAddressInsert = TablesInsert<'customer_addresses'>
type CustomerAddressUpdate = TablesUpdate<'customer_addresses'>

// ============================================================================
// CLIENTES
// ============================================================================

export async function getCustomers(businessId: string): Promise<Customer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .order('full_name', { ascending: true })

  if (error || !data) return []
  return data
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Busca un cliente existente por teléfono dentro de un negocio. Pensado
 * para el flujo del agente de IA por WhatsApp: antes de crear un cliente
 * nuevo, se revisa si ya existe uno con ese número.
 */
export async function findCustomerByPhone(
  businessId: string,
  phone: string
): Promise<Customer | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .eq('phone', phone)
    .maybeSingle()

  if (error || !data) return null
  return data
}

/**
 * Crea un cliente nuevo. Si ya existe uno con el mismo teléfono o email en
 * el negocio, Postgres rechaza el insert por los índices únicos parciales
 * que agregamos en la migración — se traduce el error aquí.
 */
export async function createCustomer(customer: CustomerInsert): Promise<Customer> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single()

  if (error) {
    if (error.message.includes('customers_business_id_phone_key')) {
      throw new Error('Ya existe un cliente con este teléfono')
    }
    if (error.message.includes('customers_business_id_email_key')) {
      throw new Error('Ya existe un cliente con este correo')
    }
    throw new Error(`Error creando cliente: ${error.message}`)
  }
  if (!data) {
    throw new Error('Error creando cliente: no se recibió respuesta')
  }
  return data
}

export async function updateCustomer(
  customerId: string,
  updates: CustomerUpdate
): Promise<Customer> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
    .single()

  if (error) {
    if (error.message.includes('customers_business_id_phone_key')) {
      throw new Error('Ya existe un cliente con este teléfono')
    }
    if (error.message.includes('customers_business_id_email_key')) {
      throw new Error('Ya existe un cliente con este correo')
    }
    throw new Error(`Error actualizando cliente: ${error.message}`)
  }
  if (!data) {
    throw new Error('Error actualizando cliente: no se recibió respuesta')
  }
  return data
}

// ============================================================================
// DIRECCIONES DE CLIENTE
// ============================================================================

export async function getCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })

  if (error || !data) return []
  return data
}

export async function getDefaultAddress(customerId: string): Promise<CustomerAddress | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_default', true)
    .maybeSingle()

  if (error || !data) return null
  return data
}

/**
 * Crea una dirección. Si se marca como default (o es la primera dirección
 * del cliente), desmarca cualquier otra default existente antes de crear
 * la nueva — la base de datos no impone "solo una default por cliente",
 * así que esa regla se garantiza aquí.
 */
export async function createCustomerAddress(
  address: CustomerAddressInsert
): Promise<CustomerAddress> {
  const supabase = await createClient()

  const isFirstAddress = await isCustomerWithoutAddresses(address.customer_id)
  const shouldBeDefault = address.is_default || isFirstAddress

  if (shouldBeDefault) {
    await clearDefaultAddresses(address.customer_id)
  }

  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({ ...address, is_default: shouldBeDefault })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error creando dirección: ${error?.message}`)
  }
  return data
}

export async function updateCustomerAddress(
  addressId: string,
  updates: CustomerAddressUpdate
): Promise<CustomerAddress> {
  const supabase = await createClient()

  // Si esta actualización marca la dirección como default, hay que
  // desmarcar las demás del mismo cliente primero.
  if (updates.is_default) {
    const { data: current } = await supabase
      .from('customer_addresses')
      .select('customer_id')
      .eq('id', addressId)
      .single()

    if (current) {
      await clearDefaultAddresses(current.customer_id)
    }
  }

  const { data, error } = await supabase
    .from('customer_addresses')
    .update(updates)
    .eq('id', addressId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Error actualizando dirección: ${error?.message}`)
  }
  return data
}

export async function deleteCustomerAddress(addressId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', addressId)

  if (error) {
    throw new Error(`Error eliminando dirección: ${error.message}`)
  }
}

// ---- Helpers internos ----

async function clearDefaultAddresses(customerId: string): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('customer_addresses')
    .update({ is_default: false })
    .eq('customer_id', customerId)
    .eq('is_default', true)
}

async function isCustomerWithoutAddresses(customerId: string): Promise<boolean> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('customer_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)

  return (count ?? 0) === 0
}