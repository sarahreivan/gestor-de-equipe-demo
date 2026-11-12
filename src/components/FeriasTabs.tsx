import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/ferias", label: "Gestão de Férias" },
  { to: "/ferias/historico", label: "Histórico" },
  { to: "/ferias/calendario", label: "Calendário" },
] as const;

export function FeriasTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mb-4 border-b border-border">
      <nav className="flex gap-1" aria-label="Subseções de Férias">
        {TABS.map((t) => {
          const active =
            t.to === "/ferias"
              ? pathname === "/ferias" || pathname === "/ferias/"
              : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
