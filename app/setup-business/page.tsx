import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import SetupBusinessForm from '@/components/auth/SetupBusinessForm';

export default async function SetupBusinessPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Si por alguna razón ya tiene negocio (ej. llegó aquí por error, o
  // ya se resolvió en otro intento), no debe quedarse atascado aquí.
  const business = await getCurrentUserBusiness();
  if (business) redirect('/dashboard');

  const meta = user.user_metadata ?? {};
  const initialName = (meta.pending_business_name as string) ?? '';
  const initialType = (meta.pending_business_type as string) ?? '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFDFD] p-4">
      <SetupBusinessForm initialName={initialName} initialType={initialType} />
    </div>
  );
}

export const dynamic = 'force-dynamic';