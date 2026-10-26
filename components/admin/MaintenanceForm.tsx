'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  createMaintenanceAnnouncementAction,
  deactivateMaintenanceAnnouncementAction,
} from '@/lib/actions/platformAdminActions';
import type { MaintenanceAnnouncement } from '@/lib/queries/platformAdmin';

const inputClass =
  'h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-3 text-sm text-black outline-none focus:border-black/30';

export default function MaintenanceForm({
  activeAnnouncement,
}: {
  activeAnnouncement: MaintenanceAnnouncement | null;
}) {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [extraMessage, setExtraMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!date || !time) {
      setError('Fecha y hora son obligatorias.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('scheduledDate', date);
      formData.set('scheduledTime', time);
      formData.set('durationMinutes', duration);
      formData.set('extraMessage', extraMessage.trim());

      const result = await createMaintenanceAnnouncementAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.refresh();
      setDate('');
      setTime('');
      setExtraMessage('');
    } catch {
      setError('No se pudo publicar el aviso. Recarga la página e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate() {
    if (!activeAnnouncement) return;
    setError('');
    setLoading(true);
    try {
      const result = await deactivateMaintenanceAnnouncementAction(activeAnnouncement.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError('No se pudo desactivar el aviso. Recarga la página e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {activeAnnouncement && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1 text-sm font-medium text-amber-800">Aviso activo</p>
          <p className="text-sm text-black/70">
            {activeAnnouncement.scheduled_date} a las{' '}
            {activeAnnouncement.scheduled_time.slice(0, 5)} (hora de Colombia) ·{' '}
            {activeAnnouncement.duration_minutes} min
          </p>
          {activeAnnouncement.extra_message && (
            <p className="mt-1 text-xs text-black/50">{activeAnnouncement.extra_message}</p>
          )}
          <button
            onClick={handleDeactivate}
            disabled={loading}
            className="mt-3 rounded-lg border border-black/20 px-3 py-1.5 text-xs text-black/70 hover:bg-black/5 disabled:opacity-50"
          >
            {loading ? 'Desactivando...' : 'Desactivar aviso'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-black/10 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-black">
          Programar nuevo aviso
        </h2>
        <p className="text-xs text-black/40">La fecha y la hora son hora de Colombia.</p>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">Fecha</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">Hora</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Duración (minutos)
          </span>
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Mensaje adicional (opcional)
          </span>
          <input
            value={extraMessage}
            onChange={(e) => setExtraMessage(e.target.value)}
            placeholder="Ej: Estaremos mejorando el sistema de pedidos."
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-black text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Publicar aviso'}
        </button>
      </form>
    </div>
  );
}