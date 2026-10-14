// components/dashboard/GracePeriodBanner.tsx (nuevo)
import Link from "next/link";

export default function GracePeriodBanner({
  graceDaysLeft,
}: {
  graceDaysLeft: number | null;
}) {
  if (graceDaysLeft === null || graceDaysLeft < 0) return null;

  return (
    <div className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">
      ⚠️ Tu pago está atrasado — tienes{" "}
      <strong>
        {graceDaysLeft} día{graceDaysLeft !== 1 ? "s" : ""}
      </strong>{" "}
      antes del bloqueo.{" "}
      <Link href="/dashboard/account" className="font-medium underline">
        Paga ahora
      </Link>
    </div>
  );
}
