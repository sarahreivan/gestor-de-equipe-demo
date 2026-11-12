import { cn } from "@/lib/utils";
import type {
  ColaboradorStatus,
  EstagioStatus,
  FeriasStatus,
  VinculoTipo,
} from "@/lib/mock-data";

// Todos os badges seguem o mesmo padrão visual (soft).
// Apenas as cores diferenciam o significado.
const tone: Record<string, string> = {
  // Colaborador
  Ativo: "bg-success/15 text-success border-success/40",
  "Férias": "bg-info/15 text-info border-info/40",
  Afastado: "bg-warning/20 text-warning-foreground border-warning/50",
  Desligado: "bg-destructive/15 text-destructive border-destructive/40",
  Licença: "bg-info/15 text-info border-info/40",
  // Estágio
  Vigente: "bg-success/15 text-success border-success/40",
  Vencendo: "bg-warning/20 text-warning-foreground border-warning/50",
  Vencido: "bg-destructive/15 text-destructive border-destructive/40",
  Renovado: "bg-info/15 text-info border-info/40",
  // Férias
  Planejada: "bg-info/15 text-info border-info/40",
  Confirmada: "bg-warning/20 text-warning-foreground border-warning/50",
  Realizada: "bg-success/15 text-success border-success/40",
  "Não realizada": "bg-destructive/15 text-destructive border-destructive/40",
  // Vínculos
  Estágio: "bg-info/15 text-info border-info/40",
  Efetivo: "bg-primary/15 text-primary border-primary/40",
  Comissionado: "bg-success/15 text-success border-success/40",
  Terceirizado: "bg-warning/20 text-warning-foreground border-warning/50",
  Seletivo: "bg-accent text-accent-foreground border-border",
  "Consultor(a)": "bg-secondary text-secondary-foreground border-border",
};

export function StatusBadge({
  value,
  className,
}: {
  value: ColaboradorStatus | EstagioStatus | FeriasStatus | VinculoTipo | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center justify-center rounded-full border px-2.5 text-xs font-medium leading-none whitespace-nowrap",
        tone[value] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {value}
    </span>
  );
}
