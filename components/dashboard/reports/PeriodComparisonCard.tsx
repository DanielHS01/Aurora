import { FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';
import type { PeriodComparison } from '@/lib/queries/reports';

function ChangeIndicator({ percent }: { percent: number | null }) {
  if (percent === null) {
    return (
      <span className="flex items-center gap-1 text-black/40">
        <FiMinus size={12} /> Sin datos previos
      </span>
    );
  }

  const isPositive = percent >= 0;
  return (
    <span
      className={`flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
    >
      {isPositive ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
      {Math.abs(percent).toFixed(1)}%
    </span>
  );
}

export default function PeriodComparisonCard({
  title,
  data,
}: {
  title: string;
  data: PeriodComparison;
}) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-widest text-black/40">{title}</p>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold tracking-[-0.02em]">
            ${data.current.revenue.toLocaleString('es-CO')}
          </p>
          <p className="mt-1 text-xs text-black/40">
            vs. ${data.previous.revenue.toLocaleString('es-CO')} antes
          </p>
        </div>
        <div className="text-sm font-medium">
          <ChangeIndicator percent={data.revenueChangePercent} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-sm">
        <span className="text-black/50">
          {data.current.orderCount} pedidos
        </span>
        <ChangeIndicator percent={data.orderChangePercent} />
      </div>
    </div>
  );
}