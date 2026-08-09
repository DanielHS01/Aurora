'use client'

import { useEffect, useRef, useState } from 'react';
import { FiX, FiPrinter } from 'react-icons/fi';

interface InvoicePreviewModalProps {
  invoiceId: string;
  invoiceNumber: string;
  onClose: () => void;
}

export default function InvoicePreviewModal({
  invoiceId,
  invoiceNumber,
  onClose,
}: InvoicePreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;

    fetch(`/api/invoices/${invoiceId}/pdf`)
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo generar la factura.');
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ocurrió un error.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [invoiceId]);

  function handlePrint() {
    iframeRef.current?.contentWindow?.print();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
          <h3 className="text-sm font-medium">Factura #{invoiceNumber}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={!blobUrl}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-medium text-[var(--brand-secondary)] disabled:opacity-50"
            >
              <FiPrinter size={13} />
              Imprimir
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="text-black/40 hover:text-black"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden rounded-b-2xl bg-black/5">
          {loading && (
            <div className="flex h-full items-center justify-center text-sm text-black/40">
              Generando factura...
            </div>
          )}
          {error && (
            <div className="flex h-full items-center justify-center text-sm text-red-600">
              {error}
            </div>
          )}
          {blobUrl && (
            <iframe
              ref={iframeRef}
              src={blobUrl}
              title={`Factura ${invoiceNumber}`}
              className="h-full w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}