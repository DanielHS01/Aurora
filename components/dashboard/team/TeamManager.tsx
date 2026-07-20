'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiX, FiUserX, FiUserCheck } from 'react-icons/fi';

import {
  inviteEmployeeAction,
  updateEmployeeRoleAction,
  deactivateEmployeeAction,
  reactivateEmployeeAction,
} from '@/lib/actions/business-users-actions';
import type { BusinessRole } from '@/lib/types';
import type { BusinessMember } from '@/lib/queries/business-users';

const ROLE_LABELS: Record<BusinessRole, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  manager: 'Gerente',
  waiter: 'Mesero',
  kitchen: 'Cocina',
  cashier: 'Cajero',
  viewer: 'Solo lectura',
  ai_agent: 'Agente IA',
};

const INVITABLE_ROLES: BusinessRole[] = [
  'admin',
  'manager',
  'waiter',
  'kitchen',
  'cashier',
  'viewer',
];

interface TeamManagerProps {
  businessId: string;
  members: BusinessMember[];
}

export default function TeamManager({ businessId, members }: TeamManagerProps) {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-[var(--brand-secondary)] transition hover:opacity-90"
        >
          <FiPlus size={16} />
          Invitar empleado
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/[0.02] text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <InviteModal businessId={businessId} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}

function MemberRow({ member }: { member: BusinessMember }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isOwner = member.role === 'owner';

  async function handleRoleChange(newRole: BusinessRole) {
    setLoading(true);
    try {
      await updateEmployeeRoleAction(member.user_id, newRole);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    setLoading(true);
    try {
      if (member.is_active) {
        await deactivateEmployeeAction(member.user_id);
      } else {
        await reactivateEmployeeAction(member.user_id);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className={!member.is_active ? 'opacity-40' : ''}>
      <td className="px-4 py-3">{member.profile?.full_name ?? '—'}</td>
      <td className="px-4 py-3 text-black/50">{member.profile?.email ?? '—'}</td>
      <td className="px-4 py-3">
        {isOwner ? (
          <span className="text-black/50">Dueño</span>
        ) : (
          <select
            value={member.role}
            onChange={(e) => handleRoleChange(e.target.value as BusinessRole)}
            disabled={loading}
            className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs"
          >
            {INVITABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {!isOwner && (
          <button
            onClick={handleToggleActive}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs text-black/60 hover:bg-black/5 disabled:opacity-50"
          >
            {member.is_active ? (
              <>
                <FiUserX size={13} /> Desactivar
              </>
            ) : (
              <>
                <FiUserCheck size={13} /> Reactivar
              </>
            )}
          </button>
        )}
      </td>
    </tr>
  );
}

function InviteModal({
  businessId,
  onClose,
}: {
  businessId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<BusinessRole>('waiter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim()) {
      setError('Nombre y correo son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('businessId', businessId);
      formData.set('fullName', fullName.trim());
      formData.set('email', email.trim());
      formData.set('role', role);

      await inviteEmployeeAction(formData);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Invitar empleado</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Invitación enviada a {email}.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <label className="block" htmlFor="inviteFullName">
              <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
                Nombre completo
              </span>
              <input
                id="inviteFullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
                className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
              />
            </label>

            <label className="block" htmlFor="inviteEmail">
              <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
                Correo
              </span>
              <input
                id="inviteEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
              />
            </label>

            <label className="block" htmlFor="inviteRole">
              <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
                Rol
              </span>
              <select
                id="inviteRole"
                value={role}
                onChange={(e) => setRole(e.target.value as BusinessRole)}
                className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
              >
                {INVITABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}