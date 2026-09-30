'use client'

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiX,
  FiCheckCircle,
  FiCreditCard,
  FiPrinter,
  FiSmartphone,
  FiExternalLink,
} from 'react-icons/fi';

import { checkoutOrderAction } from '@/lib/actions/payment-actions';
import type { PaymentMethod } from '@/lib/types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'online', label: 'Pago en línea' },
];

const TRANSFER_PROVIDERS = [
  { value: 'nequi', label: 'Nequi' },
  { value: 'daviplata', label: 'Daviplata' },
  { value: 'bre_b', label: 'Bre-B' },
  { value: 'other', label: 'Otra' },
] as const;

type TransferProvider = (typeof TRANSFER_PROVIDERS)[number]['value'];

const DOCUMENT_TYPES = [
  { value: '13', label: 'Cédula de ciudadanía' },
  { value: '31', label: 'NIT' },
  { value: '22', label: 'Cédula de extranjería' },
] as const;

interface CheckoutModalProps {
  businessId: string;
  orderId: string;
  tableId: string | null;
  total: number;
  onPaymentSuccess?: () => void;
  onClose: () => void;
}

export default function CheckoutModal({
  businessId,
  orderId,
  tableId,
  total,
  onPaymentSuccess,
  onClose,
}: CheckoutModalProps) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [transferProvider, setTransferProvider] = useState<TransferProvider | null>(null);
  const [cashReceived, setCashReceived] = useState('');
  const [wantsIdentifiedInvoice, setWantsIdentifiedInvoice] = useState(false);
  const [docType, setDocType] = useState<string>('13');
  const [docNumber, setDocNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [dianReceipt, setDianReceipt] = useState<{
    cufe: string;
    number: string;
    publicUrl: string;
  } | null>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const cashReceivedNumber = Number(cashReceived) || 0;
  const change = useMemo(
    () => Math.max(cashReceivedNumber - total, 0),
    [cashReceivedNumber, total]
  );
  const isCashInsufficient =
    method === 'cash' && cashReceived !== '' && cashReceivedNumber < total;
  const isTransferMissingProvider = method === 'transfer' && !transferProvider;

  function triggerPrint(id: string) {
    // Se carga el PDF en un iframe invisible y se dispara la impresión
    // automáticamente — el usuario nunca ve un diálogo de "guardar
    // archivo", solo el diálogo nativo de impresión del navegador.
    if (printFrameRef.current) {
      printFrameRef.current.src = `/api/invoices/${id}/pdf`;
    }
  }

  function handleSelectMethod(value: PaymentMethod) {
    setMethod(value);
    setCashReceived('');
    setTransferProvider(null);
    setError('');
  }

  async function handleConfirm() {
    setError('');

    if (method === 'cash' && cashReceivedNumber < total) {
      setError('El monto recibido es menor al total a cobrar.');
      return;
    }
    if (isTransferMissingProvider) {
      setError('Selecciona por cuál medio llegó la transferencia.');
      return;
    }
    if (wantsIdentifiedInvoice && (!docNumber.trim() || !customerName.trim())) {
      setError('Completa el número de identificación y el nombre del cliente.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData()
      formData.set('amount', String(total));
      formData.set('method', method);
      if (transferProvider) {
        formData.set('provider', transferProvider);
      }
      if (wantsIdentifiedInvoice) {
        formData.set('customerDocType', docType);
        formData.set('customerDocNumber', docNumber.trim());
        formData.set('customerName', customerName.trim());
      }

      const result = await checkoutOrderAction(businessId, orderId, tableId, formData)

      const number = result.invoice.invoice_number ?? result.invoice.id;
      setInvoiceId(result.invoice.id);
      setInvoiceNumber(number);

      if (result.factus) {
        // El documento válido es el de Factus — no se imprime el
        // comprobante local (sería mostrar el documento equivocado,
        // sin validez fiscal, además en el tamaño de página que no es).
        setDianReceipt(result.factus);
      } else {
        triggerPrint(result.invoice.id);
      }

      onPaymentSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setLoading(false);
    }
  }

  const paymentCompleted = invoiceNumber !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={paymentCompleted ? onClose : undefined}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {paymentCompleted ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <FiCheckCircle size={22} />
            </div>
            <h3 className="text-lg font-semibold">Pago registrado</h3>

            {dianReceipt ? (
              <>
                <p className="mt-2 text-sm text-black/50">
                  Factura electrónica <span className="font-medium">{dianReceipt.number}</span>{' '}
                  generada ante la DIAN. La mesa quedó libre.
                </p>
                <a
                  href={dianReceipt.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-medium text-black/70 hover:bg-black/5"
                >
                  <FiExternalLink size={14} />
                  Ver / imprimir factura DIAN
                </a>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-black/50">
                  Factura #{invoiceNumber} generada. La mesa quedó libre.
                </p>
                <button
                  onClick={() => invoiceId && triggerPrint(invoiceId)}
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-medium text-black/70 hover:bg-black/5"
                >
                  <FiPrinter size={14} />
                  Imprimir de nuevo
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="mt-2 h-11 w-full rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)]"
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
              <p className="text-xs uppercase tracking-wide text-black/40">Total a cobrar</p>
              <p className="mt-1 text-2xl font-semibold">${total.toLocaleString('es-CO')}</p>
            </div>

            <p className="mb-2 text-xs uppercase tracking-wide text-black/40">Método de pago</p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleSelectMethod(m.value)}
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

            {method === 'transfer' && (
              <div className="mb-6">
                <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-black/40">
                  <FiSmartphone size={12} />
                  ¿Por cuál medio llegó?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TRANSFER_PROVIDERS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => {
                        setTransferProvider(p.value);
                        setError('');
                      }}
                      className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                        transferProvider === p.value
                          ? 'border-black bg-black text-white'
                          : 'border-black/10 hover:border-black/30'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                      isCashInsufficient ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <span>{isCashInsufficient ? 'Falta' : 'Cambio a devolver'}</span>
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

            <div className="mb-6 rounded-xl border border-black/10 p-4">
              <label className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={wantsIdentifiedInvoice}
                  onChange={(e) => {
                    setWantsIdentifiedInvoice(e.target.checked);
                    setError('');
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-black/20"
                />
                <span>
                  El cliente pidió la factura con sus datos
                  <span className="block text-xs font-normal text-black/40">
                    Si no lo marcas, se factura como consumidor final
                  </span>
                </span>
              </label>

              {wantsIdentifiedInvoice && (
                <div className="mt-3 space-y-2">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-3 text-sm outline-none focus:border-black/30"
                  >
                    {DOCUMENT_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="Número de identificación"
                    className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
                  />
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={docType === '31' ? 'Razón social' : 'Nombre completo'}
                    className="h-11 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading || isCashInsufficient || isTransferMissingProvider}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] text-sm font-medium text-[var(--brand-secondary)] disabled:opacity-60"
            >
              <FiCreditCard size={15} />
              {loading ? 'Procesando...' : 'Confirmar pago'}
            </button>
          </>
        )}

        {/* iframe invisible, solo usado para disparar la impresión del
            comprobante LOCAL — cuando hay factura DIAN, se usa el link
            público en su lugar (arriba), no este iframe. */}
        <iframe
          ref={printFrameRef}
          className="hidden"
          title="Impresión de factura"
          onLoad={() => {
            if (printFrameRef.current?.src) {
              printFrameRef.current.contentWindow?.print();
            }
          }}
        />
      </div>
    </div>
  );
}