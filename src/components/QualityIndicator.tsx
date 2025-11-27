import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface QualityIndicatorProps {
  icon: ReactNode;
  label: string;
  status: string;
  variant: "good" | "warning" | "error";
}

export const QualityIndicator = ({ icon, label, status, variant }: QualityIndicatorProps) => {
  const variantStyles = {
    good: "bg-status-good/10 text-status-good border-status-good/30",
    warning: "bg-status-warning/10 text-status-warning border-status-warning/30",
    error: "bg-status-error/10 text-status-error border-status-error/30",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">
          {icon}
        </div>
        <span className="text-sm font-medium text-foreground">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "px-3 py-1 rounded-md text-xs font-semibold border transition-all",
          variantStyles[variant]
        )}
      >
        {status}
      </div>
    </div>
  );
};
