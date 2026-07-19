import { createClient } from '@/lib/supabase/server';
import { getRestaurantTables } from '@/lib/queries/tables';
import StatCard from '@/components/dashboard/StatCard';

export default async function RestaurantDashboard({
  businessId,
}: {
  businessId: string;
}) {
  const supabase = await createClient();

  const [tables, activeOrdersRes] = await Promise.all([
    getRestaurantTables(businessId),
    supabase
      .from('orders')
      .select('id, status')
      .eq('business_id', businessId)
      .not('status', 'in', '(completed,cancelled)'),
  ]);

  const activeOrders = activeOrdersRes.data || [];
  const pendingOrdersCount = activeOrders.filter(
    (o) => o.status === 'pending'
  ).length;

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Panel de Control
        </h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Mesas Ocupadas"
          value={tables
            .filter((t) => t.status === 'occupied')
            .length.toString()}
        />
        <StatCard
          title="Pedidos Pendientes"
          value={pendingOrdersCount.toString()}
        />
        <StatCard title="Estado del Sistema" value="Activo" />
      </section>
    </div>
  );
}