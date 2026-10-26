import { UserFacingError } from '@/lib/errors'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

// redirect(), notFound() y similares se implementan lanzando errores
// especiales: hay que dejarlos pasar.
function isNextControlFlowError(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest
  return (
    typeof digest === 'string' &&
    (digest.startsWith('NEXT_REDIRECT') ||
      digest === 'NEXT_NOT_FOUND' ||
      digest.startsWith('NEXT_HTTP_ERROR_FALLBACK'))
  )
}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    if (isNextControlFlowError(err)) throw err

    if (err instanceof UserFacingError || (err as Error | null)?.name === 'UserFacingError') {
      return { ok: false, error: (err as Error).message }
    }

    // Inesperado: queda en los logs del servidor, el usuario ve un texto genérico
    console.error('Error inesperado en Server Action:', err)
    return { ok: false, error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}