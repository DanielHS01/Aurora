import { createClient } from '@/lib/supabase/server';
import { getRestaurantTables } from '@/lib/queries/tables';
import { getRevenueSummary, getDailyRevenue } from '@/lib/queries/reports';
import StatCard from '@/components/dashboard/StatCard';
import RevenueChart from '@/components/dashboard/charts/RevenueChart';

export default async function RestaurantDashboard({
  businessId,
}: {
  businessId: string;
}) {
  const supabase = await createClient();

  const [tables, activeOrdersRes, revenueSummary, dailyRevenue] = await Promise.all([
    getRestaurantTables(businessId),
    supabase
      .from('orders')
      .select('id, status, order_type')
      .eq('business_id', businessId)
      .not('status', 'in', '(completed,cancelled)'),
    getRevenueSummary(businessId),
    getDailyRevenue(businessId, 7),
  ]);

  const activeOrders = activeOrdersRes.data || [];
  const dineInPendingCount = activeOrders.filter(
    (o) => o.status === 'pending' && o.order_type === 'dine_in'
  ).length;

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Panel de Control
        </h1>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-10">
        <StatCard
          title="Ingresos Hoy"
          value={`$${revenueSummary.today.toLocaleString('es-CO')}`}
        />
        <StatCard
          title="Mesas Ocupadas"
          value={tables.filter((t) => t.status === 'occupied').length.toString()}
        />
        <StatCard
          title="Pedidos de Mesa Pendientes"
          value={dineInPendingCount.toString()}
        />
        <StatCard title="Estado del Sistema" value="Activo" />
      </section>

      <section className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-black/40">
            Ingresos — últimos 7 días
          </p>
          <p className="text-sm text-black/50">
            Mes actual: ${revenueSummary.thisMonth.toLocaleString('es-CO')}
          </p>
        </div>
        <RevenueChart data={dailyRevenue} />
      </section>
    </div>
  );
}