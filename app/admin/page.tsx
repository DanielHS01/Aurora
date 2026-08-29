import { getAllBusinessesOverview } from '@/lib/queries/platformAdmin';

const STATUS_LABEL: Record<string, string> = {
  trial: 'Prueba',
  active: 'Al día',
  past_due: 'En mora',
  cancelled: 'Cancelado',
  expired: 'Expirado',
};

const STATUS_CLASS: Record<string, string> = {
  trial: 'bg-blue-50 text-blue-700',
  active: 'bg-emerald-50 text-emerald-700',
  past_due: 'bg-red-50 text-red-600',
  cancelled: 'bg-black/5 text-black/40',
  expired: 'bg-black/5 text-black/40',
};

export default async function AdminBusinessesPage() {
  const businesses = await getAllBusinessesOverview();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Negocios ({businesses.length})</h1>

      <div className="overflow-hidden rounded-2xl border border-black/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="px-4 py-3">Negocio</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado cuenta</th>
              <th className="px-4 py-3">Suscripción</th>
              <th className="px-4 py-3">Próximo cobro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {businesses.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3 text-black/50 capitalize">
                  {b.business_type ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      b.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {b.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      STATUS_CLASS[b.subscriptionStatus ?? ''] ?? 'bg-black/5 text-black/40'
                    }`}
                  >
                    {STATUS_LABEL[b.subscriptionStatus ?? ''] ?? 'Sin plan'}
                  </span>
                </td>
                <td className="px-4 py-3 text-black/50">
                  {b.daysUntilRenewal === null
                    ? '—'
                    : b.daysUntilRenewal < 0
                    ? `Vencido hace ${Math.abs(b.daysUntilRenewal)} días`
                    : `En ${b.daysUntilRenewal} días`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';