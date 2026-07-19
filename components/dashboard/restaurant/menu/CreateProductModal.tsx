'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX } from 'react-icons/fi';

import { createProductAction } from '@/lib/actions/menu-actions';

interface CreateProductModalProps {
  businessId: string;
  categoryId: string;
  onClose: () => void;
}

export default function CreateProductModal({
  businessId,
  categoryId,
  onClose,
}: CreateProductModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('El precio debe ser un número válido.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('businessId', businessId);
      formData.set('categoryId', categoryId);
      formData.set('name', name.trim());
      formData.set('description', description.trim());
      formData.set('price', price);
      if (preparationTime) formData.set('preparationTime', preparationTime);

      await createProductAction(formData);
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
          <h3 className="text-lg font-semibold">Nuevo producto</h3>
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
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-black/15 bg-black/[0.02] p-3 text-xs text-black/40">
            Imagen del producto: disponible próximamente.
          </div>

          <label className="block" htmlFor="productName">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Nombre
            </span>
            <input
              id="productName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <label className="block" htmlFor="productDescription">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Descripción (opcional)
            </span>
            <input
              id="productDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block" htmlFor="productPrice">
              <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
                Precio
              </span>
              <input
                id="productPrice"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
              />
            </label>

            <label className="block" htmlFor="productPrepTime">
              <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
                Prep. (min)
              </span>
              <input
                id="productPrepTime"
                type="number"
                min={0}
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Creando...' : 'Crear producto'}
          </button>
        </form>
      </div>
    </div>
  );
}