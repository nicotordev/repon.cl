"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/src/components/common/StatCard";
import { formatMoney } from "@/src/lib/money";
// import { fetchSalesToday, fetchTopProducts } from "@/src/lib/mockApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function ReportsPage() {
  const [sales, setSales] = useState<{
    totalCents: number;
    count: number;
  } | null>(null);
  const [top, setTop] = useState<{ name: string; quantity: number }[]>([]);

  useEffect(() => {
    // fetchSalesToday().then(setSales);
    // fetchTopProducts(5).then(setTop);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Ventas hoy"
          value={sales ? formatMoney(sales.totalCents) : "—"}
          sub={sales ? `${sales.count} tickets` : undefined}
        />
        <StatCard
          label="Ticket promedio"
          value={
            sales && sales.count > 0
              ? formatMoney(Math.round(sales.totalCents / sales.count))
              : "—"
          }
        />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-4 font-semibold">Top productos</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar
                dataKey="quantity"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
