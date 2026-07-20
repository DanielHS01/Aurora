import { redirect } from 'next/navigation';
import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getCurrentUserRole, getBusinessUsers } from '@/lib/queries/business-users';
import TeamManager from '@/components/dashboard/team/TeamManager';

export default async function TeamPage() {
  const business = await getCurrentUserBusiness();
  if (!business) redirect('/login');

  const role = await getCurrentUserRole(business.id);
  if (!role || !['owner', 'admin'].includes(role)) {
    redirect('/dashboard');
  }

  const members = await getBusinessUsers(business.id);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Equipo</h1>
        <p className="mt-1 text-sm text-black/40">
          Invita empleados y administra sus roles.
        </p>
      </header>

      <TeamManager businessId={business.id} members={members} />
    </div>
  );
}

export const dynamic = 'force-dynamic';