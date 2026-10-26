"use client";

import { useEffect, useState } from "react";
import { FiClock, FiX, FiPlay, FiCheck, FiShoppingBag, FiAlertCircle } from "react-icons/fi";

import {
  advanceOrderItemsAction,
  markItemSoldOutAction,
  acknowledgeTicketChangeAction,
  listInventoryItemsForKitchenAction,
} from "@/lib/actions/kitchen-actions";
import type { InventoryItem } from "@/lib/queries/inventory";
import type { KitchenTicketWithOrder } from "@/lib/queries/kitchen";
import type { BlockedItem, ItemSubstitution } from "@/lib/queries/kitchenFlow";
import type { KitchenTicketStatus } from "@/lib/types";
import { deriveTicketStatus, isNotStarted } from "@/lib/utils/kitchenFlow";
import { formatQuantity } from "@/lib/utils/inventory";
import { Modal, QuantityInput } from "@/components/dashboard/inventory/InventoryShared";

type CategoryInfo = { name: string; order: number };
type ItemRow = KitchenTicketWithOrder["order"]["items"][number];
type Target = "preparing" | "ready";

interface KitchenBoardProps {
  businessId: string;
  tickets: KitchenTicketWithOrder[];
  categoryByProduct: Record<string, CategoryInfo>;
}

