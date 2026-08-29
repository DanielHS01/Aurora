'use client'

import Link from 'next/link';
import { FiSettings, FiLogOut } from 'react-icons/fi';

import { signOutAction } from '@/lib/actions/auth-actions';
import NotificationBell from './NotificationBell';

type Notification = {
  id: string;
  title: string;
  message: string;
  created_at: string | null;
};

export default function DashboardHeader({
  notifications,
}: {
  notifications: Notification[];
}) {
  return (
    <header className="flex h-16 items-center justify-end gap-2 border-b border-black/10 px-4 md:px-8">
      <NotificationBell notifications={notifications} />

      <Link
        href="/dashboard/account"
        aria-label="Configuración"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-black/60 hover:bg-black/5"
      >
        <FiSettings size={18} />
      </Link>

      <form action={signOutAction}>
        <button
          type="submit"
          aria-label="Cerrar sesión"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-black/60 hover:bg-red-50 hover:text-red-600"
        >
          <FiLogOut size={18} />
        </button>
      </form>
    </header>
  );
}