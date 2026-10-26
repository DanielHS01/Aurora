'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEyeOff } from 'react-icons/fi';

import {
  listInactiveProductsAction,
  reactivateProductAction,
} from '@/lib/actions/productStatusActions';
import type { InactiveProduct, ActiveCategoryOption } from '@/lib/queries/menu';
import { Modal } from '@/components/dashboard/inventory/InventoryShared';

export default function InactiveProductsButton({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-black/70 hover:bg-black/5"
      >
        <FiEyeOff size={15} />
        Platos desactivados
      </button>

      {open && <InactiveProductsModal businessId={businessId} onClose={() => setOpen(false)} />}
    </>
  );
}

function InactiveProductsModal({
  businessId,
  onClose,
}: {
  businessId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [products, setProducts] = useState<InactiveProduct[] | null>(null); // null = cargando
  const [categories, setCategories] = useState<ActiveCategoryOption[]>([]);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listInactiveProductsAction(businessId)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setProducts(result.data.products);
          setCategories(result.data.activeCategories);
        } else {
          setError(result.error);
          setProducts([]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('No se pudo cargar la lista. Recarga la página.');
        setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  function handleClose() {
    if (changed) router.refresh(); // una sola vez, para que el menú muestre lo reactivado
    onClose();
  }

  async function handleReactivate(product: InactiveProduct) {
    setError('');
    setNotice('');

    const categoryId = product.category_active ? undefined : choices[product.id];
    if (!product.category_active && !categoryId) {
      setError('Elige una categoría para este plato.');
      return;
    }

    setBusyId(product.id);
    try {
      const result = await reactivateProductAction(product.id, businessId, categoryId);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setProducts((prev) => (prev ?? []).filter((p) => p.id !== product.id));
      setChanged(true);

      const removed = result.data.removedArchivedIngredients;
      setNotice(
        `"${product.name}" volvió al menú.` +
          (removed > 0
            ? ` Se quitaron ${removed} insumo(s) archivado(s) de su receta; revísala en Inventario.`
            : '')
      );
    } catch {
      setError('No se pudo reactivar. Recarga la página e inténtalo de nuevo.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal title="Platos desactivados" onClose={handleClose}>
      <p className="mb-4 text-xs text-black/40">
        Los platos desactivados no se borran: conservan su historial y su receta. Reactívalos
        aquí en vez de crearlos de nuevo.
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {products === null ? (
        <div className="space-y-3" aria-hidden>
          <div className="h-14 animate-pulse rounded-xl bg-black/5" />
          <div className="h-14 animate-pulse rounded-xl bg-black/5" />
        </div>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-sm text-black/40">No tienes platos desactivados.</p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-xl border border-black/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-black/40">
                    ${product.price.toLocaleString('es-CO')}
                    {product.category_active && product.category_name
                      ? ` · ${product.category_name}`
                      : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleReactivate(product)}
                  disabled={busyId !== null}
                  className="shrink-0 rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-medium text-[var(--brand-secondary)] disabled:opacity-50"
                >
                  {busyId === product.id ? 'Reactivando...' : 'Reactivar'}
                </button>
              </div>

              {!product.category_active && (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs text-amber-700">
                    Su categoría fue desactivada. Elige una para reactivarlo:
                  </p>
                  {categories.length === 0 ? (
                    <p className="text-xs text-black/40">Primero crea una categoría activa.</p>
                  ) : (
                    <select
                      value={choices[product.id] ?? ''}
                      onChange={(e) =>
                        setChoices((prev) => ({ ...prev, [product.id]: e.target.value }))
                      }
                      className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none"
                    >
                      <option value="">Elegir categoría...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}