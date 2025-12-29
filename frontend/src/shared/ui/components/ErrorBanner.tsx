// src/shared/ui/components/ErrorBanner.tsx
import React from "react";
import { cn } from "@/app/DesignSystem";

export function ErrorBanner({ message, className }: { message: string; className?: string }) {
  if (!message) return null;
  return (
    <div className={cn("rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700", className)}>
      {message}
    </div>
  );
}