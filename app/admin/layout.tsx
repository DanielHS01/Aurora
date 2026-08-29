import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUsers, FiTool } from 'react-icons/fi';
import { isPlatformAdmin } from '@/lib/auth/platform';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await isPlatformAdmin();

  if (!isAdmin) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <header className="border-b border-black/10 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black"
            >
              <FiArrowLeft size={15} />
              Volver al dashboard
            </Link>
            <span className="h-4 w-px bg-black/10" />
            <span className="text-sm font-medium uppercase tracking-widest text-black/40">
              Panel de Aurora
            </span>
          </div>
          <nav className="flex gap-1">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-black/70 hover:bg-black/5"
            >
              <FiUsers size={14} />
              Negocios
            </Link>
            <Link
              href="/admin/maintenance"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-black/70 hover:bg-black/5"
            >
              <FiTool size={14} />
              Mantenimiento
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}