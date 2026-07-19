// components/dashboard/restaurant/menu/EditCategoryModal.tsx
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX } from 'react-icons/fi';

import { updateMenuCategoryAction } from '@/lib/actions/menu-actions';
import type { MenuCategory } from '@/lib/types';

interface EditCategoryModalProps {
  businessId: string;
  category: MenuCategory;
  onClose: () => void;
}

export default function EditCategoryModal({
  businessId,
  category,
  onClose,
}: EditCategoryModalProps) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('name', name.trim());
      formData.set('description', description.trim());

      await updateMenuCategoryAction(category.id, businessId, formData);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Editar categoría</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <label className="block" htmlFor="editCategoryName">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Nombre
            </span>
            <input
              id="editCategoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <label className="block" htmlFor="editCategoryDescription">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Descripción (opcional)
            </span>
            <input
              id="editCategoryDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}