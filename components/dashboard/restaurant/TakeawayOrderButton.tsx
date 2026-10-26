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

    const result = await createOrderAction(formData);
    if (!result.ok) {
      alert(result.error);
      setLoading(false);
      return;
    }

    router.push(`/dashboard/orders/${result.data.id}`);
  } catch {
    alert('No se pudo completar la acción. Recarga la página e inténtalo de nuevo.');
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