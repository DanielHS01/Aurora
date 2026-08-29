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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/order-ready.mp3');
  }, []);

  function scheduleRefresh() {
    // Agrupa varios eventos que lleguen en una ráfaga corta (ej. una
    // sola acción del servidor tocando dos tablas) en un solo refresh.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.refresh();
    }, 400);
  }

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
          if (!isActive) return;

          const newRow = payload.new as { status: string; table_id: string | null };
          const oldRow = payload.old as { status: string };

          if (newRow.status === 'ready' && oldRow.status !== 'ready') {
            const table = tables.find((t) => t.id === newRow.table_id);
            const label = table ? `Mesa ${table.table_number}` : 'Un pedido';

            showToast(`🍽️ ${label} está listo para recoger`);
            audioRef.current?.play().catch(() => {});
          }

          scheduleRefresh();
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
          if (isActive) scheduleRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kitchen_tickets',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          if (isActive) scheduleRefresh();
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [businessId, router, showToast, tables]);

  return null;
}