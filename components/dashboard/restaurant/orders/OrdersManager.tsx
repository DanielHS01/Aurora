'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiShoppingBag, FiTruck, FiCheck, FiEye } from 'react-icons/fi';

import { markOrderPickedUpAction } from '@/lib/actions/order-actions';
import CheckoutModal from './CheckoutModal';
import type { Database } from '@/lib/types/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderWithItems = Order & { order_items: { quantity: number; total_price: number | null }[] };

const STATUS_LABEL: Record<string, string> = {
  pending: 'Armando pedido',
  confirmed: 'Enviado a cocina',
  preparing: 'En preparación',
  ready: 'Listo',
  served: 'Entregado',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-black/[0.05] text-black/50',
  confirmed: 'bg-amber-50 text-amber-700',
  preparing: 'bg-amber-50 text-amber-700',
  ready: 'bg-emerald-50 text-emerald-700',
  served: 'bg-blue-50 text-blue-700',
};

export default function OrdersManager({
  businessId,
  orders: initialOrders,
}: {
  businessId: string;
  orders: OrderWithItems[];
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [checkoutOrder, setCheckoutOrder] = useState<{ orderId: string; total: number } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [prevInitialOrders, setPrevInitialOrders] = useState(initialOrders);

  if (initialOrders !== prevInitialOrders) {
    setPrevInitialOrders(initialOrders);
    setOrders(initialOrders);
  }

  const takeawayOrders = orders.filter((o) => !o.table_id);

  function updateOrderLocal(orderId: string, updates: Partial<OrderWithItems>) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)));
  }

  function removeOrderLocal(orderId: string) {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }

  async function handleMarkPickedUp(orderId: string) {
    setLoadingId(orderId);
    try {
      await markOrderPickedUpAction(orderId, businessId);
      updateOrderLocal(orderId, { status: 'served' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoadingId(null);
    }
  }

  if (takeawayOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/10 bg-gray-50/50 p-16">
        <p className="text-black/50">No hay pedidos para llevar o a domicilio activos.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {takeawayOrders.map((order) => {
          const itemCount = order.order_items.reduce((s, i) => s + i.quantity, 0);
          const isDelivery = order.order_type === 'delivery';

          return (
            <div key={order.id} className="rounded-2xl border border-black/10 bg-white p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  {isDelivery ? <FiTruck size={15} /> : <FiShoppingBag size={15} />}
                  {isDelivery ? 'Domicilio' : 'Para llevar'}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[order.status ?? 'pending']}`}>
                  {STATUS_LABEL[order.status ?? 'pending']}
                </span>
              </div>

              <p className="mb-1 text-sm text-black/50">
                {itemCount} ítem(s) · ${(order.total ?? 0).toLocaleString('es-CO')}
              </p>
              {order.payment_status === 'paid' && (
                <p className="mb-3 text-xs font-medium text-emerald-600">✓ Pagado</p>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-black/10 py-2 text-sm font-medium text-black/70 hover:bg-black/5"
                >
                  <FiEye size={14} />
                  Ver pedido
                </button>

                {order.status === 'ready' && (
                  <button
                    onClick={() => handleMarkPickedUp(order.id)}
                    disabled={loadingId === order.id}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    <FiCheck size={14} />
                    {isDelivery ? 'Marcar entregado' : 'Marcar recogido'}
                  </button>
                )}

                {order.payment_status !== 'paid' && (
                  <button
                    onClick={() => setCheckoutOrder({ orderId: order.id, total: order.total ?? 0 })}
                    className="rounded-xl bg-[var(--brand-primary)] py-2 text-sm font-medium text-[var(--brand-secondary)]"
                  >
                    💳 Cobrar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {checkoutOrder && (
        <CheckoutModal
          businessId={businessId}
          orderId={checkoutOrder.orderId}
          tableId={null}
          total={checkoutOrder.total}
          onPaymentSuccess={() =>
            updateOrderLocal(checkoutOrder.orderId, { payment_status: 'paid', status: 'completed' })
          }
          onClose={() => {
            // Si ya quedó completado, sale de la lista (mismo filtro
            // que aplica el servidor para pedidos activos).
            const wasCompleting = orders.find((o) => o.id === checkoutOrder.orderId)?.payment_status === 'paid';
            if (wasCompleting) removeOrderLocal(checkoutOrder.orderId);
            setCheckoutOrder(null);
          }}
        />
      )}
    </>
  );
}