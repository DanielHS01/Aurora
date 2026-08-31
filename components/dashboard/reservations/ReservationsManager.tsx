'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiCheck, FiX, FiArrowRight } from 'react-icons/fi';

import {
  updateReservationStatusAction,
  cancelReservationAction,
  convertReservationToOrderAction,
} from '@/lib/actions/reservation-actions';
import type { ReservationWithDetails } from '@/lib/queries/reservations';
import CreateReservationModal from './CreateReservationModal';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  no_show: 'No llegó',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
  completed: 'bg-black/[0.05] text-black/50',
  no_show: 'bg-black/[0.05] text-black/50',
};

interface ReservationsManagerProps {
  businessId: string;
  reservations: ReservationWithDetails[];
}

export default function ReservationsManager({
  businessId,
  reservations: initialReservations,
}: ReservationsManagerProps) {
  const [reservations, setReservations] = useState(initialReservations);
  const [showCreate, setShowCreate] = useState(false);
  const [prevInitialReservations, setPrevInitialReservations] = useState(initialReservations);

  if (initialReservations !== prevInitialReservations) {
    setPrevInitialReservations(initialReservations);
    setReservations(initialReservations);
  }

  function updateReservationLocal(id: string, updates: Partial<ReservationWithDetails>) {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-[var(--brand-secondary)] hover:opacity-90"
        >
          <FiPlus size={16} />
          Nueva reserva
        </button>
      </div>

      {reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/10 bg-gray-50/50 p-16">
          <p className="text-black/50">Aún no hay reservas.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.02] text-xs uppercase tracking-wide text-black/40">
              <tr>
                <th className="px-4 py-3">Fecha y hora</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Personas</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {reservations.map((r) => (
                <ReservationRow
                  key={r.id}
                  businessId={businessId}
                  reservation={r}
                  onUpdateLocal={(updates) => updateReservationLocal(r.id, updates)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateReservationModal businessId={businessId} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function ReservationRow({
  businessId,
  reservation,
  onUpdateLocal,
}: {
  businessId: string;
  reservation: ReservationWithDetails;
  onUpdateLocal: (updates: Partial<ReservationWithDetails>) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await updateReservationStatusAction(reservation.id, businessId, 'confirmed');
      onUpdateLocal({ status: 'confirmed' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm('¿Cancelar esta reserva?')) return;
    setLoading(true);
    try {
      await cancelReservationAction(reservation.id, businessId);
      onUpdateLocal({ status: 'cancelled' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConvert() {
    setLoading(true);
    try {
      const { orderId } = await convertReservationToOrderAction(reservation.id, businessId);
      router.push(`/dashboard/orders/${orderId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error.');
      setLoading(false);
    }
  }

  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium">{reservation.reservation_date}</p>
        <p className="text-xs text-black/40">{reservation.reservation_time?.slice(0, 5)}</p>
      </td>
      <td className="px-4 py-3">
        {reservation.customer?.full_name ?? reservation.customer?.phone ?? '—'}
      </td>
      <td className="px-4 py-3">{reservation.people_count}</td>
      <td className="px-4 py-3 text-black/50 capitalize">{reservation.source}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[reservation.status ?? 'pending']}`}>
          {STATUS_LABEL[reservation.status ?? 'pending']}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {reservation.status === 'pending' && (
            <button
              onClick={handleConfirm}
              disabled={loading}
              aria-label="Confirmar"
              className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
            >
              <FiCheck size={15} />
            </button>
          )}
          {reservation.status === 'confirmed' && (
            <button
              onClick={handleConvert}
              disabled={loading}
              aria-label="Convertir en pedido"
              className="rounded-lg p-2 text-black/50 hover:bg-black/5 disabled:opacity-50"
            >
              <FiArrowRight size={15} />
            </button>
          )}
          {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
            <button
              onClick={handleCancel}
              disabled={loading}
              aria-label="Cancelar"
              className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              <FiX size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}