import { getCurrentUser } from '@/lib/auth/session';
import { getCurrentUserRole } from '@/lib/queries/business-users';
import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import LockedAccountView from '@/components/dashboard/LockedAccountView';

export default async function SubscriptionLockedPage() {
  const user = await getCurrentUser();
  const business = await getCurrentUserBusiness();
  const role = business ? await getCurrentUserRole(business.id) : null;

  const isOwner = role === 'owner';

  return (
    <LockedAccountView
      businessName={business?.name ?? 'tu negocio'}
      isOwner={isOwner}
    />
  );
}