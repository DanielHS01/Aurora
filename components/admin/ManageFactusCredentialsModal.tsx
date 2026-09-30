'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX } from 'react-icons/fi';

import { saveFactusCredentialsAdminAction } from '@/lib/actions/platformAdminActions';

interface ManageFactusCredentialsModalProps {
  businessId: string;
  businessName: string;
  onClose: () => void;
}

export default function ManageFactusCredentialsModal({
  businessId,
  businessName,
  onClose,
}: ManageFactusCredentialsModalProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [numberingRangeId, setNumberingRangeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('username', username);
      formData.set('password', password);
      formData.set('clientId', clientId);
      formData.set('clientSecret', clientSecret);
      if (numberingRangeId) formData.set('numberingRangeId', numberingRangeId);

      await saveFactusCredentialsAdminAction(businessId, formData);
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
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Facturación electrónica</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <FiX size={20} />
          </button>
        </div>
        <p className="mb-5 text-sm text-black/40">{businessName}</p>

        {success ? (
          <>
            <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-emerald-700">
              Credenciales guardadas y cifradas correctamente. El negocio ya
              puede facturar electrónicamente.
            </div>
            <button
              onClick={onClose}
              className="h-11 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)]"
            >
              Listo
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <p className="text-xs text-black/40">
              Pega aquí exactamente las credenciales que envía Factus por
              correo tras completar la activación del negocio.
            </p>

            <label className="block" htmlFor="factusUsername">
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-black/40">
                Usuario / correo
              </span>
              <input
                id="factusUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-3 text-sm outline-none focus:border-black/30"
              />
            </label>

            <label className="block" htmlFor="factusPassword">
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-black/40">
                Contraseña
              </span>
              <input
                id="factusPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-3 text-sm outline-none focus:border-black/30"
              />
            </label>

            <label className="block" htmlFor="factusClientId">
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-black/40">
                Client ID
              </span>
              <input
                id="factusClientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-3 text-sm outline-none focus:border-black/30"
              />
            </label>

            <label className="block" htmlFor="factusClientSecret">
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-black/40">
                Client Secret
              </span>
              <input
                id="factusClientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-3 text-sm outline-none focus:border-black/30"
              />
            </label>

            <label className="block" htmlFor="factusNumberingRangeId">
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-black/40">
                ID de rango de numeración (opcional)
              </span>
              <input
                id="factusNumberingRangeId"
                type="number"
                value={numberingRangeId}
                onChange={(e) => setNumberingRangeId(e.target.value)}
                placeholder="Ej: 389 — consulta con GET /v2/numbering-ranges"
                className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-3 text-sm outline-none focus:border-black/30"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar credenciales'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}