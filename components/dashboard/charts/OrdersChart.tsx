"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function OrdersChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const chartData = data.map((d) => ({
    label: formatShortDate(d.date),
    count: d.count,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "rgba(0,0,0,0.4)" }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "rgba(0,0,0,0.4)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value) => [Number(value ?? 0), "Pedidos"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.1)",
              fontSize: 13,
            }}
          />
          <Bar
            dataKey="count"
            fill="var(--brand-primary)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
