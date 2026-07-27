'use server'

import crypto from 'crypto'
import { getCurrentUserBusiness } from '@/lib/queries/businesses'
import { getCurrentUserRole } from '@/lib/queries/business-users'
import type { BusinessRole } from '@/lib/types'

const ROLES_THAT_CAN_UPLOAD_LOGO: BusinessRole[] = ['owner', 'admin']

export type LogoUploadSignature = {
  signature: string
  timestamp: number
  folder: string
  publicId: string
  apiKey: string
  cloudName: string
}

/**
 * Genera la firma necesaria para subir el logo directo a Cloudinary
 * desde el navegador, sin que el API_SECRET viaje al cliente. El
 * public_id es fijo ("logo") para que cada subida nueva SOBRESCRIBA
 * la anterior — evita acumular logos huérfanos en Cloudinary cada vez
 * que el negocio cambia de imagen.
 */
export async function getLogoUploadSignatureAction(): Promise<LogoUploadSignature> {
  const business = await getCurrentUserBusiness()
  if (!business) {
    throw new Error('No se encontró tu negocio')
  }

  const role = await getCurrentUserRole(business.id)
  if (!role || !ROLES_THAT_CAN_UPLOAD_LOGO.includes(role)) {
    throw new Error('No tienes permiso para cambiar el logo del negocio')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `businesses/${business.id}/logo`
  const publicId = 'logo'
  const overwrite = 'true'

  // El orden alfabético de los parámetros es obligatorio para el
  // algoritmo de firma de Cloudinary — no es opcional ni cosmético.
  const paramsToSign = `folder=${folder}&overwrite=${overwrite}&public_id=${publicId}&timestamp=${timestamp}`

  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex')

  return {
    signature,
    timestamp,
    folder,
    publicId,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
  }
}
export async function getMenuImageUploadSignatureAction(
  productId: string
): Promise<LogoUploadSignature> {
  const business = await getCurrentUserBusiness()
  if (!business) {
    throw new Error('No se encontró tu negocio')
  }

  // A diferencia del logo (solo owner/admin), cualquier miembro activo
  // del negocio puede actualizar fotos de productos — es una tarea
  // operativa del día a día, no una decisión de marca.
  const role = await getCurrentUserRole(business.id)
  if (!role) {
    throw new Error('No tienes acceso a este negocio')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `businesses/${business.id}/menu`
  const publicId = productId
  const overwrite = 'true'

  const paramsToSign = `folder=${folder}&overwrite=${overwrite}&public_id=${publicId}&timestamp=${timestamp}`

  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex')

  return {
    signature,
    timestamp,
    folder,
    publicId,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
  }
}