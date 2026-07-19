'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX } from 'react-icons/fi';

import { updateTableAction } from '@/lib/actions/table-actions';
import type { BusinessArea } from '@/lib/types';
import type { RestaurantTableWithArea } from '@/lib/queries/tables';

interface EditTableModalProps {
  businessId: string;
  table: RestaurantTableWithArea;
  areas: BusinessArea[];
  onClose: () => void;
}

export default function EditTableModal({
  businessId,
  table,
  areas,
  onClose,
}: EditTableModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableNumber, setTableNumber] = useState(table.table_number);
  const [capacity, setCapacity] = useState(String(table.capacity ?? 2));
  const [areaId, setAreaId] = useState(table.area_id ?? '');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!tableNumber.trim()) {
      setError('Escribe un número o nombre para la mesa.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('tableNumber', tableNumber.trim());
      formData.set('capacity', capacity);
      if (areaId) formData.set('areaId', areaId);

      await updateTableAction(table.id, businessId, formData);

      router.refresh();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
      );
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
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Editar mesa</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-black/40 hover:text-black"
          >
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
          <label className="block" htmlFor="editTableNumber">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Número o nombre
            </span>
            <input
              id="editTableNumber"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              autoFocus
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <label className="block" htmlFor="editCapacity">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Capacidad (personas)
            </span>
            <input
              id="editCapacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          {areas.length > 0 && (
            <label className="block" htmlFor="editAreaId">
              <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
                Área
              </span>
              <select
                id="editAreaId"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
              >
                <option value="">Sin área</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
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
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}