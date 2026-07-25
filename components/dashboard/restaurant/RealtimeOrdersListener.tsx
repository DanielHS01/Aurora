'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RealtimeOrdersListener({
  businessId,
}: {
  businessId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Escucha cualquier cambio en "orders" de este negocio (cocina
    // avanzando el ticket, el mesero completando el pedido, etc.) y
    // refresca los datos del servidor sin recargar la página entera.
    const channel = supabase
      .channel(`orders-changes-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, router]);

  return null;
}