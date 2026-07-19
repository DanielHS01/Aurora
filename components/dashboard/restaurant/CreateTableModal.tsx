'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX } from 'react-icons/fi';

import { createTableAction, createBusinessAreaAction } from '@/lib/actions/table-actions';
import type { BusinessArea } from '@/lib/types';

const NEW_AREA_VALUE = '__new__';

interface CreateTableModalProps {
  businessId: string;
  areas: BusinessArea[];
  onClose: () => void;
}

export default function CreateTableModal({
  businessId,
  areas,
  onClose,
}: CreateTableModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [areaId, setAreaId] = useState('');
  const [newAreaName, setNewAreaName] = useState('');

  const isCreatingNewArea = areaId === NEW_AREA_VALUE;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!tableNumber.trim()) {
      setError('Escribe un número o nombre para la mesa.');
      return;
    }

    if (isCreatingNewArea && !newAreaName.trim()) {
      setError('Escribe un nombre para la nueva área.');
      return;
    }

    setLoading(true);
    try {
      let resolvedAreaId = areaId;

      // Si el usuario eligió "+ Nueva área", la creamos primero y usamos
      // su id recién generado para la mesa — todo en el mismo submit.
      if (isCreatingNewArea) {
        const areaFormData = new FormData();
        areaFormData.set('businessId', businessId);
        areaFormData.set('name', newAreaName.trim());
        const newArea = await createBusinessAreaAction(areaFormData);
        resolvedAreaId = newArea.id;
      }

      const formData = new FormData();
      formData.set('businessId', businessId);
      formData.set('tableNumber', tableNumber.trim());
      formData.set('capacity', capacity);
      if (resolvedAreaId) formData.set('areaId', resolvedAreaId);

      await createTableAction(formData);

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
          <h3 className="text-lg font-semibold">Nueva mesa</h3>
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
          <label className="block" htmlFor="tableNumber">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Número o nombre
            </span>
            <input
              id="tableNumber"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Ej: 12, Barra 1"
              autoFocus
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <label className="block" htmlFor="capacity">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Capacidad (personas)
            </span>
            <input
              id="capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <label className="block" htmlFor="areaId">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Área (opcional)
            </span>
            <select
              id="areaId"
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
              <option value={NEW_AREA_VALUE}>+ Nueva área...</option>
            </select>
          </label>

          {isCreatingNewArea && (
            <label className="block" htmlFor="newAreaName">
              <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
                Nombre de la nueva área
              </span>
              <input
                id="newAreaName"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Ej: Terraza, Salón, Barra"
                autoFocus
                className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Creando...' : 'Crear mesa'}
          </button>
        </form>
      </div>
    </div>
  );
}