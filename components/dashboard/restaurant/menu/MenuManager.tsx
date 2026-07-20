'use client'

import { useMemo, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';

import { deactivateMenuCategoryAction } from '@/lib/actions/menu-actions';
import { useRouter } from 'next/navigation';
import type { CategoryWithProducts } from '@/lib/queries/menu';

import CreateCategoryModal from './CreateCategoryModal';
import EditCategoryModal from './EditCategoryModal';
import CreateProductModal from './CreateProductModal';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import EditProductModal from './EditProductModal';
import ProductOptionsModal from './ProductOptionsModal';

interface MenuManagerProps {
  businessId: string;
  categories: CategoryWithProducts[];
}

export default function MenuManager({
  businessId,
  categories,
}: MenuManagerProps) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');

  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [createProductForCategoryId, setCreateProductForCategoryId] =
    useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(
    null
  );
  const [optionsProductId, setOptionsProductId] = useState<string | null>(
    null
  );

  // Filtra productos por nombre dentro de cada categoría. Si una
  // categoría se queda sin productos tras el filtro, se oculta entera
  // — así el mesero solo ve lo relevante, no categorías vacías.
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;

    return categories
      .map((category) => ({
        ...category,
        products: category.products.filter((product) =>
          product.name.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.products.length > 0);
  }, [categories, searchQuery]);

  const totalMatches = filteredCategories.reduce(
    (sum, c) => sum + c.products.length,
    0
  );

  // Helpers para resolver el objeto fresco a partir del id — así, tras un
  // router.refresh(), los modales abiertos muestran datos actualizados
  // en vez de quedarse con una copia vieja capturada al abrirlos.
  const editingCategory = categories.find((c) => c.id === editingCategoryId);
  const allProducts = categories.flatMap((c) => c.products);
  const selectedProduct = allProducts.find((p) => p.id === selectedProductId);
  const editingProduct = allProducts.find((p) => p.id === editingProductId);
  const optionsProduct = allProducts.find((p) => p.id === optionsProductId);

  async function handleDeactivateCategory(categoryId: string) {
    if (
      !confirm(
        '¿Desactivar esta categoría? Sus productos dejarán de aparecer en el menú.'
      )
    ) {
      return;
    }
    try {
      await deactivateMenuCategoryAction(categoryId, businessId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error.');
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-black/40">
          Categorías
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar plato..."
              className="h-10 w-full rounded-xl border border-black/10 bg-black/[0.02] pl-9 pr-9 text-sm outline-none focus:border-black/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowCreateCategory(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-[var(--brand-secondary)] transition hover:opacity-90"
          >
            <FiPlus size={16} />
            Nueva categoría
          </button>
        </div>
      </div>

      {searchQuery && (
        <p className="-mt-6 text-xs text-black/40">
          {totalMatches === 0
            ? `Sin resultados para "${searchQuery}"`
            : `${totalMatches} resultado(s) para "${searchQuery}"`}
        </p>
      )}

      {filteredCategories.length === 0 && !searchQuery && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-black/10 rounded-3xl bg-gray-50/50">
          <p className="text-black/60 font-medium mb-4">
            Aún no tienes categorías en tu menú.
          </p>
          <button
            onClick={() => setShowCreateCategory(true)}
            className="px-4 py-2 bg-[var(--brand-primary)] text-[var(--brand-secondary)] text-sm rounded-full hover:opacity-90 transition-opacity"
          >
            + Crear primera categoría
          </button>
        </div>
      )}

      {filteredCategories.map((category) => (
        <section key={category.id}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-black/40">
                  {category.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingCategoryId(category.id)}
                aria-label="Editar categoría"
                className="rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <FiEdit2 size={15} />
              </button>
              <button
                onClick={() => handleDeactivateCategory(category.id)}
                aria-label="Eliminar categoría"
                className="rounded-lg p-2 text-black/40 hover:bg-red-50 hover:text-red-600"
              >
                <FiTrash2 size={15} />
              </button>
              <button
                onClick={() => setCreateProductForCategoryId(category.id)}
                className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-black/70 hover:bg-black/5"
              >
                <FiPlus size={13} />
                Producto
              </button>
            </div>
          </div>

          {category.products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-gray-50/50 p-6 text-center text-sm text-black/40">
              Sin productos todavía.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {category.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProductId(product.id)}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {showCreateCategory && (
        <CreateCategoryModal
          businessId={businessId}
          onClose={() => setShowCreateCategory(false)}
        />
      )}

      {editingCategory && (
        <EditCategoryModal
          businessId={businessId}
          category={editingCategory}
          onClose={() => setEditingCategoryId(null)}
        />
      )}

      {createProductForCategoryId && (
        <CreateProductModal
          businessId={businessId}
          categoryId={createProductForCategoryId}
          onClose={() => setCreateProductForCategoryId(null)}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          businessId={businessId}
          product={selectedProduct}
          onClose={() => setSelectedProductId(null)}
          onEdit={() => {
            setEditingProductId(selectedProduct.id);
            setSelectedProductId(null);
          }}
          onManageOptions={() => {
            setOptionsProductId(selectedProduct.id);
            setSelectedProductId(null);
          }}
        />
      )}

      {editingProduct && (
        <EditProductModal
          businessId={businessId}
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProductId(null)}
        />
      )}

      {optionsProduct && (
        <ProductOptionsModal
          businessId={businessId}
          product={optionsProduct}
          onClose={() => setOptionsProductId(null)}
        />
      )}
    </div>
  );
}