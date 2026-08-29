'use client'

import { useState } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

import { retryBusinessSetupAction } from '@/lib/actions/auth-actions';

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'barber shop', label: 'Barbería' },
  { value: 'optical', label: 'Óptica' },
] as const;

export default function SetupBusinessForm({
  initialName,
  initialType,
}: {
  initialName: string;
  initialType: string;
}) {
  const [name, setName] = useState(initialName);
  const [businessType, setBusinessType] = useState(initialType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre del negocio es obligatorio.');
      return;
    }
    if (!businessType) {
      setError('Selecciona un tipo de negocio.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('businessName', name.trim());
      formData.set('businessType', businessType);
      await retryBusinessSetupAction(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-3xl border border-black/10 bg-white p-7 shadow-xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <FiAlertTriangle size={20} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Completemos tu negocio
        </h1>
        <p className="mt-2 text-sm text-black/50">
          Tu cuenta está confirmada, pero algo interrumpió la creación de tu
          negocio. Completa estos datos para terminar.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label className="block" htmlFor="businessName">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Nombre del negocio
          </span>
          <input
            id="businessName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
          />
        </label>

        <label className="block" htmlFor="businessType">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Tipo de negocio
          </span>
          <select
            id="businessType"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
          >
            <option value="" disabled>Selecciona una opción</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Creando...' : 'Crear mi negocio'}
        </button>
      </form>
    </div>
  );
}