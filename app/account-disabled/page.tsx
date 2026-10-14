import { FiUserX } from 'react-icons/fi';
import { signOutAction } from '@/lib/actions/auth-actions';

export default function AccountDisabledPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFD] p-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
          <FiUserX size={22} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tu acceso fue desactivado
        </h1>
        <p className="mt-3 text-sm text-black/50">
          El administrador de tu negocio desactivó tu cuenta. Si crees que esto es un error,
          comunícate directamente con el dueño o administrador de tu negocio.
        </p>

        <form action={signOutAction} className="mt-6">
          <button type="submit" className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}