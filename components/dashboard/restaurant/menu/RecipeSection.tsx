'use client'

import type { InventoryItem } from '@/lib/queries/inventory';
import RecipeEditor from '@/components/dashboard/inventory/RecipeEditor';

export default function RecipeSection({
  businessId,
  productId,
  items,
  onDirtyChange,
}: {
  businessId: string;
  productId: string;
  items: InventoryItem[] | null; // null = todavía cargando
  onDirtyChange: (dirty: boolean) => void;
}) {
  if (items === null) {
    return (
      <div className="mt-6 border-t border-black/10 pt-5" aria-hidden>
        <div className="h-4 w-28 animate-pulse rounded bg-black/5" />
        <div className="mt-3 h-11 w-full animate-pulse rounded-xl bg-black/5" />
      </div>
    );
  }

  // Un restaurante sin insumos (o que no usa inventario) nunca ve esta sección
  if (items.length === 0) return null;

  return (
    <div className="mt-6 border-t border-black/10 pt-5">
      <h4 className="text-sm font-medium">Receta (opcional)</h4>
      <p className="mb-4 mt-1 text-xs text-black/40">
        Cuánto de cada insumo lleva una porción. Si la omites, este plato no descuenta inventario.
      </p>
      <RecipeEditor
        businessId={businessId}
        productId={productId}
        items={items}
        initialLines={[]}
        variant="outline"
        onDirtyChange={onDirtyChange}
      />
    </div>
  );
}