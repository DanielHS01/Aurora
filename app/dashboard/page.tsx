import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { createClient } from '@/lib/supabase/server';
import RestaurantDashboard from '@/components/dashboard/restaurant/RestaurantDashboard';
import BarbershopDashboard from '@/components/dashboard/barbershop/BarbershopDashboard';
import OpticalDashboard from '@/components/dashboard/optical/OpticalDashboard';
import HotelDashboard from '@/components/dashboard/hotel/HotelDashboard';

export default async function DashboardPage() {
  const business = await getCurrentUserBusiness();

  // El layout ya redirige si no hay negocio, pero TypeScript no lo sabe
  // — este chequeo es solo para que el tipo no sea null aquí abajo.
  if (!business) return null;

  switch (business.business_type) {
    case 'restaurant':
      return <RestaurantDashboard businessId={business.id} />;
    case 'barbershop':
      return <BarbershopDashboard businessId={business.id} />;
    case 'optical':
      return <OpticalDashboard businessId={business.id} />;
    case 'hotel':
    return <HotelDashboard businessId={business.id} />;
    default:
      return (
        <div className="p-10 text-center text-black/50">
          Tipo de negocio no reconocido. Contacta soporte.
        </div>
      );
  }
}

// Evita cachear el dashboard entre negocios distintos en desarrollo
export const dynamic = 'force-dynamic';