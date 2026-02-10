"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  date: string;
  costs: number;
  revenue: number;
}

interface RevenueChartProps {
  data: ChartData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Legend
          wrapperStyle={{
            paddingTop: "20px",
          }}
        />
        <Area
          type="monotone"
          dataKey="costs"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.3}
          name="Расходы (USD)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.3}
          name="Доходы (RUB)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
