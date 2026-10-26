'use client'

import { useState } from 'react';
import { FiTrash2, FiCheck } from 'react-icons/fi';

import { saveProductComponentsAction } from '@/lib/actions/inventoryActions';
import type { InventoryItem } from '@/lib/queries/inventory';
import { formatQuantity } from '@/lib/utils/inventory';
import { QuantityInput } from './InventoryShared';

export type RecipeLine = { item_id: string; quantity: number };

type EditableLine = { item_id: string; quantity: number | null };

export default function RecipeEditor({
  businessId,
  productId,
  items,
  initialLines,
  variant = 'primary',
  onSaved,
  onDirtyChange,
}: {
  businessId: string;
  productId: string;
  items: InventoryItem[];
  initialLines: RecipeLine[];
  variant?: 'primary' | 'outline';
  onSaved?: (lines: RecipeLine[]) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [lines, setLines] = useState<EditableLine[]>(initialLines.map((l) => ({ ...l })));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const byId = new Map(items.map((i) => [i.id, i]));
  const available = items.filter((i) => !lines.some((l) => l.item_id === i.id));

  function update(updater: (prev: EditableLine[]) => EditableLine[]) {
    setLines(updater);
    setSaved(false);
    onDirtyChange?.(true);
  }

  async function handleSave() {
    setError('');

    if (lines.length === 0 && initialLines.length === 0) {
      setError('Agrega al menos un insumo.');
      return;
    }
    if (lines.some((l) => !l.quantity || l.quantity <= 0)) {
      setError('Cada insumo necesita una cantidad mayor a 0.');
      return;
    }

    const clean = lines.map((l) => ({ item_id: l.item_id, quantity: l.quantity as number }));

    setLoading(true);
    try {
      const result = await saveProductComponentsAction(productId, businessId, clean);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      onDirtyChange?.(false);
      onSaved?.(clean);
    } catch {
      setError('No se pudo guardar la receta. Recarga la página e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const buttonClass =
    variant === 'primary'
      ? 'bg-[var(--brand-primary)] text-[var(--brand-secondary)]'
      : 'border border-black/10 text-black/70 hover:bg-black/5';

  return (
    <div>
      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {lines.map((line, index) => {
          const item = byId.get(line.item_id);
          if (!item) return null;

          return (
            <div key={line.item_id}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium">{item.name}</span>
                <button
                  type="button"
                  onClick={() => update((prev) => prev.filter((_, i) => i !== index))}
                  aria-label="Quitar insumo"
                  className="text-black/30 hover:text-red-600"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
              <QuantityInput
                unit={item.unit}
                initial={line.quantity ?? undefined}
                onChange={(value) =>
                  update((prev) => prev.map((l, i) => (i === index ? { ...l, quantity: value } : l)))
                }
              />
              {line.quantity ? (
                <p className="mt-1 text-xs text-black/30">
                  = {formatQuantity(line.quantity, item.unit)} por porción
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {available.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              update((prev) => [...prev, { item_id: e.target.value, quantity: null }]);
            }
          }}
          className="mt-4 h-11 w-full rounded-xl border border-dashed border-black/20 bg-white px-3 text-sm text-black/60 outline-none"
        >
          <option value="">+ Agregar insumo...</option>
          {available.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className={`mt-5 h-11 w-full rounded-xl text-sm font-medium disabled:opacity-60 ${buttonClass}`}
      >
        {loading ? 'Guardando...' : 'Guardar receta'}
      </button>

      {saved && (
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-emerald-600">
          <FiCheck size={12} /> Receta guardada
        </p>
      )}
    </div>
  );
}