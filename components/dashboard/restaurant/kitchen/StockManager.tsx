'use client'

import { useMemo, useState } from 'react';
import { FiAlertTriangle, FiSearch, FiSliders, FiX } from 'react-icons/fi';

import { toggleProductSoldOutAction } from '@/lib/actions/menu-actions';
import type { CategoryWithProducts } from '@/lib/queries/menu';

interface StockManagerProps {
  businessId: string;
  categories: CategoryWithProducts[];
}

export default function StockManager({ businessId, categories }: StockManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Solo rastrea qué productos están marcados agotado — más simple que
  // clonar toda la estructura de categorías/productos en estado local.
  const [soldOutOverrides, setSoldOutOverrides] = useState<Record<string, boolean>>({});

  const allProducts = categories.flatMap((c) => c.products);
  const effectiveSoldOutCount = allProducts.filter(
    (p) => soldOutOverrides[p.id] ?? (p.is_sold_out ?? false)
  ).length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/70 hover:bg-black/5"
      >
        <FiSliders size={15} />
        Disponibilidad de platos
        {effectiveSoldOutCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
            <FiAlertTriangle size={11} />
            {effectiveSoldOutCount}
          </span>
        )}
      </button>

      {isOpen && (
        <StockManagerModal
          businessId={businessId}
          categories={categories}
          overrides={soldOutOverrides}
          onToggleLocal={(productId, value) =>
            setSoldOutOverrides((prev) => ({ ...prev, [productId]: value }))
          }
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function StockManagerModal({
  businessId,
  categories,
  overrides,
  onToggleLocal,
  onClose,
}: {
  businessId: string;
  categories: CategoryWithProducts[];
  overrides: Record<string, boolean>;
  onToggleLocal: (productId: string, value: boolean) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;

    return categories
      .map((c) => ({
        ...c,
        products: c.products.filter((p) => p.name.toLowerCase().includes(query)),
      }))
      .filter((c) => c.products.length > 0);
  }, [categories, searchQuery]);

  async function handleToggle(productId: string, currentlySoldOut: boolean) {
    setLoadingId(productId);
    // Optimista: refleja el cambio de inmediato, antes de esperar al
    // servidor — si falla, se revierte.
    onToggleLocal(productId, !currentlySoldOut);
    try {
      await toggleProductSoldOutAction(productId, businessId, !currentlySoldOut);
    } catch (err) {
      onToggleLocal(productId, currentlySoldOut); // revierte
      alert(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Disponibilidad de platos</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <FiX size={20} />
          </button>
        </div>

        <div className="relative mb-4">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar plato..."
            autoFocus
            className="h-10 w-full rounded-xl border border-black/10 bg-black/[0.02] pl-9 pr-4 text-sm outline-none focus:border-black/30"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredCategories.length === 0 ? (
            <p className="py-8 text-center text-sm text-black/40">Sin resultados.</p>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-black/40">
                  {category.name}
                </p>
                <div className="space-y-1">
                  {category.products.map((product) => {
                    const isSoldOut = overrides[product.id] ?? (product.is_sold_out ?? false);
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-black/[0.02]"
                      >
                        <span className={`text-sm ${isSoldOut ? 'text-black/40 line-through' : ''}`}>
                          {product.name}
                        </span>
                        <button
                          onClick={() => handleToggle(product.id, isSoldOut)}
                          disabled={loadingId === product.id}
                          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                            isSoldOut ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          aria-label={isSoldOut ? 'Marcar disponible' : 'Marcar agotado'}
                        >
                          <span
                            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                              isSoldOut ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}