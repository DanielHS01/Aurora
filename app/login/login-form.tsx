'use client'

import { signInAction, signUpAction } from '@/lib/actions/auth-actions'
import { useState } from 'react'

export function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signedUp, setSignedUp] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      if (mode === 'signup') {
        await signUpAction(formData)
        setSignedUp(true)
      } else {
        await signInAction(formData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setPending(false)
    }
  }

  if (signedUp) {
    return <p>Revisa tu correo para confirmar la cuenta antes de iniciar sesión.</p>
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      {mode === 'signup' && (
        <input name="fullName" placeholder="Nombre completo" className="border rounded px-3 py-2" required />
      )}
      <input name="email" type="email" placeholder="Correo" className="border rounded px-3 py-2" required />
      <input name="password" type="password" placeholder="Contraseña" className="border rounded px-3 py-2" required minLength={6} />

      <button type="submit" disabled={pending} className="bg-black text-white rounded px-3 py-2 disabled:opacity-50">
        {pending ? 'Procesando...' : mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="button"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        className="text-sm underline"
      >
        {mode === 'signin' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </form>
  )
}