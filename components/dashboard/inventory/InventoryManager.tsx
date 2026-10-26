'use client'

import { useState } from 'react';

import type { InventoryItem, ComponentLine } from '@/lib/queries/inventory';
import type { CategoryWithProducts } from '@/lib/queries/menu';
import StockTab from './StockTab';
import RecipesTab from './RecipesTab';

export default function InventoryManager({
  businessId,
  initialItems,
  categories,
  components,
}: {
  businessId: string;
  initialItems: InventoryItem[];
  categories: CategoryWithProducts[];
  components: ComponentLine[];
}) {
  const [tab, setTab] = useState<'stock' | 'recipes'>('stock');
  // El estado vive aquí para que ambas pestañas vean los mismos insumos
  const [items, setItems] = useState(initialItems);

  return (
    <div>
      <div className="mb-6 inline-flex rounded-xl border border-black/10 bg-black/[0.02] p-1">
        {(
          [
            ['stock', 'Existencias'],
            ['recipes', 'Recetas'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === value ? 'bg-white shadow-sm' : 'text-black/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'stock' ? (
        <StockTab businessId={businessId} items={items} setItems={setItems} />
      ) : (
        <RecipesTab
          businessId={businessId}
          categories={categories}
          items={items}
          components={components}
        />
      )}
    </div>
  );
}