const STATUS_LABEL: Record<KitchenTicketStatus, string> = {
  queued: "En espera",
  in_progress: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_BADGE_CLASS: Record<KitchenTicketStatus, string> = {
  queued: "bg-black/[0.05] text-black/50",
  in_progress: "bg-amber-50 text-amber-700",
  ready: "bg-emerald-50 text-emerald-700",
  delivered: "bg-black/[0.05] text-black/50",
  cancelled: "bg-red-50 text-red-600",
};

function itemLabel(status: string | null): string {
  if (status === "preparing") return "Preparando";
  if (status === "ready") return "Listo";
  if (status === "served" || status === "completed") return "Entregado";
  return "Pendiente";
}

function itemBadgeClass(status: string | null): string {
  if (status === "preparing") return "bg-amber-50 text-amber-700";
  if (status === "ready") return "bg-emerald-50 text-emerald-700";
  if (status === "served" || status === "completed") return "bg-black/[0.05] text-black/40";
  return "bg-black/[0.05] text-black/50";
}

function groupItems(items: ItemRow[], categoryByProduct: Record<string, CategoryInfo>) {
  const groups = new Map<string, { name: string; order: number; items: ItemRow[] }>();
  for (const item of items) {
    const info = (item.product_id && categoryByProduct[item.product_id]) || {
      name: "Otros",
      order: 999,
    };
    const existing = groups.get(info.name);
    if (existing) existing.items.push(item);
    else groups.set(info.name, { ...info, items: [item] });
  }
  return [...groups.values()].sort((a, b) => a.order - b.order);
}

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

export default function KitchenBoard({
  businessId,
  tickets: initialTickets,
  categoryByProduct,
}: KitchenBoardProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [prevInitialTickets, setPrevInitialTickets] = useState(initialTickets);

  if (initialTickets !== prevInitialTickets) {
    setPrevInitialTickets(initialTickets);
    setTickets(initialTickets);
  }

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  /** Aplica un cambio al ticket, recalcula su estado y lo saca si ya terminó. */
  function updateTicket(
    ticketId: string,
    updater: (t: KitchenTicketWithOrder) => KitchenTicketWithOrder
  ) {
    setTickets((prev) =>
      prev.flatMap((t) => {
        if (t.id !== ticketId) return [t];
        const next = updater(t);
        const status = deriveTicketStatus(next.order.items.map((i) => i.status));
        if (status === "delivered" || status === "cancelled") return [];
        return [{ ...next, status }];
      })
    );
  }

  function handleItemsChanged(ticketId: string, updated: { id: string; status: Target }[]) {
    const map = new Map(updated.map((u) => [u.id, u.status]));
    updateTicket(ticketId, (t) => ({
      ...t,
      order: {
        ...t.order,
        items: t.order.items.map((i) => {
          const status = map.get(i.id);
          return status ? { ...i, status } : i;
        }),
      },
    }));
  }

  function handleItemRemoved(ticketId: string, itemId: string) {
    updateTicket(ticketId, (t) => ({
      ...t,
      order: { ...t.order, items: t.order.items.filter((i) => i.id !== itemId) },
    }));
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
          <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedTicketId(ticket.id)} />
        ))}
      </div>

      {selectedTicket && (
        <TicketDetailModal
          businessId={businessId}
          ticket={selectedTicket}
          categoryByProduct={categoryByProduct}
          onClose={() => setSelectedTicketId(null)}
          onItemsChanged={(updated) => handleItemsChanged(selectedTicket.id, updated)}
          onItemRemoved={(itemId) => handleItemRemoved(selectedTicket.id, itemId)}
          onAcknowledged={() =>
            updateTicket(selectedTicket.id, (t) => ({ ...t, has_pending_changes: false }))
          }
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
  const items = ticket.order.items;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const readyCount = items.filter((i) => i.status === "ready").length;
  const hasPendingChanges = ticket.has_pending_changes ?? false;
  const status = (ticket.status ?? "queued") as KitchenTicketStatus;

  return (
    <button
      onClick={onClick}
      className={`flex h-40 flex-col justify-between rounded-2xl border p-4 text-left transition ${
        hasPendingChanges
          ? "animate-pulse border-amber-300 bg-amber-100"
          : !ticket.order.table
          ? "border-amber-200 bg-amber-50 hover:border-amber-300"
          : "border-black/10 bg-white hover:border-black/30"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-lg font-semibold">
            {hasPendingChanges && <FiAlertCircle size={16} className="text-amber-700" />}
            {!hasPendingChanges && !ticket.order.table && (
              <FiShoppingBag size={16} className="text-amber-600" />
            )}
            {ticket.order.table?.table_number
              ? `Mesa ${ticket.order.table.table_number}`
              : "Para llevar"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${STATUS_BADGE_CLASS[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
        <p className="mt-1 text-sm text-black/40">
          {itemCount} ítem{itemCount !== 1 ? "s" : ""}
          {readyCount > 0 && ` · ${readyCount} listo${readyCount !== 1 ? "s" : ""}`}
          {hasPendingChanges && " · ⚠️ Modificado"}
        </p>
      </div>

      <div className="flex items-center gap-1 text-xs text-black/40">
        <FiClock size={12} />
        {elapsedMinutes === null ? "—" : `${elapsedMinutes} min`}
      </div>
    </button>
  );
}

function TicketDetailModal({
  businessId,
  ticket,
  categoryByProduct,
  onClose,
  onItemsChanged,
  onItemRemoved,
  onAcknowledged,
}: {
  businessId: string;
  ticket: KitchenTicketWithOrder;
  categoryByProduct: Record<string, CategoryInfo>;
  onClose: () => void;
  onItemsChanged: (updated: { id: string; status: Target }[]) => void;
  onItemRemoved: (itemId: string) => void;
  onAcknowledged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState<{ queue: BlockedItem[]; target: Target } | null>(null);

  // Al abrir un ticket con cambios pendientes, se reconocen de inmediato
  useEffect(() => {
    if (ticket.has_pending_changes) {
      acknowledgeTicketChangeAction(ticket.id, businessId)
        .then(() => onAcknowledged())
        .catch(() => {});
    }
    // Solo debe correr una vez al abrir este ticket
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  const items = ticket.order.items;
  const groups = groupItems(items, categoryByProduct);
  const status = (ticket.status ?? "queued") as KitchenTicketStatus;

  const notStartedIds = items.filter((i) => isNotStarted(i.status)).map((i) => i.id);
  const unreadyIds = items
    .filter((i) => isNotStarted(i.status) || i.status === "preparing")
    .map((i) => i.id);

  async function run(itemIds: string[], target: Target, substitutions: ItemSubstitution[] = []) {
    if (itemIds.length === 0) return null;
    setBusy(true);
    setError("");
    try {
      const result = await advanceOrderItemsAction(businessId, itemIds, target, substitutions);
      if (result.updated.length > 0) onItemsChanged(result.updated);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleAdvance(itemIds: string[], target: Target) {
    const result = await run(itemIds, target);
    if (result && result.blocked.length > 0) {
      setBlocked({ queue: result.blocked, target });
    }
  }

  function popHead(replacement?: BlockedItem) {
    setBlocked((prev) => {
      if (!prev) return null;
      const rest = prev.queue.slice(1);
      const queue = replacement ? [replacement, ...rest] : rest;
      return queue.length > 0 ? { ...prev, queue } : null;
    });
  }

  async function handleSubstitute(subs: ItemSubstitution[]) {
    if (!blocked) return;
    const head = blocked.queue[0];
    const result = await run([head.orderItemId], blocked.target, subs);
    if (!result) return;
    popHead(result.blocked.find((b) => b.orderItemId === head.orderItemId));
  }

  async function handleSoldOut() {
    if (!blocked) return;
    const head = blocked.queue[0];
    setBusy(true);
    setError("");
    try {
      await markItemSoldOutAction(businessId, head.orderItemId);
      onItemRemoved(head.orderItemId);
      popHead();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setBusy(false);
    }
  }

  const head = blocked?.queue[0];

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {ticket.order.table?.table_number
                ? `Mesa ${ticket.order.table.table_number}`
                : "Para llevar"}
            </h3>
            <button onClick={onClose} className="text-black/40 hover:text-black">
              <FiX size={20} />
            </button>
          </div>
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${STATUS_BADGE_CLASS[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>

          {error && !head && (
            <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-5 space-y-5">
            {groups.map((group) => {
              const groupNotStarted = group.items.filter((i) => isNotStarted(i.status)).map((i) => i.id);
              const groupUnready = group.items
                .filter((i) => isNotStarted(i.status) || i.status === "preparing")
                .map((i) => i.id);

              return (
                <section key={group.name}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h4 className="text-xs font-medium uppercase tracking-wide text-black/40">
                      {group.name}
                    </h4>
                    <div className="flex gap-1.5">
                      {groupNotStarted.length > 0 && (
                        <button
                          onClick={() => handleAdvance(groupNotStarted, "preparing")}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1 text-xs text-black/70 hover:bg-black/5 disabled:opacity-50"
                        >
                          <FiPlay size={11} /> Empezar
                        </button>
                      )}
                      {groupUnready.length > 0 && (
                        <button
                          onClick={() => handleAdvance(groupUnready, "ready")}
                          disabled={busy}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs text-white disabled:opacity-50"
                        >
                          <FiCheck size={11} /> Todo listo
                        </button>
                      )}
                    </div>
                  </div>

                  <ul className="divide-y divide-black/5 rounded-xl border border-black/10">
                    {group.items.map((item) => {
                      const done = item.status === "served" || item.status === "completed";
                      return (
                        <li
                          key={item.id}
                          className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm ${
                            done ? "opacity-40" : ""
                          }`}
                        >
                          <div className="min-w-0">
                            <p>
                              <span className="font-medium">{item.quantity}x</span> {item.product_name}
                            </p>
                            {item.options.length > 0 && (
                              <p className="text-xs text-black/40">
                                {item.options.map((o) => `${o.option_name}: ${o.option_value}`).join(" · ")}
                              </p>
                            )}
                            {item.notes && <p className="text-xs italic text-black/40">{item.notes}</p>}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${itemBadgeClass(item.status)}`}
                            >
                              {itemLabel(item.status)}
                            </span>
                            {isNotStarted(item.status) && (
                              <button
                                onClick={() => handleAdvance([item.id], "preparing")}
                                disabled={busy}
                                aria-label="Empezar"
                                className="rounded-lg border border-black/10 p-1.5 text-black/60 hover:bg-black/5 disabled:opacity-50"
                              >
                                <FiPlay size={13} />
                              </button>
                            )}
                            {(isNotStarted(item.status) || item.status === "preparing") && (
                              <button
                                onClick={() => handleAdvance([item.id], "ready")}
                                disabled={busy}
                                aria-label="Marcar listo"
                                className="rounded-lg bg-emerald-600 p-1.5 text-white disabled:opacity-50"
                              >
                                <FiCheck size={13} />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>

          <div className="mt-6 space-y-2">
            {notStartedIds.length > 0 && (
              <button
                onClick={() => handleAdvance(notStartedIds, "preparing")}
                disabled={busy}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
              >
                <FiPlay size={14} />
                {busy ? "Procesando..." : "Empezar todo"}
              </button>
            )}

            {unreadyIds.length > 0 && (
              <button
                onClick={() => handleAdvance(unreadyIds, "ready")}
                disabled={busy}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-medium text-white disabled:opacity-60"
              >
                <FiCheck size={14} />
                {busy ? "Procesando..." : "Marcar todo listo"}
              </button>
            )}

            {unreadyIds.length === 0 && items.some((i) => i.status === "ready") && (
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

      {head && (
        <ShortageModal
          key={head.orderItemId}
          businessId={businessId}
          item={head}
          busy={busy}
          error={error}
          onSubstitute={handleSubstitute}
          onSoldOut={handleSoldOut}
          onSkip={() => popHead()}
        />
      )}
    </>
  );
}

function ShortageModal({
  businessId,
  item,
  busy,
  error,
  onSubstitute,
  onSoldOut,
  onSkip,
}: {
  businessId: string;
  item: BlockedItem;
  busy: boolean;
  error: string;
  onSubstitute: (subs: ItemSubstitution[]) => void;
  onSoldOut: () => void;
  onSkip: () => void;
}) {
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [choices, setChoices] = useState<
    Record<string, { substituteId: string; quantity: number | null }>
  >({});

  useEffect(() => {
    let cancelled = false;
    listInventoryItemsForKitchenAction(businessId)
      .then((items) => {
        if (!cancelled) setInventory(items);
      })
      .catch(() => {
        if (!cancelled) setInventory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const originalOf = (s: BlockedItem["shortages"][number]) => s.replaces_item_id ?? s.item_id;

  const complete = item.shortages.every((s) => {
    const c = choices[originalOf(s)];
    return Boolean(c && c.substituteId && c.quantity && c.quantity > 0);
  });

  function submit() {
    onSubstitute(
      item.shortages.map((s) => {
        const originalId = originalOf(s);
        const c = choices[originalId];
        return {
          orderItemId: item.orderItemId,
          originalItemId: originalId,
          substituteItemId: c.substituteId,
          quantity: c.quantity as number,
        };
      })
    );
  }

  return (
    <Modal title="Falta un insumo" onClose={onSkip}>
      <p className="mb-4 text-sm text-black/60">
        No hay suficiente para preparar <strong>{item.productName}</strong>. ¿Qué hacemos?
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {item.shortages.map((s) => {
          const originalId = originalOf(s);
          const choice = choices[originalId];
          const chosen = inventory?.find((i) => i.id === choice?.substituteId);

          return (
            <div key={s.item_id} className="rounded-xl border border-black/10 p-3">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="mb-2 text-xs text-red-600">
                Necesita {formatQuantity(s.required, s.unit)} y hay {formatQuantity(s.available, s.unit)}
              </p>

              <select
                value={choice?.substituteId ?? ""}
                onChange={(e) =>
                  setChoices((prev) => ({
                    ...prev,
                    [originalId]: { substituteId: e.target.value, quantity: null },
                  }))
                }
                disabled={inventory === null}
                className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none"
              >
                <option value="">
                  {inventory === null ? "Cargando insumos..." : "Usar en su lugar..."}
                </option>
                {(inventory ?? [])
                  .filter((i) => i.id !== s.item_id)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({formatQuantity(i.stock_quantity, i.unit)})
                    </option>
                  ))}
              </select>

              {chosen && (
                <div key={chosen.id} className="mt-2">
                  <QuantityInput
                    unit={chosen.unit}
                    onChange={(q) =>
                      setChoices((prev) => ({
                        ...prev,
                        [originalId]: { substituteId: chosen.id, quantity: q },
                      }))
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-2">
        <button
          onClick={submit}
          disabled={!complete || busy}
          className="h-11 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-50"
        >
          {busy ? "Procesando..." : "Usar sustituto y continuar"}
        </button>

        <button
          onClick={() => {
            if (
              confirm(
                `¿Marcar "${item.productName}" como agotado? Se bloquea en el menú y se retira de este pedido.`
              )
            ) {
              onSoldOut();
            }
          }}
          disabled={busy}
          className="h-11 w-full rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Marcar agotado y retirar del pedido
        </button>

        <button onClick={onSkip} disabled={busy} className="h-9 w-full text-xs text-black/40 hover:text-black">
          Decidir después
        </button>
      </div>
    </Modal>
  );
}