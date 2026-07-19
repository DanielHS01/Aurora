import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { getCurrentUserBusiness } from '@/lib/queries/businesses';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await getCurrentUserBusiness();

  // Si el usuario no pertenece a ningún negocio activo (ej. la creación
  // falló tras confirmar el correo), lo mandamos a completarlo en vez
  // de dejarlo ver un dashboard vacío o roto.
  if (!business) {
    redirect('/setup-business');
  }

  return (
    <div
      className="flex h-screen bg-[#FDFDFD]"
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
      />

      <main className="flex-1 overflow-y-auto p-8 min-h-0">{children}</main>
    </div>
  );
}