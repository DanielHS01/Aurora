import { redirect } from 'next/navigation';
import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getOrderById } from '@/lib/queries/orders';
import { getFullMenu } from '@/lib/queries/menu';
import OrderBuilder from '@/components/dashboard/restaurant/orders/OrderBuilder';

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const business = await getCurrentUserBusiness();
  if (!business) redirect('/login');

  const [order, menu] = await Promise.all([
    getOrderById(orderId),
    getFullMenu(business.id),
  ]);

  if (!order) redirect('/dashboard/tables');

  return (
    <OrderBuilder businessId={business.id} order={order} menu={menu} />
  );
}

export const dynamic = 'force-dynamic';