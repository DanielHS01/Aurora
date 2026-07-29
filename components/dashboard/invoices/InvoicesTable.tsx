'use client'

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  FiSearch,
  FiEye,
  FiDownload,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from 'react-icons/fi';

import { getInvoiceDetailAction } from '@/lib/actions/payment-actions';
import type {
  InvoiceWithDetails,
  InvoiceWithItems,
  InvoiceSortOption,
} from '@/lib/queries/payments';
import type { OrderType } from '@/lib/types';

const DEFAULT_SORT: InvoiceSortOption = 'recent';

const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in: 'En mesa',
  takeaway: 'Para llevar',
  delivery: 'Domicilio',
  reservation: 'Reserva',
};

const SORT_OPTIONS: { value: InvoiceSortOption; label: string }[] = [
  { value: 'recent', label: 'Más reciente' },
  { value: 'oldest', label: 'Más antigua' },
  { value: 'customer_asc', label: 'Cliente (A-Z)' },
  { value: 'customer_desc', label: 'Cliente (Z-A)' },
  { value: 'total_desc', label: 'Total (mayor a menor)' },
  { value: 'total_asc', label: 'Total (menor a mayor)' },
];

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string | null }) {
  const normalized = (status ?? '').toLowerCase();

  if (normalized === 'issued' || normalized === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <FiCheckCircle size={13} />
        Emitida
      </span>
    );
  }

  if (normalized === 'cancelled' || normalized === 'void') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
        Anulada
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-black/[0.05] px-2.5 py-1 text-xs font-medium text-black/50">
      {status || 'Borrador'}
    </span>
  );
}

interface InvoicesTableProps {
  businessId: string;
  invoices: InvoiceWithDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
  currentSearch: string;
  currentOrderType: OrderType | undefined;
  currentSort: InvoiceSortOption;
}

export default function InvoicesTable({
  businessId,
  invoices,
  totalCount,
  page,
  pageSize,
  currentSearch,
  currentOrderType,
  currentSort,
}: InvoicesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);

  const hasActiveFilters =
    Boolean(currentSearch) ||
    Boolean(currentOrderType) ||
    currentSort !== DEFAULT_SORT ||
    page > 1;

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    if (!('page' in updates)) {
      params.delete('page');
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleClearFilters() {
    setSearchInput('');
    router.push(pathname);
  }

  // Debounce de la búsqueda — evita disparar una navegación por cada
  // tecla mientras el usuario todavía está escribiendo.
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== currentSearch) {
        updateParams({ search: searchInput || undefined });
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar factura o cliente..."
            className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] pl-9 pr-4 text-sm outline-none focus:border-black/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={currentOrderType ?? ''}
            onChange={(e) =>
              updateParams({ type: e.target.value || undefined })
            }
            className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(ORDER_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={currentSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex h-11 items-center gap-1.5 rounded-xl border border-black/10 px-3 text-sm text-black/60 transition hover:bg-black/5 hover:text-black"
            >
              <FiX size={14} />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/10 bg-gray-50/50 p-16">
          <p className="text-black/50">
            {totalCount === 0
              ? 'Aún no se ha generado ninguna factura.'
              : 'No hay resultados para los filtros aplicados.'}
          </p>
          {hasActiveFilters && totalCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="mt-4 flex items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-[var(--brand-secondary)]"
            >
              <FiX size={14} />
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-black/10">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-black/[0.02] text-xs uppercase tracking-wide text-black/40">
                <tr>
                  <th className="px-4 py-3">Factura</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Notas</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        #{invoice.invoice_number ?? invoice.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-black/40">
                        {formatDateTime(invoice.issued_at ?? invoice.created_at)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-black/60">
                      {invoice.order
                        ? ORDER_TYPE_LABEL[invoice.order.order_type] ??
                          invoice.order.order_type
                        : '—'}
                      {invoice.order?.table?.table_number && (
                        <span className="ml-1 text-xs text-black/40">
                          · Mesa {invoice.order.table.table_number}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {invoice.customer?.full_name ?? 'Cliente sin registrar'}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ${(invoice.total ?? 0).toLocaleString('es-CO')}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-black/50">
                      {invoice.order?.notes || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedInvoiceId(invoice.id)}
                          aria-label="Ver factura"
                          className="rounded-lg p-2 text-black/50 hover:bg-black/5 hover:text-black"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          disabled
                          title="Disponible próximamente"
                          aria-label="Descargar PDF"
                          className="cursor-not-allowed rounded-lg p-2 text-black/20"
                        >
                          <FiDownload size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-black/50">
            <p>
              Mostrando {(page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, totalCount)} de {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateParams({ page: String(page - 1) })}
                disabled={page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 disabled:opacity-30"
                aria-label="Página anterior"
              >
                <FiChevronLeft size={16} />
              </button>
              <span className="px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => updateParams({ page: String(page + 1) })}
                disabled={page >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 disabled:opacity-30"
                aria-label="Página siguiente"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {selectedInvoiceId && (
        <InvoiceDetailModal
          businessId={businessId}
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  );
}

function InvoiceDetailModal({
  businessId,
  invoiceId,
  onClose,
}: {
  businessId: string;
  invoiceId: string;
  onClose: () => void;
}) {
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    getInvoiceDetailAction(invoiceId, businessId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError('No se pudo cargar la factura.');
        } else {
          setInvoice(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ocurrió un error.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [invoiceId, businessId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <p className="py-10 text-center text-sm text-black/40">Cargando...</p>
        )}

        {error && (
          <p className="py-10 text-center text-sm text-red-600">{error}</p>
        )}

        {invoice && (
          <>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Factura #{invoice.invoice_number ?? invoice.id.slice(0, 8)}
              </h3>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="mb-5 text-xs text-black/40">
              {formatDateTime(invoice.issued_at ?? invoice.created_at)}
            </p>

            <ul className="space-y-2">
              {invoice.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.description}
                  </span>
                  <span className="text-black/60">
                    ${(item.total_price ?? 0).toLocaleString('es-CO')}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-1.5 border-t border-black/10 pt-4 text-sm">
              <div className="flex justify-between text-black/50">
                <span>Subtotal</span>
                <span>${(invoice.subtotal ?? 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-black/50">
                <span>Impuestos</span>
                <span>${(invoice.tax_amount ?? 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>${(invoice.total ?? 0).toLocaleString('es-CO')}</span>
              </div>
            </div>

            <button
              disabled
              title="Disponible próximamente"
              className="mt-6 flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-medium text-black/30"
            >
              <FiDownload size={15} />
              Descargar PDF
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-3 h-11 w-full rounded-xl border border-black/10 text-sm font-medium text-black/60"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}