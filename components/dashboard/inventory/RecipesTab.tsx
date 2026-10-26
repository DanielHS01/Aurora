'use client'

import { useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';

import type { InventoryItem, ComponentLine } from '@/lib/queries/inventory';
import type { CategoryWithProducts } from '@/lib/queries/menu';
import RecipeEditor, { type RecipeLine } from './RecipeEditor';
import { Modal } from './InventoryShared';

type StatusFilter = 'all' | 'missing' | 'done';

const selectClass =
  'h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30';

export default function RecipesTab({
  businessId,
  categories,
  items,
  components,
}: {
  businessId: string;
  categories: CategoryWithProducts[];
  items: InventoryItem[];
  components: ComponentLine[];
}) {
  const [recipes, setRecipes] = useState<Record<string, RecipeLine[]>>(() => {
    const map: Record<string, RecipeLine[]> = {};
    for (const line of components) {
      (map[line.product_id] ??= []).push({ item_id: line.item_id, quantity: line.quantity });
    }
    return map;
  });
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const hasRecipe = (productId: string) => (recipes[productId]?.length ?? 0) > 0;

  const totalProducts = categories.reduce((n, c) => n + c.products.length, 0);
  const missingCount = categories.reduce(
    (n, c) => n + c.products.filter((p) => !hasRecipe(p.id)).length,
    0
  );

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();

    return categories
      .filter((c) => !categoryId || c.id === categoryId)
      .map((c) => ({
        ...c,
        products: c.products.filter((p) => {
          if (q && !p.name.toLowerCase().includes(q)) return false;
          const done = (recipes[p.id]?.length ?? 0) > 0;
          if (status === 'missing') return !done;
          if (status === 'done') return done;
          return true;
        }),
      }))
      .filter((c) => c.products.length > 0);
  }, [categories, categoryId, search, status, recipes]);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-black/10 bg-gray-50/50 p-12 text-center">
        <p className="text-black/50">
          Primero crea algunos insumos en la pestaña &quot;Existencias&quot; para poder armar recetas.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm text-black/50">
        Cada receta indica cuánto de cada insumo lleva <strong>una porción</strong> del plato.
        Los platos sin receta no descuentan inventario.
      </p>

      <p className={`mb-4 text-sm ${missingCount > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>
        {missingCount > 0 ? (
          <>
            {missingCount} de {totalProducts} platos sin receta.{' '}
            {status !== 'missing' && (
              <button onClick={() => setStatus('missing')} className="underline">
                Ver solo los que faltan
              </button>
            )}
          </>
        ) : (
          `Todos tus platos (${totalProducts}) tienen receta.`
        )}
      </p>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar plato..."
            className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] pl-9 pr-4 text-sm outline-none focus:border-black/30"
          />
        </div>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className={selectClass}
          aria-label="Filtrar por estado de receta"
        >
          <option value="all">Todos</option>
          <option value="missing">Sin receta</option>
          <option value="done">Con receta</option>
        </select>
      </div>

      {filteredCategories.length === 0 ? (
        <p className="py-10 text-center text-sm text-black/40">Sin resultados con esos filtros.</p>
      ) : (
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <section key={category.id}>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-black/40">
                {category.name}
              </h3>
              <div className="divide-y divide-black/5 rounded-2xl border border-black/10 bg-white">
                {category.products.map((product) => {
                  const count = recipes[product.id]?.length ?? 0;
                  return (
                    <div key={product.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className={`text-xs ${count === 0 ? 'text-amber-600' : 'text-black/40'}`}>
                          {count === 0 ? 'Sin receta' : `${count} insumo(s)`}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditing({ id: product.id, name: product.name })}
                        className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-black/70 hover:bg-black/5"
                      >
                        {count === 0 ? 'Crear receta' : 'Editar receta'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={`Receta: ${editing.name}`} onClose={() => setEditing(null)}>
          <p className="mb-4 text-xs text-black/40">Cantidades por una porción.</p>
          <RecipeEditor
            businessId={businessId}
            productId={editing.id}
            items={items}
            initialLines={recipes[editing.id] ?? []}
            onSaved={(lines) => {
              setRecipes((prev) => ({ ...prev, [editing.id]: lines }));
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}