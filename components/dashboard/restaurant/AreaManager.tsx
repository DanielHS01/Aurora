'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTag } from 'react-icons/fi';

import { createBusinessAreaAction } from '@/lib/actions/table-actions';
import type { BusinessArea } from '@/lib/types';

interface AreaManagerProps {
  businessId: string;
  areas: BusinessArea[];
}

export default function AreaManager({ businessId, areas }: AreaManagerProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Escribe un nombre para el área.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('businessId', businessId);
      formData.set('name', name.trim());

      await createBusinessAreaAction(formData);

      setName('');
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-black/40">
        <FiTag size={13} />
        Áreas
      </span>

      {areas.map((area) => (
        <span
          key={area.id}
          className="rounded-full border border-black/10 bg-black/[0.02] px-3 py-1 text-xs text-black/60"
        >
          {area.name}
        </span>
      ))}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-full border border-dashed border-black/20 px-3 py-1 text-xs text-black/50 hover:border-black/40 hover:text-black"
        >
          <FiPlus size={12} />
          Nueva área
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Terraza, Salón, Barra"
            autoFocus
            className="h-8 rounded-full border border-black/10 bg-white px-3 text-xs outline-none focus:border-black/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[var(--brand-primary)] px-3 py-1 text-xs font-medium text-[var(--brand-secondary)] disabled:opacity-60"
          >
            {loading ? '...' : 'Crear'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setError('');
            }}
            className="text-xs text-black/40 hover:text-black"
          >
            Cancelar
          </button>
        </form>
      )}

      {error && (
        <span className="w-full text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}