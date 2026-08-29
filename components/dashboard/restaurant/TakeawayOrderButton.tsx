'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiShoppingBag } from 'react-icons/fi';

import { createOrderAction } from '@/lib/actions/order-actions';

export default function TakeawayOrderButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('businessId', businessId);
      formData.set('orderType', 'takeaway');
      // Sin tableId — createOrderAction ya soporta table_id null

      const order = await createOrderAction(formData);
      router.push(`/dashboard/orders/${order.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ocurrió un error.');
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-black/70 hover:bg-black/5 disabled:opacity-60"
    >
      <FiShoppingBag size={16} />
      {loading ? 'Creando...' : 'Pedido para llevar'}
    </button>
  );
}