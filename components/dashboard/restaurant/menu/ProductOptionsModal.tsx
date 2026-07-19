"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";

import {
  createProductOptionAction,
  deleteProductOptionAction,
  createProductOptionValueAction,
  deleteProductOptionValueAction,
} from "@/lib/actions/menu-actions";
import type { CategoryWithProducts } from "@/lib/queries/menu";

type ProductWithOptions = CategoryWithProducts["products"][number];

interface ProductOptionsModalProps {
  businessId: string;
  product: ProductWithOptions;
  onClose: () => void;
}

export default function ProductOptionsModal({
  businessId,
  product,
  onClose,
}: ProductOptionsModalProps) {
  const router = useRouter();
  const [error, setError] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Opciones de &quot;{product.name}&quot;
          </h3>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <FiX size={20} />
          </button>
        </div>
        <p className="mb-5 text-xs text-black/40">
          Ej: &quot;Término de la carne&quot; con valores &quot;Término
          medio&quot;, &quot;Bien cocido&quot;.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          {product.options.map((option) => (
            <OptionBlock
              key={option.id}
              businessId={businessId}
              option={option}
              onError={setError}
            />
          ))}
        </div>

        <NewOptionForm
          businessId={businessId}
          productId={product.id}
          onError={setError}
        />
      </div>
    </div>
  );
}

function OptionBlock({
  businessId,
  option,
  onError,
}: {
  businessId: string;
  option: ProductWithOptions["options"][number];
  onError: (msg: string) => void;
}) {
  const router = useRouter();
  const [showAddValue, setShowAddValue] = useState(false);
  const [valueName, setValueName] = useState("");
  const [extraPrice, setExtraPrice] = useState("0");
  const [loading, setLoading] = useState(false);

  async function handleDeleteOption() {
    if (!confirm(`¿Eliminar la opción "${option.name}" y todos sus valores?`))
      return;
    try {
      await deleteProductOptionAction(option.id, businessId);
      router.refresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Ocurrió un error.");
    }
  }

  async function handleDeleteValue(valueId: string) {
    try {
      await deleteProductOptionValueAction(valueId, businessId);
      router.refresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Ocurrió un error.");
    }
  }

  async function handleAddValue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valueName.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("businessId", businessId);
      formData.set("optionId", option.id);
      formData.set("name", valueName.trim());
      formData.set("extraPrice", extraPrice || "0");

      await createProductOptionValueAction(formData);
      router.refresh();
      setValueName("");
      setExtraPrice("0");
      setShowAddValue(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-medium">{option.name}</p>
          <p className="text-xs text-black/40">
            {option.is_required ? "Obligatoria" : "Opcional"} · selecciona{" "}
            {option.min_select}-{option.max_select}
          </p>
        </div>
        <button
          onClick={handleDeleteOption}
          aria-label="Eliminar opción"
          className="rounded-lg p-1.5 text-black/30 hover:bg-red-50 hover:text-red-600"
        >
          <FiTrash2 size={14} />
        </button>
      </div>

      <ul className="space-y-1">
        {option.values.map((value) => (
          <li
            key={value.id}
            className="flex items-center justify-between rounded-lg bg-black/[0.02] px-3 py-2 text-sm"
          >
            <span>{value.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-black/40">
                {(value.extra_price ?? 0) > 0
                  ? `+$${(value.extra_price ?? 0).toLocaleString("es-CO")}`
                  : "Sin costo extra"}
              </span>
              <button
                onClick={() => handleDeleteValue(value.id)}
                aria-label="Eliminar valor"
                className="text-black/30 hover:text-red-600"
              >
                <FiX size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showAddValue ? (
        <form onSubmit={handleAddValue} className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <input
              value={valueName}
              onChange={(e) => setValueName(e.target.value)}
              placeholder="Ej: Término medio"
              autoFocus
              className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-xs outline-none focus:border-black/30"
            />
          </div>
          <div className="w-24">
            <input
              type="number"
              min={0}
              step="0.01"
              value={extraPrice}
              onChange={(e) => setExtraPrice(e.target.value)}
              placeholder="Extra $"
              className="h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-xs outline-none focus:border-black/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-9 rounded-lg bg-[var(--brand-primary)] px-3 text-xs font-medium text-[var(--brand-secondary)] disabled:opacity-60"
          >
            OK
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowAddValue(true)}
          className="mt-3 flex items-center gap-1 text-xs text-black/50 hover:text-black"
        >
          <FiPlus size={12} />
          Agregar valor
        </button>
      )}
    </div>
  );
}

function NewOptionForm({
  businessId,
  productId,
  onError,
}: {
  businessId: string;
  productId: string;
  onError: (msg: string) => void;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [minSelect, setMinSelect] = useState("0");
  const [maxSelect, setMaxSelect] = useState("1");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("businessId", businessId);
      formData.set("productId", productId);
      formData.set("name", name.trim());
      formData.set("isRequired", String(isRequired));
      formData.set("minSelect", minSelect);
      formData.set("maxSelect", maxSelect);

      await createProductOptionAction(formData);
      router.refresh();
      setName("");
      setIsRequired(false);
      setMinSelect("0");
      setMaxSelect("1");
      setShowForm(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setLoading(false);
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 py-3 text-sm text-black/50 hover:border-black/40 hover:text-black"
      >
        <FiPlus size={15} />
        Nueva opción
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 space-y-3 rounded-2xl border border-black/10 p-4"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Término de la carne, Tamaño"
        autoFocus
        className="h-10 w-full rounded-lg border border-black/10 bg-black/[0.02] px-3 text-sm outline-none focus:border-black/30"
      />

      <div className="grid grid-cols-3 gap-2">
        <label className="flex items-center gap-2 text-xs text-black/60">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
          />
          Obligatoria
        </label>
        <input
          type="number"
          min={0}
          value={minSelect}
          onChange={(e) => setMinSelect(e.target.value)}
          placeholder="Mín."
          className="h-9 rounded-lg border border-black/10 bg-black/[0.02] px-2 text-xs outline-none focus:border-black/30"
        />
        <input
          type="number"
          min={1}
          value={maxSelect}
          onChange={(e) => setMaxSelect(e.target.value)}
          placeholder="Máx."
          className="h-9 rounded-lg border border-black/10 bg-black/[0.02] px-2 text-xs outline-none focus:border-black/30"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="h-9 flex-1 rounded-lg bg-[var(--brand-primary)] text-xs font-medium text-[var(--brand-secondary)] disabled:opacity-60"
        >
          {loading ? "Creando..." : "Crear opción"}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="h-9 rounded-lg border border-black/10 px-4 text-xs text-black/50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
