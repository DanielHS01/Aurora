'use client'

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiCheckCircle, FiCreditCard } from 'react-icons/fi';

import { checkoutOrderAction } from '@/lib/actions/payment-actions';
import type { PaymentMethod } from '@/lib/types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'online', label: 'Pago en línea' },
];

interface CheckoutModalProps {
  businessId: string;
  orderId: string;
  tableId: string | null;
  total: number;
  onClose: () => void;
}

export default function CheckoutModal({
  businessId,
  orderId,
  tableId,
  total,
  onClose,
}: CheckoutModalProps) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);

  const cashReceivedNumber = Number(cashReceived) || 0;
  const change = useMemo(
    () => Math.max(cashReceivedNumber - total, 0),
    [cashReceivedNumber, total]
  );
  const isCashInsufficient =
    method === 'cash' && cashReceived !== '' && cashReceivedNumber < total;

  async function handleConfirm() {
    setError('');

    if (method === 'cash' && cashReceivedNumber < total) {
      setError('El monto recibido es menor al total a cobrar.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('amount', String(total));
      formData.set('method', method);

      const { invoice } = await checkoutOrderAction(
        businessId,
        orderId,
        tableId,
        formData
      );

      setInvoiceNumber(invoice.invoice_number ?? invoice.id);
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
      onClick={invoiceNumber ? onClose : undefined}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {invoiceNumber ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <FiCheckCircle size={22} />
            </div>
            <h3 className="text-lg font-semibold">Pago registrado</h3>
            <p className="mt-2 text-sm text-black/50">
              Factura #{invoiceNumber} generada. La mesa quedó libre.
            </p>
            <button
              onClick={onClose}
              className="mt-6 h-11 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)]"
            >
              Listo
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cobrar pedido</h3>
              <button onClick={onClose} className="text-black/40 hover:text-black">
                <FiX size={20} />
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <div className="mb-5 rounded-xl bg-black/[0.03] p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-black/40">
                Total a cobrar
              </p>
              <p className="mt-1 text-2xl font-semibold">
                ${total.toLocaleString('es-CO')}
              </p>
            </div>

            <p className="mb-2 text-xs uppercase tracking-wide text-black/40">
              Método de pago
            </p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => {
                    setMethod(m.value);
                    setCashReceived('');
                    setError('');
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                    method === m.value
                      ? 'border-black bg-black text-white'
                      : 'border-black/10 hover:border-black/30'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {method === 'cash' && (
              <div className="mb-6 space-y-2">
                <label className="block" htmlFor="cashReceived">
                  <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
                    Monto recibido
                  </span>
                  <input
                    id="cashReceived"
                    type="number"
                    min={0}
                    step="100"
                    autoFocus
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder={total.toString()}
                    className={`h-12 w-full rounded-xl border bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30 ${
                      isCashInsufficient ? 'border-red-300' : 'border-black/10'
                    }`}
                  />
                </label>

                {cashReceived !== '' && (
                  <div
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
                      isCashInsufficient
                        ? 'bg-red-50 text-red-600'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <span>
                      {isCashInsufficient ? 'Falta' : 'Cambio a devolver'}
                    </span>
                    <span className="text-lg font-semibold">
                      $
                      {isCashInsufficient
                        ? (total - cashReceivedNumber).toLocaleString('es-CO')
                        : change.toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={loading || isCashInsufficient}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
            >
              <FiCreditCard size={15} />
              {loading ? 'Procesando...' : 'Confirmar pago'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}