import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getCurrentUserRole } from '@/lib/queries/business-users';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await getCurrentUserBusiness();

  if (!business) {
    redirect('/setup-business');
  }

  const role = await getCurrentUserRole(business.id);

  return (
    <div
      className="flex h-screen flex-col bg-[#FDFDFD] md:flex-row"
      style={
        {
          '--brand-primary': business.primary_color || '#000000',
          '--brand-secondary': business.secondary_color || '#FFFFFF',
        } as React.CSSProperties
      }
    >
      <Sidebar
        businessName={business.name}
        logoUrl={business.logo_url}
        businessType={business.business_type}
        userRole={role}
      />

      <main className="flex-1 overflow-y-auto p-4 min-h-0 md:p-8">
        {children}
      </main>
    </div>
  );
}