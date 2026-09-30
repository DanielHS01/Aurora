import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getFullMenu } from '@/lib/queries/menu';
import { getFactusActivationStatus } from '@/lib/queries/factusCredentials';
import MenuManager from '@/components/dashboard/restaurant/menu/MenuManager';

export default async function MenuPage() {
  const business = await getCurrentUserBusiness();
  if (!business) return null;

  const [categories, factusStatus] = await Promise.all([
    getFullMenu(business.id),
    getFactusActivationStatus(business.id),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Menú</h1>
        <p className="mt-1 text-sm text-black/40">
          Administra categorías, productos y sus opciones.
        </p>
      </header>

      <MenuManager
        businessId={business.id}
        categories={categories}
        isFactusActive={factusStatus === 'active'}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';