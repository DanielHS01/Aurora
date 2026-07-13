'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: 'Panel', path: '/dashboard' },
  { name: 'Cocina / Pedidos', path: '/dashboard/cocina' },
  { name: 'Menú', path: '/dashboard/menu' },
  { name: 'Reservas', path: '/dashboard/reservas' },
  { name: 'Reportes', path: '/dashboard/reportes' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-black/10 p-6 flex flex-col">
      <div className="mb-10 text-xl font-bold">Aurora AI</div>
      
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link 
            key={item.path}
            href={item.path}
            className={`px-4 py-2 rounded-xl transition-colors ${
              pathname === item.path ? 'bg-black text-white' : 'hover:bg-black/5'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}