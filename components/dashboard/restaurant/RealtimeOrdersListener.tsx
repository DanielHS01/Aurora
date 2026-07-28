'use client'

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/dashboard/ToastProvider';

interface RealtimeOrdersListenerProps {
  businessId: string;
  tables?: { id: string; table_number: string }[];
}

export default function RealtimeOrdersListener({
  businessId,
  tables = [],
}: RealtimeOrdersListenerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/order-ready.mp3');
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let isActive = true;

    const channel = supabase
      .channel(`orders-changes-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          if (!isActive) return; // ignora eventos si este efecto ya se desmontó

          const newRow = payload.new as { status: string; table_id: string | null };
          const oldRow = payload.old as { status: string };

          // Solo notifica en la transición exacta hacia "ready" — no en
          // cada cambio de la tabla, para no saturar al mesero con
          // avisos de cosas que no le competen (ej. cancelaciones).
          if (newRow.status === 'ready' && oldRow.status !== 'ready') {
            const table = tables.find((t) => t.id === newRow.table_id);
            const label = table ? `Mesa ${table.table_number}` : 'Un pedido';

            showToast(`🍽️ ${label} está listo para recoger`);
            audioRef.current?.play().catch(() => {
              // Los navegadores bloquean el autoplay de audio hasta que
              // haya habido alguna interacción del usuario con la
              // página — si falla, no rompemos nada, solo se pierde el
              // sonido en ese caso puntual (el toast visual sigue
              // apareciendo igual).
            });
          }

          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          if (isActive) router.refresh();
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [businessId, router, showToast, tables]);

  return null;
}