'use server'

import { createBusinessWithOwner } from '@/lib/queries/businesses'
import { revalidatePath } from 'next/cache'

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/

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
  const industry = (formData.get('industry') as string)?.trim() || undefined

  try {
    await createBusinessWithOwner({
      name,
      slug: rawSlug,
      phone,
      email,
      address,
      city,
      country,
      industry,
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