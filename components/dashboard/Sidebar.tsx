'use client'
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiLogOut, FiSettings } from 'react-icons/fi';

import { signOutAction } from '@/lib/actions/auth-actions';

interface SidebarProps {
  businessName: string;
  logoUrl: string | null;
  businessType: string | null;
}

const MENU_BY_TYPE: Record<string, { name: string; path: string }[]> = {
  restaurant: [
    { name: 'Panel', path: '/dashboard' },
    { name: 'Mesas', path: '/dashboard/tables' },
    { name: 'Cocina / Pedidos', path: '/dashboard/kitchen' },
    { name: 'Menú', path: '/dashboard/menu' },
    { name: 'Reservas', path: '/dashboard/reservations' },
    { name: 'Reportes', path: '/dashboard/reports' },
  ],
  'barber shop': [
    { name: 'Panel', path: '/dashboard' },
    { name: 'Citas', path: '/dashboard/appointments' },
    { name: 'Servicios', path: '/dashboard/services' },
    { name: 'Reportes', path: '/dashboard/reports' },
  ],
  optical: [
    { name: 'Panel', path: '/dashboard' },
    { name: 'Citas', path: '/dashboard/appointments' },
    { name: 'Inventario', path: '/dashboard/inventory' },
    { name: 'Reportes', path: '/dashboard/reports' },
  ],
  hotel: [
    { name: 'Panel', path: '/dashboard' },
    { name: 'Reservas', path: '/dashboard/reservations' },
    { name: 'Habitaciones', path: '/dashboard/rooms' },
    { name: 'Reportes', path: '/dashboard/reports' },
  ],
};

const DEFAULT_MENU = [{ name: 'Panel', path: '/dashboard' }];

export default function Sidebar({
  businessName,
  logoUrl,
  businessType,
}: SidebarProps) {
  const pathname = usePathname();
  const menuItems =
    (businessType && MENU_BY_TYPE[businessType]) || DEFAULT_MENU;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-black/10 p-6">
      <div className="mb-10 flex items-center gap-3">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={businessName}
            width={36}
            height={36}
            className="rounded-lg object-cover"
          />
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            {businessName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="truncate font-semibold">{businessName}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="px-4 py-2 rounded-xl transition-colors hover:bg-black/5"
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--brand-primary)',
                      color: 'var(--brand-secondary)',
                    }
                  : undefined
              }
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Cuenta y cierre de sesión — separados del menú operativo */}
      <div className="mt-auto flex flex-col gap-1 border-t border-black/10 pt-4">
        <Link
          href="/dashboard/account"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-black/60 transition-colors hover:bg-black/5"
        >
          <FiSettings size={16} />
          Mi cuenta
        </Link>

        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 px-4 py-2 rounded-xl text-sm text-black/60 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <FiLogOut size={16} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}