import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getActiveKitchenTickets } from '@/lib/queries/kitchen';
import KitchenBoard from '@/components/dashboard/restaurant/kitchen/KitchenBoard';
import RealtimeOrdersListener from '@/components/dashboard/restaurant/RealtimeOrdersListener';

export default async function KitchenPage() {
  const business = await getCurrentUserBusiness();
  if (!business) return null;

  const tickets = await getActiveKitchenTickets(business.id);

  return (
    <div>
      <RealtimeOrdersListener businessId={business.id} />
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Cocina</h1>
        <p className="mt-1 text-sm text-black/40">
          Pedidos activos en preparación.
        </p>
      </header>

      <KitchenBoard businessId={business.id} tickets={tickets} />
    </div>
  );
}

export const dynamic = 'force-dynamic';