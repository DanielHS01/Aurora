"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  FiSearch,
  FiEye,
  FiDownload,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiPrinter,
  FiExternalLink,
  FiShield,
} from "react-icons/fi";

import { getInvoiceDetailAction, cancelInvoiceAction } from "@/lib/actions/payment-actions";
import type {
  InvoiceWithDetails,
  InvoiceWithItems,
  InvoiceSortOption,
} from "@/lib/queries/payments";
import type { OrderType } from "@/lib/types";
import InvoicePreviewModal from "./InvoicePreviewModal";
import { formatDateTimeCO } from '@/lib/utils/formatDate';

const DEFAULT_SORT: InvoiceSortOption = "recent";

const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in: "En mesa",
  takeaway: "Para llevar",
  delivery: "Domicilio",
  reservation: "Reserva",
};

const SORT_OPTIONS: { value: InvoiceSortOption; label: string }[] = [
  { value: "recent", label: "Más reciente" },
  { value: "oldest", label: "Más antigua" },
  { value: "customer_asc", label: "Cliente (A-Z)" },
  { value: "customer_desc", label: "Cliente (Z-A)" },
  { value: "total_desc", label: "Total (mayor a menor)" },
  { value: "total_asc", label: "Total (menor a mayor)" },
];

const DOCUMENT_TYPE_OPTIONS: { value: "" | "electronic" | "local"; label: string }[] = [
  { value: "", label: "Todos los documentos" },
  { value: "electronic", label: "Solo electrónicas (DIAN)" },
  { value: "local", label: "Solo locales" },
];

