'use server'

import { revalidatePath } from 'next/cache'
import {
  createBusinessWithOwner,
  updateBusiness,
  getCurrentUserBusiness,
} from '@/lib/queries/businesses'
import { getCurrentUserRole } from '@/lib/queries/business-users'
import type { BusinessRole } from '@/lib/types'

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ROLES_THAT_CAN_EDIT_BUSINESS: BusinessRole[] = ['owner', 'admin']

const BRAND_PALETTES = [
  { id: 'classic', primary: '#171717', secondary: '#FFFFFF' },
  { id: 'emerald', primary: '#059669', secondary: '#FFFFFF' },
  { id: 'blue', primary: '#2563EB', secondary: '#FFFFFF' },
  { id: 'wine', primary: '#9F1239', secondary: '#FFFFFF' },
] as const

export async function createBusinessAction(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const rawSlug = (formData.get('slug') as string)?.trim().toLowerCase()

  // Campos obligatorios a nivel de base de datos (NOT NULL en "businesses")
  if (!name) {
    throw new Error('El nombre del negocio es obligatorio')
  }
  if (!rawSlug) {
    throw new Error('El slug es obligatorio')
  }
  if (!SLUG_REGEX.test(rawSlug)) {
    throw new Error(
      'El slug solo puede tener minúsculas, números y guiones (ej: mi-restaurante)'
    )
  }

  // Campos opcionales — solo se incluyen si vienen en el formulario
  const phone = (formData.get('phone') as string)?.trim() || undefined
  const email = (formData.get('email') as string)?.trim() || undefined
  const address = (formData.get('address') as string)?.trim() || undefined
  const city = (formData.get('city') as string)?.trim() || undefined
  const country = (formData.get('country') as string)?.trim() || undefined
  const businessType = (formData.get('businessType') as string)?.trim() || undefined

  try {
    await createBusinessWithOwner({
      name,
      slug: rawSlug,
      phone,
      email,
      address,
      city,
      country,
      business_type: businessType,
    })
  } catch (err) {
    // Traduce el error de unicidad de Postgres a algo entendible
    if (err instanceof Error && err.message.includes('businesses_slug_key')) {
      throw new Error('Ese slug ya está en uso, elige otro')
    }
    throw err
  }

  revalidatePath('/test-business')
}

/**
 * Actualiza los datos generales del negocio (nombre, contacto, dirección)
 * desde /dashboard/account. Solo owner/admin pueden editar.
 */
export async function updateBusinessInfoAction(formData: FormData) {
  const business = await getCurrentUserBusiness()
  if (!business) {
    throw new Error('No se encontró tu negocio')
  }

  const role = await getCurrentUserRole(business.id)
  if (!role || !ROLES_THAT_CAN_EDIT_BUSINESS.includes(role)) {
    throw new Error('No tienes permiso para editar la información del negocio')
  }

  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || undefined
  const address = (formData.get('address') as string)?.trim() || undefined
  const city = (formData.get('city') as string)?.trim() || undefined
  const country = (formData.get('country') as string)?.trim() || undefined

  if (!name) {
    throw new Error('El nombre del negocio es obligatorio')
  }

  await updateBusiness(business.id, { name, phone, address, city, country })

  revalidatePath('/dashboard/account')
  revalidatePath('/dashboard')
}

/**
 * Actualiza la paleta de colores del negocio desde /dashboard/account.
 * Las paletas son fijas (no colores libres) para evitar combinaciones
 * ilegibles o marcas mal armadas. Solo owner/admin pueden editar.
 */
export async function updateBusinessBrandingAction(formData: FormData) {
  const business = await getCurrentUserBusiness()
  if (!business) {
    throw new Error('No se encontró tu negocio')
  }

  const role = await getCurrentUserRole(business.id)
  if (!role || !ROLES_THAT_CAN_EDIT_BUSINESS.includes(role)) {
    throw new Error('No tienes permiso para editar la marca del negocio')
  }

  const paletteId = formData.get('paletteId') as string
  const palette = BRAND_PALETTES.find((p) => p.id === paletteId)

  if (!palette) {
    throw new Error('Selecciona una paleta válida')
  }

  await updateBusiness(business.id, {
    primary_color: palette.primary,
    secondary_color: palette.secondary,
  })

  revalidatePath('/dashboard/account')
  revalidatePath('/dashboard')
}