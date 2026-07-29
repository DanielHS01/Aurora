import { getCurrentUserBusiness } from '@/lib/queries/businesses';
import { getInvoicesPaginated, type InvoiceSortOption } from '@/lib/queries/payments';
import InvoicesTable from '@/components/dashboard/invoices/InvoicesTable';
import type { OrderType } from '@/lib/types';

const PAGE_SIZE = 10;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const page = Math.max(Number(params.page) || 1, 1);
  const search = typeof params.search === 'string' ? params.search : '';
  const orderType =
    typeof params.type === 'string' ? (params.type as OrderType) : undefined;
  const sort = (
    typeof params.sort === 'string' ? params.sort : 'recent'
  ) as InvoiceSortOption;

  const business = await getCurrentUserBusiness();
  if (!business) return null;

  const { invoices, totalCount } = await getInvoicesPaginated(business.id, {
    page,
    pageSize: PAGE_SIZE,
    search,
    orderType,
    sort,
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Facturas</h1>
        <p className="mt-1 text-sm text-black/40">
          Historial completo de facturación del negocio.
        </p>
      </header>

      <InvoicesTable
        businessId={business.id}
        invoices={invoices}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        currentSearch={search}
        currentOrderType={orderType}
        currentSort={sort}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';