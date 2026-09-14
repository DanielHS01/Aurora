import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ToastProvider from '@/components/dashboard/ToastProvider';
import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getCurrentUserRole } from '@/lib/queries/business-users';
import { getUnreadNotifications } from '@/lib/queries/notifications';
import { getActiveMaintenanceAnnouncement } from '@/lib/queries/platformAdmin';
import MaintenanceBanner from '@/components/dashboard/MaintenanceBanner';
import { isPlatformAdmin } from '@/lib/auth/platform';
import { getSubscriptionWithPlan } from '@/lib/queries/subscriptionBilling';
import TrialBanner from '@/components/dashboard/TrialBanner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await getCurrentUserBusiness();

  if (!business) {
    redirect('/setup-business');
  }

  const [role, notifications, maintenanceAnnouncement, isAdmin, subscription] = await Promise.all([
  getCurrentUserRole(business.id),
  getUnreadNotifications(business.id),
  getActiveMaintenanceAnnouncement(),
  isPlatformAdmin(),
  getSubscriptionWithPlan(business.id),
]);
  const trialDaysLeft = subscription?.status === 'trial' ? subscription.daysLeft : null;
    
  return (
    <ToastProvider>
      <div
        className="flex h-screen flex-col bg-[#FDFDFD]"
        style={
          {
            '--brand-primary': business.primary_color || '#000000',
            '--brand-secondary': business.secondary_color || '#FFFFFF',
          } as React.CSSProperties
        }
      >
        <MaintenanceBanner announcement={maintenanceAnnouncement} />
        <TrialBanner status={subscription?.status ?? null} daysLeft={trialDaysLeft} />
        
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <Sidebar
            businessName={business.name}
            logoUrl={business.logo_url}
            businessType={business.business_type}
            userRole={role}
            isPlatformAdmin={isAdmin}
          />

          <div className="flex min-h-0 flex-1 flex-col">
            <DashboardHeader notifications={notifications} />
            <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}