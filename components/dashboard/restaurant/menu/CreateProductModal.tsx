'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiCheck } from 'react-icons/fi';

import { createProductAction } from '@/lib/actions/menu-actions';
import { TAX_PRESETS, type TaxPresetValue } from '@/lib/constants/taxPresets';
import type { Product } from '@/lib/types';
import ProductImageUploader from './ProductImageUploader';

interface CreateProductModalProps {
  businessId: string;
  categoryId: string;
  isFactusActive: boolean;
  onClose: () => void;
}

export default function CreateProductModal({
  businessId,
  categoryId,
  isFactusActive,
  onClose,
}: CreateProductModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [preparationTime, setPreparationTime] = useState('');
  const [taxPreset, setTaxPreset] = useState<TaxPresetValue>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cuando el producto ya se creó, guardamos aquí el objeto — su
  // existencia decide si mostramos el formulario (paso 1) o el
  // uploader de foto (paso 2), sin cerrar el modal entre ambos.
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

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
      if (isFactusActive) formData.set('taxPreset', taxPreset);

      const product = await createProductAction(formData);
      setCreatedProduct(product);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={createdProduct ? undefined : onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {createdProduct ? (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">¡Producto creado!</h3>
              <button onClick={onClose} className="text-black/40 hover:text-black">
                <FiX size={20} />
              </button>
            </div>

            <p className="mb-5 text-sm text-black/50">
              Puedes agregarle una foto ahora, o hacerlo después desde el
              menú.
            </p>

            <ProductImageUploader
              businessId={businessId}
              productId={createdProduct.id}
              currentImageUrl={null}
            />

            <button
              onClick={onClose}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)]"
            >
              <FiCheck size={15} />
              Listo
            </button>
          </>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nuevo producto</h3>
              <button onClick={onClose} className="text-black/40 hover:text-black">
                <FiX size={20} />
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

              {isFactusActive && (
                <label className="block" htmlFor="productTax">
                  <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
                    Impuesto (DIAN)
                  </span>
                  <select
                    id="productTax"
                    value={taxPreset}
                    onChange={(e) => setTaxPreset(e.target.value as TaxPresetValue)}
                    className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
                  >
                    {TAX_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Creando...' : 'Crear producto'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}