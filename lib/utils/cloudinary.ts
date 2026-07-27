/**
 * Inserta parámetros de transformación de Cloudinary en una URL ya
 * subida. No modifica el archivo original — Cloudinary genera y
 * cachea la versión transformada la primera vez que se pide.
 */
export function cloudinaryTransform(url: string, transformation: string): string {
  if (!url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/${transformation}/`)
}

export const LOGO_THUMBNAIL = 'w_64,h_64,c_fill,f_auto,q_auto'
export const LOGO_PREVIEW = 'w_160,h_160,c_fill,f_auto,q_auto'
export const MENU_THUMBNAIL = 'w_150,h_150,c_fill,f_auto,q_auto'
export const MENU_DETAIL = 'w_400,h_400,c_fill,f_auto,q_auto'