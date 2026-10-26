"use client";

import { useMemo, useState } from "react";
import { FiPlus, FiSearch, FiEdit2, FiArchive } from "react-icons/fi";

import {
  createInventoryItemAction,
  adjustInventoryStockAction,
  updateInventoryItemAction,
  archiveInventoryItemAction,
} from "@/lib/actions/inventoryActions";
import type { InventoryItem } from "@/lib/queries/inventory";
import {
  UNIT_LABEL,
  formatQuantity,
  type InventoryUnit,
} from "@/lib/utils/inventory";
import { Modal, QuantityInput, inputClass } from "./InventoryShared";

export default function StockTab({
  businessId,
  items,
  setItems,
}: {
  businessId: string;
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, search]);

  function replaceLocal(updated: InventoryItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function handleArchive(item: InventoryItem) {
    if (!confirm(`¿Archivar "${item.name}"?`)) return;
    try {
      await archiveInventoryItemAction(item.id, businessId);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ocurrió un error.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar insumo..."
            className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] pl-9 pr-4 text-sm outline-none focus:border-black/30"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-[var(--brand-secondary)] hover:opacity-90"
        >
          <FiPlus size={16} />
          Nuevo insumo
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/10 bg-gray-50/50 p-16">
          <p className="text-black/50">
            {items.length === 0
              ? "Aún no has creado insumos."
              : "Sin resultados para tu búsqueda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-black/[0.02] text-xs uppercase tracking-wide text-black/40">
              <tr>
                <th className="px-4 py-3">Insumo</th>
                <th className="px-4 py-3">Existencias</th>
                <th className="px-4 py-3">Mínimo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map((item) => {
                const isOut = item.stock_quantity <= 0;
                const isLow = !isOut && item.stock_quantity <= item.min_stock;

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">
                      {formatQuantity(item.stock_quantity, item.unit)}
                    </td>
                    <td className="px-4 py-3 text-black/50">
                      {formatQuantity(item.min_stock, item.unit)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          isOut
                            ? "bg-red-50 text-red-600"
                            : isLow
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isOut ? "Agotado" : isLow ? "Stock bajo" : "OK"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAdjusting(item)}
                          className="whitespace-nowrap rounded-lg border border-black/10 px-3 py-1.5 text-xs text-black/70 hover:bg-black/5"
                        >
                          Ajustar stock
                        </button>
                        <button
                          onClick={() => setEditing(item)}
                          aria-label="Editar"
                          className="rounded-lg p-2 text-black/40 hover:bg-black/5 hover:text-black"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleArchive(item)}
                          aria-label="Archivar"
                          className="rounded-lg p-2 text-black/40 hover:bg-red-50 hover:text-red-600"
                        >
                          <FiArchive size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateItemModal
          businessId={businessId}
          onClose={() => setShowCreate(false)}
          onCreated={(created) =>
            setItems((prev) =>
              [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
            )
          }
        />
      )}

      {adjusting && (
        <AdjustStockModal
          businessId={businessId}
          item={adjusting}
          onClose={() => setAdjusting(null)}
          onAdjusted={replaceLocal}
        />
      )}

      {editing && (
        <EditItemModal
          businessId={businessId}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={replaceLocal}
        />
      )}
    </div>
  );
}

function CreateItemModal({
  businessId,
  onClose,
  onCreated,
}: {
  businessId: string;
  onClose: () => void;
  onCreated: (item: InventoryItem) => void;
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<InventoryUnit>("g");
  const [initialStock, setInitialStock] = useState<number | null>(null);
  const [minStock, setMinStock] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("businessId", businessId);
      formData.set("name", name.trim());
      formData.set("unit", unit);
      formData.set("initialStock", String(initialStock ?? 0));
      formData.set("minStock", String(minStock ?? 0));

      const created = await createInventoryItemAction(formData);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
      setLoading(false);
    }
  }

  return (
    <Modal title="Nuevo insumo" onClose={onClose}>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Nombre
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="Ej: Pechuga de pollo"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Se mide en
          </span>
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value as InventoryUnit);
              // Los campos de cantidad se reinician al cambiar de unidad
              setInitialStock(null);
              setMinStock(null);
            }}
            className={inputClass}
          >
            {(Object.keys(UNIT_LABEL) as InventoryUnit[]).map((u) => (
              <option key={u} value={u}>
                {UNIT_LABEL[u]}
              </option>
            ))}
          </select>
        </label>

        {/* key={unit}: al cambiar de unidad el campo se remonta vacío */}
        <div key={unit} className="space-y-4">
          <div>
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Existencias iniciales
            </span>
            <QuantityInput unit={unit} onChange={setInitialStock} />
          </div>
          <div>
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Avisar cuando queden (mínimo)
            </span>
            <QuantityInput unit={unit} onChange={setMinStock} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
        >
          {loading ? "Creando..." : "Crear insumo"}
        </button>
      </form>
    </Modal>
  );
}

