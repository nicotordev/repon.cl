"use client";

import { LucideIcon } from "lucide-react";

export interface StepConfig {
  id: number;
  label: string;
  icon: LucideIcon;
}

interface ProductFormStepIndicatorProps {
  steps: readonly StepConfig[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function ProductFormStepIndicator({
  steps,
  currentStep,
  onStepClick,
}: ProductFormStepIndicatorProps) {
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isActive = currentStep === s.id;
        const isPast = currentStep > s.id;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onStepClick(s.id)}
              className={`
                flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 transition-all
                ${isActive ? "border-primary bg-primary text-primary-foreground shadow-lg" : ""}
                ${isPast ? "border-primary/50 bg-primary/10 text-primary" : ""}
                ${!isActive && !isPast ? "border-muted bg-muted/30 text-muted-foreground" : ""}
              `}
            >
              <Icon className="size-5" />
            </button>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-4 rounded-full ${isPast ? "bg-primary/50" : "bg-muted"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
