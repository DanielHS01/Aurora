import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getChannelsForBusiness } from '@/lib/queries/aiChannels';
import ConnectChannelForm from '@/components/dashboard/ai/ConnectChannelForm';

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Llamadas',
  web_chat: 'Chat web',
};

export default async function AiChannelsPage() {
  const business = await getCurrentUserBusiness();
  if (!business) return null;

  const channels = await getChannelsForBusiness(business.id);

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Canales de IA</h1>
        <p className="mt-1 text-sm text-black/40">
          Conecta WhatsApp, llamadas o chat web para que la IA atienda a tus clientes.
        </p>
      </header>

      <div className="mb-8 space-y-3">
        {channels.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/10 bg-gray-50/50 p-6 text-center text-sm text-black/40">
            Aún no tienes ningún canal conectado.
          </p>
        ) : (
          channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between rounded-xl border border-black/10 p-4"
            >
              <div>
                <p className="text-sm font-medium">
                  {CHANNEL_LABELS[channel.channel_type] ?? channel.channel_type}
                </p>
                <p className="text-xs text-black/40">
                  {channel.external_identifier}
                  {channel.is_sandbox && ' · Sandbox'}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Activo
              </span>
            </div>
          ))
        )}
      </div>

      <ConnectChannelForm businessId={business.id} />
    </div>
  );
}

export const dynamic = 'force-dynamic';