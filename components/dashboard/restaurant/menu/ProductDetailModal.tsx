'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiSliders, FiTrash2 } from 'react-icons/fi';

import { deactivateProductAction } from '@/lib/actions/menu-actions';
import type { CategoryWithProducts } from '@/lib/queries/menu';

type ProductWithOptions = CategoryWithProducts['products'][number];

interface ProductDetailModalProps {
  businessId: string;
  product: ProductWithOptions;
  onClose: () => void;
  onEdit: () => void;
  onManageOptions: () => void;
}

export default function ProductDetailModal({
  businessId,
  product,
  onClose,
  onEdit,
  onManageOptions,
}: ProductDetailModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDeactivate() {
    if (!confirm(`¿Eliminar "${product.name}" del menú?`)) return;
    setLoading(true);
    try {
      await deactivateProductAction(product.id, businessId);
      router.refresh();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error.');
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
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold">{product.name}</h3>
        {product.description && (
          <p className="mt-2 text-sm text-black/50">{product.description}</p>
        )}
        <p className="mt-3 text-lg font-medium">
          ${product.price.toLocaleString('es-CO')}
        </p>
        {product.preparation_time_minutes && (
          <p className="mt-1 text-xs text-black/40">
            Tiempo de preparación: {product.preparation_time_minutes} min
          </p>
        )}

        <div className="mt-4 rounded-xl border border-black/10 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-black/40">
            Opciones ({product.options.length})
          </p>
          {product.options.length === 0 ? (
            <p className="text-xs text-black/35">
              Sin opciones configuradas (ej. tamaño, término de la carne).
            </p>
          ) : (
            <ul className="space-y-1 text-xs text-black/60">
              {product.options.map((opt) => (
                <li key={opt.id}>
                  {opt.name} · {opt.values.length} valor(es)
                  {opt.is_required && ' · obligatoria'}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-sm font-medium text-black/70 hover:bg-black/5"
          >
            <FiEdit2 size={14} />
            Editar
          </button>
          <button
            onClick={onManageOptions}
            className="flex items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-sm font-medium text-black/70 hover:bg-black/5"
          >
            <FiSliders size={14} />
            Opciones
          </button>
        </div>

        <button
          onClick={handleDeactivate}
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          <FiTrash2 size={14} />
          Eliminar del menú
        </button>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-[var(--brand-primary)] py-2.5 text-sm font-medium text-[var(--brand-secondary)]"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}