import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getReservations } from '@/lib/queries/reservations';
import ReservationsManager from '@/components/dashboard/reservations/ReservationsManager';

export default async function ReservationsPage() {
  const business = await getCurrentUserBusiness();
  if (!business) return null;

  const reservations = await getReservations(business.id);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Reservas</h1>
        <p className="mt-1 text-sm text-black/40">
          Reservas creadas manualmente o por WhatsApp.
        </p>
      </header>

      <ReservationsManager businessId={business.id} reservations={reservations} />
    </div>
  );
}

export const dynamic = 'force-dynamic';