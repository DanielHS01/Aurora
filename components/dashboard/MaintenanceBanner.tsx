import type { MaintenanceAnnouncement } from '@/lib/queries/platformAdmin';
import { getMaintenanceWindow } from '@/lib/utils/maintenanceWindow';

function formatStart(announcement: MaintenanceAnnouncement): string {
  return getMaintenanceWindow(announcement).start.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MaintenanceBanner({
  announcement,
}: {
  announcement: MaintenanceAnnouncement | null;
}) {
  // getActiveMaintenanceAnnouncement ya descarta los avisos cuya ventana terminó
  if (!announcement) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-800">
      🛠️ Mantenimiento programado: {formatStart(announcement)} — duración estimada{' '}
      {announcement.duration_minutes} min.
      {announcement.extra_message && ` ${announcement.extra_message}`}
    </div>
  );
}