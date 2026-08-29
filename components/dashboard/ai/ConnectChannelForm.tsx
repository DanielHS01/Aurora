'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { connectAiChannelAction } from '@/lib/actions/aiChannelActions';

type ChannelType = 'whatsapp' | 'call' | 'web_chat';

const CHANNEL_LABELS: Record<ChannelType, string> = {
  whatsapp: 'WhatsApp',
  call: 'Llamadas',
  web_chat: 'Chat web',
};

export default function ConnectChannelForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [channelType, setChannelType] = useState<ChannelType>('whatsapp');
  const [externalIdentifier, setExternalIdentifier] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [agentId, setAgentId] = useState('');
  const [isSandbox, setIsSandbox] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isVoice = channelType === 'call';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!externalIdentifier.trim() || !apiKey.trim()) {
      setError('Completa los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('businessId', businessId);
      formData.set('channelType', channelType);
      formData.set('externalIdentifier', externalIdentifier.trim());
      formData.set('apiKey', apiKey.trim());
      if (agentId.trim()) formData.set('agentId', agentId.trim());
      formData.set('isSandbox', String(isSandbox));

      await connectAiChannelAction(formData);
      setSuccess(true);
      setExternalIdentifier('');
      setApiKey('');
      setAgentId('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-black/50">
        Conectar canal
      </h2>
      <p className="mb-5 text-sm text-black/40">
        Elige el canal y pega las credenciales del proveedor correspondiente.
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Canal conectado correctamente.
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-2">
        {(Object.keys(CHANNEL_LABELS) as ChannelType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setChannelType(type)}
            disabled={type === 'web_chat'}
            title={type === 'web_chat' ? 'Disponible próximamente' : undefined}
            className={`rounded-xl border px-3 py-2.5 text-sm transition ${
              channelType === type
                ? 'border-black bg-black text-white'
                : 'border-black/10 hover:border-black/30'
            } ${type === 'web_chat' ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            {CHANNEL_LABELS[type]}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label className="block" htmlFor="externalIdentifier">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            {isVoice ? 'Número de teléfono' : 'Phone Number ID'}
          </span>
          <input
            id="externalIdentifier"
            value={externalIdentifier}
            onChange={(e) => setExternalIdentifier(e.target.value)}
            placeholder={isVoice ? 'Ej: +573001234567' : 'Ej: 851682941371819'}
            className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
          />
        </label>

        {isVoice && (
          <label className="block" htmlFor="agentId">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Agent ID (Retell)
            </span>
            <input
              id="agentId"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="El ID del agente configurado en Retell"
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>
        )}

        <label className="block" htmlFor="apiKey">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            API Key
          </span>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Tu API key de ${isVoice ? 'Retell' : '360dialog'}`}
            className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-black/60">
          <input
            type="checkbox"
            checked={isSandbox}
            onChange={(e) => setIsSandbox(e.target.checked)}
          />
          Es un canal de prueba (sandbox)
        </label>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
        >
          {loading ? 'Conectando...' : 'Conectar canal'}
        </button>
      </form>
    </div>
  );
}