function AdjustStockModal({
  businessId,
  item,
  onClose,
  onAdjusted,
}: {
  businessId: string;
  item: InventoryItem;
  onClose: () => void;
  onAdjusted: (updated: InventoryItem) => void;
}) {
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");
  const [quantity, setQuantity] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const MODES = [
    {
      value: "add",
      label: "Entrada (compra)",
      help: "Suma lo que acaba de llegar. Ej: compraste 5 kg de pollo.",
    },
    {
      value: "remove",
      label: "Salida (merma)",
      help: "Resta lo que se perdió sin venderse: vencido, caído, dañado o consumo del personal.",
    },
    {
      value: "set",
      label: "Conteo físico",
      help: "Escribe lo que contaste en bodega. El sistema calcula la diferencia y deja el stock exacto.",
    },
  ] as const;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (
      quantity === null ||
      quantity < 0 ||
      (mode !== "set" && quantity === 0)
    ) {
      setError("Ingresa una cantidad válida.");
      return;
    }

    setLoading(true);
    try {
      const newStock = await adjustInventoryStockAction(
        item.id,
        businessId,
        mode,
        quantity,
        note,
      );
      onAdjusted({ ...item, stock_quantity: newStock });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
      setLoading(false);
    }
  }

  return (
    <Modal title={item.name} onClose={onClose}>
      <p className="mb-4 text-sm text-black/50">
        Existencias actuales: {formatQuantity(item.stock_quantity, item.unit)}
      </p>

      <div className="mb-4 grid grid-cols-3 gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={`rounded-xl border px-2 py-2 text-xs transition ${
              mode === m.value
                ? "border-black bg-black text-white"
                : "border-black/10"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="mb-4 text-xs text-black/40">
        {MODES.find((m) => m.value === mode)?.help}
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            {mode === "set" ? "Cantidad contada" : "Cantidad"}
          </span>
          <QuantityInput unit={item.unit} onChange={setQuantity} autoFocus />
        </div>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Nota (opcional)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: compra a proveedor, producto vencido..."
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </Modal>
  );
}

function EditItemModal({
  businessId,
  item,
  onClose,
  onSaved,
}: {
  businessId: string;
  item: InventoryItem;
  onClose: () => void;
  onSaved: (updated: InventoryItem) => void;
}) {
  const [name, setName] = useState(item.name);
  const [minStock, setMinStock] = useState<number | null>(item.min_stock);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name.trim() || minStock === null) {
      setError("Completa los campos.");
      return;
    }

    setLoading(true);
    try {
      await updateInventoryItemAction(item.id, businessId, name, minStock);
      onSaved({ ...item, name: name.trim(), min_stock: minStock });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
      setLoading(false);
    }
  }

  return (
    <Modal title="Editar insumo" onClose={onClose}>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Nombre
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>

        <div>
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Avisar cuando queden (mínimo)
          </span>
          <QuantityInput
            unit={item.unit}
            initial={item.min_stock}
            onChange={setMinStock}
          />
        </div>

        <p className="text-xs text-black/40">
          La unidad no se puede cambiar, porque las recetas ya la usan.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </Modal>
  );
}
