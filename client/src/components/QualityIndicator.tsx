import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface QualityIndicatorProps {
  icon: ReactNode;
  label: string;
  status: string;
  variant: "good" | "warning" | "error";
}

export const QualityIndicator = ({ icon, label, status, variant }: QualityIndicatorProps) => {
  const variantBg: Record<string, string> = {
    good: "from-[rgba(52,199,89,0.12)] to-transparent text-[hsl(34,99%,55%)]",
    warning: "from-[rgba(255,255,255,0.12)] to-transparent text-[rgba(255,255,255,0.9)]",
    error: "from-[rgba(255,59,48,0.12)] to-transparent text-[hsl(0,100%,50%)]",
  };

  const variantBadge: Record<string, string> = {
    good: "bg-[rgba(52,199,89,0.15)] text-[hsl(34,99%,55%)] border-[rgba(52,199,89,0.3)]",
    warning: "bg-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.9)] border-[rgba(255,255,255,0.3)]",
    error: "bg-[rgba(255,59,48,0.15)] text-[hsl(0,100%,50%)] border-[rgba(255,59,48,0.3)]",
  };

  return (
    <div className={cn("flex items-center justify-between p-3 rounded-2xl border border-[rgba(var(--border)/0.5)] shadow-sm", variantBg[variant])}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[rgba(var(--muted)/0.06)] flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">{status}</div>
        </div>
      </div>

      <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border", variantBadge[variant])}>
        {status}
      </div>
    </div>
  );
};
