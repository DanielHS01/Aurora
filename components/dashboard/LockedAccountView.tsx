'use client'

import Link from 'next/link';
import { FiLock } from 'react-icons/fi';

import { signOutAction } from '@/lib/actions/auth-actions';

export default function LockedAccountView({
  businessName,
  isOwner,
}: {
  businessName: string;
  isOwner: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFD] p-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
          <FiLock size={22} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {businessName} está bloqueado
        </h1>
        <p className="mt-3 text-sm text-black/50">
          {isOwner
            ? 'Tu periodo de prueba o pago venció. Activa tu plan para seguir usando Aurora.'
            : 'El acceso de este negocio está pausado. Contacta al dueño para reactivarlo.'}
        </p>

        {isOwner && (
          <Link
            href="/dashboard/account"
            className="mt-6 inline-block rounded-xl bg-black px-6 py-3 text-sm font-medium text-white"
          >
            Ir a pagar
          </Link>
        )}

        <form action={signOutAction} className="mt-4">
          <button type="submit" className="text-xs text-black/40 underline">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}