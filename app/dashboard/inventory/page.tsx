import { redirect } from 'next/navigation';
import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getCurrentUserRole } from '@/lib/queries/business-users';
import { getFullMenu } from '@/lib/queries/menu';
import { getInventoryItems, getProductComponents } from '@/lib/queries/inventory';
import InventoryManager from '@/components/dashboard/inventory/InventoryManager';

// Cuando otro tipo de negocio tenga su inventario, se agrega aquí
const INVENTORY_ENABLED_TYPES = ['restaurant'];

export default async function InventoryPage() {
  const business = await getCurrentUserBusiness();
  if (!business) return null;

  if (!INVENTORY_ENABLED_TYPES.includes(business.business_type ?? '')) {
    return (
      <p className="text-sm text-black/50">
        El inventario para este tipo de negocio estará disponible próximamente.
      </p>
    );
  }

  const role = await getCurrentUserRole(business.id);
  if (!role || !['owner', 'admin', 'manager'].includes(role)) {
    redirect('/dashboard');
  }

  const [items, menu, components] = await Promise.all([
    getInventoryItems(business.id),
    getFullMenu(business.id),
    getProductComponents(business.id),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Inventario</h1>
        <p className="mt-1 text-sm text-black/40">
          Insumos, existencias y recetas de tus platos.
        </p>
      </header>

      <InventoryManager
        businessId={business.id}
        initialItems={items}
        categories={menu}
        components={components}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';