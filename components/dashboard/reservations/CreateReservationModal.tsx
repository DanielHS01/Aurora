'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX } from 'react-icons/fi';

import { createReservationAction } from '@/lib/actions/reservation-actions';

export default function CreateReservationModal({
  businessId,
  onClose,
}: {
  businessId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [peopleCount, setPeopleCount] = useState('2');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!customerPhone.trim() || !date || !time) {
      setError('Teléfono, fecha y hora son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('businessId', businessId);
      formData.set('customerName', customerName.trim());
      formData.set('customerPhone', customerPhone.trim());
      formData.set('reservationDate', date);
      formData.set('reservationTime', time);
      formData.set('peopleCount', peopleCount);
      formData.set('notes', notes.trim());

      await createReservationAction(formData);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
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
          <h3 className="text-lg font-semibold">Nueva reserva</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <label className="block" htmlFor="customerName">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Nombre del cliente (opcional)
            </span>
            <input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              autoFocus
              className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <label className="block" htmlFor="customerPhone">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Teléfono
            </span>
            <input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="573001234567"
              className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block" htmlFor="date">
              <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
                Fecha
              </span>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-3 text-sm outline-none focus:border-black/30"
              />
            </label>
            <label className="block" htmlFor="time">
              <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
                Hora
              </span>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-3 text-sm outline-none focus:border-black/30"
              />
            </label>
          </div>

          <label className="block" htmlFor="peopleCount">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Número de personas
            </span>
            <input
              id="peopleCount"
              type="number"
              min={1}
              value={peopleCount}
              onChange={(e) => setPeopleCount(e.target.value)}
              className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <label className="block" htmlFor="notes">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Notas (opcional)
            </span>
            <input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
          >
            {loading ? 'Creando...' : 'Crear reserva'}
          </button>
        </form>
      </div>
    </div>
  );
}