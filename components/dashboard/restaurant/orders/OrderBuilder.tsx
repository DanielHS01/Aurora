"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiX,
  FiMinus,
  FiPlus,
  FiSend,
  FiTrash2,
} from "react-icons/fi";

import {
  addOrderItemAction,
  removeOrderItemAction,
  updateOrderItemQuantityAction,
  cancelOrderAction,
  updateOrderStatusAction,
} from "@/lib/actions/order-actions";
import { createKitchenTicketAction, notifyKitchenOrderChangedAction } from "@/lib/actions/kitchen-actions";
import type { OrderWithItems } from "@/lib/queries/orders";
import type { CategoryWithProducts } from "@/lib/queries/menu";
import { useToast } from '@/components/dashboard/ToastProvider';

type ProductWithOptions = CategoryWithProducts["products"][number];


interface OrderBuilderProps {
  businessId: string;
  order: OrderWithItems;
  menu: CategoryWithProducts[];
}

export default function OrderBuilder({
  businessId,
  order: initialOrder,
  menu,
}: OrderBuilderProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [searchQuery, setSearchQuery] = useState("");
  const [pickingProduct, setPickingProduct] =
    useState<ProductWithOptions | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return menu;
    return menu
      .map((c) => ({
        ...c,
        products: c.products.filter((p) =>
          p.name.toLowerCase().includes(query),
        ),
      }))
      .filter((c) => c.products.length > 0);
  }, [menu, searchQuery]);

  function handleProductTap(product: ProductWithOptions) {
    if (product.is_sold_out) return;

    if (product.options.length > 0) {
      setPickingProduct(product);
    } else {
      handleAddItem(product, []);
    }
  }

  async function handleAddItem(
    product: ProductWithOptions,
    options: {
      option_name: string;
      option_value: string;
      extra_price?: number;
    }[],
  ) {
    setError("");
    try {
      const formData = new FormData();
      formData.set("orderId", order.id);
      formData.set("productId", product.id);
      formData.set("productName", product.name);
      formData.set("quantity", "1");
      formData.set("unitPrice", String(product.price));
      formData.set("options", JSON.stringify(options));

      const newItem = await addOrderItemAction(businessId, formData);

      // Actualiza el pedido en memoria — sin pedirle nada nuevo al
      // servidor, así el menú (categorías/opciones/valores) no se
      // vuelve a consultar cada vez que se agrega un ítem.
      setOrder((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
        total: (prev.total ?? 0) + (newItem.total_price ?? 0),
      }));

      setPickingProduct(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    }
  }

  async function handleRemoveItem(orderItemId: string) {
    setError("");
    try {
      await removeOrderItemAction(orderItemId, order.id, businessId);

      setOrder((prev) => {
        const removed = prev.items.find((i) => i.id === orderItemId);
        return {
          ...prev,
          items: prev.items.filter((i) => i.id !== orderItemId),
          total: (prev.total ?? 0) - (removed?.total_price ?? 0),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    }
  }

  async function handleQuantityChange(orderItemId: string, newQty: number) {
    if (newQty < 1) return;
    setError("");
    try {
      await updateOrderItemQuantityAction(
        orderItemId,
        order.id,
        businessId,
        newQty,
      );

      setOrder((prev) => {
        const target = prev.items.find((i) => i.id === orderItemId);
        if (!target) return prev;

        const unitPrice =
          target.quantity > 0 ? (target.total_price ?? 0) / target.quantity : 0;
        const newTotalPrice = unitPrice * newQty;
        const diff = newTotalPrice - (target.total_price ?? 0);

        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === orderItemId
              ? { ...i, quantity: newQty, total_price: newTotalPrice }
              : i,
          ),
          total: (prev.total ?? 0) + diff,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    }
  }

  async function handleSendToKitchen() {
    if (order.items.length === 0) {
      setError("Agrega al menos un ítem antes de enviar a cocina.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await createKitchenTicketAction(businessId, order.id);
      await updateOrderStatusAction(
        order.id,
        businessId,
        "confirmed",
        order.table_id,
      );
      router.push(order.table_id ? "/dashboard/tables" : "/dashboard/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setSending(false);
    }
  }

  async function handleCancelOrder() {
    if (!confirm("¿Cancelar este pedido? La mesa quedará libre.")) return;
    try {
      await cancelOrderAction(order.id, businessId, order.table_id);
      router.push(order.table_id ? "/dashboard/tables" : "/dashboard/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    }
  }
  const { showToast } = useToast();
  async function handleNotifyKitchenChange() {
  try {
    await notifyKitchenOrderChangedAction(businessId, order.id);
    showToast('Cocina fue notificada del cambio.');
    router.push(order.table_id ? '/dashboard/tables' : '/dashboard/orders');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Ocurrió un error.');
  }
}

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Menú */}
      <div>
        <div className="relative mb-6">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar plato..."
            className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] pl-9 pr-4 text-sm outline-none focus:border-black/30"
          />
        </div>

        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <section key={category.id}>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-black/40">
                {category.name}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {category.products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductTap(product)}
                    disabled={product.is_sold_out}
                    className={`rounded-2xl border p-4 text-left transition ${
                      product.is_sold_out
                        ? "cursor-not-allowed border-black/5 bg-black/[0.02] opacity-50"
                        : "border-black/10 bg-white hover:border-black/30"
                    }`}
                  >
                    <p className="font-medium">{product.name}</p>
                    {product.is_sold_out ? (
                      <p className="mt-1 text-sm font-medium text-red-500">
                        Agotado
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-black/50">
                        ${product.price.toLocaleString("es-CO")}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Carrito del pedido */}
      <div className="flex flex-col rounded-2xl border border-black/10 bg-white p-5">
        <h3 className="mb-4 text-lg font-medium">
          {order.table_id
            ? "Pedido"
            : order.order_type === "delivery"
              ? "Domicilio"
              : "Pedido para llevar"}
        </h3>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto">
          {order.items.length === 0 ? (
            <p className="py-10 text-center text-sm text-black/40">
              Aún no hay ítems. Toca un plato del menú para agregarlo.
            </p>
          ) : (
            order.items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-black/10 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.product_name}</p>
                    {item.options.length > 0 && (
                      <p className="mt-0.5 text-xs text-black/40">
                        {item.options
                          .map((o) => `${o.option_name}: ${o.option_value}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label="Quitar ítem"
                    className="text-black/30 hover:text-red-600"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 text-black/60 disabled:opacity-30"
                    >
                      <FiMinus size={12} />
                    </button>
                    <span className="w-5 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity + 1)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 text-black/60"
                    >
                      <FiPlus size={12} />
                    </button>
                  </div>
                  <span className="text-sm font-medium">
                    ${(item.total_price ?? 0).toLocaleString("es-CO")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 space-y-3 border-t border-black/10 pt-4">
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>${(order.total ?? 0).toLocaleString("es-CO")}</span>
          </div>

          {order.status === "pending" ? (
            <button
              onClick={handleSendToKitchen}
              disabled={sending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] transition hover:opacity-90 disabled:opacity-60"
            >
              <FiSend size={15} />
              {sending ? "Enviando..." : "Enviar a cocina"}
            </button>
          ) : (
            <button
              onClick={handleNotifyKitchenChange}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              Avisar a cocina del cambio
            </button>
          )}

          <button
            onClick={handleCancelOrder}
            className="h-10 w-full rounded-xl border border-red-100 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cancelar pedido
          </button>
        </div>
      </div>

      {pickingProduct && (
        <OrderItemOptionsModal
          product={pickingProduct}
          onClose={() => setPickingProduct(null)}
          onConfirm={(options) => handleAddItem(pickingProduct, options)}
        />
      )}
    </div>
  );
}

function OrderItemOptionsModal({
  product,
  onClose,
  onConfirm,
}: {
  product: ProductWithOptions;
  onClose: () => void;
  onConfirm: (
    options: {
      option_name: string;
      option_value: string;
      extra_price?: number;
    }[],
  ) => void;
}) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  function toggleValue(
    optionId: string,
    optionName: string,
    valueName: string,
    maxSelect: number,
  ) {
    setSelections((prev) => {
      const current = prev[optionId] ?? [];
      const isSelected = current.includes(valueName);

      if (isSelected) {
        return { ...prev, [optionId]: current.filter((v) => v !== valueName) };
      }

      if (maxSelect === 1) {
        return { ...prev, [optionId]: [valueName] };
      }

      if (current.length >= maxSelect) {
        return prev;
      }

      return { ...prev, [optionId]: [...current, valueName] };
    });
  }

  function handleConfirm() {
    const missingRequired = product.options.find(
      (opt) => opt.is_required && (selections[opt.id] ?? []).length === 0,
    );
    if (missingRequired) {
      alert(`"${missingRequired.name}" es obligatorio.`);
      return;
    }

    const options: {
      option_name: string;
      option_value: string;
      extra_price?: number;
    }[] = [];
    for (const opt of product.options) {
      const chosen = selections[opt.id] ?? [];
      for (const valueName of chosen) {
        const value = opt.values.find((v) => v.name === valueName);
        options.push({
          option_name: opt.name,
          option_value: valueName,
          extra_price: value?.extra_price ?? 0,
        });
      }
    }

    onConfirm(options);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {product.options.map((option) => (
            <div key={option.id}>
              <p className="mb-2 text-sm font-medium">
                {option.name}
                {option.is_required && (
                  <span className="ml-1 text-xs text-red-500">*</span>
                )}
              </p>
              <div className="space-y-1.5">
                {option.values.map((value) => {
                  const isSelected = (selections[option.id] ?? []).includes(
                    value.name,
                  );
                  return (
                    <button
                      key={value.id}
                      onClick={() =>
                        toggleValue(
                          option.id,
                          option.name,
                          value.name,
                          option.max_select ?? 1,
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                        isSelected
                          ? "border-black bg-black text-white"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <span>{value.name}</span>
                      {(value.extra_price ?? 0) > 0 && (
                        <span className="text-xs opacity-70">
                          +${(value.extra_price ?? 0).toLocaleString("es-CO")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          className="mt-6 h-11 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)]"
        >
          Agregar al pedido
        </button>
      </div>
    </div>
  );
}
