'use client';

import { useState } from 'react';
import ManageFactusCredentialsModal from './ManageFactusCredentialsModal';

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

const FACTUS_LABEL: Record<string, string> = {
  pending_activation: 'Pendiente',
  active: 'Activa',
  suspended: 'Suspendida',
};

const FACTUS_CLASS: Record<string, string> = {
  pending_activation: 'bg-amber-50 text-amber-700',
  active: 'bg-emerald-50 text-emerald-700',
  suspended: 'bg-red-50 text-red-600',
};

type BusinessRow = {
  id: string;
  name: string;
  business_type: string | null;
  is_active: boolean;
  subscriptionStatus: string | null;
  daysUntilRenewal: number | null;
};

interface AdminBusinessesTableProps {
  businesses: BusinessRow[];
  factusStatusMap: Record<string, string>;
}

export default function AdminBusinessesTable({
  businesses,
  factusStatusMap,
}: AdminBusinessesTableProps) {
  const [managingFactusFor, setManagingFactusFor] = useState<BusinessRow | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-black/10">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="px-4 py-3">Negocio</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado cuenta</th>
              <th className="px-4 py-3">Suscripción</th>
              <th className="px-4 py-3">Próximo cobro</th>
              <th className="px-4 py-3">Facturación</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {businesses.map((b) => {
              const factusStatus = factusStatusMap[b.id];
              return (
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
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        FACTUS_CLASS[factusStatus] ?? 'bg-black/5 text-black/40'
                      }`}
                    >
                      {FACTUS_LABEL[factusStatus] ?? 'Sin activar'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setManagingFactusFor(b)}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-black/70 hover:bg-black/5"
                    >
                      Gestionar Factus
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {managingFactusFor && (
        <ManageFactusCredentialsModal
          businessId={managingFactusFor.id}
          businessName={managingFactusFor.name}
          onClose={() => setManagingFactusFor(null)}
        />
      )}
    </>
  );
}