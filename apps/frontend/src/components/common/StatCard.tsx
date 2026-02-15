"use client";

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {sub != null && (
        <p className="text-muted-foreground mt-1 text-xs">{sub}</p>
      )}
    </div>
  );
}
