import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "destructive" | "info" | "muted";

const toneStyles: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: "bg-primary/10", fg: "text-primary" },
  success: { bg: "bg-success/15", fg: "text-success" },
  warning: { bg: "bg-warning/20", fg: "text-warning-foreground" },
  destructive: { bg: "bg-destructive/15", fg: "text-destructive" },
  info: { bg: "bg-info/15", fg: "text-info" },
  muted: { bg: "bg-muted", fg: "text-muted-foreground" },
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  onClick,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  onClick?: () => void;
}) {
  const t = toneStyles[tone];
  return (
    <Card
      onClick={onClick}
      className={cn(
        "border-border/70 shadow-[var(--shadow-card)] transition-all duration-200",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] hover:border-primary/20",
      )}
    >
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("rounded-xl p-3", t.bg)}>
          <Icon className={cn("h-5 w-5", t.fg)} />
        </div>
      </CardContent>
    </Card>
  );
}
