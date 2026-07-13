import { createClient } from '@/lib/supabase/server';
import TableGrid from '@/components/dashboard/TableGrid';
import StatCard from '@/components/dashboard/StatCard';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Traemos los datos en paralelo para mayor velocidad
  const [tablesRes, ordersRes] = await Promise.all([
    supabase.from('restaurant_tables').select('*'),
    supabase.from('orders').select('*').eq('status', 'pending')
  ]);

  return (
    <main className="min-h-screen bg-[#FDFDFD] p-5 md:p-10">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Panel de Control</h1>
      </header>

      {/* Sección KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Mesas Ocupadas" value={tablesRes.data?.filter(t => t.status === 'occupied').length.toString() || "0"} />
        <StatCard title="Pedidos Pendientes" value={ordersRes.data?.length.toString() || "0"} />
        <StatCard title="Estado del Sistema" value="Activo" />
      </section>

      {/* Sección Mesas */}
      <section>
        <h2 className="text-xl font-medium mb-6">Estado de Mesas</h2>
        <TableGrid tables={tablesRes.data || []} />
      </section>
    </main>
  );
}