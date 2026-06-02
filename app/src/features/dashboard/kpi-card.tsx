import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Tone = "default" | "success" | "warning" | "destructive";

const toneClasses: Record<Tone, string> = {
  default: "bg-card",
  success: "bg-success/8 border-success/30",
  warning: "bg-warning/10 border-warning/30",
  destructive: "bg-destructive/8 border-destructive/30",
};

const iconClasses: Record<Tone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  destructive: "bg-destructive/15 text-destructive",
};

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <Card className={cn("p-4 flex flex-col gap-2 border-2", toneClasses[tone])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </p>
        <span
          className={cn(
            "size-8 grid place-items-center rounded-lg",
            iconClasses[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
