import { getActiveMaintenanceAnnouncement } from '@/lib/queries/platformAdmin';
import MaintenanceForm from '@/components/admin/MaintenanceForm';

export default async function AdminMaintenancePage() {
  const active = await getActiveMaintenanceAnnouncement();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Mantenimiento del sistema</h1>
      <MaintenanceForm activeAnnouncement={active} />
    </div>
  );
}

export const dynamic = 'force-dynamic';