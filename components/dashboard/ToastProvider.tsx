'use client'

import { createContext, useCallback, useContext, useState } from 'react';
import { FiCheckCircle, FiX } from 'react-icons/fi';

type Toast = {
  id: string;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  

  const showToast = useCallback((message: string) => {
  console.log('🍞 showToast ejecutado con:', message);
  const id = crypto.randomUUID();
  setToasts((prev) => {
    const updated = [...prev, { id, message }];
    console.log('🍞 Nuevo estado de toasts:', updated);
    return updated;
  });

  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, 6000);
}, [])

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-xl animate-in slide-in-from-bottom-2"
          >
            <FiCheckCircle className="shrink-0 text-emerald-600" size={20} />
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Cerrar"
              className="ml-2 text-black/30 hover:text-black"
            >
              <FiX size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}