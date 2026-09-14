'use client'

import { useState } from 'react';
import { FiCheck, FiClock, FiX } from 'react-icons/fi';

import {
  initiateManualPaymentAction,
  schedulePlanChangeAction,
  cancelPendingPlanChangeAction,
} from '@/lib/actions/subscriptionBillingActions';

type Plan = {
  id: string;
  name: string;
  price_monthly: number | null;
  price_annual: number | null;
  max_users: number | null;
  max_orders: number | null;
  allow_ai: boolean | null;
};

export default function PlansCatalog({
  plans,
  currentPlanId,
  pendingPlanId,
  canPayNow,
  currentPeriodEnd,
}: {
  plans: Plan[];
  currentPlanId: string | null;
  pendingPlanId: string | null;
  canPayNow: boolean;
  currentPeriodEnd: string | null;
}) {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const cutoffLabel = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
    : '';

  async function handlePayOrRenew(planId: string) {
    setError('');
    setLoadingPlanId(planId);
    try {
      const { paymentLinkUrl } = await initiateManualPaymentAction(period, planId);
      window.location.assign(paymentLinkUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
      setLoadingPlanId(null);
    }
  }

  async function handleSchedule(planId: string) {
    setError('');
    setLoadingPlanId(planId);
    try {
      await schedulePlanChangeAction(planId, period);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoadingPlanId(null);
    }
  }

  async function handleCancelPending() {
    setError('');
    setLoadingPlanId('cancel');
    try {
      await cancelPendingPlanChangeAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoadingPlanId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-xl border border-black/10 bg-black/[0.02] p-1">
          <button
            onClick={() => setPeriod('monthly')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              period === 'monthly' ? 'bg-white shadow-sm' : 'text-black/50'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setPeriod('annual')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              period === 'annual' ? 'bg-white shadow-sm' : 'text-black/50'
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {pendingPlanId && pendingPlanId !== currentPlanId && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span className="flex items-center gap-2">
            <FiClock size={14} />
            Tienes un cambio de plan programado para el {cutoffLabel}
          </span>
          <button
            onClick={handleCancelPending}
            disabled={loadingPlanId === 'cancel'}
            className="flex items-center gap-1 text-xs underline"
          >
            <FiX size={12} />
            Cancelar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = period === 'annual' ? plan.price_annual : plan.price_monthly;
          const isCurrent = plan.id === currentPlanId;
          const isPending = plan.id === pendingPlanId;
          const isLoading = loadingPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-5 ${
                isCurrent ? 'border-black bg-black/[0.02]' : isPending ? 'border-blue-300 bg-blue-50/50' : 'border-black/10 bg-white'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <h3 className="font-medium">{plan.name}</h3>
                {isCurrent && (
                  <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-medium text-white">ACTUAL</span>
                )}
                {isPending && !isCurrent && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">PROGRAMADO</span>
                )}
              </div>

              <p className="mt-2 text-2xl font-semibold">
                ${(price ?? 0).toLocaleString('es-CO')}
                <span className="text-sm font-normal text-black/40">
                  /{period === 'annual' ? 'año' : 'mes'}
                </span>
              </p>

              <ul className="mt-4 space-y-1.5 text-xs text-black/60">
                {plan.max_users && (
                  <li className="flex items-center gap-1.5">
                    <FiCheck size={12} className="text-emerald-600" />
                    Hasta {plan.max_users} usuarios
                  </li>
                )}
                {plan.max_orders && (
                  <li className="flex items-center gap-1.5">
                    <FiCheck size={12} className="text-emerald-600" />
                    Hasta {plan.max_orders} pedidos/mes
                  </li>
                )}
                {plan.allow_ai && (
                  <li className="flex items-center gap-1.5">
                    <FiCheck size={12} className="text-emerald-600" />
                    Agente de IA incluido
                  </li>
                )}
              </ul>

              {/* Lógica de botón — canPayNow tiene prioridad sobre isPending:
                  un plan programado que ya entró en ventana de pago debe
                  poder pagarse directamente, no quedar atascado en el
                  estado estático "Programado ✓". */}
              {isCurrent && !canPayNow ? (
                <div className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-black/5 text-sm text-black/40">
                  Plan actual
                </div>
              ) : canPayNow ? (
                <button
                  onClick={() => handlePayOrRenew(plan.id)}
                  disabled={loadingPlanId !== null}
                  className="mt-5 h-11 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
                >
                  {isLoading
                    ? 'Redirigiendo...'
                    : isPending
                    ? 'Confirmar y pagar'
                    : isCurrent
                    ? 'Renovar'
                    : 'Cambiar y pagar'}
                </button>
              ) : isPending ? (
                <div className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-blue-100 text-sm text-blue-700">
                  Programado ✓
                </div>
              ) : (
                <button
                  onClick={() => handleSchedule(plan.id)}
                  disabled={loadingPlanId !== null}
                  className="mt-5 h-11 w-full rounded-xl border border-black/10 text-sm font-medium text-black/70 hover:bg-black/5 disabled:opacity-60"
                >
                  {isLoading ? 'Programando...' : `Programar para el ${cutoffLabel}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}