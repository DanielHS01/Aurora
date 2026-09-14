import { redirect } from "next/navigation";
import { getCurrentUserBusiness } from "@/lib/queries/businesses";
import { getCurrentUser } from "@/lib/auth/session";
import { getBusinessHours } from "@/lib/queries/businessHours";
import { getSubscriptionWithPlan } from "@/lib/queries/subscriptionBilling";
import AccountSettingsForm from "@/components/dashboard/account/AccountSettingsForm";
import PasswordSection from "@/components/dashboard/account/PasswordSection";
import BusinessHoursEditor from "@/components/dashboard/account/BusinessHoursEditor";

import { getPlansForBusinessType } from "@/lib/queries/subscriptionBilling";
import PlansCatalog from "@/components/dashboard/account/PlansCatalog";

export default async function AccountPage() {
  const [business, user] = await Promise.all([
    getCurrentUserBusiness(),
    getCurrentUser(),
  ]);

  if (!business || !user) {
    redirect("/login");
  }

  const [hours, subscription, plans] = await Promise.all([
    getBusinessHours(business.id),
    getSubscriptionWithPlan(business.id),
    getPlansForBusinessType(business.business_type),
  ]);
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
        <p className="mt-1 text-sm text-black/40">
          Administra la información de tu negocio y tu cuenta.
        </p>
      </div>

      <AccountSettingsForm business={business} loginEmail={user.email ?? ""} />

      {/* business.is_internal ya viene incluido en el objeto "business"
          que obtuviste arriba — es la misma fila de la tabla businesses,
          no un dato nuevo que haya que consultar aparte. */}
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-black/50">
          Plan y facturación
        </h2>
        <p className="mb-6 text-sm text-black/40">
          {business.is_internal
            ? "Cuenta interna de Aurora — sin facturación aplicable."
            : subscription?.status === "trial"
              ? `En prueba gratuita · ${subscription.daysLeft ?? 0} día(s) restante(s)`
              : subscription?.status === "active"
                ? "Al día"
                : "Pago pendiente"}
        </p>

        {!business.is_internal && (
          <PlansCatalog
            plans={plans}
            currentPlanId={subscription?.plan_id ?? null}
            pendingPlanId={subscription?.pending_plan_id ?? null}
            canPayNow={subscription?.canPayNow ?? true}
            currentPeriodEnd={subscription?.current_period_end ?? null}
          />
        )}
      </section>

      <BusinessHoursEditor initialHours={hours} />

      <PasswordSection />
    </div>
  );
}

export const dynamic = "force-dynamic";
