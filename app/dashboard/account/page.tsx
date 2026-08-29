import { redirect } from 'next/navigation';
import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getCurrentUser } from '@/lib/auth/session';
import AccountSettingsForm from '@/components/dashboard/account/AccountSettingsForm';
import PasswordSection from '@/components/dashboard/account/PasswordSection';
import { getBusinessHours } from '@/lib/queries/businessHours';
import BusinessHoursEditor from '@/components/dashboard/account/BusinessHoursEditor';

export default async function AccountPage() {
  
  const [business, user] = await Promise.all([
    getCurrentUserBusiness(),
    getCurrentUser(),
  ]);

  if (!business || !user) {
    redirect('/login');
  }
const hours = await getBusinessHours(business.id);
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
        <p className="mt-1 text-sm text-black/40">
          Administra la información de tu negocio y tu cuenta.
        </p>
      </div>

      <AccountSettingsForm business={business} loginEmail={user.email ?? ''} />
      <BusinessHoursEditor initialHours={hours} />
      <PasswordSection />
    </div>
  );
}

export const dynamic = 'force-dynamic';