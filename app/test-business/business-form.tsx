'use client'

import { createBusinessAction } from '@/lib/actions/business-actions'
import { useState } from 'react'

export function BusinessForm() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      await createBusinessAction(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <input
        name="name"
        placeholder="Nombre del negocio"
        className="border rounded px-3 py-2"
        required
      />
      <input
        name="slug"
        placeholder="slug-del-negocio"
        className="border rounded px-3 py-2"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
      >
        {pending ? 'Creando...' : 'Crear negocio'}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  )
}