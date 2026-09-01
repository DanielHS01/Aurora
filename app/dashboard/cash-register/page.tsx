import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getOpenCashSession, getCashSessionSummary, getCashSessionHistory } from '@/lib/queries/cashRegister';
import CashRegisterManager from '@/components/dashboard/cash-register/CashRegisterManager';

export default async function CashRegisterPage() {
  const business = await getCurrentUserBusiness();
  if (!business) return null;

  const openSession = await getOpenCashSession(business.id);
  const [summary, history] = await Promise.all([
    openSession ? getCashSessionSummary(openSession.id) : null,
    getCashSessionHistory(business.id, 20),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Caja</h1>
        <p className="mt-1 text-sm text-black/40">
          Apertura, cierre y cuadre de caja por turno.
        </p>
      </header>

      <CashRegisterManager
        businessId={business.id}
        openSummary={summary}
        history={history}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';