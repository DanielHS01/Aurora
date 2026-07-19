'use client'

import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

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
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-black/40">
          Categorías
        </h2>
        <button
          onClick={() => setShowCreateCategory(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-[var(--brand-secondary)] transition hover:opacity-90"
        >
          <FiPlus size={16} />
          Nueva categoría
        </button>
      </div>

      {categories.length === 0 && (
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

      {categories.map((category) => (
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