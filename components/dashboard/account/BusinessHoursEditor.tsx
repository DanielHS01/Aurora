'use client'

import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { updateBusinessHoursAction } from '@/lib/actions/businessHoursActions';
import type { BusinessHourRange, WeeklyHours } from '@/lib/queries/businessHours';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]; // empieza en lunes

type DayRanges = Record<number, { open: string; close: string }[]>;

function initFromWeekly(weekly: WeeklyHours): DayRanges {
  const result: DayRanges = {};
  for (const day of ORDERED_DAYS) {
    result[day] = (weekly[day] ?? []).map((r) => ({
      open: r.open_time.slice(0, 5),
      close: r.close_time.slice(0, 5),
    }));
  }
  return result;
}

export default function BusinessHoursEditor({
  initialHours,
}: {
  initialHours: WeeklyHours;
}) {
  const [days, setDays] = useState<DayRanges>(() => initFromWeekly(initialHours));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function addRange(day: number) {
    setDays((prev) => ({
      ...prev,
      [day]: [...prev[day], { open: '09:00', close: '18:00' }],
    }));
  }

  function removeRange(day: number, index: number) {
    setDays((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  }

  function updateRange(day: number, index: number, field: 'open' | 'close', value: string) {
    setDays((prev) => ({
      ...prev,
      [day]: prev[day].map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }));
  }

  async function handleSave() {
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const ranges: BusinessHourRange[] = [];
      for (const day of ORDERED_DAYS) {
        for (const r of days[day]) {
          ranges.push({
            day_of_week: day,
            open_time: r.open + ':00',
            close_time: r.close + ':00',
          });
        }
      }
      await updateBusinessHoursAction(ranges);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-black/50">
        Horario de atención
      </h2>
      <p className="mb-5 text-sm text-black/40">
        Puedes agregar más de un rango por día si cierras al mediodía.
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Horario guardado correctamente.
        </div>
      )}

      <div className="space-y-4">
        {ORDERED_DAYS.map((day) => (
          <div key={day} className="flex flex-col gap-2 border-b border-black/5 pb-4 sm:flex-row sm:items-start">
            <div className="w-28 shrink-0 pt-2 text-sm font-medium">
              {DAY_NAMES[day]}
            </div>

            <div className="flex-1 space-y-2">
              {days[day].length === 0 ? (
                <p className="pt-1.5 text-sm text-black/30">Cerrado</p>
              ) : (
                days[day].map((range, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={range.open}
                      onChange={(e) => updateRange(day, index, 'open', e.target.value)}
                      className="h-9 rounded-lg border border-black/10 bg-black/[0.02] px-2 text-sm outline-none focus:border-black/30"
                    />
                    <span className="text-black/30">—</span>
                    <input
                      type="time"
                      value={range.close}
                      onChange={(e) => updateRange(day, index, 'close', e.target.value)}
                      className="h-9 rounded-lg border border-black/10 bg-black/[0.02] px-2 text-sm outline-none focus:border-black/30"
                    />
                    <button
                      onClick={() => removeRange(day, index)}
                      aria-label="Quitar rango"
                      className="text-black/30 hover:text-red-600"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))
              )}

              <button
                onClick={() => addRange(day)}
                className="flex items-center gap-1 text-xs text-black/50 hover:text-black"
              >
                <FiPlus size={12} />
                {days[day].length === 0 ? 'Abrir este día' : 'Agregar otro rango'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-6 h-11 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
      >
        {loading ? 'Guardando...' : 'Guardar horario'}
      </button>
    </section>
  );
}