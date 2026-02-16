import { Filter } from "lucide-react";
import { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      {/* Icono decorativo minimalista */}
      <div className="relative mb-2 flex size-20 items-center justify-center rounded-3xl bg-muted/50 ring-1 ring-border">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-primary/5" />
        <Filter className="size-8 text-muted-foreground/40" />
      </div>

      <div className="max-w-[280px] space-y-2">
        <h3 className="text-lg font-bold tracking-tight text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
