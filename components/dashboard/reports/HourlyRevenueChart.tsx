// HourlyRevenueChart.tsx
'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { HourlyRevenue } from '@/lib/queries/reports';

export default function HourlyRevenueChart({ data }: { data: HourlyRevenue[] }) {
  const chartData = data.map((d) => ({
    label: `${d.hour}h`,
    revenue: d.revenue,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.4)' }}
            axisLine={false}
            tickLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.4)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value) => [
              `$${Number(value ?? 0).toLocaleString('es-CO')}`,
              'Ingresos',
            ]}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.1)',
              fontSize: 13,
            }}
          />
          <Bar dataKey="revenue" fill="var(--brand-primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}