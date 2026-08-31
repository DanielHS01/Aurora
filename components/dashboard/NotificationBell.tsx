'use client'

import { useState } from 'react';
import { FiBell, FiX } from 'react-icons/fi';

import { markNotificationRead } from '@/lib/actions/notificationActions';

type Notification = {
  id: string;
  title: string;
  message: string;
  created_at: string | null;
};

export default function NotificationBell({
  notifications: initialNotifications,
}: {
  notifications: Notification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);

  async function handleDismiss(id: string) {
    // Optimista: desaparece de la lista al instante.
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await markNotificationRead(id);
    } catch {
      // Si falla, no revertimos — peor caso es que reaparezca en la
      // próxima carga real de la página, sin bloquear al usuario ahora.
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-black/60 hover:bg-black/5"
      >
        <FiBell size={18} />
        {notifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}>
          <div
            className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-black/10 bg-white p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-black/40">
                No tienes notificaciones nuevas.
              </p>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="rounded-xl border border-black/10 p-3">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <button
                        onClick={() => handleDismiss(n.id)}
                        aria-label="Marcar como leída"
                        className="shrink-0 text-black/30 hover:text-black"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                    <p className="whitespace-pre-line text-xs text-black/50">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}