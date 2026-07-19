import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getRestaurantTables, getBusinessAreas } from '@/lib/queries/tables';
import { createClient } from '@/lib/supabase/server';
import AreaManager from '@/components/dashboard/restaurant/AreaManager';
import TableGrid, { type TableWithOrder } from '@/components/dashboard/restaurant/TableGrid';

export default async function TablesPage() {
  const business = await getCurrentUserBusiness();
  if (!business) return null;

  const supabase = await createClient();

  const [tables, areas, activeOrdersRes] = await Promise.all([
    getRestaurantTables(business.id),
    getBusinessAreas(business.id),
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('business_id', business.id)
      .not('status', 'in', '(completed,cancelled)'),
  ]);

  const activeOrders = activeOrdersRes.data || [];

  const tablesWithOrders: TableWithOrder[] = tables.map((table) => ({
    ...table,
    activeOrder:
      activeOrders.find((order) => order.table_id === table.id) ?? null,
  }));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Mesas</h1>
        <p className="mt-1 text-sm text-black/40">
          Administra el estado y los pedidos de cada mesa.
        </p>
      </header>

      <AreaManager businessId={business.id} areas={areas} />

      <TableGrid
        businessId={business.id}
        tables={tablesWithOrders}
        areas={areas}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';