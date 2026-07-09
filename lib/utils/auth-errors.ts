/**
 * Traduce mensajes de error de Supabase Auth (siempre en inglés) a español.
 * Si no reconoce el mensaje, devuelve uno genérico en vez de exponer el
 * texto crudo de Supabase al usuario final.
 */
export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase()

  const errorMap: Record<string, string> = {
    'invalid login credentials': 'Correo o contraseña incorrectos',
    'email not confirmed': 'Debes confirmar tu correo antes de iniciar sesión',
    'user already registered': 'Ya existe una cuenta con este correo',
    'password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'unable to validate email address: invalid format': 'El formato del correo no es válido',
    'email rate limit exceeded': 'Se enviaron demasiados correos. Espera unos minutos e intenta de nuevo',
    'for security purposes, you can only request this once every': 'Espera un momento antes de solicitar esto de nuevo',
    'new password should be different from the old password': 'La nueva contraseña debe ser diferente a la anterior',
    'token has expired or is invalid': 'El enlace expiró o no es válido. Solicita uno nuevo',
    'signups not allowed for this instance': 'El registro no está disponible en este momento',
    'user not found': 'No existe una cuenta con este correo',
  }

  for (const [key, translated] of Object.entries(errorMap)) {
    if (normalized.includes(key)) return translated
  }

  // Fallback genérico — nunca exponemos el mensaje crudo si no lo reconocemos
  return 'Ocurrió un error. Intenta de nuevo en unos momentos'
}