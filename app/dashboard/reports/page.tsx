import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import {
  getDailyRevenue,
  getRevenueSummary,
  getOrderCountsByDay,
  getUpcomingReservationsCount,
  getPeriodComparison,
  getTopProducts,
  getRevenueByHour,
  getRevenueByDayOfWeek,
} from '@/lib/queries/reports';
import StatCard from '@/components/dashboard/StatCard';
import RevenueChart from '@/components/dashboard/charts/RevenueChart';
import OrdersChart from '@/components/dashboard/charts/OrdersChart';
import PeriodComparisonCard from '@/components/dashboard/reports/PeriodComparisonCard';
import TopProductsTable from '@/components/dashboard/reports/TopProductsTable';
import HourlyRevenueChart from '@/components/dashboard/reports/HourlyRevenueChart';
import DayOfWeekChart from '@/components/dashboard/reports/DayOfWeekChart';
import DownloadReportButton from '@/components/dashboard/reports/DownloadReportButton';

export default async function ReportsPage() {
  const business = await getCurrentUserBusiness();
  if (!business) return null;

  const [
    revenueSummary,
    dailyRevenue30,
    orderCounts30,
    upcomingReservations,
    dayComparison,
    weekComparison,
    monthComparison,
    topProducts,
    hourlyRevenue,
    dayOfWeekRevenue,
  ] = await Promise.all([
    getRevenueSummary(business.id),
    getDailyRevenue(business.id, 30),
    getOrderCountsByDay(business.id, 30),
    getUpcomingReservationsCount(business.id),
    getPeriodComparison(business.id, 'day'),
    getPeriodComparison(business.id, 'week'),
    getPeriodComparison(business.id, 'month'),
    getTopProducts(business.id, 30, 10),
    getRevenueByHour(business.id, 30),
    getRevenueByDayOfWeek(business.id, 30),
  ]);

  return (
    <div>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Reportes</h1>
          <p className="mt-1 text-sm text-black/40">
            Ingresos y actividad de los últimos 30 días.
          </p>
        </div>
        <DownloadReportButton />
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <PeriodComparisonCard title="Hoy vs. ayer" data={dayComparison} />
        <PeriodComparisonCard
          title="Esta semana vs. anterior"
          data={weekComparison}
        />
        <PeriodComparisonCard
          title="Este mes vs. anterior"
          data={monthComparison}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-8">
        <StatCard
          title="Ingresos Hoy"
          value={`$${revenueSummary.today.toLocaleString('es-CO')}`}
        />
        <StatCard
          title="Últimos 7 días"
          value={`$${revenueSummary.last7Days.toLocaleString('es-CO')}`}
        />
        <StatCard
          title="Este mes"
          value={`$${revenueSummary.thisMonth.toLocaleString('es-CO')}`}
        />
        <StatCard
          title="Reservas próximas"
          value={upcomingReservations.toString()}
        />
      </section>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs uppercase tracking-widest text-black/40">
            Ingresos diarios (30 días)
          </p>
          <RevenueChart data={dailyRevenue30} />
        </section>

        <section className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs uppercase tracking-widest text-black/40">
            Pedidos completados por día (30 días)
          </p>
          <OrdersChart data={orderCounts30} />
        </section>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs uppercase tracking-widest text-black/40">
            Ventas por hora del día
          </p>
          <HourlyRevenueChart data={hourlyRevenue} />
        </section>

        <section className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs uppercase tracking-widest text-black/40">
            Ventas por día de la semana
          </p>
          <DayOfWeekChart data={dayOfWeekRevenue} />
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs uppercase tracking-widest text-black/40">
          Platos más pedidos (30 días)
        </p>
        <TopProductsTable products={topProducts} />
      </section>
    </div>
  );
}

export const dynamic = 'force-dynamic';