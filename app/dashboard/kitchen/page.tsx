import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getActiveKitchenTickets } from '@/lib/queries/kitchen';
import { getFullMenu } from '@/lib/queries/menu';
import KitchenBoard from '@/components/dashboard/restaurant/kitchen/KitchenBoard';
import StockManager from '@/components/dashboard/restaurant/kitchen/StockManager';
import RealtimeOrdersListener from '@/components/dashboard/restaurant/RealtimeOrdersListener';

export default async function KitchenPage() {
  const business = await getCurrentUserBusiness();
  if (!business) return null;

  const [tickets, menu] = await Promise.all([
    getActiveKitchenTickets(business.id),
    getFullMenu(business.id),
  ]);

  const categoryByProduct: Record<string, { name: string; order: number }> = {};
  menu.forEach((category, index) => {
    category.products.forEach((product) => {
      categoryByProduct[product.id] = { name: category.name, order: index };
    });
  });

  return (
    <div>
      <RealtimeOrdersListener businessId={business.id} />

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Cocina</h1>
          <p className="mt-1 text-sm text-black/40">
            Pedidos activos en preparación.
          </p>
        </div>
        <StockManager businessId={business.id} categories={menu} />
      </header>

      <KitchenBoard
        businessId={business.id}
        tickets={tickets}
        categoryByProduct={categoryByProduct}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';