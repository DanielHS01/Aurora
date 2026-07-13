'use server'

import { requireBusinessAccess } from '@/lib/auth/session'
import {
  createCustomer,
  updateCustomer,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
} from '@/lib/queries/customers'
import { revalidatePath } from 'next/cache'

export async function createCustomerAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const fullName = (formData.get('fullName') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  await requireBusinessAccess(businessId)

  if (!phone && !email) {
    throw new Error('Debes registrar al menos un teléfono o un correo')
  }

  const customer = await createCustomer({
    business_id: businessId,
    full_name: fullName,
    phone,
    email,
    notes,
  })

  revalidatePath('/customers')
  return customer
}

export async function updateCustomerAction(
  customerId: string,
  businessId: string,
  formData: FormData
) {
  await requireBusinessAccess(businessId)

  const fullName = (formData.get('fullName') as string)?.trim() || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  await updateCustomer(customerId, { full_name: fullName, phone, email, notes })
  revalidatePath('/customers')
}

export async function createCustomerAddressAction(formData: FormData) {
  const businessId = formData.get('businessId') as string
  const customerId = formData.get('customerId') as string
  const address = (formData.get('address') as string)?.trim()
  const city = (formData.get('city') as string)?.trim() || null
  const reference = (formData.get('reference') as string)?.trim() || null
  const isDefault = formData.get('isDefault') === 'true'

  await requireBusinessAccess(businessId)

  if (!address) {
    throw new Error('La dirección es obligatoria')
  }

  await createCustomerAddress({
    business_id: businessId,
    customer_id: customerId,
    address,
    city,
    reference,
    is_default: isDefault,
  })

  revalidatePath('/customers')
}

export async function setDefaultAddressAction(addressId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  await updateCustomerAddress(addressId, { is_default: true })
  revalidatePath('/customers')
}

export async function deleteCustomerAddressAction(addressId: string, businessId: string) {
  await requireBusinessAccess(businessId)
  await deleteCustomerAddress(addressId)
  revalidatePath('/customers')
}