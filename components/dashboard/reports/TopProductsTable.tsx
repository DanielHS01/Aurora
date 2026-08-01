import type { TopProduct } from '@/lib/queries/reports';

export default function TopProductsTable({ products }: { products: TopProduct[] }) {
  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-black/40">
        Sin datos de ventas todavía.
      </p>
    );
  }

  const maxQuantity = Math.max(...products.map((p) => p.quantitySold));

  return (
    <div className="space-y-3">
      {products.map((product, index) => (
        <div key={product.productName} className="flex items-center gap-3">
          <span className="w-5 text-sm font-medium text-black/30">
            {index + 1}
          </span>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{product.productName}</span>
              <span className="text-black/50">
                {product.quantitySold} vendidos · $
                {product.revenue.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.05]">
              <div
                className="h-full rounded-full bg-[var(--brand-primary)]"
                style={{
                  width: `${(product.quantitySold / maxQuantity) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}