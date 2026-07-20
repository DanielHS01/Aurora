'use client'
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiLogOut, FiSettings, FiMenu, FiX } from 'react-icons/fi';

import { signOutAction } from '@/lib/actions/auth-actions';

interface SidebarProps {
  businessName: string;
  logoUrl: string | null;
  businessType: string | null;
  userRole: string | null;
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
  userRole,
}: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const baseMenuItems =
    (businessType && MENU_BY_TYPE[businessType]) || DEFAULT_MENU;

  const canManageTeam = userRole === 'owner' || userRole === 'admin';
  const menuItems = canManageTeam
    ? [...baseMenuItems, { name: 'Equipo', path: '/dashboard/team' }]
    : baseMenuItems;

  return (
    <>
      {/* Barra superior — solo visible en móvil */}
      <header className="flex h-16 items-center justify-between border-b border-black/10 px-4 md:hidden">
        <div className="flex items-center gap-2">
          <BusinessBadge
            businessName={businessName}
            logoUrl={logoUrl}
            size={30}
          />
          <span className="truncate text-sm font-semibold">
            {businessName}
          </span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-black/60 hover:bg-black/5"
        >
          <FiMenu size={22} />
        </button>
      </header>

      {/* Overlay + drawer — solo en móvil, cuando está abierto */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <aside
            className="flex h-full w-72 max-w-[80vw] flex-col bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BusinessBadge
                  businessName={businessName}
                  logoUrl={logoUrl}
                  size={36}
                />
                <span className="truncate font-semibold">{businessName}</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                aria-label="Cerrar menú"
                className="text-black/40 hover:text-black"
              >
                <FiX size={20} />
              </button>
            </div>

            <NavList
              menuItems={menuItems}
              pathname={pathname}
              onItemClick={() => setIsMobileOpen(false)}
            />
            <AccountBlock />
          </aside>
        </div>
      )}

      {/* Sidebar fijo — solo en desktop */}
      <aside className="hidden h-full w-64 flex-col border-r border-black/10 p-6 md:flex">
        <div className="mb-10 flex items-center gap-3">
          <BusinessBadge businessName={businessName} logoUrl={logoUrl} size={36} />
          <span className="truncate font-semibold">{businessName}</span>
        </div>

        <NavList menuItems={menuItems} pathname={pathname} />
        <AccountBlock />
      </aside>
    </>
  );
}

function BusinessBadge({
  businessName,
  logoUrl,
  size,
}: {
  businessName: string;
  logoUrl: string | null;
  size: number;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={businessName}
        width={size}
        height={size}
        className="rounded-lg object-cover"
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-lg text-sm font-bold text-white"
      style={{
        backgroundColor: 'var(--brand-primary)',
        width: size,
        height: size,
      }}
    >
      {businessName.charAt(0).toUpperCase()}
    </div>
  );
}

function NavList({
  menuItems,
  pathname,
  onItemClick,
}: {
  menuItems: { name: string; path: string }[];
  pathname: string;
  onItemClick?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-2">
      {menuItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            onClick={onItemClick}
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
  );
}

function AccountBlock() {
  return (
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
  );
}