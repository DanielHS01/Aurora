'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiClock, FiX, FiPlay, FiCheck, FiShoppingBag, FiAlertCircle } from 'react-icons/fi';

import {
  updateKitchenTicketStatusAction,
  acknowledgeTicketChangeAction,
} from '@/lib/actions/kitchen-actions';
import type { KitchenTicketWithOrder } from '@/lib/queries/kitchen';
import type { KitchenTicketStatus } from '@/lib/types';

interface KitchenBoardProps {
  businessId: string;
  tickets: KitchenTicketWithOrder[];
}

const STATUS_LABEL: Record<KitchenTicketStatus, string> = {
  queued: 'En espera',
  in_progress: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_BADGE_CLASS: Record<KitchenTicketStatus, string> = {
  queued: 'bg-black/[0.05] text-black/50',
  in_progress: 'bg-amber-50 text-amber-700',
  ready: 'bg-emerald-50 text-emerald-700',
  delivered: 'bg-black/[0.05] text-black/50',
  cancelled: 'bg-red-50 text-red-600',
};

function useElapsedMinutes(sentAt: string | null): number | null {
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    function update() {
      const start = sentAt ? new Date(sentAt).getTime() : Date.now();
      setElapsed(Math.floor((Date.now() - start) / 60000));
    }
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [sentAt]);

  return elapsed;
}

export default function KitchenBoard({ businessId, tickets: initialTickets }: KitchenBoardProps) {
  // Estado local — se sincroniza con la prop cuando el servidor sí
  // trae datos frescos (ej. por Realtime detectando un cambio de OTRA
  // fuente), pero las acciones del propio usuario se reflejan aquí de
  // inmediato, sin esperar una recarga completa.
  const [tickets, setTickets] = useState(initialTickets);
  const [prevInitialTickets, setPrevInitialTickets] = useState(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  

  if (initialTickets !== prevInitialTickets) {
    setPrevInitialTickets(initialTickets);
    setTickets(initialTickets);
  }

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  function updateTicketLocal(ticketId: string, updates: Partial<KitchenTicketWithOrder>) {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, ...updates } : t))
    );
  }

  function removeTicketLocal(ticketId: string) {
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/10 bg-gray-50/50 p-16">
        <p className="text-black/50">No hay pedidos activos en cocina.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onClick={() => setSelectedTicketId(ticket.id)}
          />
        ))}
      </div>

      {selectedTicket && (
        <TicketDetailModal
          businessId={businessId}
          ticket={selectedTicket}
          onClose={() => setSelectedTicketId(null)}
          onStatusChange={(newStatus) => {
            if (newStatus === 'delivered' || newStatus === 'cancelled') {
              // Sale de la grid — mismo filtro que ya aplica el servidor.
              removeTicketLocal(selectedTicket.id);
            } else {
              updateTicketLocal(selectedTicket.id, { status: newStatus });
            }
          }}
          onAcknowledged={() => updateTicketLocal(selectedTicket.id, { has_pending_changes: false })}
        />
      )}
    </>
  );
}

function TicketCard({
  ticket,
  onClick,
}: {
  ticket: KitchenTicketWithOrder;
  onClick: () => void;
}) {
  const elapsedMinutes = useElapsedMinutes(ticket.sent_at);
  const itemCount = ticket.order.items.reduce((sum, i) => sum + i.quantity, 0);
  const hasPendingChanges = ticket.has_pending_changes ?? false;

  return (
    <button
      onClick={onClick}
      className={`flex h-40 flex-col justify-between rounded-2xl border p-4 text-left transition ${
        hasPendingChanges
          ? 'animate-pulse border-amber-300 bg-amber-100'
          : !ticket.order.table
          ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
          : 'border-black/10 bg-white hover:border-black/30'
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-lg font-semibold">
            {hasPendingChanges && <FiAlertCircle size={16} className="text-amber-700" />}
            {!hasPendingChanges && !ticket.order.table && (
              <FiShoppingBag size={16} className="text-amber-600" />
            )}
            {ticket.order.table?.table_number
              ? `Mesa ${ticket.order.table.table_number}`
              : 'Para llevar'}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${STATUS_BADGE_CLASS[ticket.status ?? 'queued']}`}
          >
            {STATUS_LABEL[ticket.status ?? 'queued']}
          </span>
        </div>
        <p className="mt-1 text-sm text-black/40">
          {itemCount} ítem{itemCount !== 1 ? 's' : ''}
          {hasPendingChanges && ' · ⚠️ Modificado'}
        </p>
      </div>

      <div className="flex items-center gap-1 text-xs text-black/40">
        <FiClock size={12} />
        {elapsedMinutes === null ? '—' : `${elapsedMinutes} min`}
      </div>
    </button>
  );
}

function TicketDetailModal({
  businessId,
  ticket,
  onClose,
  onStatusChange,
  onAcknowledged,
}: {
  businessId: string;
  ticket: KitchenTicketWithOrder;
  onClose: () => void;
  onStatusChange: (newStatus: KitchenTicketStatus) => void;
  onAcknowledged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ticket.has_pending_changes) {
      acknowledgeTicketChangeAction(ticket.id, businessId)
        .then(() => onAcknowledged())
        .catch(() => {});
    }
    // Solo debe correr una vez al abrir este ticket, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  async function handleAdvance(newStatus: KitchenTicketStatus) {
    setLoading(true);
    setError('');
    try {
      await updateKitchenTicketStatusAction(ticket.id, businessId, newStatus);
      onStatusChange(newStatus);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {ticket.order.table?.table_number
              ? `Mesa ${ticket.order.table.table_number}`
              : 'Para llevar'}
          </h3>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <FiX size={20} />
          </button>
        </div>
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${STATUS_BADGE_CLASS[ticket.status ?? 'queued']}`}
        >
          {STATUS_LABEL[ticket.status ?? 'queued']}
        </span>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <ul className="mt-5 space-y-3">
          {ticket.order.items.map((item) => (
            <li key={item.id} className="border-b border-black/5 pb-3 text-sm">
              <span className="font-medium">{item.quantity}x</span> {item.product_name}
              {item.options.length > 0 && (
                <p className="ml-5 text-xs text-black/40">
                  {item.options.map((o) => `${o.option_name}: ${o.option_value}`).join(' · ')}
                </p>
              )}
              {item.notes && <p className="ml-5 text-xs italic text-black/40">{item.notes}</p>}
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-2">
          {ticket.status === 'queued' && (
            <button
              onClick={() => handleAdvance('in_progress')}
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
            >
              <FiPlay size={14} />
              {loading ? 'Procesando...' : 'Empezar'}
            </button>
          )}

          {ticket.status === 'in_progress' && (
            <button
              onClick={() => handleAdvance('ready')}
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-medium text-white disabled:opacity-60"
            >
              <FiCheck size={14} />
              {loading ? 'Procesando...' : 'Marcar listo'}
            </button>
          )}

          {ticket.status === 'ready' && (
            <p className="rounded-xl bg-emerald-50 py-3 text-center text-sm font-medium text-emerald-700">
              Listo — esperando al mesero
            </p>
          )}

          <button
            onClick={onClose}
            className="h-11 w-full rounded-xl border border-black/10 text-sm font-medium text-black/60"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}