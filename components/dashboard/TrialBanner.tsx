import Link from 'next/link';

export default function TrialBanner({
  status,
  daysLeft,
}: {
  status: string | null;
  daysLeft: number | null;
}) {
  if (status !== 'trial' || daysLeft === null || daysLeft < 0) return null;

  const urgency = daysLeft > 1 ? 'low' : daysLeft === 1 ? 'medium' : 'high';

  const styles = {
    low: 'border-blue-200 bg-blue-50 text-blue-700',
    medium: 'border-orange-200 bg-orange-50 text-orange-700',
    high: 'border-red-200 bg-red-50 text-red-700',
  }[urgency];

  return (
    <div className={`border-b px-4 py-2.5 text-center text-sm ${styles}`}>
      {daysLeft > 0 ? (
        <>
          🎁 Te quedan <strong>{daysLeft} día{daysLeft !== 1 ? 's' : ''}</strong> de prueba gratuita.{' '}
          <Link href="/dashboard/account" className="underline">
            Activar plan de pago
          </Link>
        </>
      ) : (
        <>
          Hoy es tu último día de prueba — se bloqueará a medianoche.{' '}
          <Link href="/dashboard/account" className="font-medium underline">
            Paga ahora para no perder acceso
          </Link>
        </>
      )}
    </div>
  );
}