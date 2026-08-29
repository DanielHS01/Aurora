import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getOrdersWithItems } from '@/lib/queries/orders';
import OrdersManager from '@/components/dashboard/restaurant/orders/OrdersManager';
import RealtimeOrdersListener from '@/components/dashboard/restaurant/RealtimeOrdersListener';
import TakeawayOrderButton from '@/components/dashboard/restaurant/TakeawayOrderButton';

export default async function OrdersPage() {
  const business = await getCurrentUserBusiness();
  if (!business) return null;

  const allOrders = await getOrdersWithItems(business.id);
  const activeOrders = allOrders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  );

  return (
    <div>
      <RealtimeOrdersListener businessId={business.id} />

      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Pedidos</h1>
        <p className="mt-1 text-sm text-black/40">
          Pedidos para llevar y a domicilio en curso.
        </p>
        <TakeawayOrderButton businessId={business.id} />
      </header>

      <OrdersManager businessId={business.id} orders={activeOrders} />
    </div>
  );
}

export const dynamic = 'force-dynamic';