function StatusBadge({
  status,
  hasCufe,
}: {
  status: string | null;
  hasCufe: boolean;
}) {
  const normalized = (status ?? "").toLowerCase();

  if (normalized === "cancelled" || normalized === "void") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
        Anulada
      </span>
    );
  }

  if (normalized === "issued" || normalized === "paid") {
    // Distinguimos visualmente el documento oficial DIAN del
    // comprobante local — mismo verde de "éxito", pero con ícono y
    // texto distintos, para que el cajero sepa cuál está viendo.
    return hasCufe ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <FiShield size={13} />
        DIAN
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <FiCheckCircle size={13} />
        Emitida
      </span>
    );
  }

  if (normalized === "pending_validation") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        Validando ante DIAN
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-black/[0.05] px-2.5 py-1 text-xs font-medium text-black/50">
      {status || "Borrador"}
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
  currentDocumentType: "" | "electronic" | "local";
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
  currentDocumentType,
}: InvoicesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );
  const [previewInvoice, setPreviewInvoice] = useState<{
    id: string;
    number: string;
  } | null>(null);

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);

  const hasActiveFilters =
    Boolean(currentSearch) ||
    Boolean(currentOrderType) ||
    Boolean(currentDocumentType) ||
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
    if (!("page" in updates)) {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleClearFilters() {
    setSearchInput("");
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
            value={currentDocumentType}
            onChange={(e) =>
              updateParams({ doc: e.target.value || undefined })
            }
            className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-black/30"
          >
            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={currentOrderType ?? ""}
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
              ? "Aún no se ha generado ninguna factura."
              : "No hay resultados para los filtros aplicados."}
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
          {/* overflow-x-auto + min-w en la tabla: en pantallas angostas
              se desliza horizontal en vez de romper el layout — mismo
              patrón responsive que ya usaba el resto del dashboard. */}
          <div className="overflow-x-auto rounded-2xl border border-black/10">
            <table className="w-full min-w-[960px] text-left text-sm">
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
                {invoices.map((invoice) => {
                  const hasCufe = Boolean(invoice.cufe);
                  return (
                    <tr key={invoice.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          #{invoice.invoice_number ?? invoice.id.slice(0, 8)}
                        </p>
                        {hasCufe && (
                          <p className="text-xs text-emerald-700">
                            DIAN: {invoice.factus_number}
                          </p>
                        )}
                        <p className="text-xs text-black/40">
                          {formatDateTimeCO(
                            invoice.issued_at ?? invoice.created_at,
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-black/60">
                        {invoice.order
                          ? (ORDER_TYPE_LABEL[invoice.order.order_type] ??
                            invoice.order.order_type)
                          : "—"}
                        {invoice.order?.table?.table_number && (
                          <span className="ml-1 text-xs text-black/40">
                            · Mesa {invoice.order.table.table_number}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {invoice.customer?.full_name ?? "Cliente sin registrar"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ${(invoice.total ?? 0).toLocaleString("es-CO")}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-black/50">
                        {invoice.order?.notes || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={invoice.status} hasCufe={hasCufe} />
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
                          {hasCufe && invoice.public_url ? (
                            <a
                              href={invoice.public_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Ver documento oficial DIAN"
                              className="rounded-lg p-2 text-black/50 hover:bg-black/5 hover:text-black"
                            >
                              <FiExternalLink size={15} />
                            </a>
                          ) : (
                            <button
                              onClick={() =>
                                setPreviewInvoice({
                                  id: invoice.id,
                                  number:
                                    invoice.invoice_number ??
                                    invoice.id.slice(0, 8),
                                })
                              }
                              aria-label="Ver e imprimir factura"
                              className="rounded-lg p-2 text-black/50 hover:bg-black/5 hover:text-black"
                            >
                              <FiPrinter size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
      {previewInvoice && (
        <InvoicePreviewModal
          invoiceId={previewInvoice.id}
          invoiceNumber={previewInvoice.number}
          onClose={() => setPreviewInvoice(null)}
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
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelResult, setCancelResult] = useState<{ creditNoteNumber: string; publicUrl: string } | null>(null);

  async function handleCancelInvoice() {
    if (!cancelReason.trim()) {
      setCancelError("Indica el motivo de la anulación.");
      return;
    }
    setCancelling(true);
    setCancelError("");
    try {
      const result = await cancelInvoiceAction(invoiceId, businessId, cancelReason);
      setCancelResult({ creditNoteNumber: result.creditNoteNumber, publicUrl: result.publicUrl });
      router.refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getInvoiceDetailAction(invoiceId, businessId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("No se pudo cargar la factura.");
        } else {
          setInvoice(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Ocurrió un error.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [invoiceId, businessId]);

  const hasCufe = Boolean(invoice?.cufe);

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
              <StatusBadge status={invoice.status} hasCufe={hasCufe} />
            </div>
            <p className="mb-5 text-xs text-black/40">
              {formatDateTimeCO(invoice.issued_at ?? invoice.created_at)}
            </p>

            {hasCufe && (
              <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <p className="text-xs uppercase tracking-wide text-emerald-700">
                  Documento electrónico DIAN
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-black/50">
                  CUFE: {invoice.cufe}
                </p>
              </div>
            )}

            <ul className="space-y-2">
              {invoice.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.description}
                  </span>
                  <span className="text-black/60">
                    ${(item.total_price ?? 0).toLocaleString("es-CO")}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-1.5 border-t border-black/10 pt-4 text-sm">
              <div className="flex justify-between text-black/50">
                <span>Subtotal</span>
                <span>${(invoice.subtotal ?? 0).toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between text-black/50">
                <span>Impuestos</span>
                <span>
                  ${(invoice.tax_amount ?? 0).toLocaleString("es-CO")}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>${(invoice.total ?? 0).toLocaleString("es-CO")}</span>
              </div>
            </div>

            {hasCufe && invoice.public_url ? (
              <a
                href={invoice.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-medium text-black/70 hover:bg-black/5"
              >
                <FiExternalLink size={15} />
                Ver documento oficial DIAN
              </a>
            ) : (
              <button
                disabled
                title="Disponible próximamente"
                className="mt-6 flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-medium text-black/30"
              >
                <FiDownload size={15} />
                Descargar PDF
              </button>
            )}

            {hasCufe && invoice.status !== "cancelled" && (
              <div className="mt-3">
                {cancelResult ? (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center text-sm text-emerald-700">
                    Factura anulada — Nota Crédito {cancelResult.creditNoteNumber}.{" "}
                    <a
                      href={cancelResult.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Ver documento
                    </a>
                  </div>
                ) : showCancelForm ? (
                  <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                    {cancelError && (
                      <p className="mb-2 text-xs text-red-600">{cancelError}</p>
                    )}
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Motivo de la anulación (obligatorio)"
                      rows={2}
                      className="mb-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCancelForm(false)}
                        className="h-9 flex-1 rounded-lg border border-black/10 text-xs font-medium text-black/60"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCancelInvoice}
                        disabled={cancelling}
                        className="h-9 flex-1 rounded-lg bg-red-600 text-xs font-medium text-white disabled:opacity-60"
                      >
                        {cancelling ? "Anulando..." : "Confirmar anulación"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCancelForm(true)}
                    className="flex h-10 w-full items-center justify-center text-xs font-medium text-red-600 hover:underline"
                  >
                    Anular esta factura
                  </button>
                )}
              </div>
            )}
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