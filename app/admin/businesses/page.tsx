import { getAllBusinessesOverview } from '@/lib/queries/platformAdmin';
import { getFactusStatusMap } from '@/lib/queries/factusCredentials';
import AdminBusinessesTable from '@/components/admin/AdminBusinessesTable';

export default async function AdminBusinessesPage() {
  const [businesses, factusStatusMap] = await Promise.all([
    getAllBusinessesOverview(),
    getFactusStatusMap(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Negocios ({businesses.length})</h1>

      <AdminBusinessesTable businesses={businesses} factusStatusMap={factusStatusMap} />
    </div>
  );
}

export const dynamic = 'force-dynamic';