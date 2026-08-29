import { getActiveMaintenanceAnnouncement } from '@/lib/queries/platformAdmin';
import { getMaintenanceWindow } from '@/lib/utils/maintenanceWindow';
import MaintenanceCountdown from '@/components/MaintenanceCountdown';

export default async function MaintenancePage() {
  const announcement = await getActiveMaintenanceAnnouncement();
  const endTime = announcement
    ? getMaintenanceWindow(announcement).end.toISOString()
    : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFD] p-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-2xl text-white">
          🛠️
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Estamos en mantenimiento
        </h1>
        <p className="mt-3 text-sm text-black/50">
          Aurora está mejorando el sistema en este momento. Vuelve a intentarlo en unos minutos.
        </p>
        {announcement?.extra_message && (
          <p className="mt-2 text-sm text-black/50">{announcement.extra_message}</p>
        )}
        {endTime && <MaintenanceCountdown endTime={endTime} />}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';