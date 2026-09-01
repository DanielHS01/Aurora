'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiLock, FiUnlock, FiClock } from 'react-icons/fi';

import { openCashRegisterAction, closeCashRegisterAction } from '@/lib/actions/cashRegisterActions';
import type { CashSessionSummary, CashRegisterSession } from '@/lib/queries/cashRegister';

const METHOD_LABEL: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  online: 'Pago en línea',
  mixed: 'Mixto',
};

export default function CashRegisterManager({
  businessId,
  openSummary,
  history,
}: {
  businessId: string;
  openSummary: CashSessionSummary | null;
  history: CashRegisterSession[];
}) {
  const router = useRouter();
  const [showClose, setShowClose] = useState(false);

  if (!openSummary) {
    return (
      <div className="space-y-8">
        <OpenRegisterForm onOpened={() => router.refresh()} />
        <HistoryList history={history} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <FiUnlock size={16} />
            Caja abierta desde{' '}
            {new Date(openSummary.opened_at).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <button
            onClick={() => setShowClose(true)}
            className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white"
          >
            <FiLock size={13} />
            Cerrar caja
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBlock label="Efectivo inicial" value={openSummary.starting_cash} />
          {Object.entries(openSummary.salesByMethod).map(([method, amount]) => (
            <StatBlock key={method} label={METHOD_LABEL[method] ?? method} value={amount} />
          ))}
          <StatBlock label="Total vendido" value={openSummary.totalSales} highlight />
        </div>
        <p className="mt-3 text-xs text-emerald-700/70">
          {openSummary.transactionCount} transacción(es) registrada(s) en este turno.
        </p>
      </section>

      <HistoryList history={history} />

      {showClose && (
        <CloseRegisterModal
          sessionId={openSummary.id}
          expectedCash={openSummary.expectedCash}
          onClose={() => setShowClose(false)}
          onClosed={() => {
            setShowClose(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function StatBlock({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl bg-white p-3 ${highlight ? 'border border-emerald-300' : ''}`}>
      <p className="text-[11px] uppercase tracking-wide text-black/40">{label}</p>
      <p className="mt-1 font-semibold">${value.toLocaleString('es-CO')}</p>
    </div>
  );
}

function OpenRegisterForm({ onOpened }: { onOpened: () => void }) {
  const [startingCash, setStartingCash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const amount = Number(startingCash);
    if (isNaN(amount) || amount < 0) {
      setError('Ingresa un monto válido.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('startingCash', startingCash);
      await openCashRegisterAction(formData);
      onOpened();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <FiLock className="text-black/40" size={18} />
        <h2 className="text-sm font-medium uppercase tracking-wide text-black/50">
          Caja cerrada
        </h2>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <label className="flex-1 block">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Efectivo inicial (para dar cambio)
          </span>
          <input
            type="number"
            min={0}
            step="1000"
            value={startingCash}
            onChange={(e) => setStartingCash(e.target.value)}
            placeholder="0"
            className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-xl bg-[var(--brand-primary)] px-6 text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
        >
          {loading ? 'Abriendo...' : 'Abrir caja'}
        </button>
      </form>
    </section>
  );
}

function CloseRegisterModal({
  sessionId,
  expectedCash,
  onClose,
  onClosed,
}: {
  sessionId: string;
  expectedCash: number;
  onClose: () => void;
  onClosed: () => void;
}) {
  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const counted = Number(countedCash) || 0;
  const variance = counted - expectedCash;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!countedCash) {
      setError('Ingresa el efectivo contado.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('countedCash', countedCash);
      formData.set('notes', notes.trim());
      await closeCashRegisterAction(sessionId, formData);
      onClosed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold">Cerrar caja</h3>
        <p className="mb-5 text-sm text-black/40">
          Efectivo esperado en caja: ${expectedCash.toLocaleString('es-CO')}
        </p>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <label className="block" htmlFor="countedCash">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Efectivo contado físicamente
            </span>
            <input
              id="countedCash"
              type="number"
              min={0}
              step="1000"
              autoFocus
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          {countedCash && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                variance === 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : variance > 0
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {variance === 0
                ? '✓ Caja cuadrada exactamente.'
                : variance > 0
                ? `Sobrante de $${variance.toLocaleString('es-CO')}`
                : `Faltante de $${Math.abs(variance).toLocaleString('es-CO')}`}
            </div>
          )}

          <label className="block" htmlFor="notes">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Notas (opcional)
            </span>
            <input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: faltante por vueltas mal dadas"
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
          >
            {loading ? 'Cerrando...' : 'Confirmar cierre'}
          </button>
        </form>
      </div>
    </div>
  );
}

function HistoryList({ history }: { history: CashRegisterSession[] }) {
  if (history.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-black/50">
        <FiClock size={14} />
        Turnos anteriores
      </h2>
      <div className="space-y-2">
        {history.map((s) => {
          const expected = Number(s.starting_cash);
          const variance = s.counted_cash !== null ? Number(s.counted_cash) - expected : null;
          return (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-black/10 p-3 text-sm">
              <span className="text-black/60">
                {new Date(s.opened_at).toLocaleDateString('es-CO')} ·{' '}
                {new Date(s.opened_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} —{' '}
                {s.closed_at &&
                  new Date(s.closed_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {variance !== null && (
                <span className={variance === 0 ? 'text-emerald-600' : variance > 0 ? 'text-blue-600' : 'text-red-600'}>
                  {variance === 0 ? 'Cuadrada' : variance > 0 ? `+$${variance.toLocaleString('es-CO')}` : `-$${Math.abs(variance).toLocaleString('es-CO')}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}